import { cancelScrollFrame, observeScroll, requestScrollFrame, setSceneHidden } from "./animation";
import { useEffect, useRef } from "react";
import {
    storyCopyBounds,
    storyCopyEntranceStart,
    storyEntranceEnd,
    storyLayoutBounds,
} from "./story-entrance";

export function useHeroScroll() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const content = ref.current;
        if (!content) return;
        const network = content
            .closest("[data-hero-scene]")
            ?.querySelector<HTMLElement>("[data-hero-network]");

        const desktop = matchMedia("(min-width: 1101px) and (min-height: 600px)");
        const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
        const items = Array.from(
            content.querySelectorAll<HTMLElement>("[data-hero-enter]"),
            (element) => ({
                element,
                order: 0,
            }),
        );
        let exitStep = 0;
        let lastExitOrder = 0;
        let frame = 0;
        let viewportHeight = innerHeight;
        let pinned = false;
        const firstChapter = document.querySelector<HTMLElement>('[data-chapter="problem"]');
        const storyCopy = firstChapter?.querySelector<HTMLElement>('[data-story-enter="copy"]');
        const laptop = firstChapter?.querySelector<HTMLElement>("[data-laptop]");
        let exitStart = 0;
        let exitEnd = 1;
        let scrollDuration = 180;
        let currentExit = 0;
        let previousTime = 0;
        let parallax = 0;
        let lastPaint = "";

        const paint = (time: number, scrollTop: number) => {
            frame = 0;
            const progress = scrollTop / viewportHeight;
            const target = Math.min(
                1,
                Math.max(0, (scrollTop - exitStart) / (exitEnd - exitStart)),
            );
            const elapsed = previousTime ? Math.min(50, time - previousTime) : 16;
            previousTime = time;
            // Smooth wheel/trackpad jumps inside the range. At either boundary,
            // settle immediately so the hero never overlaps the story entrance.
            if (!pinned || reducedMotion.matches || target === 0 || target === 1) {
                currentExit = target;
            } else {
                currentExit += (target - currentExit) * (1 - Math.exp(-elapsed / scrollDuration));
                if (Math.abs(target - currentExit) < 0.001) currentExit = target;
            }
            const opacity = !pinned
                ? 1
                : reducedMotion.matches
                  ? Number(progress < 0.3)
                  : 1 - currentExit;
            const hidden = pinned && opacity === 0;
            const networkOffset = reducedMotion.matches
                ? 0
                : Math.min(Math.max(0, scrollTop), exitEnd) * parallax;
            const signature = [
                opacity,
                currentExit,
                networkOffset,
                pinned,
                reducedMotion.matches,
            ].join(",");
            // Reassigning even unchanged custom properties invalidates styles
            // in descendants. The settled hero needs no work farther down-page.
            if (signature === lastPaint) return;
            lastPaint = signature;

            content.style.setProperty("--hero-copy-opacity", String(opacity));
            content.dataset.exitProgress = String(currentExit);
            // Follow a small fraction of the scroll, while the page still
            // carries the constellation upward. Stop once the intro has cleared.
            network?.style.setProperty("--hero-network-offset", `${networkOffset}px`);
            network?.style.setProperty(
                "--hero-network-exit-opacity",
                String(pinned && !reducedMotion.matches ? 1 - currentExit : 1),
            );
            if (network)
                setSceneHidden(
                    network,
                    "hero-exit",
                    pinned && !reducedMotion.matches && currentExit === 1,
                );
            // Fit the stagger inside the existing scroll range so the final
            // label clears before the next section. Scrolling up reverses it.
            const itemRange = 1 - lastExitOrder * exitStep;
            items.forEach(({ element, order }) => {
                const itemOpacity =
                    !pinned || reducedMotion.matches
                        ? 1
                        : hidden
                          ? 0
                          : 1 -
                            Math.min(1, Math.max(0, (1 - opacity - order * exitStep) / itemRange));
                element.style.setProperty("--hero-copy-item-opacity", String(itemOpacity));
                element.inert = itemOpacity === 0;
                if (element.inert && element.contains(document.activeElement)) {
                    (document.activeElement as HTMLElement).blur();
                }
            });
            content.toggleAttribute("data-scroll-hidden", hidden);
            content.inert = hidden;
            if (hidden && content.contains(document.activeElement)) {
                (document.activeElement as HTMLElement).blur();
            }
            if (pinned && !reducedMotion.matches && currentExit !== target) {
                frame = requestScrollFrame(paint);
            } else {
                previousTime = 0;
            }
        };

        const schedule = () => {
            if (!frame) frame = requestScrollFrame(paint);
        };

        const measure = () => {
            lastPaint = "";
            viewportHeight = innerHeight;
            parallax = Number(getComputedStyle(content).getPropertyValue("--hero-parallax"));
            const duration = getComputedStyle(content)
                .getPropertyValue("--dur-hero-copy-scroll")
                .trim();
            scrollDuration = parseFloat(duration) * (duration.endsWith("ms") ? 1 : 1000);
            exitStart = viewportHeight * 0.15;
            const copyBounds = storyCopy ? storyCopyBounds(storyCopy) : undefined;
            const laptopBounds = laptop ? storyLayoutBounds(laptop) : undefined;
            const copyStart = copyBounds
                ? storyCopyEntranceStart(
                      copyBounds,
                      scrollY,
                      viewportHeight,
                      !desktop.matches || copyBounds.height + 128 > viewportHeight,
                  )
                : viewportHeight;
            const artStart = laptopBounds
                ? storyEntranceEnd(laptopBounds, scrollY, viewportHeight) -
                  Math.max(180, viewportHeight * 0.3) +
                  40
                : viewportHeight;
            exitEnd = Math.max(exitStart + 1, Math.min(copyStart, artStart));
            content.dataset.exitStart = String(exitStart);
            content.dataset.exitEnd = String(exitEnd);
            exitStep = Number(getComputedStyle(content).getPropertyValue("--step-hero-copy-exit"));
            items.forEach((item) => {
                item.order = Number(
                    getComputedStyle(item.element).getPropertyValue("--hero-copy-exit-order"),
                );
            });
            lastExitOrder = Math.max(0, ...items.map((item) => item.order));
            // Keep normal document flow without JS, on small screens, or when
            // enlarged text would put a fixed block outside the viewport.
            pinned = desktop.matches && content.offsetHeight + 128 <= viewportHeight;
            content.toggleAttribute("data-scroll-pinned", pinned);
            content.toggleAttribute("data-scroll-flow", !pinned);
            schedule();
        };

        const resize = new ResizeObserver(measure);
        resize.observe(content);
        if (firstChapter) resize.observe(firstChapter);
        if (storyCopy) resize.observe(storyCopy);
        if (laptop) resize.observe(laptop);
        const stopScroll = observeScroll(schedule);
        window.addEventListener("resize", measure);
        window.addEventListener("pageshow", measure);
        desktop.addEventListener("change", measure);
        reducedMotion.addEventListener("change", measure);
        measure();

        return () => {
            resize.disconnect();
            cancelScrollFrame(frame);
            stopScroll();
            window.removeEventListener("resize", measure);
            window.removeEventListener("pageshow", measure);
            desktop.removeEventListener("change", measure);
            reducedMotion.removeEventListener("change", measure);
            content.removeAttribute("data-scroll-pinned");
            content.removeAttribute("data-scroll-flow");
            content.removeAttribute("data-scroll-hidden");
            content.style.removeProperty("--hero-copy-opacity");
            network?.style.removeProperty("--hero-network-offset");
            network?.style.removeProperty("--hero-network-exit-opacity");
            if (network) setSceneHidden(network, "hero-exit", false);
            delete content.dataset.exitStart;
            delete content.dataset.exitEnd;
            delete content.dataset.exitProgress;
            content.inert = false;
            items.forEach(({ element }) => {
                element.style.removeProperty("--hero-copy-item-opacity");
                element.inert = false;
            });
        };
    }, []);

    return ref;
}
