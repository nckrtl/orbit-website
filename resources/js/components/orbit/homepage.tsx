import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import {
    ButtonLink,
    Icon,
    Logo,
    Snippet,
    Starfield,
    Terminal,
    type TerminalLine,
} from "./primitives";
import { OrbitDiagram, type OrbitNode } from "./topology";

const githubUrl = "https://github.com/nckrtl/orbit";

type Chapter = {
    aside?: string;
    body: string;
    caption: string;
    center?: { label: string; state?: "pending"; sub?: string };
    command?: { lines: TerminalLine[]; title: string };
    id: string;
    kicker: string;
    nodes?: OrbitNode[];
    operator?: string;
    selected?: string;
    step: string;
    title: string;
    type: "diagram" | "laptop" | "topology";
};

type RoleState = {
    database: boolean;
    dedicatedDatabase: boolean;
    production: boolean;
};

const chapters: Chapter[] = [
    {
        id: "problem",
        step: "01",
        kicker: "The problem",
        title: "Local development stops when your laptop does.",
        body: "A local environment on your own machine is hard to beat — until agents start doing the work. Then you want it running while you sleep, and you want to open the project on your tablet, your phone, or a hotel wifi network. localhost does none of that.",
        aside: "Leaving the laptop on all night is not an environment. It is a workaround.",
        caption: "lid closes · work stops",
        type: "laptop",
    },
    {
        id: "premise",
        step: "02",
        kicker: "The premise",
        title: "Move the work off your machine. Keep the control on it.",
        body: "Could I manage every machine from my own laptop, without the workload running on it, and still reach every project from anywhere I happen to be? That question is the whole of Orbit. The answer needed a record of what exists, a private network to reach it, and names that resolve inside that network.",
        center: { label: "Gateway", state: "pending" },
        operator: "you + agent",
        caption: "control here · workload elsewhere",
        nodes: [],
        selected: "operator",
        type: "diagram",
    },
    {
        id: "gateway",
        step: "03",
        kicker: "The Gateway",
        title: "One service holding the store, the network, and the names.",
        body: "The Gateway is three roles in one: the store that records every machine, app, and route; a WireGuard layer that issues an identity to each node; and a DNS server that answers for your development TLD. Together they turn a pile of machines into one network you can address.",
        command: {
            title: "orbit · gateway",
            lines: [
                { kind: "command", text: "orbit gateway:add home" },
                { kind: "info", text: "Gateway [home] is active." },
                { kind: "out", text: "WireGuard: 10.88.0.1" },
                { kind: "out", text: "TLD: orbit.test" },
                { kind: "comment", text: "Request ID: 01J9K2QP3F7Y" },
            ],
        },
        center: { label: "Gateway" },
        operator: "you + agent",
        caption: "the gateway is the network, not just a database",
        nodes: [],
        selected: "gateway",
        type: "diagram",
    },
    {
        id: "nodes",
        step: "04",
        kicker: "Nodes",
        title: "Provisioning you did not have to write.",
        body: "Point Orbit at a machine and it installs what the roles need, joins it to the private network with its own WireGuard identity, and remembers exactly what it put there. Because provisioning is codified, every node comes up the same way — and an agent debugging one has context instead of a blank prompt.",
        command: {
            title: "orbit · node:provision",
            lines: [
                { kind: "command", text: "orbit node:provision dev-01 --role app-dev" },
                { kind: "out", text: "wireguard  identity issued    ok" },
                { kind: "out", text: "php 8.5    installed          ok" },
                { kind: "out", text: "nginx      configured         ok" },
                { kind: "info", text: "Node [dev-01] is ready." },
            ],
        },
        center: { label: "Gateway" },
        operator: "you + agent",
        caption: "one node, provisioned the same way every time",
        nodes: [{ label: "dev-01", role: "app-dev", angle: -15 }],
        selected: "node:dev-01",
        type: "diagram",
    },
    {
        id: "access",
        step: "05",
        kicker: "Access",
        title: "Every project has a URL that works on every device.",
        body: "Place an app on the node and it gets a hostname on your development TLD, a runtime picked from its own source, and its processes kept alive. Any device joined to the network opens the same address — laptop, tablet, phone, or the machine you borrowed at a conference.",
        aside: "Nothing here is public. The network is the boundary.",
        center: { label: "Gateway" },
        operator: "you + agent",
        caption: "app instances orbit their node",
        nodes: [
            {
                label: "dev-01",
                role: "app-dev",
                angle: -15,
                satellites: [
                    { label: "app-1", role: "app-1", angle: 10 },
                    { label: "app-2", role: "app-2", angle: 190 },
                ],
            },
        ],
        selected: "sat:dev-01/app-1",
        type: "diagram",
    },
    {
        id: "topology",
        step: "06",
        kicker: "Your topology",
        title: "Roles are the building blocks. Assemble what you need.",
        body: "A database beside your apps, or on a machine of its own. A production node when you want something published. Add and remove roles until the shape fits how you work — the commands do not change as the topology grows.",
        center: { label: "Gateway" },
        operator: "you + agent",
        caption: "add roles and watch the network take shape",
        type: "topology",
    },
];

