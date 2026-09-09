import { observeSceneActivity } from "./animation";
import { useEffect, useId, useRef, useState } from "react";
import { hardwarePoint } from "./laptop";
import { TabBacking } from "./tab-backing";

const axis = hardwarePoint(1, 0);
const actions = [
    { action: "node joined", causer: "You", failed: false },
    { action: "app started", causer: "Codex", failed: false },
    { action: "route failed", causer: "Hermes", failed: true },
    { action: "config saved", causer: "You", failed: false },
    { action: "route retried", causer: "Codex", failed: false },
];

export function ActionLogDrawing() {
    const ref = useRef<SVGSVGElement>(null);
    const clipId = useId();
    const [sequence, setSequence] = useState(0);
    const face = `matrix(${axis.join(" ")} 0 ${Math.cos(Math.PI / 6)} 20 10)`;

    useEffect(() => {
        const svg = ref.current;
        if (!svg) return;
        let timer: ReturnType<typeof setInterval> | undefined;
        const stop = observeSceneActivity(svg, ({ active }) => {
            clearInterval(timer);
            if (active) timer = setInterval(() => setSequence((value) => value + 1), 3000);
        });
        return () => {
            clearInterval(timer);
            stop();
        };
    }, []);

    return (
        <svg
            ref={ref}
            viewBox="0 0 380 350"
            className="orbit-capability__drawing orbit-capability__drawing--log"
            aria-hidden="true"
        >
            <defs>
                <clipPath id={clipId}>
                    <rect width="328" height="210" />
                </clipPath>
            </defs>
            <g data-action-log transform={face}>
                <TabBacking width={360} height={280} radius={4} />
                <rect width="360" height="280" rx="4" className="orbit-capability__log-sheet" />
                <g data-log-header>
                    <text x="16" y="23" className="orbit-capability__log-heading">
                        ACTION LOG
                    </text>
                    <path d="M 16 33 H 344" className="orbit-capability__log-rule" />
                    <g className="orbit-capability__log-columns">
                        <text x="16" y="50">
                            TIME
                        </text>
                        <text x="100" y="50">
                            ACTION
                        </text>
                        <text x="246" y="50">
                            CAUSER
                        </text>
                    </g>
                    <path d="M 16 59 H 344" className="orbit-capability__log-rule" />
                </g>
                <g transform="translate(16 60)">
                    <g data-log-viewport clipPath={`url(#${clipId})`}>
                        <g
                            key={sequence}
                            data-log-sequence={sequence}
                            className={sequence > 0 ? "orbit-capability__log-feed" : undefined}
                        >
                            {[0, 1, 2, 3, 4, 5, 6, 7].map((age) => {
                                const index = sequence + 6 - age;
                                const { action, causer, failed } =
                                    actions[(index + actions.length) % actions.length];
                                const seconds = 14 * 3600 + 32 * 60 + 1 + index * 3;
                                const time = [
                                    Math.floor(seconds / 3600) % 24,
                                    Math.floor(seconds / 60) % 60,
                                    seconds % 60,
                                ]
                                    .map((part) => String(part).padStart(2, "0"))
                                    .join(":");
                                return (
                                    <g
                                        key={index}
                                        data-log-entry={failed ? "failed" : "completed"}
                                        transform={`translate(0 ${age * 30})`}
                                    >
                                        <text y="19" className="orbit-capability__log-time">
                                            {time}
                                        </text>
                                        <text x="84" y="19">
                                            {action}
                                        </text>
                                        <text x="230" y="19" data-log-causer>
                                            {causer}
                                        </text>
                                        <g transform="translate(318 15)">
                                            <circle r="7" className="orbit-capability__log-rule" />
                                            <path
                                                d={
                                                    failed
                                                        ? "M -2.5 -2.5 L 2.5 2.5 M -2.5 2.5 L 2.5 -2.5"
                                                        : "M -3 0 L -1 2 L 3 -2"
                                                }
                                            />
                                        </g>
                                        <path
                                            d="M 0 29 H 328"
                                            className="orbit-capability__log-rule"
                                        />
                                    </g>
                                );
                            })}
                        </g>
                    </g>
                </g>
            </g>
        </svg>
    );
}
