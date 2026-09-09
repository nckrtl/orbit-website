<?php

it('keeps one pulse per connection with the same visible length and speed', function (int $width) {
    $page = visit('/')->resize($width, 1000);
    $page->assertAttribute('[data-lid]', 'data-lid', 'open');
    $page->script('window.scrollTo({top: Number(document.querySelector("[data-laptop]").dataset.scrollStart) - 1, behavior: "instant"})');

    $page->assertScript('() => {
        const signals = [...document.querySelectorAll(".orbit-laptop__signals path")];
        const samples = signals.map(path => {
            const animation = path.getAnimations()[0];
            if (!animation) return null;
            animation.pause();
            const timing = animation.effect.getTiming();
            const sampleTime = Number(timing.duration) / 4 - timing.delay;
            animation.currentTime = sampleTime;
            const style = getComputedStyle(path);
            const offset = parseFloat(style.strokeDashoffset);
            const length = parseFloat(style.strokeDasharray);
            const gap = parseFloat(style.strokeDasharray.split(",")[1]);
            animation.currentTime = sampleTime + 100;
            const distance = Math.abs(parseFloat(getComputedStyle(path).strokeDashoffset) - offset);
            const matrix = path.getScreenCTM();
            const scale = Math.hypot(matrix.a, matrix.b);
            const normalization = path.hasAttribute("pathLength") ? path.getTotalLength() / path.pathLength.baseVal.value : 1;
            return {
                length: length * normalization * scale,
                speed: distance * normalization * scale / 0.1,
                single: gap * normalization > path.getTotalLength(),
                loops: Math.abs((length + gap) / (Number(timing.duration) / 1000) - distance / 0.1) < 0.01,
                uniform: Math.abs(scale - Math.hypot(matrix.c, matrix.d)) < 0.001
                    && Math.abs(matrix.a * matrix.c + matrix.b * matrix.d) < 0.001,
            };
        });
        return samples.length === 6 && samples.every(sample => sample?.uniform && sample.single && sample.loops
            && sample.length > 0 && sample.speed > 0
            && Math.abs(sample.length - samples[0].length) < 0.01
            && Math.abs(sample.speed - samples[0].speed) < 0.01);
    }', true)->assertScript('() => {
        return [...document.querySelectorAll("[data-device-signal]")].every(signal => {
            const route = document.querySelector(`[data-laptop] [data-device-link=${signal.dataset.deviceSignal}]`);
            return [0, 1].every(end => {
                const pulse = signal.getPointAtLength(signal.getTotalLength() * end).matrixTransform(signal.getScreenCTM());
                const wire = route.getPointAtLength(route.getTotalLength() * end).matrixTransform(route.getScreenCTM());
                return Math.hypot(pulse.x - wire.x, pulse.y - wire.y) < 0.1;
            });
        });
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 1560, 'mobile' => 390]);

it('holds the laptop open while reading and scrubs every process offline and online', function () {
    $page = visit('/');
    $monochrome = '() => {
        const elements = Array.from(document.querySelectorAll("[data-laptop], [data-laptop] *"));
        return elements.length > 0 && elements.every(element => {
            const style = getComputedStyle(element);
            return [style.fill, style.stroke, style.color].every(color => {
                if (color === "none") return true;
                const channels = color.match(/[\\d.]+/g)?.map(Number);
                return channels?.length >= 3 && channels[0] === channels[1] && channels[1] === channels[2];
            });
        });
    }';

    $page->assertAttribute('[data-lid]', 'data-lid', 'open')
        ->assertScript($monochrome, true);
    $page->script('window.scrollTo({top: Number(document.querySelector("[data-laptop]").dataset.scrollStart) - 20, behavior: "instant"})');

    $page->wait(12.5)
        ->assertAttribute('[data-laptop]', 'data-phase', 'running')
        ->assertAttribute('[data-process="claude"]', 'data-status', 'active')
        ->assertAttribute('[data-process="codex"]', 'data-status', 'active')
        ->assertAttribute('[data-process="queue"]', 'data-status', 'active')
        ->assertAttribute('[data-process="scheduler"]', 'data-status', 'active')
        ->assertScript('document.querySelectorAll("[data-preview-device][data-connection=online]").length', 2);
    $page->script('window.scrollTo({top: Number(document.querySelector("[data-laptop]").dataset.scrollEnd) + 1, behavior: "instant"})');
    $page->assertAttribute('[data-laptop]', 'data-phase', 'sleeping')
        ->assertAttribute('[data-lid]', 'data-lid', 'closed')
        ->assertScript('document.querySelectorAll("[data-preview-device][data-connection=offline] [data-device-page=error]").length', 2)
        ->assertSee('Site unreachable')
        ->assertSee('Laptop is offline')
        ->assertScript($monochrome, true)
        ->assertAttribute('[data-process="claude"]', 'data-status', 'suspended')
        ->assertAttribute('[data-process="codex"]', 'data-status', 'suspended')
        ->assertAttribute('[data-process="queue"]', 'data-status', 'suspended')
        ->assertAttribute('[data-process="scheduler"]', 'data-status', 'suspended')
        ->assertScript('getComputedStyle(document.querySelector(".orbit-laptop__scheduler-indicator path")).animationPlayState', 'paused')
        ->assertScript('getComputedStyle(document.querySelector("[data-bar]")).animationPlayState', 'paused')
        ->assertScript('getComputedStyle(document.querySelector(".orbit-laptop__claude-indicator")).animationPlayState', 'paused')
        ->assertScript('getComputedStyle(document.querySelector(".orbit-laptop__codex-indicator rect")).animationPlayState', 'paused')
        ->assertScript('getComputedStyle(document.querySelector(".orbit-laptop__queue-indicator rect")).animationPlayState', 'paused')
        ->assertScript('getComputedStyle(document.querySelector("[data-sess]")).opacity', '0')
        ->assertScript('function() {
            const lid = document.querySelector("[data-lid-back]").getBoundingClientRect();
            const deck = document.querySelector("[data-deck]").getBoundingClientRect();
            return Math.abs(lid.width - deck.width) < 1
                && Math.abs(lid.height - deck.height) < 1
                && Math.abs(lid.x - deck.x) < 1;
        }', true)
        ->assertScript('function() {
            const line = document.querySelector("[data-claude-connection]");
            const anchor = document.querySelector("[data-body-anchor]");
            const end = line.getPointAtLength(line.getTotalLength()).matrixTransform(line.getScreenCTM());
            const point = new DOMPoint(anchor.cx.baseVal.value, anchor.cy.baseVal.value).matrixTransform(anchor.getScreenCTM());
            return Math.hypot(end.x - point.x, end.y - point.y) < 0.5;
        }', true);
    $page->script('() => { const d = document.querySelector("[data-laptop]").dataset; window.scrollTo({top: (Number(d.scrollStart) + Number(d.scrollEnd)) / 2, behavior: "instant"}); }');
    $page->assertAttribute('[data-laptop]', 'data-phase', 'opening')
        ->assertScript($monochrome, true)
        ->assertScript('document.querySelectorAll("[data-preview-device][data-connection=reconnecting]").length', 2);
    $page->script('window.scrollTo({top: Number(document.querySelector("[data-laptop]").dataset.scrollStart) - 1, behavior: "instant"})');
    $page->assertAttribute('[data-laptop]', 'data-phase', 'running')
        ->assertScript('document.querySelectorAll("[data-preview-device][data-connection=online] [data-device-page=loaded]").length', 2)
        ->assertAttribute('[data-process="claude"]', 'data-status', 'active')
        ->assertAttribute('[data-process="codex"]', 'data-status', 'active')
        ->assertAttribute('[data-process="queue"]', 'data-status', 'active')
        ->assertAttribute('[data-process="scheduler"]', 'data-status', 'active')
        ->assertNoJavaScriptErrors();
});