const heroNodes: OrbitNode[] = [
    {
        label: "h1",
        role: "",
        angle: 8,
        cluster: " ",
        satellites: [
            { label: "h1a", role: "", angle: 20 },
            { label: "h1b", role: "", angle: 200 },
        ],
    },
    { label: "h2", role: "", angle: 96, ring: 2 },
    {
        label: "h3",
        role: "",
        angle: 158,
        cluster: " ",
        satellites: [
            { label: "h3a", role: "", angle: 40 },
            { label: "h3b", role: "", angle: 220 },
        ],
    },
    {
        label: "h4",
        role: "",
        angle: 250,
        ring: 2,
        satellites: [{ label: "h4a", role: "", angle: 0 }],
    },
];

const agentLines: TerminalLine[] = [
    { kind: "agent", text: "# agent: the queue on app-1 looks stuck" },
    { kind: "command", text: "orbit process:list --instance 12" },
    { kind: "out", text: "| 31 | queue | php artisan queue:work | running | always |" },
    { kind: "command", text: "orbit process:logs 31 --lines 20" },
    { kind: "out", text: "[2026-09-07 11:02:14] redis connection refused" },
    { kind: "command", text: "orbit doctor --node 2 --family tool" },
    { kind: "warn", text: "| dev-01 | tool | drift | 4 | tool.service_stopped: redis |" },
    { kind: "command", text: "orbit tool:action redis restart" },
    { kind: "info", text: "Tool [redis] is running." },
    { kind: "comment", text: "Request ID: 01J9K2QN7X4B" },
];

function useLaptopPhase() {
    const [phase, setPhase] = useState<"closed" | "dim" | "run">("run");

    useEffect(() => {
        const query = window.matchMedia("(prefers-reduced-motion: reduce)");
        let freezeTimer: ReturnType<typeof setTimeout> | null = null;
        let dimTimer: ReturnType<typeof setTimeout> | null = null;
        let cycleTimer: ReturnType<typeof setTimeout> | null = null;

        const clear = () => {
            if (freezeTimer) clearTimeout(freezeTimer);
            if (dimTimer) clearTimeout(dimTimer);
            if (cycleTimer) clearTimeout(cycleTimer);
            freezeTimer = null;
            dimTimer = null;
            cycleTimer = null;
        };

        const cycle = () => {
            clear();
            setPhase("run");
            freezeTimer = setTimeout(() => setPhase("closed"), 4200);
            dimTimer = setTimeout(() => setPhase("dim"), 4900);
            cycleTimer = setTimeout(cycle, 7400);
        };

        const sync = () => {
            clear();
            if (query.matches) {
                setPhase("run");
                return;
            }
            cycle();
        };

        sync();
        query.addEventListener("change", sync);

        return () => {
            query.removeEventListener("change", sync);
            clear();
        };
    }, []);

    return phase;
}

