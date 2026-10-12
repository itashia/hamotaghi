<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::createUrlUsing(function (User $user, string $token): string {
            $url = rtrim((string) env('FRONTEND_URL', 'http://localhost:1420'), '/');

            return $url.'/?screen=reset-password&token='.urlencode($token).'&email='.urlencode((string) $user->email);
        });
    }
}
