<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\AcceptHeader;

class OrbitGuide
{
    public function requestedBy(Request $request): bool
    {
        if ($request->headers->has('X-Inertia')) {
            return false;
        }

        $accept = [];
        foreach (AcceptHeader::fromString(strtolower($request->headers->get('Accept') ?? ''))->all() as $item) {
            $accept[$item->getValue()] ??= $item;
        }
        $markdown = $accept['text/markdown'] ?? null;
        $html = $accept['text/html'] ?? null;
        $wildcard = $accept['text/*'] ?? $accept['*/*'] ?? null;

        if ($markdown !== null) {
            return $markdown->getQuality() > 0
                && $markdown->getQuality() >= (($html ?? $wildcard)?->getQuality() ?? 0);
        }

        if ($html !== null || ($accept !== [] && ($wildcard?->getQuality() ?? 0) <= 0)) {
            return false;
        }

        return Str::contains($request->userAgent() ?? '', [
            'ChatGPT-User', 'Claude-User', 'ClaudeBot', 'Perplexity-User',
            'PerplexityBot', 'GPTBot', 'OAI-SearchBot', 'anthropic-ai',
        ], ignoreCase: true);
    }

    public function response(): Response
    {
        return response(File::get(resource_path('markdown/get-started.md')), headers: [
            'Content-Type' => 'text/markdown; charset=utf-8',
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }
}
