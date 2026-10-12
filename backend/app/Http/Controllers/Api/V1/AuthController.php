<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\TransientToken;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $request->merge(['phone' => $this->latinDigits($request->input('phone'))]);
        $data = $request->validate([
            'name' => ['required', 'string', 'min:3', 'max:120'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email', 'required_without:phone'],
            'phone' => ['nullable', 'string', 'regex:/^09\d{9}$/', 'unique:users,phone', 'required_without:email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)->mixedCase()->numbers()],
        ]);

        $user = User::create($data);
        $this->authenticateRequest($request, $user);

        return response()->json($this->payload($request, $user, true), 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->merge(['identifier' => $this->latinDigits($request->input('identifier', ''))]);
        $data = $request->validate([
            'identifier' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string'],
        ]);
        $field = filter_var($data['identifier'], FILTER_VALIDATE_EMAIL) ? 'email' : 'phone';

        $user = User::query()->where($field, $data['identifier'])->first();
        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'اطلاعات ورود درست نیست.', 'errors' => ['identifier' => ['اطلاعات ورود درست نیست.']]], 422);
        }
        $this->authenticateRequest($request, $user, $request->boolean('remember'));

        return response()->json($this->payload($request, $request->user(), true));
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($this->payload($request, $request->user()));
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()->currentAccessToken();
        if ($token && ! ($token instanceof TransientToken)) {
            $token->delete();
            Auth::forgetGuards();
        } else {
            Auth::guard('web')->logout();
            Auth::forgetGuards();
            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }
        }

        return response()->json(['message' => 'با موفقیت خارج شدید.']);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $request->merge(['phone' => $this->latinDigits($request->input('phone'))]);
        $data = $request->validate([
            'name' => ['required', 'string', 'min:3', 'max:120'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email,'.$user->id, 'required_without:phone'],
            'phone' => ['nullable', 'string', 'regex:/^09\d{9}$/', 'unique:users,phone,'.$user->id, 'required_without:email'],
        ]);
        $user->fill($data)->save();

        return response()->json($this->payload($request, $user));
    }

    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)->mixedCase()->numbers()],
        ]);
        if (! Hash::check($data['current_password'], $request->user()->password)) {
            throw ValidationException::withMessages(['current_password' => ['رمز عبور فعلی درست نیست.']]);
        }
        $request->user()->forceFill(['password' => $data['password']])->save();
        $request->user()->tokens()->delete();

        return response()->json($this->payload($request, $request->user(), true) + ['message' => 'رمز عبور به‌روزرسانی شد.']);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email']]);
        Password::sendResetLink($data);

        return response()->json(['message' => 'اگر حسابی با این ایمیل ثبت شده باشد، لینک بازیابی برایتان ارسال می‌شود.']);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required'], 'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)->mixedCase()->numbers()],
        ]);
        $status = Password::reset($data, function (User $user, string $password): void {
            $user->forceFill(['password' => $password, 'remember_token' => Str::random(60)])->save();
            $user->tokens()->delete();
            event(new PasswordReset($user));
        });

        return $status === Password::PASSWORD_RESET
            ? response()->json(['message' => 'رمز عبور با موفقیت تغییر کرد.'])
            : response()->json(['message' => 'لینک بازیابی معتبر نیست یا منقضی شده است.'], 422);
    }

    private function payload(Request $request, User $user, bool $issueToken = false): array
    {
        $token = $issueToken && $request->header('X-Tauri-App') ? $user->createToken('tauri-desktop')->plainTextToken : null;

        return [
            'user' => ['id' => (string) $user->id, 'fullName' => $user->name, 'identifier' => $user->email ?? $user->phone],
            'token' => $token,
        ];
    }

    private function authenticateRequest(Request $request, User $user, bool $remember = false): void
    {
        if ($request->header('X-Tauri-App')) {
            return;
        }

        Auth::login($user, $remember);
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }
    }

    private function latinDigits(?string $value): ?string
    {
        return $value === null ? null : strtr($value, ['۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4', '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9']);
    }
}
