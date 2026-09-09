import { Activity, GitBranch, Network, RefreshCw, ServerCog, TabletSmartphone } from "lucide-react";
import { useEffect, useRef } from "react";
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
        title: "Take the preview with you.",
        body: "Your laptop directs the work. Your node keeps it running. Open the same project on your tablet or phone over your Orbit network.",
    },
    {
        icon: RefreshCw,
        title: "Keep your tools in step.",
        body: "See installed tool versions across your nodes and manage supported updates, with version constraints that keep every change deliberate.",
    },
    {
        icon: Activity,
        title: "Keep the work running.",
        body: "Manage dev servers, queues, and background processes with your projects. Check status and logs, even after you close your laptop.",
    },
    {
        icon: Network,
        title: "Give your ideas room to grow.",
        body: "Add another node when your work needs it. Connect project machines and shared services on one private network with names your agents can use.",
    },
];

export function DevelopmentEnvironments() {
    const ref = useRef<HTMLElement>(null);
    useEffect(() => {
        const section = ref.current;
        if (!section) return;
        let visible = false;
        const update = () => {
            section.dataset.active = String(visible && !document.hidden);
        };
        const observer = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            update();
        });
        observer.observe(section);
        document.addEventListener("visibilitychange", update);
        return () => {
            observer.disconnect();
            document.removeEventListener("visibilitychange", update);
        };
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
                    Your favorite place to build.
                    <br />A better place to run it.
                </h2>
                <p>
                    Your agent development environment assumes the machine is ready. Orbit makes it
                    ready—with the dependencies, workspaces, and services your agents need to get to
                    work.
                </p>
            </header>
            <div className="orbit-environments__marquee-row">
                <div
                    className="orbit-environments__marquee"
                    aria-label={`Bring your favorite environment: ${environments.map((environment) => environment.name).join(", ")}`}
                >
                    <div className="orbit-environments__track">
                        {[0, 1, 2, 3].map((copy) => (
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
                                        />
                                        <span>{environment.name}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <figure className="orbit-environments__figure">
                <DevelopmentStack />
            </figure>
            <CoreFunnel inverted />
            <div className="orbit-environments__benefits">
                {benefits.map(({ title, body, icon: Icon }) => (
                    <article key={title}>
                        <span className="orbit-capability__corners" aria-hidden="true">
                            <span data-corner="top-left" />
                            <span data-corner="top-right" />
                            <span data-corner="bottom-left" />
                            <span data-corner="bottom-right" />
                        </span>
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
