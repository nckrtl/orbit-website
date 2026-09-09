<?php

it('navigates from the header menu and restores focus when dismissed', function (int $width, int $height) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, $height);
    $page->assertVisible('[aria-label="Open navigation menu"]')
        ->assertScript('() => {
            const button=document.querySelector("[aria-label=\"Open navigation menu\"]");
            const trigger=button.getBoundingClientRect(),header=button.closest("header").getBoundingClientRect();
            const style=getComputedStyle(button);
            return trigger.width>=44 && trigger.height>=44 && innerWidth-trigger.right<=64
                && trigger.top>=header.top && trigger.bottom<=header.bottom
                && style.backgroundColor==="rgba(0, 0, 0, 0)" && style.color==="rgb(255, 255, 255)"
                && button.textContent.trim()==="" && !document.querySelector(".orbit-story-header__compact-label")
                && getComputedStyle(document.querySelector(".orbit-story-nav")).display==="none";
        }', true)
        ->click('[aria-label="Open navigation menu"]')
        ->assertVisible('[role="dialog"]')
        ->assertSee('Explore Orbit')
        ->assertScript('() => {
            const dialog=document.querySelector("[role=dialog]");
            const bounds=dialog.getBoundingClientRect();
            return bounds.left>=0 && bounds.right<=innerWidth && bounds.top>=0 && bounds.bottom<=innerHeight
                && dialog.contains(document.activeElement)
                && [...dialog.querySelectorAll("nav a")].every(a=>a.getBoundingClientRect().height>=44);
        }', true)
        ->click('[aria-label="Close navigation menu"]')
        ->assertNotPresent('[role="dialog"]')
        ->assertScript('document.activeElement.getAttribute("aria-label")', 'Open navigation menu');

    foreach (['story', 'build', 'install'] as $destination) {
        $page->script('scrollBy({top:-32,behavior:"instant"})');
        $page->assertScript('document.querySelector(".orbit-story-header").getBoundingClientRect().top', 0);
        $page->click('[aria-label="Open navigation menu"]')
            ->click('[aria-label="Mobile navigation"] a[href="#'.$destination.'"]')
            ->assertNotPresent('[role="dialog"]')
            ->assertScript('location.hash', '#'.$destination)
            ->assertScript('() => {
                const target=document.querySelector("#'.$destination.'").getBoundingClientRect();
                return target.top>=0 && target.top<innerHeight*.4 && document.documentElement.scrollWidth<=innerWidth;
            }', true);
    }
    $page->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['small phone' => [320, 740], 'phone' => [390, 844], 'tablet' => [820, 1180]]);

it('interleaves each compact story heading, illustration and explanation without overflow', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->assertScript('() => {
        return [...document.querySelectorAll("[data-chapter]")].every(section=>{
            const title=section.querySelector("h2").getBoundingClientRect();
            const visual=section.querySelector("[data-story-enter=visual]").getBoundingClientRect();
            const body=section.querySelector("[data-story-copy-part=body]").getBoundingClientRect();
            return title.bottom<=visual.top && visual.bottom<=body.top
                && visual.width>=innerWidth*.7 && visual.height>=300
                && body.left>=16 && body.right<=innerWidth-16;
        }) && document.documentElement.scrollWidth<=innerWidth;
    }', true);
    foreach (['problem', 'premise', 'topology'] as $chapter) {
        $page->script('document.querySelector("[data-chapter='.$chapter.'] [data-story-copy-part=body]").scrollIntoView({block:"center",behavior:"instant"})');
        $page->assertScript('() => {
            const body=document.querySelector("[data-chapter='.$chapter.'] [data-story-copy-part=body]");
            return getComputedStyle(body).opacity==="1" && !body.inert;
        }', true);
    }
    $page->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['small phone' => 320, 'phone' => 390, 'tablet' => 820]);

