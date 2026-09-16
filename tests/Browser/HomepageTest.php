<?php

it('composes the story for desktop columns and compact reading order', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->script('document.querySelector("[data-chapter=premise]").scrollIntoView({block:"center"})');
    $page->assertScript('() => {
        const chapter = document.querySelector("[data-chapter=premise]");
        const grid = chapter.querySelector(".orbit-story-chapter__grid").getBoundingClientRect();
        const copy = chapter.querySelector(".orbit-story-chapter__copy").getBoundingClientRect();
        const visual = chapter.querySelector(".orbit-story-chapter__visual").getBoundingClientRect();
        const split = [...document.querySelectorAll("[data-chapter]")].every(section => {
            const row = section.querySelector(".orbit-story-chapter__grid").getBoundingClientRect();
            const text = section.querySelector(".orbit-story-chapter__copy").getBoundingClientRect();
            const art = section.querySelector(".orbit-story-chapter__visual").getBoundingClientRect();
            return innerWidth > 900
                ? Math.abs(text.width / row.width - 0.4) < 0.001 && Math.abs(art.width / row.width - 0.6) < 0.001
                : section.querySelector("h2").getBoundingClientRect().bottom <= art.top && art.bottom <= section.querySelector("[data-story-copy-part=body]").getBoundingClientRect().top;
        });
        return Math.abs(grid.width - Math.min(innerWidth, 1600)) < 1
            && split
            && (innerWidth > 900 ? visual.right <= copy.left + 1 : chapter.querySelector("h2").getBoundingClientRect().bottom <= visual.top)
            && document.querySelectorAll("[data-handoff-scene] [data-server-node]").length === 1
            && chapter.querySelectorAll("[data-remote-device]").length === 3;
    }', true)->assertScript('() => {
        const element = document.querySelector("[data-chapter=premise] .orbit-story-chapter__copy");
        const regions = innerWidth > 900 ? [element] : [...element.querySelectorAll("[data-story-copy-part]")];
        const route = document.querySelector("[data-handoff-path]");
        for(let d = 0; d < route.getTotalLength(); d += 4) {
            const p = route.getPointAtLength(d).matrixTransform(route.getScreenCTM());
            if(regions.some(region=>{ const copy=region.getBoundingClientRect(), padding=getComputedStyle(region); return p.x>copy.left+parseFloat(padding.paddingLeft) && p.x<copy.right-parseFloat(padding.paddingRight) && p.y>copy.top && p.y<copy.bottom; })) return false;
        }
        return true;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['wide desktop' => 1920, 'desktop' => 1482, 'small desktop' => 1024, 'desktop breakpoint' => 901, 'tablet' => 768, 'mobile' => 390]);

it('traces toward the server during local shutdown and keeps remote devices online', function (int $width) {
    $page = visit('/')->resize($width, 1000);
    $page->script('() => {
        const scene = document.querySelector("[data-laptop]");
        window.scrollTo({top: Number(scene.dataset.scrollStart) - 1, behavior:"instant"});
    }');
    $page->assertAttribute('[data-laptop]', 'data-phase', 'running')
        ->assertAttribute('[data-handoff-route]', 'data-progress', '0.000');
    $page->script('() => {
        const scene = document.querySelector("[data-laptop]");
        window.scrollTo({top: Number(scene.dataset.scrollEnd) + 1, behavior:"instant"});
    }');
    $page->assertAttribute('[data-laptop]', 'data-phase', 'sleeping')
        ->assertScript('document.querySelectorAll("[data-preview-device][data-connection=offline]").length', 2)
        ->assertScript('Number(document.querySelector("[data-handoff-route]").dataset.progress) > 0', true)
        ->assertScript('document.querySelectorAll("[data-handoff-scene] [data-remote-device][data-connection=online]").length', 3);
    $page->script('() => { const r = document.querySelector("[data-handoff-scene]").getBoundingClientRect(); window.scrollTo({top: scrollY + r.bottom - innerHeight * 0.5, behavior:"instant"}); }');
    $page->assertAttribute('[data-handoff-route]', 'data-progress', '1.000')
        ->assertScript('document.querySelectorAll("[data-handoff-scene] [data-server-node]").length', 1)
        ->assertScript('() => {
            const labels = [...document.querySelectorAll("[data-server-label] text")].map(el => el.getBoundingClientRect());
            const hardware = [...document.querySelectorAll("[data-remote-device]")].map(el => el.getBoundingClientRect());
            // SVG group bounds include the unprojected extrusion bounding box.
            // Measure the visible server faces to avoid that phantom overlap.
            const faces = [...document.querySelectorAll("[data-server-top], [data-server-front]")].map(el => el.getBoundingClientRect());
            hardware.push({left:Math.min(...faces.map(r=>r.left)),right:Math.max(...faces.map(r=>r.right)),top:Math.min(...faces.map(r=>r.top)),bottom:Math.max(...faces.map(r=>r.bottom))});
            const apart = (a,b) => a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
            return labels.every((a, i) => labels.slice(i + 1).every(b => apart(a,b)) && hardware.every(b => apart(a,b)))
                && hardware.every((a,i) => hardware.slice(i+1).every(b => apart(a,b)));
        }', true)
        ->assertScript('document.querySelectorAll("[data-remote-process]").length', 0)
        ->assertScript('document.querySelectorAll("[data-handoff-scene] [data-remote-device][data-connection=online]").length', 3)
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 1482, 'mobile' => 390]);

it('carries the story connection from the laptop to the central server after resizing', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->assertDontSee('Your laptop can stop.')
        ->assertDontSee('Your work shouldn’t have to.')
        ->assertAttribute('[data-handoff-route]', 'data-progress', '1.000')
        ->assertScript('document.querySelectorAll("[data-handoff-scene] [data-server-node]").length', 1);
    $page->script('document.querySelector("[data-handoff-scene]").scrollIntoView({block: "center"})');
    $page->assertScript('() => {
        const point = element => new DOMPoint(element.cx.baseVal.value, element.cy.baseVal.value).matrixTransform(element.getScreenCTM());
        const line = document.querySelector("[data-handoff-path]");
        const from = line.getPointAtLength(0).matrixTransform(line.getScreenCTM());
        const to = line.getPointAtLength(line.getTotalLength()).matrixTransform(line.getScreenCTM());
        const source = point(document.querySelector("[data-handoff-source]"));
        const target = point(document.querySelector("[data-handoff-target]"));
        return Math.hypot(from.x-source.x, from.y-source.y) < 0.5
            && Math.hypot(to.x-target.x, to.y-target.y) < 0.5
            && getComputedStyle(document.querySelector("[data-chapter=premise]")).borderTopWidth === "0px"
            && document.documentElement.scrollWidth <= innerWidth;
    }', true)->assertScript('() => {
        const root = document.querySelector("[data-handoff-scene]");
        const scene = root.getBoundingClientRect();
        return [...root.querySelectorAll("[data-remote-device], [data-server-node]")].every(element => {
            const box = element.getBoundingClientRect();
            return (innerWidth<=600 || box.left >= scene.left && box.right <= scene.right) && box.top >= scene.top && box.bottom <= scene.bottom;
        });
    }', true)->assertScript('() => {
        const scene = document.querySelector("[data-handoff-scene]");
        return ["laptop", "phone", "tablet"].every(kind => {
            const link = scene.querySelector(`[data-device-link=${kind}]`);
            const point = el => new DOMPoint(el.cx.baseVal.value, el.cy.baseVal.value).matrixTransform(el.getScreenCTM());
            const from = link.getPointAtLength(0).matrixTransform(link.getScreenCTM());
            const to = link.getPointAtLength(link.getTotalLength()).matrixTransform(link.getScreenCTM());
            const device = point(scene.querySelector(`[data-remote-port=${kind}]`));
            const server = point(scene.querySelector(`[data-server-port=${kind}]`));
            return Math.hypot(from.x-server.x, from.y-server.y) < 0.5
                && Math.hypot(to.x-device.x, to.y-device.y) < 0.5;
        });
    }', true)->assertScript('document.querySelectorAll("[data-remote-process]").length', 0)
        ->assertScript('document.querySelectorAll("[data-handoff-scene] [data-remote-device][data-connection=online]").length', 3)
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 1482, 'mobile' => 390]);

it('reverses the scroll handoff while the remote hardware stays online', function (int $width) {
    $page = visit('/')->resize($width, 1000);
    $trail = '() => {
        const route = document.querySelector("[data-handoff-route]");
        const path = route.querySelector("[data-route-path]");
        const head = Number(route.dataset.progress);
        const reverse = route.dataset.direction === "reverse";
        const segments = [...route.querySelectorAll("[data-route-trail] path")];
        const span = segments.reduce((sum, segment) => sum + parseFloat(segment.style.strokeDasharray), 0);
        return getComputedStyle(path).opacity === "0"
            && getComputedStyle(route.querySelector("[data-route-trail]")).opacity === "1"
            && span * path.getTotalLength() > 90 && span * path.getTotalLength() < 110
            && segments.length === 1
            && (() => {
                const gradient = route.querySelector("[data-route-gradient]");
                const pulse = route.querySelector("[data-route-pulse]");
                return gradient.getAttribute("gradientUnits") === "userSpaceOnUse"
                    && gradient.children.length === 2
                    && gradient.firstElementChild.getAttribute("stop-opacity") === "0"
                    && gradient.lastElementChild.getAttribute("stop-opacity") === "1"
                    && segments[0].getAttribute("stroke") === `url(#${gradient.id})`
                    && Math.abs(pulse.getBoundingClientRect().width - parseFloat(getComputedStyle(segments[0]).strokeWidth)) < 0.1
                    && getComputedStyle(pulse).fill === getComputedStyle(gradient.lastElementChild).stopColor
                    && gradient.getAttribute("x2") === pulse.getAttribute("cx")
                    && gradient.getAttribute("y2") === pulse.getAttribute("cy");
            })()
            && segments.every(segment => {
                const start = -Number(segment.style.strokeDashoffset);
                const end = start + parseFloat(segment.style.strokeDasharray);
                return reverse ? start >= head - 0.002 : end <= head + 0.002;
            });
    }';
    $page->assertAttribute('[data-handoff-route]', 'data-progress', '0.000');
    $page->script('() => {
        const timeline = document.querySelector("[data-handoff-route]").dataset;
        window.scrollTo({top: (Number(timeline.scrollStart) + Number(timeline.scrollEnd)) / 2, behavior: "instant"});
    }');
    $page->assertScript('() => { const p = Number(document.querySelector("[data-handoff-route]").dataset.progress); return p > 0.45 && p < 0.55; }', true)
        ->assertAttribute('[data-handoff-route]', 'data-direction', 'forward')
        ->assertScript($trail, true);
    $page->script('() => {
        window.scrollTo({top: Number(document.querySelector("[data-handoff-route]").dataset.scrollEnd) + 2, behavior: "instant"});
    }');
    $page->assertAttribute('[data-handoff-route]', 'data-progress', '1.000')
        ->assertScript('getComputedStyle(document.querySelector("[data-handoff-route] [data-route-trail]")).opacity', '0')
        ->assertScript('document.querySelectorAll("[data-handoff-scene] [data-remote-device][data-connection=online]").length', 3);
    $page->script('() => {
        const timeline = document.querySelector("[data-handoff-route]").dataset;
        window.scrollTo({top: (Number(timeline.scrollStart) + Number(timeline.scrollEnd)) / 2, behavior: "instant"});
    }');
    $page->assertAttribute('[data-handoff-route]', 'data-direction', 'reverse')
        ->assertScript($trail, true);
    $page->script('window.scrollTo({top: 0, behavior: "instant"})');
    $page->assertAttribute('[data-handoff-route]', 'data-progress', '0.000')
        ->assertScript('getComputedStyle(document.querySelector("[data-handoff-route] [data-route-trail]")).opacity', '0')
        ->assertScript('document.querySelectorAll("[data-handoff-scene] [data-server-node]").length', 1)
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 1482, 'mobile' => 390]);

it('separates the story and capabilities with matching ticks that scroll in reverse', function (int $width, bool $reduced) {
    $page = visit('/', ['reducedMotion' => $reduced ? 'reduce' : 'no-preference'])->resize($width, 1000);
    $page->assertPresent('[data-capabilities-scroll]');
    $page->script('async () => { await document.fonts.ready; window.scrollTo({top: 400, behavior: "instant"}); }');
    $page->assertScript('() => {
        const divider = document.querySelector("[data-story-divider=reverse]");
        const [above, hatch, below] = [...divider.children];
        const original = document.querySelector("[data-story-divider=build] .orbit-story-ruler__marks");
        const marks = [...divider.querySelectorAll(".orbit-story-ruler__marks")];
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const offset = reduced ? 0 : -scrollY * 0.45;
        return divider.previousElementSibling.id === "story"
            && divider.nextElementSibling.matches(".orbit-capabilities")
            && above.matches(".orbit-story-ruler--bottom")
            && hatch.matches(".orbit-story-hatch") && below.matches(".orbit-story-ruler--top")
            && Math.abs(above.getBoundingClientRect().bottom - hatch.getBoundingClientRect().top) < 0.5
            && Math.abs(hatch.getBoundingClientRect().bottom - below.getBoundingClientRect().top) < 0.5
            && getComputedStyle(hatch).backgroundImage === getComputedStyle(document.querySelector(".orbit-story-hatch")).backgroundImage
            && [...document.querySelectorAll(".orbit-story-hatch")].every(band => {
                const style = getComputedStyle(band);
                return style.borderTopWidth === "1px" && style.borderBottomWidth === "1px"
                    && style.backgroundImage.startsWith("repeating-linear-gradient(90deg,");
            })
            && getComputedStyle(document.querySelector(".orbit-story-hero-shell")).borderBottomWidth === "0px"
            && marks.length === 2 && marks.every(mark => {
                const style = getComputedStyle(mark);
                return style.backgroundImage === getComputedStyle(original).backgroundImage
                    && style.backgroundSize === "60px 7px, 60px 15px"
                    && Math.abs(parseFloat(style.backgroundPositionX) - offset) < 0.1;
            }) && (reduced ? offset === 0 : offset < -100)
            && document.documentElement.scrollWidth <= innerWidth;
    }', true);
    $page->script('window.scrollTo({top: 200, behavior: "instant"})');
    $page->assertScript('() => {
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const marks = document.querySelector("[data-story-divider=reverse] .orbit-story-ruler__marks");
        const offset = parseFloat(getComputedStyle(marks).backgroundPositionX);
        return reduced ? offset === 0 : offset < 0 && offset > -100;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => [1440, false], 'mobile' => [390, false], 'reduced motion' => [1440, true]]);

it('moves both ticked dividers left on downward scroll and reverses upward', function (int $width, bool $reduced) {
    $page = visit('/', ['reducedMotion' => $reduced ? 'reduce' : 'no-preference'])->resize($width, 1000);
    $page->assertScript('async () => {
        await document.fonts.ready;
        const dividers = [...document.querySelectorAll("[data-story-divider]")];
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const settle = async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); };
        const offsets = divider => [...divider.querySelectorAll(".orbit-story-ruler__marks, .orbit-story-hatch")]
            .map(el => parseFloat(getComputedStyle(el).backgroundPositionX));
        for (const divider of dividers) {
            divider.scrollIntoView({block:"center", behavior:"instant"});
            await settle();
            const startY = scrollY;
            const start = offsets(divider);
            scrollTo({top:startY + 160, behavior:"instant"});
            await settle();
            const down = offsets(divider);
            const distance = scrollY - startY;
            if (distance < 150 || down.length !== 3 || !down.every((x, i) => Math.abs(x - start[i] + (reduced ? 0 : distance * .45)) < .1)) return false;
            scrollTo({top:startY, behavior:"instant"});
            await settle();
            if (!offsets(divider).every((x, i) => Math.abs(x - start[i]) < .1 && (!reduced || x === 0))) return false;
        }
        return dividers.length === 2 && document.documentElement.scrollWidth <= innerWidth;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => [2083, false], 'mobile' => [390, false], 'reduced motion' => [1440, true]]);

