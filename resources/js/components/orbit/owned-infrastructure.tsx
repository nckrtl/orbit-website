import { observeSceneActivity } from "./animation";
import {
    Activity,
    Boxes,
    Database,
    GitBranch,
    RefreshCw,
    ServerCog,
    ShieldCheck,
    Wrench,
} from "lucide-react";
import { useEffect, useRef } from "react";

const projection = Math.sqrt(3) / 2;
const plateRadius = 10;
// Match the inner tiles' curves across the platform's 20-unit inset.
const platformRadius = plateRadius + 20;
const resources = [
    { label: "nodes", u: -192, v: -192 },
    { label: "apps", u: 0, v: -192 },
    { label: "processes", u: 192, v: -192 },
    { label: "instances", u: -192, v: 0 },
    { label: "tools", u: 192, v: 0 },
    { label: "databases", u: -192, v: 192 },
    { label: "security", u: 0, v: 192 },
    { label: "updates", u: 192, v: 192 },
];
const notes = [
    {
        title: "Nodes",
        order: 0,
        icon: ServerCog,
        copy: "Node configuration and instance placement. A shared picture of what belongs where.",
        side: "left",
        entry: "rear",
        u: -300,
        v: -192,
    },
    {
        title: "Instances",
        order: 2,
        icon: GitBranch,
        copy: "Each running copy of an app, with its own workspace, configuration, and private address.",
        side: "left",
        entry: "rear",
        u: -300,
        v: 0,
    },
    {
        title: "Databases",
        order: 4,
        icon: Database,
        copy: "The databases your apps depend on, tracked alongside the nodes and instances that use them.",
        side: "left",
        entry: "side",
        u: -192,
        v: 300,
    },
    {
        title: "Security",
        order: 6,
        icon: ShieldCheck,
        copy: "Private networking, firewall policies, and checks that keep your nodes configured as intended.",
        side: "left",
        entry: "side",
        u: 0,
        v: 300,
    },
    {
        title: "Apps",
        order: 1,
        icon: Boxes,
        copy: "Your apps and their repositories, with the instances and routes that make them reachable.",
        side: "right",
        entry: "rear",
        u: 0,
        v: -300,
    },
    {
        title: "Processes",
        order: 3,
        icon: Activity,
        copy: "Process definitions, commands, and status. Keep track of what each app needs to run.",
        side: "right",
        entry: "rear",
        u: 192,
        v: -300,
    },
    {
        title: "Tools",
        order: 5,
        icon: Wrench,
        copy: "Installed tools and version constraints, ready for the agents working across your nodes.",
        side: "right",
        entry: "side",
        u: 300,
        v: 0,
    },
    {
        title: "Updates",
        order: 7,
        icon: RefreshCw,
        copy: "Updates and desired configuration in one place. Nodes converge when they fall behind.",
        side: "right",
        entry: "side",
        u: 300,
        v: 192,
    },
];

function point(u: number, v: number, lift = 0) {
    return [560 + projection * (u - v), 320 + (u + v) / 2 - lift];
}

const tiles = [...resources, { label: "gateway", u: 0, v: 0 }];
const tileConnections = tiles.flatMap((from, index) =>
    tiles.slice(index + 1).flatMap((to) => {
        const du = to.u - from.u;
        const dv = to.v - from.v;
        if (Math.abs(du) + Math.abs(dv) !== 192) return [];
        const edgeU = Math.sign(du) * 88;
        const edgeV = Math.sign(dv) * 88;
        return [
            {
                from: from.label,
                to: to.label,
                start: point(from.u + edgeU, from.v + edgeV, 4),
                end: point(to.u - edgeU, to.v - edgeV, 4),
            },
        ];
    }),
);

// Match deviceWall in laptop.tsx: follow the rounded perimeter between the
// extrusion tangencies, then return along the lower perimeter. In this
// projection an (8, 8) offset produces an eight-unit vertical wall.
function slabWall(width: number, height: number, r: number) {
    const offset = 8;
    const tangent = r * Math.SQRT1_2;
    const start = [width - r + tangent, r - tangent];
    const end = [r - tangent, height - r + tangent];
    const arc = `A ${r} ${r} 0 0`;
    const front = `M ${start.join(" ")} ${arc} 1 ${width} ${r}
        V ${height - r} ${arc} 1 ${width - r} ${height}
        H ${r} ${arc} 1 ${end.join(" ")}`;
    const back = `L ${end[0] + offset} ${end[1] + offset}
        ${arc} 0 ${r + offset} ${height + offset} H ${width - r + offset}
        ${arc} 0 ${width + offset} ${height - r + offset} V ${r + offset}
        ${arc} 0 ${start[0] + offset} ${start[1] + offset} L ${start.join(" ")}`;
    return {
        fill: `${front} ${back} Z`,
        outline: `M ${end.join(" ")} ${back}`,
    };
}

