import { animateRouteSignal } from "./route-signal";
import { useEffect, useRef } from "react";
import { useMatchedPlanetRadius } from "./use-matched-planet-radius";
import { hardwarePlane, hardwarePoint } from "./laptop";
import { OrbitPlanet } from "./orbit-planet";
import { TabBacking } from "./tab-backing";
import type { Point } from "./object-scale";
import { useSceneViewport } from "./use-scene-viewport";

const axis = hardwarePoint(1, 0);
const depthAxis = hardwarePoint(0, 1);
const vertical = Math.cos(Math.PI / 6);
const chest: Point = [430, 175];
const gateway: Point = [chest[0], chest[1] - 75];
const nodes = [
    {
        name: "dev1",
        x: 4,
        y: 32,
        side: "left",
        cpu: "24%",
        memory: "61%",
        drift: false,
        port: [-29, 0],
    },
    {
        name: "prod1",
        x: 636,
        y: 60,
        side: "right",
        cpu: "38%",
        memory: "52%",
        drift: true,
        port: [0, -29],
    },
    {
        name: "database",
        x: 4,
        y: 230,
        side: "left",
        cpu: "12%",
        memory: "74%",
        drift: false,
        port: [0, 29],
    },
    {
        name: "Macbook",
        x: 636,
        y: 235,
        side: "right",
        cpu: "8%",
        memory: "34%",
        drift: false,
        port: [29, 0],
    },
];

function diagnosticRoute(to: Point, left: boolean, port: number[]) {
    // Route in the same ground plane as the laptop, namespace and inventory scenes.
    const dx = to[0] - chest[0];
    const dy = to[1] - chest[1] - 3;
    const determinant = axis[0] * depthAxis[1] - axis[1] * depthAxis[0];
    const u = (dx * depthAxis[1] - dy * depthAxis[0]) / determinant;
    const v = (axis[0] * dy - axis[1] * dx) / determinant;
    const lane = port[0] === 0 ? 0 : left ? -140 : 210;
    const points = [port, [lane, port[1]], [lane, v], [u, v]];
    return points
        .map(([x, y], index) => {
            const point = hardwarePoint(x, y);
            return `${index === 0 ? "M" : "L"} ${chest[0] + point[0]} ${chest[1] + point[1] + 3}`;
        })
        .join(" ");
}