function usePageMotion(
    headerWash: RefObject<HTMLDivElement | null>,
    firstRuler: RefObject<HTMLDivElement | null>,
    secondRuler: RefObject<HTMLDivElement | null>,
) {
    useEffect(() => {
        const query = window.matchMedia("(prefers-reduced-motion: reduce)");
        let frame = 0;
        let settleTimer: ReturnType<typeof setTimeout> | null = null;

        const paint = () => {
            frame = 0;
            const scrollY = window.scrollY || 0;
            if (headerWash.current) {
                headerWash.current.style.opacity = scrollY > 4 ? "1" : "0";
            }

            const offset = query.matches ? 0 : -scrollY * 0.45;
            if (firstRuler.current) {
                firstRuler.current.style.backgroundPosition = `${offset}px 100%, ${offset}px 100%`;
            }
            if (secondRuler.current) {
                secondRuler.current.style.backgroundPosition = `${offset}px 0, ${offset}px 0`;
            }
        };

        const schedule = () => {
            if (!frame) {
                frame = requestAnimationFrame(paint);
            }
        };

        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule);
        query.addEventListener("change", schedule);
        schedule();
        settleTimer = setTimeout(schedule, 400);

        return () => {
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", schedule);
            query.removeEventListener("change", schedule);
            if (settleTimer) clearTimeout(settleTimer);
            if (frame) cancelAnimationFrame(frame);
        };
    }, [firstRuler, headerWash, secondRuler]);
}

function Header({ washRef }: { washRef: RefObject<HTMLDivElement | null> }) {
    return (
        <header className="orbit-story-header">
            <div ref={washRef} aria-hidden="true" className="orbit-story-header__wash" />
            <div className="orbit-story-header__inner">
                <a href="#top" aria-label="Orbit home" className="border-0">
                    <Logo />
                </a>
                <nav aria-label="Primary navigation" className="orbit-story-nav">
                    <a href="#story">Story</a>
                    <a href="#build">Build</a>
                    <a href="#install">Install</a>
                </nav>
                <ButtonLink href="#install" size="sm" className="ml-auto">
                    Get started
                </ButtonLink>
            </div>
        </header>
    );
}

function Hero({ rulerRef }: { rulerRef: RefObject<HTMLDivElement | null> }) {
    return (
        <div className="orbit-story-hero-shell">
            <div className="orbit-story-hero">
                <Starfield density={3.6} fill className="z-0" />
                <div className="orbit-story-constellation" aria-hidden="true">
                    <div className="orbit-story-constellation__inner">
                        <OrbitDiagram
                            data-hero-constellation
                            labels={false}
                            stats
                            statsZone={[0.42, 0.56]}
                            center={{ label: "", sub: "" }}
                            nodes={heroNodes}
                            speed={1.1}
                            packetSize={1.1}
                        />
                    </div>
                </div>
                <div className="orbit-story-blur orbit-story-blur--1" aria-hidden="true" />
                <div className="orbit-story-blur orbit-story-blur--2" aria-hidden="true" />
                <div className="orbit-story-blur orbit-story-blur--3" aria-hidden="true" />
                <div className="orbit-story-blur orbit-story-blur--4" aria-hidden="true" />
                <div className="orbit-story-blur orbit-story-blur--solid" aria-hidden="true" />
                <section data-hero className="orbit-story-hero__copy">
                    <div className="max-w-[min(62ch,60%)]">
                        <div className="orbit-label mb-5">
                            Open source · self-hosted · agent-driven
                        </div>
                        <h1 className="max-w-[24ch] text-[clamp(38px,4vw,64px)] leading-[0.98] font-medium tracking-[-0.035em]">
                            Develop your ideas faster on your own agent-run infra.
                        </h1>
                        <p className="mt-[26px] max-w-[52ch] text-lg leading-[1.58] tracking-[-0.018em] text-orbit-secondary">
                            Orbit turns the machines you already own into an always-on development
                            network — provisioned, routed, and repaired by your agent, reachable
                            from every device you carry.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4">
                            <ButtonLink href="#story">Read the story</ButtonLink>
                            <ButtonLink href="#install" variant="outline">
                                Quickstart
                            </ButtonLink>
                        </div>
                        <Snippet
                            command="composer global require nckrtl/orbit"
                            className="mt-6 max-w-[420px]"
                        />
                    </div>
                </section>
                <Ruler rulerRef={rulerRef} position="bottom" />
            </div>
        </div>
    );
}

function Ruler({
    position,
    rulerRef,
}: {
    position: "bottom" | "top";
    rulerRef: RefObject<HTMLDivElement | null>;
}) {
    return (
        <div aria-hidden="true" className={`orbit-story-ruler orbit-story-ruler--${position}`}>
            <div ref={rulerRef} className="orbit-story-ruler__marks" />
        </div>
    );
}

