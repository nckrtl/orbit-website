import { useEffect, useRef } from "react";

export function useHeaderScroll() {
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        const header = ref.current;
        if (!header) return;
        const compact = matchMedia("(max-width: 1100px)");
        let frame = 0;
        let maxScroll = 0;
        let headerHeight = 64;
        let previousY = 0;
        let direction = 0;
        let travel = 0;
        const position = () => Math.max(0, Math.min(scrollY, maxScroll));
        const show = () => {
            header.removeAttribute("data-header-hidden");
            previousY = position();
            travel = 0;
        };
        const paint = () => {
            frame = 0;
            const y = position();
            const delta = y - previousY;
            previousY = y;
            if (
                !compact.matches ||
                y <= headerHeight ||
                header.querySelector('[aria-expanded="true"], :focus-visible')
            ) {
                show();
                return;
            }
            if (!delta) return;
            const nextDirection = Math.sign(delta);
            travel = nextDirection === direction ? travel + Math.abs(delta) : Math.abs(delta);
            direction = nextDirection;
            // Ignore finger jitter, and clamp overscroll at both ends of the page.
            if (travel >= 12) header.toggleAttribute("data-header-hidden", direction > 0);
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(paint);
        };
        const measure = () => {
            maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
            headerHeight = header.offsetHeight;
            schedule();
        };
        const resize = new ResizeObserver(measure);
        resize.observe(document.documentElement);
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", measure);
        compact.addEventListener("change", measure);
        header.addEventListener("focusin", show);
        // Preserve the scroll delta if the reader moved before hydration.
        // Resetting it here would leave the header visible until another scroll.
        measure();
        return () => {
            cancelAnimationFrame(frame);
            resize.disconnect();
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", measure);
            compact.removeEventListener("change", measure);
            header.removeEventListener("focusin", show);
            header.removeAttribute("data-header-hidden");
        };
    }, []);

    return ref;
}
