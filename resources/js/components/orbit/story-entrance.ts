export function storyParallaxOffset(element: Element): number {
    const grid = element.closest<HTMLElement>(".orbit-story-chapter__grid");
    return parseFloat(grid?.style.getPropertyValue("--story-entry-offset") ?? "") || 0;
}

// Scroll thresholds and outgoing wires use the settled layout, independent of
// the entrance drift. Otherwise a resize mid-entrance shifts the animation range.
export function storyLayoutBounds(element: Element): DOMRect {
    const bounds = element.getBoundingClientRect();
    bounds.y -= storyParallaxOffset(element);
    return bounds;
}

export function storyCopyBounds(copy: Element): DOMRect {
    if (getComputedStyle(copy).display !== "contents") return storyLayoutBounds(copy);
    const parts = [...copy.querySelectorAll("[data-story-copy-part]")].map((part) =>
        storyLayoutBounds(part),
    );
    const top = Math.min(...parts.map((part) => part.top));
    const left = Math.min(...parts.map((part) => part.left));
    return new DOMRect(
        left,
        top,
        Math.max(...parts.map((part) => part.right)) - left,
        Math.max(...parts.map((part) => part.bottom)) - top,
    );
}

export function storyCopyEntranceStart(
    bounds: Pick<DOMRect, "top" | "height">,
    scrollTop: number,
    viewportHeight: number,
    compact: boolean,
) {
    return compact
        ? bounds.top + scrollTop - viewportHeight + 80
        : bounds.top + scrollTop + bounds.height / 2 - viewportHeight * 0.85;
}

export function storyEntranceEnd(
    bounds: Pick<DOMRect, "top" | "height">,
    scrollTop: number,
    viewportHeight: number,
) {
    return bounds.top + scrollTop + bounds.height * 0.5 - viewportHeight * 0.55;
}

export function laptopCloseStart(
    bounds: Pick<DOMRect, "top" | "height">,
    scrollTop: number,
    viewportHeight: number,
) {
    // Begin closing as the illustration's center reaches the viewport midpoint.
    return bounds.top + scrollTop + bounds.height * 0.5 - viewportHeight * 0.5;
}