export function DoctorDrawing() {
    const ref = useRef<SVGSVGElement>(null);
    useSceneViewport(ref, "0 0 860 400", "190 0 650 400");
    const radius = useMatchedPlanetRadius(ref);
    useEffect(() => {
        const scene = ref.current;
        if (!scene) return;
        return animateRouteSignal(
            scene,
            scene.querySelector<SVGPathElement>("[data-doctor-signal]")!,
            [...scene.querySelectorAll<SVGPathElement>("[data-doctor-route]")],
            { activityKey: "vitalsActive" },
        );
    }, []);

    return (
        <svg
            ref={ref}
            data-vitals-active="false"
            viewBox="0 0 860 400"
            className="orbit-capability__drawing orbit-capability__drawing--doctor"
            aria-hidden="true"
        >
            <g className="orbit-doctor__connections">
                {nodes.map(({ name, x, y, side, port }) => (
                    <path
                        key={name}
                        data-doctor-route={name}
                        d={diagnosticRoute(
                            [
                                x + (side === "left" ? axis[0] * 238 : 0),
                                y + vertical * 31 + (side === "left" ? axis[1] * 238 : 0),
                            ],
                            side === "left",
                            port,
                        )}
                    />
                ))}
            </g>
            <path data-doctor-signal visibility="hidden" className="orbit-doctor__signal" />
            <g data-doctor-stethoscope>
                <path
                    data-doctor-tube
                    d={`M ${chest[0] + 3} 190 V 298 C ${chest[0] + 3} 381 523 381 523 336 V 327 H 529 V 336 C 529 387 ${chest[0] - 3} 387 ${chest[0] - 3} 298 V 190 Z`}
                    className="orbit-doctor__tube"
                />
                <g
                    data-doctor-earpieces
                    transform={`matrix(${axis.join(" ")} 0 ${vertical} 475 220)`}
                >
                    <path
                        data-doctor-ear-depth
                        transform="translate(2 -1.5)"
                        d="M 30 20 C 4 64 20 110 56 110 C 92 110 108 64 82 20 L 77 23 C 100 65 86 104 56 104 C 26 104 12 65 35 23 Z"
                        className="orbit-doctor__metal"
                    />
                    <path
                        d="M 30 20 C 4 64 20 110 56 110 C 92 110 108 64 82 20 L 77 23 C 100 65 86 104 56 104 C 26 104 12 65 35 23 Z"
                        className="orbit-doctor__metal"
                    />
                    {[
                        { x: 27, angle: 24 },
                        { x: 64, angle: -24 },
                    ].map(({ x, angle }) => (
                        <g
                            key={x}
                            data-doctor-ear-tip
                            transform={`translate(${x} 12) rotate(${angle} 10 6)`}
                        >
                            <TabBacking width={21} height={11} radius={5.5} />
                            <rect
                                width="21"
                                height="11"
                                rx="5.5"
                                className="orbit-doctor__earpiece"
                            />
                        </g>
                    ))}
                    <g data-doctor-hose-joint transform="translate(51 107)">
                        <path
                            data-doctor-joint-depth
                            d="M 3 0 L 6 -2 H 10 Q 13 -2 13 1 V 9 Q 13 12 10 12 L 7 14 H 3 Z"
                            className="orbit-doctor__metal"
                        />
                        <rect width="10" height="14" rx="3" className="orbit-doctor__earpiece" />
                        <path d="M 7 0 L 10 -2" className="orbit-doctor__metal" />
                    </g>
                </g>
                <g data-doctor-chestpiece>
                    <ellipse
                        cx={chest[0]}
                        cy={chest[1] + 5}
                        rx="29"
                        ry="14.5"
                        className="orbit-doctor__metal"
                    />
                    <g transform={hardwarePlane(...chest)}>
                        <circle r="29" className="orbit-doctor__earpiece" />
                        {[0, 1].map((index) => (
                            <circle
                                key={index}
                                data-doctor-inward-ring
                                r={index === 0 ? 29 : 14.5}
                                className="orbit-doctor__inward-ring"
                                style={{ animationDelay: `${index * -1.5}s` }}
                            />
                        ))}
                    </g>
                </g>
            </g>
            <g data-doctor-gateway transform={`translate(${gateway.join(" ")})`}>
                <path
                    data-doctor-gateway-link
                    d={`M 0 ${radius} V ${chest[1] - gateway[1]}`}
                    className="orbit-doctor__connections"
                />
                <OrbitPlanet radius={radius} animated />
            </g>
            {nodes.map(({ name, x, y, side, cpu, memory, drift }, index) => (
                <g
                    key={name}
                    data-doctor-node={name}
                    data-doctor-side={side}
                    data-doctor-status={drift ? "drift" : "healthy"}
                    transform={`matrix(${axis.join(" ")} 0 ${vertical} ${x} ${y})`}
                >
                    <TabBacking width={238} height={62} radius={4} />
                    <rect width="238" height="62" rx="4" className="orbit-doctor__node" />
                    <circle
                        data-doctor-port
                        cx={side === "left" ? 238 : 0}
                        cy="31"
                        r="1.6"
                        className="orbit-doctor__port"
                    />
                    <text x="13" y="19" className="orbit-doctor__node-name">
                        {name}
                    </text>
                    <g transform="translate(111 15)" className="orbit-doctor__status">
                        {drift ? (
                            <path d="M 0 -5 L 5 4 H -5 Z M 0 -2 V 0 M 0 2 v .1" />
                        ) : (
                            <path d="M -4 0 L -1 3 L 5 -4" />
                        )}
                    </g>
                    <text x="123" y="19" className="orbit-doctor__status">
                        {drift ? "config drift" : "in sync"}
                    </text>
                    <path d="M 13 27 H 225" className="orbit-doctor__rule" />
                    <svg
                        x="13"
                        y="32"
                        width="67"
                        height="22"
                        viewBox="0 0 67 22"
                        className="orbit-doctor__vitals-window"
                    >
                        <g
                            data-doctor-vitals-track
                            className="orbit-doctor__vitals-track"
                            style={{ animationDelay: `${index * -1.1}s` }}
                        >
                            <path
                                data-doctor-vitals
                                d="M 0 14 H 11 L 16 9 L 21 18 L 26 2 L 31 14 H 45 L 50 10 L 55 14 H 78 L 83 9 L 88 18 L 93 2 L 98 14 H 112 L 117 10 L 122 14 H 134"
                                className="orbit-doctor__vitals"
                            />
                        </g>
                    </svg>
                    <text x="96" y="47" className="orbit-doctor__metric">
                        CPU {cpu}
                    </text>
                    <text x="165" y="47" className="orbit-doctor__metric">
                        MEM {memory}
                    </text>
                </g>
            ))}
        </svg>
    );
}
