<?php

declare(strict_types=1);

test('Orbit uses the authoritative monochrome palette and textures', function () {
    $themeCss = file_get_contents(resource_path('css/theme.css'));

    expect($themeCss)
        ->not()->toBeFalse()
        ->toContain('--space-0: #050506;')
        ->toContain('--surface-card: var(--space-2);')
        ->toContain('--bone-3: #f4f2ec;')
        ->toContain('--texture-starfield:')
        ->toContain('--texture-grid:')
        ->toContain('--texture-scanline:')
        ->toContain('--horizon-glow:');
});

test('Orbit uses near-square surfaces and pill buttons', function () {
    $themeCss = file_get_contents(resource_path('css/theme.css'));

    expect($themeCss)
        ->not()->toBeFalse()
        ->toMatch('/\.orbit-card\s*\{[\s\S]*border-radius:\s*6px;/')
        ->toMatch('/\.orbit-button\s*\{[\s\S]*border-radius:\s*999px;/');
});

test('reduced motion styles disable animations and transitions', function () {
    $themeCss = file_get_contents(resource_path('css/theme.css'));

    expect($themeCss)
        ->not()->toBeFalse()
        ->toMatch('/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*--dur-orbit:\s*0s;/')
        ->toMatch('/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*animation-duration:\s*0\.01ms\s*!important;/')
        ->toMatch('/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*scroll-behavior:\s*auto\s*!important;/');
});

test('noscrollbar utility disables scrollbars across browser engines', function () {
    $themeCss = file_get_contents(resource_path('css/theme.css'));

    expect($themeCss)
        ->not()->toBeFalse()
        ->toMatch('/\.noscrollbar::-webkit-scrollbar\s*\{[\s\S]*display:\s*none;/')
        ->toMatch('/\.noscrollbar\s*\{[\s\S]*scrollbar-width:\s*none;/');
});
