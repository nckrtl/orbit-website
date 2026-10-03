<?php

declare(strict_types=1);

use App\Http\Controllers\AgentDocsController;
use App\Http\Controllers\DocsProxyController;
use App\Http\Controllers\HomeController;
use App\Http\Middleware\GenerateAndSetCspNonce;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Support\Csp\AddCspHeaders;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\Route;

Route::any('/docs/{path?}', DocsProxyController::class)
    ->where('path', '.*')
    ->withoutMiddleware([
        HandleAppearance::class,
        HandleInertiaRequests::class,
        GenerateAndSetCspNonce::class,
        AddCspHeaders::class,
        ValidateCsrfToken::class,
    ])
    ->name('docs');

Route::get('/', [HomeController::class, 'show'])->name('home');

Route::get('/llms.txt', [AgentDocsController::class, 'index'])->name('agent-docs.index');
Route::get('/get-started.md', [AgentDocsController::class, 'gettingStarted'])->name('agent-docs.get-started');
Route::get('/create.md', [AgentDocsController::class, 'create'])->name('agent-docs.create');
Route::get('/conventions.md', [AgentDocsController::class, 'conventions'])->name('agent-docs.conventions');
Route::get('/herd.md', [AgentDocsController::class, 'herd'])->name('agent-docs.herd');
Route::get('/orbit.md', [AgentDocsController::class, 'orbit'])->name('agent-docs.orbit');
Route::get('/solo.md', [AgentDocsController::class, 'solo'])->name('agent-docs.solo');
