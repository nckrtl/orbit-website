import {
    ControlLaptop,
    controlLaptopPort,
    deviceWall,
    hardwarePlane,
    hardwarePoint,
} from "./laptop";
import { OnlineDevice } from "./server-scene";
import { WireGuardMark } from "./wireguard-mark";
import { usePrivateNetworkSignal } from "./private-network-signal";
import type { Point } from "./object-scale";
import { useSceneViewport } from "./use-scene-viewport";

const coin: Point = [335, 150];
const nodeWall = deviceWall(48, 48, 5, 25);
const nodes: Point[] = [
    [325, 18],
    [237, 208],
];
const laptopOffset: Point = [-65, -210];
const laptopScale = 0.8;
const laptopPort = controlLaptopPort.map(
    (value, index) => value * laptopScale + laptopOffset[index],
) as Point;
const phoneOrigin: Point = [540, 24];
const phoneScale = 1.3;
const tabletOrigin: Point = [500, 182];
const tabletScale = 0.9;
const phonePort = hardwarePoint(21, 84).map(
    (value, index) => value * phoneScale + phoneOrigin[index],
) as Point;
const tabletPort = hardwarePoint(0, 58).map(
    (value, index) => value * tabletScale + tabletOrigin[index],
) as Point;
const ports = [
    laptopPort,
    phonePort,
    tabletPort,
    ...nodes.map(([x, y]): Point => {
        const p = hardwarePoint(24, 48);
        return [x + p[0], y + p[1] + 21.65];
    }),
];

// Keep the bends on the same two ground-plane axes as the hardware.
function connection(to: Point, index: number) {
    const a = hardwarePoint(1, 0);
    const b = hardwarePoint(0, 1);
    // Approach the laptop and tablet across their side, after turning in open space.
    const clearance = index === 0 ? 44 : index === 2 ? -44 : 0;
    const approach: Point = [to[0] + a[0] * clearance, to[1] + a[1] * clearance];
    const dx = approach[0] - coin[0];
    const dy = approach[1] - coin[1];
    const run = (dx * b[1] - dy * b[0]) / (a[0] * b[1] - a[1] * b[0]);
    return `M ${coin.join(" ")} l ${a[0] * run} ${a[1] * run} L ${approach.join(" ")} L ${to.join(" ")}`;
}

export function PrivateNetwork() {
    const ref = usePrivateNetworkSignal();
    useSceneViewport(ref, "-40 0 720 280", "180 -10 460 310", "-10 -10 680 310");

    return (
        <svg
            ref={ref}
            data-network-active="false"
            viewBox="-40 0 720 280"
            className="orbit-capability__drawing orbit-capability__drawing--network"
            aria-hidden="true"
        >
            <g className="orbit-capability__network-links">
                {ports.map((port, index) => (
                    <path key={index} data-network-link={index} d={connection(port, index)} />
                ))}
            </g>
            <path
                data-network-signal
                visibility="hidden"
                className="orbit-capability__network-signal"
            />
            <g transform={`translate(${laptopOffset.join(" ")}) scale(${laptopScale})`}>
                <ControlLaptop lidDepth={10} />
            </g>
            <g transform={`translate(${phoneOrigin.join(" ")}) scale(${phoneScale})`}>
                <OnlineDevice kind="phone" origin={[0, 0]} />
            </g>
            {nodes.map(([x, y], index) => (
                <g key={index} data-network-node transform={hardwarePlane(x, y)}>
                    <path d={nodeWall.fill} className="orbit-laptop__device-wall" />
                    <path d={nodeWall.outline} className="orbit-laptop__device-edge" />
                    <rect width="48" height="48" rx="5" className="orbit-laptop__device-shell" />
                    <rect
                        x="13"
                        y="13"
                        width="22"
                        height="22"
                        rx="3"
                        className="orbit-laptop__device-screen"
                    />
                    <path
                        d="M 19 19 h 10 M 19 24 h 10 M 19 29 h 6"
                        className="orbit-laptop__device-copy"
                    />
                </g>
            ))}
            <g data-network-coin>
                <ellipse
                    cx={coin[0]}
                    cy={coin[1] + 4}
                    rx="49"
                    ry="24.5"
                    className="orbit-capability__coin-edge"
                />
                <g transform={hardwarePlane(...coin)}>
                    <circle r="49" className="orbit-capability__coin-face" />
                    <circle r="43" className="orbit-capability__coin-rim" />
                    <WireGuardMark x={-38} y={-38} size={76} />
                </g>
            </g>
            <g transform={`translate(${tabletOrigin.join(" ")}) scale(${tabletScale})`}>
                <OnlineDevice kind="tablet" origin={[0, 0]} />
            </g>
            {ports.map(([x, y], index) => (
                <circle
                    key={index}
                    data-network-port={index}
                    cx={x}
                    cy={y}
                    r="1.6"
                    className="orbit-capability__status"
                />
            ))}
        </svg>
    );
}