it('renders the Orbit story homepage without javascript or console errors', function () {
    $page = visit('/', ['reducedMotion' => 'reduce']);

    $page->assertSee('Build ideas faster on machines you own, run by your agent.')
        ->assertSee('Local development stops when your laptop does.')
        ->assertSee('Move the work. Keep the control.')
        ->assertSee('Start with one machine. Make room for what’s next.')
        ->assertSee('The foundation for the nodes and apps you run.')
        ->assertSee('Your favorite place to build.')
        ->assertSee('A steady core. Swap the rest.')
        ->assertSee('Let your agent set it up.')
        ->assertScript('document.querySelectorAll("[data-hero-constellation] circle").length >= 10', true)
        ->assertScript('document.querySelectorAll("[data-chapter]").length', 3)
        ->assertScript('document.querySelectorAll("[data-page-stars] .orbit-starfield__stars").length === 1', true)
        ->assertScript('document.querySelectorAll("[data-hero-constellation]").length', 1)
        ->assertScript('document.querySelectorAll(".orbit-story-ruler").length', 5)
        ->assertScript('document.querySelectorAll("[data-role-chip]").length', 0)
        ->assertScript('document.querySelectorAll("[id^=stage-tab-]").length', 0)
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();
});

it('presents each chapter aside as an italic striped blockquote', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);

    $page->assertScript('() => {
        const quotes = [...document.querySelectorAll("[data-story-quote]")];
        const foundationStripe = getComputedStyle(document.querySelector("[data-foundation-note]"), "::after");

        return quotes.length === 3 && quotes.every(quote => {
            const body = quote.parentElement.querySelector(":scope > p");
            const quoteStyle = getComputedStyle(quote);
            const bodyStyle = getComputedStyle(body);
            const stripe = getComputedStyle(quote, "::before");
            const expectedMargin = innerWidth > 600 && innerWidth <= 900 ? "0px" : "24px";

            return quote.tagName === "BLOCKQUOTE"
                && quoteStyle.fontStyle === "italic"
                && quoteStyle.fontSize === bodyStyle.fontSize
                && quoteStyle.marginTop === expectedMargin
                && quoteStyle.paddingBottom === "2px"
                && quoteStyle.paddingLeft === "22px"
                && stripe.width === "6px"
                && stripe.width === foundationStripe.width
                && stripe.borderLeftWidth === foundationStripe.borderLeftWidth
                && stripe.borderLeftColor === foundationStripe.borderLeftColor
                && stripe.backgroundImage === foundationStripe.backgroundImage
                && stripe.content !== "none";
        });
    }', true)
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();
})->with(['desktop' => 1767, 'tablet' => 768, 'mobile' => 390]);

it('keeps homepage typography and topology details at the reference scale', function (int $width, int $height) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, $height);

    $page->assertScript(
        '(() => { const planets = Array.from(document.querySelectorAll("[data-orbit-planet]")); return planets.length > 0 && planets.every((planet) => planet.getAttribute("vector-effect") === "non-scaling-stroke" && planet.getAttribute("stroke-width") === "1"); })()',
        true,
    )->assertScript(
        '(() => { const svg = document.querySelector("[data-story-topology]"); const label = Array.from(svg.querySelectorAll("text")).find((node) => node.textContent === "dev-01"); return parseFloat(getComputedStyle(label).fontSize) === 9; })()',
        true,
    )->assertScript(
        'Math.abs(document.querySelector("[data-hero-constellation=primary]").getBoundingClientRect().width - (innerWidth<=600 ? 780 : innerWidth<=1100 ? 1160 : Math.min(3600, innerWidth * 1.4, innerHeight * 2.2))) < 1',
        true,
    )->assertScript(
        'Math.abs(parseFloat(getComputedStyle(document.querySelector("[data-hero] h1")).fontSize) - (innerWidth<=600 ? Math.min(58,Math.max(37,innerWidth*.108)) : innerWidth<=1100 ? Math.min(72,Math.max(44,innerWidth*.075)) : window.innerHeight <= 780 ? Math.min(60, Math.max(36, window.innerWidth * 0.044)) : Math.min(80, Math.max(42, window.innerWidth * 0.05)))) < 0.1',
        true,
    )->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();
})->with([
    'desktop' => [1440, 1000],
    'short desktop' => [1280, 720],
    'wide desktop' => [1920, 1080],
    'mobile' => [390, 844],
]);

it('links navigation and calls to action to page sections and GitHub', function () {
    $page = visit('/');

    $page->assertAttribute('nav[aria-label="Primary navigation"] a[href="#story"]', 'href', '#story')
        ->assertAttribute('nav[aria-label="Primary navigation"] a[href="#build"]', 'href', '#build')
        ->assertAttribute('nav[aria-label="Primary navigation"] a[href="#install"]', 'href', '#install')
        ->assertAttribute('a[href="https://github.com/nckrtl/orbit"]', 'href', 'https://github.com/nckrtl/orbit')
        ->assertNoJavaScriptErrors();
});

it('keeps moving hero readouts attached to their planets without remounting', function (int $width) {
    $page = visit('/')->resize($width, 1000);

    $page->assertAttribute('[data-hero-constellation=primary]', 'data-animating', 'true')
        ->assertScript('() => ["h1c", "h3a", "h2b", "h4d"].every(id => {
            const readout = document.querySelector(`[data-hero-readout="${id}"]`);
            return readout && readout.querySelectorAll("text").length === 3;
        })', true)
        ->assertScript('async () => {
            const svg = document.querySelector("[data-hero-constellation=primary]");
            const readouts = Array.from(svg.querySelectorAll("[data-hero-readout]"));
            const planet = svg.querySelector("[data-hero-body=h4]");
            const initial = planet.getAttribute("transform");
            const started = performance.now();
            let stable = readouts.length === 15;
            let samples = 0;
            while (performance.now() - started < 1200) {
                for (const readout of readouts) {
                    const body = readout.parentElement;
                    const circle = body.querySelector("circle").getBoundingClientRect();
                    const matrix = readout.getScreenCTM();
                    const text = readout.querySelector("text");
                    stable = stable && readout.isConnected
                        && body.dataset.heroBody === readout.dataset.heroReadout
                        && Math.abs(matrix.e - circle.right - 10) < 0.2
                        && Math.abs(matrix.f - (circle.top + circle.height / 2) + 9) < 0.2
                        && Math.abs(parseFloat(getComputedStyle(text).fontSize) * matrix.a - 9) < 0.1;
                }
                samples++;
                await new Promise(requestAnimationFrame);
            }
            return stable && samples > 2 && planet.getAttribute("transform") !== initial
                && readouts.every((readout, index) => svg.querySelectorAll("[data-hero-readout]")[index] === readout);
        }', true)
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();
})->with(['desktop' => 1440, 'mobile' => 390]);

it('centers the wider hero and keeps its desktop title on two lines', function (int $width, int $height) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, $height);

    $page->assertScript('() => {
        const content = document.querySelector("[data-hero-content]");
        const title = content.querySelector("h1");
        const bounds = content.getBoundingClientRect();
        const style = getComputedStyle(title);
        const lines = title.getBoundingClientRect().height / parseFloat(style.lineHeight);
        const cta = content.querySelector("[data-cta]");
        return Math.abs(bounds.left + bounds.width / 2 - innerWidth / 2) < 1
            && style.textAlign === (innerWidth<=1100 ? "left" : "center")
            && getComputedStyle(content.querySelector("p")).textAlign === (innerWidth<=1100 ? "left" : "center")
            && getComputedStyle(cta).justifyContent === (innerWidth<=1100 ? "flex-start" : "center")
            && (innerWidth < 1024 || Math.abs(lines - 2) < 0.1)
            && !content.textContent.includes("composer global require")
            && (innerWidth < 1440 || Math.abs(content.querySelector("p").getBoundingClientRect().height / parseFloat(getComputedStyle(content.querySelector("p")).lineHeight) - 2) < 0.1)
            && document.documentElement.scrollWidth <= innerWidth;
    }', true)
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();
})->with([
    'annotated desktop' => [1560, 1576],
    'desktop' => [1440, 1000],
    'short desktop' => [1280, 720],
    'mobile' => [390, 844],
]);

it('pauses hero animation offscreen and resumes without resetting its orbit', function () {
    $page = visit('/');

    $page->assertAttribute('[data-hero-constellation=primary]', 'data-animating', 'true');
    $page->script('document.querySelector("#install").scrollIntoView({ behavior: "instant" })');
    $page->assertAttribute('[data-hero-constellation=primary]', 'data-animating', 'false')
        ->assertScript('async () => {
            const body = document.querySelector("[data-hero-body=h4]");
            window.pausedHeroPosition = body.getAttribute("transform");
            await new Promise(resolve => setTimeout(resolve, 200));
            return body.getAttribute("transform") === window.pausedHeroPosition;
        }', true);
    $page->script('window.scrollTo({ top: 0, behavior: "instant" })');
    $page->assertAttribute('[data-hero-constellation=primary]', 'data-animating', 'true')
        ->assertScript('() => {
            const numbers = value => value.match(/-?[\d.]+/g).map(Number);
            const before = numbers(window.pausedHeroPosition);
            const after = numbers(document.querySelector("[data-hero-body=h4]").getAttribute("transform"));
            return Math.hypot(after[0] - before[0], after[1] - before[1]) < 4;
        }', true)
        ->assertNoJavaScriptErrors();
});

it('keeps the single hero network still for reduced motion', function () {
    $page = visit('/', ['reducedMotion' => 'reduce']);

    $page->assertAttribute('[data-hero-constellation=primary]', 'data-animating', 'false')
        ->assertScript('async () => {
            const bodies = Array.from(document.querySelectorAll("[data-hero-body]"));
            const before = bodies.map(body => body.getAttribute("transform"));
            const center = bodies[0].getScreenCTM();
            await new Promise(resolve => setTimeout(resolve, 200));
            const after = bodies[0].getScreenCTM();
            return center.e === after.e && center.f === after.f
                && bodies.length === 15 && bodies.every((body, index) => body.getAttribute("transform") === before[index]);
        }', true)
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();
});

