<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Support\OrbitGuide;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HomeController extends Controller
{
    public function show(Request $request, OrbitGuide $guide): Response
    {
        if ($guide->requestedBy($request)) {
            return $guide->response();
        }

        return inertia('Home', ['orbitUrl' => url('/')])->toResponse($request);
    }
}
