import { observeSceneActivity } from "./animation";
import { CardCorners } from "./card-corners";
import { Activity, GitBranch, Network, RefreshCw, ServerCog, TabletSmartphone } from "lucide-react";
import { useEffect, useRef } from "react";
import { useBuildReveal } from "./use-build-reveal";
import { CoreFunnel } from "./core-funnel";
import { DevelopmentStack } from "./development-stack";

const environments = [
    { id: "orca", name: "Orca" },
    { id: "superset", name: "Superset" },
    { id: "codex", name: "Codex" },
    { id: "opencode", name: "OpenCode" },
    { id: "polyscope", name: "Polyscope" },
    { id: "t3", name: "T3", format: "png" },
    { id: "conductor", name: "Conductor", format: "png" },
    { id: "cmux", name: "cmux", format: "png" },
    { id: "emdash", name: "Emdash" },
    { id: "cursor", name: "Cursor" },
];
const benefits = [
    {
        icon: ServerCog,
        title: "Start with a machine that’s ready.",
        body: "Orbit prepares your machine, installs supported tools and dependencies, and manages the services your agents need to get to work.",
    },
    {
        icon: GitBranch,
        title: "Give every idea its own workspace.",
        body: "Create projects and worktrees on your nodes. Orbit keeps their processes and private addresses in order, so you can focus on the work.",
    },
    {
        icon: TabletSmartphone,
        title: "Preview on a real URL.",
        body: "Every project gets a private HTTPS name on your Orbit network. Open it from any device you carry, with no tunnel to set up.",
    },
    {
        icon: RefreshCw,
        title: "Keep your tools in step.",
        body: "See installed tool versions across your nodes and manage supported updates, with version constraints that keep every change deliberate.",
    },
    {
        icon: Activity,
        title: "Let the work outlive the session.",
        body: "Dev servers, queues, and background processes belong to the project, not to a terminal tab. Close the environment and check status and logs later.",
    },
    {
        icon: Network,
        title: "Switch environments without moving.",
        body: "Environments change fast. Your projects, processes, and routes stay in Orbit, so trying the next one means opening it, not moving everything.",
    },
];

export function DevelopmentEnvironments() {
    const ref = useRef<HTMLElement>(null);
    useBuildReveal(ref);
    useEffect(() => {
        const section = ref.current;
        if (!section) return;
        const stops = [
            observeSceneActivity(section, ({ visible }) => {
                section.dataset.active = String(visible);
            }),
        ];
        section.querySelectorAll<HTMLElement>("[data-motion-scene]").forEach((scene) => {
            stops.push(
                observeSceneActivity(scene, ({ active }) => {
                    scene.dataset.motionActive = String(active);
                }),
            );
        });
        return () => stops.forEach((stop) => stop());
    }, []);
    return (
        <section
            ref={ref}
            id="build"
            className="orbit-story-build"
            aria-labelledby="build-title"
            data-active="false"
        >
            <header className="orbit-environments__heading">
                <div className="orbit-label">Your environment. Orbit underneath.</div>
                <h2 id="build-title">
                    <span data-build-title-line="first">Your favorite place to build.</span>
                    <br />
                    <span data-build-title-line="second">A better place to run it.</span>
                </h2>
                <p>
                    Your agent development environment assumes the machine is ready. Orbit makes it
                    ready: dependencies, workspaces, services. Your projects live in Orbit, not in
                    the environment, so switching tools is a choice, not a migration.
                </p>
            </header>
            <div className="orbit-environments__marquee-row">
                <div
                    className="orbit-environments__marquee"
                    data-motion-scene
                    data-motion-active="false"
                    aria-label={`Bring your favorite environment: ${environments.map((environment) => environment.name).join(", ")}`}
                >
                    <div className="orbit-environments__track">
                        {[0, 1].map((copy) => (
                            <div
                                key={copy}
                                className="orbit-environments__brands"
                                aria-hidden={copy > 0 ? true : undefined}
                            >
                                {environments.map((environment) => (
                                    <div
                                        key={environment.id}
                                        className="orbit-environments__brand"
                                        data-environment-brand={
                                            copy === 0 ? environment.id : undefined
                                        }
                                    >
                                        <img
                                            src={`/assets/orbit/environments/${environment.id}.${environment.format ?? "svg"}`}
                                            className={`orbit-environments__icon orbit-environments__icon--${environment.id}`}
                                            width="24"
                                            height="24"
                                            alt=""
                                            loading="lazy"
                                            decoding="async"
                                        />
                                        <span>{environment.name}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <figure
                className="orbit-environments__figure"
                data-motion-scene
                data-motion-active="false"
            >
                <DevelopmentStack />
            </figure>
            <CoreFunnel inverted />
            <div className="orbit-environments__benefits">
                {benefits.map(({ title, body, icon: Icon }) => (
                    <article key={title}>
                        <CardCorners />
                        <div className="orbit-environments__benefit-heading">
                            <Icon size={26} strokeWidth={1.25} aria-hidden="true" />
                        </div>
                        <div className="orbit-environments__benefit-copy">
                            <h3>{title}</h3>
                            <p>{body}</p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
