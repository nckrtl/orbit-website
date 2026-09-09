import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from "react";
import {
    ControlLaptop,
    controlLaptopPort,
    controlLaptopTopPort,
    deviceWall,
    hardwarePlane,
    hardwarePoint,
} from "./laptop";
import { OnlineDevice } from "./server-scene";
import { DevelopmentFoundation } from "./development-foundation";
import { useSceneViewport } from "./use-scene-viewport";

// Center the shared logo / Bifrost axis in the 1100-unit scene.
const workspace = { x: 550 - hardwarePoint(225, 160)[0], y: 58, width: 450, height: 340 };
const foundation = { ...workspace, y: 325 };
const laptop = { x: -15, y: -40, scale: 0.95 };
const tablet = { x: 867, y: 488, scale: 1.15 };
const phone = { x: 970, y: 250, scale: 1.7 };
const project = (x: number, y: number, origin: { x: number; y: number }, scale = 1) => {
    const point = hardwarePoint(x, y);
    return [origin.x + point[0] * scale, origin.y + point[1] * scale];
};
const laptopPort = controlLaptopPort.map(
    (value, index) => value * laptop.scale + [laptop.x, laptop.y][index],
);
const tabletPort = project(0, 58, tablet, tablet.scale);
const phonePort = project(21, 84, phone, phone.scale);
phonePort[1] += (3.5 * phone.scale * Math.cos(Math.PI / 6)) / 2;
// Follow the hardware axes, with an optional final approach into a device side.
// Device routes stay in the space beside and above the Orbit surface.
function planeRoute(from: number[], to: number[], yFirst = false, clearance = 0) {
    const a = hardwarePoint(yFirst ? 0 : 1, yFirst ? 1 : 0);
    const b = hardwarePoint(yFirst ? 1 : 0, yFirst ? 0 : 1);
    const offset = hardwarePoint(clearance, 0);
    const approach = [to[0] + offset[0], to[1] + offset[1]];
    const end = approach;
    const dx = end[0] - from[0];
    const dy = end[1] - from[1];
    const run = (dx * b[1] - dy * b[0]) / (a[0] * b[1] - a[1] * b[0]);
    const bend = [from[0] + a[0] * run, from[1] + a[1] * run];
    return `M ${from.join(" ")} L ${bend.join(" ")} L ${end.join(" ")}${clearance ? ` L ${to.join(" ")}` : ""}`;
}
const laptopTop = controlLaptopTopPort.map(
    (value, index) => value * laptop.scale + [laptop.x, laptop.y][index],
);
const laptopWorkspace = project(0, 160, workspace);
const phoneLanding = project(foundation.width, 80, foundation);
// Meet the side wall halfway through its depth, clear of the screen above it.
phoneLanding[1] += (10 * Math.cos(Math.PI / 6)) / 2;
const phoneApproach = project(foundation.width + 65, 80, foundation);
phoneApproach[1] = phoneLanding[1] + hardwarePoint(65, 0)[1];
const depthAxis = hardwarePoint(0, 1);
const phoneDrop = [
    phonePort[0],
    phoneApproach[1] - ((phoneApproach[0] - phonePort[0]) * depthAxis[1]) / depthAxis[0],
];
const sideAxis = hardwarePoint(1, 0);
const sideY = (from: number[], x: number) => from[1] + ((x - from[0]) * sideAxis[1]) / sideAxis[0];
const foundationSide = project(foundation.width, 0, foundation);
foundationSide[1] += (10 * Math.cos(Math.PI / 6)) / 2;
// Align the socket to the tablet so the entire route leaves the side directly,
// instead of following the panel edge before turning toward the device.
const tabletLandingDepth =
    ((tabletPort[1] - foundationSide[1]) * sideAxis[0] -
        (tabletPort[0] - foundationSide[0]) * sideAxis[1]) /
    (depthAxis[1] * sideAxis[0] - depthAxis[0] * sideAxis[1]);
