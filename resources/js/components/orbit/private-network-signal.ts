import { useEffect, useRef } from "react";
import { animateRouteSignal } from "./route-signal";

export function usePrivateNetworkSignal() {
    const ref = useRef<SVGSVGElement>(null);
    useEffect(() => {
        const scene = ref.current;
        if (!scene) return;
        return animateRouteSignal(
            scene,
            scene.querySelector<SVGPathElement>("[data-network-signal]")!,
            [...scene.querySelectorAll<SVGPathElement>("[data-network-link]")],
            { activityKey: "networkActive", alternate: true },
        );
    }, []);
    return ref;
}
