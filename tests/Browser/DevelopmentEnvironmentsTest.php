<?php

it('shows the agent workspace on an Orbit foundation with connected preview devices', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1100);
    $page->script('async () => { await document.fonts.ready; await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); document.querySelector("#build").scrollIntoView({behavior:"instant",block:"start"}); await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); }');
    $page->assertSee('Your favorite place to build.')
        ->assertSee('Start with a machine that’s ready.')
        ->assertSee('Give every idea its own workspace.')
        ->assertSee('Take the preview with you.')
        ->assertMissing('#build [role=tab]')
        ->assertMissing('#build button')
        ->assertMissing('#build figcaption')
        ->assertMissing('.orbit-stack__annotations')
        ->assertMissing('.orbit-stack__bridge-ring')
        ->assertMissing('[data-development-foundation] circle.orbit-stack__plate')
        ->assertSee('Keep your tools in step.')
        ->assertSee('Keep the work running.')
        ->assertSee('Give your ideas room to grow.')
        ->assertAttribute('[data-foundation-logo]', 'href', '/assets/orbit/logo-white.svg')
        ->assertScript('() => {
            const section=document.querySelector("#build");
            const brands=[...section.querySelectorAll("[data-environment-brand]")];
            const upper=section.querySelector("[data-development-layer=environment]").getBoundingClientRect();
            const lower=section.querySelector("[data-development-layer=orbit]").getBoundingClientRect();
            const row=section.querySelector(".orbit-environments__marquee-row").getBoundingClientRect();
            const sectionStyle=getComputedStyle(section);
            const contentWidth=section.clientWidth-parseFloat(sectionStyle.paddingLeft)-parseFloat(sectionStyle.paddingRight);
            const devices=[...section.querySelectorAll("[data-stack-device]")];
            return brands.map(el=>el.dataset.environmentBrand).join(",")==="orca,superset,codex,opencode,polyscope,t3,conductor"
                && Math.abs(row.width-contentWidth)<1
                && brands.every(el=>{const img=el.querySelector("img");return img.complete && img.naturalWidth>0;})
                && [...section.querySelectorAll("[data-foundation-terminal]")].map(el=>el.dataset.foundationTerminal).join(",")==="htop,worktrees,routes,tools"
                && section.querySelectorAll("[data-network-statistic]").length===7
                && (()=>{
                    const panes=[...section.querySelectorAll("[data-foundation-terminal]")].map(pane=>{
                        const surface=pane.querySelector("rect");
                        const matrix=pane.transform.baseVal.consolidate().matrix;
                        return {x:matrix.e,y:matrix.f,w:surface.width.baseVal.value,h:surface.height.baseVal.value,stroke:getComputedStyle(surface).stroke};
                    });
                    return panes.every(pane=>pane.stroke==="none")
                        && panes[0].x+panes[0].w===panes[1].x
                        && panes[0].y+panes[0].h===panes[2].y
                        && panes[2].x+panes[2].w===panes[3].x
                        && panes[2].y+panes[2].h===312
                        && section.querySelector("[data-foundation-dividers]").getAttribute("d").includes("M 8 312 H 442")
                        && getComputedStyle(section.querySelector("[data-foundation-dividers]")).strokeWidth==="1px";
                })()
                && !section.querySelector("[data-foundation-checklist], [data-foundation-nodes]")
                && ["CPU", "MEM", "git worktree add", "Registering project.test", "Checking package managers"].every(text=>section.querySelector("[data-development-foundation]").textContent.includes(text))
                && [...section.querySelectorAll(".orbit-stack__terminal-output, .orbit-stack__resource")].every(el=>getComputedStyle(el).animationName==="none")
                && ![...section.querySelectorAll("[data-development-layer=orbit] text")].some(el=>el.textContent.trim()==="orbit")
                && getComputedStyle(section.querySelector(".orbit-stack__statistics-track")).animationName==="none"
                && upper.bottom<lower.top
                && devices.map(el=>el.dataset.stackDevice).join(",")==="laptop,phone,tablet"
                && devices.every(el=>{const r=el.getBoundingClientRect();return r.width>0 && r.left>=0 && r.right<=innerWidth;})
                && section.querySelectorAll("[data-stack-connection]").length===7
                && ["laptop","tablet","phone"].every(device=>section.querySelector(`[data-stack-connection=preview][data-stack-route-device=${device}]`))
                && section.querySelector("[data-stack-connection=workspace][data-stack-route-device=laptop]")
                && section.querySelectorAll(".orbit-stack__signals > path").length===6
                && ["phone","tablet"].every(device=>{
                    const path=section.querySelector(`[data-stack-connection=workspace][data-stack-route-device=${device}]`);
                    const points=[...path.getAttribute("d").matchAll(/[ML] ([\d.e+-]+) ([\d.e+-]+)/g)].map(m=>new DOMPoint(Number(m[1]),Number(m[2])));
                    const surface=section.querySelector("[data-development-layer=environment]");
                    const wall=surface.querySelector(".orbit-laptop__device-wall");
                    const end=points.at(-1).matrixTransform(path.getScreenCTM()).matrixTransform(surface.getScreenCTM().inverse());
                    const target=section.querySelector(`[data-stack-device=${device}] [data-remote-device]`);
                    const start=points[0].matrixTransform(path.getScreenCTM()).matrixTransform(target.getScreenCTM().inverse());
                    return wall.isPointInFill(end)
                        && (device==="phone" ? points.length===2 && Math.abs(start.x)<.01 && Math.abs(start.y-42)<.01
                            : points.length===3 && Math.abs(start.x-140)<.01 && Math.abs(start.y)<.01
                                && points[0].x===points[1].x && points[0].y>points[1].y);
                })
                && [...section.querySelectorAll("[data-stack-connection]")].every(path=>{
                    if(getComputedStyle(path).strokeDasharray!=="none") return false;
                    const points=[...path.getAttribute("d").matchAll(/[ML] ([\d.e+-]+) ([\d.e+-]+)/g)].map(match=>[Number(match[1]),Number(match[2])]);
                    return points.slice(1).every((point,index)=>{
                        const dx=point[0]-points[index][0],dy=point[1]-points[index][1];
                        return Math.abs(dx)<.01 || Math.min(Math.abs(dy/dx-Math.tan(25*Math.PI/180)*.5),Math.abs(dy/dx+1/Math.tan(25*Math.PI/180)*.5))<.001;
                    });
                })
                && [...section.querySelectorAll("rect.orbit-stack__plate")].every(plate=>plate.width.baseVal.value===450 && plate.height.baseVal.value===340)
                && (()=>{
                    const path=section.querySelector("[data-stack-connection=preview][data-stack-route-device=tablet]");
                    const points=[...path.getAttribute("d").matchAll(/[ML] ([\d.e+-]+) ([\d.e+-]+)/g)].map(m=>[Number(m[1]),Number(m[2])]);
                    const [a,b]=points.slice(-2);
                    const orbit=section.querySelector("[data-development-layer=orbit]");
                    const local=point=>new DOMPoint(...point).matrixTransform(path.getScreenCTM()).matrixTransform(orbit.getScreenCTM().inverse());
                    const start=local(a);
                    const tablet=section.querySelector("[data-stack-device=tablet] [data-remote-device]");
                    const end=new DOMPoint(...b).matrixTransform(path.getScreenCTM()).matrixTransform(tablet.getScreenCTM().inverse());
                    return points.length===2 && orbit.querySelector(".orbit-laptop__device-wall").isPointInFill(start)
                        && !orbit.querySelector("rect.orbit-stack__plate").isPointInFill(start)
                        && Math.abs(end.x)<.01 && Math.abs(end.y-58)<.01
                        && b[0]>a[0] && Math.abs((b[1]-a[1])/(b[0]-a[0])-Math.tan(25*Math.PI/180)*.5)<.001;
                })()
                && (()=>{
                    const phone=section.querySelector("[data-stack-connection=preview][data-stack-route-device=phone]");
                    const points=[...phone.getAttribute("d").matchAll(/[ML] ([\d.e+-]+) ([\d.e+-]+)/g)].map(m=>[Number(m[1]),Number(m[2])]);
                    const orbit=section.querySelector("[data-development-layer=orbit]");
                    if(points.length!==4) return false;
                    const wall=orbit.querySelector(".orbit-laptop__device-wall");
                    const plate=orbit.querySelector("rect.orbit-stack__plate");
                    const local=point=>new DOMPoint(...point).matrixTransform(orbit.transform.baseVal.consolidate().matrix.inverse());
                    const landing=local(points[3]);
                    const device=section.querySelector("[data-stack-device=phone] [data-remote-device]");
                    const start=new DOMPoint(...points[0]).matrixTransform(phone.getScreenCTM()).matrixTransform(device.getScreenCTM().inverse());
                    return wall.isPointInFill(landing) && !plate.isPointInFill(landing)
                        && device.querySelector("[data-remote-wall]").isPointInFill(start)
                        && points[1][0]===points[0][0] && points[1][1]>points[0][1]
                        && points[2][0]<points[1][0] && points[2][1]>points[1][1]
                        && points[3][0]<points[2][0] && points[3][1]<points[2][1]
                        && [1,2].every(index=>!plate.isPointInFill(local(points[index])));
                })()
                && (()=>{
                    const grid=section.querySelector(".orbit-environments__benefits"),cells=[...grid.children];
                    const columns=innerWidth<=600?1:innerWidth<=1000?2:3;
                    return ["Top","Right","Bottom","Left"].every(side=>parseFloat(getComputedStyle(grid)[`border${side}Width`])===1) && cells.length===6 && cells.every((cell,index)=>{
                        const style=getComputedStyle(cell),r=cell.getBoundingClientRect();
                        const first=cells[index%columns].getBoundingClientRect();
                        const paragraph=cell.querySelector("p"),paragraphStyle=getComputedStyle(paragraph);
                        const icon=cell.querySelector(".orbit-environments__benefit-heading svg").getBoundingClientRect();
                        const title=cell.querySelector("h3").getBoundingClientRect();
                        const bento=getComputedStyle(document.querySelector(".orbit-capability"));
                        return !cell.querySelector(".orbit-environments__benefit-number")
                            && (innerWidth<1200 || Math.abs(paragraph.getBoundingClientRect().height-parseFloat(paragraphStyle.lineHeight)*3)<1)
                            && Math.abs(title.top-icon.bottom-parseFloat(style.paddingTop))<1
                            && getComputedStyle(cell.querySelector(".orbit-capability__corners")).opacity==="1"
                            && [...cell.querySelectorAll("[data-corner]")].every(corner=>getComputedStyle(corner).borderTopColor==="rgb(77, 77, 86)")
                            && icon.width===26 && icon.height===26 && Math.abs(icon.left-title.left)<1
                            && r.bottom-paragraph.getBoundingClientRect().bottom>=parseFloat(style.paddingBottom)-1
                            && style.backgroundColor===bento.backgroundColor
                            && style.backgroundImage.includes(columns===3 && index%3===1?"linear-gradient":"radial-gradient")
                            && style.getPropertyValue("--benefit-glow-x").trim()===(columns===1?"50%":index%columns===0?"100%":index%columns===columns-1?"0%":"50%")
                            && style.getPropertyValue("--benefit-glow-y").trim()===(columns===2?(index<2?"100%":index<4?"50%":"0%"):(index<3?"100%":"0%"))
                            && Math.abs(r.left-first.left)<1
                            && r.right<=grid.getBoundingClientRect().right+1
                            && cell.querySelector("p").getBoundingClientRect().right<=r.right-parseFloat(style.paddingRight)+1
                            && (innerWidth<1200 || r.width/r.height>1.35)
                            && cell.querySelectorAll("[data-corner]").length===4
                            && cell.querySelector(".orbit-environments__benefit-heading svg").getAttribute("fill")==="none"
                            && cell.querySelector("p").getBoundingClientRect().bottom<r.bottom
                            && cell.querySelector(".orbit-environments__benefit-heading").getBoundingClientRect().bottom<cell.querySelector("h3").getBoundingClientRect().top
                            && parseFloat(style.borderLeftWidth)===(index%columns?1:0)
                            && parseFloat(style.borderTopWidth)===(index>=columns?1:0)
                            && parseFloat(style.borderRightWidth)===0 && parseFloat(style.borderBottomWidth)===0;
                    });
                })()
                && (()=>{
                    const bridge=section.querySelector("[data-stack-bridge]");
                    const points=[...bridge.querySelector("[data-stack-connection=layers]").getAttribute("d").matchAll(/[ML] ([\d.e+-]+) ([\d.e+-]+)/g)].map(m=>new DOMPoint(Number(m[1]),Number(m[2])));
                    const orbit=section.querySelector("[data-development-layer=orbit]");
                    const origin=points[0].matrixTransform(orbit.transform.baseVal.consolidate().matrix.inverse());
                    const laptop=section.querySelector("[data-stack-device=laptop]").getBoundingClientRect();
                    return Math.abs(((origin.x-225)/24)**2+((origin.y-160)/12)**2-1)<.001
                        && points[0].x===points[1].x && points[0].y>points[1].y
                        && laptop.bottom<lower.bottom && laptop.top<lower.top
                        && (()=>{
                            const svg=section.querySelector("svg.orbit-stack");
                            const route=device=>[...section.querySelector(`[data-stack-connection=workspace][data-stack-route-device=${device}]`).getAttribute("d").matchAll(/[ML] ([\d.e+-]+) ([\d.e+-]+)/g)].map(m=>[Number(m[1]),Number(m[2])]);
                            const laptop=route("laptop");
                            const laptopEnd=new DOMPoint(...laptop[2]).matrixTransform(svg.getScreenCTM());
                            const laptopTop=new DOMPoint(150,0).matrixTransform(section.querySelector("[data-stack-device=laptop] [data-control-face]").getScreenCTM());
                            return laptop[1][0]<laptop[0][0] && laptop[1][0]===laptop[2][0]
                                && Math.hypot(laptopEnd.x-laptopTop.x,laptopEnd.y-laptopTop.y)<1;
                        })()
                        && (()=>{
                            const rails=[...bridge.querySelectorAll(".orbit-stack__bridge-rail")];
                            const starts=rails.map(rail=>rail.getPointAtLength(0));
                            const gradient=bridge.querySelector("linearGradient[id$=trail]");
                            return starts.at(-1).y>starts[0].y && starts[3].y>starts[0].y
                                && gradient.firstElementChild.getAttribute("stop-opacity")==="1"
                                && gradient.lastElementChild.getAttribute("stop-opacity")==="0";
                        })()
                        && getComputedStyle(bridge.querySelector(".orbit-stack__bridge-pulse")).animationName==="none";
                })()
                && ["sidebar","editor","agent","terminal"].every(pane=>section.querySelector(`[data-workspace-${pane}]`))
                && section.querySelectorAll("[data-remote-preview=loaded]").length===2
                && getComputedStyle(section.querySelector(".orbit-environments__track")).animationName==="none"
                && document.documentElement.scrollWidth<=innerWidth;
        }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 2135, 'tablet' => 768, 'mobile' => 390]);