function Slab({
    u,
    v,
    width,
    depth,
    lift,
    base = false,
}: {
    u: number;
    v: number;
    width: number;
    depth: number;
    lift: number;
    base?: boolean;
}) {
    const [x, y] = point(u - width / 2, v - depth / 2, lift);
    const radius = base ? platformRadius : plateRadius;
    const wall = slabWall(width, depth, radius);
    return (
        <g data-foundation-slab transform={`matrix(${projection} .5 ${-projection} .5 ${x} ${y})`}>
            <path data-foundation-wall className="orbit-foundation__side" d={wall.fill} />
            <path className="orbit-foundation__edge" d={wall.outline} />
            <rect
                data-foundation-face
                className={base ? "orbit-foundation__platform" : "orbit-foundation__face"}
                width={width}
                height={depth}
                rx={radius}
            />
        </g>
    );
}

function Plate({ u, v, label }: (typeof resources)[number]) {
    const [x, y] = point(u, v, 8);
    return (
        <g data-foundation-plate={label}>
            <Slab u={u} v={v} width={176} depth={176} lift={8} />
            <g
                transform={`matrix(${projection} .5 ${-projection} .5 ${x} ${y})`}
                data-foundation-label-plane
            >
                <text textAnchor="middle" dominantBaseline="central">
                    {label}
                </text>
            </g>
        </g>
    );
}

