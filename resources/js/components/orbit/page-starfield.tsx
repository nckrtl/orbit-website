import { useEffect, useRef } from "react";
import { cancelScrollFrame, observeScroll, requestScrollFrame } from "./animation";

export function PageStarfield() {
    const planeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const plane = planeRef.current;
        if (!plane) return;
        const motion = matchMedia("(prefers-reduced-motion: reduce)");
        const hero = document.querySelector<HTMLElement>("[data-hero-content]");
        const style = getComputedStyle(plane);
        const tileHeight = parseFloat(style.getPropertyValue("--page-star-tile-height"));
        const speed = Number(style.getPropertyValue("--page-star-parallax"));
        let frame = 0;
        let previous = -1;
        const paint = (_now: number, scrollTop: number) => {
            frame = 0;
            if (document.hidden) return;
            // One extra texture row keeps every edge covered even when the
            // main thread is late. A whole-tile wrap is visually identical.
            const top = Math.max(0, scrollTop);
            // The desktop intro is pinned, but the story scrolls at 1x. Add
            // that document travel as the intro exits, so the stars retain
            // their apparent speed relative to the copy. Integrating the
            // ramp keeps both position and speed continuous at its edges.
            let documentTravel = 0;
            if (hero?.hasAttribute("data-scroll-pinned")) {
                const start = Number(hero.dataset.exitStart);
                const end = Number(hero.dataset.exitEnd);
                if (end > start && top > start) {
                    const distance = Math.min(top, end) - start;
                    documentTravel = distance ** 2 / (2 * (end - start)) + Math.max(0, top - end);
                }
            }
            const offset = motion.matches ? 0 : (top * speed + documentTravel) % tileHeight;
            if (offset === previous) return;
            previous = offset;
            plane.style.transform = offset === 0 ? "" : `translate3d(0, ${-offset}px, 0)`;
        };
        const schedule = () => {
            if (!frame && !document.hidden) frame = requestScrollFrame(paint);
        };
        const visibility = () => {
            if (document.hidden) {
                cancelScrollFrame(frame);
                frame = 0;
            } else schedule();
        };
        const stopScroll = observeScroll(schedule);
        motion.addEventListener("change", schedule);
        window.addEventListener("resize", schedule);
        document.addEventListener("visibilitychange", visibility);
        schedule();
        return () => {
            stopScroll();
            cancelScrollFrame(frame);
            motion.removeEventListener("change", schedule);
            window.removeEventListener("resize", schedule);
            document.removeEventListener("visibilitychange", visibility);
        };
    }, []);

    return (
        <div className="orbit-page-starfield" data-page-stars="" aria-hidden="true">
            <div ref={planeRef} className="orbit-starfield__stars" />
        </div>
    );
}
