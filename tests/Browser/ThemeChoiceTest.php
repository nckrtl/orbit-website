<?php

use Pest\Browser\Api\AwaitableWebpage;
use Pest\Browser\Api\PendingAwaitablePage;

function selectOrbitThemeOption(AwaitableWebpage|PendingAwaitablePage $page, string $label): void
{
    // Use the native action timeout: retrying a completed theme change after
    // Pest's one-second attempt can target a menu that has already closed.
    $page->page()->locator('[role="menuitemradio"]:has-text("'.$label.'")')->click(['timeout' => 5000]);
    $page->assertNotPresent('[role="menu"]');
}

it('switches between light and dark and remembers the choice', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce', 'colorScheme' => 'light'])->resize($width, 900);
    $page->assertScript('document.querySelector("[data-hero-content]").hasAttribute("data-exit-start")', true)
        ->assertScript('document.documentElement.dataset.appearance', 'dark')
        ->assertScript('getComputedStyle(document.body).backgroundColor', 'rgb(5, 5, 6)')
        ->click('[aria-label="Choose color theme"]')
        ->assertAttribute('[role="menuitemradio"]:has-text("Dark")', 'aria-checked', 'true');
    selectOrbitThemeOption($page, 'Light');
    $page->keys('[aria-label="Choose color theme"]', 'Escape')
        ->assertScript('getComputedStyle(document.body).backgroundColor', 'rgb(246, 245, 241)')
        ->assertScript('getComputedStyle(document.documentElement).colorScheme', 'light')
        ->assertAttribute('meta[name="theme-color"]', 'content', '#f6f5f1')
        ->assertScript('localStorage.getItem("appearance")', 'light')
        ->assertScript('document.cookie.includes("appearance=light")', true)
        ->refresh()
        ->assertScript('document.querySelector("[data-hero-content]").hasAttribute("data-exit-start")', true)
        ->assertScript('document.documentElement.dataset.appearance', 'light')
        ->assertScript('getComputedStyle(document.body).backgroundColor', 'rgb(246, 245, 241)')
        ->click('[aria-label="Choose color theme"]')
        ->assertAttribute('[role="menuitemradio"]:has-text("Light")', 'aria-checked', 'true');
    selectOrbitThemeOption($page, 'Dark');
    $page->keys('[aria-label="Choose color theme"]', 'Escape')
        ->assertScript('getComputedStyle(document.body).backgroundColor', 'rgb(5, 5, 6)')
        ->assertAttribute('meta[name="theme-color"]', 'content', '#050506')
        ->assertScript('document.documentElement.scrollWidth <= innerWidth', true)
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();
})->with(['desktop' => 1440, 'phone' => 390, 'small phone' => 320]);

it('offers keyboard theme selection and returns focus when dismissed', function () {
    $page = visit('/', ['reducedMotion' => 'reduce']);
    $page->assertScript('document.querySelector("[data-hero-content]").hasAttribute("data-exit-start")', true)
        ->keys('[aria-label="Choose color theme"]', 'Enter')
        ->assertVisible('[role="menu"]')
        ->keys('[role="menuitemradio"][aria-checked="true"]', 'Home')
        ->assertScript('document.activeElement.textContent.trim()', 'Light');
    $page->page()->locator('[role="menuitemradio"]:has-text("Light")')->press('Enter', ['timeout' => 5000]);
    $page->keys('[aria-label="Choose color theme"]', 'Escape')
        ->assertScript('document.documentElement.dataset.appearance', 'light')
        ->assertScript('document.activeElement.getAttribute("aria-label")', 'Choose color theme')
        ->assertScript('getComputedStyle(document.activeElement).outlineStyle', 'solid')
        ->keys('[aria-label="Choose color theme"]', 'Enter')
        ->assertVisible('[role="menu"]')
        ->keys('[role="menuitemradio"][aria-checked="true"]', 'Escape')
        ->assertNotPresent('[role="menu"]')
        ->assertScript('document.activeElement.getAttribute("aria-label")', 'Choose color theme')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();
});

it('resolves the system theme when explicitly selected', function (string $scheme, bool $dark) {
    $page = visit('/', ['reducedMotion' => 'reduce', 'colorScheme' => $scheme]);
    $page->assertScript('document.querySelector("[data-hero-content]").hasAttribute("data-exit-start")', true)
        ->click('[aria-label="Choose color theme"]');
    selectOrbitThemeOption($page, 'System');
    $page->keys('[aria-label="Choose color theme"]', 'Escape')
        ->assertScript('document.documentElement.dataset.appearance', 'system')
        ->assertScript('document.documentElement.classList.contains("dark")', $dark)
        ->refresh()
        ->assertScript('document.querySelector("[data-hero-content]").hasAttribute("data-exit-start")', true)
        ->assertScript('document.documentElement.classList.contains("dark")', $dark)
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();
})->with(['light OS' => ['light', false], 'dark OS' => ['dark', true]]);

