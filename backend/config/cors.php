<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_values(array_filter(explode(',', env('FRONTEND_ORIGINS', 'http://localhost:1420,http://localhost:5173,http://tauri.localhost,https://tauri.localhost,tauri://localhost')))),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