function StoryDivider({ rulerRef }: { rulerRef: RefObject<HTMLDivElement | null> }) {
    return (
        <>
            <div aria-hidden="true" className="orbit-story-hatch" />
            <Ruler rulerRef={rulerRef} position="top" />
        </>
    );
}

function Laptop({ phase }: { phase: "closed" | "dim" | "run" }) {
    const closed = phase !== "run";

    return (
        <div className="flex w-full flex-col items-center">
            <div data-laptop className="orbit-laptop-scene">
                <div className="orbit-laptop">
                    <div className="orbit-laptop__base">
                        <div className="orbit-laptop__keyboard" />
                        <div className="orbit-laptop__trackpad" />
                    </div>
                    <div className="orbit-laptop__front" />
                    <div className="orbit-laptop__side" />
                    <div data-lid={closed ? "closed" : "open"} className="orbit-laptop__lid">
                        <div
                            data-sess
                            data-run={closed ? "0" : "1"}
                            className="orbit-laptop__session"
                        >
                            <div className="orbit-session-line orbit-session-line--1 text-orbit-primary">
                                <span className="text-orbit-muted">❯</span> agent run &quot;tidy up
                                Node.php&quot;
                            </div>
                            <div className="orbit-session-line orbit-session-line--2">
                                · read src/Orbit/Node.php · 412 lines
                            </div>
                            <div className="orbit-session-line orbit-session-line--3">
                                · edit src/Orbit/Node.php, NodeTest.php
                            </div>
                            <div className="orbit-session-line orbit-session-line--4">
                                <span className="text-orbit-primary">+34</span>{" "}
                                <span className="text-orbit-faint">−12</span> across 2 files
                            </div>
                            <div className="orbit-session-line orbit-session-line--5 text-orbit-primary">
                                <span className="text-orbit-muted">❯</span> vendor/bin/pest{" "}
                                <span data-caret className="orbit-laptop__caret" />
                            </div>
                            <div className="mt-auto flex items-center gap-2.5">
                                <div className="h-[3px] flex-1 bg-orbit-hairline">
                                    <div data-bar className="orbit-laptop__progress" />
                                </div>
                                <span className="text-[11px] text-orbit-faint">tests</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="orbit-label mt-2 text-center">lid closes · work stops</div>
        </div>
    );
}

function topologyNodes(roles: RoleState): OrbitNode[] {
    const developmentSatellites = [{ label: "app-1", role: "app-1", angle: 10 }];

    if (roles.database && !roles.dedicatedDatabase) {
        developmentSatellites.push({ label: "database", role: "database", angle: 190 });
    }

    const nodes: OrbitNode[] = [
        {
            label: "dev-01",
            role: "app-dev",
            angle: -15,
            satellites: developmentSatellites,
        },
    ];

    if (roles.dedicatedDatabase) {
        nodes.push({ label: "db-01", role: "database", angle: 120, ring: 2 });
    }

    if (roles.production) {
        nodes.push({
            label: "prod-01",
            role: "app-prod",
            angle: 185,
            cluster: "cluster: production",
            satellites: [
                { label: "router-01", role: "router", angle: 30 },
                { label: "ingress-01", role: "ingress", angle: 210 },
            ],
        });
    }

    return nodes;
}

function RoleChips({
    roles,
    setRoles,
}: {
    roles: RoleState;
    setRoles: (roles: RoleState) => void;
}) {
    const definitions: { key: keyof RoleState; label: string }[] = [
        { key: "database", label: "database on dev-01" },
        { key: "dedicatedDatabase", label: "dedicated database node" },
        { key: "production", label: "production node + cluster" },
    ];

    return (
        <div className="mt-8 flex flex-wrap gap-2.5" aria-label="Topology roles">
            {definitions.map((definition) => {
                const active = roles[definition.key];

                return (
                    <button
                        key={definition.key}
                        type="button"
                        data-role-chip={definition.key}
                        aria-pressed={active}
                        onClick={() => setRoles({ ...roles, [definition.key]: !active })}
                        className={`orbit-role-chip ${active ? "orbit-role-chip--active" : ""}`}
                    >
                        <Icon name={active ? "check" : "plus"} className="size-3" />
                        {definition.label}
                    </button>
                );
            })}
        </div>
    );
}

