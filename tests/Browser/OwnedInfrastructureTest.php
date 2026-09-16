<?php

it('explains the Orbit core around equal square tiles with right-angle connections', function (int $width, bool $reduced) {
    $page = visit('/', ['reducedMotion' => $reduced ? 'reduce' : 'no-preference'])->resize($width, 1000);
    $page->assertSee('A steady core. Swap the rest.')
        ->assertScript('Array.from(document.querySelectorAll("[data-foundation-note]")).sort((a,b)=>Number(a.style.order)-Number(b.style.order)).map(note=>note.querySelector("h3").textContent)', ['Nodes', 'Apps', 'Instances', 'Processes', 'Databases', 'Tools', 'Security', 'Updates'])
        ->assertMissing('[data-foundation-visitor]')
        ->assertMissing('.orbit-foundation figcaption')
        ->assertMissing('.orbit-owned-machine__copy')
        ->assertMissing('[data-foundation-gateway] text')
        ->assertPresent('path[data-foundation-core-logo]');
    $page->script('document.querySelector("[data-owned-infrastructure]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertScript('async () => {
        await document.fonts.ready;
        const scene = document.querySelector("[data-owned-infrastructure]");
        const svg = scene.querySelector(".orbit-foundation__drawing");
        const art = svg.getBoundingClientRect();
        const base = scene.querySelector(".orbit-foundation__platform").getBoundingClientRect();
        const gateway = scene.querySelector("[data-foundation-gateway] .orbit-foundation__face").getBoundingClientRect();
        const plates = [...scene.querySelectorAll("[data-foundation-plate]")];
        const left = scene.querySelector(".orbit-foundation__notes--left").getBoundingClientRect();
        const right = scene.querySelector(".orbit-foundation__notes--right").getBoundingClientRect();
        const frameWidth = innerWidth <= 600 ? scene.getBoundingClientRect().width + 64 : innerWidth <= 1100 ? 660 : 600;
        if (art.width > frameWidth + 1 || plates.length !== 8) return false;
        const faces = [...svg.querySelectorAll("[data-foundation-face]")];
        const tiles = faces.filter(face => !face.classList.contains("orbit-foundation__platform"));
        if (tiles.length !== 9 || !faces.every(face => face.width.baseVal.value === face.height.baseVal.value)) return false;
        if (!tiles.every(face => face.width.baseVal.value === tiles[0].width.baseVal.value)) return false;
        // Rounded side walls retain their silhouette without corner seams
        // extending into or beyond the lower face.
        if (svg.querySelector("[data-foundation-vertical-edge]") || svg.querySelectorAll("[data-foundation-wall]").length !== 10) return false;
        if (![...svg.querySelectorAll("[data-foundation-wall]")].every(wall => {
            const fill = getComputedStyle(wall);
            return fill.fill !== "none" && fill.fillOpacity === "1" && fill.opacity === "1";
        })) return false;
        const brightness = element => {
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 1;
            const context = canvas.getContext("2d");
            context.fillStyle = getComputedStyle(element).fill;
            context.fillRect(0, 0, 1, 1);
            return context.getImageData(0, 0, 1, 1).data.slice(0, 3).reduce((sum, value) => sum + value, 0);
        };
        if (brightness(svg.querySelector("[data-foundation-wall]")) <= Math.min(...plates.map(plate => brightness(plate.querySelector("[data-foundation-face]"))))
            || brightness(svg.querySelector(".orbit-foundation__platform")) <= Math.min(...plates.map(plate => brightness(plate.querySelector("[data-foundation-face]"))))) return false;
        // All nine blocks form one connected grid, including the eight perimeter links.
        const links = [...svg.querySelectorAll("[data-foundation-neighbor-link]")];
        if (!(svg.querySelector(".orbit-foundation__traces").compareDocumentPosition(plates[0]) & Node.DOCUMENT_POSITION_FOLLOWING)) return false;
        if (links.length !== 12 || links.filter(link => link.dataset.from !== "gateway" && link.dataset.to !== "gateway").length !== 8) return false;
        const reached = new Set(["gateway"]);
        for (let pass = 0; pass < 9; pass++) {
            links.forEach(link => {
                if (reached.has(link.dataset.from)) reached.add(link.dataset.to);
                if (reached.has(link.dataset.to)) reached.add(link.dataset.from);
            });
        }
        if (reached.size !== 9 || links.some(link => link.getTotalLength() <= 0)) return false;
        if (getComputedStyle(scene.querySelector("h3")).fontSize !== "18px" || getComputedStyle(scene.querySelector("p")).fontSize !== "14px") return false;
        const labels = ["nodes", "apps", "instances", "processes", "databases", "tools", "security", "updates"];
        if (!labels.every(label => plates.some(plate => plate.dataset.foundationPlate === label))) return false;
        const callouts = [...scene.querySelectorAll("[data-foundation-link]")];
        if (callouts.length !== 8 || scene.querySelectorAll("[data-foundation-note]").length !== 8
            || !labels.every(label => callouts.filter(line => line.dataset.foundationResource === label).length === 1)) return false;
        if (Math.abs((gateway.left + gateway.right - base.left - base.right) / 2) > 1) return false;
        if (![...svg.querySelectorAll("[data-foundation-face]")].every(face => Number(face.getAttribute("rx")) > 0)) return false;
        if (!plates.every(plate => {
            const text = plate.querySelector("text");
            const label = text.getBBox();
            return label.x >= -88 && label.x + label.width <= 88;
        })) return false;
        if ([...scene.querySelectorAll(".orbit-foundation__notes--left h3")].map(el => el.textContent).join(",") !== "Nodes,Instances,Databases,Security"
            || [...scene.querySelectorAll(".orbit-foundation__notes--right h3")].map(el => el.textContent).join(",") !== "Apps,Processes,Tools,Updates") return false;
        if (![...scene.querySelectorAll("[data-foundation-note]")].every((note, index) => {
            const icon = note.querySelector(".orbit-foundation__note-icon");
            const title = note.querySelector("h3").getBoundingClientRect();
            if (!icon) return false;
            const box = icon.getBoundingClientRect();
            const bar = getComputedStyle(note, "::after");
            const style = getComputedStyle(note);
            const divider = innerWidth <= 480
                ? bar.display === "none" && style.borderTopWidth === (index === 0 ? "0px" : "1px")
                    && style.paddingLeft === "0px" && style.paddingRight === "0px"
                : bar.width === "6px" && bar.boxSizing === "border-box"
                    && [bar.borderTopWidth, bar.borderRightWidth, bar.borderBottomWidth, bar.borderLeftWidth].every(width => width === "1px")
                    && bar.backgroundImage.includes("repeating-linear-gradient(135deg")
                    && bar.backgroundClip === "padding-box"
                    && bar.left === "0px";
            return divider
                && box.width === 26 && box.height === 26 && box.bottom < title.top
                && icon.getAttribute("aria-hidden") === "true";
        })) return false;
        if (getComputedStyle(svg.querySelector("[data-foundation-gateway] [data-foundation-face]")).fill !== "rgb(255, 255, 255)"
            || getComputedStyle(svg.querySelector("[data-foundation-core-logo]")).fill !== "rgb(0, 0, 0)") return false;
        if (matchMedia("(prefers-reduced-motion: reduce)").matches && scene.querySelector("[data-highlighted]")) return false;
        if (innerWidth > 1200) {
            if (left.right >= art.left || right.left <= art.right) return false;
            const bounds = scene.getBoundingClientRect();
            if (Math.abs(left.left - bounds.left) > 1 || Math.abs(right.right - bounds.right) > 1 || art.width < 599) return false;
            const routes = [...scene.querySelectorAll("[data-foundation-link]")];
            if (!routes.every(line => line.dataset.foundationTarget === "platform")) return false;
            // Separate routes must not cross or share a stretch of line.
            const routePoints = line => [...line.getAttribute("d").matchAll(/[ML] ([-\d.]+) ([-\d.]+)/g)].map(match => [Number(match[1]), Number(match[2])]);
            const segments = routes.map(line => {
                const points = routePoints(line);
                return points.slice(1).map((point, index) => [points[index], point]);
            });
            const overlaps = (a, b) => {
                const cross = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
                if (Math.max(a[0][0], a[1][0]) < Math.min(b[0][0], b[1][0]) - .1
                    || Math.max(b[0][0], b[1][0]) < Math.min(a[0][0], a[1][0]) - .1
                    || Math.max(a[0][1], a[1][1]) < Math.min(b[0][1], b[1][1]) - .1
                    || Math.max(b[0][1], b[1][1]) < Math.min(a[0][1], a[1][1]) - .1) return false;
                return cross(a[0], a[1], b[0]) * cross(a[0], a[1], b[1]) <= .01
                    && cross(b[0], b[1], a[0]) * cross(b[0], b[1], a[1]) <= .01;
            };
            if (segments.some((route, index) => segments.slice(index + 1).some(other => route.some(a => other.some(b => overlaps(a, b)))))) return false;
            // Each line starts beside its explanation and lands on the matching platform port.
            if (![...scene.querySelectorAll("[data-foundation-link]")].every((line, index) => {
                const note = scene.querySelector(`[data-foundation-note="${index}"]`).getBoundingClientRect();
                const port = scene.querySelector(`[data-foundation-port="${index}"]`).getBoundingClientRect();
                const start = line.getPointAtLength(0).matrixTransform(line.getScreenCTM());
                const end = line.getPointAtLength(line.getTotalLength()).matrixTransform(line.getScreenCTM());
                const points = routePoints(line);
                const before = new DOMPoint(...points.at(-2)).matrixTransform(line.getScreenCTM());
                const startRun = Math.abs(points[1][0] - points[0][0]);
                const endRun = Math.abs(points[3][0] - points[2][0]);
                if (Math.abs(startRun - endRun) > .1) return false;
                const baseInverse = svg.querySelector(".orbit-foundation__platform").getScreenCTM().inverse();
                const landing = end.matrixTransform(baseInverse);
                const approach = before.matrixTransform(baseInverse);
                const rear = line.dataset.foundationEntry === "rear";
                const correctEntry = rear
                    ? index < 4
                        ? Math.abs(landing.x) < .1 && Math.abs(approach.y - landing.y) < .1 && approach.x < landing.x
                        : Math.abs(landing.y) < .1 && Math.abs(approach.x - landing.x) < .1 && approach.y < landing.y
                    : index < 4
                        ? Math.abs(landing.y - 604) < .1 && Math.abs(approach.x - landing.x) < .1 && approach.y > landing.y
                        : Math.abs(landing.x - 604) < .1 && Math.abs(approach.y - landing.y) < .1 && approach.x > landing.x;
                const midpointLandings = [[0, 108], [0, 300], [112, 604], [304, 604], [300, 0], [492, 0], [604, 304], [604, 496]];
                const [midpointX, midpointY] = midpointLandings[index];
                return correctEntry
                    && Math.abs(landing.x - midpointX) < .1
                    && Math.abs(landing.y - midpointY) < .1
                    && Math.abs(start.y - note.top - note.height / 2) < 1
                    && Math.abs(start.x - (index < 4 ? note.right : note.left)) < 1
                    && Math.abs(end.x - port.left - port.width / 2) < 1
                    && Math.abs(end.y - port.top - port.height / 2) < 1;
            })) return false;
        } else {
            const ordered = [...scene.querySelectorAll("[data-foundation-note]")].sort((a,b)=>Number(a.style.order)-Number(b.style.order));
            if (ordered.some(note => note.getBoundingClientRect().top < art.bottom)) return false;
            if (innerWidth <= 480 && ordered.some((note,index) => index > 0 && note.getBoundingClientRect().top < ordered[index-1].getBoundingClientRect().bottom)) return false;
        }
        return document.documentElement.scrollWidth <= innerWidth
            && [...scene.querySelectorAll("[data-foundation-note]")].every(note => {
                const box = note.getBoundingClientRect();
                return box.left >= 0 && box.right <= innerWidth;
            });
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 2135, 'small desktop' => 1280, 'tablet' => 768, 'mobile' => 390])->with(['motion' => false, 'reduced motion' => true]);

it('gently highlights different outer tiles while the core is visible', function () {
    $page = visit('/', ['reducedMotion' => 'no-preference'])->resize(1440, 1100);
    $page->script('async () => { await document.fonts.ready; await new Promise(requestAnimationFrame); }');
    $page->script('document.querySelector("[data-owned-infrastructure]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertScript('() => document.querySelectorAll("[data-foundation-plate][data-highlighted]").length', 1);
    $page->script('document.querySelector("[data-owned-infrastructure]").dataset.firstHighlight = document.querySelector("[data-foundation-plate][data-highlighted]").dataset.foundationPlate');
    $page->assertScript('() => {
        const scene = document.querySelector("[data-owned-infrastructure]");
        const active = scene.querySelector("[data-foundation-plate][data-highlighted]");
        return active && active.dataset.foundationPlate !== scene.dataset.firstHighlight;
    }', true);
    $page->assertScript('() => {
        const active = document.querySelector("[data-foundation-plate][data-highlighted] [data-foundation-face]");
        const idle = document.querySelector("[data-foundation-plate]:not([data-highlighted]) [data-foundation-face]");
        return getComputedStyle(active).fill !== getComputedStyle(idle).fill;
    }', true);
    $page->script('scrollTo({top:0,behavior:"instant"})');
    $page->assertMissing('[data-foundation-plate][data-highlighted]')->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});
