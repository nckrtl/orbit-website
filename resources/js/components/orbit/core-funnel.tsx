import { useEffect, useRef } from "react";

export function CoreFunnel({ inverted = false }: { inverted?: boolean }) {
    const ref = useRef<SVGSVGElement>(null);
    useEffect(() => {
        const svg = ref.current;
        if (!svg) return;
        const paths = [...svg.querySelectorAll<SVGPathElement>("[data-funnel-lane]")];
        const signals = [...svg.querySelectorAll<SVGPathElement>("[data-funnel-signal]")];
        const motion = matchMedia("(prefers-reduced-motion: reduce)");
        let visible = false;
        let animations: Animation[] = [];
        const updatePlayback = () => {
            const active = visible && !document.hidden && !motion.matches;
            animations.forEach((animation) => {
                if (active) animation.play();
                else animation.pause();
            });
        };
        const cancelSignals = () => {
            animations.forEach((animation) => {
                animation.onfinish = null;
                animation.cancel();
            });
            animations = [];
        };
        const draw = () => {
            cancelSignals();
            const { width, height } = svg.getBoundingClientRect();
            const center = width / 2;
            const gap = width < 600 ? 4 : 7;
            const edgeInset = 0.5;
            const entranceGap = (width - edgeInset * 2) / 15;
            const radius = Math.min(40, width * 0.08);
            const target = center - gap * 3.5;
            svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
            paths.forEach((path, index) => {
                const lane = index % 8;
                const offset = (lane - 3) * gap;
                const startX = edgeInset + (7 - lane) * entranceGap;
                const endX = target - offset;
                // Keep circular corners and parallel horizontal lanes. Only
                // tighten bends where the central entrances have less room.
                const bendScale = Math.min(1, (endX - startX) / (radius * 2));
                const firstRadius = (radius + offset) * bendScale;
                const secondRadius = (radius - offset) * bendScale;
                const horizontalY = 82 + radius + offset;
                const turnY = horizontalY - firstRadius;
                const endY = horizontalY + secondRadius;
                path.setAttribute(
                    "d",
                    `M ${startX} 0 V ${turnY}
                    A ${firstRadius} ${firstRadius} 0 0 0 ${startX + firstRadius} ${horizontalY}
                    H ${endX - secondRadius}
                    A ${secondRadius} ${secondRadius} 0 0 1 ${endX} ${endY}
                    V ${height}`,
                );
                path.setAttribute(
                    "transform",
                    index < 8 ? "" : `translate(${width} 0) scale(-1 1)`,
                );
            });
            signals.forEach((signal, index) => {
                const path = paths[index];
                signal.setAttribute("d", path.getAttribute("d")!);
                signal.setAttribute("transform", path.getAttribute("transform")!);
                if (motion.matches) return;
                const length = path.getTotalLength();
                const dash = 18;
                signal.style.strokeDasharray = `${dash} ${length + dash}`;
                const duration = ((length + dash) / 70) * 1000;
                const run = (initial = false) => {
                    const animation = signal.animate(
                        [
                            { strokeDashoffset: inverted ? -length : dash },
                            { strokeDashoffset: inverted ? dash : -length },
                        ],
                        {
                            duration,
                            delay: initial
                                ? -Math.random() * duration
                                : 2000 + Math.random() * 6000,
                            easing: "linear",
                            fill: "both",
                        },
                    );
                    animations[index] = animation;
                    animation.onfinish = () => {
                        animation.cancel();
                        run();
                    };
                    updatePlayback();
                };
                run(true);
            });
        };
        const visibility = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            updatePlayback();
        });
        visibility.observe(svg);
        document.addEventListener("visibilitychange", updatePlayback);
        motion.addEventListener("change", draw);
        const resize = new ResizeObserver(draw);
        resize.observe(svg);
        draw();
        return () => {
            resize.disconnect();
            visibility.disconnect();
            document.removeEventListener("visibilitychange", updatePlayback);
            motion.removeEventListener("change", draw);
            cancelSignals();
        };
    }, [inverted]);

    return (
        <div className="orbit-core-funnel" aria-hidden="true">
            <svg ref={ref} data-core-funnel={inverted ? "expand" : "gather"}>
                {Array.from({ length: 16 }, (_, index) => (
                    <path key={index} data-funnel-lane vectorEffect="non-scaling-stroke" />
                ))}
                {Array.from({ length: 16 }, (_, index) => (
                    <path key={index} data-funnel-signal vectorEffect="non-scaling-stroke" />
                ))}
            </svg>
        </div>
    );
}
