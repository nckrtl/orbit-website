<?php

it('reveals capabilities from the right, holds them readable, and exits left with blur', function (int $width, bool $reduced) {
    $page = visit('/', ['reducedMotion' => $reduced ? 'reduce' : 'no-preference'])->resize($width, 1000);
    $page->assertPresent('[data-capabilities-scroll]');
    $page->assertScript('async () => {
        await document.fonts.ready;
        const element = document.querySelector("[data-capabilities-scroll]");
        const label = element.firstElementChild;
        const grid = element.querySelector(".orbit-capabilities__grid");
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const top = label.getBoundingClientRect().top + scrollY;
        const bottom = grid.getBoundingClientRect().bottom + scrollY;
        const at = async y => {
            scrollTo({top:y,behavior:"instant"});
            await new Promise(requestAnimationFrame);
            await new Promise(requestAnimationFrame);
            const style = getComputedStyle(element);
            return {opacity:Number(style.opacity), blur:parseFloat(style.filter.slice(5)) || 0,
                x:style.transform === "none" ? 0 : new DOMMatrix(style.transform).m41, inert:element.inert};
        };
        const before = await at(top-innerHeight);
        const entering = await at(top-innerHeight*.75);
        const entered = await at(top-innerHeight*.55);
        const middle = await at((top+bottom)/2-innerHeight/2);
        const held = await at(bottom-innerHeight*.4);
        const exiting = await at(bottom-innerHeight*.35+(innerHeight*.35-64)/2);
        const after = await at(bottom-60);
        const back = await at((top+bottom)/2-innerHeight/2);
        const states = [before,entering,entered,middle,held,exiting,after,back];
        if(document.documentElement.scrollWidth>innerWidth) return false;
        if(reduced) return states.every(s=>s.opacity===1 && s.blur===0 && s.x===0 && !s.inert);
        return before.opacity===0 && before.x>0 && before.blur===6 && before.inert
            && entering.opacity>.4 && entering.opacity<.6 && entering.x>0 && entering.x<before.x && entering.blur>0
            && [entered,middle,held,back].every(s=>s.opacity===1 && s.blur===0 && s.x===0 && !s.inert)
            && exiting.opacity>.4 && exiting.opacity<.6 && exiting.x<0 && exiting.blur>0
            && after.opacity===0 && after.x<exiting.x && after.blur===6 && after.inert;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 2135, 'tablet' => 768, 'mobile' => 390])->with(['motion' => false, 'reduced motion' => true]);
