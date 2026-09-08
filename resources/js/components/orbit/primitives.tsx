import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useState } from "react";

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

export function Snippet({ command, className = "" }: { command: string; className?: string }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        if (!navigator.clipboard) {
            return;
        }

        try {
            await navigator.clipboard.writeText(command);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1400);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div
            className={`flex h-10 items-center gap-3 rounded-[2px] border border-orbit-line bg-black pr-2 pl-4 ${className}`}
        >
            <code className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] text-orbit-code">
                <span className="text-orbit-faint select-none">$ </span>
                {command}
            </code>
            <button
                type="button"
                onClick={copy}
                aria-label={`Copy ${command}`}
                className="rounded-[2px] px-2 py-1.5 font-mono text-[10.5px] font-medium tracking-[0.16em] text-orbit-muted uppercase transition-colors hover:bg-orbit-ink-04 hover:text-orbit-primary"
            >
                {copied ? "Copied" : "Copy"}
            </button>
        </div>
    );
}

export function Starfield({
    children,
    horizon = false,
    scanlines = false,
    className = "",
}: {
    children: ReactNode;
    horizon?: boolean;
    scanlines?: boolean;
    className?: string;
}) {
    return (
        <div
            className={`orbit-starfield ${horizon ? "orbit-starfield--horizon" : ""} ${scanlines ? "orbit-starfield--scanlines" : ""} ${className}`}
        >
            <div className="relative">{children}</div>
        </div>
    );
}

type TerminalLine = {
    kind?: "command" | "out" | "info" | "comment";
    text: string;
};

export function Terminal({ title, lines }: { title: string; lines: TerminalLine[] }) {
    return (
        <div className="relative overflow-hidden rounded-[10px] border border-orbit-line bg-black shadow-orbit-panel">
            <div className="flex h-[34px] items-center gap-3 border-b border-orbit-hairline bg-orbit-card px-4">
                <span className="size-1.5 rounded-full bg-orbit-grey-1" />
                <span className="font-mono text-[10.5px] tracking-[0.16em] text-orbit-muted uppercase">
                    {title}
                </span>
            </div>
            <div className="orbit-scanlines relative overflow-x-auto px-4 pt-4 pb-5 font-mono text-[13px] leading-[1.62] tracking-[-0.01em] whitespace-pre">
                {lines.map((line) => (
                    <div
                        key={line.text}
                        className={
                            line.kind === "command"
                                ? "font-medium text-orbit-primary"
                                : line.kind === "info"
                                  ? "text-orbit-ok"
                                  : line.kind === "comment"
                                    ? "text-orbit-muted"
                                    : "text-orbit-secondary"
                        }
                    >
                        {line.kind === "command" ? (
                            <span className="text-orbit-muted select-none">$ </span>
                        ) : null}
                        {line.text}
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