function Story() {
    const laptopPhase = useLaptopPhase();
    const [roles, setRoles] = useState<RoleState>({
        database: true,
        dedicatedDatabase: false,
        production: false,
    });

    return (
        <div id="story" className="orbit-story-chapters">
            <Starfield density={3.6} fill />
            {chapters.map((chapter) => (
                <section
                    key={chapter.id}
                    data-chapter={chapter.id}
                    data-screen-label={chapter.step}
                    className="orbit-story-chapter"
                >
                    <div className="orbit-story-chapter__grid">
                        <div className="orbit-story-chapter__copy">
                            <div className="mb-[22px] flex items-baseline gap-2.5 font-mono text-[10.5px] tracking-[0.16em] uppercase">
                                <span className="text-orbit-muted">{chapter.step}</span>
                                <span className="text-orbit-secondary">{chapter.kicker}</span>
                            </div>
                            <h2 className="max-w-[26ch] text-[clamp(28px,2.9vw,40px)] leading-[1.1] font-medium tracking-[-0.032em]">
                                {chapter.title}
                            </h2>
                            <p className="mt-6 max-w-[52ch] text-base leading-[1.62] text-orbit-secondary">
                                {chapter.body}
                            </p>
                            {chapter.aside ? (
                                <p className="mt-5 max-w-[52ch] text-sm leading-[1.6] text-orbit-muted">
                                    {chapter.aside}
                                </p>
                            ) : null}
                            {chapter.type === "topology" ? (
                                <RoleChips roles={roles} setRoles={setRoles} />
                            ) : null}
                            {chapter.command ? (
                                <Terminal
                                    title={chapter.command.title}
                                    lines={chapter.command.lines}
                                    dense
                                    className="mt-8"
                                />
                            ) : null}
                        </div>
                        <div className="orbit-story-chapter__visual">
                            {chapter.type === "laptop" ? <Laptop phase={laptopPhase} /> : null}
                            {chapter.type === "diagram" ? (
                                <OrbitDiagram
                                    operator={chapter.operator}
                                    center={chapter.center}
                                    nodes={chapter.nodes}
                                    caption={chapter.caption}
                                    statsZone={[0.02, 0.74]}
                                    stats
                                    selected={chapter.selected}
                                />
                            ) : null}
                            {chapter.type === "topology" ? (
                                <OrbitDiagram
                                    operator={chapter.operator}
                                    center={chapter.center}
                                    nodes={topologyNodes(roles)}
                                    caption={chapter.caption}
                                    statsZone={[0.02, 0.74]}
                                    stats
                                />
                            ) : null}
                        </div>
                    </div>
                </section>
            ))}
        </div>
    );
}

const agentBenefits = [
    {
        icon: "sparkles",
        title: "One interface for logs, actions, and state",
        body: "The agent reads a process log or restarts a service the same way on every node, instead of inventing an SSH incantation each time.",
    },
    {
        icon: "boxes",
        title: "Placement is deterministic",
        body: "An app placed on a node is set up the same way on any node, because the steps are codified in Orbit rather than improvised per machine.",
    },
    {
        icon: "stethoscope",
        title: "Drift is reported, not guessed at",
        body: "orbit doctor compares what the Gateway expects with what is on the machine, and changes nothing.",
    },
];

