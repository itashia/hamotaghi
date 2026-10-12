<?php

use Dedoc\Scramble\Http\Middleware\RestrictedDocsAccess;

it('serves the generated OpenAPI document for the versioned API', function (): void {
    $response = $this->withoutMiddleware(RestrictedDocsAccess::class)->getJson('/docs/api.json');

    $response->assertOk()
        ->assertJsonPath('openapi', '3.1.0')
        ->assertJsonPath('info.title', 'Hamotaghi API documentation')
        ->assertJsonPath('info.version', '1.0.0')
        ->assertJsonStructure([
            'paths' => [
                '/auth/register',
                '/rooms/current',
                '/rooms/{room}/workspace',
            ],
            'components' => ['securitySchemes'],
        ]);

    expect($response->json('paths'))->toHaveCount(18);
});
