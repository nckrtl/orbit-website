<?php

it('shows the default story network without topology controls', function () {
    $page = visit('/');

    $page->assertScript('document.querySelectorAll("[aria-label=\"Topology roles\"], [data-role-chip]").length', 0)
        ->assertScript('document.querySelectorAll("[data-story-node=dev-01], [data-story-node=worker-01], [data-story-node=dev-02], [data-story-node=database]").length', 4)
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();
});

it('supports keyboard URL copying', function () {
    $page = visit('/');

    $page->keys('[aria-label="Copy Orbit URL"]', 'Enter')
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
