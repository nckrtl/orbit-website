import { useEffect, useId, useRef } from "react";
import {
    ControlLaptop,
    controlLaptopCenter,
    controlLaptopPort,
    deviceWall,
    hardwarePlane,
    hardwarePoint,
    lidGeometry,
} from "./laptop";
import { objectTransform, scalePoint } from "./object-scale";
import { useSceneViewport } from "./use-scene-viewport";
import { storyLayoutBounds } from "./story-entrance";

type Point = [number, number];
const server = { x: 365, y: 120, width: 150, depth: 150, height: 150 };
const wall = deviceWall(server.width, server.depth, 10, server.height);
const project = (x: number, y: number, origin: Point, drop = 0): Point => {
    const p = hardwarePoint(x, y);
    return [p[0] + origin[0], p[1] + origin[1] + drop];
};
const origin: Point = [server.x, server.y];
const topPort = project(40, 0, origin);
const serverDrop = server.height * Math.cos(Math.PI / 6);
const serverCenter = project(server.width / 2, server.depth / 2, origin, serverDrop / 2);
// Put the lower port directly beneath the upper one in the shared projection.
const lowerPortX =
    (topPort[0] - origin[0] - hardwarePoint(0, server.depth)[0]) / hardwarePoint(1, 0)[0];
const growthPort = project(lowerPortX, server.depth, origin, serverDrop);
// Split the two visible walls at the middle of their shared rounded corner.
const cornerInset = 10 * (1 - Math.SQRT1_2);
const corner = project(server.width - cornerInset, server.depth - cornerInset, origin);
const laptopScale = 1.12;
const laptopOffset: Point = [-60, -288];
const devices = {
    phone: { x: 615, y: 160, width: 42, height: 84, thickness: 3.5, radius: 5 },
    tablet: { x: 555, y: 415, width: 162, height: 116, thickness: 4.6, radius: 5 },
};
function deviceCenter(kind: keyof typeof devices): Point {
    const d = devices[kind];
    return project(
        d.width / 2,
        d.height / 2,
        [d.x, d.y],
        (d.thickness * Math.cos(Math.PI / 6)) / 2,
    );
}
const devicePorts = {
    laptop: scalePoint(controlLaptopPort as Point, controlLaptopCenter).map(
        (value, index) => value * laptopScale + laptopOffset[index],
    ) as Point,
    phone: scalePoint(
        project(
            devices.phone.width / 2,
            devices.phone.height,
            [devices.phone.x, devices.phone.y],
            1.5,
        ),
        deviceCenter("phone"),
    ),
    tablet: scalePoint(
        project(0, devices.tablet.height / 2, [devices.tablet.x, devices.tablet.y]),
        deviceCenter("tablet"),
    ),
};
const serverPorts = {
    laptop: scalePoint(project(6, server.depth, origin, 24), serverCenter),
    phone: scalePoint(project(server.width, 45, origin, 104), serverCenter),
    tablet: scalePoint([corner[0], corner[1] + serverDrop], serverCenter),
};

// Route in the same orthographic XY plane as every device, not screen-space
// right angles. The endpoints and the physical port dots share these coordinates.
function cable(from: Point, to: Point, kind: keyof typeof devicePorts) {
    const a = hardwarePoint(1, 0),
        b = hardwarePoint(0, 1);
    const dx = to[0] - from[0],
        dy = to[1] - from[1];
    const determinant = a[0] * b[1] - a[1] * b[0];
    const u = (dx * b[1] - dy * b[0]) / determinant;
    const v = (a[0] * dy - a[1] * dx) / determinant;
    if (kind === "tablet") {
        // Turn down soon after leaving the server, then enter the tablet's
        // left edge along its X axis. Keep clear of the descending story line.
        const run = Math.max(
            48,
            (scalePoint(growthPort, serverCenter)[0] + 28 - from[0] - b[0] * v) / a[0],
        );
        const first: Point = [from[0] + a[0] * run, from[1] + a[1] * run];
        const middle: Point = [first[0] + b[0] * v, first[1] + b[1] * v];
        return `M ${from.join(" ")} L ${first.join(" ")} L ${middle.join(" ")} L ${to.join(" ")}`;
    }
    const turn: Point =
        kind === "phone"
            ? [from[0] + a[0] * u, from[1] + a[1] * u]
            : [from[0] + b[0] * v, from[1] + b[1] * v];
    return `M ${from.join(" ")} L ${turn.join(" ")} L ${to.join(" ")}`;
}
const routes = (Object.keys(devicePorts) as (keyof typeof devicePorts)[]).map((kind) => ({
    kind,
    d: cable(serverPorts[kind], devicePorts[kind], kind),
}));

