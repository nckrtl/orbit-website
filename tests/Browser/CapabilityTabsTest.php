<?php

it('joins rounded tab faces with opaque thin sides and clean corners', function (int $width) {
    $page = visit('/', ['reducedMotion' => 'reduce'])->resize($width, 1000);
    $page->assertPresent('[data-tab-backing]');
    $page->assertScript('() => {
        const backings=[...document.querySelectorAll("[data-tab-backing]")];
        if(backings.length!==15) return false;
        const canvas=document.createElement("canvas");
        canvas.width=canvas.height=1;
        const context=canvas.getContext("2d");
        const color=element=>{
            context.clearRect(0,0,1,1);
            context.fillStyle=getComputedStyle(element).fill;
            context.fillRect(0,0,1,1);
            return context.getImageData(0,0,1,1).data;
        };
        return backings.every(back=>{
            const face=back.parentElement.querySelector("rect");
            const side=back.parentElement.querySelector("[data-tab-side]");
            const edges=back.parentElement.querySelector("[data-tab-edges]");
            const b=back.getBBox();
            const f=face.getBBox();
            const dx=b.x-f.x, dy=b.y-f.y;
            const topMidpoint=new DOMPoint(f.x+f.width/2+dx/2,f.y+dy/2);
            const rightMidpoint=new DOMPoint(f.x+f.width+dx/2,f.y+f.height/2+dy/2);
            const radius=face.rx.baseVal.value;
            const rearColor=color(back), frontColor=color(face);
            return radius>0 && Number(back.dataset.radius)===radius
                && Math.abs(b.width-face.width.baseVal.value)<.01
                && Math.abs(b.height-face.height.baseVal.value)<.01
                && !back.isPointInFill(new DOMPoint(b.x+.05,b.y+.05))
                && back.isPointInFill(new DOMPoint(b.x+b.width/2,b.y+b.height/2))
                && rearColor[3]===255 && color(side)[3]===255
                && rearColor[0]>frontColor[0] && rearColor[0]-frontColor[0]<30
                && [back,side].every(element=>getComputedStyle(element).fillOpacity==="1" && getComputedStyle(element).opacity==="1")
                && Math.abs(dx-6)<.01 && Math.abs(dy+6)<.01
                && side.isPointInFill(topMidpoint) && side.isPointInFill(rightMidpoint)
                && getComputedStyle(side).fill!=="none"
                && getComputedStyle(side).stroke!=="none"
                && !edges;
        });
    }', true);
    $page->script('document.querySelector("[data-capability=store]").scrollIntoView({block:"center",behavior:"instant"})');
    $page->assertScript('() => {
        const tiles=[...document.querySelectorAll("[data-inventory-tile]")];
        const widths=tiles.map(tile=>tile.querySelector("rect").width.baseVal.value);
        const longest=tiles.find(tile=>tile.textContent.trim()==="processes").querySelector("text");
        const padding=widths[0]-longest.getComputedTextLength();
        return widths.every(width=>width===widths[0]) && widths[0]<100
            && longest.x.baseVal[0].value===10 && padding>=20 && padding<21;
    }', true);
    $page->assertScript('() => {
        const drawing=document.querySelector("[data-capability=store] svg");
        const circle=drawing.querySelector("[data-capability-planet] circle");
        const connector=drawing.querySelector("[data-planet-connection]");
        const from=connector.getPointAtLength(0).matrixTransform(connector.getScreenCTM()).matrixTransform(circle.getScreenCTM().inverse());
        const end=connector.getPointAtLength(connector.getTotalLength()).matrixTransform(connector.getScreenCTM()).matrixTransform(circle.getScreenCTM().inverse());
        return circle.isPointInFill(from) && !circle.isPointInFill(end)
            && Boolean(circle.compareDocumentPosition(connector)&Node.DOCUMENT_POSITION_FOLLOWING)
            && document.documentElement.scrollWidth<=innerWidth;
    }', true)->assertNoJavaScriptErrors()->assertNoConsoleLogs();
})->with(['desktop' => 2135, 'mobile' => 390]);
