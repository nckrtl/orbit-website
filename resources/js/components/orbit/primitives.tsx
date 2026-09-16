import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

const assetRoot = "/assets/orbit";

export function Logo({ className = "" }: { className?: string }) {
    return (
        <span className={`inline-flex items-center gap-3 ${className}`}>
            <img src={`${assetRoot}/logo-white.svg`} alt="" width="24" height="24" />
            <span className="text-[18.72px] leading-none font-medium tracking-[-0.03em]">
                orbit
            </span>
        </span>
    );
}

export function Icon({ name, className = "" }: { name: string; className?: string }) {
    return (
        <img
            src={`${assetRoot}/icons/${name}.svg`}
            alt=""
            width="20"
            height="20"
            className={className}
            aria-hidden="true"
        />
    );
}

type ButtonLinkProps = ComponentPropsWithoutRef<"a"> & {
    variant?: "solid" | "outline" | "ghost";
    size?: "sm" | "lg";
};

export function ButtonLink({
    variant = "solid",
    size = "lg",
    className = "",
    children,
    ...props
}: ButtonLinkProps) {
    return (
        <a
            className={`orbit-button orbit-button--${variant} orbit-button--${size} ${className}`}
            {...props}
        >
            {children}
        </a>
    );
}

export function CopyButton({
    command,
    label = "Copy",
    ariaLabel = `Copy ${command}`,
    className = "",
    variant = "compact",
}: {
    command: string;
    label?: string;
    ariaLabel?: string;
    className?: string;
    variant?: "compact" | "outline" | "solid";
}) {
    const [copied, setCopied] = useState(false);
    const mounted = useRef(false);
    const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        mounted.current = true;

        return () => {
            mounted.current = false;
            if (resetTimer.current) {
                clearTimeout(resetTimer.current);
            }
        };
    }, []);

    const copy = async () => {
        let succeeded = false;

        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(command);
                succeeded = true;
            }
        } catch {
            succeeded = false;
        }

        if (!mounted.current) {
            return;
        }

        if (!succeeded) {
            const focused = document.activeElement;
            const textarea = document.createElement("textarea");
            textarea.value = command;
            textarea.setAttribute("readonly", "");
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            const copyRoot = focused instanceof Element ? focused.closest('[role="dialog"]') : null;
            (copyRoot ?? document.body).append(textarea);
            try {
                textarea.select();
                succeeded = document.execCommand("copy");
            } catch {
                succeeded = false;
            } finally {
                textarea.remove();
                if (focused instanceof HTMLElement) focused.focus({ preventScroll: true });
            }
        }

        if (!mounted.current || !succeeded) {
            if (mounted.current) {
                setCopied(false);
            }
            return;
        }

        setCopied(true);
        if (resetTimer.current) {
            clearTimeout(resetTimer.current);
        }
        resetTimer.current = setTimeout(() => setCopied(false), 1400);
    };

    return (
        <button
            type="button"
            onClick={copy}
            aria-label={ariaLabel}
            className={`${
                variant !== "compact"
                    ? `orbit-button orbit-button--${variant} orbit-button--lg`
                    : "rounded-[2px] px-2 py-1.5 font-mono text-[10.5px] font-medium tracking-[0.16em] text-orbit-muted uppercase transition-colors hover:bg-orbit-ink-04 hover:text-orbit-primary"
            } ${className}`}
        >
            <span aria-live="polite">{copied ? "Copied" : label}</span>
        </button>
    );
}

export function Snippet({ command, className = "" }: { command: string; className?: string }) {
    return (
        <div
            className={`flex h-10 items-center gap-3 rounded-[2px] border border-orbit-line bg-black pr-2 pl-4 ${className}`}
        >
            <code className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] text-orbit-code">
                <span className="text-orbit-faint select-none">$ </span>
                {command}
            </code>
            <CopyButton command={command} />
        </div>
    );
}

function seeded(seed: number) {
    let state = seed;

    return () => {
        state = (state * 1664525 + 1013904223) % 4294967296;
        return state / 4294967296;
    };
}

type StarfieldProps = HTMLAttributes<HTMLDivElement> & {
    children?: ReactNode;
    density?: number;
    fill?: boolean;
    grid?: boolean;
    horizon?: boolean;
    scanlines?: boolean;
    seed?: number;
    twinkle?: boolean;
};

