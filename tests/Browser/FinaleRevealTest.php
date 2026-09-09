<?php

it('reveals the foundation as one group while staggering headings and setup details', function (int $width, int $height, bool $reduced) {
    $page = visit('/', ['reducedMotion' => $reduced ? 'reduce' : 'no-preference'])->resize($width, $height);
    $page->assertScript('async () => {
        await document.fonts.ready;
        const settle = async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); };
        await settle();
        const foundation = document.querySelector(".orbit-owned-machine");
        const install = document.querySelector("#install");
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const groups = [
            ["foundation", [...foundation.querySelectorAll(".orbit-owned-machine__intro [data-foundation-reveal]")]],
            ["foundation", [foundation.querySelector(".orbit-foundation")]],
            ["install", [...install.querySelectorAll(".orbit-label, h2, .orbit-launch__intro")]],
            ["install", [...install.querySelectorAll("[data-orbit-prompt], .orbit-launch__actions")]]
        ];
        const diagram=foundation.querySelector(".orbit-foundation");
        if(diagram.querySelectorAll("[data-foundation-reveal]").length!==0) return false;
        if([...diagram.querySelectorAll("[data-foundation-plate], [data-foundation-note], [data-foundation-gateway], .orbit-foundation__connections")].some(el=>getComputedStyle(el).opacity!=="1" || getComputedStyle(el).filter!=="none")) return false;
        for (const [name, group] of groups) {
            if (group.length < 1 || group.some(el => !el?.hasAttribute(`data-${name}-reveal`))) return false;
            const first = group[0], last = group.at(-1);
            const start = Number(first.getAttribute(`data-${name}-reveal-start`));
            const end = Number(first.getAttribute(`data-${name}-reveal-end`));
            scrollTo({top:(start+end)/2,behavior:"instant"});
            await settle();
            if (reduced) {
                if (!group.every(el => getComputedStyle(el).opacity === "1" && getComputedStyle(el).filter === "none")) return false;
                continue;
            }
            const partial = Number(getComputedStyle(first).opacity);
            if (partial < .4 || partial > .6 || !getComputedStyle(first).filter.startsWith("blur(")) return false;
            if (group.length > 1 && Number(getComputedStyle(last).opacity) >= partial) return false;
            scrollTo({top:Number(last.getAttribute(`data-${name}-reveal-end`))+5,behavior:"instant"});
            await settle();
            if (!group.every(el => getComputedStyle(el).opacity === "1" && getComputedStyle(el).filter === "none")) return false;
            scrollTo({top:(start+end)/2,behavior:"instant"});
            await settle();
            if (Math.abs(Number(getComputedStyle(first).opacity)-partial) > .01) return false;
        }
        scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"});
        await settle();
        return [...document.querySelectorAll("[data-foundation-reveal], [data-install-reveal]")].every(el => getComputedStyle(el).opacity === "1" && getComputedStyle(el).filter === "none")
            && document.documentElement.scrollWidth <= innerWidth;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with([
    'desktop' => [1906, 1000, false],
    'tall desktop' => [1906, 1576, false],
    'mobile' => [390, 844, false],
    'reduced motion' => [1440, 1000, true],
]);

it('makes the entering copy action crisp on keyboard focus and copies the prompt', function () {
    $page = visit('/', ['reducedMotion' => 'no-preference']);
    $page->assertScript('async () => {
        const settle = async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); };
        await document.fonts.ready;
        await settle();
        const action = document.querySelector(".orbit-launch__actions");
        scrollTo({top:Number(action.dataset.installRevealStart)-5,behavior:"instant"});
        await settle();
        if (getComputedStyle(action).opacity !== "0") return false;
        Object.defineProperty(navigator, "clipboard", {configurable:true,value:{writeText:async text => {window.copiedOrbitText = text;}}});
        action.querySelector("button").focus({preventScroll:true});
        await settle();
        return getComputedStyle(action).opacity === "1" && getComputedStyle(action).filter === "none";
    }', true);
    $page->keys('[aria-label="Copy Orbit getting-started prompt"]', 'Enter')
        ->assertScript('window.copiedOrbitText === `Go to ${location.origin}.\n\nGuide me through getting started with Orbit.`', true)
        ->assertSee('Copied')
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});
