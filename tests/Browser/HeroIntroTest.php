<?php

it('keeps server rendered intro copy invisible before gradually revealing it without hydration', function () {
    $page = visit('/', ['javaScriptEnabled' => false])->resize(2083, 1214);
    $page->assertScript('() => {
        const content = document.querySelector("[data-hero-content]");
        if (!content || content.hasAttribute("data-scroll-pinned")) return false;
        const elements = [...content.querySelectorAll("[data-hero-enter]")];
        return elements.length === 6 && elements.every(element => {
            const animation = element.getAnimations()[0];
            if (!animation) return false;
            animation.pause();
            const {delay, duration} = animation.effect.getTiming();
            animation.currentTime = delay - 1;
            if (delay < 200 || duration < 2000 || duration > 2400 || getComputedStyle(element).opacity !== "0") return false;
            animation.currentTime = delay + duration * .1875;
            const opacity = Number(getComputedStyle(element).opacity);
            const stillSoft = getComputedStyle(element).filter !== "none";
            animation.finish();
            return opacity > 0 && opacity <= 0.2 && stillSoft && getComputedStyle(element).opacity === "1";
        });
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('brings the navigation into focus promptly without moving', function (int $width) {
    $page = visit('/')->resize($width, 1000);
    $page->assertScript('() => {
        const header = document.querySelector(".orbit-story-header");
        const animation = header.getAnimations()[0];
        if (!animation) return false;
        animation.pause();
        const {duration} = animation.effect.getTiming();
        animation.currentTime = 0;
        const start = header.getBoundingClientRect().top;
        const hidden = getComputedStyle(header).opacity === "0";
        const initiallySoft = parseFloat(getComputedStyle(header).filter.slice(5)) > 0;
        const samples = [0.25, 0.5, 0.75].map(progress => {
            animation.currentTime = duration * progress;
            return {progress, top: header.getBoundingClientRect().top, opacity: Number(getComputedStyle(header).opacity), filter: getComputedStyle(header).filter};
        });
        animation.finish();
        const end = header.getBoundingClientRect().top;
        return hidden && initiallySoft && (innerWidth<=1100 ? duration===700 : duration>=1600 && duration<=2000) && start === end && end === 0 && getComputedStyle(header).opacity === "1"
            && samples[2].filter === "none" && getComputedStyle(header).filter === "none"
            && samples.every(sample => Math.abs(sample.opacity - sample.progress) < 0.01
                && Math.abs(sample.top - (start + (end - start) * sample.progress)) < 0.1)
            && header.querySelectorAll("a").length === 5
            && header.getAnimations({subtree: true}).length === 1;
    }', true);
    if ($width <= 1100) {
        $page->click('[aria-label="Open navigation menu"]')->click('[aria-label="Mobile navigation"] a[href="#install"]');
    } else {
        $page->click('Get started');
    }
    $page->assertScript('location.hash', '#install');
    if ($width <= 1100) {
        $page->assertScript('() => {
            const target = document.querySelector("#install");
            const targetY = scrollY + target.getBoundingClientRect().top - parseFloat(getComputedStyle(target).scrollMarginTop);
            const end = Math.min(targetY, document.documentElement.scrollHeight - innerHeight);
            return Math.abs(scrollY - end) < 2;
        }', true);
        $page->script('scrollBy({top:-32,behavior:"instant"})');
    }
    $page->assertScript('() => {
        const header = document.querySelector(".orbit-story-header");
        return header.getBoundingClientRect().top === 0 && getComputedStyle(header).opacity === "1";
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 2083, 'mobile' => 390]);

it('shows the navigation immediately with reduced motion', function () {
    $page = visit('/', ['reducedMotion' => 'reduce']);
    $page->assertScript('() => {
        const header = document.querySelector(".orbit-story-header");
        return header.getAnimations({subtree: true}).length === 0
            && getComputedStyle(header).opacity === "1"
            && getComputedStyle(header).transform === "none";
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('brings hero copy into focus with a small drift that settles without overshooting', function () {
    $page = visit('/')->resize(2083, 1214);
    $page->assertScript('document.querySelector("[data-hero-content]").hasAttribute("data-scroll-pinned")', true);
    $page->assertScript('() => {
        const parts = ["title", "description", "buttons", "open-source", "self-hosted", "agent-driven"];
        return parts.every(part => {
            const element = document.querySelector(`[data-hero-enter="${part}"]`);
            const animation = element.getAnimations()[0];
            if (!animation) return false;
            animation.pause();
            const {delay, duration} = animation.effect.getTiming();
            animation.currentTime = delay;
            const start = element.getBoundingClientRect().top;
            const hidden = getComputedStyle(element).opacity === "0";
            const initialBlur = parseFloat(getComputedStyle(element).filter.slice(5));
            const samples = [0.25, 0.5, 0.75, 0.85].map(progress => {
                animation.currentTime = delay + duration * progress;
                return {progress, top: element.getBoundingClientRect().top, opacity: Number(getComputedStyle(element).opacity), blur: parseFloat(getComputedStyle(element).filter.slice(5)) || 0};
            });
            animation.finish();
            const end = element.getBoundingClientRect().top;
            const isLabel = ["open-source", "self-hosted", "agent-driven"].includes(part);
            const direction = isLabel ? -1 : 1;
            return hidden && initialBlur > 0 && getComputedStyle(element).opacity === "1"
                && getComputedStyle(element).filter === "none"
                && samples.every((sample, index) => Math.abs(sample.opacity - sample.progress) < 0.01
                    && direction * (sample.top - end) >= -0.1
                    && direction * (sample.top - (index ? samples[index - 1].top : start)) <= 0.1
                    && sample.blur <= (index ? samples[index - 1].blur : initialBlur))
                && Math.abs(samples[3].top - end) < 0.1 && samples[3].blur === 0
                && direction * (start - end) > 0 && Math.abs(start - end) <= 8.1;
        });
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('fades and blurs buttons then paragraph then title then grouped labels on scroll', function (int $width, int $height) {
    $page = visit('/')->resize($width, $height);
    $page->assertScript('document.querySelector("[data-hero-content]").hasAttribute("data-scroll-pinned")', true);
    $page->script('() => {
        if (window.heroExitCheckStarted) return;
        window.heroExitCheckStarted = true;
        void (async () => {
        const content = document.querySelector("[data-hero-content]");
        const order = ["buttons", "description", "title", "open-source", "self-hosted", "agent-driven"];
        const elements = order.map(part => content.querySelector(`[data-hero-enter="${part}"]`));
        content.getAnimations({subtree: true}).forEach(animation => animation.finish());
        const scroll = async progress => {
            const start = Number(content.dataset.exitStart);
            const end = Number(content.dataset.exitEnd);
            scrollTo({top: start + (end - start) * progress, behavior: "instant"});
            await new Promise(requestAnimationFrame);
            await new Promise(requestAnimationFrame);
            const target = Math.max(0, Math.min(1, (scrollY - start) / (end - start)));
            const deadline = performance.now() + 1500;
            while (Math.abs(Number(content.dataset.exitProgress) - target) > 0.00001 && performance.now() < deadline) {
                await new Promise(requestAnimationFrame);
            }
            return elements.map(element => Number(getComputedStyle(element).opacity));
        };
        const initial = await scroll(0);
        const initialTops = elements.map(element => element.getBoundingClientRect().top);
        const first = await scroll(0.03);
        if (!initial.every(opacity => opacity === 1) || first[0] >= 1 || !first.slice(1).every(opacity => opacity === 1)) return false;
        const middle = await scroll(0.5);
        if (!middle.every((opacity, index) => opacity > 0 && opacity < 1
            && (index === 0 || (index < 4 ? opacity > middle[index - 1] : opacity === middle[3])))) return false;
        const blur = () => elements.map(element => parseFloat(getComputedStyle(element).filter.slice(5)) || 0);
        const middleBlur = blur();
        if (!middleBlur.every((value, index) => value > 0 && value < 6
            && (index === 0 || (index < 4 ? value < middleBlur[index - 1] : value === middleBlur[3])))) return false;
        if (!elements.every((element, index) => Math.abs(element.getBoundingClientRect().top - initialTops[index]) < 0.1)) return false;
        elements[0].querySelector("a").focus({preventScroll: true});
        const late = await scroll(0.8);
        if (late[0] !== 0 || late[5] <= 0 || !elements[0].inert || content.contains(document.activeElement)) return false;
        const hidden = await scroll(1.1);
        if (!hidden.every(opacity => opacity === 0) || !content.inert || getComputedStyle(content).visibility !== "hidden") return false;
        const reversed = await scroll(0.5);
        if (!reversed.every((opacity, index) => Math.abs(opacity - middle[index]) < 0.01) || elements[0].inert
            || !blur().every((value, index) => Math.abs(value - middleBlur[index]) < 0.01)) return false;
        const restored = await scroll(0);
        elements[0].querySelector("a").focus({preventScroll: true});
        return restored.every(opacity => opacity === 1) && !content.inert
            && elements[0].contains(document.activeElement)
            && elements.every(element => getComputedStyle(element).filter === "none");
        })().then(result => window.heroExitCheckPassed = result);
    }');
    $page->assertScript('window.heroExitCheckPassed', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['wide desktop' => [2083, 1214], 'short desktop' => [1280, 720]]);

it('softens fast scroll changes and finishes the hero exit at the story entrance', function (int $width, int $height) {
    $page = visit('/')->resize($width, $height);
    $page->assertScript('document.querySelector("[data-hero-content]").hasAttribute("data-scroll-pinned")', true);
    $page->assertScript('async () => {
        await document.fonts.ready;
        const content = document.querySelector("[data-hero-content]");
        content.getAnimations({subtree: true}).forEach(animation => animation.finish());
        const copy = document.querySelector("[data-chapter=problem] [data-story-enter=copy]");
        const laptop = document.querySelector("[data-laptop]");
        const start = Number(content.dataset.exitStart);
        const end = Number(content.dataset.exitEnd);
        const bounds = copy.getBoundingClientRect();
        bounds.y -= new DOMMatrix(getComputedStyle(copy.closest(".orbit-story-chapter__grid")).transform).m42;
        const copyStart = bounds.height + 128 > innerHeight
            ? bounds.top + scrollY - innerHeight + 80
            : bounds.top + scrollY + bounds.height / 2 - innerHeight * 0.85;
        if (end <= innerHeight * 0.45 || Math.abs(end - Math.min(copyStart, Number(laptop.dataset.revealStart))) > 1) return false;
        scrollTo({top: start + (end - start) * 0.5, behavior: "instant"});
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        const first = Number(content.dataset.exitProgress);
        const button = content.querySelector("[data-hero-enter=buttons]");
        const initialOpacity = Number(getComputedStyle(button).opacity);
        const initialBlur = parseFloat(getComputedStyle(button).filter.slice(5)) || 0;
        await new Promise(resolve => setTimeout(resolve, 250));
        const later = Number(content.dataset.exitProgress);
        if (!(first > 0 && first < 0.3 && later > first && later < 0.5)
            || Number(getComputedStyle(button).opacity) >= initialOpacity
            || parseFloat(getComputedStyle(button).filter.slice(5)) <= initialBlur) return false;
        scrollTo({top: Math.ceil(end) + 2, behavior: "instant"});
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        return content.inert && getComputedStyle(content).visibility === "hidden"
            && [...content.querySelectorAll("[data-hero-enter]")].every(element => getComputedStyle(element).opacity === "0")
            && (Number(getComputedStyle(copy).opacity) > 0 || Number(laptop.dataset.revealProgress) > 0);
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['wide desktop' => [2083, 1214], 'short desktop' => [1280, 720]]);

it('synchronizes the top labels with the paragraph using equal travel in opposite directions', function () {
    $page = visit('/')->resize(2083, 1214);
    $page->assertScript('document.querySelector("[data-hero-content]").hasAttribute("data-scroll-pinned")', true);
    $page->assertScript('() => {
        const order = ["title", "description", "buttons", "open-source", "self-hosted", "agent-driven"];
        const elements = order.map(part => document.querySelector(`[data-hero-enter="${part}"]`));
        const animations = elements.map(element => element.getAnimations()[0]);
        if (animations.some(animation => !animation)) return false;
        animations.forEach(animation => animation.pause());
        const delays = animations.map(animation => animation.effect.getTiming().delay);
        if (delays[0] < 200 || delays[2] > 500 || !(delays[0] < delays[1] && delays[1] < delays[2])
            || delays.slice(3).some(delay => delay !== delays[1])) return false;
        const stages = [0, 1, 2, 1, 1, 1];
        for (let step = 0; step < 3; step++) {
            const time = delays[step] + 80;
            animations.forEach(animation => animation.currentTime = time);
            const opacities = elements.map(element => Number(getComputedStyle(element).opacity));
            if (!opacities.every((opacity, index) => stages[index] <= step ? opacity > 0 : opacity === 0)) return false;
            if (opacities[3] !== opacities[4] || opacities[4] !== opacities[5]) return false;
        }
        const duration = animations[1].effect.getTiming().duration;
        if (animations.slice(3).some(animation => animation.effect.getTiming().duration !== duration)) return false;
        for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
            animations.forEach(animation => animation.currentTime = delays[1] + duration * progress);
            const paragraph = getComputedStyle(elements[1]);
            const paragraphY = new DOMMatrix(paragraph.transform).m42;
            if (progress === 0 && paragraphY <= 0) return false;
            if (!elements.slice(3).every(element => {
                const label = getComputedStyle(element);
                return label.opacity === paragraph.opacity
                    && Math.abs(new DOMMatrix(label.transform).m42 + paragraphY) < 0.01;
            })) return false;
        }
        animations.forEach(animation => animation.finish());
        return elements.every(element => getComputedStyle(element).opacity === "1")
            && elements[2].querySelectorAll("a").length === 2;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('introduces the horizontal clusters before the vertical constellation', function (int $width) {
    $page = visit('/')->resize($width, 1000);
    $page->assertScript('document.querySelectorAll("[data-hero-stage]").length > 15', true);
    $page->script('() => {
        void (async () => {
        const selectors=["[data-hero-orbit-ring=horizontal]","[data-hero-body=h1]","[data-hero-body=h3]","[data-hero-orbit-ring=vertical]","[data-hero-body=h2]","[data-hero-body=h4]"];
        const elements=selectors.map(selector=>document.querySelector(selector));
        const first=elements.map(el=>parseFloat(getComputedStyle(el).opacity));
        if(first[0]>=1||first.slice(1).some(opacity=>opacity!==0)) return false;
        const appearances=elements.map(()=>null);
        const started=performance.now();
        while(performance.now()-started<3400){
            const now=performance.now()-started;
            elements.forEach((el,index)=>{
                if(appearances[index]===null&&parseFloat(getComputedStyle(el).opacity)>0.01) appearances[index]=now;
            });
            if(elements.every(el=>getComputedStyle(el).opacity==="1")) break;
            await new Promise(resolve=>setTimeout(resolve,50));
        }
        return appearances.every((time,index)=>time!==null&&(index===0||time>appearances[index-1]))
            && [...document.querySelectorAll("[data-hero-stage]:not([data-hero-signal])")].every(el=>getComputedStyle(el).opacity==="1");
        })().then(result => window.heroIntroPassed = result);
    }');
    $page->assertScript('window.heroIntroPassed', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 2083, 'mobile' => 390]);

it('shows the whole intro immediately with reduced motion', function () {
    $page = visit('/', ['reducedMotion' => 'reduce']);
    $page->assertScript('() => {
        const elements=[...document.querySelectorAll("[data-hero-stage]:not([data-hero-signal])")];
        return elements.length>15&&elements.every(el=>getComputedStyle(el).opacity==="1")
            && [...document.querySelectorAll("[data-hero-signal]")].every(el=>getComputedStyle(el).opacity==="0");
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
});

it('lets the whole constellation follow the scroll visibly and fade with the intro', function (int $width, bool $reduced) {
    $page = visit('/', ['reducedMotion' => $reduced ? 'reduce' : 'no-preference'])->resize($width, 1000);
    $page->assertScript('document.querySelector("[data-hero-network]").style.getPropertyValue("--hero-network-offset")!==""', true);
    $page->script('window.networkInitialTop=document.querySelector("[data-hero-network]").getBoundingClientRect().top');
    foreach ([80, 160, 80, 0] as $scroll) {
        $page->script('scrollTo({top:'.$scroll.',behavior:"instant"})');
        $page->assertScript('() => {
            const network=document.querySelector("[data-hero-network]");
            const offset=new DOMMatrix(getComputedStyle(network).transform).m42;
            const reduced=matchMedia("(prefers-reduced-motion:reduce)").matches;
            return (reduced ? offset===0 : '.$scroll.'===0 ? offset===0 : offset>'.$scroll.'*.3&&offset<'.$scroll.'*.6)
                && Math.abs(network.getBoundingClientRect().top-window.networkInitialTop+'.$scroll.'-offset)<1
                && document.documentElement.scrollWidth<=innerWidth;
        }', true);
    }
    if ($width > 1023 && ! $reduced) {
        $page->script('() => {const d=document.querySelector("[data-hero-content]").dataset;scrollTo({top:(Number(d.exitStart)+Number(d.exitEnd))/2,behavior:"instant"})}');
        $page->assertScript('() => {
            const content=document.querySelector("[data-hero-content]");
            const network=document.querySelector("[data-hero-network]");
            return Math.abs(Number(content.dataset.exitProgress)-.5)<.01
                && Math.abs(Number(getComputedStyle(network).opacity)-.25)<.01;
        }', true);
        $page->script('scrollTo({top:Number(document.querySelector("[data-hero-content]").dataset.exitEnd)+2,behavior:"instant"})');
        $page->assertScript('getComputedStyle(document.querySelector("[data-hero-network]")).opacity', '0');
    } else {
        $page->script('document.querySelector("[data-chapter=premise]").scrollIntoView({behavior:"instant"})');
        $page->assertScript('getComputedStyle(document.querySelector("[data-hero-network]")).opacity', '0');
    }
    $page->script('scrollTo({top:0,behavior:"instant"})');
    $page->assertScript('getComputedStyle(document.querySelector("[data-hero-network]")).opacity', '0.5')
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => [2083, false], 'mobile' => [390, false], 'reduced desktop' => [2083, true], 'reduced mobile' => [390, true]]);

it('fades the navigation backdrop in on scroll and clears it at the top', function (int $width, bool $reduced) {
    $page = visit('/', ['reducedMotion' => $reduced ? 'reduce' : 'no-preference'])->resize($width, 1000);
    $page->assertScript('() => {
        const header = document.querySelector(".orbit-story-header");
        const wash = header.querySelector(".orbit-story-header__wash");
        return scrollY === 0 && getComputedStyle(header).backdropFilter === "none"
            && getComputedStyle(header).backgroundColor === "rgba(0, 0, 0, 0)"
            && getComputedStyle(wash).opacity === "0";
    }', true);
    $page->script('window.scrollTo({top:1,behavior:"instant"})');
    $page->assertScript('getComputedStyle(document.querySelector(".orbit-story-header__wash")).opacity', '1');
    $page->script('document.querySelector(".orbit-owned-machine").scrollIntoView({block:"start",behavior:"instant"})');
    $page->assertScript('() => {
        const header=document.querySelector(".orbit-story-header"), wash=header.querySelector(".orbit-story-header__wash");
        const bounds=header.getBoundingClientRect(), style=getComputedStyle(header);
        return (innerWidth<=1100 ? bounds.bottom<=.1 : bounds.top===0) && bounds.left===0 && Math.abs(bounds.width-innerWidth)<.1
            && style.opacity==="1" && style.filter==="none"
            && style.backdropFilter.includes("blur(14px)")
            && getComputedStyle(wash).opacity==="1"
            && header.querySelectorAll("a").length===5;
    }', true);
    $page->script('window.scrollTo({top:0,behavior:"instant"})');
    $page->assertScript('getComputedStyle(document.querySelector(".orbit-story-header__wash")).opacity', '0')
        ->assertScript('getComputedStyle(document.querySelector(".orbit-story-header")).backdropFilter', 'none')
        ->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => [2135, false], 'mobile' => [390, false], 'reduced motion' => [2135, true]]);
