import type { KeyboardEvent } from "react";

export type OrbitSatellite = {
    label: string;
    role: string;
    angle: number;
};

export type OrbitNode = {
    label: string;
    role: string;
    angle: number;
    cluster?: string;
    satellites: OrbitSatellite[];
};

type OrbitDiagramProps = {
    caption: string;
    center: { label: string; sub: string; state?: "pending" };
    nodes: OrbitNode[];
    selected: string;
    onSelect: (key: string) => void;
};

const width = 520;
const height = 340;
const centerX = width / 2;
const centerY = height / 2;
const ringX = width * 0.38;
const ringY = height * 0.26;
const satelliteX = 58;
const satelliteY = 30;

function point(angle: number, radiusX: number, radiusY: number, x = centerX, y = centerY) {
    const radians = (angle * Math.PI) / 180;

    return {
        x: x + radiusX * Math.cos(radians),
        y: y + radiusY * Math.sin(radians),
    };
}

function activate(event: KeyboardEvent<SVGGElement>, select: () => void) {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        select();
    }
}

function Planet({
    x,
    y,
    radius,
    selected,
}: {
    x: number;
    y: number;
    radius: number;
    selected: boolean;
}) {
    return (
        <>
            <circle
                cx={x}
                cy={y}
                r={radius}
                fill="var(--surface-void)"
                stroke={selected ? "var(--bone-3)" : "var(--bone-1)"}
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
            />
            <path
                d={`M ${x - radius * 0.78} ${y - radius * 0.25} A ${radius * 0.8} ${radius * 0.22} 0 0 0 ${x + radius * 0.78} ${y - radius * 0.25}`}
                fill="none"
                stroke="var(--bone-1)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
            />
            <path
                d={`M ${x - radius * 0.92} ${y + radius * 0.28} A ${radius * 0.95} ${radius * 0.25} 0 0 0 ${x + radius * 0.92} ${y + radius * 0.28}`}
                fill="none"
                stroke="var(--bone-1)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
            />
            {selected ? (
                <circle cx={x} cy={y} r={Math.max(1.5, radius - 2.5)} fill="var(--bone-3)" />
            ) : null}
        </>
    );
}

