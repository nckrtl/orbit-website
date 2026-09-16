import { cancelScrollFrame, observeScroll, requestScrollFrame, setSceneHidden } from "./animation";
import { useEffect, useRef } from "react";
import {
    storyCopyBounds,
    storyCopyEntranceStart,
    storyEntranceEnd,
    storyLayoutBounds,
} from "./story-entrance";

export function useStoryCopyScroll() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const chapters = Array.from(
            ref.current?.querySelectorAll<HTMLElement>("[data-chapter]") ?? [],
        ).flatMap((section) => {
            const copy = section.querySelector<HTMLElement>('[data-story-enter="copy"]');
            const visual = section.querySelector<HTMLElement>('[data-story-enter="visual"]');
            return copy
                ? [
                      {
                          section,
                          lastPaint: "",
                          grid: section.querySelector<HTMLElement>(".orbit-story-chapter__grid"),
                          parallaxAt: 0,
                          parallaxDistance: 1,
                          copy,
                          parts: Array.from(
                              copy.querySelectorAll<HTMLElement>("[data-story-copy-part]"),
                          ),
                          visual,
                          artAt: 0,
                          artDistance: 1,
                          artRate: 2,
                          artExitAt: 0,
                          artExitDistance: 1,
                          enterAt: 0,
                          enterDistance: 1,
                          exitAt: 0,
                          exitDistance: 1,
                      },
                  ]
                : [];
        });
        if (!chapters.length) return;
        const network = ref.current
            ?.closest("main")
            ?.querySelector<HTMLElement>("[data-hero-network]");
        const desktop = matchMedia("(min-width: 1024px) and (min-height: 600px)");
        const motion = matchMedia("(prefers-reduced-motion: reduce)");
        let frame = 0;
        let stagger = 0;
        let parallaxTravel = 0;
        const clamp = (value: number) => Math.max(0, Math.min(1, value));

        const paint = (_time: number, scrollTop: number) => {
            frame = 0;
            for (const chapter of chapters) {
                const {
                    section,
                    grid,
                    parallaxAt,
                    parallaxDistance,
                    copy,
                    parts,
                    visual,
                    artAt,
                    artDistance,
                    artRate,
                    artExitAt,
                    artExitDistance,
                    enterAt,
                    enterDistance,
                    exitAt,
                    exitDistance,
                } = chapter;
                const entering = clamp((scrollTop - enterAt) / enterDistance);
                const exiting = clamp((scrollTop - exitAt) / exitDistance);
                const signature = [
                    entering,
                    exiting,
                    clamp((scrollTop - parallaxAt) / parallaxDistance),
                    clamp((scrollTop - artAt) / artDistance),
                    clamp((scrollTop - artExitAt) / artExitDistance),
                    motion.matches,
                ].join(",");
                // Settled/offscreen chapters don't invalidate styles during every scroll.
                if (signature === chapter.lastPaint) continue;
                chapter.lastPaint = signature;
                if (grid) {
                    const progress = motion.matches
                        ? 1
                        : clamp((scrollTop - parallaxAt) / parallaxDistance);
                    grid.style.setProperty(
                        "--story-entry-offset",
                        `${-parallaxTravel * (1 - progress)}px`,
                    );
                }
                // Stagger inside the existing intervals so the body is fully
                // readable at the same point, and all copy exits on time.
                const duration = 1 - stagger * (parts.length - 1);
                let hidden = true;
                parts.forEach((part, index) => {
                    const offset = stagger * index;
                    const revealed = clamp((entering * 2 - offset) / duration);
                    const faded = clamp((exiting - offset) / duration);
                    const opacity = motion.matches ? Number(exiting < 1) : revealed * (1 - faded);
                    part.style.setProperty("--story-part-opacity", String(opacity));
                    part.style.setProperty(
                        "--story-part-filter",
                        motion.matches || opacity === 1
                            ? "none"
                            : `blur(calc(var(--blur-story-layer) * ${1 - opacity}))`,
                    );
                    part.toggleAttribute("data-copy-hidden", opacity === 0);
                    part.inert = opacity === 0;
                    hidden &&= opacity === 0;
                });
                // Only the problem chapter controls the intro constellation.
                if (section.dataset.chapter === "problem") {
                    network?.style.setProperty(
                        "--hero-network-visibility",
                        String(motion.matches ? Number(entering === 0) : 1 - entering),
                    );
                    if (network)
                        setSceneHidden(
                            network,
                            "story-entry",
                            motion.matches ? entering > 0 : entering === 1,
                        );
                }
                copy.toggleAttribute("data-copy-hidden", hidden);
                copy.inert = hidden;
                if (visual && section.dataset.chapter !== "problem") {
                    const progress = motion.matches ? 1 : clamp((scrollTop - artAt) / artDistance);
                    const artOpacity = motion.matches
                        ? 1
                        : clamp(progress * artRate) *
                          (1 - clamp((scrollTop - artExitAt) / artExitDistance));
                    visual.style.setProperty("--story-art-opacity", String(artOpacity));
                    visual.inert = artOpacity === 0;
                    visual.style.setProperty(
                        "--story-art-filter",
                        artOpacity === 1
                            ? "none"
                            : `blur(calc(var(--blur-story-layer) * ${1 - artOpacity}))`,
                    );
                    visual.dataset.revealProgress = progress.toFixed(3);
                }
            }
        };
        const schedule = () => {
            if (!frame) frame = requestScrollFrame(paint);
        };
        const measure = () => {
            const height = innerHeight;
            stagger = parseFloat(
                getComputedStyle(chapters[0].copy).getPropertyValue("--step-story-copy"),
            );
            parallaxTravel = parseFloat(
                getComputedStyle(chapters[0].section).getPropertyValue("--distance-story-parallax"),
            );
            for (const chapter of chapters) {
                chapter.lastPaint = "";
                const bounds = storyCopyBounds(chapter.copy);
                const center = bounds.top + scrollY + bounds.height / 2;
                const compact = !desktop.matches || bounds.height + 128 > height;
                // Keep long, stacked copy readable until its last lines approach the top.
                chapter.enterAt = storyCopyEntranceStart(bounds, scrollY, height, compact);
                chapter.enterDistance = height * (compact ? 0.25 : 0.35);
                chapter.exitAt = compact
                    ? bounds.bottom + scrollY - height * 0.4
                    : center - height * 0.3;
                chapter.exitDistance = compact ? Math.max(1, height * 0.4 - 64) : height * 0.3;
                if (chapter.visual) {
                    const art = storyLayoutBounds(chapter.visual);
                    const end = storyEntranceEnd(art, scrollY, height);
                    chapter.artDistance = Math.max(180, height * 0.3) - 40;
                    chapter.artAt = end - chapter.artDistance;
                    // Give the compact Gateway the same quicker fade as the laptop.
                    chapter.artRate =
                        innerWidth <= 1100 && chapter.section.dataset.chapter === "premise" ? 4 : 2;
                    // Hold the illustration sharp until it approaches the top.
                    chapter.artExitAt = art.bottom + scrollY - height * 0.35;
                    chapter.artExitDistance = Math.max(140, height * 0.3);
                    chapter.visual.dataset.exitStart = String(chapter.artExitAt);
                    chapter.visual.dataset.exitEnd = String(
                        chapter.artExitAt + chapter.artExitDistance,
                    );
                    chapter.visual.dataset.revealStart = String(chapter.artAt);
                    chapter.visual.dataset.revealEnd = String(end);
                    if (chapter.grid) {
                        chapter.parallaxAt = Math.max(0, Math.min(chapter.enterAt, chapter.artAt));
                        chapter.parallaxDistance = Math.max(
                            1,
                            Math.max(chapter.enterAt + chapter.enterDistance, end) -
                                chapter.parallaxAt,
                        );
                        chapter.grid.dataset.parallaxStart = String(chapter.parallaxAt);
                        chapter.grid.dataset.parallaxEnd = String(
                            chapter.parallaxAt + chapter.parallaxDistance,
                        );
                    }
                }
            }
            schedule();
        };

        const resize = new ResizeObserver(measure);
        for (const { section, copy } of chapters) {
            section.setAttribute("data-story-scroll", "");
            resize.observe(copy);
            resize.observe(section);
        }
        if (ref.current) resize.observe(ref.current);
        const stopScroll = observeScroll(schedule);
        window.addEventListener("resize", measure);
        window.addEventListener("pageshow", measure);
        desktop.addEventListener("change", measure);
        motion.addEventListener("change", schedule);
        measure();

        return () => {
            if (network) setSceneHidden(network, "story-entry", false);
            resize.disconnect();
            cancelScrollFrame(frame);
            stopScroll();
            window.removeEventListener("resize", measure);
            window.removeEventListener("pageshow", measure);
            desktop.removeEventListener("change", measure);
            motion.removeEventListener("change", schedule);
            for (const { section, grid, copy, parts, visual } of chapters) {
                section.removeAttribute("data-story-scroll");
                if (grid) {
                    grid.style.removeProperty("--story-entry-offset");
                    delete grid.dataset.parallaxStart;
                    delete grid.dataset.parallaxEnd;
                }
                for (const part of parts) {
                    part.style.removeProperty("--story-part-opacity");
                    part.style.removeProperty("--story-part-filter");
                    part.removeAttribute("data-copy-hidden");
                    part.inert = false;
                }
                visual?.style.removeProperty("--story-art-opacity");
                visual?.style.removeProperty("--story-art-filter");
                if (visual) {
                    visual.inert = false;
                    delete visual.dataset.exitStart;
                    delete visual.dataset.exitEnd;
                    delete visual.dataset.revealStart;
                    delete visual.dataset.revealEnd;
                    delete visual.dataset.revealProgress;
                }
                copy.removeAttribute("data-copy-hidden");
                copy.inert = false;
            }
            network?.style.removeProperty("--hero-network-visibility");
        };
    }, []);

    return ref;
}
