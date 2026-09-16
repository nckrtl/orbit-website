type Activity = { active: boolean; visible: boolean; reducedMotion: boolean };
type ActivityListener = (activity: Activity) => void;
type Scene = { element: Element; visible: boolean; listeners: Set<ActivityListener> };
const hiddenScenes = new WeakMap<Element, Set<string>>();

// IntersectionObserver only checks bounds. A faded-out scene can still overlap
// the viewport, so its scroll controllers also report their visibility gates.
export function setSceneHidden(element: Element, source: string, hidden: boolean) {
    const sources = hiddenScenes.get(element) ?? new Set<string>();
    if (sources.has(source) === hidden) return;
    if (hidden) sources.add(source);
    else sources.delete(source);
    hiddenScenes.set(element, sources);
    activityObserver?.refresh(element);
}

// Lazily created in effects: SSR never touches browser globals or retains scenes.
function createActivityObserver() {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const scenes = new Map<Element, Scene>();
    const notify = (scene: Scene) => {
        const visible = scene.visible && !document.hidden && !hiddenScenes.get(scene.element)?.size;
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
        refresh(element: Element) {
            const scene = scenes.get(element);
            if (scene) notify(scene);
        },
        observe(element: Element, listener: ActivityListener) {
            let scene = scenes.get(element);
            if (!scene) {
                scene = { element, visible: false, listeners: new Set() };
                scenes.set(element, scene);
                observer.observe(element);
            }
            scene.listeners.add(listener);
            const visible = scene.visible && !document.hidden && !hiddenScenes.get(element)?.size;
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
type FramePaint = (now: number, scrollTop: number) => void;
const frames = new Set<FramePaint>();
const scrollFrames = new Map<number, FramePaint>();
const scrollListeners = new Set<() => void>();
let scrollFrameId = 0;
let frame = 0;
let painting = false;
let scrollPosition = 0;
let scrollingUntil = 0;
let previousFrame = 0;
let slowScrollFrames = 0;
let deferAmbientMotion = false;

function onScroll() {
    // Capture once in the passive event, before CSS animations advance for
    // the next frame. Reading scrollY in rAF can flush their pending styles.
    scrollPosition = window.scrollY;
    const now = performance.now();
    if (now >= scrollingUntil) {
        slowScrollFrames = 0;
        deferAmbientMotion = false;
        previousFrame = 0;
    }
    scrollingUntil = now + 180;
    scrollListeners.forEach((schedule) => schedule());
}

export function observeScroll(schedule: () => void) {
    if (!scrollListeners.size) {
        scrollPosition = window.scrollY;
        scrollingUntil = 0;
        previousFrame = 0;
        slowScrollFrames = 0;
        deferAmbientMotion = false;
        window.addEventListener("scroll", onScroll, { passive: true });
    }
    scrollListeners.add(schedule);
    return () => {
        scrollListeners.delete(schedule);
        if (!scrollListeners.size) window.removeEventListener("scroll", onScroll);
    };
}

function tick(now: number) {
    // Read before any scene writes. Separate rAF callbacks reading scrollY
    // after another callback mutates SVG/styles force repeated layout flushes.
    const scrollTop = scrollListeners.size ? scrollPosition : window.scrollY;
    if (now >= scrollingUntil) {
        deferAmbientMotion = false;
        slowScrollFrames = 0;
    } else if (previousFrame) {
        const interval = now - previousFrame;
        slowScrollFrames = interval > 24 && interval < 250 ? slowScrollFrames + 1 : 0;
        // Under sustained frame pressure, give scroll-linked effects priority.
        // Freeze optional procedural motion until scrolling settles, preserving
        // its clock/pose. No battery API, device guess, or permanent FPS cap.
        if (slowScrollFrames >= 3) deferAmbientMotion = true;
    }
    previousFrame = now;
    painting = true;
    const pending = [...scrollFrames.keys()];
    for (const id of pending) {
        const paint = scrollFrames.get(id);
        scrollFrames.delete(id);
        paint?.(now, scrollTop);
    }
    frames.forEach((paint) => paint(now, scrollTop));
    painting = false;
    frame = 0;
    if (frames.size || scrollFrames.size) frame = requestAnimationFrame(tick);
}

export function requestScrollFrame(paint: FramePaint) {
    const id = ++scrollFrameId;
    scrollFrames.set(id, paint);
    if (!frame && !painting) frame = requestAnimationFrame(tick);
    return id;
}

export function cancelScrollFrame(id: number) {
    scrollFrames.delete(id);
    if (!frames.size && !scrollFrames.size) {
        cancelAnimationFrame(frame);
        frame = 0;
    }
}

export function animateScene(
    element: Element,
    paint: (elapsed: number, delta: number, scrollTop: number) => void,
    { fps = () => 60, onActivity }: { fps?: () => number; onActivity?: ActivityListener } = {},
) {
    let elapsed = 0;
    let previous: number | null = null;
    let nextPaint: number | null = null;
    let active = false;
    const draw = (now: number, scrollTop: number) => {
        if (deferAmbientMotion) {
            previous = null;
            nextPaint = null;
            return;
        }
        if (nextPaint !== null && now + 0.5 < nextPaint) return;
        const interval = 1000 / fps();
        // Carry the remainder forward: resetting the interval to `now` turns
        // a 60fps scene into 48fps on a 144Hz display. Drop missed frames after
        // a stall instead of trying to catch up with a burst of work.
        nextPaint = Math.max(nextPaint ?? now, now - interval) + interval;
        const delta = previous === null ? 0 : Math.min(now - previous, 100) / 1000;
        elapsed += delta;
        previous = now;
        paint(elapsed, delta, scrollTop);
    };
    const stop = () => {
        frames.delete(draw);
        previous = null;
        nextPaint = null;
        if (!frames.size && !scrollFrames.size) {
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
            if (!frame && !painting) frame = requestAnimationFrame(tick);
        } else stop();
    });
    return () => {
        stop();
        unobserve();
    };
}
