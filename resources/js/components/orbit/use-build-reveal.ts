import type { RefObject } from "react";
import { useScrollReveal, type RevealSequence } from "./use-scroll-reveal";

const buildSequence: RevealSequence = (section, add) => {
    const heading = section.querySelector(".orbit-environments__heading")!;
    add(".orbit-environments__heading .orbit-label", 0, heading);
    add("[data-build-title-line='first']", 1, heading);
    add("[data-build-title-line='second']", 2, heading);
    add(".orbit-environments__heading > p", 3, heading);
    const marquee = section.querySelector(".orbit-environments__marquee-row")!;
    // Fade the moving strip as one surface instead of filtering every logo.
    add(".orbit-environments__marquee", 0, marquee);
    add(".orbit-environments__figure", 0, undefined, true);
    add(".orbit-environments__benefits");
};

export function useBuildReveal(ref: RefObject<HTMLElement | null>) {
    // Avoid changing filter surfaces while the large SVG and marquee scroll.
    useScrollReveal(ref, buildSequence, "build", { blur: false });
}
