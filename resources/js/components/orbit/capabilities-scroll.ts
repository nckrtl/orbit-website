import { cancelScrollFrame, observeScroll, requestScrollFrame } from "./animation";
import { useEffect, useRef } from "react";

export function useCapabilitiesScroll() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = ref.current;
        const label = element?.firstElementChild;
        const grid = element?.querySelector(".orbit-capabilities__grid");
        if (!element || !label || !grid) return;
        const motion = matchMedia("(prefers-reduced-motion: reduce)");
        let frame = 0;
        let disposed = false;
        let lastEntering = -1;
        let lastExiting = -1;
        let enterStart = 0,
            enterDistance = 1,
            exitStart = 0,
            exitDistance = 1;
        const clamp = (value: number) => Math.max(0, Math.min(1, value));
        const paint = (_time: number, scrollTop: number) => {
            frame = 0;
            const entering = motion.matches ? 1 : clamp((scrollTop - enterStart) / enterDistance);
            const exiting = motion.matches ? 0 : clamp((scrollTop - exitStart) / exitDistance);
            if (entering === lastEntering && exiting === lastExiting) return;
            lastEntering = entering;
            lastExiting = exiting;
            const opacity = entering * (1 - exiting);
            element.style.setProperty("--capabilities-opacity", String(opacity));
            element.style.setProperty("--capabilities-enter", String(1 - entering));
            element.style.setProperty("--capabilities-exit", String(exiting));
            element.inert = opacity === 0;
        };
        const schedule = () => {
            if (!frame) frame = requestScrollFrame(paint);
        };
        const measure = () => {
            if (disposed) return;
            // Use content edges so section padding does not hide the entrance
            // or start fading before the final row has been read.
            enterStart = label.getBoundingClientRect().top + scrollY - innerHeight * 0.9;
            enterDistance = innerHeight * 0.3;
            exitStart = grid.getBoundingClientRect().bottom + scrollY - innerHeight * 0.35;
            exitDistance = Math.max(1, innerHeight * 0.35 - 64);
            schedule();
        };
        element.setAttribute("data-capabilities-scroll", "");
        const resize = new ResizeObserver(measure);
        resize.observe(element);
        const main = element.closest("main");
        if (main) resize.observe(main);
        const stopScroll = observeScroll(schedule);
        window.addEventListener("resize", measure);
        window.addEventListener("pageshow", measure);
        motion.addEventListener("change", schedule);
        void document.fonts.ready.then(measure);
        measure();
        return () => {
            disposed = true;
            resize.disconnect();
            cancelScrollFrame(frame);
            stopScroll();
            window.removeEventListener("resize", measure);
            window.removeEventListener("pageshow", measure);
            motion.removeEventListener("change", schedule);
            element.removeAttribute("data-capabilities-scroll");
            for (const name of ["opacity", "enter", "exit"])
                element.style.removeProperty(`--capabilities-${name}`);
            element.inert = false;
        };
    }, []);

    return ref;
}
