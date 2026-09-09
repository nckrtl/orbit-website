<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

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
