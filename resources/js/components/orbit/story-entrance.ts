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
