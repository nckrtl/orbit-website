import { PageStarfield } from "./page-starfield";
import { cancelScrollFrame, observeScroll, requestScrollFrame } from "./animation";
import type { RefObject } from "react";
import { useEffect, useRef } from "react";
import { ButtonLink, Logo } from "./primitives";
import { Install } from "./install";
import { Laptop } from "./laptop";
import { PremiseScene, StoryHandoff, TopologyScene, type StoryRoles } from "./story-handoff";
import { Capabilities } from "./capabilities";
import { OwnedInfrastructure } from "./owned-infrastructure";
import { CoreFunnel } from "./core-funnel";
import { DevelopmentEnvironments } from "./development-environments";
import { HeroConstellations } from "./hero-constellation";
import { useHeroScroll } from "./hero-scroll";
import { useStoryCopyScroll } from "./story-copy-scroll";
import { useScrollReveal } from "./use-scroll-reveal";
import { foundationSequence } from "./finale-reveal";
import { MobileMenu } from "./mobile-menu";
import { useHeaderScroll } from "./use-header-scroll";
import { ThemeMenu } from "./theme-menu";

const githubUrl = "https://github.com/nckrtl/orbit";
// Set to true to restore the intro's clipped constellation and ticked divider.
const showIntroDivider = false;

type Chapter = {
    aside?: string;
    body: string;
    caption: string;
    id: string;
    kicker: string;
    step: string;
    title: string;
    type: "laptop" | "topology" | "handoff";
};

const storyRoles: StoryRoles = {
    database: true,
    dedicatedDatabase: false,
    production: true,
};

const chapters: Chapter[] = [
    {
        id: "problem",
        step: "01",
        kicker: "The problem",
        title: "Local development stops when your laptop does.",
        body: "A local environment is hard to beat until agents start doing the work. Agents do their best work in long, unattended runs. Queues and schedulers need to keep ticking. You want to open the preview on your phone. Close the lid, and all of it stops.",
        aside: "Leaving the laptop on all night is not an environment. It is a workaround.",
        caption: "lid closes · work stops",
        type: "laptop",
    },
    {
        id: "premise",
        step: "02",
        kicker: "The Gateway",
        title: "Move the work. Keep the control.",
        body: "Put one always-on machine in the middle: your Gateway. Your laptop, phone, and tablet connect to it, not to each other, so closing the lid changes nothing. The Gateway keeps the record of what exists, the private network to reach it, and the names that resolve inside it.",
        aside: "Your machine. Your network. Your rules. Orbit runs where you put it, so the record of your work stays with you.",
        caption: "devices connect here · not to the laptop",
        type: "handoff",
    },
    {
        id: "topology",
        step: "03",
        kicker: "The fleet",
        title: "Start with one machine. Make room for what’s next.",
        body: "Every machine that joins becomes a node. Give background work a node of its own. Keep the database beside your apps, or move it to a dedicated machine. When you need production, group nodes into a cluster with its own name.",
        aside: "The shape can change. The Gateway still holds the one record of the whole fleet.",
        caption: "more nodes · one record",
        type: "topology",
    },
];

