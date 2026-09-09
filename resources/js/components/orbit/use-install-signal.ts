import { useEffect, useRef } from "react";

export function useInstallSignal() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const root = ref.current;
        const source = document.querySelector<SVGCircleElement>("[data-foundation-outlet]");
        const foundation = document.querySelector<HTMLElement>("[data-owned-infrastructure]");
        const handoff = root?.querySelector<HTMLElement>(".orbit-launch__handoff");
        const thread = root?.querySelector<HTMLElement>(".orbit-launch__thread");
        const signal = root?.querySelector<HTMLElement>(".orbit-launch__signal");
        const arrival = root?.querySelector<HTMLElement>(".orbit-launch__arrival");
        const horizon = root?.querySelector<HTMLElement>(".orbit-launch__horizon");
        const wave = root?.querySelector<SVGSVGElement>(".orbit-launch__wave");
        if (
            !root ||
            !source ||
            !foundation ||
            !handoff ||
            !thread ||
            !signal ||
            !arrival ||
            !horizon ||
            !wave
        )
            return;

        const paths = [...wave.querySelectorAll<SVGPathElement>("[data-dome-wave]")];
        const gradients = [
            ...wave.querySelectorAll<SVGLinearGradientElement>("[data-dome-gradient]"),
        ];
        const motion = matchMedia("(prefers-reduced-motion: reduce)");
        let visible = false;
        let animations: Animation[] = [];
        let frame = 0;
        let paintFrame = 0;
        let paintDome: (() => void) | undefined;

        const paint = () => {
            paintFrame = 0;
            paintDome?.();
            if (root.dataset.active === "true") paintFrame = requestAnimationFrame(paint);
        };

        const updatePlayback = () => {
            const active = visible && !document.hidden && !motion.matches;
            root.dataset.active = String(active);
            animations.forEach((animation) => (active ? animation.play() : animation.pause()));
            if (active && !paintFrame) paintFrame = requestAnimationFrame(paint);
            else if (!active && paintFrame) {
                cancelAnimationFrame(paintFrame);
                paintFrame = 0;
            }
        };
        const cancel = () => {
            animations.forEach((animation) => animation.cancel());
            animations = [];
            paintDome = undefined;
        };
        const measure = () => {
            frame = 0;
            const matrix = source.getScreenCTM();
            if (!matrix) return;
            const start = new DOMPoint(
                source.cx.baseVal.value,
                source.cy.baseVal.value,
            ).matrixTransform(matrix);
            const bounds = handoff.getBoundingClientRect();
            const target = arrival.getBoundingClientRect();
            const dome = horizon.getBoundingClientRect();
            const notes = [
                ...foundation.querySelectorAll<HTMLElement>(".orbit-foundation__notes"),
            ].map((note) => note.getBoundingClientRect());
            const distance = Math.max(0, target.top + target.height / 2 - start.y);
            const trail = parseFloat(getComputedStyle(signal).height);

            thread.style.top = `${start.y - bounds.top}px`;
            thread.style.left = `${start.x - bounds.left}px`;
            thread.style.setProperty(
                "--thread-gap-start",
                `${Math.min(...notes.map((note) => note.top)) - start.y - 16}px`,
            );
            thread.style.setProperty(
                "--thread-gap-end",
                `${Math.max(...notes.map((note) => note.bottom)) - start.y + 16}px`,
            );

            // Follow the center of the existing one-pixel elliptical border.
            const cx = dome.left + dome.width / 2 - bounds.left;
            const top = dome.top - bounds.top + 0.5;
            const rx = dome.width / 2 - 0.5;
            const ry = dome.height / 2 - 0.5;
            wave.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);
            paths.forEach((path, index) => {
                path.setAttribute(
                    "d",
                    `M ${cx} ${top} A ${rx} ${ry} 0 0 ${index} ${cx + (index === 0 ? -rx : rx)} ${top + ry}`,
                );
                path.style.strokeDasharray = `${trail} ${path.getTotalLength() + trail}`;
            });

            cancel();
            if (motion.matches) {
                updatePlayback();
                return;
            }

            const fall = Math.max(1400, Math.min(3600, (distance / 220) * 1000));
            const tail = (trail / Math.max(distance, 1)) * fall;
            const spread = 700;
            // End three quarters of the way to the visible edge, including on
            // phones where most of the ellipse extends beyond the viewport.
            const reach = Math.min(rx, bounds.width / 2) * 0.75;
            let lower = 0;
            let upper = paths[0].getTotalLength();
            for (let step = 0; step < 16; step++) {
                const midpoint = (lower + upper) / 2;
                if (Math.abs(paths[0].getPointAtLength(midpoint).x - cx) < reach) lower = midpoint;
                else upper = midpoint;
            }
            const travel = (lower + upper) / 2;
            const duration = fall + Math.max(spread, tail) + 1200;
            const impact = fall / duration;
            const options = { duration, iterations: Infinity, easing: "linear" };
            const descent = signal.animate(
                [
                    { transform: "translateY(0)", opacity: 1, offset: 0 },
                    { transform: `translateY(${distance}px)`, opacity: 1, offset: impact },
                    {
                        transform: `translateY(${distance + trail}px)`,
                        opacity: 0,
                        offset: (fall + tail) / duration,
                    },
                    { transform: `translateY(${distance + trail}px)`, opacity: 0, offset: 1 },
                ],
                options,
            );
            descent.id = "orbit-install-descent";
            animations.push(descent);

            paths.forEach((path) => {
                const at = (time: number, opacity: number) => ({
                    strokeDashoffset: trail - (travel * time) / spread,
                    opacity,
                    offset: (fall + time) / duration,
                });
                const animation = path.animate(
                    [
                        { strokeDashoffset: trail, opacity: 0, offset: 0 },
                        at(0, 0),
                        at(90, 1),
                        at(250, 1),
                        at(spread, 0),
                        { strokeDashoffset: trail - travel, opacity: 0, offset: 1 },
                    ],
                    options,
                );
                animation.id = `orbit-install-wave-${path.dataset.domeWave}`;
                animations.push(animation);
            });
            // Keep the gradient's transparent tail and bright head on the curve.
            // Only its endpoints need updating; the browser animates the stroke.
            paintDome = () => {
                if (typeof descent.currentTime !== "number") return;
                const elapsed = (descent.currentTime % duration) - fall;
                if (elapsed < 0 || elapsed > spread) return;
                const head = (travel * elapsed) / spread;
                paths.forEach((path, index) => {
                    const from = path.getPointAtLength(Math.max(0, head - trail));
                    const to = path.getPointAtLength(head);
                    const gradient = gradients[index];
                    gradient.setAttribute("x1", String(from.x));
                    gradient.setAttribute("y1", String(from.y));
                    gradient.setAttribute("x2", String(to.x));
                    gradient.setAttribute("y2", String(to.y));
                });
            };
            const flash = arrival.animate(
                [
                    { borderColor: "var(--line-strong)", offset: 0 },
                    { borderColor: "var(--line-strong)", offset: impact },
                    { borderColor: "var(--text-primary)", offset: (fall + 90) / duration },
                    { borderColor: "var(--line-strong)", offset: (fall + 700) / duration },
                    { borderColor: "var(--line-strong)", offset: 1 },
                ],
                options,
            );
            flash.id = "orbit-install-impact";
            animations.push(flash);
            // All four animations share the same clock, including after a resize.
            animations.forEach((animation) => {
                animation.pause();
                animation.currentTime = 0;
            });
            updatePlayback();
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(measure);
        };
        const resize = new ResizeObserver(schedule);
        resize.observe(foundation);
        resize.observe(root);
        const observer = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            updatePlayback();
        });
        observer.observe(thread);
        window.addEventListener("resize", schedule);
        document.addEventListener("visibilitychange", updatePlayback);
        motion.addEventListener("change", schedule);
        measure();
        return () => {
            cancel();
            if (frame) cancelAnimationFrame(frame);
            if (paintFrame) cancelAnimationFrame(paintFrame);
            observer.disconnect();
            resize.disconnect();
            window.removeEventListener("resize", schedule);
            document.removeEventListener("visibilitychange", updatePlayback);
            motion.removeEventListener("change", schedule);
        };
    }, []);

    return ref;
}