export function OnlineDevice({
    kind,
    origin,
    frontFacing = false,
    scaled = false,
}: {
    kind: keyof typeof devices;
    origin?: Point;
    frontFacing?: boolean;
    scaled?: boolean;
}) {
    const d = devices[kind];
    const body = deviceWall(d.width, d.height, d.radius, d.thickness);
    const phone = kind === "phone";
    // The miniature previews retain their native portrait / landscape ratios.
    return (
        <g
            data-remote-device={kind}
            data-connection="online"
            className="orbit-laptop__device"
            transform={`${scaled ? `${objectTransform(deviceCenter(kind))} ` : ""}${
                frontFacing
                    ? `translate(${(origin ?? [d.x, d.y]).join(" ")})`
                    : hardwarePlane(...(origin ?? [d.x, d.y]))
            }`}
        >
            {!frontFacing ? (
                <>
                    <path data-remote-wall d={body.fill} className="orbit-laptop__device-wall" />
                    <path d={body.outline} className="orbit-laptop__device-edge" />
                </>
            ) : null}
            <rect
                data-remote-shell
                width={d.width}
                height={d.height}
                rx={d.radius}
                className="orbit-laptop__device-shell"
            />
            <rect
                x="4"
                y="6"
                width={d.width - 8}
                height={d.height - 12}
                rx="2"
                className="orbit-laptop__device-screen"
            />
            <g data-remote-preview="loaded">
                <g className="orbit-laptop__browser-chrome">
                    <text x="8" y="16" fontSize={phone ? 4 : 6}>
                        project.test
                    </text>
                    <path d={`M 4 21 H ${d.width - 4}`} />
                </g>
                <text
                    x="8"
                    y="32"
                    className="orbit-laptop__device-brand"
                    style={{ fontSize: phone ? 6 : 9 }}
                >
                    Studio
                </text>
                <rect
                    x="8"
                    y="39"
                    width={d.width - 16}
                    height={phone ? 18 : 29}
                    rx="2"
                    className="orbit-laptop__device-hero"
                />
                <path
                    d={`M 12 46 h ${phone ? 16 : 80} M 12 51 h ${phone ? 10 : 54}`}
                    className="orbit-laptop__device-copy"
                />
                <rect
                    x="8"
                    y={phone ? 62 : 76}
                    width={(d.width - 22) / 2}
                    height={phone ? 10 : 18}
                    rx="2"
                    className="orbit-laptop__device-card"
                />
                <rect
                    x={d.width / 2 + 3}
                    y={phone ? 62 : 76}
                    width={(d.width - 22) / 2}
                    height={phone ? 10 : 18}
                    rx="2"
                    className="orbit-laptop__device-card"
                />
            </g>
        </g>
    );
}

