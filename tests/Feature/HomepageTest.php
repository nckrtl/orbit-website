<?php

use App\Providers\ToolbarConfigProvider;
use Inertia\Testing\AssertableInertia as Assert;
use NckRtl\Toolbar\Toolbar;

it('renders the homepage with the Home inertia component', function () {
    $this->get('/')
        ->assertSuccessful()
        ->assertSee('<title>Orbit</title>', escape: false)
        ->assertInertia(fn (Assert $page) => $page
            ->component('Home')
        );
});

it('renders the story homepage selected from the Orbit design system', function () {
    $this->get('/')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('Home'));

    $source = file_get_contents(resource_path('js/components/orbit/homepage.tsx'));

    expect($source)
        ->toBeString()
        ->toContain('Develop your ideas faster on your own agent-run infra.')
        ->toContain('Local development stops when your laptop does.')
        ->toContain('Move the work off your machine. Keep the control on it.')
        ->toContain('One service holding the store, the network, and the names.')
        ->toContain('Roles are the building blocks. Assemble what you need.')
        ->toContain('Codified operations, so the agent stops guessing.')
        ->toContain('That machine in the closet is a node.')
        ->toContain('One install, then tell your agent.')
        ->toContain('data-hero-constellation');
});

it('keeps Agentation local when no sync server is configured', function () {
    // The toolbar, and with it the runtime, stays off in console contexts.
    app(Toolbar::class)->config->enabledInConsole = true;

    $this->get('/')
        ->assertSuccessful()
        ->assertSee('/_toolbar-agentation/agentation.js', escape: false)
        ->assertSee('"endpoint":null', escape: false)
        ->assertDontSee('http://localhost:4747', escape: false);
})->skip(
    fn (): bool => ! ToolbarConfigProvider::agentationAddonInstalled(),
    'nckrtl/laravel-toolbar-agentation is an optional local addon.',
);
