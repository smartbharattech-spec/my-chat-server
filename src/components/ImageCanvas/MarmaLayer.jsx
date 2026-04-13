import React, { useState, useEffect } from "react";
import { useMarma } from "../../services/tool/marmaService";
import { useShaktiChakra } from "../../services/tool/shaktiChakraService";
import { useCenterPoint } from "../../services/tool/centerService";
import { getBoundaryIntersection } from "../../services/tool/drawingService";

export default function MarmaLayer({ scale, points }) {
    const { isActive } = useMarma();
    const { rotation } = useShaktiChakra();
    const centerPoint = useCenterPoint();

    const [exportSettings, setExportSettings] = useState(window.vastuExportSettings || { active: false });

    useEffect(() => {
        const handleExportUpdate = (e) => setExportSettings(e.detail);
        window.addEventListener('vastu-export-update', handleExportUpdate);
        return () => window.removeEventListener('vastu-export-update', handleExportUpdate);
    }, []);

    // Export Visibility Logic
    if (exportSettings.active) {
        if (exportSettings.reportType !== 'marma') return null;
    } else {
        if (!isActive || !centerPoint || !points || points.length < 3) return null;
    }

    if (!centerPoint || !points || points.length < 3) return null;

    const safeRotation = Number(rotation) || 0;

    // 32 Vastu Zones Names (Matching ShaktiChakraService)
    const zones32 = [
        "N5", "N6", "N7", "N8", "E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8",
        "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "W1", "W2", "W3", "W4",
        "W5", "W6", "W7", "W8", "N1", "N2", "N3", "N4"
    ];

    // Helper to get boundary point for a specific boundary index (0-31)
    // index X is the transition BETWEEN zones32[X-1] and zones32[X]
    const getBoundaryPoint = (idx) => {
        // Angles are 0 to 360. 0 deg is North (N5 offset)
        // Transitions are at exact multiples of 11.25
        const boundaryAngle = (idx * 11.25) + safeRotation;
        return getBoundaryIntersection(centerPoint, boundaryAngle, points);
    };

    // Connections based on transitions (indices from zones32)
    const boundaryPairs = [
        // Diagonal 1: NE to SW (NE-SW Axis)
        { from: 4, to: 20 },  // Center: N8|E1 (NE) -> S8|W1 (SW)
        { from: 3, to: 21 },  // Flank 1: N7|N8 -> W1|W2
        { from: 5, to: 19 },  // Flank 2: E1|E2 -> S7|S8

        // Diagonal 2: NW to SE (NW-SE Axis)
        { from: 28, to: 12 }, // Center: W8|N1 (NW) -> E8|S1 (SE)
        { from: 29, to: 11 }, // Flank 1: N1|N2 -> E7|E8 (User Requested)
        { from: 27, to: 13 }, // Flank 2: W7|W8 -> S1|S2
    ];

    const lines = [];
    boundaryPairs.forEach(pair => {
        const p1 = getBoundaryPoint(pair.from);
        const p2 = getBoundaryPoint(pair.to);
        if (p1 && p2) {
            // Push as a SINGLE straight line between the two boundary points
            lines.push({ p1, p2 });
        }
    });

    // Intersection logic
    const intersect = (l1, l2) => {
        const x1 = l1.p1.x, y1 = l1.p1.y, x2 = l1.p2.x, y2 = l1.p2.y;
        const x3 = l2.p1.x, y3 = l2.p1.y, x4 = l2.p2.x, y4 = l2.p2.y;
        const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        if (denom === 0) return null;
        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
        if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
            return { x: x1 + ua * (x2 - x1), y: y1 + ua * (y2 - y1) };
        }
        return null;
    };

    const marmaPoints = [];
    for (let i = 0; i < lines.length; i++) {
        for (let j = i + 1; j < lines.length; j++) {
            const pt = intersect(lines[i], lines[j]);
            if (pt) {
                if (!marmaPoints.some(p => Math.abs(p.x - pt.x) < 0.5 && Math.abs(p.y - pt.y) < 0.5)) {
                    marmaPoints.push(pt);
                }
            }
        }
    }

    return (
        <div id="marma-layer" style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 120
        }}>
            <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                <defs>
                    <clipPath id="marma-boundary-clip">
                        <polygon points={points.map(p => `${p.x},${p.y}`).join(" ")} />
                    </clipPath>
                </defs>
                <g style={{ pointerEvents: "none" }} clipPath="url(#marma-boundary-clip)">
                    {/* 1. Connection Lines */}
                    {lines.map((line, idx) => (
                        <line
                            key={idx}
                            x1={line.p1.x} y1={line.p1.y}
                            x2={line.p2.x} y2={line.p2.y}
                            stroke="#1e3a8a"
                            strokeWidth={1.5 / scale}
                            strokeDasharray={`${8 / scale},${4 / scale}`}
                            opacity={0.8}
                        />
                    ))}
                    {/* 2. Marma Dots (Intersections Only) */}
                    {marmaPoints.map((p, idx) => (
                        <circle
                            key={idx}
                            cx={p.x} cy={p.y}
                            r={4.5 / scale}
                            fill="#1e3a8a"
                            stroke="#fff"
                            strokeWidth={1.5 / scale}
                            style={{ filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.8))' }}
                        />
                    ))}
                </g>
            </svg>
        </div>
    );
}
