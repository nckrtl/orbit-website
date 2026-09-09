import { useEffect, type RefObject } from "react";

// Keep a single animated scene; change the camera rather than duplicating SVGs
// and their animation loops. The server and first client render stay identical.
export function useSceneViewport(
    ref: RefObject<SVGSVGElement | null>,
    desktop: string,
    phone: string,
    tablet = desktop,
) {
    useEffect(() => {
        const scene = ref.current;
        if (!scene) return;
        const small = matchMedia("(max-width: 600px)");
        const medium = matchMedia("(max-width: 1100px)");
        const frame = () => {
            scene.setAttribute(
                "viewBox",
                small.matches ? phone : medium.matches ? tablet : desktop,
            );
        };
        frame();
        small.addEventListener("change", frame);
        medium.addEventListener("change", frame);
        return () => {
            small.removeEventListener("change", frame);
            medium.removeEventListener("change", frame);
            scene.setAttribute("viewBox", desktop);
        };
    }, [ref, desktop, phone, tablet]);
}
