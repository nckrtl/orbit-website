import { useId, type ReactNode } from "react";

const statistics = [
    "3 nodes online",
    "WireGuard active",
    "14 clients",
    "12 apps",
    "32 app instances",
    "54 managed processes",
    "5 firewall rules",
];
const terminals = [
    {
        name: "worktrees",
        x: 225,
        y: 8,
        command: "$ git worktree add feature/shop",
        lines: [
            "Preparing worktree…",
            "Checking out branch feature/shop",
            "HEAD → 8f3a2c1",
            "Installing project dependencies",
            "Starting dev server on :5173",
            "✓ Workspace ready",
        ],
    },
    {
        name: "routes",
        x: 8,
        y: 160,
        command: "$ orbit route:new …",
        lines: [
            "Resolving dev-01 over WireGuard",
            "Registering project.test",
            "Upstream → 127.0.0.1:5173",
            "Applying private route",
            "Checking upstream… 200 OK",
            "✓ Preview reachable",
        ],
    },
    {
        name: "tools",
        x: 225,
        y: 160,
        command: "$ orbit tool:manager:list",
        lines: [
            "Reading installed versions",
            "Checking package managers",
            "node       up to date",
            "php        up to date",
            "agent CLI  update available",
            "✓ Inventory refreshed",
        ],
    },
];

function Terminal({
    name,
    x,
    y,
    children,
}: {
    name: string;
    x: number;
    y: number;
    children: ReactNode;
}) {
    return (
        <g transform={`translate(${x} ${y})`} data-foundation-terminal={name}>
            <rect width="217" height="152" className="orbit-stack__terminal-surface" />
            <path d="M 0 25 H 217" className="orbit-stack__rule" />
            <circle cx="11" cy="13" r="2" className="orbit-stack__status" />
            <text x="21" y="16" className="orbit-stack__small">
                {name} / dev-01
            </text>
            <text x="204" y="16" textAnchor="end" className="orbit-stack__small">
                bash
            </text>
            {children}
        </g>
    );
}

export function DevelopmentFoundation() {
    const id = useId();
    return (
        <g data-development-foundation>
            <defs>
                <clipPath id={`${id}-screen`}>
                    <rect x="8" y="8" width="434" height="324" rx="9" />
                </clipPath>
                <clipPath id={`${id}-output`}>
                    <rect x="9" y="47" width="199" height="97" />
                </clipPath>
                <clipPath id={`${id}-stats`}>
                    <rect x="8" y="313" width="434" height="19" />
                </clipPath>
                <linearGradient id={`${id}-fade`}>
                    <stop offset="0" stopColor="black" />
                    <stop offset=".035" stopColor="white" />
                    <stop offset=".965" stopColor="white" />
                    <stop offset="1" stopColor="black" />
                </linearGradient>
                <mask
                    id={`${id}-stats-mask`}
                    maskUnits="userSpaceOnUse"
                    x="8"
                    y="313"
                    width="434"
                    height="19"
                >
                    <rect x="8" y="313" width="434" height="19" fill={`url(#${id}-fade)`} />
                </mask>
            </defs>
            <g clipPath={`url(#${id}-screen)`} data-foundation-grid>
                <rect
                    x="8"
                    y="8"
                    width="434"
                    height="324"
                    className="orbit-stack__terminal-surface"
                />
                <Terminal name="htop" x={8} y={8}>
                    {[
                        ["CPU", "18%", 73],
                        ["MEM", "2.4 / 8G", 94],
                        ["SWP", "0 / 2G", 9],
                    ].map(([label, value, width], index) => (
                        <g key={label} transform={`translate(10 ${40 + index * 14})`}>
                            <text className="orbit-stack__small">{label}</text>
                            <path d="M 25 -3 H 112" className="orbit-stack__rule" />
                            <g transform="translate(25 -5)">
                                <rect
                                    width={width}
                                    height="4"
                                    className="orbit-stack__resource"
                                    style={{ animationDelay: `${index * -2}s` }}
                                />
                            </g>
                            <text x="176" textAnchor="end" className="orbit-stack__small">
                                {value}
                            </text>
                        </g>
                    ))}
                    {[
                        ["PID", "CPU%", "MEM%", "COMMAND"],
                        ["1248", "8.2", "3.1", "node / vite"],
                        ["1302", "2.4", "1.8", "queue:work"],
                        ["1421", "0.8", "1.2", "orbit-agent"],
                        ["1440", "0.4", "0.6", "php-fpm"],
                    ].map((columns, row) => (
                        <text
                            key={row}
                            y={87 + row * 14}
                            className={
                                row === 0 ? "orbit-stack__small" : "orbit-stack__terminal-text"
                            }
                        >
                            {columns.map((column, index) => (
                                <tspan key={index} x={[10, 46, 78, 112][index]}>
                                    {column}
                                </tspan>
                            ))}
                        </text>
                    ))}
                </Terminal>
                {terminals.map((terminal, index) => (
                    <Terminal key={terminal.name} {...terminal}>
                        <text x="10" y="40" className="orbit-stack__terminal-text">
                            {terminal.command}
                        </text>
                        <g clipPath={`url(#${id}-output)`}>
                            <g
                                className="orbit-stack__terminal-output"
                                style={{ animationDelay: `${index * -4}s` }}
                            >
                                {[0, 1].map((copy) => (
                                    <g
                                        key={copy}
                                        transform={`translate(0 ${copy * 96})`}
                                        aria-hidden={copy === 1 ? true : undefined}
                                    >
                                        {terminal.lines.map((line, row) => (
                                            <text
                                                key={line}
                                                x="10"
                                                y={58 + row * 16}
                                                className="orbit-stack__terminal-text"
                                            >
                                                {line}
                                            </text>
                                        ))}
                                    </g>
                                ))}
                            </g>
                        </g>
                    </Terminal>
                ))}
                <path
                    data-foundation-dividers
                    d="M 225 8 V 312 M 8 160 H 442 M 8 312 H 442"
                    className="orbit-stack__rule"
                />
                <g
                    data-foundation-statistics
                    clipPath={`url(#${id}-stats)`}
                    mask={`url(#${id}-stats-mask)`}
                >
                    <g className="orbit-stack__statistics-track">
                        {[0, 1].map((copy) => (
                            <g
                                key={copy}
                                transform={`translate(${copy * 960} 0)`}
                                aria-hidden={copy === 1 ? true : undefined}
                            >
                                {statistics.map((statistic, index) => (
                                    <g
                                        key={statistic}
                                        transform={`translate(${20 + index * 120} 326)`}
                                        data-network-statistic={copy === 0 ? statistic : undefined}
                                    >
                                        <circle
                                            cx="0"
                                            cy="-3"
                                            r="1.5"
                                            className="orbit-stack__status"
                                        />
                                        <text x="7" className="orbit-stack__terminal-text">
                                            {statistic}
                                        </text>
                                    </g>
                                ))}
                            </g>
                        ))}
                    </g>
                </g>
            </g>
            <rect
                data-foundation-border
                x="8"
                y="8"
                width="434"
                height="324"
                rx="9"
                className="orbit-stack__rule"
            />
        </g>
    );
}
