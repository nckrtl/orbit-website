import { useEffect, useId, useRef } from "react";
import { globe, OrbitPlanet } from "./orbit-planet";

export { globe } from "./orbit-planet";

export function constellationReadoutTransform(radius: number, scale = 1, offsetY = -9) {
    return `translate(${radius + 10 / scale} ${offsetY / scale}) scale(${1 / scale})`;
}

type Body = {
    id: string;
    radius: number;
    angle: number;
    rx: number;
    ry: number;
    tilt: number;
    rate: number;
    parent: number;
};

const verticalOrbitTilt = 90;
const orbitRadii = { rx: 197.6, ry: 88.4 };
const verticalOrbitRadii = { ...orbitRadii, rx: orbitRadii.rx * 0.75 };
const clusters = [
    { id: "h1", moons: 3, angle: 0, tilt: 0 },
    { id: "h3", moons: 1, angle: 180, tilt: 0 },
    { id: "h2", moons: 2, angle: 30, tilt: verticalOrbitTilt },
    { id: "h4", moons: 4, angle: 210, tilt: verticalOrbitTilt },
];

// One company network, with persistent readouts on every planet and cluster moon.
const primary: Body[] = [
    {
        id: "gateway",
        radius: 9.5,
        angle: 0,
        rx: 0,
        ry: 0,
        tilt: 0,
        rate: 0,
        parent: -1,
    },
];
for (const [index, { moons, ...cluster }] of clusters.entries()) {
    const parent = primary.length;
    primary.push(
        {
            ...cluster,
            ...(cluster.tilt === verticalOrbitTilt ? verticalOrbitRadii : orbitRadii),
            radius: 6.6,
            rate: 1.1,
            parent: 0,
        },
        ...Array.from({ length: moons }, (_, moon) => ({
            id: `${cluster.id}${String.fromCharCode(97 + moon)}`,
            radius: 4.4,
            angle: index * 35 + (moon * 360) / moons,
            rx: 58,
            ry: 30,
            tilt: 0,
            rate: 4.62,
            parent,
        })),
    );
}
const radians = Math.PI / 180;

function introStage(body: Body) {
    if (body.parent < 0) return 0;
    const host = body.parent === 0 ? body : primary[body.parent];
    const index = clusters.findIndex((cluster) => cluster.id === host.id);
    // Leave a beat between the horizontal clusters and the vertical orbit.
    return index + (index < 2 ? 1 : 2);
}

function positions(bodies: Body[], time: number) {
    const points: { x: number; y: number }[] = [];
    for (const body of bodies) {
        const origin = points[body.parent] ?? { x: 260, y: 170 };
        const angle = (body.angle + time * body.rate) * radians;
        const tilt = body.tilt * radians;
        const x = body.rx * Math.cos(angle);
        const y = body.ry * Math.sin(angle);
        points.push({
            x: origin.x + x * Math.cos(tilt) - y * Math.sin(tilt),
            y: origin.y + x * Math.sin(tilt) + y * Math.cos(tilt),
        });
    }
    return points;
}

// Shared by the intro and story: a tapered traveling streak, not a moving dot.
export function constellationSignal(
    from: { x: number; y: number },
    to: { x: number; y: number },
    time: number,
    seed: number,
    moon: boolean,
) {
    const dx = to.x - from.x,
        dy = to.y - from.y;
    const progress = (time * (moon ? 0.5 : 0.3) + seed * 0.19) % 1;
    const distance = Math.hypot(dx, dy);
    const tail = Math.min(26, distance * 0.3, distance * progress);
    return {
        transform: `translate(${(from.x + dx * progress).toFixed(3)} ${(from.y + dy * progress).toFixed(3)}) rotate(${(Math.atan2(dy, dx) / radians).toFixed(3)}) scale(${(tail / 26).toFixed(3)} 1)`,
        opacity: Math.sin(progress * Math.PI) * 0.8,
    };
}

