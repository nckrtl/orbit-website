import { useEffect, useRef } from "react";

const travelTime = 1800;
const restTime = 350;
const signalLength = 16;

export function usePrivateNetworkSignal() {
    const ref = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const scene = ref.current;
        if (!scene) return;
        const signal = scene.querySelector<SVGPathElement>("[data-network-signal]")!;
        const routes = [...scene.querySelectorAll<SVGPathElement>("[data-network-link]")].map(
            (path) => ({ path, length: path.getTotalLength() }),
        );
        const motion = matchMedia("(prefers-reduced-motion: reduce)");
        let visible = false;
        let frame = 0;
        let elapsed = 0;
        let previous: number | null = null;

        const paint = (time: number) => {
            if (previous !== null) elapsed += time - previous;
            previous = time;
            const turn = Math.floor(elapsed / (travelTime + restTime));
            const progress = (elapsed % (travelTime + restTime)) / travelTime;
            const route = turn % routes.length;
            const inbound = turn % 2 === 0;
            const { path, length } = routes[route];
            const distance = Math.min(1, progress);
            const head = (inbound ? 1 - distance : distance) * length;
            const tail = Math.max(
                0,
                Math.min(length, head + (inbound ? signalLength : -signalLength)),
            );
            // Sample along the route so the short signal follows each corner precisely.
            const points = Array.from({ length: 9 }, (_, index) => {
                const point = path.getPointAtLength(tail + ((head - tail) * index) / 8);
                return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`;
            });
            signal.setAttribute("d", points.join(" "));
            signal.setAttribute("visibility", progress < 1 ? "visible" : "hidden");
            signal.dataset.route = String(route);
            signal.dataset.direction = inbound ? "to-coin" : "to-device";
            signal.dataset.progress = String(distance);
            frame = requestAnimationFrame(paint);
        };
        const activity = () => {
            cancelAnimationFrame(frame);
            previous = null;
            const active = visible && !document.hidden && !motion.matches;
            scene.dataset.networkActive = String(active);
            signal.setAttribute("visibility", "hidden");
            if (active) frame = requestAnimationFrame(paint);
        };
        const observer = new IntersectionObserver((entries) => {
            visible = entries[entries.length - 1].isIntersecting;
            activity();
        });
        observer.observe(scene);
        motion.addEventListener("change", activity);
        document.addEventListener("visibilitychange", activity);
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            motion.removeEventListener("change", activity);
            document.removeEventListener("visibilitychange", activity);
        };
    }, []);

    return ref;
}
