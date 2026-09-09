type Activity = { active: boolean; visible: boolean; reducedMotion: boolean };
type ActivityListener = (activity: Activity) => void;
type Scene = { visible: boolean; listeners: Set<ActivityListener> };

// Lazily created in effects: SSR never touches browser globals or retains scenes.
function createActivityObserver() {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const scenes = new Map<Element, Scene>();
    const notify = (scene: Scene) => {
        const visible = scene.visible && !document.hidden;
        scene.listeners.forEach((listener) =>
            listener({
                visible,
                active: visible && !motion.matches,
                reducedMotion: motion.matches,
            }),
        );
    };
    const sync = () => scenes.forEach(notify);
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const scene = scenes.get(entry.target);
            if (!scene) return;
            scene.visible = entry.isIntersecting;
            notify(scene);
        });
    });
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    return {
        observe(element: Element, listener: ActivityListener) {
            let scene = scenes.get(element);
            if (!scene) {
                scene = { visible: false, listeners: new Set() };
                scenes.set(element, scene);
                observer.observe(element);
            }
            scene.listeners.add(listener);
            const visible = scene.visible && !document.hidden;
            listener({
                visible,
                active: visible && !motion.matches,
                reducedMotion: motion.matches,
            });
            return () => {
                scene.listeners.delete(listener);
                if (scene.listeners.size) return;
                observer.unobserve(element);
                scenes.delete(element);
                if (scenes.size) return;
                observer.disconnect();
                document.removeEventListener("visibilitychange", sync);
                motion.removeEventListener("change", sync);
                activityObserver = undefined;
            };
        },
    };
}

let activityObserver: ReturnType<typeof createActivityObserver> | undefined;

export function observeSceneActivity(element: Element, listener: ActivityListener) {
    activityObserver ??= createActivityObserver();
    return activityObserver.observe(element, listener);
}

// All procedural scenes share one frame callback. Slow details have their own
// cadence; 120/144Hz displays don't multiply SVG path work. No React frame state.
const frames = new Set<(now: number) => void>();
let frame = 0;
function tick(now: number) {
    frame = 0;
    frames.forEach((paint) => paint(now));
    if (frames.size) frame = requestAnimationFrame(tick);
}

export function animateScene(
    element: Element,
    paint: (elapsed: number, delta: number) => void,
    { fps = () => 60, onActivity }: { fps?: () => number; onActivity?: ActivityListener } = {},
) {
    let elapsed = 0;
    let previous: number | null = null;
    let lastPaint = -Infinity;
    let active = false;
    const draw = (now: number) => {
        if (now - lastPaint < 1000 / fps() - 0.5) return;
        const delta = previous === null ? 0 : Math.min(now - previous, 100) / 1000;
        elapsed += delta;
        previous = now;
        lastPaint = now;
        paint(elapsed, delta);
    };
    const stop = () => {
        frames.delete(draw);
        previous = null;
        lastPaint = -Infinity;
        if (!frames.size) {
            cancelAnimationFrame(frame);
            frame = 0;
        }
    };
    const unobserve = observeSceneActivity(element, (activity) => {
        onActivity?.(activity);
        if (activity.active === active) return;
        active = activity.active;
        if (active) {
            frames.add(draw);
            if (!frame) frame = requestAnimationFrame(tick);
        } else stop();
    });
    return () => {
        stop();
        unobserve();
    };
}
