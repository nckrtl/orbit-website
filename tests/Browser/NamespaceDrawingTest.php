<?php

it('connects isometric namespace tiles to a round Gateway with one pixel latitude strokes', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->assertPresent('[data-namespace-gateway]');
    $page->script('document.querySelector("[data-capability=names]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertScript('async () => {
        await document.fonts.ready;
        const drawing=document.querySelector("[data-capability=names] svg");
        const gateway=drawing.querySelector("[data-namespace-gateway]");
        const circle=gateway.querySelector("circle");
        const latitudes=gateway.querySelector("path");
        const bounds=circle.getBoundingClientRect();
        const center=new DOMPoint(0,0).matrixTransform(circle.getScreenCTM());
        if(Math.abs(bounds.width-document.querySelector("[data-agent-planet] circle").getBoundingClientRect().width)>.1 || Math.abs(bounds.width-bounds.height)>.1 || !latitudes.getAttribute("d").includes("a")) return false;
        if(drawing.getAnimations({subtree:true}).length!==0) return false;
        if(![circle,latitudes].every(el=>getComputedStyle(el).strokeWidth==="1px"
            &&getComputedStyle(el).vectorEffect==="non-scaling-stroke")) return false;
        const namespaces=[...drawing.querySelectorAll("[data-namespace]")];
        if(namespaces.map(el=>el.querySelector("text").textContent).join(",")!=="studio.orbit,api.internal,docs.test") return false;
        for(const namespace of namespaces) {
            const route=namespace.querySelector("[data-namespace-route]");
            if(parseFloat(getComputedStyle(route).strokeDashoffset)!==0) return false;
            if(getComputedStyle(route).strokeDasharray!=="none") return false;
            const tile=namespace.querySelector("[data-namespace-tile]");
            const face=tile.querySelector("rect");
            const matrix=face.getScreenCTM();
            const from=route.getPointAtLength(0).matrixTransform(route.getScreenCTM());
            const end=route.getPointAtLength(route.getTotalLength()).matrixTransform(route.getScreenCTM());
            const port=new DOMPoint(0,0).matrixTransform(matrix);
            if(Math.abs(Math.hypot(from.x-center.x,from.y-center.y)-bounds.width/2)>.5
                ||Math.hypot(end.x-port.x,end.y-port.y)>.5
                ||matrix.b<=0||matrix.c!==0||matrix.a===matrix.d) return false;
            const label=tile.querySelector("text").getBBox();
            if(label.x<0||label.x+label.width>face.width.baseVal.value||label.y<-14||label.y+label.height>14) return false;
        }
        const viewport=drawing.getBoundingClientRect();
        return [...drawing.querySelectorAll("path,rect,circle,text")].every(el=>{
            const r=el.getBoundingClientRect();
            return r.left>=viewport.left-1&&r.right<=viewport.right+1&&r.top>=viewport.top-1&&r.bottom<=viewport.bottom+1;
        })&&document.documentElement.scrollWidth<=innerWidth;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['annotated desktop' => 2135, 'desktop' => 1440, 'tablet' => 768, 'mobile' => 390]);

it('grows the namespace connections outward at a shared speed and keeps the completed lines', function (int $width) {
    $page = visit('/')->resize($width, 1000);
    $page->assertAttribute('[data-capability=names] svg', 'data-namespace-state', 'waiting');
    $page->script('document.querySelector("[data-capability=names]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertAttribute('[data-capability=names] svg', 'data-namespace-state', 'drawing');
    $page->assertScript('async () => {
        const drawing=document.querySelector("[data-capability=names] svg");
        const routes=[...drawing.querySelectorAll("[data-namespace-route]")];
        const animations=routes.map(route=>route.getAnimations()[0]);
        if(animations.some(animation=>!animation)) return false;
        const longest=Math.max(...animations.map(animation=>Number(animation.effect.getTiming().duration)));
        for(const animation of animations) { animation.pause(); animation.currentTime=0; }
        if(routes.some(route=>{
            const style=getComputedStyle(route);
            return Math.abs(parseFloat(style.strokeDashoffset)/parseFloat(style.strokeDasharray)-1)>.001;
        })) return false;
        let previous=0;
        for(const progress of [.1,.25,.4]) {
            animations.forEach(animation=>animation.currentTime=longest*progress);
            const lengths=routes.map(route=>{
                const style=getComputedStyle(route);
                return (1-parseFloat(style.strokeDashoffset)/parseFloat(style.strokeDasharray))*route.getTotalLength();
            });
            if(lengths[0]<=previous||lengths.some(length=>Math.abs(length-lengths[0])>.05)) return false;
            previous=lengths[0];
        }
        animations.forEach(animation=>animation.finish());
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        return routes.every(route=>parseFloat(getComputedStyle(route).strokeDashoffset)===0&&getComputedStyle(route).strokeDasharray==="none")
            &&drawing.dataset.namespaceState==="complete";
    }', true);
    $page->script('scrollTo({top:0,behavior:"instant"})');
    $page->script('document.querySelector("[data-capability=names]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertAttribute('[data-capability=names] svg', 'data-namespace-state', 'complete')
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 2135, 'mobile' => 390]);
