<?php

it('shows a stethoscope diagnosing configuration drift and fleet vitals', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->script('document.querySelector("[data-capability=doctor]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertSee('Keep your fleet healthy with Orbit Doctor.')
        ->assertScript('() => {
            const card = document.querySelector("[data-capability=doctor]");
            const scene = card.querySelector("svg");
            const bounds = scene.getBoundingClientRect();
            const nodes = [...scene.querySelectorAll("[data-doctor-node]")];
            const hardware = [...nodes, scene.querySelector("[data-doctor-stethoscope]"), scene.querySelector("[data-doctor-gateway]")];
            if (nodes.length !== 4 || scene.querySelectorAll("[data-doctor-status=drift]").length !== 1
                || scene.querySelectorAll("[data-doctor-status=healthy]").length !== 3
                || scene.querySelectorAll("[data-doctor-vitals]").length !== 4) return false;
            const globe = scene.querySelector("[data-doctor-gateway] [data-orbit-planet]").getBoundingClientRect();
            const chest = scene.querySelector("[data-doctor-chestpiece] ellipse").getBoundingClientRect();
            const earpiece = scene.querySelector("[data-doctor-earpieces] .orbit-doctor__earpiece").getBoundingClientRect();
            return Math.abs((globe.left + globe.right - chest.left - chest.right) / 2) < .1
                && globe.bottom < chest.top
                && Math.abs((chest.left + chest.right - bounds.left - bounds.right) / 2) < 1
                && earpiece.left > chest.right
                && nodes.some(node => node.getBoundingClientRect().right < chest.left)
                && nodes.some(node => node.getBoundingClientRect().left > chest.right)
                && !scene.querySelector("[data-doctor-command]")
                && !scene.querySelector("[data-doctor-gateway] text")
                && nodes.map(node => node.dataset.doctorNode).join(",") === "dev1,prod1,database,Macbook"
                && scene.querySelectorAll("[data-doctor-ear-tip] [data-tab-side]").length === 2
                && nodes.every(node => {
                    const matrix = node.getCTM();
                    const text = node.textContent;
                    const route = scene.querySelector(`[data-doctor-route=${node.dataset.doctorNode}]`);
                    const endpoint = route.getPointAtLength(route.getTotalLength()).matrixTransform(route.getScreenCTM());
                    const port = node.querySelector("[data-doctor-port]");
                    const target = new DOMPoint(port.cx.baseVal.value,port.cy.baseVal.value).matrixTransform(port.getScreenCTM());
                    return matrix.b > 0 && text.includes("CPU") && text.includes("MEM")
                        && Math.hypot(endpoint.x-target.x,endpoint.y-target.y)<.1;
                })
                && hardware.every(element => {
                    const box = element.getBoundingClientRect();
                    return box.left >= bounds.left && box.right <= bounds.right
                        && box.top >= bounds.top && box.bottom <= bounds.bottom;
                })
                && [...scene.querySelectorAll("path,rect,circle,ellipse")].every(shape => {
                    const style = getComputedStyle(shape);
                    return style.stroke === "none" || (style.strokeWidth === "1px" && style.vectorEffect === "non-scaling-stroke");
                })
                && getComputedStyle(scene).maskImage !== "none"
                && bounds.bottom <= card.querySelector("h3").getBoundingClientRect().top
                && document.documentElement.scrollWidth <= innerWidth;
        }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['annotated desktop' => 2135, 'tablet' => 768, 'mobile' => 390]);

it('animates the Gateway above the stethoscope only while visible', function () {
    $page = visit('/');
    $globe = '[data-doctor-gateway] [data-planet-latitudes]';
    $page->assertAttribute($globe, 'data-latitudes-animating', 'false');
    $page->script('document.querySelector("[data-capability=doctor]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertAttribute($globe, 'data-latitudes-animating', 'true');
    $page->script('window.initialDoctorGlobe = document.querySelector("[data-doctor-gateway] [data-planet-latitudes]").getAttribute("d")');
    $page->assertScript('document.querySelector("[data-doctor-gateway] [data-planet-latitudes]").getAttribute("d") !== window.initialDoctorGlobe', true);
    $page->script('scrollTo({top:0,behavior:"instant"})');
    $page->assertAttribute($globe, 'data-latitudes-animating', 'false')
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('keeps the doctor Gateway still when reduced motion is requested', function () {
    $page = visit('/', ['reducedMotion' => 'reduce']);
    $page->script('document.querySelector("[data-capability=doctor]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertAttribute('[data-doctor-gateway] [data-planet-latitudes]', 'data-latitudes-animating', 'false')
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('matches the capability planets to the agent planets and connects the Gateway to the chestpiece center', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->script('document.querySelector("[data-capability=doctor]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertScript('() => {
        const reference = document.querySelector("[data-agent-planet] circle").getBoundingClientRect().width;
        const planets = ["[data-doctor-gateway]", "[data-namespace-gateway]", "[data-capability-planet]"];
        const sameSize = planets.every(selector => Math.abs(document.querySelector(`${selector} [data-orbit-planet]`).getBoundingClientRect().width-reference)<.1);
        const link = document.querySelector("[data-doctor-gateway-link]");
        const endpoint = link.getPointAtLength(link.getTotalLength()).matrixTransform(link.getScreenCTM());
        const chest = document.querySelector("[data-doctor-chestpiece] circle");
        const center = new DOMPoint(0,0).matrixTransform(chest.getScreenCTM());
        const ears = document.querySelector("[data-doctor-earpieces]");
        const earBox = ears.getBoundingClientRect();
        const tips = [...ears.querySelectorAll("[data-doctor-ear-tip]")];
        return sameSize && Math.hypot(endpoint.x-center.x,endpoint.y-center.y)<.1
            && tips.every(tip => tip.getBoundingClientRect().bottom < earBox.top+earBox.height*.4)
            && ears.transform.baseVal.consolidate().matrix.d > .8;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 2135, 'tablet' => 768, 'mobile' => 390]);

it('scrolls all four vital graphs independently and pauses them offscreen', function (int $width) {
    $page = visit('/')->resize($width, 1000);
    $scene = '[data-capability=doctor] > svg';
    $page->assertAttribute($scene, 'data-vitals-active', 'false');
    $page->script('document.querySelector("[data-capability=doctor]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertAttribute($scene, 'data-vitals-active', 'true')
        ->assertScript('async () => {
            const tracks = [...document.querySelectorAll("[data-doctor-vitals-track]")];
            const read = () => tracks.map(track => getComputedStyle(track).transform);
            const before = read();
            await new Promise(resolve => setTimeout(resolve,250));
            const after = read();
            return tracks.length === 4 && new Set(before).size === 4
                && before.every((value,index) => value !== after[index])
                && tracks.every(track => {
                    const window = track.parentElement;
                    const stroke = getComputedStyle(track.querySelector("path"));
                    return getComputedStyle(window).overflow === "hidden"
                        && window.width.baseVal.value > 0
                        && stroke.strokeWidth === "1px" && stroke.vectorEffect === "non-scaling-stroke";
                });
        }', true);
    $page->script('scrollTo({top:0,behavior:"instant"})');
    $page->assertAttribute($scene, 'data-vitals-active', 'false')
        ->assertScript('async () => {
            const tracks = [...document.querySelectorAll("[data-doctor-vitals-track]")];
            const before = tracks.map(track => getComputedStyle(track).transform);
            await new Promise(resolve => setTimeout(resolve,200));
            return tracks.every((track,index) => getComputedStyle(track).animationPlayState === "paused"
                && getComputedStyle(track).transform === before[index]);
        }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 2135, 'mobile' => 390]);

it('leaves the vital graphs still for reduced motion', function () {
    $page = visit('/', ['reducedMotion' => 'reduce']);
    $page->script('document.querySelector("[data-capability=doctor]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertAttribute('[data-capability=doctor] > svg', 'data-vitals-active', 'false')
        ->assertAttribute('[data-doctor-signal]', 'visibility', 'hidden')
        ->assertScript('() => [...document.querySelectorAll("[data-doctor-vitals-track]")].every(track => getComputedStyle(track).animationName === "none")', true)
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('aligns the doctor illustration with the copy and routes connections on the shared isometric axes', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->script('document.querySelector("[data-capability=doctor]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertScript('() => {
        const card = document.querySelector("[data-capability=doctor]");
        const scene = card.querySelector("svg");
        const bounds = scene.getBoundingClientRect();
        const copy = card.querySelector("h3").getBoundingClientRect();
        const nodes = [...scene.querySelectorAll("[data-doctor-node]")].map(node => node.getBoundingClientRect());
        const vectors = path => {
            const points = path.getAttribute("d").match(/-?\\d+(?:\\.\\d+)?(?:e[+-]?\\d+)?/gi).map(Number);
            const result = [];
            for (let i=2; i<points.length; i+=2) {
                const x=points[i]-points[i-2], y=points[i+1]-points[i-1], length=Math.hypot(x,y);
                if (length>.01) result.push([x/length,y/length]);
            }
            return result;
        };
        const reference = vectors(document.querySelector("[data-namespace-route]"));
        const aligned = [...scene.querySelectorAll("[data-doctor-route]")].every(route => vectors(route).every(([x,y]) => reference.some(([rx,ry]) => Math.abs(x*ry-y*rx)<.001)));
        const tube=scene.querySelector("[data-doctor-tube]");
        const left=tube.getPointAtLength(tube.getTotalLength()-12);
        const right=tube.getPointAtLength(12);
        const center=new DOMPoint(0,0).matrixTransform(scene.querySelector("[data-doctor-chestpiece] circle").getCTM());
        const tubeCenter=new DOMPoint((left.x+right.x)/2,0).matrixTransform(tube.getCTM());
        const chest=scene.querySelector("[data-doctor-chestpiece]").getBoundingClientRect();
        const ears=scene.querySelector("[data-doctor-earpieces]").getBoundingClientRect();
        return aligned && Math.abs(bounds.left-copy.left)<1 && Math.abs(bounds.right-copy.right)<1
            && Math.abs(Math.min(...nodes.map(node=>node.left))-copy.left)<6
            && Math.abs(Math.max(...nodes.map(node=>node.right))-copy.right)<6
            && Math.abs(tubeCenter.x-center.x)<.1
            && ears.top > chest.bottom+bounds.height*.06
            && !scene.querySelector("[data-doctor-earpieces] .orbit-doctor__detail");
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 2135, 'mobile' => 390]);

it('sends a short signal outward to each diagnostic node in turn', function () {
    $page = visit('/')->resize(2135, 1000);
    $page->script('document.querySelector("[data-capability=doctor]").scrollIntoView({block:"center",behavior:"instant"})');
    foreach (['dev1', 'prod1', 'database', 'Macbook'] as $node) {
        $page->assertAttribute('[data-doctor-signal]', 'data-route', $node)
            ->assertScript('async () => {
                const signal=document.querySelector("[data-doctor-signal]");
                const route=signal.dataset.route;
                const before=Number(signal.dataset.progress);
                await new Promise(resolve=>setTimeout(resolve,150));
                const after=Number(signal.dataset.progress);
                const path=document.querySelector(`[data-doctor-route=${route}]`);
                const head=signal.getPointAtLength(signal.getTotalLength());
                const target=path.getPointAtLength(path.getTotalLength()*after);
                return signal.dataset.route===route && after>before && after<1
                    && signal.getAttribute("visibility")==="visible"
                    && Math.hypot(head.x-target.x,head.y-target.y)<.1
                    && signal.getTotalLength()<=16.1;
            }', true);
    }
    $page->script('scrollTo({top:0,behavior:"instant"})');
    $page->assertAttribute('[data-doctor-signal]', 'visibility', 'hidden')
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('draws chestpiece pulses inward toward the gateway and pauses them offscreen', function () {
    $page = visit('/')->resize(2135, 1000);
    $page->script('document.querySelector("[data-capability=doctor]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertAttribute('[data-capability=doctor] > svg', 'data-vitals-active', 'true')
        ->assertScript('async () => {
            const rings=[...document.querySelectorAll("[data-doctor-inward-ring]")];
            const read=()=>rings.map(ring=>parseFloat(getComputedStyle(ring).r));
            const before=read();
            await new Promise(resolve=>setTimeout(resolve,200));
            const after=read();
            const joint=document.querySelector("[data-doctor-hose-joint]");
            return rings.length===2 && Math.abs(before[0]-before[1])>5
                && before.every((r,index)=>after[index]<r)
                && rings.every(ring=>{
                    const style=getComputedStyle(ring);
                    return style.strokeWidth==="1px" && style.vectorEffect==="non-scaling-stroke";
                })
                && !!joint.querySelector("[data-doctor-joint-depth]");
        }', true);
    $page->script('scrollTo({top:0,behavior:"instant"})');
    $page->assertAttribute('[data-capability=doctor] > svg', 'data-vitals-active', 'false')
        ->assertScript('async () => {
            const rings=[...document.querySelectorAll("[data-doctor-inward-ring]")];
            const before=rings.map(ring=>getComputedStyle(ring).r);
            await new Promise(resolve=>setTimeout(resolve,200));
            return rings.every((ring,index)=>getComputedStyle(ring).r===before[index]
                && getComputedStyle(ring).animationPlayState==="paused");
        }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('keeps the chestpiece rings still for reduced motion', function () {
    $page = visit('/', ['reducedMotion' => 'reduce']);
    $page->script('document.querySelector("[data-capability=doctor]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertScript('() => [...document.querySelectorAll("[data-doctor-inward-ring]")].every(ring=>getComputedStyle(ring).animationName==="none")', true)
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});
