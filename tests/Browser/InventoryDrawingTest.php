<?php

it('connects isometric inventory tiles using the same projection as the namespace drawing', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->assertPresent('[data-capability-planet]');
    $page->script('document.querySelector("[data-capability=store]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertScript('async () => {
        await document.fonts.ready;
        const drawing=document.querySelector("[data-capability=store] svg");
        const gateway=drawing.querySelector("[data-capability-planet]");
        const circle=gateway.querySelector("circle");
        const latitudes=gateway.querySelector("path");
        const bounds=circle.getBoundingClientRect();
        const center=new DOMPoint(0,0).matrixTransform(circle.getScreenCTM());
        if(bounds.width<=0 || Math.abs(bounds.width-bounds.height)>.1 || !latitudes.getAttribute("d").includes("a")) return false;
        if(drawing.getAnimations({subtree:true}).length!==0) return false;
        if(![circle,latitudes].every(el=>getComputedStyle(el).strokeWidth==="1px"
            &&getComputedStyle(el).vectorEffect==="non-scaling-stroke")) return false;
        const namespaces=[...drawing.querySelectorAll("[data-inventory-item]")];
        if(namespaces.map(el=>el.querySelector("text").textContent).join(",")!=="nodes,apps,routes,tools,processes") return false;
        for(const namespace of namespaces) {
            const route=namespace.querySelector("[data-inventory-route]");
            if(parseFloat(getComputedStyle(route).strokeDashoffset)!==0) return false;
            const tile=namespace.querySelector("[data-inventory-tile]");
            const face=tile.querySelector("rect");
            const matrix=face.getScreenCTM();
            const reference=document.querySelector("[data-namespace-tile]").transform.baseVal.consolidate().matrix;
            const projection=tile.transform.baseVal.consolidate().matrix;
            if(["a","b","c","d"].some(key=>Math.abs(reference[key]-projection[key])>.001)) return false;
            const from=route.getPointAtLength(0).matrixTransform(route.getScreenCTM());
            const end=route.getPointAtLength(route.getTotalLength()).matrixTransform(route.getScreenCTM());
            const port=new DOMPoint(0,0).matrixTransform(matrix);
            const sourceDistance=Math.hypot(from.x-center.x,from.y-center.y);
            if(sourceDistance>=bounds.width/2 || sourceDistance<bounds.width*.35
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
