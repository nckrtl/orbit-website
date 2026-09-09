export type Point = [number, number];

export const objectScale = 0.75;

export function scalePoint(point: Point, center: Point): Point {
    return [
        center[0] + (point[0] - center[0]) * objectScale,
        center[1] + (point[1] - center[1]) * objectScale,
    ];
}

export function objectTransform(center: Point) {
    return `translate(${center.join(" ")}) scale(${objectScale}) translate(${-center[0]} ${-center[1]})`;
}