it('keeps theme selection usable when local storage is blocked and restores from the cookie', function () {
    $page = visit('/', ['reducedMotion' => 'reduce']);
    $page->script('Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new DOMException("Blocked", "SecurityError"); } })');
    $page->assertScript('document.querySelector("[data-hero-content]").hasAttribute("data-exit-start")', true)
        ->click('[aria-label="Choose color theme"]');
    selectOrbitThemeOption($page, 'Light');
    $page->keys('[aria-label="Choose color theme"]', 'Escape')
        ->assertScript('document.documentElement.dataset.appearance', 'light')
        ->refresh()
        ->assertScript('document.querySelector("[data-hero-content]").hasAttribute("data-exit-start")', true)
        ->assertScript('document.documentElement.dataset.appearance', 'light')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();
});

it('keeps the light homepage readable and usable with reduced motion', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 900);
    $page->assertScript('document.querySelector("[data-hero-content]").hasAttribute("data-exit-start")', true)
        ->click('[aria-label="Choose color theme"]');
    selectOrbitThemeOption($page, 'Light');
    $page->keys('[aria-label="Choose color theme"]', 'Escape');

    $page->assertScript('() => {
        const style = selector => getComputedStyle(document.querySelector(selector));
        const paper = getComputedStyle(document.body).backgroundColor;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const context = canvas.getContext("2d");
        const lightness = color => {
            context.fillStyle = paper;
            context.fillRect(0, 0, 1, 1);
            context.fillStyle = color;
            context.fillRect(0, 0, 1, 1);
            const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
            return (r + g + b) / 3;
        };
        const paperLightness = lightness(paper);
        const backings = [...document.querySelectorAll("[data-tab-backing], [data-tab-side]")];
        return backings.length > 0 && backings.every(el => {
            const stroke = getComputedStyle(el).stroke;
            return stroke !== "none" && paperLightness - lightness(stroke) > 60;
        })
            && [...document.querySelectorAll(".orbit-doctor__tube, .orbit-doctor__earpiece, .orbit-doctor__metal")].every(el => getComputedStyle(el).fill === paper)
            && [...document.querySelectorAll(".orbit-stack__plate")].every(el => getComputedStyle(el).stroke === style(".orbit-laptop__device-edge").stroke)
            && style(".orbit-capability__drawing--network [data-control-face] .orbit-laptop__lid").fill === style(".orbit-laptop__device-screen").fill
            && lightness(style(".orbit-laptop__connections").stroke) > lightness(style(".orbit-laptop__device-edge").stroke)
            && style(".orbit-theme-trigger").width === "32px"
            && !document.querySelector("[data-server-corner]");
    }', true);

    foreach (['[data-chapter=problem]', '[data-chapter=premise]', '[data-chapter=topology]', '.orbit-capabilities__grid', '.orbit-environments__figure', '#install'] as $selector) {
        $page->script('document.querySelector("'.$selector.'").scrollIntoView({block:"center",behavior:"instant"})');
        $page->assertScript('() => {
            const section = document.querySelector("'.$selector.'");
            return section.getBoundingClientRect().width > 0
                && getComputedStyle(section).opacity === "1"
                && document.documentElement.scrollWidth <= innerWidth
                && [...section.querySelectorAll("[data-motion-scene]")].every(el => el.dataset.motionActive === "false");
        }', true);
    }
    $page->keys('[aria-label="Copy Orbit getting-started prompt"]', 'Enter')
        ->assertSee('Copied')
        ->assertScript('() => {
            const luminance = color => {
                const values = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => {
                    v /= 255;
                    return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
                });
                return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
            };
            const background = luminance(getComputedStyle(document.body).backgroundColor);
            return [...document.querySelectorAll("h1, [data-story-copy-part=body] p, .orbit-label")].every(el => {
                return (background + .05) / (luminance(getComputedStyle(el).color) + .05) >= 4.5;
            });
        }', true)
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();
})->with(['desktop' => 1440, 'phone' => 390]);

it('paints the core logo inline with strong contrast in both mobile themes', function (string $theme) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize(390, 844);
    $page->assertScript('document.querySelector("[data-hero-content]").hasAttribute("data-exit-start")', true);
    if ($theme === 'light') {
        $page->click('[aria-label="Choose color theme"]');
        selectOrbitThemeOption($page, 'Light');
    }
    $page->script('document.querySelector(".orbit-foundation__drawing").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertScript('() => {
        const logo = document.querySelector("[data-foundation-core-logo]");
        const face = document.querySelector("[data-foundation-gateway] [data-foundation-face]");
        const box = logo.getBoundingClientRect();
        return logo.tagName === "path" && logo.getTotalLength() > 100
            && box.width > 20 && box.height > 10
            && box.left >= 0 && box.right <= innerWidth && box.top >= 0 && box.bottom <= innerHeight
            && getComputedStyle(logo).fill !== getComputedStyle(face).fill
            && getComputedStyle(logo).fill !== "none"
            && getComputedStyle(logo).filter === "none"
            && getComputedStyle(logo).stroke === "none"
            && !document.querySelector("[data-server-corner]");
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['light', 'dark']);
