<?php

declare(strict_types=1);

describe('Orbit appearance', function (): void {
    it('uses the fixed monochrome dark canvas', function (): void {
        $this->get('/')
            ->assertSuccessful()
            ->assertSee('<html lang="en" class="dark">', escape: false)
            ->assertDontSee('prefers-color-scheme', escape: false);
    });

    it('preloads the two Orbit typefaces', function (): void {
        $blade = file_get_contents(resource_path('views/app.blade.php'));

        expect($blade)
            ->not()->toBeFalse()
            ->toContain('space-grotesk-variable-latin')
            ->toContain('jetbrains-mono-variable')
            ->not()->toContain('instrument-sans-variable');
    });
});