export function OwnedInfrastructure() {
    const ref = useRef<HTMLDivElement>(null);
    const [x, y] = point(0, 0, 8);

    useEffect(() => {
        const scene = ref.current;
        if (!scene) return;
        const draw = () => {
            const bounds = scene.getBoundingClientRect();
            notes.forEach((note, index) => {
                const anchor = scene.querySelector<HTMLElement>(
                    `[data-foundation-note="${index}"]`,
                )!;
                const port = scene.querySelector<SVGCircleElement>(
                    `[data-foundation-port="${index}"]`,
                )!;
                const line = scene.querySelector<SVGPathElement>(
                    `[data-foundation-link="${index}"]`,
                )!;
                const from = anchor.getBoundingClientRect();
                const to = port.getBoundingClientRect();
                const left = note.side === "left";
                const startX = (left ? from.right : from.left) - bounds.left;
                const startY = from.top + from.height / 2 - bounds.top;
                const endX = to.left + to.width / 2 - bounds.left;
                const endY = to.top + to.height / 2 - bounds.top;
                // Every final approach follows the projected normal of its base edge.
                const approachX = endX + (left ? -24 : 24);
                const approachY = endY + ((note.entry === "rear" ? -24 : 24) * 0.5) / projection;
                // Split the available horizontal run evenly around each bend.
                const elbowX = (startX + approachX) / 2;
                line.setAttribute(
                    "d",
                    `M ${startX} ${startY} L ${elbowX} ${startY} L ${elbowX} ${approachY} L ${approachX} ${approachY} L ${endX} ${endY}`,
                );
            });
        };
        const observer = new ResizeObserver(draw);
        observer.observe(scene);
        scene
            .querySelectorAll("[data-foundation-note]")
            .forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const scene = ref.current;
        if (!scene) return;
        const plates = [...scene.querySelectorAll<SVGGElement>("[data-foundation-plate]")];
        let timer: ReturnType<typeof setTimeout> | undefined;
        let active: SVGGElement | undefined;
        let bag: SVGGElement[] = [];
        const stop = () => {
            clearTimeout(timer);
            timer = undefined;
            active?.removeAttribute("data-highlighted");
        };
        const highlight = () => {
            if (bag.length === 0) {
                bag = [...plates];
                for (let i = bag.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [bag[i], bag[j]] = [bag[j], bag[i]];
                }
                // Each tile gets a turn, with no repeat across shuffled rounds.
                if (bag.at(-1) === active)
                    [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
            }
            active?.removeAttribute("data-highlighted");
            active = bag.pop();
            active?.setAttribute("data-highlighted", "true");
            timer = setTimeout(highlight, 2400 + Math.random() * 1200);
        };
        const unobserve = observeSceneActivity(scene, ({ active }) => {
            if (!active) stop();
            else if (timer === undefined) highlight();
        });
        return () => {
            stop();
            unobserve();
        };
    }, []);

    return (
        <div ref={ref} className="orbit-foundation" data-owned-infrastructure>
            <svg className="orbit-foundation__connections" aria-hidden="true">
                {notes.map((note, index) => (
                    <path
                        key={note.title}
                        data-foundation-link={index}
                        data-foundation-target="platform"
                        data-foundation-entry={note.entry}
                        data-foundation-resource={note.title.toLowerCase()}
                        data-foundation-side={note.side}
                    />
                ))}
            </svg>
            {["left", "right"].map((side) => (
                <div
                    key={side}
                    className={`orbit-foundation__notes orbit-foundation__notes--${side}`}
                >
                    {notes.map((note, index) =>
                        note.side === side ? (
                            <div
                                key={note.title}
                                data-foundation-note={index}
                                style={{ order: note.order }}
                            >
                                <note.icon
                                    className="orbit-foundation__note-icon"
                                    size={26}
                                    strokeWidth={1.25}
                                    aria-hidden="true"
                                />
                                <h3>{note.title}</h3>
                                <p>{note.copy}</p>
                            </div>
                        ) : null,
                    )}
                </div>
            ))}
            <figure>
                <svg
                    viewBox="0 0 1120 650"
                    role="img"
                    aria-labelledby="foundation-drawing-title foundation-drawing-description"
                    className="orbit-foundation__drawing"
                >
                    <title id="foundation-drawing-title">The Orbit core</title>
                    <desc id="foundation-drawing-description">
                        One shared platform stores nodes, apps, instances, processes, databases,
                        tools, security, and updates, with a connected explanation for each and the
                        Orbit logo at its center.
                    </desc>
                    <g data-foundation-core data-foundation-platform>
                        <Slab u={0} v={0} width={600} depth={600} lift={0} base />
                        <circle
                            data-foundation-outlet
                            cx={560}
                            cy={320 + 300 + 8 - platformRadius + platformRadius * Math.SQRT1_2}
                            r={0}
                            aria-hidden="true"
                        />
                        <g className="orbit-foundation__traces" aria-hidden="true">
                            {tileConnections.map(({ from, to, start, end }) => (
                                <path
                                    key={`${from}-${to}`}
                                    data-foundation-neighbor-link
                                    data-from={from}
                                    data-to={to}
                                    d={`M ${start.join(" ")} L ${end.join(" ")}`}
                                />
                            ))}
                        </g>
                        {resources.map((resource) => (
                            <Plate key={resource.label} {...resource} />
                        ))}
                        <g data-foundation-gateway>
                            <Slab u={0} v={0} width={176} depth={176} lift={8} />
                            {/* Inline geometry keeps mobile SVG rendering independent of images and filters. */}
                            <path
                                data-foundation-core-logo
                                d="M50 25C77.6143 25 100 36.1929 100 50C99.9996 63.8069 77.614 75 50 75C22.386 75 0.000366987 63.8069 0 50C0 36.1929 22.3858 25 50 25ZM49.7764 32.0107C32.7857 32.0108 15.7344 38.9923 15.7344 46.9102C15.7346 54.8279 28.3485 61.2461 49.5654 61.2461C70.7823 61.2461 83.3962 54.8279 83.3965 46.9102C83.3965 38.9923 66.7672 32.0107 49.7764 32.0107Z"
                                transform={`matrix(${projection} .5 ${-projection} .5 ${x} ${y}) translate(-34 -34) scale(.68)`}
                            />
                        </g>
                        {notes.map(({ title, u, v, entry }, index) => {
                            const [cx, cy] = point(u, v, entry === "rear" ? 0 : -4);
                            return (
                                <circle
                                    key={title}
                                    data-foundation-port={index}
                                    cx={cx}
                                    cy={cy}
                                    r="2"
                                />
                            );
                        })}
                    </g>
                </svg>
            </figure>
        </div>
    );
}