it('keeps the open laptop and its process labels in frame with reduced motion', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);

    $page->assertAttribute('[data-lid]', 'data-lid', 'open');
    $page->script('document.querySelector("[data-laptop]").scrollIntoView({block: "center"})');

    $page->assertScript('function() {
            const scene = document.querySelector("[data-laptop]").getBoundingClientRect();
            const face = document.querySelector("[data-lid-face]").transform.baseVal.consolidate().matrix;
            const bounds = [...document.querySelectorAll("[data-lid-back], [data-deck], [data-process], [data-preview-device]")]
                .map(element => element.getBoundingClientRect());
            const compactLabels = [...document.querySelectorAll("[data-process]")].every(process => {
                const matrix = process.transform.baseVal.consolidate().matrix;
                const name = process.querySelector(".orbit-laptop__process-name").getBoundingClientRect();
                const detail = process.querySelector(".orbit-laptop__process-detail").getBoundingClientRect();
                return Math.abs(matrix.a - 0.85) < 0.001 && Math.abs(matrix.d - 0.85) < 0.001
                    && name.height > 0 && detail.height > 0 && name.bottom < detail.top;
            });
            return compactLabels && Math.abs(face.c) < 0.001 && face.d > 0.8
                && Math.atan2(face.b, face.a) < 15 * Math.PI / 180
                && bounds.every(b => b.left >= scene.left && b.right <= scene.right
                    && b.top >= scene.top && b.bottom <= scene.bottom);
        }', true)
        ->assertScript('document.querySelectorAll("[data-process][data-status=active]").length', 4)
        ->assertScript('Array.from(document.querySelectorAll(".orbit-star--twinkle")).every(star => star.getAnimations().every(animation => animation.playState !== "running"))', true)
        ->assertScript('document.querySelectorAll("[data-preview-device][data-connection=online] [data-device-page=loaded]").length', 2)
        ->assertScript('document.documentElement.scrollWidth <= document.documentElement.clientWidth', true)
        ->assertScript('getComputedStyle(document.querySelector("[data-bar]")).animationIterationCount', '1')
        ->assertScript('getComputedStyle(document.querySelector(".orbit-laptop__signals")).display', 'none')
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();
})->with(['desktop' => 1560, 'mobile' => 390]);

