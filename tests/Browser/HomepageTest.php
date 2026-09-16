<?php

it('renders the Orbit story homepage without javascript or console errors', function () {
    $page = visit('/');

    $page->assertSee('Develop your ideas faster on your own agent-run infra.')
        ->assertSee('Local development stops when your laptop does.')
        ->assertSee('Move the work off your machine. Keep the control on it.')
        ->assertSee('One service holding the store, the network, and the names.')
        ->assertSee('Provisioning you did not have to write.')
        ->assertSee('Every project has a URL that works on every device.')
        ->assertSee('Roles are the building blocks. Assemble what you need.')
        ->assertSee('Codified operations, so the agent stops guessing.')
        ->assertSee('That machine in the closet is a node.')
        ->assertSee('One install, then tell your agent.')
        ->assertScript('document.querySelectorAll("[data-hero-constellation] circle").length >= 10', true)
        ->assertScript('document.querySelectorAll("[data-chapter]").length', 6)
        ->assertScript('document.querySelectorAll(".orbit-story-hero .orbit-star").length >= 300', true)
        ->assertScript('document.querySelectorAll(".orbit-story-blur").length', 5)
        ->assertScript('document.querySelectorAll(".orbit-story-ruler").length', 2)
        ->assertScript('document.querySelectorAll("[data-role-chip]").length', 3)
        ->assertScript('document.querySelectorAll("[id^=stage-tab-]").length', 0)
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();
});

it('links navigation and calls to action to page sections and GitHub', function () {
    $page = visit('/');

    $page->assertAttribute('nav[aria-label="Primary navigation"] a[href="#story"]', 'href', '#story')
        ->assertAttribute('nav[aria-label="Primary navigation"] a[href="#build"]', 'href', '#build')
        ->assertAttribute('nav[aria-label="Primary navigation"] a[href="#install"]', 'href', '#install')
        ->assertAttribute('a[href="https://github.com/nckrtl/orbit"]', 'href', 'https://github.com/nckrtl/orbit')
        ->assertNoJavaScriptErrors();
});

it('keeps constellation strokes and telemetry at the export pixel sizes when resized', function () {
    $page = visit('/');

    foreach ([[1440, 1000], [1024, 768], [390, 844]] as [$width, $height]) {
        $page->resize($width, $height)
            ->assertScript(<<<'JS'
                (() => {
                    const svg = document.querySelector('[data-hero-constellation] svg');
                    const text = svg.querySelectorAll('[data-telemetry="gateway"] text');
                    const scale = svg.getScreenCTM().a;
                    const sizes = [9, 8.5, 8.5];
                    return text.length === 3 && [...text].every((line, i) =>
                        Math.abs(parseFloat(getComputedStyle(line).fontSize) * scale - sizes[i]) < 0.05
                    ) && Math.abs((text[1].y.baseVal[0].value - text[0].y.baseVal[0].value) * scale - 13) < 0.05;
                })()
                JS, true)
            ->assertScript(<<<'JS'
                [...document.querySelectorAll('[data-hero-constellation] [stroke]')].every(shape =>
                    getComputedStyle(shape).strokeWidth === '1px' &&
                    getComputedStyle(shape).vectorEffect === 'non-scaling-stroke'
                )
                JS, true)
            ->assertNoJavaScriptErrors()
            ->assertNoConsoleLogs();
    }
});

it('keeps telemetry attached to its moving node without overlapping other readouts', function () {
    $page = visit('/');
    $page->resize(1440, 1000)
        ->assertScript('document.querySelectorAll("[data-hero-constellation] [data-telemetry=\"h2\"] text").length', 3)
        ->assertScript(<<<'JS'
            (() => {
                const svg = document.querySelector('[data-hero-constellation] svg');
                const text = svg.querySelector('[data-telemetry="h2"] text');
                return Math.abs(parseFloat(getComputedStyle(text).fontSize) * svg.getScreenCTM().a - 9) < 0.05;
            })()
            JS, true);

    $result = $page->script(<<<'JS'
        (async () => {
            const svg = document.querySelector('[data-hero-constellation] svg');
            const sample = () => {
                const node = svg.querySelector('[data-orbit-node="h2"] circle[stroke]');
                const text = svg.querySelector('[data-telemetry="h2"] text');
                const scale = svg.getScreenCTM().a;
                return { y: node.cy.baseVal.value * scale, labelY: text.y.baseVal[0].value * scale };
            };
            const before = sample();
            await new Promise(resolve => setTimeout(resolve, 400));
            const after = sample();
            const boxes = [...svg.querySelectorAll('[data-telemetry]')].map(group => group.getBoundingClientRect());
            return {
                moved: Math.abs(after.y - before.y) > 0.1,
                follows: Math.abs((after.labelY - before.labelY) - (after.y - before.y)) < 0.05,
                centered: Math.abs(after.labelY - after.y + 9.8) < 0.05,
                noOverlap: boxes.every((box, i) => boxes.slice(i + 1).every(other =>
                    box.right < other.left || box.left > other.right || box.bottom < other.top || box.top > other.bottom
                )),
            };
        })()
        JS);

    expect($result)->toBe([
        'moved' => true,
        'follows' => true,
        'centered' => true,
        'noOverlap' => true,
    ]);

    $page->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});
