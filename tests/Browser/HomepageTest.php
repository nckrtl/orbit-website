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