it('shrinks the taller laptop devices while preserving projection and connected ports', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);

    $page->script('document.querySelector("[data-laptop]").scrollIntoView({block: "center"})');
    $page->assertScript('() => {
        const deck = document.querySelector("[data-deck]").getScreenCTM();
        const devices = Array.from(document.querySelectorAll("[data-preview-device]"));
        return devices.length === 2 && devices.every(device => {
            const matrix = device.getScreenCTM();
            const shell = device.querySelector("[data-device-shell]");
            const port = device.querySelector("[data-device-port]");
            const link = document.querySelector(`[data-device-link="${device.dataset.previewDevice}"]`);
            const route = link.getScreenCTM();
            const endpoint = link.getPointAtLength(link.getTotalLength()).matrixTransform(route);
            const inlet = new DOMPoint(port.cx.baseVal.value, port.cy.baseVal.value).matrixTransform(matrix);
            return ["a", "b", "c", "d"].every(key => Math.abs(matrix[key] - deck[key]) < 0.001 && Math.abs(route[key] * 0.75 - deck[key]) < 0.001)
                && link.getAttribute("d").match(/[a-z]/gi).join("") === "MVHVH"
                && Math.hypot(endpoint.x - inlet.x, endpoint.y - inlet.y) < 0.5
                && (device.dataset.previewDevice === "phone"
                    ? shell.width.baseVal.value === 72 && shell.height.baseVal.value === 168
                    : shell.width.baseVal.value === 280 && shell.height.baseVal.value === 240);
        });
    }', true)
        ->assertScript('() => {
            return Array.from(document.querySelectorAll("[data-preview-device]")).every(device => {
                const shell = device.querySelector("[data-device-shell]");
                const edge = device.querySelector("[data-device-edge]");
                const wall = device.querySelector("[data-device-wall]");
                if (!edge || !wall || device.textContent.match(/PHONE|TABLET/)) return false;
                const thickness = device.dataset.previewDevice === "phone" ? 6 : 8;
                const screenMatrix = device.getScreenCTM();
                const sceneScale = document.querySelector("[data-laptop]").getScreenCTM().d;
                const local = screenMatrix.inverse();
                const vertical = Math.cos(Math.PI / 6) * thickness * 1.18 * 0.75 * sceneScale;
                const origin = new DOMPoint(0, 0).matrixTransform(local);
                const offset = new DOMPoint(0, vertical).matrixTransform(local);
                const dx = offset.x - origin.x;
                const dy = offset.y - origin.y;
                const length = shell.getTotalLength();
                let samples = 0;
                let leftmost = Infinity;
                let rightmost = -Infinity;
                // Check the actual fill all around the visible rounded perimeter,
                // not just the distance between two translated rectangles.
                for (let distance = 0.5; distance < length - 0.5; distance += 0.5) {
                    const point = shell.getPointAtLength(distance);
                    const projected = point.matrixTransform(screenMatrix);
                    leftmost = Math.min(leftmost, projected.x);
                    rightmost = Math.max(rightmost, projected.x);
                    const before = shell.getPointAtLength(distance - 0.1);
                    const after = shell.getPointAtLength(distance + 0.1);
                    const facing = (after.y - before.y) * dx - (after.x - before.x) * dy;
                    if (facing < 0.15) continue;
                    samples++;
                    for (const fraction of [0.2, 0.5, 0.8]) {
                        if (!wall.isPointInFill(new DOMPoint(point.x + dx * fraction, point.y + dy * fraction))) return false;
                    }
                    if (wall.isPointInFill(new DOMPoint(point.x + dx * 1.2, point.y + dy * 1.2))) return false;
                }
                const left = edge.getPointAtLength(0).matrixTransform(screenMatrix);
                const right = edge.getPointAtLength(edge.getTotalLength()).matrixTransform(screenMatrix);
                return samples > 100 && Math.abs(left.x - leftmost) < 0.2
                    && Math.abs(right.x - rightmost) < 0.2;
            });
        }', true)
        ->assertScript('() => {
            const claude = document.querySelector("[data-claude-connection]");
            const queue = document.querySelector("[data-queue-connection]");
            const anchor = document.querySelector("[data-queue-anchor]");
            const side = new DOMPoint(300, 100).matrixTransform(document.querySelector("[data-deck]").getScreenCTM());
            const point = new DOMPoint(anchor.cx.baseVal.value, anchor.cy.baseVal.value).matrixTransform(anchor.getScreenCTM());
            const start = queue.getPointAtLength(0).matrixTransform(queue.getScreenCTM());
            const end = queue.getPointAtLength(queue.getTotalLength()).matrixTransform(queue.getScreenCTM());
            const [bendX, , bendY, bodyX, bodyY] = claude.getAttribute("d").match(/-?\d+(?:\.\d+)?/g).map(Number);
            const legLength = Math.hypot(bodyX - bendX, bodyY - bendY);
            const deck = document.querySelector("[data-deck]").getCTM();
            const slope = (bodyY - bendY) / (bodyX - bendX);
            return legLength > 57 && legLength < 59
                && bendY > bodyY && bendX < bodyX
                && Math.abs(slope - deck.b / deck.a) > 0.5
                && Math.abs(slope - deck.d / deck.c) < 0.001
                && Math.abs(side.x - point.x) < 0.5 && point.y > side.y && point.y - side.y < 10
                && Math.hypot(start.x - point.x, start.y - point.y) < 0.5
                && end.x > start.x;
        }', true)
        ->assertNoJavaScriptErrors()
        ->assertNoConsoleLogs();
})->with(['desktop' => 1560, 'mobile' => 390]);