const tabletLanding = [
    foundationSide[0] + depthAxis[0] * tabletLandingDepth,
    foundationSide[1] + depthAxis[1] * tabletLandingDepth,
];
// The phone has a direct side-to-side ADE link. Give the tablet its own lower
// landing and riser, below the phone, so neither route appears to join it.
const phoneWorkspacePort = project(0, 42, phone, phone.scale);
const workspaceSide = project(workspace.width, 0, workspace);
workspaceSide[1] += (10 * Math.cos(Math.PI / 6)) / 2;
const phoneWorkspaceDepth =
    ((phoneWorkspacePort[1] - workspaceSide[1]) * sideAxis[0] -
        (phoneWorkspacePort[0] - workspaceSide[0]) * sideAxis[1]) /
    (depthAxis[1] * sideAxis[0] - depthAxis[0] * sideAxis[1]);
const phoneWorkspace = [
    workspaceSide[0] + depthAxis[0] * phoneWorkspaceDepth,
    workspaceSide[1] + depthAxis[1] * phoneWorkspaceDepth,
];
const tabletWorkspacePort = project(140, 0, tablet, tablet.scale);
const tabletWorkspace = project(workspace.width, 315, workspace);
tabletWorkspace[1] += (10 * Math.cos(Math.PI / 6)) / 2;
const bridgeBottom = project(225, 160, foundation);
const bridgeTop = project(225, 160, workspace);
const bridgeHeight = bridgeBottom[1] - bridgeTop[1];
// The asset's oval is 48 × 24 in the panel plane. Project its front rim so
// every strand starts on the tilted logo instead of a horizontal baseline.
const logoX = hardwarePoint(24, 0);
const logoY = hardwarePoint(0, 12);
const bridgeRadius = Math.hypot(logoX[0], logoY[0]);
function bridgeFoot(offset: number) {
    const angle = Math.atan2(logoY[0], logoX[0]) + Math.acos(offset / bridgeRadius);
    return [
        bridgeBottom[0] + offset,
        bridgeBottom[1] + logoX[1] * Math.cos(angle) + logoY[1] * Math.sin(angle),
    ];
}
const bridgeCenterFoot = bridgeFoot(0);
const bridgeRim = Array.from({ length: 33 }, (_, index) =>
    bridgeFoot(bridgeRadius * (index / 16 - 1)),
);
const bridgeShape = `M ${bridgeRim.map(([x, y]) => `${x} ${y - bridgeHeight}`).join(" L ")} L ${bridgeRim
    .toReversed()
    .map((point) => point.join(" "))
    .join(" L ")} Z`;
const routes = [
    {
        kind: "preview",
        device: "laptop",
        d: planeRoute(project(0, 230, foundation), laptopPort, true),
    },
    {
        kind: "preview",
        device: "tablet",
        d: `M ${tabletLanding.join(" ")} L ${tabletPort.join(" ")}`,
    },
    {
        kind: "preview",
        device: "phone",
        d: `M ${phonePort.join(" ")} L ${phoneDrop.join(" ")} L ${phoneApproach.join(" ")} L ${phoneLanding.join(" ")}`,
    },
    {
        kind: "workspace",
        device: "laptop",
        d: `M ${laptopWorkspace.join(" ")} L ${laptopTop[0]} ${sideY(laptopWorkspace, laptopTop[0])} L ${laptopTop.join(" ")}`,
    },
    {
        kind: "workspace",
        device: "phone",
        d: `M ${phoneWorkspacePort.join(" ")} L ${phoneWorkspace.join(" ")}`,
    },
    {
        kind: "workspace",
        device: "tablet",
        d: `M ${tabletWorkspacePort.join(" ")} L ${tabletWorkspacePort[0]} ${sideY(tabletWorkspace, tabletWorkspacePort[0])} L ${tabletWorkspace.join(" ")}`,
    },
];

