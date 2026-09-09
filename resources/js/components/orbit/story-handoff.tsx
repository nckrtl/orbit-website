import { useEffect, useId, useRef } from "react";
import {
    laptopCloseStart,
    storyCopyBounds,
    storyEntranceEnd,
    storyLayoutBounds,
    storyParallaxOffset,
} from "./story-entrance";
import { useSceneViewport } from "./use-scene-viewport";
import {
    globe,
    ConstellationSignalGradient,
    constellationReadoutTransform,
} from "./hero-constellation";
import {
    topologyAt,
    topologyCenter,
    topologyOrbit,
    clusterOrbit,
    topologyBodies,
    topologyLinks,
    storyWire,
    useStoryMotion,
} from "./story-motion";

export type StoryRoles = {
    database: boolean;
    dedicatedDatabase: boolean;
    production: boolean;
};

function Planet({
    x,
    y,
    name,
    detail,
    radius = 18,
    gateway = false,
    topology = false,
    moon = false,
}: {
    x: number;
    y: number;
    name: string;
    detail: string;
    radius?: number;
    gateway?: boolean;
    topology?: boolean;
    moon?: boolean;
}) {
    return (
        <g
            data-story-node={name}
            data-story-moon={moon ? "" : undefined}
            data-radius={radius}
            transform={`translate(${x} ${y})`}
        >
            <circle
                r={radius}
                data-orbit-planet
                className="orbit-handoff__planet"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
            />
            <path data-story-globe d={globe(radius, 0, 0)} className="orbit-handoff__globe" />
            <g
                data-story-readout
                transform={constellationReadoutTransform(radius, 1, moon ? 0 : -9)}
                className="orbit-hero-readout"
            >
                <text
                    y="0"
                    dominantBaseline={moon ? "central" : undefined}
                    fontSize="9"
                    fill="var(--text-secondary)"
                >
                    {name}
                </text>
                {detail ? (
                    <text y={moon ? 18 : 13} fontSize="8.5" fill="var(--text-muted)">
                        {detail}
                    </text>
                ) : null}
            </g>
            {gateway ? (
                <circle
                    data-handoff-target
                    cy={-radius}
                    r="1.6"
                    className="orbit-laptop__body-anchor"
                />
            ) : null}
            {name === "Gateway" ? (
                <circle
                    data-growth-source={!topology ? "" : undefined}
                    data-growth-target={topology ? "" : undefined}
                    cx={-radius}
                    r="1.6"
                    className="orbit-laptop__body-anchor"
                />
            ) : null}
        </g>
    );
}

export { PremiseScene } from "./server-scene";

export function TopologyScene({ roles }: { roles: StoryRoles }) {
    const signalGradient = useId();
    const ref = useStoryMotion(`${roles.database}:${roles.dedicatedDatabase}:${roles.production}`);
    useSceneViewport(ref, "0 0 1080 1080", "180 150 780 850", "0 100 1080 900");
    const bodies = topologyBodies.filter((body) => {
        if (body.id === "db-01") return roles.dedicatedDatabase;
        if (body.id === "database") return roles.database && !roles.dedicatedDatabase;
        if (["dev-02", "app-2", "app-3"].includes(body.id)) return roles.production;
        return true;
    });
    const ids = new Set(bodies.map((body) => body.id));
    const topologyPositions = topologyAt(
        0,
        bodies.filter((body) => body.parent === "Gateway").map((body) => body.id),
    );
    const links = topologyLinks.filter((link) => ids.has(link.to));
    return (
        <svg
            ref={ref}
            data-story-topology
            viewBox="0 0 1080 1080"
            className="orbit-story-network"
            role="img"
            aria-label="A central Gateway anchors an orbiting constellation of named development and worker nodes. App and database moons form clusters around their hosts, with optional dedicated database and production nodes."
        >
            <defs>
                <ConstellationSignalGradient id={signalGradient} />
            </defs>
            <ellipse
                data-depth-orbit
                cx={topologyCenter.x}
                cy={topologyCenter.y}
                rx={topologyOrbit.rx}
                ry={topologyOrbit.ry}
                className="orbit-handoff__orbit"
            />
            {["dev-01", ...(roles.production ? ["dev-02"] : [])].map((id) => (
                <g key={id} data-story-cluster={id}>
                    <ellipse
                        data-cluster-ring={id}
                        cx={topologyPositions[id].x}
                        cy={topologyPositions[id].y}
                        rx={clusterOrbit.rx}
                        ry={clusterOrbit.ry}
                        className="orbit-handoff__orbit"
                    />
                </g>
            ))}
            <g className="orbit-handoff__wire">
                {links.map((link) => (
                    <path
                        key={link.id}
                        data-story-wire={link.id}
                        data-story-reveal=".1"
                        d={storyWire(link.id, topologyPositions)}
                        strokeDasharray="2 4"
                    />
                ))}
            </g>
            <g aria-hidden="true" className="orbit-story-signals">
                {links.map((link) => (
                    <g key={link.id} data-story-signal={link.id} opacity="0">
                        <path d="M-26 0H0" stroke={`url(#${signalGradient})`} />
                    </g>
                ))}
            </g>
            {bodies.map((body) => (
                <Planet
                    key={body.id}
                    x={topologyPositions[body.id].x}
                    y={topologyPositions[body.id].y}
                    name={body.id}
                    detail={body.detail}
                    radius={body.radius}
                    moon={body.moon}
                    topology
                />
            ))}
        </svg>
    );
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));