export function ConstellationSignalGradient({ id }: { id: string }) {
    return (
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="-26" x2="0">
            {Array.from({ length: 8 }, (_, index) => (
                <stop
                    key={index}
                    offset={index / 7}
                    stopColor="var(--bone-3)"
                    stopOpacity={(index / 7) ** 2}
                />
            ))}
        </linearGradient>
    );
}

export function HeroConstellations() {
    const networkRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const network = networkRef.current;
        const scene = network?.closest<HTMLElement>("[data-hero-scene]");
        const content = scene?.querySelector<HTMLElement>("[data-hero-content]");
        const illustration = network?.querySelector<HTMLElement>(
            ".orbit-story-constellation__inner",
        );
        if (!network || !scene || !content || !illustration) return;

        const measure = () => {
            const bounds = scene.getBoundingClientRect();
            const copy = content.getBoundingClientRect();
            const svg = illustration.querySelector("svg")!.getBoundingClientRect();
            const x = copy.left + copy.width / 2 - bounds.left;
            const y = copy.top + copy.height / 2 - bounds.top;
            // SVG gateway coordinates are (260, 170) in the 520 × 308 viewBox,
            // whose top edge starts at y=14. Keep that point behind the copy.
            illustration.style.translate = `${x - svg.width / 2}px ${y - (svg.height * 156) / 308}px`;
            network.style.setProperty("--orbit-center-x", `${x}px`);
            network.style.setProperty("--orbit-center-y", `${y}px`);
            network.style.setProperty("--orbit-mask-y", `${copy.height * 0.8}px`);
            // Include the full orbit, moon radius and readout below the intro.
            // The mask's box must extend too, otherwise it still clips the SVG.
            const extent = y + ((verticalOrbitRadii.rx + 30 + 4.4) * svg.width) / 520 + 24;
            network.style.setProperty("--orbit-extent-y", `${extent}px`);
            network.dataset.ready = "true";
        };
        let frame = 0;
        const scheduleMeasure = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(measure);
        };
        const resize = new ResizeObserver(scheduleMeasure);
        resize.observe(scene);
        resize.observe(content);
        resize.observe(illustration);
        resize.observe(illustration.querySelector("svg")!);
        // Pinning changes the copy's position without necessarily resizing it.
        const position = new MutationObserver(scheduleMeasure);
        position.observe(content, { attributes: true, attributeFilter: ["data-scroll-pinned"] });
        window.addEventListener("resize", scheduleMeasure);
        measure();
        return () => {
            resize.disconnect();
            position.disconnect();
            cancelAnimationFrame(frame);
            window.removeEventListener("resize", scheduleMeasure);
        };
    }, []);

    return (
        <div
            ref={networkRef}
            className="orbit-story-constellation"
            data-hero-network
            aria-hidden="true"
        >
            <div className="orbit-story-constellation__inner">
                <HeroConstellation />
            </div>
        </div>
    );
}

