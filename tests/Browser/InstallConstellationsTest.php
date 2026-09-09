<?php

it('keeps the install section clear of decorative constellations', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->script('document.querySelector("#install").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertScript('() => {
        const section = document.querySelector(".orbit-launch");
        const button = section.querySelector("button").getBoundingClientRect();
        return !section.querySelector("[data-launch-constellation], .orbit-launch__constellations")
            && document.elementFromPoint(button.left + button.width / 2, button.top + button.height / 2).closest("button") !== null
            && document.documentElement.scrollWidth <= innerWidth;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 2135, 'tablet' => 768, 'mobile' => 390]);
