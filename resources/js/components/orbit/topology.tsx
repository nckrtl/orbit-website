import type { HTMLAttributes, KeyboardEvent } from "react";
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
    packetSize?: number;
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
    packetSize,
    phase,
    time,
    to,
}: {
    from: Point;
    packetSize: number;
    phase: number;
    time: number;
    to: Point;
}) {
    const progress = (time * 0.3 + phase) % 1;
    const x = from.x + (to.x - from.x) * progress;
    const y = from.y + (to.y - from.y) * progress;

    return (
        <circle
            cx={x}
            cy={y}
            r={packetSize}
            fill="var(--bone-3)"
            opacity={0.35 + Math.sin(progress * Math.PI) * 0.65}
        />
    );
}

function Telemetry({
    ip,
    label,
    point,
    pulse,
    side,
    stats,
}: {
    ip: string;
    label: string;
    point: Point;
    pulse: number;
    side?: "left" | "right";
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
    const right = side ? side === "right" : point.x < centerX;
    const x = point.x + (right ? 13 : -13);
    const anchor = right ? "start" : "end";

    return (
        <g pointerEvents="none" className="orbit-telemetry">
            <text x={x} y={point.y - 9} textAnchor={anchor} className="orbit-diagram-label">
                {ping}ms
            </text>
            <text x={x} y={point.y + 3} textAnchor={anchor} className="orbit-diagram-meta">
                c{cpu} m{memory} d{disk}
            </text>
            <text x={x} y={point.y + 15} textAnchor={anchor} className="orbit-diagram-meta">
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

    return withinX && point.y >= zone[2] * height && point.y <= zone[3] * height;
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
    packetSize = 1.5,
    packets = true,
    selected = null,
    showCenter = true,
    speed = 2.2,
    stats = false,
    statsZone,
    ...props
}: OrbitDiagramProps) {
    const [time, setTime] = useState(0);
    const [pulse, setPulse] = useState(0);
    const reducedMotion = usePrefersReducedMotion();
    const startTime = useRef<number | null>(null);

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

    return (
        <div className={`w-full ${className}`} {...props}>
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
                                packetSize={packetSize}
                                phase={0.1}
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
                                    packetSize={packetSize}
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
                                                packetSize={packetSize}
                                                phase={(index * 0.4) % 1}
                                                time={time * 1.4}
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
                                        {stats && inStatsZone(satellitePoint, statsZone) ? (
                                            <Telemetry
                                                label={`${node.label}/${satellite.label}`}
                                                point={satellitePoint}
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
                                                : "var(--bone-1)"
                                    }
                                    strokeWidth="1"
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
                            {stats && inStatsZone(nodePoint, statsZone) ? (
                                <Telemetry
                                    label={node.label}
                                    point={nodePoint}
                                    pulse={pulse}
                                    stats={node.stats}
                                    ip={addresses.get(node.label) ?? "10.1.0.2"}
                                    side={
                                        labels && !node.satellites.length
                                            ? node.x >= centerX
                                                ? "left"
                                                : "right"
                                            : undefined
                                    }
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
                        {stats &&
                        !centerPending &&
                        inStatsZone({ x: centerX, y: centerY }, statsZone) ? (
                            <Telemetry
                                label={center.label || "gateway"}
                                point={{ x: centerX, y: centerY + (labels ? 26 : 0) }}
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
