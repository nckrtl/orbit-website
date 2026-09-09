<?php

it('gathers parallel lanes through rounded turns without merging at the core', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->assertPresent('[data-core-funnel=gather]');
    $page->script('document.querySelector("[data-core-funnel=gather]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertScript('() => {
        const svg=document.querySelector("[data-core-funnel=gather]");
        const paths=[...svg.querySelectorAll("[data-funnel-lane]")];
        const bounds=svg.getBoundingClientRect();
        if(paths.length!==16 || svg.closest("main").querySelector("#build").compareDocumentPosition(svg)!==4) return false;
        const signals=[...svg.querySelectorAll("[data-funnel-signal]")];
        if(signals.length!==16 || !signals.every(signal=>getComputedStyle(signal).display==="none" && signal.getAnimations().length===0)) return false;
        const ends=[];
        const starts=[];
        for(const path of paths) {
            const length=path.getTotalLength();
            const matrix=path.getScreenCTM();
            const start=path.getPointAtLength(0).matrixTransform(matrix);
            const first=path.getPointAtLength(Math.min(80,bounds.height*.1)).matrixTransform(matrix);
            const end=path.getPointAtLength(length).matrixTransform(matrix);
            const last=path.getPointAtLength(length-Math.min(80,bounds.height*.1)).matrixTransform(matrix);
            if(Math.abs(start.x-first.x)>.1 || Math.abs(end.x-last.x)>.1 || first.y<=start.y || end.y<=last.y) return false;
            if(Math.abs(end.x-(bounds.left+bounds.width/2))>=Math.abs(start.x-(bounds.left+bounds.width/2))) return false;
            const style=getComputedStyle(path);
            const arcs=[...path.getAttribute("d").matchAll(/A\s+([\d.]+)\s+([\d.]+)/g)];
            if(arcs.length!==2||arcs.some(arc=>Math.abs(Number(arc[1])-Number(arc[2]))>.001)) return false;
            if(style.strokeWidth!=="1px"||style.vectorEffect!=="non-scaling-stroke"||path.getAttribute("d").match(/A/g)?.length!==2) return false;
            for(let d=0;d<=length;d+=5){const p=path.getPointAtLength(d).matrixTransform(matrix);if(p.x<bounds.left||p.x>bounds.right) return false;}
            ends.push(end.x);
            starts.push(start.x);
        }
        ends.sort((a,b)=>a-b);
        const gap=bounds.width<600?4:7;
        starts.sort((a,b)=>a-b);
        const entranceGap=(bounds.width-1)/15;
        if(Math.abs(starts[0]-bounds.left-.5)>.1||Math.abs(bounds.right-starts.at(-1)-.5)>.1) return false;
        if(!starts.every((x,i)=>i===0||Math.abs(x-starts[i-1]-entranceGap)<.1)) return false;
        return ends.every((x,i)=>i===0||Math.abs(x-ends[i-1]-gap)<.1)
            && document.documentElement.scrollWidth<=innerWidth;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 2135, 'tablet' => 768, 'mobile' => 390]);

it('frames the six benefits with matching expanding and gathering trees', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->assertPresent('[data-core-funnel=expand]');
    $page->script('document.querySelector("[data-core-funnel=expand]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertScript('() => {
        const upper=document.querySelector("[data-core-funnel=expand]");
        const lower=document.querySelector("[data-core-funnel=gather]");
        const grid=document.querySelector(".orbit-environments__benefits");
        const figure=document.querySelector(".orbit-environments__figure");
        const a=upper.getBoundingClientRect(), b=lower.getBoundingClientRect(), g=grid.getBoundingClientRect();
        if(document.querySelectorAll("[data-core-funnel]").length!==2 || grid.children.length!==6) return false;
        if(figure.getBoundingClientRect().bottom>a.top || a.bottom>g.top || g.bottom>b.top) return false;
        if(Math.abs(a.width-b.width)>.1 || Math.abs(a.left-b.left)>.1 || Math.abs(a.height-b.height)>.1) return false;
        if(Math.abs(g.top-a.bottom-(b.top-g.bottom))>.1) return false;
        if(g.top-a.bottom>8.1 || b.top-g.bottom>8.1 || Math.abs(a.top-figure.getBoundingClientRect().bottom)>.1) return false;
        const preview=document.querySelector("[data-stack-device=tablet]").getBoundingClientRect();
        if(innerWidth>1100 && (figure.getBoundingClientRect().bottom-preview.bottom>3 || preview.bottom>figure.getBoundingClientRect().bottom)) return false;
        if(getComputedStyle(upper).opacity!=="0.5" || getComputedStyle(lower).opacity!=="0.5") return false;
        const bridge=document.querySelector(".orbit-stack__bridge-core");
        const bridgeStart=bridge.getPointAtLength(0).matrixTransform(bridge.getScreenCTM());
        const bridgeEnd=bridge.getPointAtLength(bridge.getTotalLength()).matrixTransform(bridge.getScreenCTM());
        if(Math.abs(bridgeStart.x-(g.left+g.width/2))>.1 || Math.abs(bridgeEnd.x-bridgeStart.x)>.1) return false;
        if(Math.abs(a.left-g.left)>.1 || Math.abs(a.right-g.right)>.1) return false;
        const upperPaths=[...upper.querySelectorAll("[data-funnel-lane]")], lowerPaths=[...lower.querySelectorAll("[data-funnel-lane]")];
        return upperPaths.length===16 && upperPaths.every((path,i)=>{
            const other=lowerPaths[i];
            if(path.getAttribute("d")!==other.getAttribute("d")) return false;
            const length=path.getTotalLength();
            const matrix=path.getScreenCTM(), otherMatrix=other.getScreenCTM();
            for(const distance of [0,length/2,length]) {
                const p=path.getPointAtLength(distance).matrixTransform(matrix);
                const q=other.getPointAtLength(distance).matrixTransform(otherMatrix);
                if(Math.abs(p.x-a.left-(b.right-q.x))>.1 || Math.abs(p.y-a.top-(b.bottom-q.y))>.1) return false;
            }
            const style=getComputedStyle(path);
            return style.strokeWidth==="1px" && style.vectorEffect==="non-scaling-stroke";
        }) && document.documentElement.scrollWidth<=innerWidth;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 2135, 'tablet' => 768, 'mobile' => 390]);

it('sends staggered signals downward through both trees and pauses them offscreen', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'no-preference'])->resize($width, 1000);
    foreach (['expand', 'gather'] as $direction) {
        $page->script('window.funnelDirection = '.json_encode($direction));
        $page->script('document.querySelector(`[data-core-funnel=${window.funnelDirection}]`).scrollIntoView({block:"center",behavior:"instant"})');
        $page->assertScript('() => {
            const svg=document.querySelector(`[data-core-funnel=${window.funnelDirection}]`);
            const signals=[...svg.querySelectorAll("[data-funnel-signal]")];
            const lanes=[...svg.querySelectorAll("[data-funnel-lane]")];
            const delays=[];
            if(signals.length!==16) return false;
            for(const [i,signal] of signals.entries()) {
                if(signal.getAttribute("d")!==lanes[i].getAttribute("d") || signal.getAttribute("transform")!==lanes[i].getAttribute("transform")) return false;
                const animation=signal.getAnimations()[0];
                if(!animation || animation.playState!=="running") return false;
                const timing=animation.effect.getTiming();
                delays.push(timing.delay);
                const current=animation.currentTime;
                animation.pause();
                animation.currentTime=timing.delay+timing.duration*.25;
                const before=parseFloat(getComputedStyle(signal).strokeDashoffset);
                animation.currentTime+=200;
                const after=parseFloat(getComputedStyle(signal).strokeDashoffset);
                animation.currentTime=current;
                animation.play();
                if(Math.abs(Math.abs(after-before)-14)>.1 || (after>before)!==(window.funnelDirection==="expand")) return false;
                const length=signal.getTotalLength(), matrix=signal.getScreenCTM();
                const first=signal.getPointAtLength(window.funnelDirection==="expand"?length:0).matrixTransform(matrix);
                const last=signal.getPointAtLength(window.funnelDirection==="expand"?0:length).matrixTransform(matrix);
                if(first.y>=last.y || getComputedStyle(signal).strokeWidth!=="1px") return false;
                const [dash,gap]=getComputedStyle(signal).strokeDasharray.split(/[ ,]+/).map(parseFloat);
                if(dash!==18 || gap<length+17.9) return false;
            }
            return new Set(delays).size===16;
        }', true);
        $page->script('async () => {
            const signal=document.querySelector(`[data-core-funnel=${window.funnelDirection}] [data-funnel-signal]`);
            const previous=signal.getAnimations()[0];
            previous.finish();
            await new Promise(requestAnimationFrame);
            await new Promise(requestAnimationFrame);
            window.funnelNextDelay=signal.getAnimations()[0]?.effect.getTiming().delay;
        }');
        $page->assertScript('window.funnelNextDelay>=2000 && window.funnelNextDelay<=8000', true);
    }
    $page->script('scrollTo({top:0,behavior:"instant"})');
    $page->assertScript('() => [...document.querySelectorAll("[data-funnel-signal]")].every(signal=>signal.getAnimations()[0]?.playState==="paused")', true)
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 2135, 'mobile' => 390]);

