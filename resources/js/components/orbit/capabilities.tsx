import { DoctorDrawing } from "./doctor-drawing";
import { AgentNetwork } from "./agent-network";
import { PrivateNetwork } from "./private-network";
import { NamespaceDrawing } from "./namespace-drawing";
import { InventoryDrawing } from "./inventory-drawing";
import { ActionLogDrawing } from "./action-log-drawing";
import { useCapabilitiesScroll } from "./capabilities-scroll";

const capabilities = [
    {
        id: "wireguard",
        title: "A private network, wherever you are.",
        body: "Each node joins with its own WireGuard identity. Reach your machines over a private network, without making your development environment public.",
    },
    {
        id: "names",
        title: "Your projects. Your names.",
        body: "Give your cluster a custom TLD. Open apps by name.",
    },
    {
        id: "store",
        title: "One place to know what exists.",
        body: "Machines, apps, routes, tools and processes live in one central store on your Gateway. You and your agent work from the same record.",
    },
    {
        id: "doctor",
        title: "Follow the problem, not a trail of guesses.",
        body: "Keep your fleet healthy with Orbit Doctor. You and your agent can spot configuration drift and check system vitals, from CPU to memory, before deciding what needs attention.",
    },
    {
        id: "agents",
        title: "Your fleet, under your command.",
        body: "Agents create and manage nodes, apps and rules with deterministic tools that use fewer tokens. You keep full CLI control.",
    },
    {
        id: "activity",
        title: "Every action leaves a trail.",
        body: "Every action is logged. See what happened when things go wrong.",
    },
] as const;

function FeatureDrawing({ kind }: { kind: (typeof capabilities)[number]["id"] }) {
    if (kind === "agents") {
        return <AgentNetwork />;
    }
    if (kind === "store") {
        return <InventoryDrawing />;
    }
    if (kind === "names") {
        return <NamespaceDrawing />;
    }
    if (kind === "wireguard") {
        return <PrivateNetwork />;
    }
    if (kind === "activity") {
        return <ActionLogDrawing />;
    }
    return <DoctorDrawing />;
}

export function Capabilities() {
    const ref = useCapabilitiesScroll();
    return (
        <section
            data-capabilities
            className="orbit-capabilities"
            aria-labelledby="capabilities-title"
        >
            <div ref={ref} className="orbit-capabilities__inner">
                <div className="orbit-label mb-5">The pieces, connected</div>
                <h2 id="capabilities-title">Small details. A network that feels like yours.</h2>
                <div className="orbit-capabilities__grid">
                    {capabilities.map((feature) => (
                        <article
                            data-capability={feature.id}
                            key={feature.id}
                            className="orbit-capability"
                        >
                            <span className="orbit-capability__corners" aria-hidden="true">
                                <span data-corner="top-left" />
                                <span data-corner="top-right" />
                                <span data-corner="bottom-left" />
                                <span data-corner="bottom-right" />
                            </span>
                            <FeatureDrawing kind={feature.id} />
                            <h3>{feature.title}</h3>
                            <p>{feature.body}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