function usePageMotion(
    headerWash: RefObject<HTMLDivElement | null>,
    firstRuler: RefObject<HTMLDivElement | null>,
    secondRuler: RefObject<HTMLDivElement | null>,
) {
    useEffect(() => {
        const query = window.matchMedia("(prefers-reduced-motion: reduce)");
        let frame = 0;
        const dividerMarks = document.querySelectorAll<HTMLElement>(
            "[data-story-divider] .orbit-story-ruler__marks, [data-story-divider] .orbit-story-hatch, [data-install-ruler] .orbit-story-ruler__marks",
        );
        let wasScrolled: boolean | undefined;

        const paint = (_time: number, scrollY: number) => {
            frame = 0;
            const scrolled = scrollY > 0;
            if (headerWash.current && scrolled !== wasScrolled) {
                wasScrolled = scrolled;
                headerWash.current.style.opacity = scrolled ? "1" : "0";
                headerWash.current.parentElement?.setAttribute("data-scrolled", String(scrolled));
            }

            const offset = query.matches ? 0 : -scrollY * 0.45;
            if (firstRuler.current) {
                firstRuler.current.style.backgroundPosition = `${offset}px 100%, ${offset}px 100%`;
            }
            if (secondRuler.current) {
                secondRuler.current.style.backgroundPosition = `${offset}px 0, ${offset}px 0`;
            }
            dividerMarks.forEach((marks) => {
                marks.style.backgroundPositionX = `${offset}px, ${offset}px`;
            });
        };

        const schedule = () => {
            if (!frame) {
                frame = requestScrollFrame(paint);
            }
        };

        const stopScroll = observeScroll(schedule);
        query.addEventListener("change", schedule);
        schedule();

        return () => {
            stopScroll();
            query.removeEventListener("change", schedule);
            if (frame) cancelScrollFrame(frame);
        };
    }, [firstRuler, headerWash, secondRuler]);
}

function Header({ washRef }: { washRef: RefObject<HTMLDivElement | null> }) {
    const ref = useHeaderScroll();

    return (
        <header ref={ref} className="orbit-story-header">
            <div ref={washRef} aria-hidden="true" className="orbit-story-header__wash" />
            <div className="orbit-story-header__inner">
                <a href="#top" aria-label="Orbit home" className="border-0">
                    <Logo />
                </a>
                <nav aria-label="Primary navigation" className="orbit-story-nav">
                    <a href="#story">Story</a>
                    <a href="#build">Build</a>
                    <a href="#install">Setup</a>
                </nav>
                <ButtonLink href="#install" size="sm" className="ml-auto">
                    Get started
                </ButtonLink>
                <ThemeMenu />
                <MobileMenu />
            </div>
        </header>
    );
}

function Hero({ rulerRef }: { rulerRef: RefObject<HTMLDivElement | null> }) {
    const contentRef = useHeroScroll();

    return (
        <div className="orbit-story-hero-shell" data-flowing={!showIntroDivider ? "" : undefined}>
            <div className="orbit-story-hero" data-hero-scene>
                <HeroConstellations />
                <section data-hero className="orbit-story-hero__copy">
                    <div
                        ref={contentRef}
                        data-hero-content
                        className="mx-auto w-full max-w-[1120px] text-center"
                    >
                        <div data-hero-entrance>
                            <div className="orbit-label mb-5">
                                <span data-hero-enter="open-source">Open-source</span>{" "}
                                <span data-hero-enter="self-hosted">· self-hosted</span>{" "}
                                <span data-hero-enter="agent-driven">· agent-run</span>
                            </div>
                            <h1
                                data-hero-enter="title"
                                className="mx-auto max-w-[32ch] text-[clamp(42px,5vw,80px)] leading-[0.98] font-medium tracking-[-0.035em] text-balance"
                            >
                                Build ideas faster on machines you own, run by your agent.
                            </h1>
                            <p
                                data-hero-enter="description"
                                className="mx-auto mt-[26px] max-w-[72ch] text-lg leading-[1.58] tracking-[-0.018em] text-pretty text-orbit-secondary"
                            >
                                Orbit turns the machines you already own into an always-on
                                development network. Your agent provisions, routes, and repairs it.
                                You can reach it from every device you carry.
                            </p>
                            <div
                                data-cta
                                data-hero-enter="buttons"
                                className="mt-8 flex flex-wrap justify-center gap-4"
                            >
                                <ButtonLink href="#story">Read the story</ButtonLink>
                                <ButtonLink href="#install" variant="outline">
                                    Skip to setup
                                </ButtonLink>
                            </div>
                        </div>
                    </div>
                </section>
                {showIntroDivider ? <Ruler rulerRef={rulerRef} position="bottom" /> : null}
            </div>
        </div>
    );
}