function Build() {
    return (
        <section id="build" className="orbit-story-build">
            <div className="orbit-label mb-4">What it costs your agent</div>
            <h2 className="max-w-[min(24ch,calc(50%_-_28px))] text-[clamp(30px,3.2vw,44px)] leading-[1.12] font-medium tracking-[-0.035em] max-md:max-w-[24ch]">
                Codified operations, so the agent stops guessing.
            </h2>
            <div className="orbit-story-build__grid">
                <div className="flex flex-col gap-[22px]">
                    {agentBenefits.map((benefit) => (
                        <div key={benefit.title} className="flex gap-3.5">
                            <Icon name={benefit.icon} className="mt-[3px] size-[18px] shrink-0" />
                            <div>
                                <h3 className="text-[17px] font-medium tracking-[-0.018em]">
                                    {benefit.title}
                                </h3>
                                <p className="mt-2 max-w-[44ch] text-[13.5px] leading-[1.58] text-orbit-secondary">
                                    {benefit.title === "Drift is reported, not guessed at" ? (
                                        <>
                                            <code className="text-[12.5px]">orbit doctor</code>{" "}
                                            compares what the Gateway expects with what is on the
                                            machine, and changes nothing.
                                        </>
                                    ) : (
                                        benefit.body
                                    )}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                <Terminal title="orbit · agent session" lines={agentLines} />
            </div>
        </section>
    );
}

const ownedMachines = [
    { icon: "hard-drive", name: "old desktop", role: "app-dev + database roles" },
    { icon: "cpu", name: "mini pc", role: "gateway: store, wireguard, dns" },
    { icon: "globe", name: "rented vps", role: "app-prod + ingress, for what you publish" },
];

function OwnedMachine() {
    return (
        <div className="border-t border-orbit-hairline">
            <section className="orbit-owned-machine">
                <div>
                    <div className="orbit-label mb-4">Use what you own</div>
                    <h2 className="max-w-[22ch] text-[clamp(30px,3.2vw,44px)] leading-[1.12] font-medium tracking-[-0.035em]">
                        That machine in the closet is a node.
                    </h2>
                    <p className="mt-5 max-w-[50ch] text-base leading-[1.6] text-orbit-secondary">
                        An old desktop, a mini PC, a spare laptop, a rented box — anything that runs
                        Ubuntu 26.04 and accepts an SSH key can join the network and start hosting
                        apps. No third-party platform in the middle, no per-seat pricing, no data
                        leaving your hardware.
                    </p>
                    <p className="mt-[18px] max-w-[50ch] text-sm leading-[1.6] text-orbit-muted">
                        Orbit is open source. Read it, fork it, run it on your own terms.
                    </p>
                </div>
                <div className="grid gap-3">
                    {ownedMachines.map((machine) => (
                        <div key={machine.name} className="orbit-machine-card">
                            <Icon name={machine.icon} className="size-[18px] shrink-0" />
                            <div>
                                <div className="font-mono text-[12.5px] text-orbit-primary">
                                    {machine.name}
                                </div>
                                <div className="mt-[3px] text-[13px] text-orbit-muted">
                                    {machine.role}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

function Install() {
    return (
        <div className="border-t border-orbit-hairline">
            <section id="install" className="orbit-story-install">
                <h2 className="text-[clamp(30px,3.2vw,44px)] leading-[1.12] font-medium tracking-[-0.035em]">
                    One install, then tell your agent.
                </h2>
                <p className="mx-auto mt-5 max-w-[46ch] text-[17px] leading-[1.58] text-orbit-secondary">
                    PHP 8.5 and one command on your own machine. Everything after that happens on
                    hardware you control.
                </p>
                <Snippet
                    command="composer global require nckrtl/orbit"
                    className="mx-auto mt-8 max-w-[420px] text-left"
                />
            </section>
        </div>
    );
}

function Footer() {
    return (
        <footer className="border-t border-orbit-hairline px-orbit-gutter py-10">
            <div className="mx-auto flex max-w-orbit-container flex-wrap gap-6 font-mono text-[10.5px] tracking-[0.16em] text-orbit-muted uppercase">
                <span>Orbit</span>
                <span>v0.4.0</span>
                <a href={githubUrl} target="_blank" rel="noreferrer">
                    Open source
                </a>
                <span className="ml-auto">Self-hosted</span>
            </div>
        </footer>
    );
}

export function OrbitHomepage() {
    const headerWash = useRef<HTMLDivElement>(null);
    const firstRuler = useRef<HTMLDivElement>(null);
    const secondRuler = useRef<HTMLDivElement>(null);

    usePageMotion(headerWash, firstRuler, secondRuler);

    return (
        <div
            id="top"
            className="min-h-screen overflow-x-clip bg-orbit-void text-orbit-primary antialiased"
        >
            <Header washRef={headerWash} />
            <main>
                <Hero rulerRef={firstRuler} />
                <StoryDivider rulerRef={secondRuler} />
                <Story />
                <Build />
                <OwnedMachine />
                <Install />
            </main>
            <Footer />
        </div>
    );
}
