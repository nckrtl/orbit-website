import { animateScene } from "./animation";
import { useEffect, useRef } from "react";

export const gatewayPlanetRadius = 28;

export function globe(radius: number, seed: number, time: number) {
    const count = radius >= 5 ? 7 : 5;
    const phase = (time * 0.075 + seed * 0.17) % 1;
    let path = "";
    for (let index = 0; index < count; index++) {
        const y = radius * (1 - ((index / count + phase) % 1) * 2);
        const x = Math.sqrt(Math.max(0, radius * radius - y * y)) * 0.97;
        const arc = Math.max(0.4, x * 0.18);
        path += `M${(-x).toFixed(3)} ${y.toFixed(3)}a${x.toFixed(3)} ${arc.toFixed(3)} 0 0 0 ${(x * 2).toFixed(3)} 0`;
    }
    return path;
}

export function OrbitPlanet({
    radius,
    seed = 0,
    fill = "var(--surface-card)",
    stroke,
    animated = false,
    hero = false,
}: {
    radius: number;
    seed?: number;
    fill?: string;
    stroke?: string;
    animated?: boolean;
    hero?: boolean;
}) {
    const ref = useRef<SVGPathElement>(null);
    useEffect(() => {
        const path = ref.current;
        if (!animated || !path) return;
        const stop = animateScene(
            path.ownerSVGElement!,
            (elapsed) => path.setAttribute("d", globe(radius, seed, elapsed)),
            {
                fps: () => 15,
                onActivity: ({ active, reducedMotion }) => {
                    path.dataset.latitudesAnimating = String(active);
                    if (reducedMotion) path.setAttribute("d", globe(radius, seed, 0));
                },
            },
        );
        return () => {
            stop();
            delete path.dataset.latitudesAnimating;
        };
    }, [animated, radius, seed]);

    return (
        <>
            <circle
                data-orbit-planet=""
                r={radius}
                fill={fill}
                stroke={stroke}
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
            />
            <path
                ref={ref}
                data-planet-latitudes=""
                data-hero-globe={hero ? "" : undefined}
                d={globe(radius, seed, 0)}
                fill="none"
                stroke={stroke}
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
            />
        </>
    );
}
