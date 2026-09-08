<?php

it('switches hero stages and topology details', function () {
    $page = visit('/');

    $page->assertSee('The only tool you need to run your apps on your own infra.')
        ->click('#stage-tab-development')
        ->assertSee('Add a development node and every app gets its own URL.')
        ->click('[aria-label="Inspect app-1"]')
        ->assertSee('own git clone')
        ->click('#stage-tab-publish')
        ->assertSee('Apps stay private until you place one on a production node.')
        ->click('[aria-label="Inspect prod-eu-1"]')
        ->assertSee('round-robin route pool')
        ->assertNoJavaScriptErrors();
});

it('supports keyboard stage activation and command copying', function () {
    $page = visit('/');

    $page->keys('#stage-tab-gateway', 'Enter')
        ->assertSee('One gateway holds every machine and app record you own.')
        ->click('#install [aria-label^="Copy composer global require"]')
        ->assertSee('Copied')
        ->assertNoJavaScriptErrors();
});

it('renders the mobile layout without overflow or javascript errors', function () {
    $page = visit('/')->on()->mobile();

    $page->assertSee('The only tool you need to run your apps on your own infra.')
        ->assertScript('document.documentElement.scrollWidth <= document.documentElement.clientWidth', true)
        ->assertScript('getComputedStyle(document.querySelector("nav[aria-label=\"Primary navigation\"]")).display', 'none')
        ->assertNoJavaScriptErrors();
});