// One event-driven frame, not a second animation loop. Layout measurements are
// cached on resize; ordinary scrolling only changes SVG attributes, not React state.
export function StoryHandoff({ stage = "premise" }: { stage?: "premise" | "topology" }) {
    const gradientId = useId();
    const ref = useRef<SVGSVGElement>(null);
    useEffect(() => {
        const svg = ref.current;
        const root = svg?.closest<HTMLElement>("#story");
        const growth = stage === "topology";
        const source = root?.querySelector<SVGCircleElement>(
            growth ? "[data-growth-source]" : "[data-handoff-source]",
        );
        const target = root?.querySelector<SVGCircleElement>(
            growth ? "[data-growth-target]" : "[data-handoff-target]",
        );
        const scene = root?.querySelector<SVGSVGElement>(
            growth ? "[data-story-topology]" : "[data-handoff-scene]",
        );
        const path = svg?.querySelector<SVGPathElement>("[data-route-path]");
        const track = svg?.querySelector<SVGPathElement>("[data-route-track]");
        const pulse = svg?.querySelector<SVGCircleElement>("[data-route-pulse]");
        const trail = svg?.querySelector<SVGGElement>("[data-route-trail]");
        if (!svg || !root || !source || !target || !scene || !path || !track || !pulse || !trail)
            return;
        const trailPath = trail.querySelector<SVGPathElement>("path")!;
        const gradient = svg.querySelector<SVGLinearGradientElement>("[data-route-gradient]")!;
        const trailLength = parseFloat(
            getComputedStyle(svg).getPropertyValue("--handoff-trail-length"),
        );
        const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        let frame = 0;
        let disposed = false;
        let dirty = true;
        let start = 0;
        let end = 1;
        let length = 0;
        let lastProgress = -1;
        let direction = 1;
        const destinationGrid = target.closest<HTMLElement>(".orbit-story-chapter__grid");
        let parallaxTravel = 0;
        let previousTargetOffset = NaN;
        let drawRoute: ((offset: number) => void) | undefined;

        const entranceOffset = (element: Element) => {
            const entrance = element.closest<HTMLElement>(
                '[data-laptop-entrance], [data-story-enter="visual"]',
            );
            return entrance ? new DOMMatrix(getComputedStyle(entrance).transform).m41 : 0;
        };

        const point = (circle: SVGCircleElement, bounds: DOMRect) => {
            const p = new DOMPoint(
                circle.cx.baseVal.value,
                circle.cy.baseVal.value,
            ).matrixTransform(circle.getScreenCTM()!);
            return { x: p.x - bounds.left, y: p.y - bounds.top - storyParallaxOffset(circle) };
        };
        const measure = () => {
            const bounds = root.getBoundingClientRect();
            const from = point(source, bounds);
            const to = point(target, bounds);
            const visual = storyLayoutBounds(scene);
            const local = storyLayoutBounds(source.closest("svg")!);
            parallaxTravel = parseFloat(
                getComputedStyle(svg).getPropertyValue("--distance-story-parallax"),
            );
            // Trace from the illustration's settled position even when layout
            // is measured halfway through its horizontal entrance.
            from.x -= entranceOffset(source);
            local.x -= entranceOffset(source);
            to.x -= entranceOffset(target);
            visual.x -= entranceOffset(scene);
            const corridor =
                window.innerWidth <= 900
                    ? bounds.width - 12
                    : Math.min(bounds.width - 12, local.right - bounds.left + 12);
            // On desktop, balance the divider between the visible first scene
            // and the next copy/artwork, rather than the SVG's empty top margin.
            // Keep the mobile crossing below its stacked copy.
            let approach = visual.top - bounds.top + (window.innerWidth <= 900 ? 16 : -32);
            if (!growth && window.innerWidth > 900) {
                const previousSection = source.closest("section")!;
                const previousCopy = storyCopyBounds(
                    previousSection.querySelector(".orbit-story-chapter__copy")!,
                );
                const nextCopy = storyCopyBounds(
                    scene.closest("section")!.querySelector(".orbit-story-chapter__copy")!,
                );
                const devices = [
                    ...source.closest("svg")!.querySelectorAll("[data-preview-device]"),
                ];
                const previousBottom = Math.max(
                    previousCopy.bottom,
                    ...devices.map((device) => storyLayoutBounds(device).bottom),
                );
                const artworkTop = storyLayoutBounds(
                    scene.querySelector("[data-premise-artwork]")!,
                ).top;
                const nextTop = Math.min(nextCopy.top, artworkTop);
                approach = (previousBottom + nextTop) / 2 - bounds.top;
            }
            svg.dataset.dividerY = String(approach);
            // Continue the laptop's width axis all the way to the corridor,
            // then round directly into the vertical run to the next chapter.
            const deck = source.closest("svg")!.querySelector<SVGRectElement>("[data-deck]");
            const projection = deck?.getScreenCTM();
            const slope = projection ? projection.b / projection.a : 0;
            const exitY = from.y + (corridor - from.x) * slope;
            const copy = storyCopyBounds(
                scene.closest("section")!.querySelector(".orbit-story-chapter__copy")!,
            );
            // Rebuild only the wire geometry while its destination drifts. All
            // layout measurements stay cached; the moving port remains attached.
            drawRoute = (offset) => {
                const arrivalY = to.y + offset;
                const crossing = approach + offset * (!growth && window.innerWidth > 900 ? 0.5 : 1);
                let d = `M ${from.x} ${from.y} L ${corridor - 16} ${exitY - 16 * slope} Q ${corridor} ${exitY} ${corridor} ${exitY + 16} V ${crossing - 16} Q ${corridor} ${crossing} ${corridor - 16} ${crossing} H ${to.x + 16} Q ${to.x} ${crossing} ${to.x} ${crossing + 16} V ${arrivalY}`;
                if (growth) {
                    // Leave the server's bottom port vertically. Only the stacked
                    // mobile layout needs a detour around the third chapter's copy.
                    const left =
                        window.innerWidth <= 900 ? 10 : Math.max(10, local.left - bounds.left - 12);
                    const entry = visual.left - bounds.left + (visual.width * 38) / 740;
                    const cross = Math.min(visual.top, copy.top) + offset - bounds.top - 40;
                    const exit = local.bottom - bounds.top + (window.innerWidth <= 900 ? 8 : 24);
                    d =
                        window.innerWidth > 900
                            ? `M ${from.x} ${from.y} V ${cross - 16} Q ${from.x} ${cross} ${from.x + 16} ${cross} H ${entry - 16} Q ${entry} ${cross} ${entry} ${cross + 16} V ${arrivalY - 16} Q ${entry} ${arrivalY} ${entry + 16} ${arrivalY} H ${to.x}`
                            : `M ${from.x} ${from.y} V ${exit - 8} Q ${from.x} ${exit} ${from.x - 8} ${exit} H ${left + 8} Q ${left} ${exit} ${left} ${exit + 8} V ${arrivalY - 8} Q ${left} ${arrivalY} ${left + 8} ${arrivalY} H ${to.x}`;
                }
                svg.setAttribute("viewBox", `0 0 ${bounds.width} ${to.y + 2}`);
                svg.style.height = `${to.y + 2}px`;
                track.setAttribute("d", d);
                path.setAttribute("d", d);
                trailPath.setAttribute("d", d);
                length = path.getTotalLength();
            };
            previousTargetOffset = NaN;
            const top = bounds.top + window.scrollY;
            start = laptopCloseStart(local, window.scrollY, window.innerHeight);
            end = top + to.y - window.innerHeight * 0.65;
            if (growth) {
                // Keep the same midpoint departure as the first chapter,
                // while the Gateway and its adjacent copy are still in view.
                end = Math.max(start + 180, top + to.y - window.innerHeight * 0.7);
            }
            // Start alongside the lid and finish as the destination is revealed.
            const destination = scene.closest<HTMLElement>('[data-story-enter="visual"]')!;
            end = Math.max(
                end,
                storyEntranceEnd(
                    storyLayoutBounds(destination),
                    window.scrollY,
                    window.innerHeight,
                ),
            );
            svg.dataset.scrollStart = String(start);
            svg.dataset.scrollEnd = String(end);
            lastProgress = -1;
        };
        const update = () => {
            frame = 0;
            if (disposed) return;
            if (dirty) {
                measure();
                dirty = false;
            }
            const progress = motion.matches
                ? 1
                : clamp((window.scrollY - start) / Math.max(1, end - start));
            const range = destinationGrid?.dataset;
            const entrance = clamp(
                (window.scrollY - Number(range?.parallaxStart ?? 0)) /
                    Math.max(
                        1,
                        Number(range?.parallaxEnd ?? 1) - Number(range?.parallaxStart ?? 0),
                    ),
            );
            const targetOffset = motion.matches ? 0 : -parallaxTravel * (1 - entrance);
            const targetMoved = targetOffset !== previousTargetOffset;
            if (targetMoved) {
                drawRoute?.(targetOffset);
                previousTargetOffset = targetOffset;
            }
            if (progress !== lastProgress || targetMoved) {
                if (lastProgress >= 0 && progress !== lastProgress)
                    direction = progress > lastProgress ? 1 : -1;
                // The signal draws the connection behind it; scrolling back
                // retracts that same stroke instead of exposing the whole route.
                track.style.strokeDashoffset = String(1 - progress);
                track.style.opacity = progress > 0 ? "1" : "0";
                const visible = !motion.matches && progress > 0 && progress < 1;
                trail.style.opacity = visible ? "1" : "0";
                svg.dataset.direction = direction > 0 ? "forward" : "reverse";
                // One continuous gradient follows the head and tail. The dash
                // clips the actual route, keeping its rounded bends intact.
                const tailProgress = clamp(
                    progress - (direction * trailLength) / Math.max(1, length),
                );
                const from = Math.min(progress, tailProgress);
                const to = Math.max(progress, tailProgress);
                trailPath.style.strokeDasharray = `${to - from} 2`;
                trailPath.style.strokeDashoffset = String(-from);
                const tail = path.getPointAtLength(length * tailProgress);
                const p = path.getPointAtLength(length * progress);
                gradient.setAttribute("x1", String(tail.x));
                gradient.setAttribute("y1", String(tail.y));
                gradient.setAttribute("x2", String(p.x));
                gradient.setAttribute("y2", String(p.y));
                pulse.setAttribute("cx", String(p.x));
                pulse.setAttribute("cy", String(p.y));
                pulse.style.opacity = visible ? "1" : "0";
                svg.dataset.progress = progress.toFixed(3);
                lastProgress = progress;
            }
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };
        const resize = () => {
            dirty = true;
            schedule();
        };
        const observer = new ResizeObserver(resize);
        observer.observe(root);
        observer.observe(scene);
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", resize);
        motion.addEventListener("change", schedule);
        void document.fonts.ready.then(() => {
            if (!disposed) resize();
        });
        schedule();
        return () => {
            disposed = true;
            cancelAnimationFrame(frame);
            observer.disconnect();
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", resize);
            motion.removeEventListener("change", schedule);
        };
    }, [stage]);
    return (
        <svg
            ref={ref}
            className="orbit-handoff-route"
            aria-hidden="true"
            data-handoff-route={stage === "premise" ? "" : undefined}
            data-growth-route={stage === "topology" ? "" : undefined}
        >
            <defs>
                <linearGradient id={gradientId} data-route-gradient gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="var(--text-primary)" stopOpacity="0" />
                    <stop offset="1" stopColor="var(--text-primary)" stopOpacity="1" />
                </linearGradient>
            </defs>
            <path
                data-route-track
                data-handoff-track={stage === "premise" ? "" : undefined}
                pathLength="1"
                className="orbit-handoff-route__track"
            />
            <path
                data-route-path
                data-handoff-path={stage === "premise" ? "" : undefined}
                pathLength="1"
                opacity="0"
            />
            <g data-route-trail className="orbit-handoff-route__trail">
                <path
                    pathLength="1"
                    stroke={`url(#${gradientId})`}
                    className="orbit-handoff-route__line"
                />
            </g>
            <circle
                data-route-pulse
                data-handoff-pulse={stage === "premise" ? "" : undefined}
                r="0.75"
                className="orbit-handoff-route__pulse"
            />
        </svg>
    );
}