function Ruler({
    position,
    rulerRef,
}: {
    position: "bottom" | "top";
    rulerRef?: RefObject<HTMLDivElement | null>;
}) {
    return (
        <div aria-hidden="true" className={`orbit-story-ruler orbit-story-ruler--${position}`}>
            <div ref={rulerRef} className="orbit-story-ruler__marks" />
        </div>
    );
}

function StoryDivider({
    rulerRef,
    bothSides = false,
}: {
    rulerRef?: RefObject<HTMLDivElement | null>;
    bothSides?: boolean;
}) {
    return (
        <>
            {bothSides ? <Ruler position="bottom" /> : null}
            <div aria-hidden="true" className="orbit-story-hatch" />
            <Ruler rulerRef={rulerRef} position="top" />
        </>
    );
}

function Story() {
    const ref = useStoryCopyScroll();

    useEffect(() => {
        const elements = ref.current?.querySelectorAll<HTMLElement>("[data-story-enter]");
        if (!elements) return;
        const motion = matchMedia("(prefers-reduced-motion: reduce)");
        const desktop = matchMedia("(min-width: 901px)");
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(({ target, isIntersecting }) => {
                    if (!isIntersecting) return;
                    const element = target.closest<HTMLElement>("[data-story-enter]")!;
                    element.dataset.enterState = "visible";
                    observer.unobserve(target);
                    if (desktop.matches) {
                        const visual = element.parentElement?.querySelector<HTMLElement>(
                            '[data-story-enter="visual"]',
                        );
                        if (visual) visual.dataset.enterState = "visible";
                    }
                });
            },
            { rootMargin: "0px 0px -80px 0px", threshold: 0.01 },
        );
        const observe = () => {
            observer.disconnect();
            elements.forEach((element) => {
                const copyVisible =
                    desktop.matches &&
                    element.parentElement
                        ?.querySelector('[data-story-enter="copy"]')
                        ?.getAttribute("data-enter-state") === "visible";
                if (motion.matches || copyVisible) element.dataset.enterState = "visible";
                else if (
                    element.dataset.enterState !== "visible" &&
                    (!desktop.matches || element.dataset.storyEnter === "copy")
                ) {
                    observer.observe(
                        element.dataset.storyEnter === "copy" && !desktop.matches
                            ? element.querySelector("h2")!
                            : element,
                    );
                }
            });
        };
        // Enhance after hydration: without JavaScript the story remains readable.
        // Observe the columns separately so mobile artwork waits until it enters view.
        elements.forEach((element) => {
            element.dataset.enterState = motion.matches ? "visible" : "waiting";
        });
        observe();
        motion.addEventListener("change", observe);
        desktop.addEventListener("change", observe);
        return () => {
            observer.disconnect();
            motion.removeEventListener("change", observe);
            desktop.removeEventListener("change", observe);
            elements.forEach((element) => delete element.dataset.enterState);
        };
    }, []);

    return (
        <div ref={ref} id="story" className="orbit-story-chapters">
            <StoryHandoff />
            <StoryHandoff stage="topology" />
            {chapters.map((chapter) => (
                <section
                    key={chapter.id}
                    data-chapter={chapter.id}
                    data-screen-label={chapter.step}
                    className="orbit-story-chapter"
                >
                    <div className="orbit-story-chapter__grid">
                        <div className="orbit-story-chapter__copy" data-story-enter="copy">
                            <div
                                data-story-copy-part="label"
                                className="mb-[22px] flex items-baseline gap-2.5 font-mono text-[10.5px] tracking-[0.16em] uppercase"
                            >
                                <span className="text-orbit-muted">{chapter.step}</span>
                                <span className="text-orbit-secondary">{chapter.kicker}</span>
                            </div>
                            <h2
                                data-story-copy-part="title"
                                className="max-w-[26ch] text-[clamp(28px,2.9vw,40px)] leading-[1.1] font-medium tracking-[-0.032em]"
                            >
                                {chapter.title}
                            </h2>
                            <div data-story-copy-part="body" className="mt-6">
                                <p className="max-w-[52ch] text-base leading-[1.62] text-orbit-secondary">
                                    {chapter.body}
                                </p>
                                {chapter.aside ? (
                                    <blockquote
                                        data-story-quote
                                        className="orbit-story-chapter__quote relative mt-6 max-w-[52ch] pb-0.5 pl-[22px] text-base leading-[1.62] text-orbit-secondary italic"
                                    >
                                        <p>{chapter.aside}</p>
                                    </blockquote>
                                ) : null}
                            </div>
                        </div>
                        <div className="orbit-story-chapter__visual" data-story-enter="visual">
                            {chapter.type === "laptop" ? <Laptop /> : null}
                            {chapter.type === "handoff" ? <PremiseScene /> : null}
                            {chapter.type === "topology" ? (
                                <TopologyScene roles={storyRoles} />
                            ) : null}
                        </div>
                    </div>
                </section>
            ))}
        </div>
    );
}

