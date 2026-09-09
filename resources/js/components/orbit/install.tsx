import { CardCorners } from "./card-corners";
import { useId } from "react";
import { ChevronDown } from "lucide-react";
import { CopyButton } from "./primitives";
import { useInstallSignal } from "./use-install-signal";
import { useScrollReveal } from "./use-scroll-reveal";
import { installSequence } from "./finale-reveal";

export function Install({ orbitUrl }: { orbitUrl: string }) {
    const ref = useInstallSignal();
    useScrollReveal(ref, installSequence, "install");
    const prompt = `Go to ${orbitUrl}.\n\nGuide me through getting started with Orbit.`;
    const waveId = useId();

    return (
        <div ref={ref} className="orbit-launch" data-install-finale>
            <div className="orbit-launch__handoff" aria-hidden="true">
                <div className="orbit-launch__thread">
                    <span className="orbit-launch__signal" />
                </div>
                <div className="orbit-launch__dome">
                    <div className="orbit-launch__horizon" />
                    <svg className="orbit-launch__wave">
                        <defs>
                            {["left", "right"].map((side) => (
                                <linearGradient
                                    key={side}
                                    id={`${waveId}-${side}`}
                                    data-dome-gradient={side}
                                    gradientUnits="userSpaceOnUse"
                                >
                                    <stop
                                        offset="0"
                                        stopColor="var(--text-primary)"
                                        stopOpacity="0"
                                    />
                                    <stop offset="1" stopColor="var(--text-primary)" />
                                </linearGradient>
                            ))}
                        </defs>
                        <path data-dome-wave="left" stroke={`url(#${waveId}-left)`} />
                        <path data-dome-wave="right" stroke={`url(#${waveId}-right)`} />
                    </svg>
                </div>
                <div className="orbit-launch__arrival">
                    <ChevronDown size={16} strokeWidth={1} />
                </div>
            </div>

            <section id="install" className="orbit-story-install" aria-labelledby="install-title">
                <div className="orbit-label">Get started</div>
                <h2 id="install-title">Let your agent set it up.</h2>
                <p className="orbit-launch__intro">
                    No install script. Orbit is meant to be run by your agent, so setup starts the
                    same way. Open a session in the agent you already use and hand it this prompt.
                    The CLI is yours whenever you want it.
                </p>

                <pre className="orbit-launch__prompt" data-orbit-prompt>
                    <CardCorners />
                    <code className="language-markdown">{prompt}</code>
                </pre>
                <div className="orbit-launch__actions">
                    <CopyButton
                        command={prompt}
                        label="Copy prompt"
                        ariaLabel="Copy Orbit getting-started prompt"
                        variant="solid"
                    />
                </div>
            </section>
            <div
                className="orbit-story-ruler orbit-story-ruler--bottom"
                data-install-ruler
                aria-hidden="true"
            >
                <div className="orbit-story-ruler__marks" />
            </div>
        </div>
    );
}
