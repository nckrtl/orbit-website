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
    packets?: boolean;
    selected?: string | null;
    showCenter?: boolean;
    speed?: number;
    stats?: boolean;
    statsZone?: number[];
};

type Point = { x: number; y: number };
type Box = { x1: number; y1: number; x2: number; y2: number };
type PlacedSatellite = OrbitSatellite & Point;
type PlacedNode = Omit<OrbitNode, "satellites"> &
    Point & { index: number; satellites: PlacedSatellite[] };

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
    const headOpacity = 0.16 + (progress < 0.5 ? progress * 2 : (1 - progress) * 2) * 0.72;
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const tail = Math.min(0.3, 26 / Math.max(1, distance));

    return Array.from({ length: 14 }, (_, index) => {
        const start = Math.max(0, progress - (tail * (index + 1)) / 14);
        const end = Math.max(0, progress - (tail * index) / 14);

        if (end <= 0) {
            return null;
        }

        const fade = 1 - index / 14;

        return (
            <line
                key={index}
                x1={from.x + (to.x - from.x) * start}
                y1={from.y + (to.y - from.y) * start}
                x2={from.x + (to.x - from.x) * end}
                y2={from.y + (to.y - from.y) * end}
                stroke="var(--bone-3)"
                strokeWidth="1"
                opacity={headOpacity * fade * fade}
                vectorEffect="non-scaling-stroke"
            />
        );
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
    const x = point.x;
    const step = 13 / (scale || 1);
    const baseline = point.y;

    return (
        <g pointerEvents="none" className="orbit-telemetry">
            <text
                x={x}
                y={baseline}
                fill="var(--text-secondary)"
                style={{
                    fontFamily: "var(--font-code)",
                    fontSize: `${(9 / (scale || 1)).toFixed(2)}px`,
                    fontWeight: 500,
                    letterSpacing: "0.03em",
                }}
            >
                {ping}ms
            </text>
            <text
                x={x}
                y={baseline + step}
                fill="var(--text-muted)"
                style={{
                    fontFamily: "var(--font-code)",
                    fontSize: `${(8.5 / (scale || 1)).toFixed(2)}px`,
                    fontWeight: 400,
                    letterSpacing: "0.04em",
                }}
            >
                c{cpu} m{memory} d{disk}
            </text>
            <text
                x={x}
                y={baseline + step * 2}
                fill="var(--text-faint)"
                style={{
                    fontFamily: "var(--font-code)",
                    fontSize: `${(8.5 / (scale || 1)).toFixed(2)}px`,
                    fontWeight: 400,
                    letterSpacing: "0.04em",
                }}
            >
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
    ...props
}: OrbitDiagramProps) {
    const [time, setTime] = useState(0);
    const [pulse, setPulse] = useState(0);
    const reducedMotion = usePrefersReducedMotion();
    const elapsed = useRef(0);
    const wrapper = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [active, setActive] = useState(false);

    useEffect(() => {
        const element = wrapper.current;
        if (!element) return;
        let visible = false;
        const sync = () => setActive(visible && !document.hidden);
        const observer = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            sync();
        });
        observer.observe(element);
        document.addEventListener("visibilitychange", sync);
        return () => {
            observer.disconnect();
            document.removeEventListener("visibilitychange", sync);
        };
    }, []);

    useEffect(() => {
        const element = wrapper.current;

        if (!element || typeof ResizeObserver === "undefined") {
            return;
        }

        const observer = new ResizeObserver(() => {
            const renderedWidth = element.getBoundingClientRect().width;

            if (renderedWidth > 0) {
                setScale(renderedWidth / width);
            }
        });

        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    const scaledFontSize = (pixels: number) => `${(pixels / (scale || 1)).toFixed(2)}px`;

    useEffect(() => {
        if (!orbit || reducedMotion || !active) {
            return;
        }

        let frame = 0;
        let previous: number | null = null;
        const loop = (now: number) => {
            if (previous !== null) elapsed.current += Math.min(now - previous, 50) / 1000;
            previous = now;
            setTime(elapsed.current);
            frame = requestAnimationFrame(loop);
        };

        frame = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(frame);
        };
    }, [active, orbit, reducedMotion]);

    useEffect(() => {
        if (!stats || reducedMotion || !active) {
            return;
        }

        const timer = setInterval(() => setPulse((current) => current + 1), 1000);
        return () => clearInterval(timer);
    }, [active, reducedMotion, stats]);

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
    const readouts = new Map<string, Point>();

    if (stats) {
        // Reserve names before telemetry, in the reference's gateway/node/satellite order.
        const boxes: Box[] = [];
        if (labels) {
            if (centerVisible) {
                boxes.push({
                    x1: centerX - 46,
                    y1: centerY - 32,
                    x2: centerX + 46,
                    y2: centerY - 6,
                });
            }
            for (const node of placed) {
                const right = node.x >= centerX;
                boxes.push(
                    node.satellites.length
                        ? {
                              x1: node.x - 52,
                              y1: node.y - satelliteRadiusY - 26,
                              x2: node.x + 52,
                              y2: node.y - satelliteRadiusY - 2,
                          }
                        : {
                              x1: right ? node.x + 10 : node.x - 58,
                              y1: node.y - 9,
                              x2: right ? node.x + 58 : node.x - 10,
                              y2: node.y + 18,
                          },
                );
                if (node.cluster) {
                    boxes.push({
                        x1: node.x - 52,
                        y1: node.y + satelliteRadiusY + 12,
                        x2: node.x + 52,
                        y2: node.y + satelliteRadiusY + 24,
                    });
                }
                for (const satellite of node.satellites) {
                    boxes.push({
                        x1: satellite.x - 26,
                        y1: satellite.y - 15,
                        x2: satellite.x + 26,
                        y2: satellite.y - 4,
                    });
                }
            }
        }
        const placeReadout = (
            key: string,
            point: Point,
            gap: number,
            offset = 0,
            side?: "left" | "right",
        ) => {
            if (!inStatsZone(point, statsZone)) return;
            const lo = statsZone && statsZone.length >= 2 ? statsZone[0] * width : 6;
            const hi = statsZone && statsZone.length >= 2 ? statsZone[1] * width : width - 6;
            const right = side ? side === "right" : point.x + gap + 52 <= hi;
            const x = Math.max(lo, Math.min(hi - 52, right ? point.x + gap : point.x - gap - 52));
            const step = 13 / scale;
            const y = point.y - step + 3.2 / scale + offset;
            const box = { x1: x - 2, y1: y - step - 3, x2: x + 54, y2: y + step * 2 + 4 };
            if (
                boxes.some(
                    (taken) =>
                        !(
                            box.x2 < taken.x1 ||
                            box.x1 > taken.x2 ||
                            box.y2 < taken.y1 ||
                            box.y1 > taken.y2
                        ),
                )
            )
                return;
            boxes.push(box);
            readouts.set(key, { x, y });
        };
        if (centerVisible && !centerPending)
            placeReadout("gateway", { x: centerX, y: centerY }, 15, labels ? 26 : 0);
        for (const node of placed) {
            placeReadout(
                `node:${node.label}`,
                node,
                13,
                0,
                labels && !node.satellites.length
                    ? node.x >= centerX
                        ? "left"
                        : "right"
                    : undefined,
            );
        }
        for (const node of placed) {
            for (const satellite of node.satellites) {
                placeReadout(`sat:${node.label}/${satellite.label}`, satellite, 9, labels ? 10 : 0);
            }
        }
    }

    return (
        <div ref={wrapper} className={`w-full ${className}`} {...props}>
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
                            stroke="var(--line-default)"
                            strokeWidth="1"
                            strokeDasharray="2 4"
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
                                vectorEffect="non-scaling-stroke"
                            />
                            {selected === "operator" ? (
                                <rect x="27" y="29" width="6" height="6" fill="var(--bone-3)" />
                            ) : null}
                            {labels ? (
                                <text
                                    x="44"
                                    y="32"
                                    dominantBaseline="central"
                                    fill={
                                        selected === "operator"
                                            ? "var(--text-primary)"
                                            : "var(--text-muted)"
                                    }
                                    style={{
                                        fontFamily: "var(--font-code)",
                                        fontSize: scaledFontSize(9.5),
                                        fontWeight: 500,
                                        letterSpacing: "0.14em",
                                    }}
                                >
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
                                stroke="var(--line-default)"
                                strokeWidth="1"
                                strokeDasharray="2 4"
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
                                            stroke="var(--line-default)"
                                            strokeWidth="1"
                                            strokeDasharray="2 4"
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
                                            data-orbit-planet=""
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
                                        {labels ? (
                                            <text
                                                x={satellite.x}
                                                y={satellite.y - 9}
                                                textAnchor="middle"
                                                fill="var(--text-muted)"
                                                style={{
                                                    fontFamily: "var(--font-code)",
                                                    fontSize: scaledFontSize(9.5),
                                                    fontWeight: 400,
                                                    letterSpacing: "0.12em",
                                                }}
                                            >
                                                {(satellite.role || satellite.label).toUpperCase()}
                                            </text>
                                        ) : null}
                                        {readouts.has(satelliteKey) ? (
                                            <Telemetry
                                                label={`${node.label}/${satellite.label}`}
                                                point={readouts.get(satelliteKey) ?? satellitePoint}
                                                pulse={pulse}
                                                scale={scale}
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
                                    data-orbit-planet=""
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
                            </g>
                            {labels ? (
                                node.satellites.length ? (
                                    <>
                                        <text
                                            x={node.x}
                                            y={node.y - satelliteRadiusY - 20}
                                            textAnchor="middle"
                                            fill="var(--text-secondary)"
                                            style={{
                                                fontFamily: "var(--font-code)",
                                                fontSize: scaledFontSize(11),
                                                fontWeight: 500,
                                                letterSpacing: "0.05em",
                                            }}
                                        >
                                            {node.label}
                                        </text>
                                        {node.role ? (
                                            <text
                                                x={node.x}
                                                y={node.y - satelliteRadiusY - 8}
                                                textAnchor="middle"
                                                fill="var(--text-muted)"
                                                style={{
                                                    fontFamily: "var(--font-code)",
                                                    fontSize: scaledFontSize(9.5),
                                                    fontWeight: 400,
                                                    letterSpacing: "0.14em",
                                                }}
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
                                            fill="var(--text-secondary)"
                                            style={{
                                                fontFamily: "var(--font-code)",
                                                fontSize: scaledFontSize(11),
                                                fontWeight: 500,
                                                letterSpacing: "0.05em",
                                            }}
                                        >
                                            {node.label}
                                        </text>
                                        {node.role ? (
                                            <text
                                                x={node.x + (node.x >= centerX ? 12 : -12)}
                                                y={node.y + 14}
                                                textAnchor={node.x >= centerX ? "start" : "end"}
                                                fill="var(--text-muted)"
                                                style={{
                                                    fontFamily: "var(--font-code)",
                                                    fontSize: scaledFontSize(9.5),
                                                    fontWeight: 400,
                                                    letterSpacing: "0.14em",
                                                }}
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
                                    fill="var(--text-muted)"
                                    style={{
                                        fontFamily: "var(--font-code)",
                                        fontSize: scaledFontSize(9.5),
                                        fontWeight: 500,
                                        letterSpacing: "0.14em",
                                    }}
                                >
                                    {node.cluster.toUpperCase()}
                                </text>
                            ) : null}
                            {readouts.has(nodeKey) ? (
                                <Telemetry
                                    label={node.label}
                                    point={readouts.get(nodeKey) ?? nodePoint}
                                    pulse={pulse}
                                    scale={scale}
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
                            data-orbit-planet=""
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
                            </>
                        )}
                        {readouts.has("gateway") ? (
                            <Telemetry
                                label={center.label || "gateway"}
                                point={readouts.get("gateway") ?? { x: centerX, y: centerY }}
                                pulse={pulse}
                                scale={scale}
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
                            fill={centerPending ? "var(--text-muted)" : "var(--text-primary)"}
                            style={{
                                fontFamily: "var(--font-code)",
                                fontSize: scaledFontSize(12),
                                fontWeight: 500,
                                letterSpacing: "0.06em",
                            }}
                        >
                            {center.label}
                        </text>
                        {center.sub ? (
                            <text
                                x={centerX}
                                y={centerY - 13}
                                textAnchor="middle"
                                fill="var(--text-muted)"
                                style={{
                                    fontFamily: "var(--font-code)",
                                    fontSize: scaledFontSize(9.5),
                                    fontWeight: 400,
                                    letterSpacing: "0.14em",
                                }}
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
