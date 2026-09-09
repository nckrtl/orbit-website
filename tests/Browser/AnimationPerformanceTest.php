<?php

it('shares one frame callback and never samples route geometry during playback', function () {
    $page = visit('/')->resize(1440, 1000);
    $page->script('document.querySelector("[data-capability=doctor]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertAttribute('[data-doctor-signal]', 'visibility', 'visible');
    $page->assertScript('async () => {
        const original = window.requestAnimationFrame;
        const point = SVGGeometryElement.prototype.getPointAtLength;
        let frames = 0, samples = 0, browserFrames = 0;
        window.requestAnimationFrame = callback => original.call(window, time => { frames++; callback(time); });
        SVGGeometryElement.prototype.getPointAtLength = function(...args) { samples++; return point.apply(this, args); };
        let counting = true;
        const count = () => { browserFrames++; if(counting) original.call(window, count); };
        original.call(window, count);
        try {
            const signal = document.querySelector("[data-doctor-signal]");
            const before = getComputedStyle(signal).strokeDashoffset;
            await new Promise(resolve => setTimeout(resolve, 450));
            return before !== getComputedStyle(signal).strokeDashoffset
                && samples === 0 && browserFrames > 0 && frames <= browserFrames + 2;
        } finally {
            counting = false;
            window.requestAnimationFrame = original;
            SVGGeometryElement.prototype.getPointAtLength = point;
        }
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('pauses each development illustration while the rest of its section remains visible', function (int $width) {
    $page = visit('/')->resize($width, 700);
    $page->script('document.querySelector(".orbit-environments__marquee").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertAttribute('.orbit-environments__marquee', 'data-motion-active', 'true');
    $page->script('document.querySelector(".orbit-environments__benefits").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertAttribute('#build', 'data-active', 'true')
        ->assertAttribute('.orbit-environments__marquee', 'data-motion-active', 'false')
        ->assertAttribute('.orbit-environments__figure', 'data-motion-active', 'false')
        ->assertScript('() => [...document.querySelectorAll(".orbit-environments__track, .orbit-stack__signals path, .orbit-stack__statistics-track, .orbit-stack__resource")].every(el => getComputedStyle(el).animationPlayState === "paused")', true);
    $page->script('document.querySelector(".orbit-environments__figure").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertAttribute('.orbit-environments__figure', 'data-motion-active', 'true')
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 1440, 'phone' => 390]);

it('has no continuous animation callbacks with reduced motion throughout the page', function () {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize(1440, 900);
    foreach (['[data-hero-scene]', '[data-capability=doctor]', '.orbit-environments__figure', '#install'] as $selector) {
        $page->script('document.querySelector("'.$selector.'").scrollIntoView({block:"center",behavior:"instant"})');
        $page->assertScript('async () => {
            await document.fonts.ready;
            await new Promise(resolve => setTimeout(resolve, 150));
            const original = window.requestAnimationFrame;
            let frames = 0;
            window.requestAnimationFrame = callback => original.call(window, time => { frames++; callback(time); });
            try {
                await new Promise(resolve => setTimeout(resolve, 250));
                return frames === 0
                    && [...document.querySelectorAll("[data-motion-scene]")].every(el => el.dataset.motionActive === "false")
                    && [...document.querySelectorAll("[data-network-signal], [data-doctor-signal]")].every(el => el.getAnimations().length === 0);
            } finally { window.requestAnimationFrame = original; }
        }', true);
    }
    $page->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('stops shared scenes in a hidden document and resumes without an animation jump', function () {
    $page = visit('/')->resize(1440, 1000);
    $page->script('document.querySelector("[data-capability=doctor]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertAttribute('[data-doctor-signal]', 'visibility', 'visible');
    $page->assertScript('async () => {
        const scene = document.querySelector("[data-capability=doctor]");
        const globe = scene.querySelector("[data-planet-latitudes]");
        const signal = scene.querySelector("[data-doctor-signal]");
        const animation = signal.getAnimations()[0];
        // Exercise the same Page Visibility event used by background tabs.
        Object.defineProperty(document, "hidden", { configurable: true, value: true });
        document.dispatchEvent(new Event("visibilitychange"));
        try {
            await new Promise(requestAnimationFrame);
            const time = animation.currentTime;
            const path = globe.getAttribute("d");
            await new Promise(resolve => setTimeout(resolve, 250));
            if (globe.getAttribute("d") !== path || animation.currentTime !== time
                || animation.playState !== "paused" || signal.getAttribute("visibility") !== "hidden") return false;
        } finally {
            delete document.hidden;
            document.dispatchEvent(new Event("visibilitychange"));
        }
        const before = animation.currentTime;
        await new Promise(resolve => setTimeout(resolve, 150));
        return signal.getAttribute("visibility") === "visible" && globe.dataset.latitudesAnimating === "true"
            && animation.playState === "running" && animation.currentTime > before && animation.currentTime - before < 240;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('pauses laptop process animations before the laptop enters the viewport', function () {
    $page = visit('/')->resize(1440, 900);
    $page->assertAttribute('[data-laptop]', 'data-motion-active', 'false')
        ->assertScript('() => [...document.querySelectorAll("[data-laptop] .orbit-laptop__signals path, [data-laptop] .orbit-laptop__queue-indicator rect")].every(el => getComputedStyle(el).animationPlayState === "paused")', true);
    $page->script('document.querySelector("[data-laptop]").scrollIntoView({block:"start",behavior:"instant"})');
    $page->assertAttribute('[data-laptop]', 'data-motion-active', 'true');
    $page->script('scrollTo({top:0,behavior:"instant"})');
    $page->assertAttribute('[data-laptop]', 'data-motion-active', 'false')
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('keeps decorative star elements within a fixed budget while retaining the star texture', function (int $width) {
    $page = visit('/')->resize($width, 900);
    $page->assertScript('() => {
        const field = document.querySelector("[data-page-stars]");
        const stars = field.querySelectorAll(".orbit-star");
        return stars.length > 0 && stars.length <= 216
            && getComputedStyle(field.querySelector(".orbit-starfield__stars")).backgroundImage !== "none";
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 1440, 'phone' => 390]);
