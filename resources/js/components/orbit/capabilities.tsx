import { CardCorners } from "./card-corners";
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
        body: "Give your cluster its own TLD. Every app gets a name that resolves on every device.",
    },
    {
        id: "store",
        title: "One place to know what exists.",
        body: "Machines, apps, databases, routes and tools live in one central store on your Gateway. You and your agent work from the same record.",
    },
    {
        id: "doctor",
        title: "See drift before it becomes an outage.",
        body: "Orbit Doctor compares what the Gateway expects with what each node actually runs, and reports every difference, next to CPU and memory. It never changes a machine. You and your agent decide what to fix.",
    },
    {
        id: "agents",
        title: "Your agent runs it. You keep the CLI.",
        body: "Agents create nodes, apps, and rules through deterministic commands that use fewer tokens and leave less to guess. The same CLI stays in your hands.",
    },
    {
        id: "activity",
        title: "Every action leaves a trail.",
        body: "Every change is logged with who made it: you, or which agent. When something breaks, read what happened instead of guessing.",
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
                <div className="orbit-label mb-5">The building blocks</div>
                <h2 id="capabilities-title">The foundation for the nodes and apps you run.</h2>
                <div className="orbit-capabilities__grid">
                    {capabilities.map((feature) => (
                        <article
                            data-capability={feature.id}
                            key={feature.id}
                            className="orbit-capability"
                        >
                            <CardCorners />
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
