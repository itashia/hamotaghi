<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'dormitory.name' => ['required', 'string', 'min:2', 'max:120'],
            'dormitory.university' => ['required', 'string', 'min:2', 'max:160'],
            'dormitory.description' => ['nullable', 'string', 'max:2000'],
            'name' => ['required', 'string', 'max:80'],
            'capacity' => ['required', 'integer', 'between:2,20'],
            'description' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
