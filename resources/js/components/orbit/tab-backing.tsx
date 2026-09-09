type TabBackingProps = {
    frontY?: number;
    width: number;
    height: number;
    radius: number;
};

export function TabBacking({ frontY = 0, width, height, radius: r }: TabBackingProps) {
    // All three illustrations use the same thin extrusion in their shared projection.
    const x = 6;
    const y = frontY - 6;
    const right = x + width;
    const bottom = y + height;
    const dy = y - frontY;
    // The visible side follows the rounded front perimeter, then returns along
    // the matching rear perimeter. Tangent endpoints keep the silhouette smooth.
    const angle = Math.atan2(-x, dy);
    const start = [r + r * Math.cos(angle), frontY + r + r * Math.sin(angle)];
    const end = [
        width - r + r * Math.cos(angle + Math.PI),
        frontY + height - r + r * Math.sin(angle + Math.PI),
    ];
    const side = `M ${start.join(" ")} A ${r} ${r} 0 0 1 ${r} ${frontY} H ${width - r} A ${r} ${r} 0 0 1 ${width} ${frontY + r} V ${frontY + height - r} A ${r} ${r} 0 0 1 ${end.join(" ")} L ${end[0] + x} ${end[1] + dy} A ${r} ${r} 0 0 0 ${right} ${bottom - r} V ${y + r} A ${r} ${r} 0 0 0 ${right - r} ${y} H ${x + r} A ${r} ${r} 0 0 0 ${start[0] + x} ${start[1] + dy} Z`;
    return (
        <>
            <path
                data-tab-backing
                data-radius={r}
                d={`M ${x + r} ${y} H ${right - r} A ${r} ${r} 0 0 1 ${right} ${y + r} V ${bottom - r} A ${r} ${r} 0 0 1 ${right - r} ${bottom} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${bottom - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`}
                className="orbit-capability__tab-backing"
                vectorEffect="non-scaling-stroke"
            />
            <path
                data-tab-side
                d={side}
                className="orbit-capability__tab-side"
                vectorEffect="non-scaling-stroke"
            />
        </>
    );
}