function StackSignal({ route, index }: { route: (typeof routes)[number]; index: number }) {
    const ref = useRef<SVGPathElement>(null);
    useEffect(() => {
        const path = ref.current;
        const svg = path?.ownerSVGElement;
        if (!path || !svg) return;
        const update = () => {
            const matrix = path.getScreenCTM();
            if (!matrix) return;
            // Non-scaling strokes use screen pixels for their dash lengths too.
            const length = path.getTotalLength() * Math.hypot(matrix.a, matrix.b);
            const signal = 18;
            const speed = 60;
            path.style.setProperty("--signal-length", String(signal));
            path.style.setProperty("--signal-gap", String(length + signal));
            path.style.setProperty("--signal-end", String(-length));
            path.style.setProperty("--signal-duration", `${(length + signal) / speed}s`);
            path.style.visibility = "visible";
        };
        update();
        const observer = new ResizeObserver(update);
        observer.observe(svg);
        return () => observer.disconnect();
    }, []);
    const reverse =
        (route.kind === "preview" && route.device === "phone") ||
        (route.kind === "workspace" && route.device === "laptop");
    return (
        <path
            ref={ref}
            d={route.d}
            data-stack-signal={route.kind}
            data-stack-signal-device={route.device}
            style={{
                visibility: "hidden",
                animationDelay: `${index * -1.3}s`,
                animationDirection: reverse ? "reverse" : "normal",
            }}
        />
    );
}

function Plate({
    x,
    y,
    width,
    height,
    children,
    layer,
}: typeof workspace & { children: ReactNode; layer: string }) {
    const wall = deviceWall(width, height, 12, 10);
    return (
        <g transform={hardwarePlane(x, y)} data-development-layer={layer}>
            <path d={wall.fill} className="orbit-laptop__device-wall" />
            <path d={wall.outline} className="orbit-laptop__device-edge" />
            <rect width={width} height={height} rx="12" className="orbit-stack__plate" />
            {children}
        </g>
    );
}

