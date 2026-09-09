import { useEffect, useId, useRef } from "react";
import { laptopCloseStart, storyEntranceEnd } from "./story-entrance";
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
            return { x: p.x - bounds.left, y: p.y - bounds.top };
        };
        const measure = () => {
            const bounds = root.getBoundingClientRect();
            const from = point(source, bounds);
            const to = point(target, bounds);
            const visual = scene.getBoundingClientRect();
            const local = source.closest("svg")!.getBoundingClientRect();
            // Trace from the illustration's settled position even when layout
            // is measured halfway through its horizontal entrance.
            from.x -= entranceOffset(source);
            local.x -= entranceOffset(source);
            to.x -= entranceOffset(target);
            visual.x -= entranceOffset(scene);
            const corridor = Math.min(bounds.width - 12, local.right - bounds.left + 12);
            // On desktop, balance the divider between the visible first scene
            // and the next copy/artwork, rather than the SVG's empty top margin.
            // Keep the mobile crossing below its stacked copy.
            let approach = visual.top - bounds.top - 32;
            if (!growth && window.innerWidth > 900) {
                const previousSection = source.closest("section")!;
                const previousCopy = previousSection
                    .querySelector(".orbit-story-chapter__copy")!
                    .getBoundingClientRect();
                const nextCopy = scene
                    .closest("section")!
                    .querySelector(".orbit-story-chapter__copy")!
                    .getBoundingClientRect();
                const devices = [
                    ...source.closest("svg")!.querySelectorAll("[data-preview-device]"),
                ];
                const previousBottom = Math.max(
                    previousCopy.bottom,
                    ...devices.map((device) => device.getBoundingClientRect().bottom),
                );
                const artworkTop = scene
                    .querySelector("[data-premise-artwork]")!
                    .getBoundingClientRect().top;
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
            let d = `M ${from.x} ${from.y} L ${corridor - 16} ${exitY - 16 * slope} Q ${corridor} ${exitY} ${corridor} ${exitY + 16} V ${approach - 16} Q ${corridor} ${approach} ${corridor - 16} ${approach} H ${to.x + 16} Q ${to.x} ${approach} ${to.x} ${approach + 16} V ${to.y}`;
            if (growth) {
                // Leave the server's bottom port vertically. Only the stacked
                // mobile layout needs a detour around the third chapter's copy.
                const left = Math.max(10, local.left - bounds.left - 12);
                const entry = visual.left - bounds.left + (visual.width * 38) / 740;
                const copy = scene
                    .closest("section")!
                    .querySelector(".orbit-story-chapter__copy")!
                    .getBoundingClientRect();
                const cross = Math.min(visual.top, copy.top) - bounds.top - 40;
                const exit = local.bottom - bounds.top + 24;
                d =
                    window.innerWidth > 900
                        ? `M ${from.x} ${from.y} V ${cross - 16} Q ${from.x} ${cross} ${from.x + 16} ${cross} H ${entry - 16} Q ${entry} ${cross} ${entry} ${cross + 16} V ${to.y - 16} Q ${entry} ${to.y} ${entry + 16} ${to.y} H ${to.x}`
                        : `M ${from.x} ${from.y} V ${exit - 8} Q ${from.x} ${exit} ${from.x - 8} ${exit} H ${left + 8} Q ${left} ${exit} ${left} ${exit + 8} V ${to.y - 8} Q ${left} ${to.y} ${left + 8} ${to.y} H ${to.x}`;
            }
            svg.setAttribute("viewBox", `0 0 ${bounds.width} ${to.y + 2}`);
            svg.style.height = `${to.y + 2}px`;
            track.setAttribute("d", d);
            path.setAttribute("d", d);
            trailPath.setAttribute("d", d);
            length = path.getTotalLength();
            const top = bounds.top + window.scrollY;
            start = laptopCloseStart(local, window.scrollY, window.innerHeight);
            end = top + to.y - window.innerHeight * 0.65;
            if (growth) {
                start =
                    local.top + window.scrollY + local.height * 0.78 - window.innerHeight * 0.45;
                end = Math.max(start + 180, top + to.y - window.innerHeight * 0.7);
            }
            // Start alongside the lid and finish as the destination is revealed.
            const destination = scene.closest<HTMLElement>('[data-story-enter="visual"]')!;
            end = Math.max(
                end,
                storyEntranceEnd(
                    destination.getBoundingClientRect(),
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
            if (progress !== lastProgress) {
                if (lastProgress >= 0) direction = progress > lastProgress ? 1 : -1;
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
