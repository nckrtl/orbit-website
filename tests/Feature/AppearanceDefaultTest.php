<?php

declare(strict_types=1);

describe('Orbit appearance', function (): void {
    it('renders a validated appearance before JavaScript loads', function (?string $cookie, string $appearance, string $class, string $color): void {
        if ($cookie !== null) {
            $this->withUnencryptedCookie('appearance', $cookie);
        }

        $this->get('/')
            ->assertSuccessful()
            ->assertSee('<html lang="en" class="'.$class.'" data-appearance="'.$appearance.'">', escape: false)
            ->assertSee('<meta name="theme-color" content="'.$color.'"', escape: false);
    })->with([
        'first visit' => [null, 'dark', 'dark', '#050506'],
        'invalid preference' => ['sepia', 'dark', 'dark', '#050506'],
        'light preference' => ['light', 'light', '', '#f6f5f1'],
        'dark preference' => ['dark', 'dark', 'dark', '#050506'],
        'system fallback' => ['system', 'system', 'dark', '#050506'],
    ]);

    it('authorizes the prepaint theme script with the response CSP nonce', function (): void {
        config(['csp.enabled' => true, 'csp.nonce_enabled' => true]);
        $response = $this->get('/')->assertSuccessful();
        $html = $response->getContent();
        expect($html)->toBeString();
        preg_match('/<script nonce="([^"]+)">/', $html, $matches);

        expect($matches[1])->not->toBeEmpty();
        expect($response->headers->get('Content-Security-Policy'))
            ->toContain("'nonce-".$matches[1]."'");
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
