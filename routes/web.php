<?php

use App\Http\Controllers\DocsProxyController;
use App\Http\Middleware\GenerateAndSetCspNonce;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Support\Csp\AddCspHeaders;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\Route;
use NckRtl\Waymaker\Facades\Waymaker;

Route::any('/docs/{path?}', DocsProxyController::class)
    ->where('path', '.*')
    ->withoutMiddleware([
        HandleAppearance::class,
        HandleInertiaRequests::class,
        GenerateAndSetCspNonce::class,
        AddCspHeaders::class,
        ValidateCsrfToken::class,
    ]);

Waymaker::routes();
