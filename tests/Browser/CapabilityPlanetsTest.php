<?php

it('matches capability planet and block text sizes without a Gateway label', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->assertPresent('[data-capability-planet] [data-planet-latitudes]');
    $page->assertScript('async () => {
        await document.fonts.ready;
        const names=document.querySelector("[data-capability=names]");
        const store=document.querySelector("[data-capability=store]");
        if([...names.querySelectorAll("svg text")].some(el=>el.textContent.trim()==="Gateway")) return false;
        const planets=[names,store].map(card=>card.querySelector("[data-orbit-planet]"));
        const boxes=planets.map(el=>el.getBoundingClientRect());
        const labels=[names,store].map(card=>card.querySelector("svg text"));
        const textSizes=labels.map(el=>parseFloat(getComputedStyle(el).fontSize)*Math.hypot(el.getScreenCTM().c,el.getScreenCTM().d));
        return Math.abs(boxes[0].width-boxes[1].width)<.2
            &&boxes.every(box=>Math.abs(box.width-document.querySelector("[data-agent-planet] circle").getBoundingClientRect().width)<.2&&Math.abs(box.width-box.height)<.1)
            &&Math.abs(textSizes[0]-textSizes[1])<.05
            &&planets.every(el=>getComputedStyle(el).strokeWidth==="1px"&&getComputedStyle(el).vectorEffect==="non-scaling-stroke")
            &&[names,store].every(card=>{
                const path=card.querySelector("[data-planet-latitudes]");
                return path.dataset.latitudesAnimating==="false"&&getComputedStyle(path).strokeWidth==="1px"
                    &&getComputedStyle(path).vectorEffect==="non-scaling-stroke";
            })
            &&document.querySelectorAll("[data-hero-body] [data-planet-latitudes]").length>10
            &&document.documentElement.scrollWidth<=innerWidth;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['wide desktop' => 2135, 'desktop' => 1440, 'tablet' => 768, 'mobile' => 390]);

it('animates capability latitudes upward and pauses them offscreen', function (string $card) {
    $page = visit('/')->resize(1440, 1000);
    $selector = '[data-capability='.$card.'] [data-planet-latitudes]';
    $page->assertAttribute($selector, 'data-latitudes-animating', 'false');
    $page->script('document.querySelector("[data-capability='.$card.']").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertAttribute($selector, 'data-latitudes-animating', 'true');
    $page->assertScript('async () => {
        const path=document.querySelector("'.$selector.'");
        const y=()=>Number(path.getAttribute("d").match(/^M[-\d.]+ ([-\d.]+)a/)[1]);
        const before=y();
        await new Promise(resolve=>setTimeout(resolve,250));
        return document.querySelector("'.$selector.'")===path&&y()<before
            &&getComputedStyle(path).strokeWidth==="1px";
    }', true);
    $page->script('scrollTo({top:0,behavior:"instant"})');
    $page->assertAttribute($selector, 'data-latitudes-animating', 'false');
    $page->assertScript('async () => {
        const path=document.querySelector("'.$selector.'");
        const before=path.getAttribute("d");
        await new Promise(resolve=>setTimeout(resolve,200));
        return path.getAttribute("d")===before;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['names', 'store']);