it('keeps one enlarged network centered behind the intro copy while resizing', function () {
    $page = visit('/', ['reducedMotion' => 'reduce']);

    foreach ([[1280, 720], [1440, 900], [1560, 1576], [1920, 1080], [2560, 1080]] as [$width, $height]) {
        $page->resize($width, $height)->assertScript('() => {
            const title = document.querySelector("[data-hero-content]").getBoundingClientRect();
            const centers = [...document.querySelectorAll("[data-hero-body=gateway]")].map(body => body.getScreenCTM());
            const sizes = [...document.querySelectorAll("[data-hero-constellation]")].map(svg => svg.getBoundingClientRect().width);
            return centers.length === 1 && sizes.every(size => Math.abs(size - sizes[0]) < 0.1)
                && Math.hypot(centers.reduce((sum, center) => sum + center.e, 0) / centers.length - title.left - title.width / 2,
                    centers.reduce((sum, center) => sum + center.f, 0) / centers.length - title.top - title.height / 2) < 0.1
                && sizes[0] > Math.min(innerWidth * 0.85, innerHeight * 1.1)
                && document.documentElement.scrollWidth <= innerWidth;
        }', true);
    }

    $page->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('shows one company network at half opacity with its gateway behind the central fade', function (int $width) {
    $page = visit('/')->resize($width, 1000);

    $page->assertAttribute('[data-hero-constellation=primary]', 'data-animating', 'true')
        ->assertScript('() => {
            const scene = document.querySelector("[data-hero-network]");
            const readouts = [...scene.querySelectorAll("[data-hero-readout]")];
            const gateway = scene.querySelector("[data-hero-body=gateway]").getScreenCTM();
            const bounds = scene.getBoundingClientRect();
            return getComputedStyle(scene).opacity === "0.5"
                && getComputedStyle(scene).maskImage.includes(innerWidth<=1100 ? "linear-gradient" : "rgba(0, 0, 0, 0) 55%")
                && Math.abs(gateway.e - bounds.left - parseFloat(scene.style.getPropertyValue("--orbit-center-x"))) < 0.1
                && Math.abs(gateway.f - bounds.top - parseFloat(scene.style.getPropertyValue("--orbit-center-y"))) < 0.1
                && scene.querySelectorAll("[data-hero-constellation]").length === 1
                && scene.querySelectorAll("[data-hero-satellite-ring]").length === 4
                && readouts.length === 15
                && readouts.every(readout => readout.querySelector("text:last-child").textContent.startsWith("10.1.0."))
                && readouts.every(readout => readout.querySelectorAll("text").length === 3
                    && readout.dataset.heroReadout === readout.parentElement.dataset.heroBody);
        }', true)
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();
})->with(['desktop' => 1560, 'mobile' => 390]);

it('keeps the network anchored while its nodes and signals animate', function (int $width, int $height) {
    $page = visit('/')->resize($width, $height);

    $page->assertAttribute('[data-hero-constellation=primary]', 'data-animating', 'true')
        ->assertScript('async () => {
            const network = document.querySelector(".orbit-story-constellation__inner");
            const fixedPosition = network.style.translate;
            const node = network.querySelector("[data-hero-body=h4]");
            const before = node.getAttribute("transform");
            await new Promise(resolve => setTimeout(resolve, 300));
            const horizontal = network.querySelector("[data-hero-orbit-ring=horizontal]");
            const vertical = network.querySelector("[data-hero-orbit-ring=vertical]");
            const rx = horizontal.rx.baseVal.value;
            const ry = horizontal.ry.baseVal.value;
            const evenClusters = [["h1", "h3"], ["h2", "h4"]].every((ids, ring) => {
                const points = ids.map(id => {
                    const matrix = network.querySelector(`[data-hero-body=${id}]`).transform.baseVal.consolidate().matrix;
                    const x = matrix.e - 260;
                    const y = matrix.f - 170;
                    return ring === 0 ? { x: x / rx, y: y / ry } : { x: y / vertical.rx.baseVal.value, y: -x / vertical.ry.baseVal.value };
                });
                return points.every((point, index) => {
                    const next = points[(index + 1) % points.length];
                    return Math.abs(Math.hypot(point.x, point.y) - 1) < 0.001
                        && Math.hypot(point.x + next.x, point.y + next.y) < 0.001
                        && (() => {
                            const id = ids[index];
                            const counts = { h1: 3, h3: 1, h2: 2, h4: 4 };
                            const host = network.querySelector(`[data-hero-body=${id}]`).transform.baseVal.consolidate().matrix;
                            const moons = [...network.querySelectorAll(`[data-hero-body^=${id}]`)]
                                .filter(body => body.dataset.heroBody !== id)
                                .map(body => {
                                    const matrix = body.transform.baseVal.consolidate().matrix;
                                    return { x: (matrix.e - host.e) / 58, y: (matrix.f - host.f) / 30 };
                                });
                            return moons.length === counts[id] && moons.every((moon, moonIndex) => {
                                const neighbor = moons[(moonIndex + 1) % moons.length];
                                return Math.abs(Math.hypot(moon.x, moon.y) - 1) < 0.001
                                    && Math.abs(moon.x * neighbor.x + moon.y * neighbor.y - Math.cos(2 * Math.PI / moons.length)) < 0.001;
                            });
                        })();
                });
            });
            return fixedPosition === network.style.translate && before !== node.getAttribute("transform")
                && Math.abs(rx * 0.75 - vertical.rx.baseVal.value) < 0.001 && ry === vertical.ry.baseVal.value
                && evenClusters
                && [...network.querySelectorAll("[data-hero-readout]")].every(readout => {
                    const matrix = readout.getScreenCTM();
                    return Math.abs(matrix.b) < 0.001 && Math.abs(matrix.c) < 0.001;
                });
        }', true)
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();
})->with([
    'short desktop' => [1280, 720],
    'desktop' => [1440, 900],
    'tall desktop' => [1560, 1576],
    'wide desktop' => [1920, 1080],
    'ultrawide desktop' => [2560, 1080],
    'mobile' => [390, 844],
]);

it('keeps the star texture covered while scrolling before JavaScript animation frames run', function (bool $reduced) {
    $page = visit('/', ['reducedMotion' => $reduced ? 'reduce' : 'no-preference'])->resize(1440, 1000);
    $page->assertScript('() => {
        for (const top of [400, 1600, document.documentElement.scrollHeight, 400, 0]) {
            scrollTo({top, behavior:"instant"});
            const plane = document.querySelector("[data-page-stars] .orbit-starfield__stars");
            const bounds = plane.getBoundingClientRect();
            if (bounds.top > 0 || bounds.bottom < innerHeight || bounds.height > innerHeight + 1025) return false;
        }
        return true;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['motion' => false, 'reduced motion' => true]);

it('keeps one non-fading star texture from the intro through the footer at every viewport', function (bool $reduced) {
    $page = visit('/', ['reducedMotion' => $reduced ? 'reduce' : 'no-preference'])->resize(1560, 1000);
    $page->assertScript('document.querySelector("[data-hero-content]").hasAttribute("data-exit-start")', true);
    foreach ([1560, 934, 390, 1560] as $width) {
        $page->resize($width, 1000);
        $page->script('document.querySelector("#install").scrollIntoView({behavior:"instant"})');
        $page->assertScript('() => {
            const field = document.querySelector("[data-page-stars]");
            return field !== null && field.children.length === 1
                && field.getAnimations({subtree:true}).length === 0
                && getComputedStyle(field.firstElementChild).backgroundImage !== "none";
        }', true);
    }
    $page->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['motion' => false, 'reduced motion' => true]);

it('follows three calm chapters with six responsive capability panels', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->assertScript('() => {
        const story = document.querySelector("#story");
        const bento = document.querySelector("[data-capabilities]");
        return [...story.querySelectorAll("[data-chapter]")].map(el => el.dataset.chapter).join(",") === "problem,premise,topology"
            && Boolean(story.compareDocumentPosition(bento) & Node.DOCUMENT_POSITION_FOLLOWING)
            && bento.querySelectorAll("[data-capability]").length === 6
            && !document.querySelector(".orbit-handoff-bridge")
            && story.querySelectorAll("[data-control-laptop]").length === 1;
    }', true);
    $page->script('document.querySelector("[data-capabilities]").scrollIntoView({block: "start", behavior: "instant"})');
    $page->assertSee('A private network, wherever you are.')
        ->assertSee('Your projects. Your names.')
        ->assertSee('One place to know what exists.')
        ->assertSee('See drift before it becomes an outage.')
        ->assertSee('Your agent runs it. You keep the CLI.')
        ->assertSee('Agents create nodes, apps, and rules through deterministic commands that use fewer tokens and leave less to guess. The same CLI stays in your hands.')
        ->assertSee('Every action leaves a trail.')
        ->assertSee('Every change is logged with who made it: you, or which agent. When something breaks, read what happened instead of guessing.')
        ->assertScript('document.querySelectorAll("[data-capability=activity] [data-log-entry]").length', 8)
        ->assertScript('document.querySelector("[data-capability=activity] [data-log-entry=failed]").textContent.includes("route failed")', true)
        ->assertScript('() => [...document.querySelectorAll("[data-capability]")].every(el => {
            const r = el.getBoundingClientRect();
            return r.left >= 0 && r.right <= innerWidth && el.scrollWidth <= el.clientWidth + 1;
        })', true)
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['wide desktop' => 2122, 'tablet' => 768, 'mobile' => 390]);

it('keeps expanded topology connections clear of readable node labels', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->assertScript('() => {
            const scene = document.querySelector("[data-story-topology]");
            const labels = [...scene.querySelectorAll("[data-story-readout] text")].filter(el => el.textContent && Number(getComputedStyle(el.parentElement).opacity)>0).map(el => el.getBoundingClientRect());
            if (scene.querySelector("[data-readout-backing]")) return false;
            const apart = (a,b) => a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
            if (!labels.every((a,i) => labels.slice(i+1).every(b => apart(a,b)))) return false;
            for (const wire of scene.querySelectorAll(".orbit-handoff__wire path")) {
                for (let d=0; d<wire.getTotalLength(); d+=2) {
                    const p = wire.getPointAtLength(d).matrixTransform(wire.getScreenCTM());
                    if (labels.some(r => p.x > r.left && p.x < r.right && p.y > r.top && p.y < r.bottom)) return false;
                }
            }
            return true;
        }', true)
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 1920, 'mobile' => 390]);

it('bounds intro animation work while retaining moving clusters at every viewport', function (int $width) {
    $page = visit('/')->resize($width, 900);
    $page->assertAttribute('[data-hero-constellation]', 'data-animating', 'true')
        ->assertScript('async () => {
            const svg = document.querySelector("[data-hero-constellation]");
            let positions = 0;
            let globes = 0;
            const observer = new MutationObserver(entries => {
                positions += entries.filter(entry => entry.target.matches("[data-hero-body=h4]") && entry.attributeName === "transform").length;
                globes += entries.filter(entry => entry.target.matches("[data-hero-body=h4] [data-hero-globe]")).length;
            });
            observer.observe(svg, {subtree: true, attributes: true});
            await new Promise(resolve => setTimeout(resolve, 1100));
            observer.disconnect();
            return positions > 5 && positions <= 69
                && globes > 1 && globes <= (innerWidth <= 1023 ? 12 : 18)
                && svg.querySelectorAll("[data-hero-body]").length === 15
                && svg.querySelectorAll("[data-hero-signal] path").length === 14;
        }', true)
        ->assertScript('() => {
            const field = document.querySelector("[data-page-stars]");
            return field !== null && field.children.length === 1
                && field.getAnimations({subtree:true}).length === 0
                && getComputedStyle(field.firstElementChild).backgroundImage !== "none";
        }', true)
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 1440, 'tablet' => 768, 'mobile' => 390]);

it('allocates no star animations for reduced motion', function () {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize(390, 844);
    $page->assertScript('document.querySelector("[data-page-stars]").getAnimations({subtree:true}).length', 0)
        ->assertNoJavaScriptErrors();
});

it('halves the story chapter spacing and balances its desktop connector', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->script('document.querySelector("[data-chapter=premise]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertScript('() => {
        const grid=document.querySelector("[data-chapter=premise] .orbit-story-chapter__grid");
        const padding=parseFloat(getComputedStyle(grid).paddingTop);
        if(Math.abs(padding-(innerWidth<=900?56:Math.max(56,Math.min(112,innerWidth*.07))))>1) return false;
        const compactPadding=Math.max(32,Math.min(56,innerWidth*.035));
        for(const [chapter,edge] of [["problem","paddingBottom"],["premise","paddingBottom"],["topology","paddingTop"]]) {
            const style=getComputedStyle(document.querySelector(`[data-chapter=${chapter}] .orbit-story-chapter__grid`));
            const expected=innerWidth<=900 && chapter==="problem" ? 64 : compactPadding;
            if(Math.abs(parseFloat(style[edge])-expected)>1) return false;
        }
        if(innerWidth<=900) return document.documentElement.scrollWidth<=innerWidth;
        const previousCopy=document.querySelector("[data-chapter=problem] .orbit-story-chapter__copy").getBoundingClientRect();
        const previousBottom=Math.max(previousCopy.bottom,...[...document.querySelectorAll("[data-preview-device]")].map(el=>el.getBoundingClientRect().bottom));
        const scene=document.querySelector("[data-handoff-scene]");
        const artworkTop=scene.querySelector("[data-premise-artwork]").getBoundingClientRect().top;
        const nextTop=Math.min(artworkTop,grid.querySelector(".orbit-story-chapter__copy").getBoundingClientRect().top);
        const divider=Number(document.querySelector("[data-handoff-route]").dataset.dividerY)+document.querySelector("#story").getBoundingClientRect().top;
        return divider>previousBottom&&divider<nextTop&&Math.abs((divider-previousBottom)-(nextTop-divider))<1;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['annotated desktop' => 2122, 'desktop' => 1440, 'tablet' => 768, 'mobile' => 390]);

it('joins bento panels edge to edge with single shared dividers', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->script('document.querySelector("[data-capabilities]").scrollIntoView({behavior:"instant"})');
    $page->assertScript('() => {
        const grid=document.querySelector(".orbit-capabilities__grid");
        const cards=[...grid.children], boxes=cards.map(el=>el.getBoundingClientRect());
        const style=getComputedStyle(grid);
        if(style.rowGap!=="0px"||style.columnGap!=="0px") return false;
        if(!cards.every(el=>getComputedStyle(el).borderRadius==="0px")) return false;
        const rows=innerWidth<=600?[[0],[1],[2],[3],[4],[5]]:innerWidth<=900?[[0],[1,2],[3],[4,5]]:[[0,1],[2,3],[4,5]];
        for(let row=0;row<rows.length;row++){
            const indices=rows[row];
            if(indices.length===2){
                const [a,b]=indices;
                if(Math.abs(boxes[a].right-boxes[b].left)>.5) return false;
                if(getComputedStyle(cards[a]).borderRightWidth!=="1px"||getComputedStyle(cards[b]).borderLeftWidth!=="0px") return false;
            }
            if(row<rows.length-1){
                if(Math.abs(boxes[indices[0]].bottom-boxes[rows[row+1][0]].top)>.5) return false;
                if(!indices.every(i=>getComputedStyle(cards[i]).borderBottomWidth==="1px")) return false;
            }
        }
        return cards.every(el=>el.scrollWidth<=el.clientWidth+1)&&document.documentElement.scrollWidth<=innerWidth;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['wide' => 2122, 'desktop' => 1440, 'tablet' => 768, 'mobile' => 390]);

it('connects the central server to the third section without crossing either text block', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->assertAttribute('[data-growth-route]', 'data-progress', '1.000')
        ->assertScript('() => {
            const path = document.querySelector("[data-growth-route] [data-route-path]");
            const point = el => new DOMPoint(el.cx.baseVal.value, el.cy.baseVal.value).matrixTransform(el.getScreenCTM());
            const source = point(document.querySelector("[data-growth-source]"));
            const target = point(document.querySelector("[data-growth-target]"));
            const from = path.getPointAtLength(0).matrixTransform(path.getScreenCTM());
            const to = path.getPointAtLength(path.getTotalLength()).matrixTransform(path.getScreenCTM());
            if (Math.hypot(from.x-source.x,from.y-source.y) > .5 || Math.hypot(to.x-target.x,to.y-target.y) > .5) return false;
            const copies = [...document.querySelectorAll("[data-chapter=premise] .orbit-story-chapter__copy, [data-chapter=topology] .orbit-story-chapter__copy")].map(el => {
                const r=el.getBoundingClientRect(), s=getComputedStyle(el);
                return {left:r.left+parseFloat(s.paddingLeft),right:r.right-parseFloat(s.paddingRight),top:r.top,bottom:r.bottom};
            });
            for(let d=0;d<path.getTotalLength();d+=3) {
                const p=path.getPointAtLength(d).matrixTransform(path.getScreenCTM());
                if(copies.some(r=>p.x>r.left&&p.x<r.right&&p.y>r.top&&p.y<r.bottom)) return false;
            }
            return document.documentElement.scrollWidth <= innerWidth;
        }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['wide' => 2122, 'desktop' => 1440, 'tablet' => 768, 'mobile' => 390]);

it('draws and reverses the continuation into the growing topology on scroll', function (int $width) {
    $page = visit('/')->resize($width, 1000);
    $page->assertAttribute('[data-growth-route]', 'data-progress', '0.000');
    $page->script('() => { const d=document.querySelector("[data-growth-route]").dataset; scrollTo({top:(Number(d.scrollStart)+Number(d.scrollEnd))/2,behavior:"instant"}); }');
    $page->assertScript('() => { const p=Number(document.querySelector("[data-growth-route]").dataset.progress); return p>.45&&p<.55; }', true);
    $page->script('() => { const d=document.querySelector("[data-growth-route]").dataset; scrollTo({top:Number(d.scrollEnd)+5,behavior:"instant"}); }');
    $page->assertAttribute('[data-growth-route]', 'data-progress', '1.000')
        ->assertScript('Number(document.querySelector("[data-story-topology]").dataset.networkProgress) > .5', true);
    $page->script('scrollTo({top:0,behavior:"instant"})');
    $page->assertAttribute('[data-growth-route]', 'data-progress', '0.000')
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 1440, 'mobile' => 390]);

it('paints the constellation above the incoming story connector', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->assertScript('async () => {
        await document.fonts.ready;
        const scene=document.querySelector("[data-story-topology]");
        const route=document.querySelector("[data-growth-route]");
        const orbit=scene.querySelector("[data-depth-orbit]");
        scene.scrollIntoView({block:"center",behavior:"instant"});
        await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
        // Keep the sample in view even if responsive layout settles after scrolling.
        const before=new DOMPoint(orbit.cx.baseVal.value-orbit.rx.baseVal.value,orbit.cy.baseVal.value).matrixTransform(orbit.getScreenCTM());
        scrollBy({top:before.y-innerHeight/2,behavior:"instant"});
        const crossing=new DOMPoint(orbit.cx.baseVal.value-orbit.rx.baseVal.value,orbit.cy.baseVal.value).matrixTransform(orbit.getScreenCTM());
        const sceneEvents=scene.style.pointerEvents, routeEvents=route.style.pointerEvents;
        try {
            // Enable hit testing temporarily to inspect the actual paint order
            // where the incoming horizontal line crosses the outer orbit.
            scene.style.pointerEvents="all";
            route.style.pointerEvents="all";
            const stack=document.elementsFromPoint(crossing.x,crossing.y);
            const front=stack.findIndex(el=>el.closest("[data-story-topology]"));
            const back=stack.findIndex(el=>el.closest("[data-growth-route]"));
            return front>=0 && back>=0 && front<back;
        } finally {
            scene.style.pointerEvents=sceneEvents;
            route.style.pointerEvents=routeEvents;
        }
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['wide desktop' => 2083, 'desktop' => 1440, 'mobile' => 390]);

it('animates story globes and attached connections without replacing the nodes', function (string $selector) {
    $page = visit('/')->resize(1440, 1000);
    $page->script('async () => { document.querySelector("'.$selector.'").scrollIntoView({block:"center",behavior:"instant"}); await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); }');
    $page->assertAttribute($selector, 'data-animating', 'true')
        ->assertScript('async () => {
            const svg=document.querySelector("'.$selector.'");
            const body=svg.querySelector("[data-story-node=dev-01]");
            const hatch=body.querySelector("[data-story-globe]");
            const initial=body.getAttribute("transform"), globe=hatch.getAttribute("d");
            const readout=body.querySelector("text");
            const start=performance.now();
            let samples=0;
            while(performance.now()-start<1100) {
                const path=svg.querySelector("[data-story-wire=dev]");
                const end=path.getPointAtLength(path.getTotalLength()).matrixTransform(path.getScreenCTM());
                const circle=body.querySelector("circle").getBoundingClientRect();
                const radius=circle.width/2;
                if(Math.abs(Math.hypot(end.x-circle.left-radius,end.y-circle.top-radius)-radius)>.5) return false;
                if(body.querySelector("text")!==readout) return false;
                samples++;
                await new Promise(requestAnimationFrame);
            }
            return samples>5&&initial!==body.getAttribute("transform")&&globe!==hatch.getAttribute("d");
        }', true);
    $page->script('async () => { document.querySelector("#install").scrollIntoView({behavior:"instant"}); await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); }');
    $page->assertAttribute($selector, 'data-animating', 'false')
        ->assertScript('async () => {
            const svg=document.querySelector("'.$selector.'");
            const before=svg.innerHTML;
            await new Promise(resolve=>setTimeout(resolve,250));
            return before===svg.innerHTML;
        }', true);
    $page->script('async () => { document.querySelector("'.$selector.'").scrollIntoView({block:"center",behavior:"instant"}); await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); }');
    $page->assertAttribute($selector, 'data-animating', 'true')
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['topology' => '[data-story-topology]']);

it('orbits named clusters around a fixed central Gateway with level latitudes', function (int $width) {
    $page = visit('/')->resize($width, 1000);
    $page->script('async () => {
        document.querySelector("[data-story-topology]").scrollIntoView({block:"center",behavior:"instant"});
        await document.fonts.ready;
        await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    }');
    $page->assertScript('async () => {
        const svg=document.querySelector("[data-story-topology]");
        const gateway=svg.querySelector("[data-story-node=Gateway]");
        const pose=el=>el.transform.baseVal.consolidate().matrix;
        const g=pose(gateway), view=svg.viewBox.baseVal;
        if(g.e!==540||g.f!==540) return false;
        if(svg.querySelectorAll("[data-story-cluster]").length!==2) return false;
        if(!["Gateway","dev-01","dev-02","database","worker-01"].every(id=>svg.querySelector(`[data-story-node=${id}]`))) return false;
        const initial=pose(svg.querySelector("[data-story-node=dev-01]")).e;
        for(let i=0;i<40;i++) {
            const orbit=svg.querySelector("[data-depth-orbit]");
            for(const id of ["dev-01","worker-01","dev-02"]) {
                const p=pose(svg.querySelector(`[data-story-node=${id}]`));
                const distance=((p.e-g.e)/orbit.rx.baseVal.value)**2+((p.f-g.f)/orbit.ry.baseVal.value)**2;
                if(Math.abs(distance-1)>.0001||p.b!==0||p.c!==0) return false;
            }
            for(const [host,moons] of [["dev-01",["app-1","database"]],["dev-02",["app-2","app-3"]]]) {
                const p=pose(svg.querySelector(`[data-story-node=${host}]`));
                const ring=svg.querySelector(`[data-cluster-ring=${host}]`);
                if(Math.hypot(ring.cx.baseVal.value-p.e,ring.cy.baseVal.value-p.f)>.01) return false;
                for(const moon of moons) {
                    const m=pose(svg.querySelector(`[data-story-node=${moon}]`));
                    if(Math.abs(((m.e-p.e)/ring.rx.baseVal.value)**2+((m.f-p.f)/ring.ry.baseVal.value)**2-1)>.0001) return false;
                }
            }
            if([...svg.querySelectorAll("[data-story-globe], [data-depth-orbit], [data-cluster-ring]")].some(el=>el.hasAttribute("transform"))) return false;
            await new Promise(requestAnimationFrame);
        }
        return gateway.getAttribute("transform")==="translate(540.000 540.000)"
            && Math.abs(initial-pose(svg.querySelector("[data-story-node=dev-01]")).e)>1;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 1669, 'mobile' => 390]);

it('normalizes constellation strokes sizes signals and spacing for the displayed network', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $balanced = '() => {
        const svg=document.querySelector("[data-story-topology]");
        const center=svg.querySelector("[data-story-node=Gateway]").transform.baseVal.consolidate().matrix;
        const hosts=["dev-01","dev-02","worker-01","db-01"].map(id=>svg.querySelector(`[data-story-node=${id}]`)).filter(Boolean);
        const angles=hosts.map(el=>{const p=el.transform.baseVal.consolidate().matrix;return (Math.atan2(p.f-center.f,p.e-center.e)+Math.PI*2)%(Math.PI*2);}).sort((a,b)=>a-b);
        return angles.every((angle,i)=>Math.abs((angles[(i+1)%angles.length]-angle+Math.PI*2)%(Math.PI*2)-Math.PI*2/angles.length)<.0001);
    }';
    $page->assertScript($balanced, true)
        ->assertScript('() => {
            const svg=document.querySelector("[data-story-topology]");
            const ring=svg.querySelector("[data-depth-orbit]");
            if(ring.rx.baseVal.value!==ring.ry.baseVal.value) return false;
            if(![...svg.querySelectorAll("[data-cluster-ring]")].every(el=>el.rx.baseVal.value===160&&el.ry.baseVal.value===44)) return false;
            if(![...svg.querySelectorAll("path,circle,ellipse")].every(el=>{const s=getComputedStyle(el);return s.strokeWidth==="1px"&&s.vectorEffect==="non-scaling-stroke";})) return false;
            const radius=id=>Number(svg.querySelector(`[data-story-node=${id}]`).dataset.radius);
            if(radius("Gateway")!==25.5||radius("dev-01")!==19.5||radius("app-1")!==13.5) return false;
            const wires=[...svg.querySelectorAll("[data-story-wire]")], signals=[...svg.querySelectorAll("[data-story-signal]")];
            if(signals.length!==wires.length||!wires.every(el=>el.getAttribute("stroke-dasharray")==="2 4")) return false;
            const hero=document.querySelector("[data-hero-constellation] linearGradient");
            return signals.every(el=>{
                const path=el.querySelector("path");
                const gradient=document.getElementById(path.getAttribute("stroke").slice(5,-1));
                return !el.querySelector("circle")&&path.getAttribute("d")==="M-26 0H0"
                    &&gradient.innerHTML===hero.innerHTML&&getComputedStyle(el).opacity==="0";
            });
        }', true)
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 2103, 'mobile' => 390]);

it('keeps the default constellation connected without role controls', function () {
    $page = visit('/', ['reducedMotion' => 'reduce']);
    $page->assertScript('document.querySelectorAll("[data-role-chip]").length', 0)
        ->assertScript('document.querySelectorAll("[data-story-node=dev-02], [data-story-node=app-2], [data-story-node=app-3]").length', 3)
        ->assertScript('document.querySelectorAll("[data-story-node=db-01]").length', 0)
        ->assertScript('document.querySelectorAll("[data-story-node=database]").length', 1)
        ->assertScript('() => {
            const target=document.querySelector("[data-growth-target]");
            const p=new DOMPoint(target.cx.baseVal.value,target.cy.baseVal.value).matrixTransform(target.getScreenCTM());
            const path=document.querySelector("[data-growth-route] [data-route-path]");
            const end=path.getPointAtLength(path.getTotalLength()).matrixTransform(path.getScreenCTM());
            return Math.hypot(end.x-p.x,end.y-p.y)<.5;
        }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('centers moon names vertically while preserving fixed constellation label alignment', function (int $width) {
    $page = visit('/')->resize($width, 1000);
    $page->script('async () => {
        await document.fonts.ready;
        document.querySelector("[data-story-topology]").scrollIntoView({block:"center",behavior:"instant"});
        await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    }');
    $page->assertAttribute('[data-story-topology]', 'data-animating', 'true')
        ->assertScript('async () => {
            const svg=document.querySelector("[data-story-topology]");
            const nodes=[...svg.querySelectorAll("[data-story-node]")];
            const labels=nodes.map(node=>node.querySelector("[data-story-readout]"));
            const transforms=labels.map(label=>label.getAttribute("transform"));
            const seen=new Set();
            if(labels.some(label=>label.querySelector("rect,path"))) return false;
            const shift=new DOMMatrix(getComputedStyle(svg).transform).e;
            if(innerWidth>1100 ? shift<=0 : shift!==0) return false;
            const radius=id=>Number(svg.querySelector(`[data-story-node=${id}]`).dataset.radius);
            if(radius("app-1")<=9.75 || radius("app-1")>=radius("dev-01")) return false;
            const request=window.requestAnimationFrame, cancel=window.cancelAnimationFrame;
            const pending=new Map(); let id=100000, now=performance.now();
            window.requestAnimationFrame=callback=>{pending.set(++id,callback);return id;};
            window.cancelAnimationFrame=id=>{pending.delete(id);cancel.call(window,id);};
            try {
                await new Promise(resolve=>request.call(window,resolve));
                for(let sample=0;sample<72;sample++) {
                    // Keep the same 2.5-second sample spacing and three-minute
                    // orbit, without rendering twice as many intermediate frames.
                    for(let frame=0;frame<25;frame++) {
                        now+=100;
                        const callbacks=[...pending.values()]; pending.clear();
                        callbacks.forEach(callback=>callback(now));
                    }
                    for(const [i,label] of labels.entries()) {
                        const planet=nodes[i].querySelector("[data-orbit-planet]").getBoundingClientRect();
                        const matrix=label.getScreenCTM();
                        const origin=new DOMPoint(0,0).matrixTransform(matrix);
                        if(Math.abs(origin.x-planet.right-10)>.1) return false;
                        if(nodes[i].hasAttribute("data-story-moon")) {
                            const name=label.querySelector("text").getBoundingClientRect();
                            if(Math.abs(name.top+name.height/2-(planet.top+planet.height/2))>.1) return false;
                        } else if(Math.abs(origin.y-(planet.top+planet.height/2)+9)>.1) return false;
                        if(Math.abs(matrix.a-1)>.001||Math.abs(matrix.d-1)>.001||matrix.b!==0||matrix.c!==0) return false;
                        if(!label.isConnected||label.getAttribute("transform")!==transforms[i]) return false;
                        if([...label.querySelectorAll("text")].some(text=>getComputedStyle(text).textAnchor!=="start")) return false;
                    }
                    const visible=labels.filter(label=>Number(getComputedStyle(label).opacity)>0);
                    visible.forEach(label=>seen.add(label));
                    const text=visible.flatMap(label=>[...label.querySelectorAll("text")].map(el=>el.getBoundingClientRect()));
                    if(text.some((a,i)=>text.slice(i+1).some(b=>a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom))) return false;
                    if(innerWidth>1100 && text.some(box=>box.left<0||box.right>innerWidth)) return false;
                }
                return seen.size===labels.length && document.documentElement.scrollWidth<=innerWidth;
            } finally {
                window.requestAnimationFrame=request;
                window.cancelAnimationFrame=cancel;
                pending.forEach(callback=>request.call(window,callback));
            }
        }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['wide desktop' => 2083, 'desktop' => 1440, 'mobile' => 390]);

it('keeps both story networks still and fully drawn for reduced motion', function () {
    $page = visit('/', ['reducedMotion' => 'reduce']);
    $page->assertAttribute('[data-growth-route]', 'data-progress', '1.000')
        ->assertAttribute('[data-handoff-scene]', 'data-animating', 'false')
        ->assertAttribute('[data-story-topology]', 'data-animating', 'false')
        ->assertScript('async () => {
            const scenes=[...document.querySelectorAll(".orbit-story-network")];
            const before=scenes.map(el=>el.innerHTML);
            await new Promise(resolve=>setTimeout(resolve,250));
            return scenes.every((el,i)=>el.innerHTML===before[i]&&el.dataset.networkProgress==="1.000")
                && [...document.querySelectorAll("[data-story-reveal]")].every(el=>getComputedStyle(el).opacity==="1");
        }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('keeps the server and previews online as the upper-left control laptop opens and closes', function (int $width) {
    $page = visit('/')->resize($width, 1000);
    $page->script('async () => {
        const scene=document.querySelector("[data-server-scene]");
        await document.fonts.ready;
        scene.scrollIntoView({block:"center",behavior:"instant"});
        await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
        const deadline=performance.now()+2000;
        while(!scene.dataset.scrollStart && performance.now()<deadline) await new Promise(requestAnimationFrame);
        scrollTo({top:Number(scene.dataset.scrollStart)-2,behavior:"instant"});
        await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    }');
    $page->assertAttribute('[data-server-scene]', 'data-control-phase', 'closed')
        ->assertScript('async () => {
            const el=document.querySelector("[data-server-scene]");
            const deadline=performance.now()+1000;
            while(el.dataset.animating!=="true"&&performance.now()<deadline) await new Promise(requestAnimationFrame);
            if(el.dataset.animating!=="true") throw new Error(JSON.stringify({data:el.dataset,rect:el.getBoundingClientRect(),scrollY,innerHeight,hidden:document.hidden,motion:matchMedia("(prefers-reduced-motion: reduce)").matches}));
            return true;
        }', true)
        ->assertScript('async () => {
            const scene=document.querySelector("[data-server-scene]");
            const led=scene.querySelector("[data-server-activity]");
            const signal=scene.querySelector("[data-server-signal]");
            const opacity=getComputedStyle(led).opacity, dash=getComputedStyle(signal).strokeDashoffset;
            const face=scene.querySelector("[data-control-face]");
            const pose=face.getAttribute("transform");
            await new Promise(resolve=>setTimeout(resolve,350));
            return getComputedStyle(led).opacity!==opacity && getComputedStyle(signal).strokeDashoffset!==dash
                && face===scene.querySelector("[data-control-face]") && face.getAttribute("transform")===pose;
        }', true);
    $page->script('async () => {
        const d=document.querySelector("[data-server-scene]").dataset;
        scrollTo({top:(Number(d.scrollStart)+Number(d.scrollEnd))/2,behavior:"instant"});
        await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    }');
    $page->assertAttribute('[data-server-scene]', 'data-control-phase', 'opening');
    $page->script('async () => {
        scrollTo({top:Number(document.querySelector("[data-server-scene]").dataset.scrollEnd)+2,behavior:"instant"});
        await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    }');
    $page->assertAttribute('[data-server-scene]', 'data-control-phase', 'open')
        ->assertAttribute('[data-server-node]', 'data-state', 'running')
        ->assertScript('document.querySelectorAll("[data-server-scene] [data-remote-preview=loaded]").length', 2)
        ->assertScript('document.querySelectorAll("[data-server-scene] [data-remote-device][data-connection=online]").length', 3);
    $page->script('async () => {
        scrollTo({top:Number(document.querySelector("[data-server-scene]").dataset.scrollStart)-2,behavior:"instant"});
        await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    }');
    $page->assertAttribute('[data-server-scene]', 'data-control-phase', 'closed');
    $page->script('async () => {
        document.querySelector("#install").scrollIntoView({behavior:"instant"});
        await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    }');
    $page->assertAttribute('[data-server-scene]', 'data-animating', 'false')
        ->assertScript('async () => {
            const scene=document.querySelector("[data-server-scene]");
            const animations=scene.getAnimations({subtree:true});
            const before=animations.map(a=>a.currentTime);
            await new Promise(resolve=>setTimeout(resolve,200));
            return animations.length===9 && animations.every((a,i)=>a.playState==="paused"&&a.currentTime===before[i]);
        }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 1440, 'mobile' => 390]);

it('uses rounded hardware depth and the same projection for the server devices and cables', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->assertScript('() => {
        const scene=document.querySelector("[data-server-scene]");
        const phone=scene.querySelector("[data-remote-device=phone]"), tablet=scene.querySelector("[data-remote-device=tablet]");
        const a=phone.getCTM(), b=tablet.getCTM();
        const cube=scene.querySelector("[data-server-node]").transform.baseVal.consolidate().matrix;
        const phoneMatrix=phone.transform.baseVal.consolidate().matrix;
        if(Math.abs(cube.a-.75)>.001||Math.abs(cube.d-.75)>.001
            ||Math.abs(phoneMatrix.a-Math.cos(25*Math.PI/180)*.75)>.001) return false;
        if(!["a","b","c","d"].every(k=>Math.abs(a[k]-b[k])<.001)) return false;
        const p=phone.querySelector("[data-remote-shell]"), t=tablet.querySelector("[data-remote-shell]");
        if(p.width.baseVal.value/p.height.baseVal.value!==.5 || t.width.baseVal.value<=t.height.baseVal.value) return false;
        if(![...scene.querySelectorAll("[data-remote-shell], [data-server-top]")].every(el=>el.rx.baseVal.value>0)) return false;
        if(![phone,tablet].every(el=>el.querySelector("[data-remote-wall]").getBBox().height>0)) return false;
        const close=(x,y)=>Math.abs(x-y)<.01;
        for(const path of scene.querySelectorAll("[data-device-link]")) {
            const coords=path.getAttribute("d").match(/-?[\d.]+/g).map(Number);
            for(let i=2;i<coords.length;i+=2){
                const dx=coords[i]-coords[i-2],dy=coords[i+1]-coords[i-1];
                if(!close(dy/dx,a.b/a.a)&&!close(dy/dx,a.d/a.c)) return false;
            }
            const screens=[...scene.querySelectorAll("[data-remote-shell], [data-control-face] > rect")];
            for(let distance=2;distance<path.getTotalLength()-2;distance+=2){
                const point=path.getPointAtLength(distance).matrixTransform(path.getScreenCTM());
                if(screens.some(face=>face.isPointInFill(point.matrixTransform(face.getScreenCTM().inverse())))) return false;
            }
        }
        // Phone uses the near wall; tablet connects directly to its left edge.
        for(const el of [phone,tablet]){
            const kind=el.dataset.remoteDevice, shell=el.querySelector("[data-remote-shell]");
            const dot=scene.querySelector(`[data-remote-port=${kind}]`);
            const point=new DOMPoint(dot.cx.baseVal.value,dot.cy.baseVal.value).matrixTransform(dot.getScreenCTM()).matrixTransform(el.getScreenCTM().inverse());
            if(kind==="tablet") {
                if(Math.abs(point.x)>.01||Math.abs(point.y-shell.height.baseVal.value/2)>.01) return false;
            } else if(point.x<=0||point.x>=shell.width.baseVal.value||point.y<=shell.height.baseVal.value) return false;
        }
        return !scene.querySelector("[data-story-node], [data-client-square]") && ![...scene.querySelectorAll("text")].some(el=>/^(PHONE|TABLET)$/.test(el.textContent));
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 1440, 'mobile' => 390]);

it('omits the server corner seam and sends its bottom connection downward clear of the devices', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->script('document.querySelector("[data-server-scene]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertAttribute('[data-server-scene]', 'data-control-phase', 'open')
        ->assertScript('() => {
            const svg=document.querySelector("[data-server-scene]");
            if(svg.querySelector("[data-server-corner]")) return false;
            const laptop=svg.querySelector("[data-control-laptop]").getBoundingClientRect();
            const top=svg.querySelector("[data-server-top]").getBoundingClientRect();
            if(laptop.right>=top.left) return false;
            const path=document.querySelector("[data-growth-route] [data-route-path]");
            const start=path.getPointAtLength(0).matrixTransform(path.getScreenCTM());
            const below=path.getPointAtLength(30).matrixTransform(path.getScreenCTM());
            if(Math.abs(start.x-below.x)>.1||below.y-start.y<29) return false;
            const source=svg.querySelector("[data-growth-source]");
            const topPort=svg.querySelector("[data-handoff-target]");
            const incoming=new DOMPoint(topPort.cx.baseVal.value,topPort.cy.baseVal.value).matrixTransform(topPort.getScreenCTM());
            const local=start.matrixTransform(svg.querySelector("[data-server-front]").getScreenCTM().inverse());
            if(Math.abs(start.x-incoming.x)>.5 || Math.abs(local.y-150)>.5 || local.x<=0 || local.x>=150) return false;
            const tablet=svg.querySelector("[data-device-link=tablet]");
            for(let d=0;d<tablet.getTotalLength();d+=2){
                const p=tablet.getPointAtLength(d).matrixTransform(tablet.getScreenCTM());
                if(p.y>=start.y && p.x<start.x+5) return false;
            }
            const surfaces=[...svg.querySelectorAll("[data-remote-shell], [data-control-face] > rect")];
            const texts=[...svg.querySelectorAll("text")].filter(el=>el.getAttribute("visibility")!=="hidden").map(el=>el.getBoundingClientRect());
            for(let d=3;d<path.getTotalLength();d+=3){
                const p=path.getPointAtLength(d).matrixTransform(path.getScreenCTM());
                if(surfaces.some(el=>el.isPointInFill(p.matrixTransform(el.getScreenCTM().inverse())))) return false;
                if(texts.some(r=>p.x>r.left&&p.x<r.right&&p.y>r.top&&p.y<r.bottom)) return false;
            }
            return source!==null && source.r.baseVal.value===0;
        }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['wide' => 2122, 'desktop' => 1440, 'tablet' => 768, 'mobile' => 390]);

it('shows a cube Gateway with CPU telemetry vertical drives and a perforated side', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->script('document.querySelector("[data-server-scene]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertScript('() => {
        const scene=document.querySelector("[data-server-scene]");
        const top=scene.querySelector("[data-server-top]");
        if(top.width.baseVal.value!==top.height.baseVal.value) return false;
        if(top.parentElement.querySelectorAll("rect").length!==1||top.parentElement.querySelector("text").textContent!=="Gateway") return false;
        const drives=[...scene.querySelectorAll("[data-drive-slot] > rect:first-child")];
        const pattern=scene.querySelector("[data-server-perforations]");
        const id=pattern.getAttribute("fill").slice(5,-1);
        if(drives.length!==5||!drives.every(el=>el.height.baseVal.value>el.width.baseVal.value*3)) return false;
        if(!document.getElementById(id)?.querySelector("circle")) return false;
        return scene.querySelector("[data-cpu-display]")!==null && scene.querySelectorAll("[data-cpu-trace] path").length===2
            && getComputedStyle(scene.querySelector(".orbit-server__plot")).overflow==="hidden";
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 1440, 'mobile' => 390]);

it('shrinks the control laptop and keeps the early opening and device ports aligned', function (int $width) {
    $page = visit('/')->resize($width, 1000);
    $page->script('async () => {
        await document.fonts.ready;
        document.querySelector("[data-server-scene]").scrollIntoView({block:"center",behavior:"instant"});
        await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    }');
    $page->assertScript('() => {
        const scene=document.querySelector("[data-server-scene]");
        const rect=scene.getBoundingClientRect(), d=scene.dataset;
        rect.y-=new DOMMatrix(getComputedStyle(scene.closest(".orbit-story-chapter__grid")).transform).m42;
        const start=rect.top+scrollY+rect.height*.12-innerHeight*.88;
        const distance=Math.max(180,Math.min(280,rect.height*.4));
        if(Math.abs(Number(d.scrollStart)-start)>1||Math.abs(Number(d.scrollEnd)-start-distance)>1) return false;
        const scale=scene.querySelector("[data-remote-device=laptop]").transform.baseVal.consolidate().matrix;
        if(Math.abs(scale.a-1.12*.75)>.001||Math.abs(scale.d-1.12*.75)>.001) return false;
        if(getComputedStyle(scene.querySelector("[data-control-laptop] .orbit-laptop__wall")).fill
            !==getComputedStyle(scene.querySelector("[data-remote-wall]")).fill) return false;
        const point=el=>new DOMPoint(el.cx.baseVal.value,el.cy.baseVal.value).matrixTransform(el.getScreenCTM());
        for(const kind of ["phone","tablet"]){
            const device=scene.querySelector(`[data-remote-device=${kind}]`);
            const shell=device.querySelector("[data-remote-shell]");
            const projected=point(scene.querySelector(`[data-remote-port=${kind}]`));
            const center=(kind==="tablet" ? new DOMPoint(0,shell.height.baseVal.value/2) : new DOMPoint(shell.width.baseVal.value/2,shell.height.baseVal.value)).matrixTransform(device.getScreenCTM());
            if(Math.abs(projected.x-center.x)>.1) return false;
            if(kind==="tablet" ? Math.abs(projected.y-center.y)>.1 : projected.y<=center.y) return false;
        }
        const phone=scene.querySelector("[data-remote-device=phone]").transform.baseVal.consolidate().matrix;
        const tablet=scene.querySelector("[data-remote-device=tablet]").transform.baseVal.consolidate().matrix;
        const coords=scene.querySelector("[data-device-link=phone]").getAttribute("d").match(/-?[\d.]+/g).map(Number);
        const frontCorner=new DOMPoint(0,150).matrixTransform(scene.querySelector("[data-server-front]").getScreenCTM());
        const sideCorner=new DOMPoint(0,150).matrixTransform(scene.querySelector("[data-server-side]").getScreenCTM());
        const laptopPort=point(scene.querySelector("[data-server-port=laptop]"));
        const phonePort=point(scene.querySelector("[data-server-port=phone]"));
        return Math.hypot(laptopPort.x-frontCorner.x,laptopPort.y-frontCorner.y)<.1
            && Math.hypot(phonePort.x-sideCorner.x,phonePort.y-sideCorner.y)<.1
            && phone.e>575&&phone.f<240&&tablet.e>525&&tablet.f>390
            && coords[2]>coords[0]&&coords[5]<coords[3];
    }', true)->assertScript('async () => {
        const trace=document.querySelector("[data-cpu-trace]");
        const before=getComputedStyle(trace).transform;
        await new Promise(resolve=>setTimeout(resolve,250));
        return before!==getComputedStyle(trace).transform;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 1440, 'mobile' => 390]);

it('insets the smaller premise laptop and gives the tablet a direct uncluttered zigzag', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->script('document.querySelector("[data-server-scene]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertScript('() => {
        const scene=document.querySelector("[data-server-scene]");
        const laptop=scene.querySelector("[data-remote-device=laptop]").getBoundingClientRect();
        const container=scene.closest(".orbit-story-chapter__grid").getBoundingClientRect();
        const boundary=innerWidth>900 ? container.left : scene.getBoundingClientRect().left;
        const sceneScale=scene.getScreenCTM().a;
        if(innerWidth>600 && (laptop.left-boundary<20*sceneScale||laptop.left-boundary>40*sceneScale)) return false;
        if(scene.querySelector("[data-server-label], .orbit-handoff__caption")) return false;
        const path=scene.querySelector("[data-device-link=tablet]");
        const coords=path.getAttribute("d").match(/-?[\\d.]+/g).map(Number);
        if(coords.length!==8) return false;
        const [x0,y0,x1,y1,x2,y2,x3,y3]=coords;
        const port=scene.querySelector("[data-server-port=tablet]");
        const edge=new DOMPoint(port.cx.baseVal.value,port.cy.baseVal.value).matrixTransform(port.getScreenCTM());
        const cableStart=path.getPointAtLength(0).matrixTransform(path.getScreenCTM());
        if(Math.hypot(edge.x-cableStart.x,edge.y-cableStart.y)>.5) return false;
        if(!(x1>x0&&y1>y0&&x2<x1&&y2>y1&&x3>x2&&y3>y2)) return false;
        if(x1>=x3) return false;
        const tablet=scene.querySelector("[data-remote-device=tablet]");
        const shell=tablet.querySelector("[data-remote-shell]");
        const endpoint=path.getPointAtLength(path.getTotalLength()).matrixTransform(path.getScreenCTM()).matrixTransform(tablet.getScreenCTM().inverse());
        if(Math.abs(endpoint.x)>.1||Math.abs(endpoint.y-shell.height.baseVal.value/2)>.1) return false;
        const growth=scene.querySelector("[data-growth-source]");
        const growthPoint=new DOMPoint(growth.cx.baseVal.value,growth.cy.baseVal.value).matrixTransform(growth.getScreenCTM()).matrixTransform(scene.getScreenCTM().inverse());
        return Math.min(x0,x1,x2,x3)>growthPoint.x+8
            && document.documentElement.scrollWidth<=innerWidth;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['wide' => 2122, 'desktop' => 1440, 'tablet' => 768, 'mobile' => 390]);

it('opens the control laptop gradually from the same early scroll position', function (int $width, int $height) {
    $page = visit('/')->resize($width, $height);
    $page->script('async () => {
        await document.fonts.ready;
        const scene=document.querySelector("[data-server-scene]");
        scrollTo({top:scene.getBoundingClientRect().top+scrollY-innerHeight*.95,behavior:"instant"});
        await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    }');
    $page->assertAttribute('[data-server-scene]', 'data-control-phase', 'closed');
    $page->assertScript('async () => {
        const scene=document.querySelector("[data-server-scene]");
        const rect=scene.getBoundingClientRect();
        rect.y-=new DOMMatrix(getComputedStyle(scene.closest(".orbit-story-chapter__grid")).transform).m42;
        const start=rect.top+scrollY+rect.height*.12-innerHeight*.88;
        if(Math.abs(Number(scene.dataset.scrollStart)-start)>1) return false;
        const poses=[];
        for(const offset of [90,150]) {
            scrollTo({top:start+offset,behavior:"instant"});
            await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
            if(scene.dataset.controlPhase!=="opening") return false;
            poses.push(scene.querySelector("[data-control-face]").getAttribute("transform"));
        }
        return poses[0]!==poses[1];
    }', true);
    $page->script('async () => {
        const scene=document.querySelector("[data-server-scene]");
        const bounds=scene.getBoundingClientRect();
        bounds.y-=new DOMMatrix(getComputedStyle(scene.closest(".orbit-story-chapter__grid")).transform).m42;
        scrollTo({top:bounds.top+scrollY-innerHeight*.5,behavior:"instant"});
        await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    }');
    $page->assertAttribute('[data-server-scene]', 'data-control-phase', 'open')
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['wide' => [2122, 1576], 'annotated' => [1669, 1214], 'desktop' => [1440, 1000], 'mobile' => [390, 844]]);

it('illustrates custom namespaces and the shared inventory beneath a centered heading', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->script('document.querySelector("[data-capabilities]").scrollIntoView({behavior:"instant"})');
    $page->assertScript('() => {
        const cards = [...document.querySelectorAll("[data-capability]")];
        if (cards.some(card => card.querySelector(".orbit-label"))) return false;
        const section = document.querySelector("[data-capabilities]");
        if (section.querySelector(".orbit-capability__number, .orbit-capabilities__intro")) return false;
        const grid = section.querySelector(".orbit-capabilities__grid").getBoundingClientRect();
        const heading=section.querySelector("h2");
        if(innerWidth>=1024 && heading.getBoundingClientRect().height>parseFloat(getComputedStyle(heading).lineHeight)+1) return false;
        if (![section.querySelector(".orbit-capabilities__inner > .orbit-label"), section.querySelector("h2")].every(el => {
            const rect = el.getBoundingClientRect();
            return innerWidth<=600 ? Math.abs(rect.left-grid.left)<1 : getComputedStyle(el).textAlign === "center"
                && Math.abs((rect.left + rect.right) / 2 - (grid.left + grid.right) / 2) < 1;
        })) return false;
        if (!cards.every(card => {
            const accents = card.querySelector(".orbit-capability__corners");
            const corners = [...accents.children];
            const cornerStyles = corners.every(corner => {
                const style = getComputedStyle(corner);
                const [vertical, horizontal] = corner.dataset.corner.split("-");
                const rect = corner.getBoundingClientRect();
                const bounds = accents.getBoundingClientRect();
                return style.width === "5px" && style.height === "5px"
                    && style.getPropertyValue(`border-${vertical}-width`) === "1px"
                    && style.getPropertyValue(`border-${horizontal}-width`) === "1px"
                    && style.borderTopColor === "rgb(77, 77, 86)"
                    && Math.abs(rect[vertical] - bounds[vertical]) < 1
                    && Math.abs(rect[horizontal] - bounds[horizontal]) < 1;
            });
            const drawing = card.querySelector(".orbit-capability__drawing").getBoundingClientRect();
            const heading = card.querySelector("h3").getBoundingClientRect();
            return getComputedStyle(card.querySelector("p")).fontSize === (innerWidth<=600 ? "15px" : "16px")
                && corners.length === 4 && cornerStyles
                && getComputedStyle(accents).opacity === "1"
                && ["top", "right", "bottom", "left"].every(side => getComputedStyle(accents)[side] === "-1px")
                && (innerWidth>600 && innerWidth<=900 && ["wireguard","doctor"].includes(card.dataset.capability) ? drawing.right<heading.left : drawing.bottom<=heading.top)
                && card.scrollWidth <= card.clientWidth + 1;
        })) return false;
        const network = cards[0];
        const mark = network.querySelector("[data-wireguard-mark]");
        if (!mark || getComputedStyle(mark).fill !== "rgb(255, 255, 255)") return false;
        const dragon = mark.querySelector("path");
        // The original badge filled the edge of the viewBox. Only the dragon remains.
        if (dragon.isPointInFill(new DOMPoint(1, 12))
            || !dragon.isPointInFill(new DOMPoint(8, 10))) return false;
        if (!["phone", "tablet"].every(kind => network.querySelector(`[data-remote-device=${kind}] [data-remote-preview=loaded]`))) return false;
        if (![...network.querySelectorAll("[data-remote-device]")].every(device => {
            const matrix = device.getCTM();
            const shell = device.querySelector("[data-remote-shell]");
            const bounds = shell.getBoundingClientRect();
            return matrix.b > 0 && matrix.c < 0
                && bounds.width > 0 && bounds.height > 0
                && device.querySelector("[data-remote-wall]");
        })) return false;
        const names = [...cards[1].querySelectorAll(".orbit-capability__tld")].map(el => el.textContent);
        if (names.join(",") !== ".orbit,.internal,.test") return false;
        const inventory = [...cards[2].querySelectorAll("svg text")].map(el => el.textContent);
        const agent = section.querySelector("[data-capability=agents]");
        const viewport = agent.querySelector(".orbit-capability__drawing--agents");
        const viewportBounds = viewport.getBoundingClientRect();
        const viewportStyle = getComputedStyle(viewport);
        const scene = agent.querySelector("[data-agent-network]");
        const projection = scene.getScreenCTM();
        const titleBounds = agent.querySelector("h3").getBoundingClientRect();
        if (Math.abs(titleBounds.top-viewportBounds.bottom-(innerWidth<=600?24:20))>1) return false;
        const sceneBounds = scene.getBoundingClientRect();
        // The orbital plane has equal room and equal fading at both vertical edges.
        if (Math.abs((sceneBounds.top + sceneBounds.bottom - viewportBounds.top - viewportBounds.bottom) / 2) > 1) return false;
        const fadeStops = [...viewportStyle.maskImage.matchAll(/([\d.]+)%/g)].map(match => Number(match[1]));
        if (fadeStops.length !== 2 || Math.abs(fadeStops[0] + fadeStops[1] - 100) > .01) return false;
        if (getComputedStyle(agent).paddingTop !== "0px" || Math.abs(viewportBounds.top-agent.getBoundingClientRect().top)>1) return false;
        if (viewportBounds.height + 1 < Math.min(680, viewportBounds.width) * 350 / 720
            || viewportStyle.overflow !== "hidden" || !viewportStyle.maskImage.includes("linear-gradient")
            || Math.abs(scene.getBoundingClientRect().width - viewportBounds.width * (innerWidth<=600?1.55:1.1)) > 1
            || Math.abs(projection.a - projection.d) > .001 || projection.b !== 0 || projection.c !== 0) return false;
        const planets = [...agent.querySelectorAll("[data-agent-planet]")];
        const links = [...agent.querySelectorAll("[data-agent-link]")];
        if (![...section.querySelectorAll("[data-agent-planet] > *, [data-capability-planet] > *, [data-namespace-gateway] > *")].every(el => {
            const style = getComputedStyle(el);
            return style.strokeWidth === "1px" && style.vectorEffect === "non-scaling-stroke";
        })) return false;
        if (agent.querySelectorAll("[data-agent-platform]").length !== 1 || agent.querySelector("svg text")
            || [...agent.querySelectorAll("[data-agent-icon]")].map(el => el.dataset.agentIcon).join(",") !== "hermesagent,openclaw,grok") return false;
        if (planets.length !== 8 || links.length !== 8 || !planets.every((planet, index) => {
            const circle = planet.querySelector("circle");
            const stripes = planet.querySelector("path");
            if (!stripes?.getAttribute("d").includes("a")) return false;
            const center = new DOMPoint(0, 0).matrixTransform(circle.getScreenCTM());
            const link = links[index];
            const end = link.getPointAtLength(link.getTotalLength()).matrixTransform(link.getScreenCTM());
            return Math.hypot(center.x - end.x, center.y - end.y) < 1;
        })) return false;
        const planet=cards[2].querySelector("[data-capability-planet]");
        if(!planet?.querySelector("circle") || !planet.querySelector("path")?.getAttribute("d").includes("a")) return false;
        const bounds=planet.getBoundingClientRect();
        if(Math.abs(bounds.width-bounds.height)>1 || cards[2].querySelector("ellipse")) return false;
        return inventory.join(",") === "nodes,apps,databases,routes,tools"
            && document.documentElement.scrollWidth <= innerWidth;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 1669, 'tablet' => 768, 'mobile' => 390]);

it('keeps capability copy within its panels and separates the build section', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1214);
    $page->script('document.querySelector("[data-capabilities]").scrollIntoView({behavior:"instant"})');
    $page->assertScript('() => {
        const cards = [...document.querySelectorAll("[data-capability]")];
        if (!cards.every(card => {
            const style = getComputedStyle(card);
            const bounds = card.getBoundingClientRect();
            const text = card.querySelector("p").getBoundingClientRect();
            const bottomPadding = bounds.bottom - parseFloat(style.borderBottomWidth) - text.bottom;
            return bottomPadding >= parseFloat(style.paddingBottom)-1
                && card.querySelector("h3").getBoundingClientRect().bottom <= text.top;
        })) return false;
        if (innerWidth > 900 && ![0, 2, 4].every(i =>
            Math.abs(cards[i].querySelector("p").getBoundingClientRect().bottom - cards[i + 1].querySelector("p").getBoundingClientRect().bottom) < 1
        )) return false;
        const build = document.querySelector("#build");
        const divider = build.previousElementSibling;
        const [above, hatch, below] = divider.children;
        return divider.dataset.storyDivider === "build"
            && divider.previousElementSibling.hasAttribute("data-capabilities")
            && above.matches(".orbit-story-ruler--bottom")
            && hatch.matches(".orbit-story-hatch")
            && below.matches(".orbit-story-ruler--top")
            && Math.abs(divider.getBoundingClientRect().width - innerWidth) < 1
            && getComputedStyle(build).borderTopWidth === "0px"
            && getComputedStyle(build).paddingTop === getComputedStyle(document.querySelector(".orbit-capabilities__inner")).paddingBottom
            && document.documentElement.scrollWidth <= innerWidth;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['wide desktop' => 2103, 'desktop' => 1440, 'tablet' => 768, 'mobile' => 390]);

it('lets the intro constellation flow into the story without a divider or clipped planets', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 900);
    $page->assertScript('() => {
        const shell=document.querySelector(".orbit-story-hero-shell");
        const story=document.querySelector("#story");
        const network=shell.querySelector("[data-hero-network]");
        const bounds=network.getBoundingClientRect();
        const shapes=[...network.querySelectorAll("circle,ellipse,text")];
        return shell.nextElementSibling===story && !shell.querySelector(".orbit-story-ruler")
            && getComputedStyle(shell).overflowY==="visible"
            && Math.abs(shell.getBoundingClientRect().bottom-story.getBoundingClientRect().top)<1
            && (innerWidth<=1100 ? getComputedStyle(network).overflow==="hidden" : shapes.every(el=>el.getBoundingClientRect().bottom<=bounds.bottom+1))
            && (innerWidth<1000 || bounds.bottom>shell.getBoundingClientRect().bottom+50)
            && document.querySelectorAll("[data-story-divider] .orbit-story-hatch").length===2
            && document.documentElement.scrollWidth<=innerWidth;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 2083, 'mobile' => 390]);

it('pauses the overflowing intro constellation once its scroll fade is fully transparent', function () {
    $page = visit('/')->resize(2083, 900);
    $page->script('window.scrollTo({top: document.querySelector(".orbit-story-hero-shell").getBoundingClientRect().bottom+scrollY+20, behavior:"instant"})');
    $page->assertAttribute('[data-hero-constellation]', 'data-animating', 'false')
        ->assertScript('async () => {
            const shell=document.querySelector(".orbit-story-hero-shell").getBoundingClientRect();
            const scene=document.querySelector("[data-hero-network]");
            const network=scene.getBoundingClientRect();
            const body=document.querySelector("[data-hero-body=h4]");
            const before=body.getAttribute("transform");
            await new Promise(resolve=>setTimeout(resolve,200));
            return shell.bottom<0 && network.bottom>0 && getComputedStyle(scene).opacity==="0"
                && body.getAttribute("transform")===before;
        }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('settles the hero title gently while preserving its centered anchor', function () {
    $page = visit('/')->resize(1440, 1000);
    $page->assertScript('() => document.querySelector("[data-hero-content]").hasAttribute("data-scroll-pinned")', true);
    $page->assertScript('async () => {
        const content = document.querySelector("[data-hero-content]");
        const entrance = content.querySelector("[data-hero-enter=title]");
        const animation = entrance.getAnimations()[0];
        if (!animation) return false;
        animation.pause();
        animation.currentTime = 0;
        const first = entrance.getBoundingClientRect();
        const initiallyHidden = Number(getComputedStyle(entrance).opacity) === 0;
        const duration = Number(animation.effect.getTiming().duration);
        animation.currentTime = duration / 4;
        const earlyOpacity = Number(getComputedStyle(entrance).opacity);
        animation.currentTime = duration / 2;
        const middle = entrance.getBoundingClientRect();
        const middleOpacity = Number(getComputedStyle(entrance).opacity);
        animation.finish();
        const last = entrance.getBoundingClientRect();
        const anchor = content.getBoundingClientRect();
        return initiallyHidden && first.top > middle.top && middle.top > last.top
            && first.top - last.top <= 8.1
            && duration >= 1400 && earlyOpacity > 0 && earlyOpacity < 0.3
            && middleOpacity > 0 && middleOpacity < 1
            && Number(getComputedStyle(entrance).opacity) === 1
            && Math.abs(anchor.top + anchor.height / 2 - innerHeight / 2) < 1;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('shows hero copy immediately on mobile and with reduced motion', function (int $width, bool $reduced) {
    $page = visit('/', ['reducedMotion' => $reduced ? 'reduce' : 'no-preference'])->resize($width, 1000);
    $page->assertScript('() => {
        const entrance = document.querySelector("[data-hero-entrance]");
        return entrance.getAnimations({subtree: true}).length === 0
            && [...entrance.querySelectorAll("[data-hero-enter]")].every(element => getComputedStyle(element).opacity === "1")
            && getComputedStyle(entrance).opacity === "1"
            && getComputedStyle(entrance).transform === "none"
            && getComputedStyle(entrance).translate === "none";
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['mobile' => [390, false], 'reduced motion' => [1440, true]]);

it('anchors desktop hero copy at the center and reverses its downward scroll fade', function (int $width, int $height, bool $reduced) {
    $page = visit('/', ['reducedMotion' => $reduced ? 'reduce' : 'no-preference'])->resize($width, $height);
    $page->assertScript('() => document.querySelector("[data-hero-content]").hasAttribute("data-scroll-pinned")', true);
    $page->assertScript('async () => {
        await document.fonts.ready;
        const content = document.querySelector("[data-hero-content]");
        const entrance = content.querySelector("[data-hero-entrance]");
        entrance.getAnimations({subtree: true}).forEach(animation => animation.finish());
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        for (const progress of [0, 0.1, 0.3, 0.6, 1.5, 0.3, 0.1, 0]) {
            scrollTo({top: innerHeight * progress, behavior: "instant"});
            await new Promise(requestAnimationFrame);
            await new Promise(requestAnimationFrame);
            const rect = content.getBoundingClientRect();
            const textRect = entrance.getBoundingClientRect();
            const style = getComputedStyle(content);
            const actualProgress = scrollY / innerHeight;
            const expected = reduced ? Number(actualProgress < 0.3) : 1 - Math.min(1, Math.max(0,
                (scrollY - Number(content.dataset.exitStart)) / (Number(content.dataset.exitEnd) - Number(content.dataset.exitStart))));
            if (style.position !== "fixed"
                || Math.abs(rect.left + rect.width / 2 - innerWidth / 2) > 1
                || Math.abs(rect.top + rect.height / 2 - innerHeight / 2) > 1
                || Math.abs(textRect.top + textRect.height / 2 - innerHeight / 2) > 1
                || Math.abs(Number(style.opacity) - (reduced ? expected : 1)) > 0.01
                || content.inert !== (expected === 0)
                || (expected === 0 && (style.visibility !== "hidden" || style.pointerEvents !== "none"))) {
                return {progress, actualProgress, expected, opacity: style.opacity, inert: content.inert, visibility: style.visibility, position: style.position, center: [rect.left + rect.width / 2, rect.top + rect.height / 2]};
            }
        }
        return document.documentElement.scrollWidth <= innerWidth;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with([
    'wide desktop' => [2083, 1214, false],
    'desktop' => [1440, 1000, false],
    'short desktop' => [1280, 720, false],
    'reduced motion' => [1440, 1000, true],
]);

it('restores normal hero flow when resizing from a faded desktop to a small viewport', function () {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize(1440, 1000);
    $page->assertScript('() => document.querySelector("[data-hero-content]").hasAttribute("data-scroll-pinned")', true);
    $page->script('scrollTo({top: innerHeight * 0.6, behavior: "instant"})');
    $page->assertScript('document.querySelector("[data-hero-content]").inert', true);
    foreach ([[768, 1000], [390, 844], [1280, 500]] as [$width, $height]) {
        $page->resize($width, $height)->assertScript('() => {
            const content = document.querySelector("[data-hero-content]");
            return !content.inert && !content.hasAttribute("data-scroll-pinned")
                && getComputedStyle(content).visibility === "visible"
                && getComputedStyle(content).position !== "fixed";
        }', true);
        $page->assertScript('async () => {
            const content = document.querySelector("[data-hero-content]");
            scrollTo({top: 0, behavior: "instant"});
            await new Promise(requestAnimationFrame);
            const before = content.getBoundingClientRect().top;
            scrollTo({top: 100, behavior: "instant"});
            await new Promise(requestAnimationFrame);
            return Math.abs(before - content.getBoundingClientRect().top - 100) < 1;
        }', true);
    }
    $page->script('scrollTo({top: 0, behavior: "instant"})');
    $page->resize(1440, 1000)->assertScript('() => {
        const content = document.querySelector("[data-hero-content]");
        return content.hasAttribute("data-scroll-pinned") && !content.inert
            && Number(getComputedStyle(content).opacity) === 1;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('keeps the pinned hero calls to action usable and removes hidden controls from focus', function () {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize(1440, 1000);
    $page->click('Read the story')
        ->assertScript('location.hash', '#story')
        ->assertScript('document.querySelector("[data-hero-content]").inert', true);
    $page->script('scrollTo({top: 0, behavior: "instant"})');
    $page->assertScript('document.querySelector("[data-hero-content]").inert', false)
        ->click('Skip to setup')->assertScript('location.hash', '#install');
    $page->assertScript('() => {
        const content = document.querySelector("[data-hero-content]");
        content.querySelector("a").focus();
        return content.inert && !content.contains(document.activeElement);
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('draws and retracts the connection exactly to its scroll signal', function (string $route, int $width) {
    $page = visit('/')->resize($width, 1000);
    foreach ([0, .25, .7, 1, .4, 0] as $progress) {
        $page->script('() => {
            const d=document.querySelector("['.$route.']").dataset;
            const p='.$progress.';
            scrollTo({top:Number(d.scrollStart)+(Number(d.scrollEnd)-Number(d.scrollStart))*p+(p===0?-2:p===1?2:0),behavior:"instant"});
        }');
        $page->assertScript('() => {
            const route=document.querySelector("['.$route.']");
            const track=route.querySelector("[data-route-track]");
            const pulse=route.querySelector("[data-route-pulse]");
            const style=getComputedStyle(track);
            const progress=1-parseFloat(style.strokeDashoffset);
            const end=track.getPointAtLength(track.getTotalLength()*progress).matrixTransform(track.getScreenCTM());
            const head=new DOMPoint(pulse.cx.baseVal.value,pulse.cy.baseVal.value).matrixTransform(pulse.getScreenCTM());
            return Math.abs(progress-'.$progress.')<.01
                && track.pathLength.baseVal===1 && parseFloat(style.strokeDasharray)===1
                && style.opacity===(progress===0?"0":"1")
                && Math.hypot(end.x-head.x,end.y-head.y)<.2;
        }', true);
    }
    $page->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with([
    'handoff desktop' => ['data-handoff-route', 2083],
    'handoff mobile' => ['data-handoff-route', 390],
    'growth desktop' => ['data-growth-route', 2083],
    'growth mobile' => ['data-growth-route', 390],
]);

it('frames the private network around visible devices and its coin', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->script('document.querySelector("[data-capability=wireguard]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertSee('A private network, wherever you are.')
        ->assertScript('() => {
            const card = document.querySelector("[data-capability=wireguard]");
            const drawing = card.querySelector("svg");
            const bounds = drawing.getBoundingClientRect();
            const parts = [...drawing.querySelectorAll("[data-control-laptop], [data-remote-device], [data-network-node], [data-network-coin]")];
            const coin = drawing.querySelector("[data-network-coin] ellipse").getBoundingClientRect();
            const logo = drawing.querySelector("[data-wireguard-mark]").getBoundingClientRect();
            const laptop = drawing.querySelector("[data-control-laptop]");
            const lidStyle = getComputedStyle(laptop.querySelector(".orbit-laptop__lid"));
            const deckStyle = getComputedStyle(laptop.querySelector(".orbit-laptop__deck"));
            const hardware = parts.filter(part => !part.hasAttribute("data-network-coin"));
            const gap = 12 * Math.min(bounds.width / 720, bounds.height / 280);
            const apart = (a, b) => a.right + gap <= b.left || b.right + gap <= a.left
                || a.bottom + gap <= b.top || b.bottom + gap <= a.top;
            return hardware.every((part, index) => {
                    const box = part.getBoundingClientRect();
                    return apart(box, coin) && hardware.slice(index + 1).every(other => apart(box, other.getBoundingClientRect()));
                })
                && laptop.getBoundingClientRect().width > coin.width * 1.6
                && lidStyle.stroke === deckStyle.stroke
                && lidStyle.strokeWidth === deckStyle.strokeWidth
                && getComputedStyle(laptop.querySelector(".orbit-laptop__lid-edge")).stroke !== "none"
                && parts.length === 6
                && drawing.querySelectorAll("[data-network-link]").length === 5
                && parts.every(part => {
                    const box = part.getBoundingClientRect();
                    if (part === laptop && innerWidth <= 1100) {
                        // The phone camera leaves the laptop outside the frame;
                        // tablet framing trims only its outer edge.
                        return innerWidth <= 600 ? box.right < bounds.left
                            : box.left >= bounds.left - 6 && box.right <= bounds.right;
                    }
                    return box.left >= bounds.left && box.right <= bounds.right
                        && box.top >= bounds.top && box.bottom <= bounds.bottom;
                })
                && coin.width > coin.height * 1.5
                && logo.width > 20 && logo.height > 10
                && getComputedStyle(drawing).maskImage.includes("100%")
                && getComputedStyle(drawing).backgroundColor === "rgba(0, 0, 0, 0)"
                && (innerWidth > 600 && innerWidth <= 900
                    ? bounds.right < card.querySelector("h3").getBoundingClientRect().left
                    : bounds.bottom <= card.querySelector("h3").getBoundingClientRect().top)
                && document.documentElement.scrollWidth <= innerWidth;
        }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['annotated desktop' => 2135, 'tablet' => 768, 'mobile' => 390]);

it('alternates one private network signal between connections and directions', function (int $width) {
    $page = visit('/')->resize($width, 1000);
    $scene = '[data-capability=wireguard] > svg';
    $page->assertAttribute($scene, 'data-network-active', 'false');
    $page->script('document.querySelector("[data-capability=wireguard]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertAttribute($scene, 'data-network-active', 'true');

    foreach (range(0, 5) as $turn) {
        $route = $turn % 5;
        $direction = $turn % 2 === 0 ? 'to-coin' : 'to-device';
        $page->assertScript('() => {
            const scene = document.querySelector("[data-capability=wireguard] > svg");
            const signals = scene.querySelectorAll("[data-network-signal]");
            const signal = signals[0];
            const animation = signal.getAnimations()[0];
            const progress = Number(animation?.currentTime) / 1800;
            const routes = [...scene.querySelectorAll("[data-network-link]")];
            if (signals.length !== 1 || Number(signal.dataset.route) !== '.$route.'
                || signal.dataset.direction !== "'.$direction.'" || progress < .2 || progress > .7) return false;
            const path = routes['.$route.'];
            const style = getComputedStyle(signal);
            const dash = parseFloat(style.strokeDasharray);
            const offset = parseFloat(style.strokeDashoffset);
            const head = signal.dataset.direction === "to-coin" ? -offset : dash-offset;
            const expected = path.getTotalLength() * (signal.dataset.direction === "to-coin" ? 1-progress : progress);
            return signal.tagName === "path" && signal.getAttribute("visibility") === "visible"
                && Number(style.opacity) === 1 && dash === 16
                && signal.getAttribute("d") === path.getAttribute("d")
                && Math.abs(head-expected) < .1
                && routes.every(route => getComputedStyle(route).strokeDasharray === "none");
        }', true);
    }

    $page->script('scrollTo({top:0,behavior:"instant"})');
    $page->assertAttribute($scene, 'data-network-active', 'false')
        ->assertAttribute('[data-network-signal]', 'visibility', 'hidden')
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 2135, 'mobile' => 390]);

it('keeps solid private network connections still with reduced motion', function () {
    $page = visit('/', ['reducedMotion' => 'reduce']);
    $page->script('document.querySelector("[data-capability=wireguard]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertAttribute('[data-capability=wireguard] > svg', 'data-network-active', 'false')
        ->assertAttribute('[data-network-signal]', 'visibility', 'hidden')
        ->assertScript('() => [...document.querySelectorAll("[data-network-link]")].every(path => getComputedStyle(path).strokeDasharray === "none")', true)
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('alternates agent icons on one stationary platform and respects reduced motion', function (bool $reduced) {
    $page = visit('/', ['reducedMotion' => $reduced ? 'reduce' : 'no-preference']);
    $page->script('document.querySelector("[data-agent-network]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertAttribute('[data-agent-network]', 'data-agent-active', 'true');
    $page->assertScript('() => {
        const scene = document.querySelector("[data-agent-network]");
        const icons = [...scene.querySelectorAll("[data-agent-icon]")];
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const platform = scene.querySelector("[data-agent-platform]");
        const rect = platform.getBoundingClientRect();
        if (reduced) return icons.every((icon,index) => getComputedStyle(icon).opacity === (index===0?"1":"0") && icon.getAnimations().length===0);
        const animations = icons.map(icon => icon.getAnimations()[0]);
        if (animations.some(animation => !animation)) return false;
        animations.forEach(animation => animation.pause());
        for (const [time,active] of [[1000,0],[5000,1],[9000,2],[13000,0]]) {
            animations.forEach(animation => animation.currentTime=time);
            if (!icons.every((icon,index) => Math.abs(Number(getComputedStyle(icon).opacity)-(index===active?1:0))<.01)) return false;
            const now = platform.getBoundingClientRect();
            if (now.x!==rect.x || now.y!==rect.y || now.width!==rect.width || now.height!==rect.height) return false;
        }
        return true;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
    $page->script('scrollTo({top:0,behavior:"instant"})');
    $page->assertAttribute('[data-agent-network]', 'data-agent-active', 'false');
})->with(['motion' => false, 'reduced motion' => true]);

it('streams caused actions beneath a fixed log header and clips old rows', function (int $width, bool $reduced) {
    $page = visit('/', ['reducedMotion' => $reduced ? 'reduce' : 'no-preference'])->resize($width, 1000);
    $page->script('document.querySelector("[data-capability=activity]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertScript('() => {
        const panel=document.querySelector("[data-action-log]");
        return panel.querySelectorAll(".orbit-capability__log-sheet").length===1
            && !panel.closest("svg").querySelector(".orbit-capability__log-history")
            && panel.querySelector("[data-log-header]").textContent.includes("CAUSER")
            && panel.querySelectorAll("[data-log-causer]").length===8
            && panel.closest("svg").querySelector("clipPath rect").height.baseVal.value===210
            && getComputedStyle(panel.querySelector("[data-log-viewport]")).clipPath!=="none";
    }', true);
    $page->script('() => {
        const panel=document.querySelector("[data-action-log]");
        const feed=panel.querySelector("[data-log-sequence]");
        window.logBefore={sequence:Number(feed.dataset.logSequence), time:feed.querySelector("text").textContent, header:panel.querySelector("[data-log-header]").getBoundingClientRect().y};
        window.logEntryOffset=null;
        const observer=new MutationObserver(() => {
            const next=panel.querySelector("[data-log-sequence]");
            if(Number(next.dataset.logSequence)!==window.logBefore.sequence){
                window.logEntryOffset=new DOMMatrix(getComputedStyle(next).transform).m42;
                observer.disconnect();
            }
        });
        observer.observe(panel,{subtree:true,childList:true});
        window.logObserver=observer;
    }');
    $page->wait(3.8);
    $page->assertScript('() => {
        const panel=document.querySelector("[data-action-log]");
        const feed=panel.querySelector("[data-log-sequence]");
        const before=window.logBefore;
        window.logObserver.disconnect();
        const fixed=Math.abs(panel.querySelector("[data-log-header]").getBoundingClientRect().y-before.header)<.1;
        const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
        return fixed && (reduced
            ? Number(feed.dataset.logSequence)===before.sequence && window.logEntryOffset===null
            : Number(feed.dataset.logSequence)>before.sequence && feed.querySelector("text").textContent!==before.time
                && window.logEntryOffset<0 && window.logEntryOffset>=-30.1
                && Math.abs(new DOMMatrix(getComputedStyle(feed).transform).m42)<.1);
    }', true);
    $page->script('() => {
        window.logPausedSequence=document.querySelector("[data-log-sequence]").dataset.logSequence;
        scrollTo({top:0,behavior:"instant"});
    }');
    $page->wait(3.2);
    $page->assertScript('document.querySelector("[data-log-sequence]").dataset.logSequence===window.logPausedSequence', true)
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 2135, 'mobile' => 390])->with(['animated' => false, 'reduced motion' => true]);

it('routes private network connections through open space into device sides', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->script('document.querySelector("[data-capability=wireguard]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertScript('() => {
        const scene = document.querySelector("[data-capability=wireguard] > svg");
        return [0, 2].every(index => {
            const route = scene.querySelector(`[data-network-link="${index}"]`);
            const port = scene.querySelector(`[data-network-port="${index}"]`);
            const shell = index === 0
                ? scene.querySelector("[data-control-laptop] .orbit-laptop__deck")
                : scene.querySelector("[data-remote-device=tablet] [data-remote-shell]");
            const length = route.getTotalLength();
            const endpoint = route.getPointAtLength(length);
            if (Math.hypot(endpoint.x-port.cx.baseVal.value, endpoint.y-port.cy.baseVal.value) > .1) return false;
            const inDevice = point => point.matrixTransform(route.getScreenCTM()).matrixTransform(shell.getScreenCTM().inverse());
            const end = inDevice(endpoint);
            return [12, 24, 36].every(distance => {
                const point = inDevice(route.getPointAtLength(length-distance));
                return Math.abs(point.y-end.y) < .1
                    && (index === 0 ? point.x > shell.width.baseVal.value+10 : point.x < -10);
            });
        });
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['annotated desktop' => 2135, 'mobile' => 390]);

it('keeps every private network outline one pixel thick across device transforms', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->script('document.querySelector("[data-capability=wireguard]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertScript('() => {
        const scene = document.querySelector("[data-capability=wireguard] > svg");
        const shapes = [...scene.querySelectorAll("path, rect, circle, ellipse, line, polyline, polygon")];
        const strokes = shapes.filter(shape => getComputedStyle(shape).stroke !== "none");
        return strokes.length > 30 && strokes.every(shape => {
            const style = getComputedStyle(shape);
            return style.strokeWidth === "1px" && style.vectorEffect === "non-scaling-stroke";
        }) && getComputedStyle(scene.querySelector(".orbit-laptop__lid-edge")).stroke !== "none"
            && getComputedStyle(scene.querySelector(".orbit-laptop__wall")).fill === getComputedStyle(scene.querySelector(".orbit-laptop__device-wall")).fill
            && (() => {
                const front = scene.querySelector("[data-control-face]").transform.baseVal.consolidate().matrix;
                const back = scene.querySelector("[data-control-back]").transform.baseVal.consolidate().matrix;
                return Math.hypot(back.e-front.e,back.f-front.f)>6;
            })()
            && getComputedStyle(scene.querySelector("[data-wireguard-mark] path")).stroke === "none";
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['annotated desktop' => 2135, 'tablet' => 768, 'mobile' => 390]);

it('orbits agent planets with attached dashed links and signals while visible', function (int $width, bool $reduced) {
    $page = visit('/', ['reducedMotion' => $reduced ? 'reduce' : 'no-preference'])->resize($width, 1000);
    $page->script('async () => {
        await document.fonts.ready;
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        document.querySelector("[data-agent-network]").scrollIntoView({block:"center",behavior:"instant"});
    }');
    $page->assertAttribute('[data-agent-network]', 'data-agent-active', 'true');
    $page->script('() => {
        window.agentPlanetBefore=document.querySelector("[data-agent-planet]").getAttribute("transform");
        window.agentLatitudeBefore=document.querySelector("[data-agent-planet] path").getAttribute("d");
    }');
    $page->wait(.4);
    $page->assertScript('() => {
        const scene=document.querySelector("[data-agent-network]");
        const planets=[...scene.querySelectorAll("[data-agent-planet]")];
        const links=[...scene.querySelectorAll("[data-agent-link]")];
        const signals=[...scene.querySelectorAll("[data-agent-signal]")];
        const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
        const moved=planets[0].getAttribute("transform")!==window.agentPlanetBefore;
        const latitudeMoved=planets[0].querySelector("path").getAttribute("d")!==window.agentLatitudeBefore;
        const orbit=scene.querySelector(".orbit-capability__agent-orbit");
        const rx=orbit.rx.baseVal.value;
        const ry=orbit.ry.baseVal.value;
        const viewport=scene.parentElement.getBoundingClientRect();
        const orbitBounds=orbit.getBoundingClientRect();
        const angles=planets.map(planet=>{
            const matrix=planet.transform.baseVal.consolidate().matrix;
            return Math.atan2((matrix.f-175)/ry,(matrix.e-360)/rx);
        }).sort((a,b)=>a-b);
        const gaps=angles.map((angle,index)=>{
            const next=index===angles.length-1 ? angles[0]+Math.PI*2 : angles[index+1];
            let length=0;
            for(let step=0;step<128;step++) {
                const a=angle+(next-angle)*(step+.5)/128;
                length+=Math.hypot(rx*Math.sin(a),ry*Math.cos(a))*(next-angle)/128;
            }
            return length;
        });
        return moved===!reduced && latitudeMoved===!reduced && planets.length===8
            && orbitBounds.width/viewport.width>.92
            && Math.abs(rx/ry-2.25)<.001
            && scene.querySelector(".orbit-capability__coin-face").r.baseVal.value===38
            && (innerWidth<=600
                ? orbitBounds.left<viewport.left && orbitBounds.right>viewport.right
                    && getComputedStyle(scene.parentElement).overflow==="hidden"
                    && scene.querySelector("[data-agent-platform]").getBoundingClientRect().left>viewport.left
                    && scene.querySelector("[data-agent-platform]").getBoundingClientRect().right<viewport.right
                : planets.every(planet=>{
                    const radius=planet.querySelector("circle").getBoundingClientRect().width/2;
                    return orbitBounds.left-radius>=viewport.left-1 && orbitBounds.right+radius<=viewport.right+1;
                }))
            && Math.max(...gaps)/Math.min(...gaps)<1.01
            && !scene.querySelector("[data-agent-platform] rect, [data-agent-platform] polygon")
            && planets.every((planet,index)=>{
                const circle=planet.querySelector("circle");
                const center=new DOMPoint(0,0).matrixTransform(circle.getScreenCTM());
                const route=links[index];
                const end=route.getPointAtLength(route.getTotalLength()).matrixTransform(route.getScreenCTM());
                return circle.r.baseVal.value===22 && getComputedStyle(route).strokeDasharray==="3px, 5px"
                    && Math.hypot(center.x-end.x,center.y-end.y)<1;
            })
            && signals.length===8 && new Set(signals.map(el=>el.dataset.direction)).size===2
            && scene.querySelector("[data-agent-signals]").getAttribute("visibility")===(reduced?"hidden":"visible")
            && (reduced || signals.some(el=>Number(el.getAttribute("opacity"))>.1 && el.hasAttribute("transform")));
    }', true);
    $page->script('scrollTo({top:0,behavior:"instant"})');
    $page->assertAttribute('[data-agent-network]', 'data-agent-active', 'false');
    $page->script('window.agentPaused=document.querySelector("[data-agent-planet]").getAttribute("transform")');
    $page->wait(.2);
    $page->assertScript('document.querySelector("[data-agent-planet]").getAttribute("transform")===window.agentPaused', true)
        ->assertAttribute('[data-agent-signals]', 'visibility', 'hidden')
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 2135, 'mobile' => 390])->with(['motion' => false, 'reduced motion' => true]);
