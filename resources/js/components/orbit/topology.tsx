import type { CSSProperties, HTMLAttributes, KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

export type OrbitStats = {
    cpu?: number;
    disk?: number;
    ip?: string;
    mem?: number;
    ping?: number;
};

export type OrbitSatellite = {
    angle: number;
    label: string;
    role: string;
    stats?: OrbitStats;
};

export type OrbitNode = {
    angle: number;
    cluster?: string;
    label: string;
    ring?: 1 | 2;
    role: string;
    satellites?: OrbitSatellite[];
    satTilt?: number;
    state?: "error" | "warn";
    stats?: OrbitStats;
    tilt?: number;
};

type OrbitCenter = {
    label: string;
    state?: "pending";
    stats?: OrbitStats;
    sub?: string;
};

type OrbitDiagramProps = Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> & {
    caption?: string;
    center?: OrbitCenter | null;
    labels?: boolean;
    nodes?: OrbitNode[];
    onSelect?: (key: string) => void;
    operator?: string | null;
    orbit?: boolean;
    packets?: boolean;
    selected?: string | null;
    showCenter?: boolean;
    speed?: number;
    stats?: boolean;
    statsZone?: number[];
};

type Point = { x: number; y: number };
type PlacedSatellite = OrbitSatellite & Point;
type PlacedNode = OrbitNode & Point & { index: number; satellites: PlacedSatellite[] };

const width = 520;
const height = 340;
const centerX = width / 2;
const centerY = height / 2;
const rings = [
    { rx: 0.38, ry: 0.26, tilt: 0 },
    { rx: 0.24, ry: 0.165, tilt: -34 },
] as const;
const satelliteRadiusX = 58;
const satelliteRadiusY = 30;

function usePrefersReducedMotion() {
    const [reduced, setReduced] = useState(false);

    useEffect(() => {
        const query = window.matchMedia("(prefers-reduced-motion: reduce)");
        const sync = () => setReduced(query.matches);

        sync();
        query.addEventListener("change", sync);

        return () => query.removeEventListener("change", sync);
    }, []);

    return reduced;
}

function activate(event: KeyboardEvent<SVGGElement>, select: () => void) {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        select();
    }
}

function hash(value: string) {
    let result = 7;

    for (const character of value) {
        result = (result * 31 + character.charCodeAt(0)) % 9973;
    }

    return result;
}

function rotatedPoint(
    angle: number,
    radiusX: number,
    radiusY: number,
    tilt: number,
    originX = centerX,
    originY = centerY,
) {
    const radians = (angle * Math.PI) / 180;
    const tiltRadians = (tilt * Math.PI) / 180;
    const offsetX = radiusX * Math.cos(radians);
    const offsetY = radiusY * Math.sin(radians);

    return {
        x: originX + offsetX * Math.cos(tiltRadians) - offsetY * Math.sin(tiltRadians),
        y: originY + offsetX * Math.sin(tiltRadians) + offsetY * Math.cos(tiltRadians),
    };
}

function Globe({
    bright,
    radius,
    seed,
    time,
    x,
    y,
}: {
    bright: boolean;
    radius: number;
    seed: number;
    time: number;
    x: number;
    y: number;
}) {
    const count = radius >= 5 ? 7 : 5;
    const phase = (time * 0.075 + seed * 0.17) % 1;
    const stroke = bright ? "var(--bone-3)" : "var(--bone-1)";

    return Array.from({ length: count }, (_, index) => {
        const unit = (index / count + phase) % 1;
        const factor = 1 - unit * 2;
        const offsetY = radius * factor;
        const arcX = Math.sqrt(Math.max(0, radius * radius - offsetY * offsetY)) * 0.97;
        const arcY = Math.max(0.4, arcX * 0.18);

        return (
            <path
                key={index}
                d={`M ${x - arcX} ${y + offsetY} A ${arcX} ${arcY} 0 0 0 ${x + arcX} ${y + offsetY}`}
                fill="none"
                stroke={stroke}
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
            />
        );
    });
}

function SelectionCore({ selected, radius, x, y }: Point & { radius: number; selected: boolean }) {
    return selected ? (
        <circle cx={x} cy={y} r={Math.max(1.5, radius - 2.5)} fill="var(--bone-3)" />
    ) : null;
}

