import React from "react";
import { useGrid } from "../../services/tool/gridService";
import { useCenterPoint } from "../../services/tool/centerService";

export default function GridLayer({ scale, points }) {
    const { isActive } = useGrid();
    const centerPoint = useCenterPoint();

    if (!isActive || !centerPoint || !points || points.length < 3) return null;

    // Helper to get Bounding Box of plot points
    const getBBox = (pts) => {
        let minX = pts[0].x, maxX = pts[0].x, minY = pts[0].y, maxY = pts[0].y;
        pts.forEach(p => {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        });
        return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
    };

    const bbox = getBBox(points);
    const dX = bbox.w / 9;
    const dY = bbox.h / 9;

    // Grid Lines (8 horizontal, 8 vertical internal lines)
    const gridLines = [];
    for (let i = 1; i <= 8; i++) {
        // Vertical
        gridLines.push({
            x1: bbox.minX + i * dX, y1: bbox.minY,
            x2: bbox.minX + i * dX, y2: bbox.maxY
        });
        // Horizontal
        gridLines.push({
            x1: bbox.minX, y1: bbox.minY + i * dY,
            x2: bbox.maxX, y2: bbox.minY + i * dY
        });
    }

    return (
        <div id="grid-layer" style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 45 // Lower than Marma
        }}>
            <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                <defs>
                    <clipPath id="grid-boundary-clip">
                        <polygon points={points.map(p => `${p.x},${p.y}`).join(" ")} />
                    </clipPath>
                </defs>
                <g style={{ pointerEvents: "none" }} clipPath="url(#grid-boundary-clip)">
                    {/* 1. Outer Box */}
                    <rect
                        x={bbox.minX} y={bbox.minY} width={bbox.w} height={bbox.h}
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                        opacity={0.8}
                    />

                    {/* 2. Grid Lines (8x8 internal) */}
                    {gridLines.map((line, idx) => (
                        <line
                            key={`vastu-grid-${idx}`}
                            x1={line.x1} y1={line.y1}
                            x2={line.x2} y2={line.y2}
                            stroke="#0f172a"
                            strokeWidth="1"
                            vectorEffect="non-scaling-stroke"
                            strokeDasharray="8,6"
                            opacity={0.7}
                        />
                    ))}
                </g>
            </svg>
        </div>
    );
}