function OwnedMachine() {
    const ref = useRef<HTMLElement>(null);
    useScrollReveal(ref, foundationSequence, "foundation");

    return (
        <div>
            <CoreFunnel />
            <section ref={ref} className="orbit-owned-machine">
                <div className="orbit-owned-machine__intro">
                    <div>
                        <div className="orbit-label mb-4">Own your foundation</div>
                        <h2 className="max-w-[22ch] text-[clamp(30px,3.2vw,44px)] leading-[1.12] font-medium tracking-[-0.035em]">
                            A steady core. Swap the rest.
                        </h2>
                        <p className="mx-auto mt-6 max-w-[62ch] text-[17px] leading-[1.6] text-pretty text-orbit-secondary">
                            Everything Orbit knows about your setup lives in one record on your
                            Gateway: nodes, apps, instances, processes, databases, tools, security,
                            and updates. Agents and environments can come and go. The record stays,
                            and it stays yours.
                        </p>
                    </div>
                </div>
                <OwnedInfrastructure />
            </section>
        </div>
    );
}

function Footer() {
    return (
        <footer className="border-t border-orbit-hairline py-6">
            <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-6 px-orbit-gutter font-mono text-[10.5px] tracking-[0.16em] text-orbit-muted uppercase">
                <div className="flex items-center gap-6">
                    <img src="/assets/orbit/logo-white.svg" width="24" height="24" alt="Orbit" />
                    <span>v0.4.0</span>
                </div>
                <div className="ml-auto flex items-center gap-6 whitespace-nowrap">
                    <a href={githubUrl} target="_blank" rel="noreferrer">
                        Open source
                    </a>
                    <span>Self-hosted</span>
                </div>
            </div>
        </footer>
    );
}

export function OrbitHomepage({ orbitUrl }: { orbitUrl: string }) {
    const headerWash = useRef<HTMLDivElement>(null);
    const firstRuler = useRef<HTMLDivElement>(null);
    const secondRuler = useRef<HTMLDivElement>(null);

    usePageMotion(headerWash, firstRuler, secondRuler);

    return (
        <div
            id="top"
            className="relative isolate min-h-screen overflow-x-clip bg-orbit-void text-orbit-primary antialiased"
        >
            <PageStarfield />
            <Header washRef={headerWash} />
            <main>
                <Hero rulerRef={firstRuler} />
                {showIntroDivider ? <StoryDivider rulerRef={secondRuler} /> : null}
                <Story />
                <div data-story-divider="reverse" aria-hidden="true">
                    <StoryDivider bothSides />
                </div>
                <Capabilities />
                <div data-story-divider="build" aria-hidden="true">
                    <StoryDivider bothSides />
                </div>
                <DevelopmentEnvironments />
                <OwnedMachine />
                <Install orbitUrl={orbitUrl} />
            </main>
            <Footer />
        </div>
    );
}
