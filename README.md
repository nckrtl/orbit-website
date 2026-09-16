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

Moving objects target 60fps at every viewport size; keep the scheduler's remainder
so high-refresh displays do not round that down to 48fps. Register wrapper-only
scroll properties with `inherits: false`, read scroll position before DOM writes,
and sample the story connections on detached SVG paths to avoid layout flushes.
Use `observeScroll` with `requestScrollFrame` / `cancelScrollFrame` for scroll
controllers: they share one passive position read and paint alongside procedural
scenes. Keep scroll-linked reveals separate from decorative scene playback.
After three consecutive slow frames during scrolling, optional procedural motion
holds its pose until scrolling settles for 180ms; its clock then resumes without
catching up. Normal scrolling and idle motion retain their usual cadence. Report
explicit fade visibility with `setSceneHidden` when a transparent scene still
intersects the viewport, and skip style writes once scroll effects have settled.
The page star background uses one fixed repeating texture, bounded to the viewport
plus one 1024px tile. Its 2048 × 1024 texture contains 120 irregularly placed stars
with varied sizes and brightness, shared between the light and dark themes.
The pinned desktop intro uses 10% scroll speed. As it exits, smoothly add the
content’s 100% document travel: the story uses 110% absolute speed to retain 10%
relative movement. Unpinned layouts keep 10%; reduced motion stays still.
Keep its brightness constant: no fading overlays or opacity animations,
which caused flickering. Scroll updates stop when idle or the tab is hidden.
Use fades without animated blur for the build section and the multi-screen
capabilities grid above it. Reveal the environment logo strip as one group; keep
its scrolling transform on the child track. Fully transparent build scenes must
stop their local animations even when their bounds intersect the viewport.
Keep the header and hero intro's animated blur at `blur(0px)` when sharp; changing
the filter function to `none` during playback can crash WebKit in light mode.

Keep SSR and the first client render identical. Do not add blanket `will-change`
layers or `content-visibility` to measured scroll scenes without checking memory
and geometry. Run `composer check` and `vp exec tsc --noEmit`; the browser performance
regressions live in `tests/Browser/AnimationPerformanceTest.php`. Also inspect real
browser scrolling, console errors, and live reduced-motion changes at desktop,
tablet, and phone widths.
