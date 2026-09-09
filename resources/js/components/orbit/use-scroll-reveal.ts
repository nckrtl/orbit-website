import { useEffect, type RefObject } from "react";
import { storyEntranceEnd } from "./story-entrance";

type RevealElement = HTMLElement | SVGElement;
type AddReveal = (
    target: string | RevealElement,
    step?: number,
    anchor?: Element,
    art?: boolean | "veil",
) => void;
export type RevealSequence = (section: HTMLElement, add: AddReveal) => void;

export function useScrollReveal(
    ref: RefObject<HTMLElement | null>,
    sequence: RevealSequence,
    namespace: "build" | "foundation" | "install",
) {
    useEffect(() => {
        const section = ref.current;
        if (!section) return;
        const motion = matchMedia("(prefers-reduced-motion: reduce)");
        const parts: {
            element: HTMLElement | SVGElement;
            anchor: Element;
            step: number;
            art: boolean | "veil";
            start: number;
            distance: number;
            progress: number;
        }[] = [];
        const add: AddReveal = (target, step = 0, anchor, art = false) => {
            const elements =
                typeof target === "string"
                    ? section.querySelectorAll<RevealElement>(target)
                    : [target];
            elements.forEach((element) => {
                parts.push({
                    element,
                    anchor: anchor ?? element,
                    step,
                    art,
                    start: 0,
                    distance: 1,
                    progress: -1,
                });
                element.setAttribute(`data-${namespace}-reveal`, "");
            });
        };
        sequence(section, add);
        let frame = 0;
        let disposed = false;
        const paint = () => {
            frame = 0;
            for (const part of parts) {
                const progress =
                    motion.matches || part.element.contains(document.activeElement)
                        ? 1
                        : Math.max(0, Math.min(1, (scrollY - part.start) / part.distance));
                if (progress === part.progress) continue;
                part.progress = progress;
                if (part.art === "veil") {
                    part.element.style.setProperty("--scroll-veil-progress", String(progress));
                    part.element.setAttribute(`data-${namespace}-progress`, String(progress));
                    continue;
                }
                part.element.style.opacity = String(progress);
                part.element.style.filter =
                    progress === 1
                        ? "none"
                        : `blur(calc(var(--blur-story-layer) * ${1 - progress}))`;
                part.element.setAttribute(`data-${namespace}-progress`, String(progress));
            }
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(paint);
        };
        const measure = () => {
            if (disposed) return;
            const stagger = parseFloat(
                getComputedStyle(section).getPropertyValue("--step-story-copy"),
            );
            const maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
            for (const part of parts) {
                const bounds = part.anchor.getBoundingClientRect();
                if (part.art === "veil") {
                    part.start = bounds.top + scrollY - innerHeight * 0.9;
                    part.distance = bounds.height + innerHeight * 0.1;
                } else if (part.art) {
                    const end = storyEntranceEnd(bounds, scrollY, innerHeight);
                    const span = Math.max(180, innerHeight * 0.4);
                    part.start = end - span + part.step * span * 0.09;
                    part.distance = span * 0.46;
                } else {
                    part.start =
                        bounds.top +
                        scrollY -
                        innerHeight * 0.9 +
                        part.step * innerHeight * 0.25 * stagger;
                    part.distance = innerHeight * 0.22;
                }
                // The final prompt must finish revealing before the page runs out of scroll.
                const end = Math.min(part.start + part.distance, maxScroll);
                part.start = Math.min(part.start, end - part.distance * 0.5);
                part.distance = Math.max(1, end - part.start);
                part.element.setAttribute(`data-${namespace}-reveal-start`, String(part.start));
                part.element.setAttribute(`data-${namespace}-reveal-end`, String(end));
            }
            schedule();
        };
        const resize = new ResizeObserver(measure);
        resize.observe(section);
        const main = section.closest("main");
        if (main) resize.observe(main);
        // Keyboard focus makes an entering control crisp immediately.
        section.addEventListener("focusin", schedule);
        section.addEventListener("focusout", schedule);
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", measure);
        window.addEventListener("pageshow", measure);
        motion.addEventListener("change", schedule);
        void document.fonts.ready.then(measure);
        measure();
        return () => {
            disposed = true;
            cancelAnimationFrame(frame);
            resize.disconnect();
            section.removeEventListener("focusin", schedule);
            section.removeEventListener("focusout", schedule);
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", measure);
            window.removeEventListener("pageshow", measure);
            motion.removeEventListener("change", schedule);
            for (const { element } of parts) {
                element.style.removeProperty("--scroll-veil-progress");
                element.style.removeProperty("opacity");
                element.style.removeProperty("filter");
                for (const suffix of ["reveal", "progress", "reveal-start", "reveal-end"]) {
                    element.removeAttribute(`data-${namespace}-${suffix}`);
                }
            }
        };
    }, [ref, sequence, namespace]);
}
