import type { RevealSequence } from "./use-scroll-reveal";

export const foundationSequence: RevealSequence = (section, add) => {
    const heading = section.querySelector(".orbit-owned-machine__intro")!;
    add(".orbit-owned-machine__intro .orbit-label", 0, heading);
    add(".orbit-owned-machine__intro h2", 1, heading);
    add(".orbit-owned-machine__intro p", 2, heading);

    // Reveal the complete diagram, its connections, and all notes together.
    add(".orbit-foundation");
};

export const installSequence: RevealSequence = (section, add) => {
    add(".orbit-launch__handoff");
    const heading = section.querySelector("#install .orbit-label")!;
    add("#install .orbit-label", 0, heading);
    add("#install h2", 1, heading);
    add(".orbit-launch__intro", 2, heading);
    // Anchor the prompt and action independently so they enter when reached on mobile.
    add("[data-orbit-prompt]");
    add(".orbit-launch__actions", 1);
};
