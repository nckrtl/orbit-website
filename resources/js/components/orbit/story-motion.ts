import { animateScene, cancelScrollFrame, observeScroll, requestScrollFrame } from "./animation";
import { useEffect, useRef } from "react";
import { globe, constellationSignal, constellationReadoutTransform } from "./hero-constellation";
import { objectScale } from "./object-scale";
import { storyLayoutBounds } from "./story-entrance";

type Point = { x: number; y: number };
type Positions = Record<string, Point>;
type ReadoutBox = { left: number; top: number; right: number; bottom: number };
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const number = (value: number) => value.toFixed(3);
export const topologyCenter = { x: 540, y: 540 };
export const topologyOrbit = { rx: 350, ry: 350 };
export const clusterOrbit = { rx: 160, ry: 44 };
export const topologyBodies = [
    { id: "Gateway", parent: "", angle: 0, radius: 34, detail: "your network" },
    { id: "dev-01", parent: "Gateway", angle: 0, radius: 26, detail: "app-dev" },
    { id: "worker-01", parent: "Gateway", angle: 0, radius: 24, detail: "background work" },
    { id: "db-01", parent: "Gateway", angle: 0, radius: 24, detail: "database" },
    { id: "dev-02", parent: "Gateway", angle: 0, radius: 26, detail: "app-prod" },
    { id: "app-1", parent: "dev-01", angle: -65, radius: 18, detail: "" },
    { id: "database", parent: "dev-01", angle: 115, radius: 18, detail: "on dev-01" },
    { id: "app-2", parent: "dev-02", angle: -65, radius: 18, detail: "" },
    { id: "app-3", parent: "dev-02", angle: 115, radius: 18, detail: "" },
].map((body) => ({
    ...body,
    radius: body.radius * objectScale,
    moon: Boolean(body.parent && body.parent !== "Gateway"),
}));
export function topologyAt(time: number, hosts: string[]): Positions {
    const positions: Positions = {};
    for (const body of topologyBodies) {
        const origin = positions[body.parent] ?? topologyCenter;
        const moon = body.parent !== "Gateway";
        const orbit = moon ? clusterOrbit : topologyOrbit;
        // Space only the visible hosts, so optional roles never leave an empty slot.
        const angle = moon
            ? (body.angle * Math.PI) / 180 + time * 0.09
            : -Math.PI / 2 + (hosts.indexOf(body.id) * Math.PI * 2) / hosts.length + time * 0.035;
        positions[body.id] = body.parent
            ? { x: origin.x + orbit.rx * Math.cos(angle), y: origin.y + orbit.ry * Math.sin(angle) }
            : origin;
    }
    return positions;
}
export const topologyLinks = [
    { id: "dev", from: "Gateway", to: "dev-01" },
    { id: "worker", from: "Gateway", to: "worker-01" },
    { id: "dedicated", from: "Gateway", to: "db-01" },
    { id: "production", from: "Gateway", to: "dev-02" },
    { id: "app", from: "dev-01", to: "app-1" },
    { id: "database", from: "dev-01", to: "database" },
    { id: "app-2", from: "dev-02", to: "app-2" },
    { id: "app-3", from: "dev-02", to: "app-3" },
];
const radii = Object.fromEntries(topologyBodies.map((body) => [body.id, body.radius]));
export function storyPorts(id: string, positions: Positions) {
    const link = topologyLinks.find((link) => link.id === id)!;
    const from = positions[link.from],
        to = positions[link.to];
    const dx = to.x - from.x,
        dy = to.y - from.y,
        length = Math.hypot(dx, dy);
    return {
        from: {
            x: from.x + (dx / length) * radii[link.from],
            y: from.y + (dy / length) * radii[link.from],
        },
        to: { x: to.x - (dx / length) * radii[link.to], y: to.y - (dy / length) * radii[link.to] },
    };
}
export function storyWire(id: string, positions: Positions, labels: ReadoutBox[] = [], scale = 1) {
    const { from, to } = storyPorts(id, positions);
    const cuts: [number, number][] = [];
    for (const label of labels) {
        let enter = 0,
            exit = 1;
        for (const [start, delta, min, max] of [
            [from.x, to.x - from.x, (label.left - 3) / scale, (label.right + 3) / scale],
            [from.y, to.y - from.y, (label.top - 3) / scale, (label.bottom + 3) / scale],
        ]) {
            if (Math.abs(delta) < 0.00001) {
                if (start < min || start > max) exit = -1;
            } else {
                const a = (min - start) / delta,
                    b = (max - start) / delta;
                enter = Math.max(enter, Math.min(a, b));
                exit = Math.min(exit, Math.max(a, b));
            }
        }
        if (enter < exit) cuts.push([enter, exit]);
    }
    const point = (t: number) =>
        `${number(from.x + (to.x - from.x) * t)} ${number(from.y + (to.y - from.y) * t)}`;
    let cursor = 0,
        path = `M ${point(0)}`;
    for (const [enter, exit] of cuts.sort((a, b) => a[0] - b[0])) {
        if (enter > cursor) path += ` L ${point(enter)}`;
        if (exit > cursor) {
            cursor = exit;
            path += ` M ${point(cursor)}`;
        }
    }
    if (cursor < 1) path += ` L ${point(1)}`;
    return path;
}
export function useStoryMotion(revision: string) {
    const ref = useRef<SVGSVGElement>(null);
    const clock = useRef(0);
    useEffect(() => {
        const svg = ref.current;
        if (!svg) return;
        const bodies = [...svg.querySelectorAll<SVGGElement>("[data-story-node]")].map((el) => ({
            el,
            name: el.dataset.storyNode!,
            radius: Number(el.dataset.radius),
            hatch: el.querySelector<SVGPathElement>("[data-story-globe]")!,
            readout: el.querySelector<SVGGElement>("[data-story-readout]")!,
            labelBox: { x: 0, y: -12, width: 0, height: 0 },
            labelOffsetY: -9,
            moon: el.hasAttribute("data-story-moon"),
        }));
        const wires = [...svg.querySelectorAll<SVGPathElement>("[data-story-wire]")];
        const rings = [...svg.querySelectorAll<SVGEllipseElement>("[data-cluster-ring]")];
        const hosts = bodies
            .filter(
                (body) =>
                    topologyBodies.find((config) => config.id === body.name)?.parent === "Gateway",
            )
            .map((body) => body.name);
        const signals = [...svg.querySelectorAll<SVGGElement>("[data-story-signal]")];
        const reveal = [...svg.querySelectorAll<SVGElement>("[data-story-reveal]")];
        const motion = matchMedia("(prefers-reduced-motion: reduce)");
        let disposed = false;
        let top = 0,
            height = 1,
            scale = 1,
            lastGlobe = -Infinity,
            lastProgress = -1;
        const paintReveal = (scrollTop: number) => {
            const progress = motion.matches
                ? 1
                : clamp((scrollTop - top + innerHeight * 0.85) / Math.max(160, height * 0.8));
            if (progress !== lastProgress) {
                svg.dataset.networkProgress = progress.toFixed(3);
                reveal.forEach((el) => {
                    el.style.opacity = String(
                        motion.matches
                            ? 1
                            : 0.22 +
                                  0.78 * clamp((progress - Number(el.dataset.storyReveal)) / 0.35),
                    );
                });
                lastProgress = progress;
            }
            return progress;
        };
        const paint = (time: number, scrollTop: number) => {
            const progress = paintReveal(scrollTop);
            const positions = topologyAt(time, hosts);
            const updateGlobe = time - lastGlobe >= 1 / 15;
            if (updateGlobe) lastGlobe = time;
            bodies.forEach(({ el, name, radius, hatch }, seed) => {
                const p = positions[name];
                el.setAttribute("transform", `translate(${number(p.x)} ${number(p.y)})`);
                // The intro's scrolling latitudes, without axial tilt.
                if (updateGlobe) hatch.setAttribute("d", globe(radius, seed, time));
            });
            const visibleLabels: ReadoutBox[] = [];
            bodies.forEach(({ name, radius, readout, labelBox, labelOffsetY }) => {
                const p = positions[name];
                const left = (p.x + radius) * scale + 10 + labelBox.x;
                const top = p.y * scale + labelOffsetY + labelBox.y;
                const box = {
                    left,
                    top,
                    right: left + labelBox.width,
                    bottom: top + labelBox.height,
                };
                let clearance = 4;
                for (const other of bodies) {
                    if (other.name === name) continue;
                    const center = positions[other.name];
                    const dx = Math.max(
                        box.left - center.x * scale,
                        0,
                        center.x * scale - box.right,
                    );
                    const dy = Math.max(
                        box.top - center.y * scale,
                        0,
                        center.y * scale - box.bottom,
                    );
                    clearance = Math.min(clearance, Math.hypot(dx, dy) - other.radius * scale);
                }
                for (const other of visibleLabels) {
                    clearance = Math.min(
                        clearance,
                        Math.max(
                            other.left - box.right,
                            box.left - other.right,
                            other.top - box.bottom,
                            box.top - other.bottom,
                        ),
                    );
                }
                // Occlusion never changes a label's anchor. Fade before a crossing
                // and return at the same fixed offset once there is room again.
                const opacity = clamp(clearance / 4);
                readout.style.opacity = String(opacity);
                if (opacity > 0) visibleLabels.push(box);
            });
            wires.forEach((wire) =>
                wire.setAttribute(
                    "d",
                    storyWire(wire.dataset.storyWire!, positions, visibleLabels, scale),
                ),
            );
            rings.forEach((ring) => {
                const p = positions[ring.dataset.clusterRing!];
                ring.setAttribute("cx", number(p.x));
                ring.setAttribute("cy", number(p.y));
            });
            signals.forEach((signal, index) => {
                const id = signal.dataset.storySignal!;
                const { from, to } = storyPorts(id, positions);
                const moon = topologyLinks.find((link) => link.id === id)!.from !== "Gateway";
                const pose = constellationSignal(from, to, time, index, moon);
                signal.setAttribute("transform", pose.transform);
                signal.style.opacity = motion.matches ? "0" : String(pose.opacity * progress);
            });
        };
        // The entrance follows scrolling even when optional orbit motion yields
        // its frame budget on a slower device.
        let revealFrame = 0;
        const stopScroll = observeScroll(() => {
            if (!revealFrame)
                revealFrame = requestScrollFrame((_time, scrollTop) => {
                    revealFrame = 0;
                    paintReveal(scrollTop);
                });
        });
        const stop = animateScene(
            svg,
            (_elapsed, delta, scrollTop) => {
                clock.current += delta;
                paint(clock.current, scrollTop);
            },
            {
                onActivity: ({ active, reducedMotion }) => {
                    svg.dataset.animating = String(active);
                    if (reducedMotion) {
                        clock.current = 0;
                        lastGlobe = -Infinity;
                        paint(0, window.scrollY);
                    }
                },
            },
        );
        const measure = () => {
            const rect = storyLayoutBounds(svg);
            top = rect.top + scrollY;
            height = rect.height;
            scale = rect.width / svg.viewBox.baseVal.width;
            if (scale > 0) {
                bodies.forEach((body) => {
                    body.labelBox = body.readout.getBBox();
                    if (body.moon) {
                        const name = body.readout.querySelector("text")!.getBBox();
                        body.labelOffsetY = -name.y - name.height / 2;
                    }
                });
                bodies.forEach(({ radius, readout, labelOffsetY }) => {
                    readout.setAttribute(
                        "transform",
                        constellationReadoutTransform(radius, scale, labelOffsetY),
                    );
                });
            }
            paint(clock.current, window.scrollY);
        };
        const resize = new ResizeObserver(measure);
        resize.observe(svg);
        window.addEventListener("resize", measure);
        void document.fonts.ready.then(() => {
            if (!disposed) measure();
        });
        measure();
        return () => {
            disposed = true;
            stop();
            stopScroll();
            cancelScrollFrame(revealFrame);
            resize.disconnect();
            window.removeEventListener("resize", measure);
        };
    }, [revision]);
    return ref;
}
