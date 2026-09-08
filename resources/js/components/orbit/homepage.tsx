import { useState } from "react";
import { ButtonLink, Card, Icon, Logo, Section, Snippet, Starfield, Terminal } from "./primitives";
import { OrbitDiagram, type OrbitNode } from "./topology";

const githubUrl = "https://github.com/nckrtl/orbit";
const docsUrl = `${githubUrl}/tree/main/docs`;

type Stage = {
    key: "operator" | "gateway" | "development" | "publish";
    step: string;
    label: string;
    headline: string;
    lead: string;
    center: { label: string; sub: string; state?: "pending" };
    caption: string;
    nodes: OrbitNode[];
};

const stages: Stage[] = [
    {
        key: "operator",
        step: "01",
        label: "Operator",
        headline: "The only tool you need to run your apps on your own infra.",
        lead: "Install Orbit on your own machine and hand your agent the skill. That is the whole setup: one CLI, no dashboards, no accounts to wire together, and no infrastructure but yours.",
        center: { label: "Gateway", sub: "not provisioned yet", state: "pending" },
        caption: "installed locally · nothing provisioned yet",
        nodes: [],
    },
    {
        key: "gateway",
        step: "02",
        label: "Gateway",
        headline: "One gateway holds every machine and app record you own.",
        lead: "Your agent provisions the Gateway over SSH. It stores every machine and application record and authorizes each action, so there is exactly one place to look at your setup.",
        center: { label: "Gateway", sub: "control plane" },
        caption: "one gateway, provisioned over ssh",
        nodes: [],
    },
    {
        key: "development",
        step: "03",
        label: "Development",
        headline: "Add a development node and every app gets its own URL.",
        lead: "The Gateway provisions the node, clones your source, and gives each instance a hostname on your development TLD — private to the network, open to every device on it.",
        center: { label: "Gateway", sub: "control plane" },
        caption: "app instances orbit their development node",
        nodes: [
            {
                label: "dev-mbp",
                role: "app-dev",
                angle: -15,
                satellites: [
                    { label: "app-1", role: "app-1", angle: 10 },
                    { label: "app-2", role: "app-2", angle: 190 },
                ],
            },
        ],
    },
    {
        key: "publish",
        step: "04",
        label: "Publish",
        headline: "Apps stay private until you place one on a production node.",
        lead: "Everything is reachable inside the network by default. To publish, place the app on a production node — where app, router, and ingress roles share a machine or split into a cluster.",
        center: { label: "Gateway", sub: "control plane" },
        caption: "a cluster is a mini orbit: app-prod + router + ingress",
        nodes: [
            {
                label: "dev-mbp",
                role: "app-dev",
                angle: -15,
                satellites: [
                    { label: "app-1", role: "app-1", angle: 10 },
                    { label: "app-2", role: "app-2", angle: 190 },
                ],
            },
            {
                label: "prod-eu-1",
                role: "app-prod",
                angle: 175,
                cluster: "cluster: production",
                satellites: [
                    { label: "router-01", role: "router", angle: 30 },
                    { label: "ingress-01", role: "ingress", angle: 210 },
                ],
            },
        ],
    },
];

