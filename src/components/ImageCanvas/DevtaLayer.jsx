import React, { useState, useEffect } from 'react';
import { useDevta } from '../../services/tool/devtaService';
import { useShaktiChakra } from '../../services/tool/shaktiChakraService';
import { getBoundaryIntersection } from '../../services/tool/drawingService';
import { useRotation } from '../../services/tool/rotateService';

/**
 * 🕉️ VASTU UNIFIED MANDALA (Marma & 4 Devtas)
 */

const FOUR_INNER_DEVTAS = [
    { id: "north", name: "Bhudhar", startAngle: 315, endAngle: 45, color: "rgba(74, 222, 128, 0.4)", textColor: "#065f46" },
    { id: "east", name: "Aryama", startAngle: 45, endAngle: 135, color: "rgba(96, 165, 250, 0.4)", textColor: "#1e3a8a" },
    { id: "south", name: "Vivasvan", startAngle: 135, endAngle: 225, color: "rgba(251, 146, 60, 0.4)", textColor: "#7c2d12" },
    { id: "west", name: "Mitra", startAngle: 225, endAngle: 315, color: "rgba(192, 132, 252, 0.4)", textColor: "#581c87" }
];

const EIGHT_MIDDLE_DEVTAS = [
    { name: "", startAngle: 337.5, endAngle: 22.5 },
    { name: "Aap", startAngle: 22.5, endAngle: 45, color: "rgba(234, 179, 8, 0.25)", textColor: "#854d0e" },
    { name: "Aaphavatsa", startAngle: 45, endAngle: 67.5, color: "rgba(234, 179, 8, 0.5)", textColor: "#854d0e" },
    { name: "", startAngle: 67.5, endAngle: 112.5 },
    { name: "Savita", startAngle: 112.5, endAngle: 135, color: "rgba(217, 70, 239, 0.25)", textColor: "#701a75" },
    { name: "Savitra", startAngle: 135, endAngle: 157.5, color: "rgba(217, 70, 239, 0.5)", textColor: "#701a75" },
    { name: "", startAngle: 157.5, endAngle: 202.5 },
    { name: "Indra", startAngle: 202.5, endAngle: 225, color: "rgba(45, 212, 191, 0.25)", textColor: "#134e4a" },
    { name: "Indrajaya", startAngle: 225, endAngle: 247.5, color: "rgba(45, 212, 191, 0.5)", textColor: "#134e4a" },
    { name: "", startAngle: 247.5, endAngle: 292.5 },
    { name: "Rudra", startAngle: 292.5, endAngle: 315, color: "rgba(220, 38, 38, 0.25)", textColor: "#7f1d1d" },
    { name: "Rajyakshma", startAngle: 315, endAngle: 337.5, color: "rgba(220, 38, 38, 0.5)", textColor: "#7f1d1d" }
];


const THIRTY_TWO_OUTER_DEVTAS = [
    { name: "Soma", startAngle: 348.75, endAngle: 0 },
    { name: "Bhujang", startAngle: 0, endAngle: 11.25 },
    { name: "Aditi", startAngle: 11.25, endAngle: 22.5 },
    { name: "Diti", startAngle: 22.5, endAngle: 33.75 },
    { name: "Shikhi", startAngle: 33.75, endAngle: 45 },
    { name: "Parjanya", startAngle: 45, endAngle: 56.25 },
    { name: "Jayant", startAngle: 56.25, endAngle: 67.5 },
    { name: "Mahendra", startAngle: 67.5, endAngle: 78.75 },
    { name: "Surya", startAngle: 78.75, endAngle: 90 },
    { name: "Satya", startAngle: 90, endAngle: 101.25 },
    { name: "Bhrisha", startAngle: 101.25, endAngle: 112.5 },
    { name: "Antariksha", startAngle: 112.5, endAngle: 123.75 },
    { name: "Agni", startAngle: 123.75, endAngle: 135 },
    { name: "Pusha", startAngle: 135, endAngle: 146.25 },
    { name: "Vitatha", startAngle: 146.25, endAngle: 157.5 },
    { name: "Grihakshat", startAngle: 157.5, endAngle: 168.75 },
    { name: "Yama", startAngle: 168.75, endAngle: 180 },
    { name: "Gandharva", startAngle: 180, endAngle: 191.25 },
    { name: "Bhringraj", startAngle: 191.25, endAngle: 202.5 },
    { name: "Mriga", startAngle: 202.5, endAngle: 213.75 },
    { name: "Pitri", startAngle: 213.75, endAngle: 225 },
    { name: "Dauvarika", startAngle: 225, endAngle: 236.25 },
    { name: "Sugriva", startAngle: 236.25, endAngle: 247.5 },
    { name: "Pushpadanta", startAngle: 247.5, endAngle: 258.75 },
    { name: "Varuna", startAngle: 258.75, endAngle: 270 },
    { name: "Asura", startAngle: 270, endAngle: 281.25 },
    { name: "Sosha", startAngle: 281.25, endAngle: 292.5 },
    { name: "Papyakshman", startAngle: 292.5, endAngle: 303.75 },
    { name: "Roga", startAngle: 303.75, endAngle: 315 },
    { name: "Naga", startAngle: 315, endAngle: 326.25 },
    { name: "Mukhya", startAngle: 326.25, endAngle: 337.5 },
    { name: "Bhallat", startAngle: 337.5, endAngle: 348.75 }
];