export function OrbitDiagram({ caption, center, nodes, selected, onSelect }: OrbitDiagramProps) {
    return (
        <div className="w-full">
            <svg
                viewBox="0 14 520 308"
                width="100%"
                className="block h-auto overflow-visible"
                role="img"
                aria-label="Orbit topology"
            >
                <ellipse
                    cx={centerX}
                    cy={centerY}
                    rx={ringX}
                    ry={ringY}
                    fill="none"
                    stroke="var(--line-default)"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                />
                <ellipse
                    cx={centerX}
                    cy={centerY}
                    rx={width * 0.24}
                    ry={height * 0.165}
                    transform={`rotate(-34 ${centerX} ${centerY})`}
                    fill="none"
                    stroke="var(--line-hairline)"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                />

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
                <g
                    role="button"
                    tabIndex={0}
                    aria-label="Inspect you and your agent"
                    onClick={() => onSelect("operator")}
                    onKeyDown={(event) => activate(event, () => onSelect("operator"))}
                    className="cursor-pointer"
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
                    <text x="44" y="35" className="orbit-diagram-label">
                        YOU + YOUR AGENT
                    </text>
                </g>

                {nodes.map((node) => {
                    const nodePoint = point(node.angle, ringX, ringY);
                    const nodeKey = `node:${node.label}`;

                    return (
                        <g key={node.label} className="orbit-diagram-enter">
                            <line
                                x1={centerX}
                                y1={centerY}
                                x2={nodePoint.x}
                                y2={nodePoint.y}
                                className="orbit-flow"
                                stroke="var(--line-default)"
                                strokeWidth="1"
                                vectorEffect="non-scaling-stroke"
                            />
                            <ellipse
                                cx={nodePoint.x}
                                cy={nodePoint.y}
                                rx={satelliteX}
                                ry={satelliteY}
                                fill="none"
                                stroke="var(--line-default)"
                                strokeWidth="1"
                                vectorEffect="non-scaling-stroke"
                            />
                            {node.satellites.map((satellite) => {
                                const satellitePoint = point(
                                    satellite.angle,
                                    satelliteX,
                                    satelliteY,
                                    nodePoint.x,
                                    nodePoint.y,
                                );
                                const satelliteKey = `sat:${node.label}/${satellite.label}`;

                                return (
                                    <g
                                        key={satellite.label}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`Inspect ${satellite.label}`}
                                        onClick={() => onSelect(satelliteKey)}
                                        onKeyDown={(event) =>
                                            activate(event, () => onSelect(satelliteKey))
                                        }
                                        className="cursor-pointer"
                                    >
                                        <line
                                            x1={nodePoint.x}
                                            y1={nodePoint.y}
                                            x2={satellitePoint.x}
                                            y2={satellitePoint.y}
                                            className="orbit-flow"
                                            stroke="var(--line-default)"
                                            strokeWidth="1"
                                            vectorEffect="non-scaling-stroke"
                                        />
                                        <circle
                                            cx={satellitePoint.x}
                                            cy={satellitePoint.y}
                                            r="12"
                                            fill="transparent"
                                        />
                                        <Planet
                                            x={satellitePoint.x}
                                            y={satellitePoint.y}
                                            radius={4.4}
                                            selected={selected === satelliteKey}
                                        />
                                        <text
                                            x={satellitePoint.x}
                                            y={satellitePoint.y - 9}
                                            textAnchor="middle"
                                            className="orbit-diagram-meta"
                                        >
                                            {satellite.role.toUpperCase()}
                                        </text>
                                    </g>
                                );
                            })}
                            <g
                                role="button"
                                tabIndex={0}
                                aria-label={`Inspect ${node.label}`}
                                onClick={() => onSelect(nodeKey)}
                                onKeyDown={(event) => activate(event, () => onSelect(nodeKey))}
                                className="cursor-pointer"
                            >
                                <circle
                                    cx={nodePoint.x}
                                    cy={nodePoint.y}
                                    r="15"
                                    fill="transparent"
                                />
                                <Planet
                                    x={nodePoint.x}
                                    y={nodePoint.y}
                                    radius={6.6}
                                    selected={selected === nodeKey}
                                />
                            </g>
                            <text
                                x={nodePoint.x}
                                y={nodePoint.y - satelliteY - 20}
                                textAnchor="middle"
                                className="orbit-diagram-label"
                            >
                                {node.label}
                            </text>
                            <text
                                x={nodePoint.x}
                                y={nodePoint.y - satelliteY - 8}
                                textAnchor="middle"
                                className="orbit-diagram-meta"
                            >
                                {node.role.toUpperCase()}
                            </text>
                            {node.cluster ? (
                                <text
                                    x={nodePoint.x}
                                    y={nodePoint.y + satelliteY + 20}
                                    textAnchor="middle"
                                    className="orbit-diagram-meta"
                                >
                                    {node.cluster.toUpperCase()}
                                </text>
                            ) : null}
                        </g>
                    );
                })}

                <g
                    role="button"
                    tabIndex={0}
                    aria-label="Inspect Gateway"
                    onClick={() => onSelect("gateway")}
                    onKeyDown={(event) => activate(event, () => onSelect("gateway"))}
                    className="cursor-pointer"
                >
                    <circle cx={centerX} cy={centerY} r="17" fill="transparent" />
                    {center.state === "pending" ? (
                        <circle
                            cx={centerX}
                            cy={centerY}
                            r="9.5"
                            fill="var(--space-1)"
                            stroke="var(--grey-2)"
                            strokeWidth="1"
                            strokeDasharray="3 4"
                        />
                    ) : (
                        <Planet
                            x={centerX}
                            y={centerY}
                            radius={9.5}
                            selected={selected === "gateway"}
                        />
                    )}
                </g>
                <text
                    x={centerX}
                    y={centerY - 26}
                    textAnchor="middle"
                    className="orbit-diagram-title"
                >
                    {center.label}
                </text>
                <text
                    x={centerX}
                    y={centerY - 13}
                    textAnchor="middle"
                    className="orbit-diagram-meta"
                >
                    {center.sub.toUpperCase()}
                </text>
            </svg>
            <p className="orbit-label -mt-0.5 text-center">{caption}</p>
        </div>
    );
}
