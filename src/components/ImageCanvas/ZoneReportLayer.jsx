import React, { useState, useEffect } from "react";
import { useShaktiChakra } from "../../services/tool/shaktiChakraService";
import { useCenterPoint } from "../../services/tool/centerService";
import { useRotation } from "../../services/tool/rotateService";

/**
 * Special Layer for Zone Wise Area Report
 * Displays 8, 16, and 32 zone lines simultaneously as requested by the user.
 */
export default function ZoneReportLayer({ scale, points }) {
    const { rotation } = useShaktiChakra();
    const { angle } = useRotation();
    const centerPoint = useCenterPoint();
    const [exportSettings, setExportSettings] = useState(window.vastuExportSettings || { active: false });

    useEffect(() => {
        const handleExportUpdate = (e) => setExportSettings(e.detail);
        window.addEventListener('vastu-export-update', handleExportUpdate);
        return () => window.removeEventListener('vastu-export-update', handleExportUpdate);
    }, []);

    if (!exportSettings.active || exportSettings.reportType !== 'zone') return null;
    if (!centerPoint || !points || points.length < 3) return null;

    const safeRotation = Number(rotation) || 0;

    const renderZoneLines = (count, color, strokeWidth, opacity) => {
        const step = 360 / count;
        const lines = [];
        for (let i = 0; i < count; i++) {
            const lineAngle = (i * step) + safeRotation - (angle || 0);
            const angleRad = (lineAngle - 90) * (Math.PI / 180);

            // Find boundary intersection for this angle
            const rayEnd = {
                x: centerPoint.x + 10000 * Math.cos(angleRad),
                y: centerPoint.y + 10000 * Math.sin(angleRad)
            };

            let intersect = null;
            for (let j = 0; j < points.length; j++) {
                const p1 = points[j];
                const p2 = points[(j + 1) % points.length];

                // Line intersection formula
                const x1 = centerPoint.x, y1 = centerPoint.y;
                const x2 = rayEnd.x, y2 = rayEnd.y;
                const x3 = p1.x, y3 = p1.y;
                const x4 = p2.x, y4 = p2.y;

                const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
                if (den === 0) continue;

                const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
                const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;

                if (t >= 0 && u >= 0 && u <= 1) {
                    intersect = {
                        x: x1 + t * (x2 - x1),
                        y: y1 + t * (y2 - y1)
                    };
                    break;
                }
            }

            if (intersect) {
                lines.push(
                    <line
                        key={`line-${count}-${i}`}
                        x1={centerPoint.x} y1={centerPoint.y}
                        x2={intersect.x} y2={intersect.y}
                        stroke={color}
                        strokeWidth={strokeWidth / scale}
                        opacity={opacity}
                    />
                );
            }
        }
        return lines;
    };

    return (
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 110 }}>
            {/* 32 Zones (Faint) */}
            {renderZoneLines(32, "#94a3b8", 0.5, 0.4)}
            {/* 16 Zones (Medium) */}
            {renderZoneLines(16, "#475569", 1, 0.6)}
            {/* 8 Zones (Strong) */}
            {renderZoneLines(8, "#1e293b", 1.5, 0.8)}
        </svg>
    );
}