export function DevelopmentStack() {
    const bridgeId = useId();
    const ref = useRef<SVGSVGElement>(null);
    useSceneViewport(ref, "0 0 1100 594", "210 0 680 640", "85 0 930 640");
    return (
        <svg
            ref={ref}
            viewBox="0 0 1100 594"
            className="orbit-stack"
            role="img"
            aria-labelledby="development-stack-title development-stack-description"
        >
            <title id="development-stack-title">Your agent workspace, built on Orbit</title>
            <desc id="development-stack-description">
                An agent development environment sits above Orbit. Orbit prepares dependencies,
                worktrees, services, and private URLs on your machine. Communication lines connect
                the layers and a laptop, tablet, and phone so you can direct the work and preview
                the project from your devices.
            </desc>
            <Plate {...foundation} layer="orbit">
                <DevelopmentFoundation />
            </Plate>
            <g className="orbit-stack__connections">
                {routes.map((route, index) => (
                    <path
                        key={index}
                        data-stack-connection={route.kind}
                        data-stack-route-device={route.device}
                        d={route.d}
                    />
                ))}
            </g>
            <g className="orbit-stack__signals" aria-hidden="true">
                {routes.map((route, index) => (
                    <StackSignal
                        key={`${route.kind}-${route.device}`}
                        route={route}
                        index={index}
                    />
                ))}
            </g>
            <g transform={hardwarePlane(foundation.x, foundation.y)}>
                <ellipse
                    data-foundation-logo-fill
                    cx="225"
                    cy="160"
                    rx="24"
                    ry="12"
                    fill="var(--black)"
                    stroke="none"
                />
                <image
                    data-foundation-logo
                    href="/assets/orbit/logo-white.svg"
                    x="201"
                    y="136"
                    width="48"
                    height="48"
                />
            </g>
            <g
                data-stack-bridge
                className="orbit-stack__bridge"
                style={{ "--bridge-travel": `${-bridgeHeight - 44}px` } as CSSProperties}
            >
                <defs>
                    <linearGradient id={bridgeId} x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0" stopColor="var(--text-primary)" stopOpacity=".16" />
                        <stop offset=".55" stopColor="var(--text-primary)" stopOpacity=".035" />
                        <stop offset="1" stopColor="var(--text-primary)" stopOpacity=".1" />
                    </linearGradient>
                    <linearGradient id={`${bridgeId}-trail`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="var(--text-primary)" stopOpacity="1" />
                        <stop offset=".22" stopColor="var(--text-primary)" stopOpacity=".6" />
                        <stop offset="1" stopColor="var(--text-primary)" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient
                        id={`${bridgeId}-trail-down`}
                        href={`#${bridgeId}-trail`}
                        x1="0"
                        y1="1"
                        x2="0"
                        y2="0"
                    />
                    <clipPath id={`${bridgeId}-clip`}>
                        <path d={bridgeShape} />
                    </clipPath>
                </defs>
                <path data-bridge-envelope d={bridgeShape} fill={`url(#${bridgeId})`} />
                <path
                    data-stack-connection="layers"
                    d={`M ${bridgeCenterFoot.join(" ")} L ${bridgeCenterFoot[0]} ${bridgeCenterFoot[1] - bridgeHeight}`}
                    className="orbit-stack__bridge-core"
                />
                <g aria-hidden="true" clipPath={`url(#${bridgeId}-clip)`}>
                    {[-1, -0.66, -0.33, 0, 0.33, 0.66, 1].map((position, index) => {
                        const [x, y] = bridgeFoot(position * bridgeRadius);
                        const downward = index === 1 || index === 5;
                        return (
                            <g key={position}>
                                {position !== 0 && (
                                    <path
                                        d={`M ${x} ${y} V ${y - bridgeHeight}`}
                                        className="orbit-stack__bridge-rail"
                                    />
                                )}
                                <g transform={`translate(${x} ${y})`}>
                                    <rect
                                        x="-.6"
                                        y="0"
                                        width="1.2"
                                        height="44"
                                        fill={`url(#${bridgeId}-trail${downward ? "-down" : ""})`}
                                        className="orbit-stack__bridge-pulse"
                                        data-bridge-direction={downward ? "down" : "up"}
                                        style={{
                                            animationDelay: `${index * -0.7}s`,
                                            animationDirection: downward ? "reverse" : "normal",
                                        }}
                                    />
                                </g>
                            </g>
                        );
                    })}
                </g>
            </g>
            <Plate {...workspace} layer="environment">
                <rect
                    x="10"
                    y="10"
                    width="430"
                    height="320"
                    rx="6"
                    className="orbit-stack__screen"
                />
                <g data-workspace-chrome>
                    <circle cx="24" cy="25" r="2" className="orbit-stack__status" />
                    <circle cx="33" cy="25" r="2" className="orbit-stack__status" />
                    <circle cx="42" cy="25" r="2" className="orbit-stack__status" />
                    <text x="62" y="29" className="orbit-stack__text">
                        Your agent workspace
                    </text>
                    <text x="420" y="29" textAnchor="end" className="orbit-stack__small">
                        dev-01 / connected
                    </text>
                    <path
                        d="M 10 42 H 440 M 121 42 V 314 M 10 314 H 440"
                        className="orbit-stack__rule"
                    />
                </g>
                <g data-workspace-sidebar>
                    <text x="22" y="61" className="orbit-stack__small">
                        PROJECT / STUDIO
                    </text>
                    {["main", "feature / shop", "fix / checkout"].map((name, index) => (
                        <g key={name}>
                            {index === 1 ? (
                                <rect
                                    x="17"
                                    y="92"
                                    width="98"
                                    height="21"
                                    rx="3"
                                    className="orbit-stack__tile"
                                />
                            ) : null}
                            <path
                                d={`M 24 ${77 + index * 23} v 7 m 0 -4 h 5`}
                                className="orbit-stack__rule"
                            />
                            <text x="35" y={83 + index * 23} className="orbit-stack__muted">
                                {name}
                            </text>
                        </g>
                    ))}
                    <text x="22" y="157" className="orbit-stack__small">
                        FILES
                    </text>
                    {[
                        "src /",
                        "  pages /",
                        "  storefront.tsx",
                        "  components /",
                        "  styles /",
                        "package.json",
                        "README.md",
                    ].map((file, index) => (
                        <text key={file} x="25" y={176 + index * 16} className="orbit-stack__muted">
                            {file}
                        </text>
                    ))}
                </g>
                <g data-workspace-editor>
                    <text x="135" y="60" className="orbit-stack__muted">
                        storefront.tsx
                    </text>
                    <text x="259" y="60" className="orbit-stack__small">
                        +24 −6
                    </text>
                    <path
                        d="M 121 70 H 440 M 297 70 V 264 M 121 264 H 440"
                        className="orbit-stack__rule"
                    />
                    {[110, 84, 124, 72, 98, 115, 68, 106, 82, 117].map((width, index) => (
                        <g key={index}>
                            <text x="133" y={89 + index * 16} className="orbit-stack__small">
                                {index + 12}
                            </text>
                            <path
                                d={`M ${151 + (index % 3) * 8} ${86 + index * 16} h ${width}`}
                                className={
                                    index === 2 || index === 3
                                        ? "orbit-stack__code-added"
                                        : "orbit-stack__code"
                                }
                            />
                        </g>
                    ))}
                </g>
                <g data-workspace-agent>
                    <text x="310" y="88" className="orbit-stack__small">
                        AGENT
                    </text>
                    <rect
                        x="307"
                        y="99"
                        width="122"
                        height="31"
                        rx="4"
                        className="orbit-stack__tile"
                    />
                    <text x="315" y="118" className="orbit-stack__muted">
                        Build the storefront.
                    </text>
                    <text x="310" y="148" className="orbit-stack__muted">
                        ✓ Read project files
                    </text>
                    <text x="310" y="166" className="orbit-stack__muted">
                        ✓ Update components
                    </text>
                    <circle cx="313" cy="182" r="2" className="orbit-stack__status" />
                    <text x="321" y="186" className="orbit-stack__muted">
                        Running checks…
                    </text>
                    <text x="310" y="215" className="orbit-stack__small">
                        CHANGES / 03 FILES
                    </text>
                    <text x="310" y="233" className="orbit-stack__muted">
                        +24 additions · −6 removals
                    </text>
                    <text x="310" y="250" className="orbit-stack__muted">
                        Preview ready ↗
                    </text>
                </g>
                <g data-workspace-terminal>
                    <text x="135" y="283" className="orbit-stack__small">
                        TERMINAL
                    </text>
                    <text x="195" y="283" className="orbit-stack__muted">
                        › dev server ready
                    </text>
                    <text x="135" y="302" className="orbit-stack__muted">
                        › project.test · watching for changes
                    </text>
                    <text x="22" y="325" className="orbit-stack__small">
                        feature / shop
                    </text>
                    <text x="420" y="325" textAnchor="end" className="orbit-stack__small">
                        Preview · project.test ↗
                    </text>
                </g>
            </Plate>
            <g
                transform={`translate(${laptop.x} ${laptop.y}) scale(${laptop.scale})`}
                data-stack-device="laptop"
            >
                <ControlLaptop />
            </g>
            <g
                transform={`translate(${phone.x} ${phone.y}) scale(${phone.scale})`}
                data-stack-device="phone"
            >
                <OnlineDevice kind="phone" origin={[0, 0]} />
            </g>
            <g
                transform={`translate(${tablet.x} ${tablet.y}) scale(${tablet.scale})`}
                data-stack-device="tablet"
            >
                <OnlineDevice kind="tablet" origin={[0, 0]} />
            </g>
        </svg>
    );
}
