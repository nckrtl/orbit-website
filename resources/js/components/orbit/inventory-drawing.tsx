import { useEffect, useRef, useState } from "react";
import { useMatchedPlanetRadius } from "./use-matched-planet-radius";
import { OrbitPlanet } from "./orbit-planet";
import { hardwarePoint } from "./laptop";
import { TabBacking } from "./tab-backing";

const planet = { x: 68, y: 96, radius: 28 };
const axis = hardwarePoint(1, 0);
const verticalAxis = Math.cos(Math.PI / 6);
const labels = ["nodes", "apps", "routes", "tools", "processes"];

function point(x: number, y: number) {
    const projected = hardwarePoint(x, y);
    return [projected[0] + planet.x, projected[1] + planet.y];
}

export function InventoryDrawing() {
    const ref = useRef<SVGSVGElement>(null);
    const radius = useMatchedPlanetRadius(ref);
    const [tabWidth, setTabWidth] = useState(80);
    useEffect(() => {
        let disposed = false;
        void document.fonts.ready.then(() => {
            if (disposed || !ref.current) return;
            const labels = [
                ...ref.current.querySelectorAll<SVGTextElement>("[data-inventory-tile] text"),
            ];
            setTabWidth(
                Math.ceil(Math.max(...labels.map((label) => label.getComputedTextLength())) + 20),
            );
        });
        return () => {
            disposed = true;
        };
    }, []);
    const axisLength = Math.hypot(...axis);
    const source = [
        planet.x + (axis[0] / axisLength) * (radius - 3),
        planet.y + (axis[1] / axisLength) * (radius - 3),
    ];
    return (
        <svg
            ref={ref}
            viewBox="24 0 334 250"
            className="orbit-capability__drawing orbit-capability__drawing--inventory"
            aria-hidden="true"
        >
            {labels.map((label, index) => {
                const lane = (index - 2) * 80;
                const port = point(140, lane);
                return (
                    <g key={label} data-inventory-item={label}>
                        <path
                            data-inventory-route
                            pathLength="1"
                            d={`M ${source.join(" ")} L ${point(90, 0).join(" ")} L ${point(90, lane).join(" ")} L ${port.join(" ")}`}
                            className="orbit-capability__namespace-route"
                            vectorEffect="non-scaling-stroke"
                        />
                        <g
                            data-inventory-tile
                            transform={`matrix(${axis.join(" ")} 0 ${verticalAxis} ${port.join(" ")})`}
                        >
                            <TabBacking frontY={-14} width={tabWidth} height={28} radius={2} />
                            <rect
                                y="-14"
                                width={tabWidth}
                                height="28"
                                rx="2"
                                className="orbit-capability__store-core"
                                vectorEffect="non-scaling-stroke"
                            />
                            <text x="10" y="4">
                                {label}
                            </text>
                        </g>
                    </g>
                );
            })}
            <g data-capability-planet transform={`translate(${planet.x} ${planet.y})`}>
                <OrbitPlanet radius={radius} animated />
            </g>
            <path
                data-planet-connection
                d={`M ${source.join(" ")} L ${planet.x + (axis[0] / axisLength) * (radius + 1)} ${planet.y + (axis[1] / axisLength) * (radius + 1)}`}
                className="orbit-capability__namespace-route"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}