it('moves the environment marquee and pauses on hover and offscreen', function () {
    $page = visit('/', ['reducedMotion' => 'no-preference'])->resize(1440, 1100);
    $page->script('async () => { await document.fonts.ready; await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); document.querySelector("#build").scrollIntoView({behavior:"instant",block:"start"}); await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); }');
    $page->assertAttribute('#build', 'data-active', 'true');
    $page->script('window.bridgeBefore=getComputedStyle(document.querySelector(".orbit-stack__bridge-pulse")).transform');
    $page->script('window.terminalBefore=getComputedStyle(document.querySelector(".orbit-stack__terminal-output")).transform');
    $page->script('window.statisticsBefore=getComputedStyle(document.querySelector(".orbit-stack__statistics-track")).transform');
    $page->script('window.marqueeBefore=getComputedStyle(document.querySelector(".orbit-environments__track")).transform');
    $page->wait(.2)->assertScript('getComputedStyle(document.querySelector(".orbit-environments__track")).transform!==window.marqueeBefore', true);
    $page->assertScript('getComputedStyle(document.querySelector(".orbit-stack__statistics-track")).transform!==window.statisticsBefore', true);
    $page->assertScript('getComputedStyle(document.querySelector(".orbit-stack__bridge-pulse")).transform!==window.bridgeBefore', true);
    $page->wait(3.1)->assertScript('getComputedStyle(document.querySelector(".orbit-stack__terminal-output")).transform!==window.terminalBefore', true);
    $page->hover('.orbit-environments__marquee-row')
        ->assertScript('getComputedStyle(document.querySelector(".orbit-environments__track")).animationPlayState', 'paused');
    $page->script('window.marqueePaused=getComputedStyle(document.querySelector(".orbit-environments__track")).transform');
    $page->wait(.2)->assertScript('getComputedStyle(document.querySelector(".orbit-environments__track")).transform===window.marqueePaused', true);
    $page->hover('#build-title')
        ->assertScript('getComputedStyle(document.querySelector(".orbit-environments__track")).animationPlayState', 'running');
    $page->script('scrollTo({top:0,behavior:"instant"})');
    $page->assertAttribute('#build', 'data-active', 'false')
        ->assertScript('getComputedStyle(document.querySelector(".orbit-environments__track")).animationPlayState', 'paused')
        ->assertScript('getComputedStyle(document.querySelector(".orbit-stack__statistics-track")).animationPlayState', 'paused')
        ->assertScript('getComputedStyle(document.querySelector(".orbit-stack__terminal-output")).animationPlayState', 'paused')
        ->assertScript('getComputedStyle(document.querySelector(".orbit-stack__resource")).animationPlayState', 'paused')
        ->assertScript('getComputedStyle(document.querySelector(".orbit-stack__bridge-pulse")).animationPlayState', 'paused')
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('keeps device signals equally long and equally fast after resizing', function () {
    $page = visit('/', ['reducedMotion' => 'no-preference']);
    foreach ([2135, 768, 390] as $width) {
        $page->resize($width, 1200);
        $page->script('document.querySelector("svg.orbit-stack").scrollIntoView({block:"center",behavior:"instant"})');
        $page->assertScript('async () => {
            await new Promise(requestAnimationFrame);
            await new Promise(requestAnimationFrame);
            const paths=[...document.querySelectorAll("[data-stack-signal]")];
            if(paths.length!==6) return false;
            for(const path of paths){
                const style=getComputedStyle(path);
                const [dash,gap]=style.strokeDasharray.split(/[ ,]+/).map(parseFloat);
                const matrix=path.getScreenCTM();
                const length=path.getTotalLength()*Math.hypot(matrix.a,matrix.b);
                const animation=path.getAnimations()[0];
                if(!animation || dash!==18 || gap<length+17.9 || path.hasAttribute("pathLength")) return false;
                const timing=animation.effect.getTiming();
                const sample=timing.delay+timing.duration*(Math.ceil(-timing.delay/timing.duration)+1.4);
                animation.pause();
                animation.currentTime=sample;
                const start=parseFloat(getComputedStyle(path).strokeDashoffset);
                animation.currentTime=sample+250;
                const end=parseFloat(getComputedStyle(path).strokeDashoffset);
                const reverse=(path.dataset.stackSignal==="preview" && path.dataset.stackSignalDevice==="phone")
                    || (path.dataset.stackSignal==="workspace" && path.dataset.stackSignalDevice==="laptop");
                if(Math.abs(Math.abs(end-start)-15)>.1 || (end>start)!==reverse) return false;
                animation.play();
            }
            return true;
        }', true);
    }
    $page->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('shows matching solid connections and bidirectional bridge signals', function () {
    $page = visit('/', ['reducedMotion' => 'no-preference'])->resize(1440, 1100);
    $page->script('async () => { await document.fonts.ready; await new Promise(requestAnimationFrame); document.querySelector("svg.orbit-stack").scrollIntoView({block:"center",behavior:"instant"}); await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); }');
    $page->assertScript('() => {
        const lines=[...document.querySelectorAll(".orbit-stack__connections path, .orbit-stack__bridge-core, .orbit-stack__bridge-rail")];
        const reference=getComputedStyle(lines[0]);
        if(reference.opacity!=="0.1" || reference.stroke!=="rgb(255, 255, 255)") return false;
        const core=document.querySelector(".orbit-stack__bridge-core");
        const start=core.getPointAtLength(0);
        const orbit=document.querySelector("[data-development-layer=orbit]");
        const foot=new DOMPoint(start.x,start.y).matrixTransform(orbit.transform.baseVal.consolidate().matrix.inverse());
        if(Math.abs(((foot.x-225)/24)**2+((foot.y-160)/12)**2-1)>.001) return false;
        if(!lines.every(line=>{
            const style=getComputedStyle(line);
            return style.stroke===reference.stroke && style.opacity===reference.opacity && style.strokeWidth===reference.strokeWidth;
        })) return false;
        const pulses=[...document.querySelectorAll(".orbit-stack__bridge-pulse")];
        if(pulses.length!==7 || document.querySelectorAll(".orbit-stack__bridge-core, .orbit-stack__bridge-rail").length!==7) return false;
        return pulses.every((pulse,index)=>{
            const animation=pulse.getAnimations()[0];
            if(!animation) return false;
            const timing=animation.effect.getTiming();
            const sample=timing.delay+timing.duration*(Math.ceil(-timing.delay/timing.duration)+1.3);
            animation.pause();
            animation.currentTime=sample;
            const before=new DOMMatrix(getComputedStyle(pulse).transform).f;
            animation.currentTime=sample+250;
            const after=new DOMMatrix(getComputedStyle(pulse).transform).f;
            const down=index===1 || index===5;
            const gradient=document.getElementById(pulse.getAttribute("fill").slice(5,-1));
            const correctTrail=gradient.getAttribute("y1")===(down?"1":"0") && gradient.getAttribute("y2")===(down?"0":"1");
            animation.play();
            return correctTrail && Math.abs(after-before)>1 && (after>before)===down;
        });
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});