const details = {
    operator: {
        caps: [
            "drives orbit from one cli",
            "same commands as a human",
            "structured --json output",
            "no machine access of its own",
        ],
        title: "you + your agent",
        kind: "operator",
        rows: [
            ["Runs", "locally, on your machine"],
            ["Talks to", "Gateway over HTTP"],
            ["Install", "composer global require nckrtl/orbit"],
        ],
        note: "The only thing you install yourself. Your agent uses the same commands you do, and every response carries a request ID.",
    },
    gateway: {
        caps: [
            "single source of truth",
            "authorizes every action",
            "applies changes over ssh",
            "records activity + request ids",
        ],
        title: "Gateway",
        kind: "control plane",
        rows: [
            ["Stores", "machines, apps, routes, processes"],
            ["Authorizes", "every action before it reaches a node"],
            ["Applies changes", "over SSH"],
            ["Data store", "SQLite"],
        ],
        note: "One active Gateway per setup, so there is one place to see everything Orbit manages.",
    },
    "node:dev-mbp": {
        caps: [
            "hosts app instances",
            "private hostname per instance",
            "runs attached processes",
            "collects metrics for the fleet",
        ],
        title: "dev-mbp",
        kind: "node · app-dev",
        rows: [
            ["Roles", "app-dev, metrics"],
            ["WireGuard", "10.88.0.4"],
            ["TLD", "orbit.test"],
            ["Platform", "Ubuntu 26.04 (arm64)"],
        ],
        note: "Runs development app instances. Each one gets a hostname on the development TLD, reachable from any device on the network.",
    },
    "sat:dev-mbp/app-1": {
        caps: [
            "own git clone",
            "php runtime from composer",
            "one active route",
            "queue + dev server processes",
        ],
        title: "app-1",
        kind: "appinstance",
        rows: [
            ["Node", "dev-mbp"],
            ["Branch", "main"],
            ["URL", "https://app-1.orbit.test"],
            ["Processes", "queue, vite"],
        ],
        note: "One placement of an app on one node. Orbit clones the source, selects the PHP runtime, and provisions its single route.",
    },
    "sat:dev-mbp/app-2": {
        caps: [
            "adopted from a worktree",
            "stops when idle",
            "starts on first request",
            "scheduled tasks as systemd timers",
        ],
        title: "app-2",
        kind: "appinstance",
        rows: [
            ["Node", "dev-mbp"],
            ["Branch", "nck-123-checkout"],
            ["URL", "https://app-2.orbit.test"],
            ["Processes", "queue"],
        ],
        note: "Register a worktree and it becomes an instance. Idle instances stop their processes and start them again on the next request.",
    },
    "node:prod-eu-1": {
        caps: [
            "hosts production instances",
            "publishes over ingress",
            "round-robin route pool",
            "cluster member",
        ],
        title: "prod-eu-1",
        kind: "node · app-prod",
        rows: [
            ["Roles", "app-prod, router, ingress"],
            ["Cluster", "production"],
            ["Public", "yes, through ingress"],
            ["Pool", "round-robin"],
        ],
        note: "Placing an app here publishes it. The router and ingress roles can share this machine or move to their own nodes.",
    },
    "sat:prod-eu-1/router-01": {
        caps: [
            "one per cluster with routes",
            "selects workload targets",
            "follows generated routes",
        ],
        title: "router-01",
        kind: "role · router",
        rows: [
            ["Scope", "cluster: production"],
            ["Receives", "routes with cluster scope"],
            ["Selects", "workload targets"],
        ],
        note: "Every cluster with a route needs one active router. It decides which node serves a clustered hostname.",
    },
    "sat:prod-eu-1/ingress-01": {
        caps: ["public http + https", "tls certificates", "forwards to the router"],
        title: "ingress-01",
        kind: "role · ingress",
        rows: [
            ["Receives", "public HTTP and HTTPS"],
            ["Forwards to", "router"],
            ["Certificates", "managed by Orbit"],
        ],
        note: "The only role that accepts traffic from outside the private network.",
    },
} as const;

type DetailKey = keyof typeof details;

function stageKeys(stage: Stage): DetailKey[] {
    const keys: DetailKey[] = ["operator", "gateway"];

    for (const node of stage.nodes) {
        keys.push(`node:${node.label}` as DetailKey);
        for (const satellite of node.satellites) {
            keys.push(`sat:${node.label}/${satellite.label}` as DetailKey);
        }
    }

    return keys;
}

