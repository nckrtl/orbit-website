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

it('pauses transparent build scenes during their reveal and resumes on forward and reverse scroll', function (int $width) {
    $page = visit('/')->resize($width, 900);
    $page->assertScript('async () => {
        await document.fonts.ready;
        const settle = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        await settle();
        for (const selector of [".orbit-environments__marquee", ".orbit-environments__figure"]) {
            const scene = document.querySelector(selector);
            const start = Number(scene.dataset.buildRevealStart), end = Number(scene.dataset.buildRevealEnd);
            for (const progress of [0, .5, 1, 0, .5]) {
                scrollTo({top: start + (end - start) * progress + (progress === 0 ? -2 : progress === 1 ? 2 : 0), behavior: "instant"});
                await settle();
                const bounds = scene.getBoundingClientRect(), style = getComputedStyle(scene);
                if (bounds.bottom <= 0 || bounds.top >= innerHeight || style.filter !== "none") return false;
                if (Math.abs(Number(style.opacity) - progress) > .02) return false;
                if (scene.dataset.motionActive !== String(progress > 0)) return false;
                const animations = scene.getAnimations({subtree: true});
                if (!animations.length) return false;
                if (progress === 0) {
                    const times = animations.map(animation => animation.currentTime);
                    await new Promise(resolve => setTimeout(resolve, 120));
                    if (animations.some((animation, index) => animation.playState !== "paused" || animation.currentTime !== times[index])) return false;
                } else if (!animations.some(animation => animation.playState === "running")) return false;
            }
        }
        return document.documentElement.scrollWidth <= innerWidth;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 1440, 'tablet' => 934, 'phone' => 390]);

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

it('uses one star texture without individual star elements', function (int $width) {
    $page = visit('/')->resize($width, 900);
    $page->assertScript('document.querySelectorAll("[data-page-stars] .orbit-starfield__stars").length', 1)
        ->assertNotPresent('.orbit-star')
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 1440, 'phone' => 390]);

it('keeps moving objects at a steady sixty updates per second across display refresh rates', function (int $width) {
    $page = visit('/')->resize($width, 900);
    $page->assertAttribute('[data-hero-constellation]', 'data-animating', 'true');
    $page->assertScript('async () => {
        const request = window.requestAnimationFrame;
        const cancel = window.cancelAnimationFrame;
        const pending = new Map();
        let id = 1000000;
        window.requestAnimationFrame = callback => { pending.set(++id, callback); return id; };
        window.cancelAnimationFrame = token => { if (!pending.delete(token)) cancel(token); };
        try {
            // Let the already scheduled scene callback enter the controlled clock.
            await new Promise(resolve => request(() => request(resolve)));
            const planet = document.querySelectorAll("[data-hero-body]")[1];
            if (!planet || !pending.size) return false;
            let now = performance.now();
            for (const hz of [60, 120, 144]) {
                let changes = 0;
                let previous = planet.getAttribute("transform");
                for (let frame = 0; frame < hz; frame++) {
                    now += 1000 / hz;
                    const callbacks = [...pending.values()];
                    pending.clear();
                    callbacks.forEach(callback => callback(now));
                    const current = planet.getAttribute("transform");
                    if (current !== previous) changes++;
                    previous = current;
                }
                if (changes < 58 || changes > 62) return false;
            }
            return true;
        } finally {
            window.requestAnimationFrame = request;
            window.cancelAnimationFrame = cancel;
            pending.forEach(callback => request(callback));
        }
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 1440, 'phone' => 390]);

it('moves story connections without sampling geometry on rendered paths', function (int $width) {
    $page = visit('/')->resize($width, 900);
    $page->assertScript('async () => {
        const route = document.querySelector("[data-handoff-route]");
        if (!route?.dataset.scrollEnd) return false;
        const start = Number(route.dataset.scrollStart);
        const end = Number(route.dataset.scrollEnd);
        const originalLength = SVGGeometryElement.prototype.getTotalLength;
        const originalPoint = SVGGeometryElement.prototype.getPointAtLength;
        let connectedReads = 0;
        const counted = original => function (...args) {
            if (this.isConnected && this.matches("[data-route-path]")) connectedReads++;
            return original.apply(this, args);
        };
        SVGGeometryElement.prototype.getTotalLength = counted(originalLength);
        SVGGeometryElement.prototype.getPointAtLength = counted(originalPoint);
        const positions = [];
        try {
            for (const progress of [.2, .5, .8, .5]) {
                scrollTo({ top: start + (end - start) * progress, behavior: "instant" });
                await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                const pulse = route.querySelector("[data-route-pulse]");
                const path = route.querySelector("[data-route-path]");
                const point = originalPoint.call(path, originalLength.call(path) * Number(route.dataset.progress));
                const x = Number(pulse.getAttribute("cx")), y = Number(pulse.getAttribute("cy"));
                if (Math.hypot(x - point.x, y - point.y) > 3) return false;
                positions.push(`${x},${y}`);
            }
            return connectedReads === 0 && new Set(positions).size >= 3;
        } finally {
            SVGGeometryElement.prototype.getTotalLength = originalLength;
            SVGGeometryElement.prototype.getPointAtLength = originalPoint;
        }
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 1440, 'phone' => 390]);

it('keeps star parallax bounded without fading or idle style writes', function (int $width, bool $reduced) {
    $page = visit('/', ['reducedMotion' => $reduced ? 'reduce' : 'no-preference'])->resize($width, 900);
    $page->assertScript('async () => {
        await document.fonts.ready;
        const field = document.querySelector("[data-page-stars]");
        const plane = field.firstElementChild;
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        for (const top of [300, 600, 10239, 10241, 8000, 600, 0]) {
            scrollTo({top,behavior:"instant"});
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            const offset = new DOMMatrix(getComputedStyle(plane).transform).m42;
            const expected = reduced ? 0 : -(scrollY * .1 % 1024);
            const bounds = plane.getBoundingClientRect();
            const pinned = document.querySelector("[data-hero-content]").hasAttribute("data-scroll-pinned");
            if (((reduced || !pinned) && Math.abs(offset - expected) > .01) || bounds.top > 0 || bounds.bottom < innerHeight
                || bounds.height > innerHeight + 1025 || field.getAnimations({subtree:true}).length !== 0) return false;
        }
        const opacity = getComputedStyle(plane).opacity;
        let changes = 0;
        const observer = new MutationObserver(records => { changes += records.length; });
        observer.observe(field, {attributes:true, subtree:true});
        await new Promise(resolve => setTimeout(resolve, 300));
        observer.disconnect();
        return changes === 0 && getComputedStyle(plane).opacity === opacity
            && ["::before", "::after"].every(pseudo => getComputedStyle(plane, pseudo).content === "none")
            && field.getAnimations({subtree:true}).length === 0;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with([
    'desktop' => [1440, false],
    'desktop reduced motion' => [1440, true],
    'phone' => [390, false],
    'phone reduced motion' => [390, true],
]);

it('retains the intro star speed relative to scrolling story content', function (int $height) {
    $page = visit('/')->resize(1767, $height);
    $page->assertAttribute('[data-hero-content]', 'data-scroll-pinned', '')
        ->assertScript('async () => {
            const hero = document.querySelector("[data-hero-content]");
            const plane = document.querySelector("[data-page-stars]").firstElementChild;
            const settle = async top => {
                scrollTo({top, behavior:"instant"});
                await new Promise(resolve => setTimeout(resolve, 300));
            };
            const offset = () => new DOMMatrix(getComputedStyle(plane).transform).m42;
            const travel = (before, after) => (before - after + 1024) % 1024;
            await settle(0);
            const intro = offset();
            const step = Math.floor(Number(hero.dataset.exitStart) / 2);
            await settle(step);
            if (Math.abs(travel(intro, offset()) / scrollY - .1) > .01) return false;
            for (const selector of ["[data-chapter=problem] h2", "[data-chapter=premise] h2", "#build h2"]) {
                const copy = document.querySelector(selector);
                await settle(copy.getBoundingClientRect().top + scrollY - 200);
                const before = {star: offset(), copy: copy.getBoundingClientRect().top, scroll: scrollY};
                await settle(scrollY + 200);
                const relative = travel(before.star, offset()) - (before.copy - copy.getBoundingClientRect().top);
                if (Math.abs(relative / (scrollY - before.scroll) - .1) > .02) return false;
            }
            return true;
        }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 900, 'tall desktop' => 1536]);

it('pauses a fully faded hero while its bounds still intersect the viewport and resumes on return', function (int $width) {
    $page = visit('/')->resize($width, 900);
    $page->assertAttribute('[data-hero-constellation]', 'data-animating', 'true');
    $page->assertScript('async () => {
        const network = document.querySelector("[data-hero-network]");
        const svg = network.querySelector("[data-hero-constellation]");
        const planet = svg.querySelectorAll("[data-hero-body]")[1];
        let found = false;
        for (let top = 100; top < 1800; top += 60) {
            scrollTo({top, behavior: "instant"});
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            const box = network.getBoundingClientRect();
            if (getComputedStyle(network).opacity === "0" && box.bottom > 0 && box.top < innerHeight) {
                found = true;
                break;
            }
        }
        if (!found || svg.dataset.animating !== "false") return false;
        const position = planet.getAttribute("transform");
        await new Promise(resolve => setTimeout(resolve, 180));
        return planet.getAttribute("transform") === position;
    }', true);
    $page->script('scrollTo({top:0,behavior:"instant"})');
    $page->assertAttribute('[data-hero-constellation]', 'data-animating', 'true')
        ->assertScript('async () => {
            const planet = document.querySelectorAll("[data-hero-body]")[1];
            const position = planet.getAttribute("transform");
            await new Promise(resolve => setTimeout(resolve, 250));
            return planet.getAttribute("transform") !== position;
        }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 1440, 'phone' => 390]);

it('keeps scrolling responsive by deferring ambient motion only during sustained slow frames', function () {
    $page = visit('/')->resize(1440, 900);
    $page->script('document.querySelector("[data-story-topology]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertAttribute('[data-story-topology]', 'data-animating', 'true');
    $page->assertScript('async () => {
        const request = window.requestAnimationFrame, cancel = window.cancelAnimationFrame;
        const originalNow = performance.now;
        const scrollDescriptor = Object.getOwnPropertyDescriptor(window, "scrollY");
        let scrollPosition = window.scrollY, scrollReads = 0;
        const pending = new Map();
        let id = 1000000, now = originalNow.call(performance);
        window.requestAnimationFrame = callback => { pending.set(++id, callback); return id; };
        window.cancelAnimationFrame = token => { if (!pending.delete(token)) cancel(token); };
        Object.defineProperty(performance, "now", {configurable:true, value:() => now});
        Object.defineProperty(window, "scrollY", {configurable:true, get:() => { scrollReads++; return scrollPosition; }});
        try {
            await new Promise(resolve => request(() => request(resolve)));
            const node = document.querySelector("[data-story-node=dev-01]");
            const step = (interval, scrolling) => {
                now += interval;
                if (scrolling) {
                    scrollPosition += 6;
                    window.dispatchEvent(new Event("scroll"));
                }
                const callbacks = [...pending.values()];
                pending.clear();
                callbacks.forEach(callback => callback(now));
                return node.getAttribute("transform");
            };
            let position = node.getAttribute("transform");
            for (let index = 0; index < 8; index++) {
                const next = step(1000 / 60, true);
                if (next === position) return false;
                position = next;
            }
            // One missed frame should not disable motion.
            if (step(1000 / 30, true) === position) return false;
            for (let index = 0; index < 6; index++) step(1000 / 30, true);
            position = node.getAttribute("transform");
            if (step(1000 / 30, true) !== position) return false;
            // Scroll callbacks still run while the ambient clock is frozen.
            const ruler = document.querySelector(".orbit-story-ruler__marks");
            ruler.style.backgroundPositionX = "12345px";
            scrollReads = 0;
            step(1000 / 30, true);
            if (ruler.style.backgroundPositionX === "12345px" || scrollReads > 2) return false;
            // Resuming does not jump ahead by the time spent scrolling.
            if (step(220, false) !== position) return false;
            return step(1000 / 60, true) !== position;
        } finally {
            window.requestAnimationFrame = request;
            window.cancelAnimationFrame = cancel;
            delete performance.now;
            Object.defineProperty(window, "scrollY", scrollDescriptor);
            pending.forEach(callback => request(callback));
        }
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});