export function PremiseScene() {
    const ref = useRef<SVGSVGElement>(null);
    useSceneViewport(ref, "0 0 740 560", "180 35 500 500", "0 25 740 510");
    const ventId = useId();
    useEffect(() => {
        const svg = ref.current;
        if (!svg) return;
        const motion = matchMedia("(prefers-reduced-motion: reduce)");
        const face = svg.querySelector<SVGGElement>("[data-control-face]")!;
        const back = svg.querySelector<SVGRectElement>("[data-control-back]")!;
        const edge = svg.querySelector<SVGPathElement>("[data-control-edge]")!;
        let visible = false,
            frame = 0,
            disposed = false,
            dirty = true;
        let top = 0,
            height = 1,
            last = -1;
        const update = () => {
            frame = 0;
            if (disposed) return;
            if (dirty) {
                const rect = storyLayoutBounds(svg);
                top = rect.top + scrollY;
                height = rect.height;
                dirty = false;
            }
            // Open as the upper-left laptop enters view, before the scene reaches center.
            const start = top + height * 0.12 - innerHeight * 0.88;
            // Keep the early trigger, but give the lid a longer, gentler scroll arc.
            const distance = Math.max(180, Math.min(280, height * 0.4));
            const progress = motion.matches
                ? 1
                : Math.max(0, Math.min(1, (scrollY - start) / distance));
            svg.dataset.scrollStart = String(start);
            svg.dataset.scrollEnd = String(start + distance);
            if (progress === last) return;
            last = progress;
            const pose = lidGeometry((Math.PI / 2) * progress * progress * (3 - 2 * progress));
            face.setAttribute("transform", pose.front);
            back.setAttribute("transform", pose.back);
            edge.setAttribute("d", pose.edge);
            face.setAttribute("visibility", pose.frontFacing ? "visible" : "hidden");
            back.setAttribute("visibility", pose.frontFacing ? "hidden" : "visible");
            svg.dataset.controlPhase =
                progress === 0 ? "closed" : progress === 1 ? "open" : "opening";
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };
        const resize = () => {
            dirty = true;
            schedule();
        };
        const activity = () => {
            svg.dataset.animating = String(visible && !document.hidden && !motion.matches);
            schedule();
        };
        const observer = new IntersectionObserver((entries) => {
            // Fast scroll / resize can batch an exit and re-entry together.
            // Only the newest observation describes the current visibility.
            visible = entries[entries.length - 1].isIntersecting;
            activity();
        });
        const size = new ResizeObserver(resize);
        observer.observe(svg);
        size.observe(svg);
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", resize);
        document.addEventListener("visibilitychange", activity);
        motion.addEventListener("change", activity);
        void document.fonts.ready.then(() => {
            if (!disposed) resize();
        });
        activity();
        return () => {
            disposed = true;
            cancelAnimationFrame(frame);
            observer.disconnect();
            size.disconnect();
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", resize);
            document.removeEventListener("visibilitychange", activity);
            motion.removeEventListener("change", activity);
        };
    }, []);
    return (
        <svg
            ref={ref}
            data-handoff-scene
            data-server-scene
            data-animating="false"
            data-network-progress="1.000"
            data-control-phase="closed"
            viewBox="0 0 740 560"
            className="orbit-story-network orbit-laptop-scene orbit-server-scene"
            role="img"
            aria-label="A cube-shaped Gateway with a CPU display, vertical drive slots and a ventilated side connects to a laptop at its upper left, a phone above right and a tablet below right. The laptop opens as you scroll down while the Gateway and previews stay online."
        >
            {/* Reserve the fully open lid's extent so the divider never shifts with its pose. */}
            <rect
                data-premise-artwork
                x="4"
                y="52"
                width="696"
                height="455"
                fill="none"
                stroke="none"
                pointerEvents="none"
            />
            <defs>
                <pattern id={ventId} width="10" height="10" patternUnits="userSpaceOnUse">
                    <circle cx="5" cy="5" r="1.5" className="orbit-server__vent" />
                </pattern>
            </defs>
            <g>
                <g
                    data-server-node="dev-01"
                    data-state="running"
                    transform={objectTransform(serverCenter)}
                >
                    <g transform={hardwarePlane(server.x, server.y)}>
                        <path data-server-wall d={wall.fill} className="orbit-laptop__wall" />
                        <path d={wall.outline} className="orbit-laptop__edge" />
                        <rect
                            data-server-top
                            width={server.width}
                            height={server.depth}
                            rx="10"
                            className="orbit-laptop__deck"
                        />
                        <text x="75" y="84" textAnchor="middle" className="orbit-server__mark">
                            Gateway
                        </text>
                    </g>
                    <path
                        data-server-corner
                        d={`M ${corner.join(" ")} v ${serverDrop}`}
                        className="orbit-laptop__edge"
                    />
                    <g
                        data-server-side
                        transform={`matrix(${hardwarePoint(0, 1).join(" ")} 0 ${Math.cos(Math.PI / 6)} ${project(server.width, 0, origin).join(" ")})`}
                    >
                        <rect
                            data-server-perforations
                            x="20"
                            y="20"
                            width="110"
                            height="110"
                            rx="4"
                            fill={`url(#${ventId})`}
                        />
                    </g>
                    <g
                        data-server-front
                        transform={`matrix(${hardwarePoint(1, 0).join(" ")} 0 ${Math.cos(Math.PI / 6)} ${project(0, server.depth, origin).join(" ")})`}
                    >
                        <rect
                            data-cpu-display
                            x="16"
                            y="16"
                            width="118"
                            height="44"
                            rx="4"
                            className="orbit-laptop__device-screen"
                        />
                        <text x="24" y="29" className="orbit-server__cpu-label">
                            CPU
                        </text>
                        <svg
                            x="24"
                            y="35"
                            width="102"
                            height="18"
                            viewBox="0 0 102 18"
                            className="orbit-server__plot"
                        >
                            <path d="M 0 16 H 102" className="orbit-laptop__rule" />
                            <g data-cpu-trace>
                                {[0, 102].map((x) => (
                                    <path
                                        key={x}
                                        transform={`translate(${x} 0)`}
                                        d="M 0 13 L 8 13 12 10 18 12 24 5 30 7 36 3 42 10 48 12 56 9 62 11 68 6 74 8 80 4 86 11 94 13 102 13"
                                    />
                                ))}
                            </g>
                        </svg>
                        {[18, 42, 66, 90, 114].map((x, index) => (
                            <g key={x} data-drive-slot>
                                <rect
                                    x={x}
                                    y="74"
                                    width="18"
                                    height="63"
                                    rx="4"
                                    className="orbit-laptop__device-screen"
                                />
                                <rect
                                    x={x + 5}
                                    y="83"
                                    width="8"
                                    height="3"
                                    rx="1.5"
                                    className="orbit-laptop__device-speaker"
                                />
                                <path
                                    d={`M ${x + 5} 98 h 8 M ${x + 5} 104 h 8 M ${x + 5} 110 h 8`}
                                    className="orbit-laptop__rule"
                                />
                                <circle
                                    data-server-activity={index}
                                    cx={x + 9}
                                    cy="126"
                                    r="1.7"
                                    className="orbit-laptop__online-dot"
                                />
                            </g>
                        ))}
                    </g>
                    <circle
                        data-handoff-target
                        cx={topPort[0]}
                        cy={topPort[1]}
                        r="1.6"
                        className="orbit-laptop__body-anchor"
                    />
                    <circle
                        data-growth-source
                        cx={growthPort[0]}
                        cy={growthPort[1]}
                        r="0"
                        className="orbit-laptop__body-anchor"
                    />
                </g>
                <g className="orbit-handoff__wire">
                    {routes.map(({ kind, d }) => (
                        <path key={kind} data-device-link={kind} d={d} />
                    ))}
                </g>
                <g aria-hidden="true" className="orbit-server__signals">
                    {routes.map(({ kind, d }) => (
                        <path key={kind} data-server-signal={kind} pathLength="100" d={d} />
                    ))}
                </g>
                <g
                    data-remote-device="laptop"
                    data-connection="online"
                    transform={`translate(${laptopOffset.join(" ")}) scale(${laptopScale}) ${objectTransform(controlLaptopCenter)}`}
                >
                    <ControlLaptop closed />
                </g>
                <OnlineDevice kind="phone" scaled />
                <OnlineDevice kind="tablet" scaled />
            </g>
            {routes.map(({ kind }) => (
                <g key={kind} className="orbit-laptop__body-anchor">
                    <circle
                        data-server-port={kind}
                        cx={serverPorts[kind][0]}
                        cy={serverPorts[kind][1]}
                        r="1.5"
                    />
                    <circle
                        data-remote-port={kind}
                        cx={devicePorts[kind][0]}
                        cy={devicePorts[kind][1]}
                        r="1.5"
                    />
                </g>
            ))}
        </svg>
    );
}
