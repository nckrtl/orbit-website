import { observeSceneActivity } from "./animation";
import { useEffect, useRef } from "react";
import { useMatchedPlanetRadius } from "./use-matched-planet-radius";
import { OrbitPlanet } from "./orbit-planet";
import { hardwarePoint } from "./laptop";
import { TabBacking } from "./tab-backing";

const gateway = { x: 70, y: 60, radius: 28 };
const axis = hardwarePoint(1, 0);
const verticalAxis = Math.cos(Math.PI / 6);
const namespaces = [
    { name: "studio", tld: ".orbit", lane: -100 },
    { name: "api", tld: ".internal", lane: 0 },
    { name: "docs", tld: ".test", lane: 100 },
];

function point(x: number, y: number) {
    const projected = hardwarePoint(x, y);
    return [projected[0] + gateway.x, projected[1] + gateway.y];
}

export function NamespaceDrawing() {
    const ref = useRef<SVGSVGElement>(null);
    const radius = useMatchedPlanetRadius(ref);
    useEffect(() => {
        const drawing = ref.current;
        if (!drawing) return;
        const motion = matchMedia("(prefers-reduced-motion: reduce)");
        const routes = [...drawing.querySelectorAll<SVGPathElement>("[data-namespace-route]")];
        const lengths = routes.map((route) => route.getTotalLength());
        const longest = Math.max(...lengths);
        const duration = parseFloat(
            getComputedStyle(drawing).getPropertyValue("--dur-namespace-route"),
        );
        let complete = motion.matches;
        drawing.dataset.namespaceState = complete ? "complete" : "waiting";
        const animations = complete
            ? []
            : routes.map((route, index) => {
                  const animation = route.animate(
                      [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
                      { duration: (duration * lengths[index]) / longest, fill: "both" },
                  );
                  animation.pause();
                  return animation;
              });
        animations.forEach((animation) => {
            animation.onfinish = () => {
                if (animations.every((item) => item.playState === "finished")) {
                    complete = true;
                    animations.forEach((item) => item.cancel());
                    drawing.dataset.namespaceState = "complete";
                }
            };
        });
        // Non-scaling strokes measure dashes in screen pixels. Match the
        // normalized dash to the SVG scale so it reaches the tile at every size.
        const sizeRoutes = () => {
            if (complete) return;
            const matrix = drawing.getScreenCTM();
            if (!matrix) return;
            const scale = Math.hypot(matrix.a, matrix.b);
            animations.forEach((animation) => {
                (animation.effect as KeyframeEffect).setKeyframes([
                    { strokeDasharray: scale, strokeDashoffset: scale },
                    { strokeDasharray: scale, strokeDashoffset: 0 },
                ]);
            });
        };
        sizeRoutes();
        const resize = new ResizeObserver(sizeRoutes);
        resize.observe(drawing);
        const stop = observeSceneActivity(drawing, ({ active, reducedMotion }) => {
            if (reducedMotion) {
                complete = true;
                animations.forEach((animation) => animation.cancel());
                drawing.dataset.namespaceState = "complete";
            }
            if (complete) return;
            drawing.dataset.namespaceState = active ? "drawing" : "waiting";
            animations.forEach((animation) => {
                if (animation.playState === "finished") return;
                if (active) animation.play();
                else animation.pause();
            });
        });
        return () => {
            stop();
            resize.disconnect();
            animations.forEach((animation) => animation.cancel());
            delete drawing.dataset.namespaceState;
        };
    }, [radius]);

    const axisLength = Math.hypot(...axis);
    const source = [
        gateway.x + (axis[0] / axisLength) * radius,
        gateway.y + (axis[1] / axisLength) * radius,
    ];

    return (
        <svg
            ref={ref}
            viewBox="30 16 334 174"
            className="orbit-capability__drawing orbit-capability__drawing--names"
            aria-hidden="true"
        >
            {namespaces.map(({ name, tld, lane }) => {
                const port = point(140, lane);

                return (
                    <g key={name} data-namespace={name}>
                        <path
                            data-namespace-route
                            pathLength="1"
                            d={`M ${source.join(" ")} L ${point(90, 0).join(" ")} L ${point(90, lane).join(" ")} L ${port.join(" ")}`}
                            className="orbit-capability__namespace-route"
                            vectorEffect="non-scaling-stroke"
                        />
                        <g
                            data-namespace-tile
                            transform={`matrix(${axis.join(" ")} 0 ${verticalAxis} ${port.join(" ")})`}
                        >
                            <TabBacking frontY={-14} width={124} height={28} radius={2} />
                            <rect
                                y="-14"
                                width="124"
                                height="28"
                                rx="2"
                                className="orbit-capability__store-core"
                                vectorEffect="non-scaling-stroke"
                            />
                            <text x="10" y="4">
                                {name}
                                <tspan className="orbit-capability__tld">{tld}</tspan>
                            </text>
                        </g>
                    </g>
                );
            })}
            <g data-namespace-gateway transform={`translate(${gateway.x} ${gateway.y})`}>
                <OrbitPlanet radius={radius} animated />
            </g>
        </svg>
    );
}
