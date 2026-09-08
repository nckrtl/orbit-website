<?php

it('renders the Orbit marketing homepage without javascript or console errors', function () {
    $page = visit('/');

    $page->assertSee('The only tool you need to run your apps on your own infra.')
        ->assertSee('From your laptop to a published app.')
        ->assertSee('Everything the stack needs, in one set of records.')
        ->assertSee("You don't manage Orbit. Your agent drives it for you.")
        ->assertSee('Install it, point it at a machine.')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();
});

it('links navigation and calls to action to page sections and GitHub', function () {
    $page = visit('/');

    $page->assertAttribute('a[href="#product"]', 'href', '#product')
        ->assertAttribute('a[href="#features"]', 'href', '#features')
        ->assertAttribute('a[href="#agents"]', 'href', '#agents')
        ->assertAttribute('a[href="#install"]', 'href', '#install')
        ->assertAttribute('a[href="https://github.com/nckrtl/orbit"]', 'href', 'https://github.com/nckrtl/orbit')
        ->assertNoJavaScriptErrors();
});
