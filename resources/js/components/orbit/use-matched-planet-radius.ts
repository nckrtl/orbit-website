import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { gatewayPlanetRadius } from "./orbit-planet";

// Match the rendered size, not just SVG units: each capability has a different viewBox.
export function useMatchedPlanetRadius(ref: RefObject<SVGSVGElement | null>) {
    const [radius, setRadius] = useState(gatewayPlanetRadius);
    useEffect(() => {
        const scene = ref.current;
        const reference = scene
            ?.closest("[data-capabilities]")
            ?.querySelector<SVGCircleElement>("[data-agent-planet] circle");
        if (!scene || !reference) return;
        const measure = () => {
            const matrix = scene.getScreenCTM();
            if (!matrix) return;
            const scale = Math.hypot(matrix.a, matrix.b);
            const diameter = reference.getBoundingClientRect().width;
            if (scale > 0 && diameter > 0) setRadius(diameter / (2 * scale));
        };
        const observer = new ResizeObserver(measure);
        observer.observe(scene);
        observer.observe(reference.ownerSVGElement!);
        measure();
        return () => observer.disconnect();
    }, [ref]);
    return radius;
}