it('runs literal star keyframes and releases offscreen star animations while the laptop is visible', function () {
    $page = visit('/', ['reducedMotion' => 'no-preference']);
    $page->script('window.scrollTo({top: 0, behavior: "instant"})');
    $page->assertScript('() => {
        window.heroTwinkleStars = Array.from(document.querySelectorAll("[data-page-stars] .orbit-star--twinkle"))
            .filter(star => star.getAnimations()[0]?.playState === "running");
        const animation = window.heroTwinkleStars[0]?.getAnimations()[0];
        return animation?.playState === "running"
            && animation.effect.getKeyframes().every(frame => Number.isFinite(Number(frame.opacity)));
    }', true);
    $page->script('document.querySelector("[data-laptop]").scrollIntoView({block: "center"})');
    $page->assertScript('() => {
        const hero = window.heroTwinkleStars;
        const story = Array.from(document.querySelectorAll("[data-page-stars] .orbit-star--twinkle"));
        // Stars within the observer\'s 32px overscan may intentionally keep
        // twinkling. Check the ones fully beyond that margin, not the seam.
        const offscreen = story.filter(star => {
            const box = star.getBoundingClientRect();
            return box.bottom < -40 || box.top > innerHeight + 40 || box.right < -40 || box.left > innerWidth + 40;
        });
        return hero.length > 0 && offscreen.length > story.length / 2
            && offscreen.every(star => star.getAnimations().length === 0)
            && story.some(star => star.getAnimations()[0]?.playState === "running")
            && story.filter(star => star.getAnimations()[0]?.playState === "running").length < story.length / 2;
    }', true);
    $page->script('window.scrollTo(0, 0)');
    $page->assertScript('window.heroTwinkleStars.some(star => star.getAnimations()[0]?.playState === "running")', true)
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('anchors the scheduler to the body and gives the problem copy room on desktop', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->script('document.querySelector("[data-laptop]").scrollIntoView({block: "center"})');
    $page->assertScript('() => {
        const scheduler = document.querySelector("[data-process=scheduler]").getBoundingClientRect();
        const face = document.querySelector("[data-lid-face]").getScreenCTM();
        const lidCorner = new DOMPoint(300, 0).matrixTransform(face);
        const anchor = document.querySelector("[data-scheduler-anchor]");
        const point = new DOMPoint(anchor.cx.baseVal.value, anchor.cy.baseVal.value).matrixTransform(anchor.getScreenCTM());
        const side = new DOMPoint(300, 24).matrixTransform(document.querySelector("[data-deck]").getScreenCTM());
        const line = document.querySelector("[data-scheduler-connection]");
        const end = line.getPointAtLength(line.getTotalLength()).matrixTransform(line.getScreenCTM());
        const copy = getComputedStyle(document.querySelector("[data-chapter=problem] .orbit-story-chapter__copy"));
        const padding = window.innerWidth > 900
            ? parseFloat(copy.paddingRight) >= 24 && parseFloat(copy.paddingRight) <= 64
            : copy.paddingRight === copy.paddingLeft;
        return scheduler.bottom < lidCorner.y && scheduler.right > lidCorner.x
            && Math.hypot(point.x - end.x, point.y - end.y) < 0.1
            && Math.abs(point.x - side.x) < 0.1 && point.y > side.y && point.y - side.y < 10
            && padding;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 1482, 'mobile' => 390]);

it('rounds the laptop faces and joins the base wall to the same curved perimeter', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->script('document.querySelector("[data-laptop]").scrollIntoView({block: "center"})');

    $page->assertScript('() => {
        const faces = Array.from(document.querySelectorAll("[data-deck], [data-lid-back], [data-lid-surface]"));
        if (faces.length !== 3 || !faces.every(face => face.rx.baseVal.value === 10
            && !face.isPointInFill(new DOMPoint(0, 0)))) return false;
        const deck = document.querySelector("[data-deck]");
        const wall = document.querySelector("[data-body-wall]");
        const azimuth = 25 * Math.PI / 180;
        const vertical = Math.cos(Math.PI / 6) * 10;
        const dx = Math.sin(azimuth) * vertical / 0.5;
        const dy = Math.cos(azimuth) * vertical / 0.5;
        let samples = 0;
        for (let d = 0.5; d < deck.getTotalLength() - 0.5; d += 0.5) {
            const p = deck.getPointAtLength(d);
            const before = deck.getPointAtLength(d - 0.1);
            const after = deck.getPointAtLength(d + 0.1);
            if ((after.y - before.y) * dx - (after.x - before.x) * dy < 0.15) continue;
            samples++;
            for (const t of [0.2, 0.5, 0.8]) {
                if (!wall.isPointInFill(new DOMPoint(p.x + t * dx, p.y + t * dy))) return false;
            }
            if (wall.isPointInFill(new DOMPoint(p.x + 1.2 * dx, p.y + 1.2 * dy))) return false;
        }
        return samples > 100;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 1560, 'mobile' => 390]);

it('keeps the lid rigid and thinner than the body throughout its hinge animation', function () {
    $page = visit('/');

    $page->assertAttribute('[data-lid]', 'data-lid', 'open');
    $page->script('window.scrollTo({top: Number(document.querySelector("[data-laptop]").dataset.scrollStart) - 1, behavior: "instant"})');

    $page->script('(() => {
        const face = document.querySelector("[data-lid-face]");
        const back = document.querySelector("[data-lid-back]");
        const azimuth = 25 * Math.PI / 180;
        const elevation = 30 * Math.PI / 180;
        const started = performance.now();
        const scene = document.querySelector("[data-laptop]");
        const start = Number(scene.dataset.scrollStart);
        const end = Number(scene.dataset.scrollEnd);
        window.laptopMotionSamples = [];
        const sample = () => {
            const m = face.transform.baseVal.consolidate().matrix;
            const outer = back.transform.baseVal.consolidate().matrix;
            const cosine = m.c / Math.sin(azimuth);
            const sine = (m.d + Math.cos(azimuth) * Math.sin(elevation) * cosine) / Math.cos(elevation);
            const edge = Math.hypot(outer.e - m.e, outer.f - m.f);
            const silhouette = document.querySelector("[data-lid-edge]");
            const outline = silhouette.getAttribute("d");
            const center = new DOMPoint(150, 100).matrixTransform(m);
            center.x += (outer.e - m.e) / 2;
            center.y += (outer.f - m.f) / 2;
            window.laptopMotionSamples.push({
                angle: Math.atan2(sine, cosine),
                rigid: Math.abs(cosine * cosine + sine * sine - 1) < 0.001,
                width: Math.abs(m.a - Math.cos(azimuth)) < 0.001,
                hinge: Math.abs(m.e - 268 + 200 * m.c) < 0.001
                    && Math.abs(m.f - 270 + 200 * m.d) < 0.001,
                thickness: edge > 2 && edge < 4.1,
                rounded: back.rx.baseVal.value === 10
                    && document.querySelector("[data-lid-surface]").rx.baseVal.value === 10
                    && !/NaN|Infinity/.test(outline) && outline.split("C").length >= 5
                    && outline.length < 1800
                    && silhouette.isPointInFill(center),
            });
            const progress = Math.min(1, (performance.now() - started) / 1800);
            window.scrollTo({top: start + (end - start + 1) * progress, behavior: "instant"});
            if (progress < 1) requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
    })()');

    $page->assertAttribute('[data-laptop]', 'data-phase', 'sleeping')
        ->assertScript('window.laptopMotionSamples.some(s => s.angle > 0.1 && s.angle < 1.4)', true)
        ->assertScript('window.laptopMotionSamples.every(s => s.rigid && s.width && s.hinge && s.thickness && s.rounded)', true)
        ->assertNoJavaScriptErrors();
});

it('fades the whole laptop illustration in place before tracing the next connection', function (int $width) {
    $page = visit('/')->resize($width, 1000);
    $page->assertAttribute('[data-laptop]', 'data-reveal-progress', '0.000');
    foreach ([0, .5, 1, .5, 0] as $progress) {
        $page->script('() => {
            const d=document.querySelector("[data-laptop]").dataset;
            const p='.$progress.';
            scrollTo({top:Number(d.revealStart)+(Number(d.revealEnd)-Number(d.revealStart))*p+(p===0?-2:p===1?2:0),behavior:"instant"});
        }');
        $page->assertScript('() => {
            const scene=document.querySelector("[data-laptop]");
            const entrance=scene.closest("[data-laptop-entrance]");
            const style=getComputedStyle(entrance);
            const d=scene.dataset;
            const route=document.querySelector("[data-handoff-route]");
            return Math.abs(Number(d.revealProgress)-'.$progress.')<.01
                && Math.abs(Number(style.opacity)-Math.min(1,'.$progress.'*2))<.01
                && style.transform==="none"
                && getComputedStyle(scene).maskImage==="none"
                && style.maskImage==="none"
                && Math.abs(Number(d.scrollStart)-Number(d.revealEnd)-innerHeight*.05)<1
                && Math.abs(Number(d.scrollStart)-Number(route.dataset.scrollStart))<1
                && route.dataset.progress==="0.000";
        }', true);
    }
    $page->script('scrollTo({top:Number(document.querySelector("[data-handoff-route]").dataset.scrollStart)+40,behavior:"instant"})');
    $page->assertAttribute('[data-laptop]', 'data-reveal-progress', '1.000')
        ->assertScript('Number(document.querySelector("[data-handoff-route]").dataset.progress)>0', true)
        ->assertScript('() => {
            const source=document.querySelector("[data-handoff-source]");
            const route=document.querySelector("[data-handoff-route] [data-route-path]");
            const port=new DOMPoint(source.cx.baseVal.value,source.cy.baseVal.value).matrixTransform(source.getScreenCTM());
            const start=route.getPointAtLength(0).matrixTransform(route.getScreenCTM());
            return Math.hypot(port.x-start.x,port.y-start.y)<1;
        }', true)
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 2083, 'mobile' => 390]);

it('starts closing the laptop and tracing together at the viewport midpoint', function (int $width, int $height) {
    $page = visit('/')->resize($width, $height);
    $page->assertAttribute('[data-laptop]', 'data-reveal-progress', '0.000');
    $page->script('async () => {
        await document.fonts.ready;
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        const d=document.querySelector("[data-laptop]").dataset;
        const scene=document.querySelector("[data-laptop]");
        const bounds=scene.getBoundingClientRect();
        window.laptopMidpoint=bounds.top+scrollY+bounds.height/2-innerHeight/2;
        scrollTo({top:window.laptopMidpoint-2,behavior:"instant"});
    }');
    $page->assertAttribute('[data-laptop]', 'data-phase', 'running')
        ->assertAttribute('[data-laptop]', 'data-reveal-progress', '1.000')
        ->assertAttribute('[data-handoff-route]', 'data-progress', '0.000')
        ->assertScript('document.querySelectorAll("[data-process][data-status=active]").length', 4)
        ->assertScript('Math.abs(Number(document.querySelector("[data-laptop]").dataset.scrollStart)-window.laptopMidpoint)<1', true);
    $page->script('scrollTo({top:window.laptopMidpoint+10,behavior:"instant"})');
    $page->assertAttribute('[data-laptop]', 'data-phase', 'closing')
        ->assertScript('Number(document.querySelector("[data-handoff-route]").dataset.progress)>0', true);
    $page->script('() => {
        const d=document.querySelector("[data-laptop]").dataset;
        scrollTo({top:(Number(d.scrollStart)+Number(d.scrollEnd))/2,behavior:"instant"});
    }');
    $page->assertAttribute('[data-laptop]', 'data-phase', 'closing')
        ->assertScript('Number(document.querySelector("[data-handoff-route]").dataset.progress)>0', true);
    $page->script('scrollTo({top:Number(document.querySelector("[data-laptop]").dataset.scrollEnd)+5,behavior:"instant"})');
    $page->assertAttribute('[data-laptop]', 'data-phase', 'sleeping')
        ->assertScript('Number(document.querySelector("[data-handoff-route]").dataset.progress)>0', true);
    $page->script('scrollTo({top:Number(document.querySelector("[data-laptop]").dataset.scrollStart)-5,behavior:"instant"})');
    $page->assertAttribute('[data-laptop]', 'data-phase', 'running')
        ->assertAttribute('[data-handoff-route]', 'data-progress', '0.000')
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => [2083, 1214], 'annotated viewport' => [2135, 1576], 'mobile' => [390, 844]]);

it('sharpens the laptop in place and dissolves it only after closing with reversible scrolling', function (int $width, int $height, bool $reduced) {
    $page = visit('/', ['reducedMotion' => $reduced ? 'reduce' : 'no-preference'])->resize($width, $height);
    $page->assertScript('Boolean(document.querySelector("[data-laptop]").dataset.exitEnd)', true);
    $page->script('() => {
        if (window.blurCheckStarted) return;
        window.blurCheckStarted = true;
        void (async () => {
            await document.fonts.ready;
            const scene = document.querySelector("[data-laptop]");
            const layer = scene.closest("[data-laptop-entrance]");
            const d = scene.dataset;
            const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
            const entryMiddle = Math.ceil((Number(d.revealStart) + Number(d.revealEnd)) / 2);
            const entryQuarter = Number(d.revealStart) + (Number(d.revealEnd) - Number(d.revealStart)) / 4;
            const exitMiddle = (Number(d.exitStart) + Number(d.exitEnd)) / 2;
            const stops = [
                [Number(d.revealStart) - 2, 0],
                [entryQuarter, .5],
                [entryMiddle, 1],
                [Number(d.revealEnd) + 2, 1],
                [(Number(d.scrollStart) + Number(d.scrollEnd)) / 2, 1],
                [Number(d.scrollEnd), 1],
                [exitMiddle, .5],
                [Number(d.exitEnd) + 2, 0],
                [exitMiddle, .5],
                [Number(d.revealEnd) + 2, 1],
                [entryMiddle, 1],
                [entryQuarter, .5],
                [Number(d.revealStart) - 2, 0],
            ];
            for (const [top, opacity] of stops) {
                scrollTo({top, behavior:"instant"});
                await new Promise(requestAnimationFrame);
                await new Promise(requestAnimationFrame);
                const style = getComputedStyle(layer);
                const expected = reduced ? 1 : opacity;
                const blur = parseFloat(style.filter.match(/[\\d.]+/)?.[0] ?? "0");
                if (Math.abs(Number(style.opacity) - expected) > .01
                    || Math.abs(blur - 6 * (1 - expected)) > .03
                    || (expected === 1 && style.filter !== "none")) return false;
                if (top >= Number(d.exitStart) && !reduced && scene.dataset.phase !== "sleeping") return false;
                if (reduced && style.transform !== "none") return false;
            }
            return true;
        })().then(result => window.blurCheckPassed = result);
    }');
    $page->assertScript('window.blurCheckPassed', true)
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => [2083, 1214, false], 'mobile' => [390, 844, false], 'reduced motion' => [1440, 1000, true]]);