it('reframes the scenes and releases the menu when changing to desktop', function () {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize(390, 844);
    $page->assertAttribute('[data-server-scene]', 'viewBox', '180 35 500 500')
        ->assertAttribute('.orbit-stack', 'viewBox', '210 0 680 640')
        ->click('[aria-label="Open navigation menu"]')
        ->assertVisible('[role="dialog"]')
        ->resize(1440, 1000)
        ->assertNotPresent('[role="dialog"]')
        ->assertAttribute('[data-server-scene]', 'viewBox', '0 0 740 560')
        ->assertAttribute('.orbit-stack', 'viewBox', '0 0 1100 594')
        ->assertVisible('[aria-label="Primary navigation"]');
    $page->script('scrollTo({top:900,behavior:"instant"})');
    $page->assertScript('scrollY>800', true)
        ->resize(820, 1180)
        ->assertAttribute('.orbit-stack', 'viewBox', '85 0 930 640')
        ->assertScript('() => [...document.querySelectorAll("[data-funnel-lane]")].every(path=>!/[a-z]*Infinity|NaN/.test(path.getAttribute("d"))) && document.documentElement.scrollWidth<=innerWidth', true)
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('keeps compact background motion light and supports keyboard dismissal', function () {
    $page = visit('/')->resize(390, 844);
    $page->click('[aria-label="Open navigation menu"]')
        ->keys('[role="dialog"]', 'Tab')
        ->assertScript('document.querySelector("[role=dialog]").contains(document.activeElement)', true)
        ->keys('[role="dialog"]', 'Escape')
        ->assertNotPresent('[role="dialog"]')
        ->assertScript('document.activeElement.getAttribute("aria-label")', 'Open navigation menu');
    $page->script('document.querySelector("#build").scrollIntoView({behavior:"instant"})');
    $page->assertScript('() => {
        const field=document.querySelector("[data-page-stars]");
        return field.style.getPropertyValue("--starfield-rotation")==="0deg"
            && getComputedStyle(field.querySelector(".orbit-starfield__stars")).transform==="none"
            && document.documentElement.scrollWidth<=innerWidth;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('hides the compact header on downward scroll and brings it back on upward scroll', function (int $width, int $height, bool $reduced) {
    $page = visit('/', ['reducedMotion' => $reduced ? 'reduce' : 'no-preference'])->resize($width, $height);
    $page->assertScript('getComputedStyle(document.querySelector(".orbit-story-header")).opacity', '1');
    $page->script('scrollTo({top:240,behavior:"instant"})');
    $page->assertScript('document.querySelector(".orbit-story-header").getBoundingClientRect().bottom<=.1', true);
    $page->script('scrollBy({top:-6,behavior:"instant"})');
    $page->assertScript('document.querySelector(".orbit-story-header").hasAttribute("data-header-hidden")', true);
    $page->script('scrollBy({top:-40,behavior:"instant"})');
    $page->assertScript('document.querySelector(".orbit-story-header").getBoundingClientRect().top', 0)
        ->click('[aria-label="Open navigation menu"]')
        ->assertVisible('[role="dialog"]')
        ->assertScript('() => {
            const bounds=document.querySelector("[role=dialog]").getBoundingClientRect();
            return bounds.top>=64 && bounds.top<=88 && bounds.bottom<=innerHeight;
        }', true);
    $page->script('scrollTo({top:400,behavior:"instant"})');
    $page->assertScript('document.querySelector(".orbit-story-header").getBoundingClientRect().top', 0)
        ->keys('[role="dialog"]', 'Escape')
        ->assertNotPresent('[role="dialog"]')
        ->assertScript('document.activeElement.getAttribute("aria-label")', 'Open navigation menu')
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['phone' => [377, 766, false], 'tablet' => [820, 1180, false], 'reduced motion' => [377, 766, true]]);

it('reveals the hidden header for keyboard focus and restores desktop navigation after resizing', function () {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize(377, 766);
    $page->assertAttribute('[data-chapter=problem]', 'data-story-scroll', '');
    $page->script('scrollTo({top:600,behavior:"instant"})');
    $page->assertScript('document.querySelector(".orbit-story-header").getBoundingClientRect().bottom<=.1', true);
    $page->assertScript('() => {
        const before = scrollY;
        document.querySelector("[aria-label=\"Orbit home\"]").focus({preventScroll:true});
        return before > 500 && scrollY === before;
    }', true)->assertScript('document.querySelector(".orbit-story-header").getBoundingClientRect().top', 0)
        ->keys('[aria-label="Orbit home"]', 'Tab')
        ->assertScript('document.activeElement.getAttribute("aria-label")', 'Open navigation menu');
    $page->script('document.activeElement.blur();scrollTo({top:800,behavior:"instant"})');
    $page->assertScript('document.querySelector(".orbit-story-header").getBoundingClientRect().bottom<=.1', true)
        ->resize(1440, 1000)
        ->assertVisible('[aria-label="Primary navigation"]')
        ->assertScript('document.querySelector(".orbit-story-header").getBoundingClientRect().top', 0);
    $page->script('scrollTo({top:1000,behavior:"instant"})');
    $page->assertScript('document.querySelector(".orbit-story-header").getBoundingClientRect().top', 0)
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});