export function Starfield({
    children,
    density = 1,
    fill = false,
    grid = false,
    horizon = false,
    scanlines = false,
    seed = 7,
    twinkle = true,
    className = "",
    ...props
}: StarfieldProps) {
    const starsRef = useRef<HTMLDivElement>(null);
    const stars = useMemo(() => {
        const random = seeded(seed * 9301 + 49297);
        const count = Math.round(90 * density);

        return Array.from({ length: count }, () => {
            const minimumOpacity = 0.14 + random() * 0.3;

            return {
                delay: (-random() * 10).toFixed(2),
                duration: (4 + random() * 7).toFixed(2),
                maximumOpacity: Math.min(1, minimumOpacity + 0.18 + random() * 0.35),
                minimumOpacity,
                size: random() > 0.82 ? 1.8 : 1,
                x: random() * 100,
                y: random() * 100,
            };
        });
    }, [density, seed]);

    useEffect(() => {
        const container = starsRef.current;
        if (!container || !twinkle) return;
        const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const easing = getComputedStyle(container).getPropertyValue("--ease-standard").trim();
        const mobile = window.matchMedia("(max-width: 639px)");
        const compact = window.matchMedia("(max-width: 1023px)");
        const elements = Array.from(container.children);
        const indices = new Map(elements.map((element, index) => [element, index]));
        const animations = new Map<Element, Animation>();
        const visibleStars = new Set<Element>();
        const syncStar = (element: Element) => {
            const index = indices.get(element)!;
            const stride = mobile.matches ? 3 : compact.matches ? 2 : 1;
            const running =
                visibleStars.has(element) &&
                index % stride === 0 &&
                !motion.matches &&
                !document.hidden;
            if (!running) {
                animations.get(element)?.cancel();
                animations.delete(element);
                return;
            }
            if (animations.has(element)) return;
            const star = stars[index];
            // Allocate compositor animations only for visible twinkles. The
            // remaining stars retain their static appearance on every viewport.
            animations.set(
                element,
                element.animate(
                    [
                        { opacity: star.minimumOpacity },
                        { opacity: star.maximumOpacity },
                        { opacity: star.minimumOpacity },
                    ],
                    {
                        duration: Number(star.duration) * 1000,
                        delay: Number(star.delay) * 1000,
                        easing,
                        iterations: Infinity,
                    },
                ),
            );
        };
        const sync = () => {
            for (const element of animations.keys()) syncStar(element);
            visibleStars.forEach(syncStar);
        };
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) visibleStars.add(entry.target);
                    else visibleStars.delete(entry.target);
                    syncStar(entry.target);
                });
            },
            { rootMargin: "32px" },
        );
        elements.forEach((star) => observer.observe(star));
        motion.addEventListener("change", sync);
        mobile.addEventListener("change", sync);
        compact.addEventListener("change", sync);
        document.addEventListener("visibilitychange", sync);
        return () => {
            observer.disconnect();
            motion.removeEventListener("change", sync);
            mobile.removeEventListener("change", sync);
            compact.removeEventListener("change", sync);
            document.removeEventListener("visibilitychange", sync);
            animations.forEach((animation) => animation.cancel());
        };
    }, [stars, twinkle]);

    return (
        <div
            className={`orbit-starfield ${fill ? "orbit-starfield--fill" : ""} ${grid ? "orbit-starfield--grid" : ""} ${horizon ? "orbit-starfield--horizon" : ""} ${scanlines ? "orbit-starfield--scanlines" : ""} ${className}`}
            {...props}
        >
            <div ref={starsRef} className="orbit-starfield__stars" aria-hidden="true">
                {stars.map((star, index) => (
                    <span
                        key={index}
                        className={twinkle ? "orbit-star orbit-star--twinkle" : "orbit-star"}
                        style={{
                            height: star.size,
                            left: `${star.x}%`,
                            opacity: star.minimumOpacity,
                            top: `${star.y}%`,
                            width: star.size,
                        }}
                    />
                ))}
            </div>
            {children ? <div className="relative">{children}</div> : null}
        </div>
    );
}

export type TerminalLine = {
    kind?: "agent" | "command" | "comment" | "error" | "info" | "out" | "warn";
    text: string;
};

export function Terminal({
    title,
    lines,
    dense = false,
    className = "",
}: {
    title: string;
    lines: TerminalLine[];
    dense?: boolean;
    className?: string;
}) {
    return (
        <div
            className={`relative overflow-hidden rounded-[10px] border border-orbit-line bg-black shadow-orbit-panel ${className}`}
        >
            <div className="flex h-[34px] items-center gap-3 border-b border-orbit-hairline bg-orbit-card px-4">
                <span className="size-1.5 rounded-full bg-orbit-grey-1" />
                <span className="font-mono text-[10.5px] tracking-[0.16em] text-orbit-muted uppercase">
                    {title}
                </span>
            </div>
            <div
                className={`orbit-scanlines relative overflow-x-auto px-4 font-mono tracking-[-0.01em] whitespace-pre ${dense ? "py-3 text-[11.5px] leading-[1.58]" : "pt-4 pb-5 text-[13px] leading-[1.62]"}`}
            >
                {lines.map((line, index) => (
                    <div
                        key={`${line.text}-${index}`}
                        className={
                            line.kind === "command"
                                ? "font-medium text-orbit-primary"
                                : line.kind === "info"
                                  ? "text-orbit-ok"
                                  : line.kind === "warn"
                                    ? "text-orbit-warn"
                                    : line.kind === "error"
                                      ? "text-orbit-error"
                                      : line.kind === "agent"
                                        ? "text-orbit-info"
                                        : line.kind === "comment"
                                          ? "text-orbit-muted"
                                          : "text-orbit-secondary"
                        }
                    >
                        {line.kind === "command" ? (
                            <span className="text-orbit-muted select-none">$ </span>
                        ) : null}
                        {line.text || " "}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function Section({
    id,
    label,
    title,
    lead,
    children,
    compact = false,
}: {
    id?: string;
    label?: string;
    title?: string;
    lead?: string;
    children: ReactNode;
    compact?: boolean;
}) {
    return (
        <section
            id={id}
            className={`mx-auto max-w-orbit-container px-orbit-gutter ${compact ? "pb-orbit-section" : "py-orbit-section"}`}
        >
            {label ? <div className="orbit-label mb-4">{label}</div> : null}
            {title ? <h2 className="max-w-[24ch] text-orbit-section">{title}</h2> : null}
            {lead ? (
                <p className="mt-5 max-w-[56ch] text-lg leading-[1.58] tracking-[-0.018em] text-orbit-secondary">
                    {lead}
                </p>
            ) : null}
            <div className="mt-10">{children}</div>
        </section>
    );
}

export function Card({
    children,
    grid = false,
    className = "",
}: {
    children: ReactNode;
    grid?: boolean;
    className?: string;
}) {
    return <div className={`orbit-card ${grid ? "orbit-grid" : ""} ${className}`}>{children}</div>;
}
