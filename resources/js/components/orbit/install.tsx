import { useId } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { ChevronDown, X } from "lucide-react";
import { CopyButton } from "./primitives";
import { useInstallSignal } from "./use-install-signal";

export function Install({ orbitUrl }: { orbitUrl: string }) {
    const ref = useInstallSignal();
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
                <h2 id="install-title">Get started with Orbit.</h2>
                <p className="orbit-launch__intro">
                    Start a new session in your favorite agent and give it the prompt below to get
                    started.
                </p>

                <div className="orbit-launch__actions">
                    <CopyButton
                        command={prompt}
                        label="Copy prompt"
                        ariaLabel="Copy Orbit getting-started prompt"
                        variant="solid"
                    />
                    <Dialog.Root>
                        <Dialog.Trigger className="orbit-button orbit-button--outline orbit-button--lg">
                            View prompt
                        </Dialog.Trigger>
                        <Dialog.Portal className="orbit-prompt-portal">
                            <Dialog.Backdrop className="orbit-prompt-backdrop" />
                            <Dialog.Viewport className="orbit-prompt-viewport">
                                <Dialog.Popup className="orbit-prompt-dialog">
                                    <Dialog.Title className="orbit-prompt-dialog__title">
                                        Getting started prompt
                                    </Dialog.Title>
                                    <Dialog.Description hidden>
                                        Paste this into a new session in your favorite agent.
                                    </Dialog.Description>
                                    <Dialog.Close
                                        className="orbit-prompt-dialog__close"
                                        aria-label="Close prompt"
                                    >
                                        <X size={18} strokeWidth={1.5} />
                                    </Dialog.Close>
                                    <pre className="orbit-prompt-dialog__text" data-orbit-prompt>
                                        <code className="language-markdown">{prompt}</code>
                                    </pre>
                                    <div className="orbit-prompt-dialog__actions">
                                        <CopyButton
                                            command={prompt}
                                            label="Copy prompt"
                                            ariaLabel="Copy displayed prompt"
                                            variant="solid"
                                        />
                                    </div>
                                </Dialog.Popup>
                            </Dialog.Viewport>
                        </Dialog.Portal>
                    </Dialog.Root>
                </div>
            </section>
        </div>
    );
}
