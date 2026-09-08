<?php

it('lets readers reshape the topology with role chips', function () {
    $page = visit('/');

    $page->assertAttribute('[data-role-chip="database"]', 'aria-pressed', 'true')
        ->assertAttribute('[data-role-chip="dedicatedDatabase"]', 'aria-pressed', 'false')
        ->click('[data-role-chip="dedicatedDatabase"]')
        ->assertAttribute('[data-role-chip="dedicatedDatabase"]', 'aria-pressed', 'true')
        ->assertSee('db-01')
        ->click('[data-role-chip="production"]')
        ->assertAttribute('[data-role-chip="production"]', 'aria-pressed', 'true')
        ->assertSee('prod-01')
        ->assertNoJavaScriptErrors();
});

it('supports keyboard role activation and command copying', function () {
    $page = visit('/');

    $page->keys('[data-role-chip="production"]', 'Enter')
        ->assertAttribute('[data-role-chip="production"]', 'aria-pressed', 'true')
        ->click('#install [aria-label^="Copy composer global require"]')
        ->assertSee('Copied')
        ->assertNoJavaScriptErrors();
});

it('renders the story mobile layout without overflow or javascript errors', function () {
    $page = visit('/')->on()->mobile();

    $page->assertSee('Develop your ideas faster on your own agent-run infra.')
        ->assertScript('document.documentElement.scrollWidth <= document.documentElement.clientWidth', true)
        ->assertScript('getComputedStyle(document.querySelector("nav[aria-label=\"Primary navigation\"]")).display', 'flex')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();
});
