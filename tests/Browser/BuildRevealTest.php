<?php

it('reveals the workspace illustration and benefits grid as groups while staggering build copy', function (int $width, bool $reduced) {
    $page = visit('/', ['reducedMotion' => $reduced ? 'reduce' : 'no-preference'])->resize($width, 1000);
    $page->assertScript('async () => {
        await document.fonts.ready;
        const section = document.querySelector("#build");
        const settle = async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); };
        await settle();
        const parts = [...section.querySelectorAll("[data-build-reveal]")];
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (parts.length < 13 || parts.some(el => !Number.isFinite(Number(el.dataset.buildRevealStart)))) return false;
        const figure = section.querySelector(".orbit-environments__figure");
        if (!figure.hasAttribute("data-build-reveal") || figure.querySelector("[data-build-reveal]")) return false;
        const benefits = section.querySelector(".orbit-environments__benefits");
        if (!benefits.hasAttribute("data-build-reveal") || benefits.querySelector("[data-build-reveal]")) return false;
        if (benefits.querySelectorAll("article").length !== 6) return false;
        const groups = [
            [...section.querySelectorAll(".orbit-environments__heading [data-build-reveal]")],
            [figure],
            [benefits]
        ];
        for (const group of groups) {
            const first = group[0], last = group.at(-1);
            if (!group.every(el => el.hasAttribute("data-build-reveal"))) return false;
            const start = Number(first.dataset.buildRevealStart);
            const end = Number(first.dataset.buildRevealEnd);
            scrollTo({top:(start+end)/2,behavior:"instant"});
            await settle();
            if (reduced) {
                if (!parts.every(el => getComputedStyle(el).opacity === "1" && getComputedStyle(el).filter === "none")) return false;
                continue;
            }
            const partial = Number(getComputedStyle(first).opacity);
            if (partial < .4 || partial > .6 || !getComputedStyle(first).filter.startsWith("blur(")) return false;
            if (group.length > 1 && !(Number(getComputedStyle(last).opacity) < partial)) return false;
            scrollTo({top:Number(last.dataset.buildRevealEnd)+5,behavior:"instant"});
            await settle();
            if (!group.every(el => getComputedStyle(el).opacity === "1" && getComputedStyle(el).filter === "none")) return false;
            scrollTo({top:(start+end)/2,behavior:"instant"});
            await settle();
            if (Math.abs(Number(getComputedStyle(first).opacity)-partial)>.01) return false;
        }
        return document.documentElement.scrollWidth<=innerWidth;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => [1906, false], 'mobile' => [390, false], 'reduced motion' => [1440, true]]);