function SignalPacket({
    from,
    phase,
    rate = 0.3,
    time,
    to,
}: {
    from: Point;
    phase: number;
    rate?: number;
    time: number;
    to: Point;
}) {
    const progress = (time * rate + phase) % 1;
    const envelope = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const tail = Math.min(0.3, 26 / Math.max(1, Math.hypot(dx, dy)));

    return Array.from({ length: 14 }, (_, index) => {
        const start = Math.max(0, progress - (tail * (index + 1)) / 14);
        const end = Math.max(0, progress - (tail * index) / 14);
        const fade = 1 - index / 14;

        return end > 0 ? (
            <line
                key={index}
                x1={from.x + dx * start}
                y1={from.y + dy * start}
                x2={from.x + dx * end}
                y2={from.y + dy * end}
                stroke="var(--bone-3)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                opacity={(0.16 + envelope * 0.72) * fade * fade}
            />
        ) : null;
    });
}

function Telemetry({
    ip,
    label,
    point,
    pulse,
    scale,
    stats,
}: {
    ip: string;
    label: string;
    point: Point;
    pulse: number;
    scale: number;
    stats?: OrbitStats;
}) {
    const value = hash(label);
    const drift = (base: number, seed: number) =>
        Math.max(2, Math.min(99, Math.round(base + ((value + seed + pulse * 7919) % 13) - 6)));
    const cpu = drift(stats?.cpu ?? 12 + (value % 74), 11);
    const memory = drift(stats?.mem ?? 24 + ((value >> 3) % 66), 29);
    const disk = stats?.disk ?? 9 + ((value >> 6) % 58);
    const ping = Math.max(
        3,
        Math.round((stats?.ping ?? 8 + (value % 42)) + ((value + pulse * 104729) % 7) - 3),
    );
    const step = 13 / scale;

    return (
        <g pointerEvents="none" className="orbit-telemetry" data-telemetry={label}>
            <text x={point.x} y={point.y} className="orbit-telemetry-ping">
                {ping}ms
            </text>
            <text x={point.x} y={point.y + step} className="orbit-telemetry-usage">
                c{cpu} m{memory} d{disk}
            </text>
            <text x={point.x} y={point.y + step * 2} className="orbit-telemetry-address">
                {stats?.ip ?? ip}
            </text>
        </g>
    );
}

function inStatsZone(point: Point, zone?: number[]) {
    if (!zone || zone.length < 2) {
        return true;
    }

    const withinX = point.x >= zone[0] * width && point.x <= zone[1] * width;
    if (zone.length < 4) {
        return withinX;
    }

    return (
        withinX &&
        point.y >= 14 + zone[2] * (height - 32) &&
        point.y <= 14 + zone[3] * (height - 32)
    );
}

type Box = { x1: number; x2: number; y1: number; y2: number };

// Claim names first, then gateway/node/satellite readouts, as in the design export.
function placeTelemetry(
    nodes: PlacedNode[],
    center: OrbitCenter | null,
    labels: boolean,
    scale: number,
    zone?: number[],
) {
    const boxes: Box[] = [];
    const positions = new Map<string, Point>();
    const reserve = (box: Box) => boxes.push(box);

    if (labels) {
        if (center)
            reserve({ x1: centerX - 46, y1: centerY - 32, x2: centerX + 46, y2: centerY - 6 });
        for (const node of nodes) {
            if (node.satellites.length) {
                reserve({
                    x1: node.x - 52,
                    y1: node.y - satelliteRadiusY - 26,
                    x2: node.x + 52,
                    y2: node.y - satelliteRadiusY - 2,
                });
                if (node.cluster)
                    reserve({
                        x1: node.x - 52,
                        y1: node.y + satelliteRadiusY + 12,
                        x2: node.x + 52,
                        y2: node.y + satelliteRadiusY + 24,
                    });
            } else {
                const right = node.x >= centerX;
                reserve({
                    x1: node.x + (right ? 10 : -58),
                    y1: node.y - 9,
                    x2: node.x + (right ? 58 : -10),
                    y2: node.y + 18,
                });
            }
            for (const satellite of node.satellites) {
                reserve({
                    x1: satellite.x - 26,
                    y1: satellite.y - 15,
                    x2: satellite.x + 26,
                    y2: satellite.y - 4,
                });
            }
        }
    }

    const place = (
        key: string,
        point: Point,
        gap: number,
        side?: "left" | "right",
        offsetY = 0,
    ) => {
        if (!inStatsZone(point, zone)) return;

        const step = 13 / scale;
        const blockWidth = 52;
        const lo = zone && zone.length >= 2 ? zone[0] * width : 6;
        const hi = zone && zone.length >= 2 ? zone[1] * width : width - 6;
        const right = side ? side === "right" : point.x + gap + blockWidth <= hi;
        const x = Math.max(
            lo,
            Math.min(hi - blockWidth, right ? point.x + gap : point.x - gap - blockWidth),
        );
        const y = point.y - step + 3.2 / scale + offsetY;
        const box = { x1: x - 2, y1: y - step - 3, x2: x + blockWidth + 2, y2: y + step * 2 + 4 };
        if (
            boxes.some(
                (other) =>
                    !(
                        box.x2 < other.x1 ||
                        box.x1 > other.x2 ||
                        box.y2 < other.y1 ||
                        box.y1 > other.y2
                    ),
            )
        )
            return;

        reserve(box);
        positions.set(key, { x, y });
    };

    if (center && center.state !== "pending") {
        place("gateway", { x: centerX, y: centerY }, 15, undefined, labels ? 26 : 0);
    }
    for (const node of nodes) {
        place(
            `node:${node.label}`,
            node,
            13,
            labels && !node.satellites.length ? (node.x >= centerX ? "left" : "right") : undefined,
        );
    }
    // The export's unlabelled constellation displays gateway and node readouts only.
    if (!labels) return positions;

    for (const node of nodes) {
        for (const satellite of node.satellites) {
            place(`sat:${node.label}/${satellite.label}`, satellite, 9, undefined, labels ? 10 : 0);
        }
    }

    return positions;
}

