import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  useDrawingLogic,
  getBoundaryIntersection,
  getPointAtAngle
} from '../../services/tool/drawingService';
import { useRotation } from '../../services/tool/rotateService';
import { useEntrance } from '../../services/tool/entranceService';
import { getZoneLabel, getDevtaName, useShaktiChakra } from '../../services/tool/shaktiChakraService';
import { updatePoint, insertPoint, removePoint, useMeasure, setIsDragging as setBoundaryDragging, setMousePos as setBoundaryMousePos } from '../../services/tool/boundaryService';
import { useScale } from '../../services/tool/scaleService';
import { useDevta } from '../../services/tool/devtaService';

export default function DrawingOverlay({ points, centerPoint, isActive, zoneCount, rotation, isPlotActive, scale, imgSize }) {
  const {
    showOverlay,
    safeRotation,
    safeZoneCount,
    getLocalCoordinates: getLocalCoords
  } = useDrawingLogic(rotation, zoneCount);

  const { lineThickness, labelSize, labelDistance } = useShaktiChakra();
  const { angle } = useRotation();
  const { boundaryThickness } = useMeasure();
  const devta = useDevta();

  // --- STATE ---
  const { mousePos } = useMeasure();
  const [hoveredZone, setHoveredZone] = useState(null);
  const [hoveringLine, setHoveringLine] = useState(false);
  const [draggingPoint, setDraggingPoint] = useState(null);
  const [dragging, setDragging] = useState(null);
  const dragStarted = useRef(false);
  const [exportSettings, setExportSettings] = useState(window.vastuExportSettings || { active: false });

  const interactionThreshold = 20 / scale;
  const hoverThreshold = 10 / scale;

  useEffect(() => {
    const handleExportUpdate = (e) => setExportSettings(e.detail);
    window.addEventListener('vastu-export-update', handleExportUpdate);
    return () => window.removeEventListener('vastu-export-update', handleExportUpdate);
  }, []);

  // Ref for the container div to calculate coordinates robustly
  const containerRef = useRef(null);

  const getLocalCoordinates = (e) => {
    return getLocalCoords(e, containerRef.current, scale, angle, imgSize || { w: 1000, h: 1000 });
  };


  const requestRef = useRef();

  // ✅ FIXED: useMemo must be called at top level, not inside JSX
  const shaktiChakraLayer = useMemo(() => (
    <g id="shakti-chakra-layer" style={{ display: (isActive && centerPoint && !exportSettings.active) || (exportSettings.active && exportSettings.withShakti && centerPoint) ? 'inline' : 'none' }}>
      {/* Reclaiming Shakti Chakra Logic from previous version */}
      {hoveredZone !== null && points.length > 2 && (
        <g clipPath="url(#plot-boundary-clip)">
          {(() => {
            const angleStep = 360 / safeZoneCount;
            const offset = safeZoneCount === 32 ? 0 : (angleStep / 2);
            const startAngle = safeRotation - angle + (hoveredZone * angleStep) - offset;
            const endAngle = startAngle + angleStep;
            const r = 5000;

            const p1 = getPointAtAngle(centerPoint, startAngle, r);
            const p2 = getPointAtAngle(centerPoint, endAngle, r);

            const pathData = `M ${centerPoint.x},${centerPoint.y} L ${p1.x},${p1.y} A ${r},${r} 0 0,1 ${p2.x},${p2.y} Z`;
            return <path d={pathData} fill="rgba(239, 115, 22, 0.25)" stroke="none" />;
          })()}
        </g>
      )}
      {/* North Line */}
      {(() => {
        const northAngle = safeRotation - angle;
        const nIntersect = getBoundaryIntersection(centerPoint, northAngle, points);
        return nIntersect && <line x1={centerPoint.x} y1={centerPoint.y} x2={nIntersect.x} y2={nIntersect.y} stroke="#00FF00" strokeWidth="4" />;
      })()}
      {/* Zones */}
      {isActive && centerPoint && Array.from({ length: safeZoneCount }).map((_, i) => {
        const angleStep = 360 / safeZoneCount;
        const offset = safeZoneCount === 32 ? 0 : (angleStep / 2);
        const lineAngle = (i * angleStep) + safeRotation - angle - offset;
        const lineIntersect = getBoundaryIntersection(centerPoint, lineAngle, points);
        const labelAngle = lineAngle + (angleStep / 2);
        const labelIntersect = getBoundaryIntersection(centerPoint, labelAngle, points);
        const dist = -30 + (labelDistance || 0);
        const labelPos = labelIntersect ? getPointAtAngle(labelIntersect, labelAngle, dist) : null;
        return (
          <g key={`drawing-layer-${i}`}>
            {lineIntersect && <line x1={centerPoint.x} y1={centerPoint.y} x2={lineIntersect.x} y2={lineIntersect.y} stroke="rgba(239, 68, 68, 0.6)" strokeWidth={lineThickness || 1} strokeDasharray="5,3" />}
            {labelPos && (
              <>
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  transform={`rotate(${labelAngle > 90 && labelAngle < 270 ? labelAngle + 180 : labelAngle}, ${labelPos.x}, ${labelPos.y})`}
                  fill="#1e293b"
                  fontSize={`${Number(labelSize) || 12}px`}
                  fontWeight="900"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ paintOrder: "stroke", stroke: "#ffffff", strokeWidth: "3px", userSelect: "none", vectorEffect: "non-scaling-stroke" }}
                >
                  {getZoneLabel(i, safeZoneCount)}
                </text>
                {safeZoneCount === 32 && devta.isActive && getDevtaName(i, safeZoneCount) && (
                  <text
                    x={labelPos.x}
                    y={labelPos.y + (Number(labelSize) || 12) + 2}
                    transform={`rotate(${labelAngle > 90 && labelAngle < 270 ? labelAngle + 180 : labelAngle}, ${labelPos.x}, ${labelPos.y})`}
                    fill="#ea580c"
                    fontSize={`${(Number(labelSize) || 12) * 0.75}px`}
                    fontWeight="700"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ paintOrder: "stroke", stroke: "#ffffff", strokeWidth: "2px", userSelect: "none", vectorEffect: "non-scaling-stroke" }}
                  >
                    {getDevtaName(i, safeZoneCount)}
                  </text>
                )}
              </>
            )}
          </g>
        );
      })}
    </g>
  ), [isActive, centerPoint, points, hoveredZone, safeRotation, angle, safeZoneCount, labelDistance, labelSize, lineThickness, scale, exportSettings.active, exportSettings.withShakti, devta.isActive]);

  // --- HANDLERS ---
  const handlePointerUp = (e) => {
    if (draggingPoint !== null) {
      if (draggingPoint.coords) {
        // Only trigger heavy global update on pointer release
        updatePoint(draggingPoint.index, draggingPoint.coords, true);
      }
      setBoundaryDragging(false);
      setDraggingPoint(null);
      setDragging(null);
      // Block subsequent onClick for a short duration to prevent accidental removal
      setTimeout(() => { dragStarted.current = false; }, 100);
    }
  };

  const handlePointerMove = (e) => {
    const p = getLocalCoordinates(e);

    // 1. DRAGGING LOGIC - High Frequency, kept inside requestAnimationFrame
    if (draggingPoint !== null) {
      dragStarted.current = true;
      if (requestRef.current) return;
      requestRef.current = requestAnimationFrame(() => {
        setDraggingPoint(prev => prev ? { ...prev, coords: p } : null);
        requestRef.current = null;
      });
      return;
    }

    // Default hover logic, throttled
    if (requestRef.current) return;
    requestRef.current = requestAnimationFrame(() => {
      // 2. LINE HOVER DETECTION
      if (isPlotActive && showOverlay && points && points.length >= 2) {
        let isLine = false;
        for (let i = 0; i < points.length; i++) {
          const p1 = points[i];
          const p2 = points[(i + 1) % points.length];
          const dist = pointToSegmentDistance(p, p1, p2);
          if (dist < hoverThreshold) {
            isLine = true;
            break;
          }
        }
        if (isLine !== hoveringLine) setHoveringLine(isLine);
      } else {
        if (hoveringLine) setHoveringLine(false);
      }

      // 3. ZONE HOVER LOGIC
      if (!isActive || !centerPoint || !showOverlay) {
        if (hoveredZone !== null) setHoveredZone(null);
        requestRef.current = null;
        return;
      }
      const dx = p.x - centerPoint.x;
      const dy = p.y - centerPoint.y;
      let degrees = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (degrees < 0) degrees += 360;
      const vastuDegrees = (degrees + 90) % 360;
      const relativeDegree = (vastuDegrees - (safeRotation - angle) + 360) % 360;
      const zoneStep = 360 / safeZoneCount;
      const offset = safeZoneCount === 32 ? 0 : zoneStep / 2;
      const zoneIndex = Math.floor(((relativeDegree + offset) % 360) / zoneStep);
      setHoveredZone(zoneIndex);

      requestRef.current = null;
    });
  };

  const handlePointPointerDown = (e, index) => {
    if (!isPlotActive) return;

    if (e.target.setPointerCapture) {
      e.target.setPointerCapture(e.pointerId);
    }
    setBoundaryDragging(true);
    setDraggingPoint({ index });
    setDragging({ type: 'boundary', index });
  };




  const handlePointerDown = (e) => {
    // 1. Check if clicking on an EXISTING POINT to START DRAGGING
    const p = getLocalCoordinates(e);
    dragStarted.current = false;

    // Check points first (Highest priority)
    if (isPlotActive) {
      for (let i = 0; i < points.length; i++) {
          const point = points[i];
          const dx = p.x - point.x;
          const dy = p.y - point.y;
          if (Math.sqrt(dx * dx + dy * dy) < interactionThreshold) {
              setBoundaryDragging(true);
              setDraggingPoint({ index: i });
              setDragging({ type: 'boundary', index: i });
              e.stopPropagation(); // ✋ Stop bubbling to prevent ImageCanvas from adding a new point
              return;
          }
      }
    }

    // Checking if clicking on a LINE (only to stop propagation)
    if (isPlotActive && points && points.length >= 2) {
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            const dist = pointToSegmentDistance(p, p1, p2);
            if (dist < interactionThreshold) {
                // We don't insert here, but we stop propagation to allow double-click to work cleanly
                e.stopPropagation();
                return;
            }
        }
    }
  };

  const handleOverlayClick = (e) => {
    // Stop propagation if we are on a point or line to prevent ImageCanvas adding points
    if (!isPlotActive || !points || points.length < 2) return;
    const p = getLocalCoordinates(e);

    // Points
    for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const dx = p.x - point.x;
        const dy = p.y - point.y;
        if (Math.sqrt(dx * dx + dy * dy) < interactionThreshold) {
            e.stopPropagation();
            return;
        }
    }

    // Lines
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        const dist = pointToSegmentDistance(p, p1, p2);
        if (dist < interactionThreshold) {
            e.stopPropagation();
            return;
        }
    }
  };

  const handleDoubleClick = (e) => {
    if (!isPlotActive || !points) return;
    const p = getLocalCoordinates(e);

    // 1. Double Click on POINT -> REMOVE
    for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const dx = p.x - point.x;
        const dy = p.y - point.y;
        if (Math.sqrt(dx * dx + dy * dy) < interactionThreshold) {
            removePoint(i);
            e.stopPropagation();
            return;
        }
    }

    // 2. Double Click on LINE -> INSERT POINT
    if (points.length >= 2) {
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            const dist = pointToSegmentDistance(p, p1, p2);
            if (dist < interactionThreshold) {
                insertPoint(i + 1, p);
                e.preventDefault();
                e.stopPropagation();
                return;
            }
        }
    }
  };


  // Helper: Distance from Point P to Segment AB
  function pointToSegmentDistance(P, A, B) {
    const { x, y } = P;
    const { x: x1, y: y1 } = A;
    const { x: x2, y: y2 } = B;

    const A_to_P_x = x - x1;
    const A_to_P_y = y - y1;
    const A_to_B_x = x2 - x1;
    const A_to_B_y = y2 - y1;

    const dot = A_to_P_x * A_to_B_x + A_to_P_y * A_to_B_y;
    const len_sq = A_to_B_x * A_to_B_x + A_to_B_y * A_to_B_y;

    let param = -1;
    if (len_sq !== 0) param = dot / len_sq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * A_to_B_x;
      yy = y1 + param * A_to_B_y;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onClick={handleOverlayClick}
      onDoubleClick={handleDoubleClick}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        setHoveredZone(null);
        setHoveringLine(false);
        setBoundaryMousePos(null); // Clear crosshairs on leave
        if (draggingPoint !== null) {
          setBoundaryDragging(false);
          setDraggingPoint(null);
        }
        if (dragging !== null) setDragging(null);
      }}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "all",
        // Visual Feedback: Crosshair when hovering line
        cursor: hoveringLine ? 'crosshair' : 'default',
        touchAction: 'none' // Prevent browser scrolling while interacting
      }}
    >

      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, zIndex: 100, pointerEvents: "none" }}>
        {/* Global showOverlay condition - Always show during export */}
        <g id="global-overlay-layer" style={{ display: (showOverlay || exportSettings.active) ? 'inline' : 'none' }}>

          {/* 1. DEFINE CLIP PATH */}
          {points && points.length > 2 && (
            <defs>
              <clipPath id="plot-boundary-clip">
                <polygon points={points.map((p, i) => {
                  const fp = (draggingPoint?.index === i && draggingPoint.coords) ? draggingPoint.coords : p;
                  return `${fp.x},${fp.y}`;
                }).join(" ")} />
              </clipPath>
            </defs>
          )}

          {/* 2. PLOT BOUNDARY DRAWING */}
          <g id="plot-boundary-group">
            {points && points.length > 0 && (
              <g id="boundary-layer">
                <polygon
                  points={points.map((p, i) => {
                    const fp = (draggingPoint?.index === i && draggingPoint.coords) ? draggingPoint.coords : p;
                    return `${fp.x},${fp.y}`;
                  }).join(" ")}
                  fill="rgba(239, 68, 68, 0.08)"
                  stroke="#ef4444"
                  strokeWidth={(boundaryThickness || 2)}
                  vectorEffect="non-scaling-stroke"
                  style={{ pointerEvents: "visiblePainted" }}
                />
                {points.map((p, i) => {
                  const fp = (draggingPoint?.index === i && draggingPoint.coords) ? draggingPoint.coords : p;
                  const nextP = points[(i + 1) % points.length];

                  return (
                    <React.Fragment key={`point-group-${i}`}>
                      {!exportSettings.active && (
                        <circle
                          cx={fp.x} cy={fp.y} r={(boundaryThickness || 2) * 3}
                          fill={draggingPoint?.index === i ? "#b91c1c" : "#ef4444"}
                          stroke="#fff"
                          strokeWidth={(boundaryThickness || 2)}
                          vectorEffect="non-scaling-stroke"
                          style={{ pointerEvents: isPlotActive ? "all" : "none", cursor: isPlotActive ? "move" : "default" }}

                          onPointerDown={(e) => handlePointPointerDown(e, i)}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </g>
            )}
          </g>

          {/* 3. SHAKTI CHAKRA LAYERS */}
          {shaktiChakraLayer}
        </g>


        {/* CENTER POINT */}
        {centerPoint && (
          <g id="center-layer" style={{ pointerEvents: "none" }}>
            <line x1={centerPoint.x - 10} y1={centerPoint.y} x2={centerPoint.x + 10} y2={centerPoint.y} stroke="black" strokeWidth="3" />
            <line x1={centerPoint.x} y1={centerPoint.y - 10} x2={centerPoint.x} y2={centerPoint.y + 10} stroke="black" strokeWidth="3" />
          </g>
        )}
      </svg>
    </div >
  );
}