function HeroConstellation() {
    const svgRef = useRef<SVGSVGElement>(null);
    const signalGradient = useId();
    const bodies = primary;
    const initial = positions(bodies, 0);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        // Cache DOM references once. The animation owns only these attributes;
        // React owns the static tree and never reconciles on animation frames.
        const planets = Array.from(svg.querySelectorAll<SVGGElement>("[data-hero-body]"));
        const globes = Array.from(svg.querySelectorAll<SVGPathElement>("[data-hero-globe]"));
        const links = Array.from(svg.querySelectorAll<SVGPathElement>("[data-hero-link]"));
        const signals = Array.from(svg.querySelectorAll<SVGGElement>("[data-hero-signal]"));
        const readouts = Array.from(svg.querySelectorAll<SVGGElement>("[data-hero-readout]"));
        const satelliteRings = Array.from(
            svg.querySelectorAll<SVGEllipseElement>("[data-hero-satellite-ring]"),
        );
        const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const introStyle = getComputedStyle(svg);
        const seconds = (token: string) => {
            const value = introStyle.getPropertyValue(token).trim();
            return parseFloat(value) / (value.endsWith("ms") ? 1000 : 1);
        };
        const introDelay = seconds("--delay-hero-intro");
        const introStep = seconds("--step-hero-intro");
        const introDuration = seconds("--dur-hero-enter");
        const reveals = Array.from(
            svg.querySelectorAll<SVGElement>("[data-hero-stage]:not([data-hero-signal])"),
        ).map((element) => ({ element, stage: Number(element.dataset.heroStage) }));
        let introComplete = false;
        const revealAmount = (stage: number, time: number) => {
            if (introComplete || motion.matches) return 1;
            const progress = Math.max(
                0,
                Math.min(1, (time - introDelay - stage * introStep) / introDuration),
            );
            return progress * progress * (3 - 2 * progress);
        };
        let visible = false;
        let frame = 0;
        let previous: number | null = null;
        let elapsed = 0;
        let lastDraw = -Infinity;
        let lastGlobe = -Infinity;
        const compact = window.matchMedia("(max-width: 1023px)");

        const draw = (time: number) => {
            if (!introComplete) {
                reveals.forEach(({ element, stage }) => {
                    element.style.opacity = String(revealAmount(stage, time));
                });
                introComplete =
                    motion.matches || time >= introDelay + 5 * introStep + introDuration;
            }
            const points = positions(bodies, time);
            const updateGlobes = time - lastGlobe >= (compact.matches ? 0.1 : 1 / 15);
            if (updateGlobes) lastGlobe = time;
            satelliteRings.forEach((ring) => {
                const point = points[Number(ring.dataset.heroSatelliteRing)];
                ring.setAttribute("cx", point.x.toFixed(3));
                ring.setAttribute("cy", point.y.toFixed(3));
            });
            bodies.forEach((body, index) => {
                const point = points[index];
                planets[index].setAttribute(
                    "transform",
                    `translate(${point.x.toFixed(3)} ${point.y.toFixed(3)})`,
                );
                if (updateGlobes) globes[index].setAttribute("d", globe(body.radius, index, time));
                if (body.parent < 0) return;
                const from = points[body.parent];
                links[index - 1].setAttribute(
                    "d",
                    `M${from.x.toFixed(3)} ${from.y.toFixed(3)}L${point.x.toFixed(3)} ${point.y.toFixed(3)}`,
                );
                const signal = constellationSignal(from, point, time, index, body.parent !== 0);
                signals[index - 1].setAttribute("transform", signal.transform);
                signals[index - 1].setAttribute(
                    "opacity",
                    motion.matches
                        ? "0"
                        : (signal.opacity * revealAmount(introStage(body), time)).toFixed(3),
                );
            });
        };
        const tick = (now: number) => {
            if (previous !== null) elapsed += Math.min(now - previous, 50) / 1000;
            previous = now;
            const interval = 1000 / (compact.matches ? 30 : 60);
            if (now - lastDraw >= interval - 0.5) {
                draw(elapsed);
                lastDraw = now;
            }
            frame = requestAnimationFrame(tick);
        };
        const sync = () => {
            cancelAnimationFrame(frame);
            previous = null;
            lastDraw = -Infinity;
            const running = visible && !document.hidden && !motion.matches;
            svg.dataset.animating = String(running);
            if (motion.matches) {
                elapsed = 0;
                lastGlobe = -Infinity;
                draw(0);
            }
            if (running) frame = requestAnimationFrame(tick);
        };
        const resize = new ResizeObserver(([entry]) => {
            const scale = entry.contentRect.width / 520;
            if (scale <= 0) return;
            // Screen-sized text and a fixed 10px gap from the planet's edge.
            // No clamping, side switching, collision remounts, or frame-time reads.
            readouts.forEach((readout) => {
                const radius = Number(readout.dataset.radius);
                readout.setAttribute("transform", constellationReadoutTransform(radius, scale));
            });
        });
        const intersection = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            sync();
        });
        resize.observe(svg);
        intersection.observe(svg.closest("[data-hero-network]") ?? svg);
        motion.addEventListener("change", sync);
        document.addEventListener("visibilitychange", sync);
        sync();

        return () => {
            cancelAnimationFrame(frame);
            resize.disconnect();
            intersection.disconnect();
            motion.removeEventListener("change", sync);
            document.removeEventListener("visibilitychange", sync);
        };
    }, [bodies]);

    return (
        <svg
            ref={svgRef}
            data-hero-constellation="primary"
            viewBox="0 14 520 308"
            className="block h-auto w-full overflow-visible"
            aria-hidden="true"
        >
            <defs>
                <ConstellationSignalGradient id={signalGradient} />
            </defs>
            <g fill="none" stroke="var(--line-default)" strokeWidth="1">
                <ellipse
                    data-hero-orbit-ring="horizontal"
                    data-hero-stage="0"
                    cx="260"
                    cy="170"
                    {...orbitRadii}
                    vectorEffect="non-scaling-stroke"
                />
                <ellipse
                    cx="260"
                    cy="170"
                    data-hero-orbit-ring="vertical"
                    data-hero-stage="3"
                    {...verticalOrbitRadii}
                    transform={`rotate(${verticalOrbitTilt} 260 170)`}
                    vectorEffect="non-scaling-stroke"
                />
                {bodies.map((body, index) =>
                    body.parent < 0 ? null : (
                        <path
                            key={body.id}
                            data-hero-link
                            data-hero-stage={introStage(body)}
                            d={`M${initial[body.parent].x} ${initial[body.parent].y}L${initial[index].x} ${initial[index].y}`}
                            strokeDasharray="2 4"
                            vectorEffect="non-scaling-stroke"
                        />
                    ),
                )}
                {bodies
                    .filter((body) => body.parent > 0)
                    .filter(
                        (body, index, satellites) =>
                            satellites.findIndex(
                                (satellite) => satellite.parent === body.parent,
                            ) === index,
                    )
                    .map((body) => (
                        <ellipse
                            key={body.parent}
                            cx={initial[body.parent].x}
                            cy={initial[body.parent].y}
                            rx="58"
                            ry="30"
                            stroke="var(--line-hairline)"
                            vectorEffect="non-scaling-stroke"
                            data-hero-satellite-ring={body.parent}
                            data-hero-stage={introStage(body)}
                        />
                    ))}
            </g>
            {bodies.slice(1).map((body) => (
                <g
                    key={body.id}
                    data-hero-signal
                    data-hero-stage={introStage(body)}
                    opacity="0"
                    stroke="var(--bone-3)"
                    strokeWidth="1"
                >
                    <path
                        d="M-26 0H0"
                        stroke={`url(#${signalGradient})`}
                        vectorEffect="non-scaling-stroke"
                    />
                </g>
            ))}
            {bodies.map((body, index) => (
                <g
                    key={body.id}
                    data-hero-body={body.id}
                    data-hero-stage={introStage(body)}
                    transform={`translate(${initial[index].x} ${initial[index].y})`}
                >
                    <OrbitPlanet
                        radius={body.radius}
                        seed={index}
                        fill="var(--surface-void)"
                        stroke="var(--bone-1)"
                        hero
                    />
                    <g
                        data-hero-readout={body.id}
                        data-radius={body.radius}
                        transform={constellationReadoutTransform(body.radius)}
                        className="orbit-hero-readout"
                    >
                        <text y="0" fontSize="9" fill="var(--text-secondary)">
                            {12 + index * 3}ms
                        </text>
                        <text y="13" fontSize="8.5" fill="var(--text-muted)">
                            c{18 + index * 3} m{27 + index * 2} d18
                        </text>
                        <text y="26" fontSize="8.5" fill="var(--text-faint)">
                            10.1.0.{index + 1}
                        </text>
                    </g>
                </g>
            ))}
        </svg>
    );
}
