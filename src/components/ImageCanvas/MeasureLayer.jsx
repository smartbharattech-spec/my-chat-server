import React from 'react';
import { useTapeMeasure } from '../../services/tool/measureService';
import { useScale } from '../../services/tool/scaleService';
import { useRotation } from '../../services/tool/rotateService';

export default function MeasureLayer({ scale }) {
    const tapeState = useTapeMeasure();
    const {
        points, currentStart, currentEnd, tempEnd, isActive,
        selectedMeasurementIndex, draggedPointInfo,
        selectMeasurement, startDraggingPoint, deleteMeasurement, clearSelection
    } = tapeState;
    const { pixelsPerFoot } = useScale();
    const { angle } = useRotation();

    const formatDistance = (distPx) => {
        const ppf = (pixelsPerFoot && pixelsPerFoot > 0) ? pixelsPerFoot : 30; // robust default if scale not set
        const totalFt = distPx / ppf;
        let ft = Math.floor(totalFt);
        let inch = Math.round((totalFt - ft) * 12);

        if (inch === 12) {
            ft += 1;
            inch = 0;
        }

        const unitString = `${ft}' ${inch}"`;
        return pixelsPerFoot ? unitString : `${unitString} (Set Scale)`;
    };

    const handleLineClick = (e, index) => {
        e.stopPropagation();
        selectMeasurement(index);
    };

    const handlePointPointerDown = (e, index, type) => {
        // e.stopPropagation() removed so global ImageCanvas pointer tracking works
        if (e.target.setPointerCapture) {
            e.target.setPointerCapture(e.pointerId);
        }
        startDraggingPoint(index, type);
    };

    const handleDeletePointerDown = (e, index) => {
        e.stopPropagation();
        e.preventDefault();
        deleteMeasurement(index);
    };

    // Close selection if clicked anywhere on the SVG background (not on a child element)
    const handleSvgPointerDown = (e) => {
        if (e.target !== e.currentTarget) return;
        if (!isActive && selectedMeasurementIndex !== null) {
            clearSelection();
        }
    };

    const renderLine = (p1, p2, index, isLive = false) => {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distPx = Math.sqrt(dx * dx + dy * dy);
        const label = formatDistance(distPx);
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;

        const isSelected = index === selectedMeasurementIndex;
        // Make color prominent if selected
        let color = '#2563eb';
        if (isLive) {
            color = currentEnd ? '#16a34a' : '#f97316';
        } else if (isSelected) {
            color = '#3b82f6';
        }

        const isDashed = isLive && !currentEnd;

        return (
            <g key={isLive ? 'live' : `tape-fixed-${index}`}>
                {/* Invisible thicker line for easier clicking */}
                {!isLive && (
                    <line
                        x1={p1.x} y1={p1.y}
                        x2={p2.x} y2={p2.y}
                        stroke="transparent"
                        strokeWidth={20 / scale}
                        style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                        onClick={(e) => handleLineClick(e, index)}
                    />
                )}
                <line
                    x1={p1.x} y1={p1.y}
                    x2={p2.x} y2={p2.y}
                    stroke={color}
                    strokeWidth={(isSelected ? 3.5 : 2.5) / scale}
                    strokeDasharray={isDashed ? `${6 / scale},${3 / scale}` : 'none'}
                    opacity={isDashed ? 0.7 : 1}
                    style={{
                        cursor: !isLive ? 'pointer' : 'default',
                        pointerEvents: !isLive ? 'auto' : 'none'
                    }}
                    onClick={(e) => { if (!isLive) handleLineClick(e, index); }}
                />

                {/* Visible Endpoints */}
                <circle cx={p1.x} cy={p1.y} r={5 / scale} fill={color} />
                <circle cx={p2.x} cy={p2.y} r={5 / scale} fill={color} />

                {/* Constant Hit Areas (Always Grabbable) */}
                {!isLive && (
                    <>
                        <circle
                            cx={p1.x} cy={p1.y}
                            r={24 / scale}
                            fill="transparent"
                            style={{ cursor: 'grab', pointerEvents: 'auto' }}
                            onPointerDown={(e) => handlePointPointerDown(e, index, 'start')}
                        />
                        <circle
                            cx={p2.x} cy={p2.y}
                            r={24 / scale}
                            fill="transparent"
                            style={{ cursor: 'grab', pointerEvents: 'auto' }}
                            onPointerDown={(e) => handlePointPointerDown(e, index, 'end')}
                        />
                    </>
                )}

                {/* Distance label & Delete button */}
                <g
                    style={{
                        transform: `rotate(${-angle}deg)`,
                        transformOrigin: `${mx}px ${my}px`,
                        pointerEvents: 'visiblePainted', // Changed from 'none' to allow child interactions
                        userSelect: 'none',
                    }}
                >
                    <text
                        x={mx} y={my}
                        fill={isLive ? (isDashed ? '#f97316' : '#1e40af') : (isSelected ? '#1d4ed8' : '#1e40af')}
                        fontSize={14 / scale}
                        fontWeight="900"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                            paintOrder: 'stroke',
                            stroke: '#fff',
                            strokeWidth: 3 / scale,
                            cursor: !isLive ? 'pointer' : 'none',
                            pointerEvents: !isLive ? 'auto' : 'none',
                        }}
                        onClick={(e) => { if (!isLive) handleLineClick(e, index); }}
                    >
                        {label}
                    </text>

                    {/* Delete Icon (only for selected line) */}
                    {!isLive && isSelected && (
                        <g
                            transform={`translate(${mx}, ${my - (25 / scale)})`}
                            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                            onPointerDown={(e) => handleDeletePointerDown(e, index)}
                        >
                            {/* Bin background */}
                            <circle cx="0" cy="0" r={10 / scale} fill="#ef4444" />
                            {/* X mark */}
                            <line x1={-4 / scale} y1={-4 / scale} x2={4 / scale} y2={4 / scale} stroke="#fff" strokeWidth={2 / scale} />
                            <line x1={4 / scale} y1={-4 / scale} x2={-4 / scale} y2={4 / scale} stroke="#fff" strokeWidth={2 / scale} />
                        </g>
                    )}
                </g>
                {/* PREMIUM VISUAL HANDLES: Only show when line is selected for a clean look */}
                {!isLive && isSelected && (
                    <>
                        {/* Start Point Handle */}
                        <circle
                            cx={p1.x} cy={p1.y}
                            r={14 / scale}
                            fill="white"
                            stroke="#3b82f6"
                            strokeWidth={3 / scale}
                            style={{ pointerEvents: 'none', filter: `drop-shadow(0 0 ${4 / scale}px rgba(59, 130, 246, 0.5))` }}
                        />
                        <circle cx={p1.x} cy={p1.y} r={4 / scale} fill="#3b82f6" style={{ pointerEvents: 'none' }} />

                        {/* End Point Handle */}
                        <circle
                            cx={p2.x} cy={p2.y}
                            r={14 / scale}
                            fill="white"
                            stroke="#3b82f6"
                            strokeWidth={3 / scale}
                            style={{ pointerEvents: 'none', filter: `drop-shadow(0 0 ${4 / scale}px rgba(59, 130, 246, 0.5))` }}
                        />
                        <circle cx={p2.x} cy={p2.y} r={4 / scale} fill="#3b82f6" style={{ pointerEvents: 'none' }} />
                    </>
                )}
            </g>
        );
    };

    if (!isActive && points.length === 0) return null;

    // Active line: either live (currentStart + tempEnd) or fixed (currentStart + currentEnd)
    const activeEnd = currentEnd || tempEnd;

    return (
        <svg
            width="100%"
            height="100%"
            onPointerDown={handleSvgPointerDown}
            style={{ position: 'absolute', inset: 0, zIndex: 110, pointerEvents: (points.length > 0 || isActive) ? 'auto' : 'none', overflow: 'visible' }}
        >
            {/* Finalized measurement lines */}
            {points.map((p, i) => renderLine(p.start, p.end, i, false))}

            {/* Current start dot (live tool) */}
            {currentStart && !activeEnd && (
                <circle cx={currentStart.x} cy={currentStart.y} r={6 / scale} fill="#f97316" opacity={0.9} />
            )}

            {/* Live / pending line */}
            {currentStart && activeEnd && renderLine(currentStart, activeEnd, null, true)}

            {/* Dotted Line Crosshairs (Measurement Guide) */}
            {isActive && tapeState.mousePos && (
                <g id="measurement-guides" style={{ pointerEvents: 'none' }}>
                    {/* Vertical Line */}
                    <line
                        x1={tapeState.mousePos.x} y1="0"
                        x2={tapeState.mousePos.x} y2="100%"
                        stroke="#000000"
                        strokeWidth={1 / scale}
                        strokeDasharray={`${5 / scale},${5 / scale}`}
                        opacity="0.6"
                    />
                    {/* Horizontal Line */}
                    <line
                        x1="0" y1={tapeState.mousePos.y}
                        x2="100%" y2={tapeState.mousePos.y}
                        stroke="#000000"
                        strokeWidth={1 / scale}
                        strokeDasharray={`${5 / scale},${5 / scale}`}
                        opacity="0.6"
                    />
                </g>
            )}
        </svg>
    );
}