function Header() {
    return (
        <header className="sticky top-0 z-20 border-b border-orbit-hairline bg-orbit-header backdrop-blur-[14px] backdrop-saturate-90">
            <div className="relative mx-auto flex h-16 max-w-orbit-container items-center gap-8 px-orbit-gutter">
                <a href="#top" aria-label="Orbit home" className="border-0">
                    <Logo />
                </a>
                <nav
                    aria-label="Primary navigation"
                    className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 font-mono text-xs tracking-[0.16em] text-orbit-muted uppercase md:flex"
                >
                    <a href="#product">Product</a>
                    <a href="#features">Features</a>
                    <a href="#agents">Agents</a>
                    <a href="#install">Install</a>
                </nav>
                <div className="ml-auto flex items-center gap-2 sm:gap-3">
                    <ButtonLink
                        href={githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        variant="ghost"
                        size="sm"
                        className="hidden sm:inline-flex"
                    >
                        <Icon name="git-branch" className="size-3.5" />
                        GitHub
                    </ButtonLink>
                    <ButtonLink href="#install" size="sm">
                        Get started
                    </ButtonLink>
                </div>
            </div>
        </header>
    );
}

function DetailReadout({ selected }: { selected: DetailKey }) {
    const detail = details[selected];

    return (
        <div
            className="flex min-h-[150px] flex-col gap-3 rounded-[10px] border border-orbit-line bg-black p-5"
            aria-live="polite"
        >
            <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-[13.5px] text-orbit-primary">{detail.title}</span>
                <span className="font-mono text-[9.5px] tracking-[0.16em] text-orbit-muted uppercase">
                    {detail.kind}
                </span>
            </div>
            <dl className="grid grid-cols-[minmax(96px,auto)_1fr] gap-x-5 gap-y-1.5 font-mono text-xs">
                {detail.rows.map(([key, value]) => (
                    <div key={key} className="contents">
                        <dt className="text-orbit-muted">{key}</dt>
                        <dd className="m-0 overflow-wrap-anywhere text-orbit-secondary">{value}</dd>
                    </div>
                ))}
            </dl>
            <p className="text-[12.5px] leading-normal text-orbit-muted">{detail.note}</p>
            <div className="orbit-marquee mt-auto overflow-hidden border-t border-orbit-hairline pt-3.5">
                <div className="orbit-marquee__track flex w-max gap-2.5">
                    {[...detail.caps, ...detail.caps].map((capability, index) => (
                        <span
                            key={`${capability}-${index}`}
                            className="flex items-center gap-1.5 whitespace-nowrap font-mono text-[10.5px] tracking-[0.1em] text-orbit-secondary uppercase"
                        >
                            <Icon name="check" className="size-[11px]" />
                            {capability}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

function Hero() {
    const [stageKey, setStageKey] = useState<Stage["key"]>("operator");
    const [selected, setSelected] = useState<DetailKey>("operator");
    const stage = stages.find((item) => item.key === stageKey) ?? stages[0];

    const selectStage = (nextStage: Stage) => {
        setStageKey(nextStage.key);
        setSelected((current) => (stageKeys(nextStage).includes(current) ? current : "gateway"));
    };

    return (
        <Starfield horizon>
            <div className="mx-auto grid max-w-orbit-container items-center gap-16 border-b border-orbit-hairline px-orbit-gutter pt-[clamp(56px,7vw,104px)] pb-[clamp(72px,9vw,140px)] lg:grid-cols-2">
                <div className="min-w-0">
                    <div
                        role="tablist"
                        aria-label="Orbit setup stages"
                        className="noscrollbar -mx-5 mb-7 flex overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0"
                    >
                        {stages.map((item, index) => (
                            <button
                                key={item.key}
                                id={`stage-tab-${item.key}`}
                                type="button"
                                role="tab"
                                tabIndex={item.key === stage.key ? 0 : -1}
                                aria-selected={item.key === stage.key}
                                aria-controls="stage-panel"
                                onClick={() => selectStage(item)}
                                onKeyDown={(event) => {
                                    const offsets: Record<string, number> = {
                                        ArrowLeft: -1,
                                        ArrowRight: 1,
                                    };
                                    const targetIndex =
                                        event.key === "Home"
                                            ? 0
                                            : event.key === "End"
                                              ? stages.length - 1
                                              : offsets[event.key] === undefined
                                                ? null
                                                : (index + offsets[event.key] + stages.length) %
                                                  stages.length;

                                    if (targetIndex === null) {
                                        return;
                                    }

                                    event.preventDefault();
                                    const target = stages[targetIndex];
                                    selectStage(target);
                                    document.getElementById(`stage-tab-${target.key}`)?.focus();
                                }}
                                className="orbit-stage-tab"
                            >
                                <span>{item.step}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <div
                        key={stage.key}
                        id="stage-panel"
                        role="tabpanel"
                        aria-labelledby={`stage-tab-${stage.key}`}
                        className="orbit-stage-copy"
                    >
                        <h1 className="min-h-[1.96em] text-orbit-hero">{stage.headline}</h1>
                        <p className="mt-6 min-h-[4.74em] max-w-[52ch] text-lg leading-[1.58] tracking-[-0.018em] text-orbit-secondary">
                            {stage.lead}
                        </p>
                    </div>
                    <div className="mt-8 flex flex-wrap gap-4">
                        <ButtonLink href={docsUrl} target="_blank" rel="noreferrer">
                            Read the docs
                            <Icon name="arrow-right" className="size-4" />
                        </ButtonLink>
                        <ButtonLink href="#install" variant="outline">
                            <Icon name="terminal" className="size-4" />
                            Quickstart
                        </ButtonLink>
                    </div>
                    <Snippet
                        command="composer global require nckrtl/orbit"
                        className="mt-6 max-w-[420px]"
                    />
                </div>
                <div className="flex min-w-0 flex-col gap-9">
                    <div key={stage.key} className="orbit-stage-diagram">
                        <OrbitDiagram
                            center={stage.center}
                            nodes={stage.nodes}
                            caption={stage.caption}
                            selected={selected}
                            onSelect={(key) =>
                                setSelected(key in details ? (key as DetailKey) : "gateway")
                            }
                        />
                    </div>
                    <DetailReadout selected={selected} />
                </div>
            </div>
        </Starfield>
    );
}

const lifecycle = [
    {
        number: "01",
        icon: "terminal",
        title: "Operator",
        description:
            "Install Orbit on your own machine and give your agent the skill. Nothing else to sign up for.",
        command: "composer global require nckrtl/orbit",
    },
    {
        number: "02",
        icon: "network",
        title: "Gateway",
        description:
            "Your agent provisions the control plane. It stores every machine and application record and authorizes each action.",
        command: "orbit gateway:add",
    },
    {
        number: "03",
        icon: "boxes",
        title: "Development node",
        description:
            "Add a machine for development work. Place an app on it and Orbit clones the source, picks the runtime, and provisions the route.",
        command: "orbit instance:new",
    },
    {
        number: "04",
        icon: "rocket",
        title: "Publish",
        description:
            "Projects stay inside the network until you place one on a production node — alone, or clustered with the router and ingress roles.",
        command: "orbit node:provision --role app-prod",
    },
];

function Product() {
    return (
        <Section
            id="product"
            label="One path"
            title="From your laptop to a published app."
            lead="Every stage uses the same records and the same CLI. Nothing to reconcile between four dashboards."
        >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {lifecycle.map((item) => (
                    <Card key={item.number} grid className="flex min-h-[280px] flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <Icon name={item.icon} />
                            <span className="font-mono text-[10.5px] tracking-[0.16em] text-orbit-muted">
                                {item.number}
                            </span>
                        </div>
                        <h3 className="text-[21px] tracking-[-0.018em]">{item.title}</h3>
                        <p className="flex-1 text-[13.5px] leading-[1.58] text-orbit-secondary">
                            {item.description}
                        </p>
                        <code className="text-xs break-words text-orbit-muted">{item.command}</code>
                    </Card>
                ))}
            </div>
        </Section>
    );
}

const features = [
    {
        icon: "network",
        title: "A private network between your machines",
        description:
            "Nodes reach the Gateway and each other over WireGuard. Traffic between your machines never leaves the network, so a project stays private while still being reachable from everywhere you work.",
        command: "orbit node:access:add · orbit dns:resolve-tld",
        wide: true,
    },
    {
        icon: "server",
        title: "Node provisioning",
        description:
            "Add a machine, give it roles, and Orbit installs and configures what those roles need. Remove a role and it cleans up after itself.",
        command: "orbit node:provision",
    },
    {
        icon: "hard-drive",
        title: "Tools and runtimes",
        description:
            "Install and update the services a project needs, and let Orbit pick the PHP runtime from the source it clones.",
        command: "orbit tool:install",
    },
    {
        icon: "globe",
        title: "Reachable on any device, published only when you say so",
        description:
            "Every instance gets a hostname on your development TLD, so the phone on your desk opens the same URL your laptop does. Routes belong to the app and follow their target node; nothing reaches the public internet until you place the app on a production node.",
        command: "orbit route:new · orbit route:target:set",
        wide: true,
    },
    {
        icon: "activity",
        title: "Processes and schedules that look after themselves",
        description:
            "Attach queues, dev servers, and scheduled tasks to an instance. Orbit keeps them running, stops them when a project goes idle, and starts them again on the next request.",
        command: "orbit process:add · orbit process:logs",
        wide: true,
    },
    {
        icon: "stethoscope",
        title: "Doctor and activity",
        description:
            "Compare what the Gateway expects with what is on a machine. Doctor reports every difference and changes nothing.",
        command: "orbit doctor --family route",
    },
];

function Features() {
    return (
        <Section
            id="features"
            label="The toolkit"
            title="Everything the stack needs, in one set of records."
            compact
        >
            <div className="grid gap-4 md:grid-cols-3">
                {features.map((feature) => (
                    <Card
                        key={feature.title}
                        className={`flex min-h-[250px] min-w-0 flex-col gap-4 ${feature.wide ? "md:col-span-2" : ""}`}
                    >
                        <Icon name={feature.icon} />
                        <h3 className="max-w-[32ch] text-[21px] tracking-[-0.018em]">
                            {feature.title}
                        </h3>
                        <p className="max-w-[56ch] flex-1 text-[13.5px] leading-[1.58] text-orbit-secondary">
                            {feature.description}
                        </p>
                        <code className="text-xs break-words text-orbit-muted">
                            {feature.command}
                        </code>
                    </Card>
                ))}
            </div>
        </Section>
    );
}

const agentOutput = [
    { kind: "command" as const, text: "orbit node:list --json" },
    { text: "{" },
    { text: '  "nodes": [' },
    { text: '    { "id": 2, "name": "dev-mbp",' },
    { text: '      "status": "ready",' },
    { text: '      "roles": ["app-dev"],' },
    { text: '      "tld": "orbit.test",' },
    { text: '      "wireguard_ip": "10.88.0.4" }' },
    { text: "  ]," },
    { text: '  "request_id": "01J9K2QFV3H8"' },
    { text: "}" },
];

function Agents() {
    return (
        <Section id="agents" compact>
            <div className="grid items-center gap-10 md:grid-cols-2">
                <div>
                    <div className="orbit-label mb-4">Built for agents</div>
                    <h2 className="text-orbit-section">
                        You don't manage Orbit. Your agent drives it for you.
                    </h2>
                    <p className="mt-5 max-w-[50ch] text-[15px] leading-[1.58] text-orbit-secondary">
                        Every operation is encoded in Orbit, so the agent only needs the commands.{" "}
                        <code>--json</code> gives it a stable contract, and the Gateway authorizes
                        each action before it touches a machine.
                    </p>
                </div>
                <Terminal title="orbit node:list --json" lines={agentOutput} />
            </div>
        </Section>
    );
}

function Install() {
    return (
        <Starfield scanlines>
            <div
                id="install"
                className="mx-auto max-w-orbit-narrow px-orbit-gutter py-orbit-section text-center"
            >
                <h2 className="text-orbit-section">Install it, point it at a machine.</h2>
                <p className="mx-auto mt-5 max-w-[46ch] text-lg leading-[1.58] text-orbit-secondary">
                    PHP 8.5 and one command. The Gateway takes it from there.
                </p>
                <Snippet
                    command="composer global require nckrtl/orbit"
                    className="mx-auto mt-8 max-w-[420px] text-left"
                />
                <ButtonLink href={githubUrl} target="_blank" rel="noreferrer" className="mt-6">
                    View on GitHub
                    <Icon name="arrow-right" className="size-[15px]" />
                </ButtonLink>
            </div>
        </Starfield>
    );
}

function Footer() {
    return (
        <footer className="border-t border-orbit-hairline px-orbit-gutter py-10">
            <div className="mx-auto flex max-w-orbit-container flex-wrap gap-6 font-mono text-[10.5px] tracking-[0.16em] text-orbit-muted uppercase">
                <span>Orbit</span>
                <span>v0.4.0</span>
                <a
                    href={githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="border-0 md:ml-auto"
                >
                    GitHub
                </a>
                <span className="ml-auto md:ml-0">Self-hosted</span>
            </div>
        </footer>
    );
}

export function OrbitHomepage() {
    return (
        <div id="top" className="min-h-screen bg-orbit-void text-orbit-primary antialiased">
            <Header />
            <main>
                <Hero />
                <Product />
                <Features />
                <Agents />
                <Install />
            </main>
            <Footer />
        </div>
    );
}