export function OrbitDiagram({
    caption,
    center = { label: "Gateway", sub: "control plane" },
    className = "",
    labels = true,
    nodes = [],
    onSelect,
    operator = null,
    orbit = true,
    packets = true,
    selected = null,
    showCenter = true,
    speed = 2.2,
    stats = false,
    statsZone,
    style,
    ...props
}: OrbitDiagramProps) {
    const [time, setTime] = useState(0);
    const [pulse, setPulse] = useState(0);
    const reducedMotion = usePrefersReducedMotion();
    const startTime = useRef<number | null>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const element = wrapRef.current;
        if (!element) return;

        const observer = new ResizeObserver(() => {
            const drawnWidth = element.getBoundingClientRect().width;
            if (drawnWidth > 0) setScale(drawnWidth / width);
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!orbit || reducedMotion) {
            return;
        }

        let frame = 0;
        const loop = (now: number) => {
            startTime.current ??= now;
            setTime((now - startTime.current) / 1000);
            frame = requestAnimationFrame(loop);
        };

        frame = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(frame);
            startTime.current = null;
        };
    }, [orbit, reducedMotion]);

    useEffect(() => {
        if (!stats || reducedMotion) {
            return;
        }

        const timer = setInterval(() => setPulse((current) => current + 1), 1000);
        return () => clearInterval(timer);
    }, [reducedMotion, stats]);

    const placed = useMemo<PlacedNode[]>(
        () =>
            nodes.map((node, index) => {
                const ring = rings[(node.ring ?? 1) - 1] ?? rings[0];
                const direction = node.ring === 2 ? 1.5 : 1;
                const angle = node.angle + (orbit && !reducedMotion ? time * speed * direction : 0);
                const point = rotatedPoint(
                    angle,
                    width * ring.rx,
                    height * ring.ry,
                    node.tilt ?? ring.tilt,
                );
                const satelliteTilt = node.satTilt ?? 0;

                return {
                    ...node,
                    ...point,
                    index,
                    satellites: (node.satellites ?? []).map((satellite, satelliteIndex) => ({
                        ...satellite,
                        ...rotatedPoint(
                            satellite.angle + (orbit && !reducedMotion ? time * speed * 4.2 : 0),
                            satelliteRadiusX,
                            satelliteRadiusY,
                            satelliteTilt,
                            point.x,
                            point.y,
                        ),
                        angle: satellite.angle ?? satelliteIndex * 120,
                    })),
                };
            }),
        [nodes, orbit, reducedMotion, speed, time],
    );

    let address = 2;
    const addresses = new Map<string, string>();
    for (const node of placed) {
        addresses.set(node.label, `10.1.0.${address++}`);
        for (const satellite of node.satellites) {
            addresses.set(`${node.label}/${satellite.label}`, `10.1.0.${address++}`);
        }
    }

    const centerVisible = showCenter && center !== null;
    const centerPending = centerVisible && center.state === "pending";
    const interactive = Boolean(onSelect);
    const readouts = stats
        ? placeTelemetry(placed, centerVisible ? center : null, labels, scale, statsZone)
        : new Map<string, Point>();

    return (
        <div
            ref={wrapRef}
            className={`w-full ${className}`}
            style={{ "--orbit-diagram-scale": scale, ...style } as CSSProperties}
            {...props}
        >
            <svg
                viewBox="0 14 520 308"
                width="100%"
                className="block h-auto overflow-visible"
                role="img"
                aria-label={labels ? "Orbit topology" : "Orbit constellation"}
            >
                {rings.map((ring, index) => (
                    <ellipse
                        key={index}
                        cx={centerX}
                        cy={centerY}
                        rx={width * ring.rx}
                        ry={height * ring.ry}
                        fill="none"
                        transform={`rotate(${ring.tilt} ${centerX} ${centerY})`}
                        stroke={index === 0 ? "var(--line-default)" : "var(--line-hairline)"}
                        strokeWidth="1"
                        vectorEffect="non-scaling-stroke"
                    />
                ))}

                {operator ? (
                    <g>
                        <line
                            x1="36"
                            y1="38"
                            x2={centerX - 16}
                            y2={centerY - 8}
                            className="orbit-flow"
                            stroke="var(--line-default)"
                            strokeWidth="1"
                            vectorEffect="non-scaling-stroke"
                        />
                        {packets && !reducedMotion && !centerPending ? (
                            <SignalPacket
                                from={{ x: 36, y: 38 }}
                                to={{ x: centerX - 16, y: centerY - 8 }}
                                phase={0.1}
                                rate={0.24}
                                time={time}
                            />
                        ) : null}
                        <g
                            role={interactive ? "button" : undefined}
                            tabIndex={interactive ? 0 : undefined}
                            aria-label={interactive ? "Inspect you and your agent" : undefined}
                            onClick={onSelect ? () => onSelect("operator") : undefined}
                            onKeyDown={
                                onSelect
                                    ? (event) => activate(event, () => onSelect("operator"))
                                    : undefined
                            }
                            className={interactive ? "cursor-pointer" : undefined}
                        >
                            <rect x="18" y="20" width="64" height="28" fill="transparent" />
                            <rect
                                x="24"
                                y="26"
                                width="12"
                                height="12"
                                fill="none"
                                stroke={selected === "operator" ? "var(--bone-3)" : "var(--bone-1)"}
                                strokeWidth="1.2"
                            />
                            {selected === "operator" ? (
                                <rect x="27" y="29" width="6" height="6" fill="var(--bone-3)" />
                            ) : null}
                            {labels ? (
                                <text x="44" y="35" className="orbit-diagram-label">
                                    {operator.toUpperCase()}
                                </text>
                            ) : null}
                        </g>
                    </g>
                ) : null}

                {placed.map((node) => {
                    const nodePoint = { x: node.x, y: node.y };
                    const nodeKey = `node:${node.label}`;
                    const nodeRadius = [6.6, 6.2, 6.8, 6.4][node.index % 4];

                    return (
                        <g key={`connection-${node.label}`} className="orbit-diagram-enter">
                            <line
                                x1={centerX}
                                y1={centerY}
                                x2={node.x}
                                y2={node.y}
                                className="orbit-flow"
                                stroke="var(--line-default)"
                                strokeWidth="1"
                                vectorEffect="non-scaling-stroke"
                            />
                            {packets && !reducedMotion ? (
                                <SignalPacket
                                    from={{ x: centerX, y: centerY }}
                                    to={nodePoint}
                                    phase={(node.index * 0.37) % 1}
                                    time={time}
                                />
                            ) : null}
                            {node.satellites.length ? (
                                <ellipse
                                    cx={node.x}
                                    cy={node.y}
                                    rx={satelliteRadiusX}
                                    ry={satelliteRadiusY}
                                    fill="none"
                                    transform={`rotate(${node.satTilt ?? 0} ${node.x} ${node.y})`}
                                    stroke="var(--line-default)"
                                    strokeWidth="1"
                                    vectorEffect="non-scaling-stroke"
                                />
                            ) : null}
                            {node.satellites.map((satellite, index) => {
                                const satelliteKey = `sat:${node.label}/${satellite.label}`;
                                const satellitePoint = { x: satellite.x, y: satellite.y };

                                return (
                                    <g
                                        key={satellite.label}
                                        role={interactive ? "button" : undefined}
                                        tabIndex={interactive ? 0 : undefined}
                                        aria-label={
                                            interactive ? `Inspect ${satellite.label}` : undefined
                                        }
                                        onClick={
                                            onSelect ? () => onSelect(satelliteKey) : undefined
                                        }
                                        onKeyDown={
                                            onSelect
                                                ? (event) =>
                                                      activate(event, () => onSelect(satelliteKey))
                                                : undefined
                                        }
                                        className={interactive ? "cursor-pointer" : undefined}
                                    >
                                        <line
                                            x1={node.x}
                                            y1={node.y}
                                            x2={satellite.x}
                                            y2={satellite.y}
                                            className="orbit-flow"
                                            stroke="var(--line-default)"
                                            strokeWidth="1"
                                            vectorEffect="non-scaling-stroke"
                                        />
                                        {packets && !reducedMotion ? (
                                            <SignalPacket
                                                from={nodePoint}
                                                to={satellitePoint}
                                                phase={(index * 0.4) % 1}
                                                rate={0.5}
                                                time={time}
                                            />
                                        ) : null}
                                        <circle
                                            cx={satellite.x}
                                            cy={satellite.y}
                                            r="12"
                                            fill="transparent"
                                        />
                                        <circle
                                            cx={satellite.x}
                                            cy={satellite.y}
                                            r="4.4"
                                            fill="var(--space-0)"
                                            stroke={
                                                selected === satelliteKey
                                                    ? "var(--bone-3)"
                                                    : "var(--bone-1)"
                                            }
                                            strokeWidth="1"
                                            vectorEffect="non-scaling-stroke"
                                        />
                                        <Globe
                                            x={satellite.x}
                                            y={satellite.y}
                                            radius={4.4}
                                            bright={selected === satelliteKey}
                                            seed={index * 2.1 + 0.7}
                                            time={reducedMotion ? 0 : time}
                                        />
                                        <SelectionCore
                                            x={satellite.x}
                                            y={satellite.y}
                                            radius={4.4}
                                            selected={selected === satelliteKey}
                                        />
                                        {labels ? (
                                            <text
                                                x={satellite.x}
                                                y={satellite.y - 9}
                                                textAnchor="middle"
                                                className="orbit-diagram-meta"
                                            >
                                                {(satellite.role || satellite.label).toUpperCase()}
                                            </text>
                                        ) : null}
                                        {readouts.has(satelliteKey) ? (
                                            <Telemetry
                                                label={`${node.label}/${satellite.label}`}
                                                point={readouts.get(satelliteKey)!}
                                                scale={scale}
                                                pulse={pulse}
                                                stats={satellite.stats}
                                                ip={
                                                    addresses.get(
                                                        `${node.label}/${satellite.label}`,
                                                    ) ?? "10.1.0.2"
                                                }
                                            />
                                        ) : null}
                                    </g>
                                );
                            })}
                            <g
                                data-orbit-node={node.label}
                                role={interactive ? "button" : undefined}
                                tabIndex={interactive ? 0 : undefined}
                                aria-label={interactive ? `Inspect ${node.label}` : undefined}
                                onClick={onSelect ? () => onSelect(nodeKey) : undefined}
                                onKeyDown={
                                    onSelect
                                        ? (event) => activate(event, () => onSelect(nodeKey))
                                        : undefined
                                }
                                className={interactive ? "cursor-pointer" : undefined}
                            >
                                <circle cx={node.x} cy={node.y} r="15" fill="transparent" />
                                <circle
                                    cx={node.x}
                                    cy={node.y}
                                    r={nodeRadius}
                                    fill="var(--space-0)"
                                    stroke={
                                        selected === nodeKey
                                            ? "var(--bone-3)"
                                            : node.state === "warn"
                                              ? "var(--signal-warn)"
                                              : node.state === "error"
                                                ? "var(--signal-error)"
                                                : "var(--bone-3)"
                                    }
                                    strokeWidth="1"
                                    vectorEffect="non-scaling-stroke"
                                />
                                <Globe
                                    x={node.x}
                                    y={node.y}
                                    radius={nodeRadius}
                                    bright={selected === nodeKey}
                                    seed={node.index * 1.3}
                                    time={reducedMotion ? 0 : time}
                                />
                                <SelectionCore
                                    x={node.x}
                                    y={node.y}
                                    radius={nodeRadius}
                                    selected={selected === nodeKey}
                                />
                            </g>
                            {labels ? (
                                node.satellites.length ? (
                                    <>
                                        <text
                                            x={node.x}
                                            y={node.y - satelliteRadiusY - 20}
                                            textAnchor="middle"
                                            className="orbit-diagram-label"
                                        >
                                            {node.label}
                                        </text>
                                        {node.role ? (
                                            <text
                                                x={node.x}
                                                y={node.y - satelliteRadiusY - 8}
                                                textAnchor="middle"
                                                className="orbit-diagram-meta"
                                            >
                                                {node.role.toUpperCase()}
                                            </text>
                                        ) : null}
                                    </>
                                ) : (
                                    <>
                                        <text
                                            x={node.x + (node.x >= centerX ? 12 : -12)}
                                            y={node.y + 1}
                                            textAnchor={node.x >= centerX ? "start" : "end"}
                                            className="orbit-diagram-label"
                                        >
                                            {node.label}
                                        </text>
                                        {node.role ? (
                                            <text
                                                x={node.x + (node.x >= centerX ? 12 : -12)}
                                                y={node.y + 14}
                                                textAnchor={node.x >= centerX ? "start" : "end"}
                                                className="orbit-diagram-meta"
                                            >
                                                {node.role.toUpperCase()}
                                            </text>
                                        ) : null}
                                    </>
                                )
                            ) : null}
                            {labels && node.cluster ? (
                                <text
                                    x={node.x}
                                    y={node.y + satelliteRadiusY + 20}
                                    textAnchor="middle"
                                    className="orbit-diagram-meta"
                                >
                                    {node.cluster.toUpperCase()}
                                </text>
                            ) : null}
                            {readouts.has(nodeKey) ? (
                                <Telemetry
                                    label={node.label}
                                    point={readouts.get(nodeKey)!}
                                    scale={scale}
                                    pulse={pulse}
                                    stats={node.stats}
                                    ip={addresses.get(node.label) ?? "10.1.0.2"}
                                />
                            ) : null}
                        </g>
                    );
                })}

                {centerVisible ? (
                    <g
                        role={interactive ? "button" : undefined}
                        tabIndex={interactive ? 0 : undefined}
                        aria-label={interactive ? "Inspect Gateway" : undefined}
                        onClick={onSelect ? () => onSelect("gateway") : undefined}
                        onKeyDown={
                            onSelect
                                ? (event) => activate(event, () => onSelect("gateway"))
                                : undefined
                        }
                        className={interactive ? "cursor-pointer" : undefined}
                    >
                        <circle cx={centerX} cy={centerY} r="17" fill="transparent" />
                        <circle
                            cx={centerX}
                            cy={centerY}
                            r="9.5"
                            fill={centerPending ? "var(--space-1)" : "var(--space-0)"}
                            stroke={
                                centerPending
                                    ? "var(--grey-2)"
                                    : selected === "gateway"
                                      ? "var(--bone-3)"
                                      : "var(--bone-1)"
                            }
                            strokeWidth="1"
                            vectorEffect="non-scaling-stroke"
                            strokeDasharray={centerPending ? "3 4" : undefined}
                        />
                        {centerPending ? null : (
                            <>
                                <Globe
                                    x={centerX}
                                    y={centerY}
                                    radius={9.5}
                                    bright={selected === "gateway"}
                                    seed={0}
                                    time={reducedMotion ? 0 : time}
                                />
                                <SelectionCore
                                    x={centerX}
                                    y={centerY}
                                    radius={9.5}
                                    selected={selected === "gateway"}
                                />
                            </>
                        )}
                        {readouts.has("gateway") ? (
                            <Telemetry
                                label={center.label || "gateway"}
                                point={readouts.get("gateway")!}
                                scale={scale}
                                pulse={pulse}
                                stats={center.stats}
                                ip="10.1.0.1"
                            />
                        ) : null}
                    </g>
                ) : null}
                {labels && centerVisible ? (
                    <>
                        <text
                            x={centerX}
                            y={centerY - 26}
                            textAnchor="middle"
                            className="orbit-diagram-title"
                        >
                            {center.label}
                        </text>
                        {center.sub ? (
                            <text
                                x={centerX}
                                y={centerY - 13}
                                textAnchor="middle"
                                className="orbit-diagram-meta"
                            >
                                {center.sub.toUpperCase()}
                            </text>
                        ) : null}
                    </>
                ) : null}
            </svg>
            {caption && labels ? (
                <p className="orbit-label -mt-0.5 text-center">{caption}</p>
            ) : null}
        </div>
    );
}
