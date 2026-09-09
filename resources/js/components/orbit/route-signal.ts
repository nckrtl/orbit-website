import { observeSceneActivity } from "./animation";

// Animate a short dash on the original route. The browser follows every bend;
// JavaScript only runs when changing routes, not to sample SVG geometry per frame.
export function animateRouteSignal(
    scene: SVGSVGElement,
    signal: SVGPathElement,
    paths: SVGPathElement[],
    { activityKey, alternate = false }: { activityKey: string; alternate?: boolean },
) {
    const routes = paths.map((path) => ({
        d: path.getAttribute("d")!,
        length: path.getTotalLength(),
        id: path.dataset.doctorRoute ?? path.dataset.networkLink!,
    }));
    let turn = 0;
    let animation: Animation | undefined;
    let active = false;
    const run = () => {
        const route = routes[turn % routes.length];
        if (!route) return;
        const inbound = alternate && turn % 2 === 0;
        const dash = 16;
        const start = inbound ? -route.length : dash;
        const end = inbound ? 0 : dash - route.length;
        const arrival = 1800 / 2150;
        signal.setAttribute("d", route.d);
        signal.style.strokeDasharray = `${dash} ${route.length + dash}`;
        signal.dataset.route = route.id;
        signal.dataset.direction = inbound ? "to-coin" : "to-device";
        animation = signal.animate(
            [
                { strokeDashoffset: start, opacity: 1, offset: 0 },
                { strokeDashoffset: end, opacity: 1, offset: arrival },
                { strokeDashoffset: end, opacity: 0, offset: arrival },
                { strokeDashoffset: end, opacity: 0, offset: 1 },
            ],
            { duration: 2150, easing: "linear", fill: "both" },
        );
        animation.id = "orbit-route-signal";
        animation.onfinish = () => {
            animation?.cancel();
            turn++;
            run();
        };
        if (!active) animation.pause();
    };
    const unobserve = observeSceneActivity(scene, (activity) => {
        active = activity.active;
        scene.dataset[activityKey] = String(active);
        signal.setAttribute("visibility", active ? "visible" : "hidden");
        if (active) {
            if (!animation) run();
            else animation.play();
        } else if (activity.reducedMotion) {
            if (animation) animation.onfinish = null;
            animation?.cancel();
            animation = undefined;
        } else animation?.pause();
    });
    return () => {
        unobserve();
        if (animation) animation.onfinish = null;
        animation?.cancel();
    };
}
