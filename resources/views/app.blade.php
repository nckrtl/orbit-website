<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="{{ $appearance === 'light' ? '' : 'dark' }}" data-appearance="{{ $appearance }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="{{ $appearance === 'light' ? '#f6f5f1' : '#050506' }}" data-light="#f6f5f1" data-dark="#050506">
        <script nonce="{{ Vite::cspNonce() }}">
            (() => {
                const root = document.documentElement;
                let appearance = root.dataset.appearance;
                try {
                    const stored = localStorage.getItem('appearance');
                    if (['light', 'dark', 'system'].includes(stored)) appearance = stored;
                } catch {}
                const dark = appearance === 'dark' || (appearance === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
                root.classList.toggle('dark', dark);
                root.dataset.appearance = appearance;
                root.style.colorScheme = dark ? 'dark' : 'light';
                const meta = document.querySelector('meta[name="theme-color"]');
                meta.content = meta.dataset[dark ? 'dark' : 'light'];
            })();
        </script>

        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="alternate" type="text/markdown" href="{{ action([\App\Http\Controllers\AgentDocsController::class, 'gettingStarted'], absolute: false) }}" title="Get started with Orbit">
        <link rel="preload" href="{{ Vite::asset('resources/fonts/space-grotesk-variable-latin.woff2') }}" as="font" type="font/woff2" crossorigin>
        <link rel="preload" href="{{ Vite::asset('resources/fonts/jetbrains-mono-variable.woff2') }}" as="font" type="font/woff2" crossorigin>
        @viteReactRefresh
        @vite(['resources/js/app.tsx'])
        <x-inertia::head>
            <title>{{ config('app.name', 'Orbit') }}</title>
        </x-inertia::head>
    </head>
    <body>
        <x-inertia::app />
    </body>
</html>
