<?php

it('hands the visitor from the foundation to a ready-to-use agent prompt', function (int $width, bool $reduced) {
    $page = visit('/', ['reducedMotion' => $reduced ? 'reduce' : 'no-preference'])->resize($width, 1000);
    if ($width <= 1100) {
        $page->click('[aria-label="Open navigation menu"]')
            ->click('[aria-label="Mobile navigation"] a[href="#install"]');
    } else {
        $page->click('Get started');
    }
    $page->assertScript('location.hash', '#install')
        ->assertSee('Let your agent set it up.')
        ->assertDontSee('Open an agent session.')
        ->assertSee('Copy prompt')
        ->assertDontSee('View prompt')
        ->assertSee('No install script. Orbit is meant to be run by your agent, so setup starts the same way. Open a session in the agent you already use and hand it this prompt. The CLI is yours whenever you want it.')
        ->assertMissing('.orbit-launch__signoff')
        ->assertDontSee('Close the lid. Keep going.')
        ->assertDontSee('Your infrastructure')
        ->assertDontSee('Your move')
        ->assertMissing('.orbit-launch__context')
        ->assertVisible('[data-orbit-prompt]')
        ->assertMissing('[role=dialog]');

    $page->assertScript('async () => {
        await document.fonts.ready;
        const root = document.querySelector("[data-install-finale]");
        const contentFits = [...root.querySelectorAll("h2, .orbit-launch__intro, [data-orbit-prompt], button")].every(el => {
            const box = el.getBoundingClientRect();
            return box.width > 0 && box.left >= 0 && box.right <= innerWidth && el.scrollWidth <= el.clientWidth + 1;
        });
        return root.previousElementSibling.querySelector(".orbit-owned-machine") !== null
            && getComputedStyle(root.querySelector("h2")).fontSize === getComputedStyle(document.querySelector(".orbit-owned-machine h2")).fontSize
            && contentFits && document.documentElement.scrollWidth <= innerWidth
            && (!matchMedia("(prefers-reduced-motion: reduce)").matches
                || getComputedStyle(root.querySelector(".orbit-launch__signal")).display === "none");
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with([
    'wide desktop' => [1920, false],
    'desktop' => [1482, true],
    'tablet' => [768, false],
    'mobile' => [390, true],
    'small mobile' => [320, true],
]);

it('copies the getting-started prompt with the absolute homepage URL using the keyboard', function () {
    $page = visit('/', ['reducedMotion' => 'reduce']);
    $page->script('() => {
        window.copiedOrbitText = null;
        Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
            writeText: async text => { window.copiedOrbitText = text; }
        }});
        document.querySelector("#install").scrollIntoView({behavior: "instant"});
    }');
    $page->keys('[aria-label="Copy Orbit getting-started prompt"]', 'Enter')
        ->assertScript('window.copiedOrbitText === `Go to ${location.origin}.\n\nGuide me through getting started with Orbit.`', true)
        ->assertSee('Copied')
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('offers one centered copy button beneath the inline prompt', function () {
    $page = visit('/', ['reducedMotion' => 'reduce']);
    $page->assertScript('() => {
        const section = document.querySelector("#install");
        const actions = section.querySelectorAll("a, button");
        const button = actions[0];
        const style = getComputedStyle(button);
        const box = button.getBoundingClientRect();
        const group = section.querySelector(".orbit-launch__actions").getBoundingClientRect();
        const prompt = section.querySelector("[data-orbit-prompt]").getBoundingClientRect();
        const intro = section.querySelector(".orbit-launch__intro").getBoundingClientRect();
        return actions.length === 1 && button.tagName === "BUTTON"
            && parseFloat(style.borderRadius) >= box.height / 2
            && style.backgroundImage === "none"
            && style.backgroundColor === "rgb(255, 255, 255)"
            && style.color === "rgb(0, 0, 0)"
            && Math.abs(group.left + group.width / 2 - (intro.left + intro.width / 2)) < 1
            && prompt.top > intro.bottom && box.top > prompt.bottom;
    }', true)->assertDontSee('Prefer to read first?')
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('keeps the installation signal route attached to the core underside after resizing', function () {
    $page = visit('/', ['reducedMotion' => 'reduce']);
    foreach ([1920, 1482, 768, 390, 1482] as $width) {
        $page->resize($width, 1000);
        $page->script('document.querySelector(".orbit-owned-machine").scrollIntoView({behavior: "instant"})');
        $page->assertScript('() => {
            const source = document.querySelector("[data-foundation-outlet]");
            const point = new DOMPoint(source.cx.baseVal.value, source.cy.baseVal.value).matrixTransform(source.getScreenCTM());
            const line = document.querySelector(".orbit-launch__thread").getBoundingClientRect();
            const target = document.querySelector(".orbit-launch__arrival").getBoundingClientRect();
            const dome = document.querySelector(".orbit-launch__horizon");
            const horizon = getComputedStyle(dome);
            return Math.abs(line.top - point.y) < 1 && Math.abs(line.left - point.x) < 1
                && Math.abs(line.bottom - (target.top + target.height / 2)) < 1
                && Math.abs(line.left - (target.left + target.width / 2)) < 1
                && Math.abs(dome.getBoundingClientRect().top - (target.top + target.height / 2)) < 1
                && horizon.backgroundImage.startsWith("linear-gradient(")
                && getComputedStyle(document.querySelector(".orbit-launch__thread")).backgroundImage === "none"
                && document.documentElement.scrollWidth <= innerWidth;
        }', true);
    }
    $page->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('hands the falling trail to two fading dome signals on the same clock', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'no-preference'])->resize($width, 1000);
    $page->assertScript('document.querySelector(".orbit-launch__signal").getAnimations().length', 1);
    $page->script('async () => {
        await document.fonts.ready;
        // Let viewport and font measurements settle before choosing the scroll target.
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        const handoff = document.querySelector(".orbit-launch__handoff").getBoundingClientRect();
        window.scrollTo({top: scrollY + handoff.top - 500, behavior: "instant"});
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
    }');
    $page->assertAttribute('[data-install-finale]', 'data-active', 'true');
    $page->script('() => {
        window.seekInstallSignal = position => {
            const root = document.querySelector("[data-install-finale]");
            const animations = root.getAnimations({subtree:true}).filter(animation => animation.id.startsWith("orbit-install-"));
            const descent = animations.find(animation => animation.id === "orbit-install-descent");
            const duration = descent.effect.getTiming().duration;
            const impact = descent.effect.getKeyframes()[1].offset * duration;
            const time = position === "fall" ? impact / 2 : position === "spread" ? impact + 300 : position === "fade" ? impact + 600 : impact + 800;
            animations.forEach(animation => { animation.pause(); animation.currentTime = time; });
        };
        window.seekInstallSignal("fall");
    }');
    $page->assertScript('() => {
        const signal = document.querySelector(".orbit-launch__signal");
        const waves = [...document.querySelectorAll("[data-dome-wave]")];
        return Number(getComputedStyle(signal).opacity) === 1
            && waves.every(wave => Number(getComputedStyle(wave).opacity) === 0)
            && getComputedStyle(signal.parentElement).backgroundImage === "none"
            && getComputedStyle(signal.parentElement).backgroundColor.endsWith(", 0.04)");
    }', true);
    $page->script('window.seekInstallSignal("spread")');
    $page->assertScript('() => {
        const signal = document.querySelector(".orbit-launch__signal");
        const waves = [...document.querySelectorAll("[data-dome-wave]")];
        const dome = document.querySelector(".orbit-launch__horizon").getBoundingClientRect();
        const target = document.querySelector(".orbit-launch__arrival").getBoundingClientRect();
        const length = parseFloat(getComputedStyle(signal).height);
        const points = waves.map(wave => wave.getPointAtLength(length - parseFloat(getComputedStyle(wave).strokeDashoffset)).matrixTransform(wave.getScreenCTM()));
        const gradients = [...document.querySelectorAll("[data-dome-gradient]")];
        return Number(getComputedStyle(signal).opacity) === 0
            && waves.every(wave => Number(getComputedStyle(wave).opacity) > .4
                && parseFloat(getComputedStyle(wave).strokeDasharray) === length
                && getComputedStyle(wave).strokeWidth === getComputedStyle(signal).width)
            && gradients.every(gradient => {
                const distance = Math.hypot(
                    Number(gradient.getAttribute("x2")) - Number(gradient.getAttribute("x1")),
                    Number(gradient.getAttribute("y2")) - Number(gradient.getAttribute("y1"))
                );
                const stops = gradient.querySelectorAll("stop");
                return Math.abs(distance - length) < 1
                    && getComputedStyle(stops[0]).stopOpacity === "0"
                    && getComputedStyle(stops[1]).stopOpacity === "1"
                    && getComputedStyle(stops[1]).stopColor === getComputedStyle(signal).backgroundImage.match(/rgb[a]?\([^)]+\)/g).at(-1);
            })
            && points[0].x < target.left && points[1].x > target.right
            && points.every(point => {
                const x = (point.x - (dome.left + dome.width / 2)) / (dome.width / 2 - .5);
                const y = (point.y - (dome.top + dome.height / 2)) / (dome.height / 2 - .5);
                return Math.abs(x*x+y*y-1) < .01;
            });
    }', true);
    $page->script('window.seekInstallSignal("fade")');
    $page->assertScript('() => [...document.querySelectorAll("[data-dome-wave]")].every(wave => {
        const style = getComputedStyle(wave);
        const point = wave.getPointAtLength(parseFloat(style.strokeDasharray) - parseFloat(style.strokeDashoffset)).matrixTransform(wave.getScreenCTM());
        return Number(style.opacity) > 0 && Number(style.opacity) < .3
            && Math.abs(point.x - innerWidth / 2) > innerWidth / 2 * .6;
    })', true);
    $page->script('window.seekInstallSignal("rest")');
    $page->assertScript('() => {
        const signal = document.querySelector(".orbit-launch__signal");
        const length = parseFloat(getComputedStyle(signal).height);
        return Number(getComputedStyle(signal).opacity) === 0
            && [...document.querySelectorAll("[data-dome-wave]")].every(wave => {
                const style = getComputedStyle(wave);
                const point = wave.getPointAtLength(length - parseFloat(style.strokeDashoffset)).matrixTransform(wave.getScreenCTM());
                return Number(style.opacity) === 0
                    && Math.abs(Math.abs(point.x - innerWidth / 2) / (innerWidth / 2) - .75) < .01;
            });
    }', true);
    $page->script('window.scrollTo({top:0,behavior:"instant"})');
    $page->assertAttribute('[data-install-finale]', 'data-active', 'false')
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['wide desktop' => 1920, 'desktop' => 1482, 'mobile' => 390]);

it('copies the Orbit prompt when the clipboard API is unavailable', function () {
    $page = visit('/', ['reducedMotion' => 'reduce']);
    $page->script('() => {
        Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
        window.copiedOrbitText = null;
        document.execCommand = command => {
            if (command !== "copy") return false;
            window.copiedOrbitText = document.activeElement.value;
            return true;
        };
    }');
    $page->click('[aria-label="Copy Orbit getting-started prompt"]')
        ->assertScript('window.copiedOrbitText === `Go to ${location.origin}.\n\nGuide me through getting started with Orbit.`', true)
        ->assertSee('Copied')
        ->assertScript('document.querySelectorAll("textarea").length', 0)
        ->assertScript('document.activeElement.getAttribute("aria-label")', 'Copy Orbit getting-started prompt')
        ->assertNoJavaScriptErrors();
});

it('displays the exact copied prompt inline without a dialog', function (int $width, bool $fallback) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->script('window.copiedOrbitText = null');
    if ($fallback) {
        $page->script('() => {
            Object.defineProperty(navigator,"clipboard",{configurable:true,value:undefined});
            document.execCommand = command => {
                if(command!=="copy") return false;
                window.copiedOrbitText=document.activeElement.value;
                return true;
            };
        }');
    } else {
        $page->script('Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async text=>{window.copiedOrbitText=text}}})');
    }
    $page->script('document.querySelector("#install").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertVisible('[data-orbit-prompt]')
        ->assertMissing('[role=dialog]')
        ->assertDontSee('View prompt')
        ->assertScript('window.copiedOrbitText', null)
        ->assertScript('() => {
            const prompt=document.querySelector("[data-orbit-prompt]");
            const box=prompt.getBoundingClientRect();
            const style=getComputedStyle(prompt);
            const button=document.querySelector("[aria-label=\"Copy Orbit getting-started prompt\"]");
            return box.left>=0 && box.right<=innerWidth
                && prompt.scrollWidth<=prompt.clientWidth+1
                && prompt.querySelectorAll("[data-corner]").length===4
                && style.borderRadius==="4px"
                && getComputedStyle(prompt.querySelector("code")).fontFamily.includes("JetBrains Mono")
                && parseFloat(style.paddingTop)<parseFloat(style.paddingLeft)
                && parseFloat(style.lineHeight)===parseFloat(style.paddingTop)
                && prompt.textContent.split(String.fromCharCode(10)).length===3
                && button.getBoundingClientRect().top > box.bottom;
        }', true);
    $page->click('[aria-label="Copy Orbit getting-started prompt"]')
        ->assertSee('Copied')
        ->assertScript('window.copiedOrbitText===document.querySelector("[data-orbit-prompt]").textContent', true)
        ->assertScript('window.copiedOrbitText===`Go to ${location.origin}.\n\nGuide me through getting started with Orbit.`', true)
        ->assertScript('document.activeElement.getAttribute("aria-label")', 'Copy Orbit getting-started prompt')
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => [2135, false], 'mobile' => [390, false], 'small mobile fallback' => [320, true]]);

it('moves the upward-facing footer ticks sideways with scroll and respects reduced motion', function (int $width, bool $reduced) {
    $page = visit('/', ['reducedMotion' => $reduced ? 'reduce' : 'no-preference'])->resize($width, 1000);
    $page->assertScript('async () => {
        await document.fonts.ready;
        const ruler = document.querySelector("[data-install-ruler]");
        const marks = ruler.querySelector(".orbit-story-ruler__marks");
        const reference = document.querySelector("[data-story-divider] .orbit-story-ruler__marks");
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const settle = async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); };
        scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"});
        await settle();
        const startY = scrollY;
        const start = parseFloat(getComputedStyle(marks).backgroundPositionX);
        const style = getComputedStyle(marks);
        if (style.backgroundImage !== getComputedStyle(reference).backgroundImage
            || style.backgroundSize !== "60px 7px, 60px 15px"
            || style.backgroundPositionY !== "100%, 100%"
            || Math.abs(ruler.getBoundingClientRect().bottom - document.querySelector("footer").getBoundingClientRect().top) > 1) return false;
        scrollTo({top:startY-200,behavior:"instant"});
        await settle();
        const up = parseFloat(getComputedStyle(marks).backgroundPositionX);
        if (Math.abs(up-start-(reduced ? 0 : (startY-scrollY)*.45)) > .1) return false;
        scrollTo({top:startY,behavior:"instant"});
        await settle();
        return Math.abs(parseFloat(getComputedStyle(marks).backgroundPositionX)-start)<.1
            && (!reduced || start===0)
            && document.documentElement.scrollWidth<=innerWidth;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => [1906, false], 'mobile' => [390, false], 'reduced motion' => [1440, true]]);