it('reveals both trees through a soft scroll veil without fading the whole drawing', function (int $width, bool $reduced) {
    $page = visit('/', ['reducedMotion' => $reduced ? 'reduce' : 'no-preference'])->resize($width, 1000);
    $page->assertScript('async () => {
        await document.fonts.ready;
        const settle = async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); };
        await settle();
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        for (const tree of document.querySelectorAll(".orbit-core-funnel")) {
            const start = Number(tree.dataset.buildRevealStart);
            const end = Number(tree.dataset.buildRevealEnd);
            for (const progress of [0, .25, .75, 1, .25]) {
                scrollTo({top:start + (end-start)*progress, behavior:"instant"});
                await settle();
                const style = getComputedStyle(tree);
                if (style.opacity !== "1" || style.filter !== "none") return false;
                if (reduced) {
                    if (style.maskImage !== "none" || tree.dataset.buildProgress !== "1") return false;
                } else {
                    if (Math.abs(Number(tree.dataset.buildProgress)-progress) > .01) return false;
                    if (!style.maskImage.startsWith("linear-gradient(")) return false;
                    const stops = [...style.maskImage.matchAll(/(-?[\d.]+)%/g)].map(match => Number(match[1]));
                    if (stops.length !== 2 || Math.abs(stops[0]-(130*progress-30))>1 || Math.abs(stops[1]-130*progress)>1) return false;
                }
            }
        }
        return document.documentElement.scrollWidth <= innerWidth;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => [1906, false], 'mobile' => [390, false], 'reduced motion' => [1906, true]]);
