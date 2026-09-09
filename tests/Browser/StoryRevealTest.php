<?php

it('drifts each story heading and illustration down together during their entrance', function (int $width, int $height, bool $reduced, string $chapter) {
    $page = visit('/', ['reducedMotion' => $reduced ? 'reduce' : 'no-preference'])->resize($width, $height);
    $page->assertScript('Boolean(document.querySelector("[data-chapter='.$chapter.'] .orbit-story-chapter__grid").dataset.parallaxEnd)', true);
    $page->assertScript('async () => {
        await document.fonts.ready;
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        const section=document.querySelector("[data-chapter='.$chapter.']");
        const grid=section.querySelector(".orbit-story-chapter__grid");
        const heading=section.querySelector("h2");
        const illustration=section.querySelector("[data-story-enter=visual]");
        const next=section.nextElementSibling ?? document.querySelector(".orbit-capabilities");
        const port=illustration.querySelector("[data-handoff-target], [data-growth-target]");
        const route=port ? document.querySelector(section.dataset.chapter==="premise" ? "[data-handoff-route] [data-route-path]" : "[data-growth-route] [data-route-path]") : null;
        const reduced=matchMedia("(prefers-reduced-motion:reduce)").matches;
        const start=Number(grid.dataset.parallaxStart), end=Number(grid.dataset.parallaxEnd);
        const sample=async progress=>{
            scrollTo({top:start+(end-start)*progress+(progress===0?-2:progress===1?2:0),behavior:"instant"});
            await new Promise(requestAnimationFrame);
            await new Promise(requestAnimationFrame);
            const endpoint=route?.getPointAtLength(route.getTotalLength()).matrixTransform(route.getScreenCTM());
            const target=port ? new DOMPoint(port.cx.baseVal.value,port.cy.baseVal.value).matrixTransform(port.getScreenCTM()) : null;
            return {
                titleY:heading.getBoundingClientRect().top+scrollY,
                artY:illustration.getBoundingClientRect().top+scrollY,
                nextY:next.getBoundingClientRect().top+scrollY,
                height:document.documentElement.scrollHeight,
                offset:new DOMMatrix(getComputedStyle(grid).transform).m42,
                opacity:Number(getComputedStyle(heading).opacity),
                connected:!endpoint || Math.hypot(endpoint.x-target.x,endpoint.y-target.y)<1,
            };
        };
        const settled=await sample(1);
        if(settled.opacity!==1 || getComputedStyle(section.querySelector("[data-laptop-entrance]") ?? illustration).opacity!=="1") return false;
        for(const progress of [0,.25,.5,.75,1,.5,0]) {
            const state=await sample(progress);
            const travel=reduced?0:80*(1-progress);
            if(Math.abs(state.titleY-settled.titleY+travel)>1
                || Math.abs(state.artY-settled.artY+travel)>1
                || Math.abs(state.offset+travel)>1
                || Math.abs(state.nextY-settled.nextY)>1
                || state.height!==settled.height
                || !state.connected
                || (progress===0 && start>0 && !reduced && state.opacity!==0)) return false;
        }
        await sample(.5);
        const before={start:Number(grid.dataset.parallaxStart),end:Number(grid.dataset.parallaxEnd),artStart:Number(illustration.dataset.revealStart)};
        dispatchEvent(new Event("resize"));
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        return Math.abs(Number(grid.dataset.parallaxStart)-before.start)<1
            && Math.abs(Number(grid.dataset.parallaxEnd)-before.end)<1
            && Math.abs(Number(illustration.dataset.revealStart)-before.artStart)<1
            && document.documentElement.scrollWidth<=innerWidth;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['annotated desktop' => [1386, 1204], 'tablet' => [820, 1180], 'phone' => [420, 818]])->with(['motion' => false, 'reduced motion' => true])->with(['problem', 'premise', 'topology']);

it('fades and sharpens story illustrations in place and reverses with scrolling', function (int $width, string $chapter) {
    $page = visit('/')->resize($width, 1000);
    foreach ([0, .125, .25, .5, 1, .5, .25, .125, 0] as $progress) {
        $page->script('() => {
            const section=document.querySelector("[data-chapter='.$chapter.']");
            const scene=section.querySelector("[data-laptop]") ?? section.querySelector("[data-story-enter=visual]");
            const d=scene.dataset;
            const p='.$progress.';
            scrollTo({top:Number(d.revealStart)+(Number(d.revealEnd)-Number(d.revealStart))*p+(p===0?-2:p===1?2:0),behavior:"instant"});
        }');
        $page->assertScript('() => {
            const section=document.querySelector("[data-chapter='.$chapter.']");
            const art=section.querySelector("[data-laptop-entrance]") ?? section.querySelector("[data-story-enter=visual]");
            const style=getComputedStyle(art);
            const rate=innerWidth<=1100 && ["problem", "premise"].includes(section.dataset.chapter) ? 4 : 2;
            const opacity=Math.min(1,'.$progress.'*rate);
            return Math.abs(Number(style.opacity)-opacity)<.01
                && Math.abs(parseFloat(style.filter.match(/[\\d.]+/)?.[0] ?? "0")-(innerWidth<=1100?2:6)*(1-opacity))<.06
                && style.transform==="none"
                && style.animationName==="none" && style.maskImage==="none"
                && document.documentElement.scrollWidth<=innerWidth;
        }', true);
    }
    $page->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 2083, 'mobile' => 390, 'tablet' => 820])->with(['problem', 'premise', 'topology']);

it('keeps story copy aligned in normal flow and reverses its entrance and exit fades', function (int $width, int $height, string $chapter) {
    $page = visit('/')->resize($width, $height);
    $page->assertAttribute('[data-chapter='.$chapter.']', 'data-story-scroll', '');
    $page->assertScript('async () => {
        await document.fonts.ready;
        const section = document.querySelector("[data-chapter='.$chapter.']");
        const grid = section.querySelector(".orbit-story-chapter__grid");
        const copy = section.querySelector("[data-story-enter=copy]");
        const copyBounds=()=>{
            const rects=getComputedStyle(copy).display==="contents"
                ? [...copy.querySelectorAll("[data-story-copy-part]")].map(el=>el.getBoundingClientRect())
                : [copy.getBoundingClientRect()];
            const drift=new DOMMatrix(getComputedStyle(copy.closest(".orbit-story-chapter__grid")).transform).m42;
            const top=Math.min(...rects.map(r=>r.top))-drift, bottom=Math.max(...rects.map(r=>r.bottom))-drift;
            return {top,bottom,height:bottom-top};
        };
        const visual = section.querySelector("[data-story-enter=visual]");
        const network = document.querySelector("[data-hero-network]");
        const artwork = visual.getBoundingClientRect();
        artwork.y -= new DOMMatrix(getComputedStyle(grid).transform).m42;
        const pinAt = artwork.top + scrollY + artwork.height / 2 - innerHeight / 2;
        const gridHeight = grid.getBoundingClientRect().height;
        const sample = async top => {
            scrollTo({top, behavior:"instant"});
            await new Promise(requestAnimationFrame);
            await new Promise(requestAnimationFrame);
            const rect = copyBounds();
            const art = visual.getBoundingClientRect();
            art.y -= new DOMMatrix(getComputedStyle(grid).transform).m42;
            const parts = [...copy.querySelectorAll("[data-story-copy-part]")].map(el => getComputedStyle(el));
            return {
                center:rect.top + rect.height / 2,
                aligned:Math.abs(rect.top + rect.height / 2 - art.top - art.height / 2) < 1,
                opacity:parts.reduce((sum, style) => sum + Number(style.opacity), 0) / parts.length,
                blur:parts.reduce((sum, style) => sum + parseFloat(style.filter.match(/[\d.]+/)?.[0] ?? "0"), 0) / parts.length,
                x:new DOMMatrix(getComputedStyle(copy).transform).m41,
                networkOpacity:Number(getComputedStyle(network).opacity),
                fixed:getComputedStyle(copy).position === "fixed",
                hidden:copy.inert && getComputedStyle(copy).visibility === "hidden",
            };
        };
        const hidden = await sample(pinAt - innerHeight * 0.45);
        const early = await sample(pinAt - innerHeight * 0.2625);
        const entering = await sample(pinAt - innerHeight * 0.175);
        const centered = await sample(pinAt + 2);
        const held = await sample(pinAt + innerHeight * 0.15);
        const exiting = await sample(pinAt + innerHeight * 0.35);
        const exited = await sample(pinAt + innerHeight * 0.6);
        const later = await sample(pinAt + innerHeight * 1.5);
        const returningFromBelow = await sample(pinAt + innerHeight * 0.35);
        const returning = await sample(pinAt - innerHeight * 0.175);
        const hiddenAgain = await sample(pinAt - innerHeight * 0.45);
        return hidden.opacity === 0 && hiddenAgain.opacity === 0
            && Math.abs(early.opacity - .5) < .01
            && Math.abs(early.blur - 3) < .03
            && [hidden, entering, centered, held, exiting, exited, later, returningFromBelow, returning, hiddenAgain]
                .every(sample => Math.abs(sample.blur - (6 * (1 - sample.opacity))) < .01)
            && (section.dataset.chapter === "problem"
                ? hidden.networkOpacity <= 0.5 && hiddenAgain.networkOpacity <= 0.5
                    && entering.networkOpacity === 0 && returning.networkOpacity === 0
                : [hidden, entering, returning, hiddenAgain].every(sample => sample.networkOpacity === 0))
            && [centered, held, exiting, exited, later, returningFromBelow].every(sample => sample.networkOpacity === 0)
            && hidden.aligned && entering.aligned && !entering.fixed
            && [hidden, early, entering, centered, held, exiting, exited, later, returningFromBelow, returning, hiddenAgain].every(sample => sample.x === 0)
            && centered.x === 0 && held.x === 0
            && Math.abs(returning.x - entering.x) < 1
            && Math.abs(entering.opacity - 1) < 0.01
            && Math.abs(returning.opacity - entering.opacity) < 0.01
            && Math.abs(returningFromBelow.opacity - exiting.opacity) < 0.01
            && Math.abs(exiting.opacity - 0.5) < 0.01
            && centered.opacity === 1 && held.opacity === 1
            && [hidden, entering, centered, held, exiting, exited, later, returning].every(sample => !sample.fixed && sample.aligned)
            && Math.abs(centered.center - (innerHeight / 2 - 2)) < 1
            && Math.abs(held.center - innerHeight * 0.35) < 1
            && Math.abs(exiting.center - innerHeight * 0.15) < 1
            && exited.hidden && later.hidden && exited.opacity === 0 && later.opacity === 0
            && Math.abs(grid.getBoundingClientRect().height - gridHeight) < 1
            && document.documentElement.scrollWidth <= innerWidth;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => [1440, 1000], 'wide desktop' => [2083, 1214], 'short desktop' => [1280, 720]])->with(['problem', 'premise', 'topology']);

it('keeps long story copy readable in normal flow before fading its last lines near the top', function (int $width, int $height, string $chapter) {
    $page = visit('/')->resize($width, $height);
    $page->assertAttribute('[data-chapter='.$chapter.']', 'data-story-scroll', '');
    $page->assertScript('async () => {
        await document.fonts.ready;
        const copy=document.querySelector("[data-chapter='.$chapter.'] [data-story-enter=copy]");
        const copyBounds=()=>{
            const rects=getComputedStyle(copy).display==="contents"
                ? [...copy.querySelectorAll("[data-story-copy-part]")].map(el=>el.getBoundingClientRect())
                : [copy.getBoundingClientRect()];
            const drift=new DOMMatrix(getComputedStyle(copy.closest(".orbit-story-chapter__grid")).transform).m42;
            const top=Math.min(...rects.map(r=>r.top))-drift, bottom=Math.max(...rects.map(r=>r.bottom))-drift;
            return {top,bottom,height:bottom-top};
        };
        const bottom=copyBounds().bottom+scrollY;
        const sample=async top => {
            scrollTo({top,behavior:"instant"});
            await new Promise(requestAnimationFrame);
            await new Promise(requestAnimationFrame);
            const style=getComputedStyle(copy);
            const parts=[...copy.querySelectorAll("[data-story-copy-part]")];
            const opacity=parts.reduce((sum,el)=>sum+Number(getComputedStyle(el).opacity),0)/parts.length;
            return {bottom:copyBounds().bottom,opacity,position:style.position,inert:copy.inert};
        };
        const readable=await sample(bottom-innerHeight*0.5);
        const fading=await sample(bottom-(innerHeight*0.4+64)/2);
        const hidden=await sample(bottom-32);
        const returned=await sample(bottom-innerHeight*0.5);
        return [readable,fading,hidden,returned].every(state=>state.position!=="fixed"&&state.position!=="sticky")
            && readable.opacity===1 && returned.opacity===1
            && Math.abs(readable.bottom-innerHeight*0.5)<1
            && Math.abs(fading.opacity-0.5)<0.01
            && hidden.opacity===0 && hidden.inert && !returned.inert;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['mobile' => [390, 844], 'tablet' => [768, 1000], 'short viewport' => [1280, 500]])->with(['problem', 'premise', 'topology']);

it('fades the intro constellation at the problem entrance on mobile and with reduced motion', function (int $width, bool $reduced) {
    $page = visit('/', ['reducedMotion' => $reduced ? 'reduce' : 'no-preference'])->resize($width, 1000);
    $page->assertScript('document.querySelector("[data-hero-network]").style.getPropertyValue("--hero-network-visibility") !== ""', true);
    $page->assertScript('async () => {
        await document.fonts.ready;
        const section=document.querySelector("[data-chapter=problem]");
        const copy=section.querySelector("[data-story-enter=copy]");
        const copyBounds=()=>{
            const rects=getComputedStyle(copy).display==="contents"
                ? [...copy.querySelectorAll("[data-story-copy-part]")].map(el=>el.getBoundingClientRect())
                : [copy.getBoundingClientRect()];
            const drift=new DOMMatrix(getComputedStyle(copy.closest(".orbit-story-chapter__grid")).transform).m42;
            const top=Math.min(...rects.map(r=>r.top))-drift, bottom=Math.max(...rects.map(r=>r.bottom))-drift;
            return {top,bottom,height:bottom-top};
        };
        const art=section.querySelector("[data-story-enter=visual]").getBoundingClientRect();
        art.y-=new DOMMatrix(getComputedStyle(copy.closest(".orbit-story-chapter__grid")).transform).m42;
        const network=document.querySelector("[data-hero-network]");
        const pinned=matchMedia("(min-width:1024px) and (min-height:600px)").matches && copyBounds().height+128<=innerHeight;
        const reduced=matchMedia("(prefers-reduced-motion:reduce)").matches;
        const start=pinned ? art.top + scrollY + art.height/2 - innerHeight*0.85
            : copyBounds().top + scrollY - innerHeight + 80;
        const distance=innerHeight * (pinned ? 0.35 : 0.25);
        const sample=async top => {
            scrollTo({top,behavior:"instant"});
            await new Promise(requestAnimationFrame);
            await new Promise(requestAnimationFrame);
            return Number(getComputedStyle(network).opacity);
        };
        const before=await sample(start-100);
        const middle=await sample(start+distance/2);
        const after=await sample(start+distance+100);
        const returned=await sample(0);
        return before===0.5 && Math.abs(middle-(reduced?0:0.25))<0.01
            && after===0 && returned===0.5;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['mobile' => [390, false], 'reduced desktop' => [1440, true], 'reduced mobile' => [390, true]]);

it('waits for mobile illustrations to enter view and handles a desktop resize', function () {
    $page = visit('/')->resize(390, 700);
    $page->script('document.querySelector("[data-chapter=problem] h2").scrollIntoView({block:"end",behavior:"instant"})');
    $page->assertAttribute('[data-chapter=problem] [data-story-enter=copy]', 'data-enter-state', 'visible')
        ->assertAttribute('[data-chapter=problem] [data-story-enter=visual]', 'data-enter-state', 'waiting');
    $page->resize(1440, 1000)
        ->assertAttribute('[data-chapter=problem] [data-story-enter=visual]', 'data-enter-state', 'visible')
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('shows every story section immediately with reduced motion', function () {
    $page = visit('/', ['reducedMotion' => 'reduce']);
    $page->assertScript('() => {
        const items=[...document.querySelectorAll("[data-story-enter]")];
        const parts=[...document.querySelectorAll("[data-story-copy-part]")];
        const entrance=getComputedStyle(document.querySelector("[data-laptop-entrance]"));
        return parts.length===9&&parts.every(el=>getComputedStyle(el).opacity==="1"&&getComputedStyle(el).filter==="none"&&!el.inert)
            &&entrance.opacity==="1"&&entrance.transform==="none"
            &&items.length===6&&items.every(el=>el.dataset.enterState==="visible"
            &&getComputedStyle(el).filter==="none"&&getComputedStyle(el).opacity==="1"&&getComputedStyle(el).animationName==="none"&&getComputedStyle(el).transform==="none");
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('departs toward topology as the Gateway passes the viewport midpoint', function (int $width) {
    $page = visit('/')->resize($width, 1204);
    $page->assertScript('Boolean(document.querySelector("[data-growth-route]").dataset.scrollStart)', true);

    foreach ([1204, 900] as $height) {
        $page->resize($width, $height);
        foreach ([-20, 40, -20] as $offset) {
            $page->script('() => {
                const element=document.querySelector("[data-handoff-scene]");
                const scene=element.getBoundingClientRect();
                scene.y-=new DOMMatrix(getComputedStyle(element.closest(".orbit-story-chapter__grid")).transform).m42;
                scrollTo({top:scrollY+scene.top+scene.height/2-innerHeight/2+'.$offset.',behavior:"instant"});
            }');
            $page->assertScript('() => {
                const route=document.querySelector("[data-growth-route]");
                const active='.$offset.'>0;
                return (Number(route.dataset.progress)>0)===active
                    && getComputedStyle(route.querySelector("[data-route-trail]")).opacity===(active?"1":"0")
                    && getComputedStyle(route.querySelector("[data-route-pulse]")).opacity===(active?"1":"0");
            }', true);
        }
    }

    $page->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 1429, 'mobile' => 390]);

it('finishes each inter-section signal at the end of its destination entrance interval', function (int $width, string $chapter, string $route, string $target) {
    $page = visit('/')->resize($width, 1000);
    $page->assertScript('Number.isFinite(Number(document.querySelector("[data-chapter='.$chapter.'] [data-story-enter=visual]").dataset.revealStart))', true);
    $page->script('async () => {
        await document.fonts.ready;
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
    }');
    foreach ([.5, 1, .5] as $progress) {
        $page->script('() => {
            const d=document.querySelector("[data-chapter='.$chapter.'] [data-story-enter=visual]").dataset;
            scrollTo({top:Number(d.revealStart)+(Number(d.revealEnd)-Number(d.revealStart))*'.$progress.',behavior:"instant"});
        }');
        $page->assertScript('() => {
            const art=document.querySelector("[data-chapter='.$chapter.'] [data-story-enter=visual]");
            const route=document.querySelector("['.$route.']");
            const style=getComputedStyle(art);
            return Number(route.dataset.scrollEnd)>=Number(art.dataset.revealEnd)-1
                && Math.abs(Number(style.opacity)-Math.min(1,'.$progress.'*2))<.01
                && ('.$progress.'===1 || Number(route.dataset.progress)<1);
        }', true);
    }
    $page->resize($width + 20, 900);
    $page->assertScript('Math.abs(Number(document.querySelector("['.$route.']").dataset.scrollEnd)-Number(document.querySelector("[data-chapter='.$chapter.'] [data-story-enter=visual]").dataset.revealEnd))<1', true);
    $page->script('scrollTo({top:Number(document.querySelector("['.$route.']").dataset.scrollEnd)+2,behavior:"instant"})');
    $page->assertAttribute('['.$route.']', 'data-progress', '1.000')
        ->assertScript('() => {
            const art=document.querySelector("[data-chapter='.$chapter.'] [data-story-enter=visual]");
            const target=document.querySelector("['.$target.']");
            const path=document.querySelector("['.$route.'] [data-route-path]");
            const end=path.getPointAtLength(path.getTotalLength()).matrixTransform(path.getScreenCTM());
            const port=new DOMPoint(target.cx.baseVal.value,target.cy.baseVal.value).matrixTransform(target.getScreenCTM());
            return getComputedStyle(art).opacity==="1"
                && new DOMMatrix(getComputedStyle(art).transform).m41===0
                && Math.hypot(end.x-port.x,end.y-port.y)<1;
        }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 2083, 'mobile' => 390])->with([
    'Gateway' => ['premise', 'data-handoff-route', 'data-handoff-target'],
    'topology' => ['topology', 'data-growth-route', 'data-growth-target'],
]);

it('blurs the remaining illustrations out and restores them on reverse scrolling', function (int $width, bool $reduced, string $chapter) {
    $page = visit('/', ['reducedMotion' => $reduced ? 'reduce' : 'no-preference'])->resize($width, 1000);
    $page->assertScript('Boolean(document.querySelector("[data-chapter='.$chapter.'] [data-story-enter=visual]").dataset.exitEnd)', true);
    foreach ([0, .5, 1, .5, 0] as $progress) {
        $page->script('() => {
            const d=document.querySelector("[data-chapter='.$chapter.'] [data-story-enter=visual]").dataset;
            const p='.$progress.';
            scrollTo({top:Number(d.exitStart)+(Number(d.exitEnd)-Number(d.exitStart))*p+(p===0?-2:p===1?2:0),behavior:"instant"});
        }');
        $page->assertScript('() => {
            const art=document.querySelector("[data-chapter='.$chapter.'] [data-story-enter=visual]");
            const style=getComputedStyle(art);
            const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
            const opacity=reduced ? 1 : 1-'.$progress.';
            const blur=parseFloat(style.filter.match(/[\\d.]+/)?.[0] ?? "0");
            return Math.abs(Number(style.opacity)-opacity)<.01
                && Math.abs(blur-(innerWidth<=1100?2:6)*(1-opacity))<.03
                && (opacity!==1 || style.filter==="none")
                && art.inert===(opacity===0)
                && new DOMMatrix(style.transform).m41===0;
        }', true);
    }
    $page->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => [2083, false], 'mobile' => [390, false], 'reduced motion' => [1440, true]])->with(['premise', 'topology']);

it('staggers the label then heading then body on both scroll entry and exit', function (int $width, int $height, string $chapter) {
    $page = visit('/')->resize($width, $height);
    $page->assertAttribute('[data-chapter='.$chapter.']', 'data-story-scroll', '');
    $page->assertScript('async () => {
        await document.fonts.ready;
        const copy=document.querySelector("[data-chapter='.$chapter.'] [data-story-enter=copy]");
        const copyBounds=()=>{
            const rects=getComputedStyle(copy).display==="contents"
                ? [...copy.querySelectorAll("[data-story-copy-part]")].map(el=>el.getBoundingClientRect())
                : [copy.getBoundingClientRect()];
            const drift=new DOMMatrix(getComputedStyle(copy.closest(".orbit-story-chapter__grid")).transform).m42;
            const top=Math.min(...rects.map(r=>r.top))-drift, bottom=Math.max(...rects.map(r=>r.bottom))-drift;
            return {top,bottom,height:bottom-top};
        };
        const parts=[...copy.querySelectorAll("[data-story-copy-part]")];
        if(parts.map(el=>el.dataset.storyCopyPart).join(",")!=="label,title,body") return false;
        const bounds=copyBounds();
        const center=bounds.top+scrollY+bounds.height/2;
        const compact=innerWidth<1024||innerHeight<600||bounds.height+128>innerHeight;
        const enter=compact ? bounds.top+scrollY-innerHeight+80 : center-innerHeight*.85;
        const enterDistance=innerHeight*(compact?.125:.175);
        const exit=compact ? bounds.bottom+scrollY-innerHeight*.4 : center-innerHeight*.3;
        const exitDistance=compact ? innerHeight*.4-64 : innerHeight*.3;
        const sample=async top=>{
            scrollTo({top,behavior:"instant"});
            await new Promise(requestAnimationFrame);
            await new Promise(requestAnimationFrame);
            return parts.map(el=>Number(getComputedStyle(el).opacity));
        };
        const equal=(a,b)=>a.every((value,i)=>Math.abs(value-b[i])<.01);
        const hidden=await sample(enter-10);
        if(!equal(hidden,[0,0,0])||!copy.inert||!parts.every(el=>el.inert)) return false;
        const labelIn=await sample(enter+enterDistance*.06);
        const titleIn=await sample(enter+enterDistance*.18);
        const midIn=await sample(enter+enterDistance*.5);
        const visible=await sample(enter+enterDistance+10);
        if(!(labelIn[0]>0&&labelIn[1]===0&&labelIn[2]===0
            &&titleIn[0]>titleIn[1]&&titleIn[1]>0&&titleIn[2]===0
            &&midIn[0]>midIn[1]&&midIn[1]>midIn[2]&&midIn[2]>0
            &&equal(visible,[1,1,1])&&!copy.inert&&parts.every(el=>!el.inert))) return false;
        const labelOut=await sample(exit+exitDistance*.06);
        const titleOut=await sample(exit+exitDistance*.18);
        const midOut=await sample(exit+exitDistance*.5);
        const exited=await sample(exit+exitDistance+10);
        if(!(labelOut[0]<1&&labelOut[1]===1&&labelOut[2]===1
            &&titleOut[0]<titleOut[1]&&titleOut[1]<1&&titleOut[2]===1
            &&midOut[0]<midOut[1]&&midOut[1]<midOut[2]&&midOut[0]>0
            &&equal(exited,[0,0,0])&&copy.inert&&parts.every(el=>el.inert))) return false;
        const reverseOut=await sample(exit+exitDistance*.5);
        const reverseIn=await sample(enter+enterDistance*.5);
        const hiddenAgain=await sample(enter-10);
        return equal(reverseOut,midOut)&&equal(reverseIn,midIn)&&equal(hiddenAgain,hidden)
            &&Math.abs(copyBounds().height-bounds.height)<1
            &&parts.every(el=>getComputedStyle(el).transform==="none")
            &&document.documentElement.scrollWidth<=innerWidth;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => [2083, 1214], 'mobile' => [390, 844]])->with(['problem', 'premise', 'topology']);