export default function DevtaLayer({ scale, centerPoint, points }) {
    const { isActive, activeLayers, mandalaStyle, mandalaSize, showNames, showPoints, showDevtaDetails } = useDevta();
    const [devtaDetails, setDevtaDetails] = useState({});

    // Fetch Devta details from API
    useEffect(() => {
        const fetchDevtaDetails = async () => {
            try {
                const response = await fetch('api/devta_details.php');
                const data = await response.json();
                if (data.status === 'success' && data.data) {
                    const detailMap = {};
                    data.data.forEach(item => {
                        detailMap[item.devta_name.toLowerCase()] = item;
                    });
                    setDevtaDetails(detailMap);
                }
            } catch (error) {
                console.error("Error fetching Devta details:", error);
            }
        };

        if (isActive && showDevtaDetails) {
            fetchDevtaDetails();
        }
    }, [isActive, showDevtaDetails]);

    const showBrahmasthan = activeLayers?.brahmasthan !== false;
    const showInnerDevtas = activeLayers?.fourDevtas !== false;
    const showMiddleDevtas = activeLayers?.eightDevtas !== false;
    const showOuterDevtas = activeLayers?.thirtyTwoDevtas !== false;
    const { rotation } = useShaktiChakra();
    const { angle } = useRotation();

    const [exportSettings, setExportSettings] = useState(window.vastuExportSettings || { active: false });

    useEffect(() => {
        const handleExportUpdate = (e) => setExportSettings(e.detail);
        window.addEventListener('vastu-export-update', handleExportUpdate);
        return () => window.removeEventListener('vastu-export-update', handleExportUpdate);
    }, []);

    // ✅ HOOKS RULE: All hooks MUST be called before any early returns
    const getScaledPoints = React.useCallback((factor) => {
        if (!centerPoint || !points) return "";
        return points.map(p => ({
            x: centerPoint.x + (p.x - centerPoint.x) * factor,
            y: centerPoint.y + (p.y - centerPoint.y) * factor
        })).map(p => `${p.x},${p.y}`).join(" ");
    }, [points, centerPoint]);

    const getWedgePoints = React.useCallback((startDeg, endDeg) => {
        if (!centerPoint) return "";
        const safeRot = (rotation || 0) % 360;
        const currentAngle = (angle || 0);
        const s = (startDeg + safeRot - currentAngle - 90) * (Math.PI / 180);
        const e = (endDeg + (endDeg < startDeg ? 360 : 0) + safeRot - currentAngle - 90) * (Math.PI / 180);
        const r = 5000;
        const p1 = `${centerPoint.x},${centerPoint.y}`;
        const p2 = `${centerPoint.x + Math.cos(s) * r},${centerPoint.y + Math.sin(s) * r}`;
        const p3 = `${centerPoint.x + Math.cos(e) * r},${centerPoint.y + Math.sin(e) * r}`;
        return `${p1} ${p2} ${p3}`;
    }, [centerPoint, rotation, angle]);

    // ✅ These useMemo hooks MUST be here (before early returns) to satisfy Rules of Hooks
    const outerOuterF_const = 1.0;
    const middleOuterF_const = 0.75;
    const brahmaOuterF_const = 0.50;
    const marmaInnerF_const = 0.25;

    const finalOuterBoundary = React.useMemo(() => getScaledPoints(outerOuterF_const), [getScaledPoints]);
    const middleRingOuter = React.useMemo(() => getScaledPoints(middleOuterF_const), [getScaledPoints]);
    const fullRingOuter = React.useMemo(() => getScaledPoints(brahmaOuterF_const), [getScaledPoints]);
    const fullRingInner = React.useMemo(() => getScaledPoints(marmaInnerF_const), [getScaledPoints]);

    // Early returns AFTER all hooks
    if (!isActive) return null;
    if (exportSettings.active && exportSettings.reportType !== 'devta') return null;
    if (!centerPoint || !points || points.length < 3) return null;

    // --- GEOMETRY HELPERS ---
    const outerOuterF = outerOuterF_const;
    const middleOuterF = middleOuterF_const;
    const brahmaOuterF = brahmaOuterF_const;
    const marmaInnerF = marmaInnerF_const;

    const getMidAngle = (s, e) => {
        let diff = e - s;
        if (diff < 0) diff += 360;
        return (s + diff / 2) % 360;
    };

    const renderDetailText = (name, x, y, color, scale, rotation, angle) => {
        const details = devtaDetails[name.toLowerCase()];
        if (!details || !showDevtaDetails) return null;

        const trunc = (str, n = 14) => str && str.length > n ? str.slice(0, n) + '…' : str;

        const detailList = [];
        if (details.hawan) detailList.push(`H: ${trunc(details.hawan)}`);
        if (details.bhog) detailList.push(`B: ${trunc(details.bhog)}`);
        if (details.attributes) detailList.push(`A: ${trunc(details.attributes)}`);

        if (detailList.length === 0) return null;

        const fontSize = 8 / scale;
        const lineGap = 11 / scale;
        const bgH = 9 / scale;
        const bgW = 80 / scale;
        const bgPad = 1.5 / scale;

        // Round anchor to nearest pixel to avoid subpixel blur
        const ax = Math.round(x);
        const ay = Math.round(y);

        return (
            <g transform={`rotate(${(rotation || 0) - (angle || 0)}, ${ax}, ${ay})`}>
                {detailList.map((text, idx) => {
                    const ty = Math.round(ay + (idx + 1) * lineGap);
                    const rx = Math.round(ax - bgW / 2);
                    const ry = Math.round(ty - bgH / 2 - bgPad);
                    const rw = Math.round(bgW);
                    const rh = Math.round(bgH + bgPad * 2);
                    return (
                        <g key={idx}>
                            <rect
                                x={rx}
                                y={ry}
                                width={rw}
                                height={rh}
                                rx={Math.round(bgH / 2)}
                                fill="rgba(255,255,255,0.88)"
                                stroke="rgba(0,0,0,0.08)"
                                strokeWidth={0.5 / scale}
                                shapeRendering="crispEdges"
                            />
                            <text
                                x={ax}
                                y={ty}
                                fontSize={fontSize}
                                fontWeight="700"
                                fontFamily="Arial, Helvetica, sans-serif"
                                fill={color}
                                textAnchor="middle"
                                dominantBaseline="central"
                                textRendering="geometricPrecision"
                                style={{ userSelect: "none" }}
                            >
                                {text}
                            </text>
                        </g>
                    );
                })}
            </g>
        );
    };








    // (finalOuterBoundary, middleRingOuter, fullRingOuter, fullRingInner are already computed above early returns)

    if (mandalaStyle === 'grid') {
        const minX = Math.min(...points.map(p => p.x));
        const minY = Math.min(...points.map(p => p.y));
        const maxX = Math.max(...points.map(p => p.x));
        const maxY = Math.max(...points.map(p => p.y));

        const width = maxX - minX;
        const height = maxY - minY;
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        const scaledWidth = width * (mandalaSize || 1);
        const scaledHeight = height * (mandalaSize || 1);
        const gridX = centerX - scaledWidth / 2;
        const gridY = centerY - scaledHeight / 2;
        const cellW = scaledWidth / 9;
        const cellH = scaledHeight / 9;

        const renderDevtaLabel = (d, type, i) => {
            if (type === 'outer') return null;
            const isInner = type === 'inner';
            const isMid = type === 'mid';
            const x = isInner ? gridX + d.c * cellW : gridX + d.c * cellW + cellW / 2;
            const y = isInner ? gridY + d.r * cellH : gridY + d.r * cellH + cellH / 2;
            const baseFontSize = isInner ? 12 : (isMid ? 9 : 8);
            const color = isMid ? (EIGHT_MIDDLE_DEVTAS.find(m => m.name === d.name)?.textColor || "#f97316") : (isInner ? d.color : "#64748b");

            return (
                <g key={`${type}-${i}`}>
                    <text
                        x={x}
                        y={y}
                        fontSize={baseFontSize / scale}
                        fontWeight={isInner ? "900" : (isMid ? "700" : "600")}
                        fill={color}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${(rotation || 0) - (angle || 0)}, ${x}, ${y})`}
                        style={isInner ? { paintOrder: "stroke", stroke: "#fff", strokeWidth: `${3 / scale}px` } : {}}
                    >
                        {d.name.toUpperCase()}
                    </text>
                    {renderDetailText(d.name, x, y, color, scale, rotation, angle)}
                </g>
            );
        };

        const outerDevtaPlacements = [
            { name: "Shikhi", r: 0, c: 8 }, { name: "Parjanya", r: 1, c: 8 }, { name: "Jayant", r: 2, c: 8 }, { name: "Mahendra", r: 3, c: 8 },
            { name: "Surya", r: 4, c: 8 }, { name: "Satya", r: 5, c: 8 }, { name: "Bhrisha", r: 6, c: 8 }, { name: "Antariksha", r: 7, c: 8 },
            { name: "Agni", r: 8, c: 8 }, { name: "Pusha", r: 8, c: 7 }, { name: "Vitatha", r: 8, c: 6 }, { name: "Grihakshat", r: 8, c: 5 },
            { name: "Yama", r: 8, c: 4 }, { name: "Gandharva", r: 8, c: 3 }, { name: "Bhringraj", r: 8, c: 2 }, { name: "Mriga", r: 8, c: 1 },
            { name: "Pitri", r: 8, c: 0 }, { name: "Dauvarika", r: 7, c: 0 }, { name: "Sugriva", r: 6, c: 0 }, { name: "Pushpadanta", r: 5, c: 0 },
            { name: "Varuna", r: 4, c: 0 }, { name: "Asura", r: 3, c: 0 }, { name: "Sosha", r: 2, c: 0 }, { name: "Papyakshman", r: 1, c: 0 },
            { name: "Roga", r: 0, c: 0 }, { name: "Naga", r: 0, c: 1 }, { name: "Mukhya", r: 0, c: 2 }, { name: "Bhallat", r: 0, c: 3 },
            { name: "Soma", r: 0, c: 4 }, { name: "Bhujang", r: 0, c: 5 }, { name: "Aditi", r: 0, c: 6 }, { name: "Diti", r: 0, c: 7 }
        ];

        const innerDevtaPlacements = [
            { name: "Bhudhar", r: 1.5, c: 4.5, color: "#166534" },
            { name: "Aryama", r: 4.5, c: 7.5, color: "#1e3a8a" },
            { name: "Vivasvan", r: 7.5, c: 4.5, color: "#9a3412" },
            { name: "Mitra", r: 4.5, c: 1.5, color: "#581c87" }
        ];

        const middleDevtaPlacements = [
            { name: "Aap", r: 1, c: 6 }, { name: "Aaphavatsa", r: 2, c: 7 },
            { name: "Savita", r: 6, c: 7 }, { name: "Savitra", r: 7, c: 6 },
            { name: "Indra", r: 7, c: 2 }, { name: "Indrajaya", r: 6, c: 1 },
            { name: "Rudra", r: 2, c: 1 }, { name: "Rajyakshma", r: 1, c: 2 }
        ];


        return (
            <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, zIndex: 95, pointerEvents: "none", overflow: 'visible' }} textRendering="geometricPrecision" shapeRendering="geometricPrecision">
                <defs>
                    <clipPath id="global-plot-clip">
                        <polygon points={points.map(p => `${p.x},${p.y}`).join(" ")} />
                    </clipPath>
                </defs>
                <g>
                    <g clipPath="url(#global-plot-clip)">
                        {/* Horizontal Lines */}
                        {[...Array(10)].map((_, i) => (
                            <line key={`h-${i}`} x1={gridX} y1={gridY + i * cellH} x2={gridX + scaledWidth} y2={gridY + i * cellH} stroke="rgba(0,0,0,0.2)" strokeWidth={1 / scale} />
                        ))}
                        {/* Vertical Lines */}
                        {[...Array(10)].map((_, i) => (
                            <line key={`v-${i}`} x1={gridX + i * cellW} y1={gridY} x2={gridX + i * cellW} y2={gridY + scaledHeight} stroke="rgba(0,0,0,0.2)" strokeWidth={1 / scale} />
                        ))}
                        {showBrahmasthan && (
                            <rect x={gridX + 3 * cellW} y={gridY + 3 * cellH} width={3 * cellW} height={3 * cellH} fill="rgba(251, 191, 36, 0.15)" stroke="#f59e0b" strokeWidth={2 / scale} strokeDasharray={4 / scale} />
                        )}
                    </g>
                    {showNames && (
                        <g>
                            {showOuterDevtas && outerDevtaPlacements.map((d, i) => renderDevtaLabel(d, 'outer', i))}
                            {showInnerDevtas && innerDevtaPlacements.map((d, i) => renderDevtaLabel(d, 'inner', i))}
                            {showMiddleDevtas && middleDevtaPlacements.map((d, i) => renderDevtaLabel(d, 'mid', i))}
                        </g>
                    )}
                </g>
            </svg>
        );
    }

    // --- CIRCULAR MANDALA (Default) ---
    return (
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, zIndex: 95, pointerEvents: "none", overflow: 'visible' }} textRendering="geometricPrecision" shapeRendering="geometricPrecision">

            <defs>
                <clipPath id="global-plot-clip">
                    <polygon points={points.map(p => `${p.x},${p.y}`).join(" ")} />
                </clipPath>
                {FOUR_INNER_DEVTAS.map(devta => (
                    <clipPath key={`clip-${devta.id}`} id={`clip-sector-${devta.id}`}>
                        <polygon points={getWedgePoints(devta.startAngle, devta.endAngle)} />
                    </clipPath>
                ))}
            </defs>

            <g clipPath="url(#global-plot-clip)">
                {/* 4 INNER DEVTAS RING */}
                {showInnerDevtas && FOUR_INNER_DEVTAS.map((devta, i) => {
                    const midA = getMidAngle(devta.startAngle, devta.endAngle);
                    const finalA = (midA + (rotation || 0) - (angle || 0) + 360) % 360;
                    const intersection = getBoundaryIntersection(centerPoint, finalA, points);
                    let lx = centerPoint.x, ly = centerPoint.y;
                    if (intersection) {
                        const labelF = (brahmaOuterF + marmaInnerF) / 2;
                        lx = centerPoint.x + (intersection.x - centerPoint.x) * labelF;
                        ly = centerPoint.y + (intersection.y - centerPoint.y) * labelF;
                    }

                    return (
                        <g key={`devta-group-${i}`} clipPath={`url(#clip-sector-${devta.id})`}>
                            <path
                                d={`M ${fullRingOuter} Z M ${fullRingInner} Z`}
                                fill={devta.color}
                                fillRule="evenodd"
                                stroke="rgba(255,255,255,0.4)"
                                strokeWidth="1"
                                vectorEffect="non-scaling-stroke"
                            />
                            <text
                                x={lx} y={ly} fontSize={12 / scale} fontWeight="900" textAnchor="middle" dominantBaseline="middle" fill={devta.textColor}
                                style={{ paintOrder: "stroke", stroke: "#ffffff", strokeWidth: `${3 / scale}px`, userSelect: "none" }}
                            >
                                {devta.name.toUpperCase()}
                            </text>
                            {renderDetailText(devta.name, lx, ly, devta.textColor, scale, rotation, angle)}
                        </g>

                    );
                })}

                {/* 8 MIDDLE DEVTAS RING */}
                {showMiddleDevtas && EIGHT_MIDDLE_DEVTAS.map((devta, i) => {
                    if (!devta.name) return null;
                    const midA = getMidAngle(devta.startAngle, devta.endAngle);
                    const finalA = (midA + (rotation || 0) - (angle || 0) + 360) % 360;
                    const intersection = getBoundaryIntersection(centerPoint, finalA, points);
                    let lx = centerPoint.x, ly = centerPoint.y;
                    if (intersection) {
                        const labelF = (middleOuterF + brahmaOuterF) / 2;
                        lx = centerPoint.x + (intersection.x - centerPoint.x) * labelF;
                        ly = centerPoint.y + (intersection.y - centerPoint.y) * labelF;
                    }

                    return (
                        <g key={`middle-devta-${i}`}>
                            <clipPath id={`clip-middle-${i}`}><polygon points={getWedgePoints(devta.startAngle, devta.endAngle)} /></clipPath>
                            <g clipPath={`url(#clip-middle-${i})`}>
                                <path
                                    d={`M ${middleRingOuter} Z M ${fullRingOuter} Z`}
                                    fill={devta.color || "rgba(148, 163, 184, 0.15)"}
                                    fillRule="evenodd"
                                    stroke="rgba(0,0,0,0.1)"
                                    strokeWidth="0.5"
                                    vectorEffect="non-scaling-stroke"
                                />
                                <text
                                    x={lx} y={ly} fontSize={10 / scale} fontWeight="800" textAnchor="middle" dominantBaseline="middle" fill={devta.textColor || "#475569"}
                                    style={{ paintOrder: "stroke", stroke: "#ffffff", strokeWidth: `${2 / scale}px`, userSelect: "none" }}
                                >
                                    {devta.name.toUpperCase()}
                                </text>
                                {renderDetailText(devta.name, lx, ly, devta.textColor || "#475569", scale, rotation, angle)}
                            </g>

                        </g>
                    );
                })}

                {/* 32 OUTER DEVTAS RING */}
                {showOuterDevtas && THIRTY_TWO_OUTER_DEVTAS.map((devta, i) => {
                    const midA = getMidAngle(devta.startAngle, devta.endAngle);
                    const finalA = (midA + (rotation || 0) - (angle || 0) + 360) % 360;
                    const intersection = getBoundaryIntersection(centerPoint, finalA, points);
                    let lx = centerPoint.x, ly = centerPoint.y;
                    if (intersection) {
                        const labelF = (outerOuterF + middleOuterF) / 2;
                        lx = centerPoint.x + (intersection.x - centerPoint.x) * labelF;
                        ly = centerPoint.y + (intersection.y - centerPoint.y) * labelF;
                    }

                    return (
                        <g key={`outer-devta-${i}`}>
                            <clipPath id={`clip-outer-${i}`}><polygon points={getWedgePoints(devta.startAngle, devta.endAngle)} /></clipPath>
                            <g clipPath={`url(#clip-outer-${i})`}>
                                <path
                                    d={`M ${finalOuterBoundary} Z M ${middleRingOuter} Z`}
                                    fill={i % 2 === 0 ? "rgba(71, 85, 105, 0.05)" : "rgba(148, 163, 184, 0.05)"}
                                    fillRule="evenodd"
                                    stroke="rgba(0,0,0,0.1)"
                                    strokeWidth="0.5"
                                    vectorEffect="non-scaling-stroke"
                                />
                            </g>

                        </g>
                    );
                })}

                {/* CENTRAL MARMA */}
                {showBrahmasthan && (
                    <g>
                        <polygon
                            points={fullRingInner}
                            fill="rgba(255, 235, 59, 1)"
                            stroke="#ca8a04"
                            strokeWidth="2"
                            vectorEffect="non-scaling-stroke"
                        />
                        <text x={centerPoint.x} y={centerPoint.y} fontSize={10 / scale} fontWeight="900" textAnchor="middle" dominantBaseline="middle" fill="#78350f" style={{ paintOrder: "stroke", stroke: "#ffffff", strokeWidth: `${3.5 / scale}px`, userSelect: "none" }}>MARMA</text>
                    </g>
                )}
            </g>

        </svg>
    );
}
