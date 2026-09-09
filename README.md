# Orbit website

The marketing website for [Orbit](https://github.com/nckrtl/orbit), an AI-first CLI for running applications on infrastructure you own.

This repository is `nckrtl/orbit-website`. It uses Laravel, React, Inertia, Tailwind CSS, and the Launch Laravel foundation.

## Development

```bash
composer install
bun install
bun run build
composer test
```

The Sabre development instance is managed by Orbit at `https://orbit-website.test`. Use that URL instead of starting a second PHP server.

## Animation performance

Keep recurring motion in `resources/js/components/orbit/animation.ts`: `animateScene`
shares a frame callback, caps procedural SVG updates, and stops offscreen, in hidden
pages, or with reduced motion. Use `observeSceneActivity` for CSS animations, Web
Animations, and timers, and return its cleanup from the component effect. Observe
individual illustrations rather than an entire long section.

Prefer browser-managed transforms and opacity. For signals on fixed SVG routes,
`animateRouteSignal` moves a dash along the existing path without sampling geometry
on every frame. Stroke animation still requires painting; it is not automatically
GPU accelerated. Keep expensive layout/geometry reads in setup or resize handlers,
and update slow details (such as globe latitudes) less often than moving objects.
React owns the scene structure; frame callbacks only update transient attributes.

Keep SSR and the first client render identical. Do not add blanket `will-change`
layers or `content-visibility` to measured scroll scenes without checking memory
and geometry. Run `composer check` and `vp exec tsc --noEmit`; the browser performance
regressions live in `tests/Browser/AnimationPerformanceTest.php`. Also inspect real
browser scrolling, console errors, and live reduced-motion changes at desktop,
tablet, and phone widths.
