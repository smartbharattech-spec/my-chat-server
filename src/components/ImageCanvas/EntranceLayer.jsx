import React, { useState, useEffect } from "react";
import { useEntrance } from "../../services/tool/entranceService";
import { useShaktiChakra, getZoneLabel } from "../../services/tool/shaktiChakraService";
import { useRotation } from "../../services/tool/rotateService";
import { useCenterPoint } from "../../services/tool/centerService";
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import KitchenIcon from '@mui/icons-material/Kitchen';
import WcIcon from '@mui/icons-material/Wc';
import TempleHinduIcon from '@mui/icons-material/TempleHindu';
import BedIcon from '@mui/icons-material/Bed';
import LocalLaundryServiceIcon from '@mui/icons-material/LocalLaundryService';
import LockIcon from "@mui/icons-material/Lock";
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import WorkIcon from '@mui/icons-material/Work';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import DeleteIcon from '@mui/icons-material/Delete';
import StairsIcon from '@mui/icons-material/Stairs';
import WashIcon from '@mui/icons-material/Wash';

const CategoryIconMap = {
  "Entrance": <MeetingRoomIcon />,
  "Kitchen": <KitchenIcon />,
  "Toilet": <WcIcon />,
  "Mandir": <TempleHinduIcon />,
  "Master Bed": <BedIcon />,
  "Kids Bed": <BedIcon />,
  "W. Machine": <LocalLaundryServiceIcon />,
  "Locker": <LockIcon />,
  "Study Table": <AutoStoriesIcon />,
  "Dining": <RestaurantIcon />,
  "Office Desk": <WorkIcon />,
  "Fam. Photo": <InsertPhotoIcon />,
  "Trophies": <EmojiEventsIcon />,
  "O.H. Tank": <WaterDropIcon />,
  "U.G. Tank": <WaterDropIcon />,
  "Septic Tank": <WashIcon />,
  "Dustbin": <DeleteIcon />,
  "Staircase Area": <StairsIcon />,
  "Staircase Landing": <StairsIcon />
};

// Helper Component for thick Plus Icon
const PlusIcon = ({ x, y, scale, color = "#000000", onPointerDown }) => {
  const plusSize = 8 / scale;
  const strokeWidth = 2 / scale; // Lighter Plus

  return (
    <g
      style={{ cursor: "move", pointerEvents: "all" }}
      onPointerDown={onPointerDown}
    >
      {/* Invisible hit area */}
      <circle cx={x} cy={y} r={12 / scale} fill="transparent" />

      {/* Horizontal */}
      <line
        x1={x - plusSize} y1={y} x2={x + plusSize} y2={y}
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
      />
      {/* Vertical */}
      <line
        x1={x} y1={y - plusSize} x2={x} y2={y + plusSize}
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
      />
      {/* Subtle White Outline for contrast */}
      <line
        x1={x - plusSize} y1={y} x2={x + plusSize} y2={y}
        stroke="#fff" strokeWidth={1 / scale} strokeLinecap="round" opacity="0.3"
      />
      <line
        x1={x} y1={y - plusSize} x2={x} y2={y + plusSize}
        stroke="#fff" strokeWidth={1 / scale} strokeLinecap="round" opacity="0.3"
      />
    </g>
  );
};

export default function EntranceLayer({ scale }) {
  const entrances = useEntrance(s => s.entrances);
  const currentEntrance = useEntrance(s => s.currentEntrance);
  const updateEntrance = useEntrance(s => s.updateEntrance);
  const tooltipScale = useEntrance(s => s.tooltipScale);
  const dragging = useEntrance(s => s.dragging);
  const setDragging = useEntrance(s => s.setDragging);

  const { rotation, zoneCount } = useShaktiChakra();
  const { angle } = useRotation();
  const centerPoint = useCenterPoint();

  const safeRotation = Number(rotation) || 0;
  const safeZoneCount = Number(zoneCount) || 16;
  const safeAngle = Number(angle) || 0;

  const [exportSettings, setExportSettings] = useState(window.vastuExportSettings || { active: false });

  useEffect(() => {
    const handleExportUpdate = (e) => setExportSettings(e.detail);
    window.addEventListener('vastu-export-update', handleExportUpdate);
    return () => window.removeEventListener('vastu-export-update', handleExportUpdate);
  }, []);

  useEffect(() => {
    if (dragging === null) return;

    const handleMouseMove = (e) => {
      // Always get the latest entrances from the store to avoid stale closures
      const currentEntrances = useEntrance.getState().entrances;

      const dx_screen = e.clientX - dragging.startX;
      const dy_screen = e.clientY - dragging.startY;

      const rad = (safeAngle * Math.PI) / 180;
      const cosA = Math.cos(rad);
      const sinA = Math.sin(rad);

      // Rotate delta back to local image space using safeAngle (Image Rotation)
      const localDx = (dx_screen * cosA + dy_screen * sinA) / scale;
      const localDy = (-dx_screen * sinA + dy_screen * cosA) / scale;

      if (dragging.type === "tooltip") {
        updateEntrance(dragging.index, {
          tooltipOffset: {
            x: dragging.initialPos.x + localDx,
            y: dragging.initialPos.y + localDy,
          },
        });
      } else if (dragging.type === "point") {
        const ent = currentEntrances[dragging.index];
        if (!ent) return;

        const newX = dragging.initialPos.x + localDx;
        const newY = dragging.initialPos.y + localDy;

        if (dragging.target === "start") {
          const newPoints = [...(ent.points || [])];
          if (newPoints.length > 0) newPoints[0] = { x: newX, y: newY };
          updateEntrance(dragging.index, {
            start: { x: newX, y: newY },
            points: newPoints
          });
        } else if (dragging.target === "end") {
          const newPoints = [...(ent.points || [])];
          if (newPoints.length > 1) newPoints[1] = { x: newX, y: newY };
          updateEntrance(dragging.index, {
            end: { x: newX, y: newY },
            points: newPoints
          });
        } else if (dragging.target === "points") {
          const newPoints = ent.points.map((p, i) =>
            i === dragging.pointIndex ? { x: newX, y: newY } : p
          );
          updateEntrance(dragging.index, { points: newPoints });
        }
      }
    };

    const handlePointerUp = (e) => {
      try { e.target.releasePointerCapture(e.pointerId); } catch (err) { }
      setDragging(null);
    };

    window.addEventListener("pointermove", handleMouseMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handleMouseMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragging, scale, updateEntrance, safeAngle, setDragging]);

  const handleDragDown = (e, index, ent) => {
    e.preventDefault();
    e.stopPropagation();
    try { e.target.setPointerCapture(e.pointerId); } catch (err) { }
    setDragging({
      type: "tooltip",
      index,
      startX: e.clientX,
      startY: e.clientY,
      initialPos: {
        x: ent.tooltipOffset?.x || 0,
        y: ent.tooltipOffset?.y || 0,
      },
    });
  };

  const handlePointDragDown = (e, index, target, pointIndex = null) => {
    e.preventDefault();
    e.stopPropagation();
    try { e.target.setPointerCapture(e.pointerId); } catch (err) { }
    const ent = entrances[index];
    let initialPos;
    if (target === "start") initialPos = ent.start;
    else if (target === "end") initialPos = ent.end;
    else initialPos = ent.points[pointIndex];

    setDragging({
      type: "point",
      index,
      target,
      pointIndex,
      startX: e.clientX,
      startY: e.clientY,
      initialPos: { ...initialPos },
    });
  };

  // Helpers
  const getMidpoint = (start, end) => ({
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  });

  const getPolygonCenter = (points) => {
    if (!points || points.length === 0) return { x: 0, y: 0 };
    const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: sum.x / points.length, y: sum.y / points.length };
  };

  const getZoneForPoint = (point) => {
    if (!centerPoint) return null;
    const dx = point.x - centerPoint.x;
    const dy = centerPoint.y - point.y;
    let mathDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (mathDeg < 0) mathDeg += 360;
    const vastuDeg = (450 - mathDeg) % 360;
    const correctedAngle = (vastuDeg - (safeRotation - safeAngle) + 360) % 360;
    const step = 360 / safeZoneCount;
    const offset = safeZoneCount === 32 ? 0 : step / 2;
    const index = Math.floor(((correctedAngle + offset) % 360) / step);
    return getZoneLabel(index, safeZoneCount);
  };

  // Returns ALL unique zones covered by an entrance/object
  const getZonesForEntrance = (ent) => {
    if (!centerPoint) return [];
    const samplePoints = [];

    if (ent.category === 'Entrance' || !ent.category) {
      // Entrance: sample along the line with 8 points
      const steps = 8;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        samplePoints.push({
          x: ent.start.x + t * (ent.end.x - ent.start.x),
          y: ent.start.y + t * (ent.end.y - ent.start.y)
        });
      }
    } else if (ent.points && ent.points.length >= 2) {
      // Polygon: sample along each edge
      const pts = ent.points;
      for (let i = 0; i < pts.length; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % pts.length];
        const steps = 4;
        for (let j = 0; j <= steps; j++) {
          const t = j / steps;
          samplePoints.push({
            x: p1.x + t * (p2.x - p1.x),
            y: p1.y + t * (p2.y - p1.y)
          });
        }
      }
    }

    // Get unique zone labels
    const zones = new Set();
    samplePoints.forEach(pt => {
      const z = getZoneForPoint(pt);
      if (z) zones.add(z);
    });
    return Array.from(zones);
  };

  // Export Visibility Logic
  if (exportSettings.active) {
    if (exportSettings.reportType !== 'basic') return null;
  }

  return (
    <svg
      id="entrance-layer"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 150,
      }}
    >
      {/* 1. COMPLETED COMPONENTS */}
      {entrances.map((ent, index) => {
        const isEntrance = ent.category === 'Entrance' || !ent.category;
        const center = isEntrance ? getMidpoint(ent.start, ent.end) : getPolygonCenter(ent.points);
        const allZones = getZonesForEntrance(ent);
        const zoneLabel = allZones.join(' + ');

        return (
          <g key={index}>
            {isEntrance ? (
              <>
                <line
                  x1={ent.start.x} y1={ent.start.y}
                  x2={ent.end.x} y2={ent.end.y}
                  stroke="#ef4444"
                  strokeWidth={3 / scale}
                  strokeDasharray={4 / scale}
                />
                {/* START POINT PLUS */}
                <PlusIcon
                  x={ent.start.x} y={ent.start.y}
                  scale={scale} color="#000000"
                  onPointerDown={(e) => handlePointDragDown(e, index, "start")}
                />
                {/* END POINT PLUS */}
                <PlusIcon
                  x={ent.end.x} y={ent.end.y}
                  scale={scale} color="#000000"
                  onPointerDown={(e) => handlePointDragDown(e, index, "end")}
                />

                <foreignObject x={center.x - (12 / scale)} y={center.y - (12 / scale)} width={24 / scale} height={24 / scale}>
                  <MeetingRoomIcon style={{ color: "#ef4444", fontSize: `${24 / scale}px`, backgroundColor: "white", borderRadius: "50%", border: `${1 / scale}px solid #ef4444` }} />
                </foreignObject>
              </>
            ) : (
              <>
                {/* Polygon for Box (Kitchen etc.) */}
                <polygon
                  points={ent.points.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="rgba(249, 115, 22, 0.15)"
                  stroke="#f97316"
                  strokeWidth={2 / scale}
                  strokeDasharray={3 / scale}
                />
                {ent.points.map((p, i) => (
                  <PlusIcon
                    key={i} x={p.x} y={p.y}
                    scale={scale} color="#000000"
                    onPointerDown={(e) => handlePointDragDown(e, index, "points", i)}
                  />
                ))}

                {/* Avatar with ICON */}
                <circle cx={center.x} cy={center.y} r={12 / scale} fill="#ea580c" stroke="white" strokeWidth={1 / scale} />
                <foreignObject
                  x={center.x - (8 / scale)}
                  y={center.y - (8 / scale)}
                  width={16 / scale}
                  height={16 / scale}
                >
                  <div style={{ color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                    {React.cloneElement(CategoryIconMap[ent.category] || <MeetingRoomIcon />, {
                      style: { fontSize: `${14 / scale}px` }
                    })}
                  </div>
                </foreignObject>

                {/* DETAILS TOOLTIP */}
                <foreignObject
                  x={center.x + (15 / scale) + (ent.tooltipOffset?.x || 0)}
                  y={center.y - (50 / scale) + (ent.tooltipOffset?.y || 0)}
                  width={(100 * tooltipScale) / scale}
                  height={(130 * tooltipScale) / scale}
                  style={{
                    overflow: 'visible',
                    transform: `rotate(${-angle}deg)`,
                    transformOrigin: `${center.x + (15 / scale) + (ent.tooltipOffset?.x || 0)}px ${center.y - (50 / scale) + (ent.tooltipOffset?.y || 0)}px`
                  }}
                >
                  <div
                    onPointerDown={(e) => handleDragDown(e, index, ent)}
                    style={{
                      backgroundColor: "#ffffff",
                      padding: `${8 * tooltipScale / scale}px`,
                      borderRadius: `${6 * tooltipScale / scale}px`,
                      border: `${1.5 / scale}px solid #f97316`,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 4px rgba(249, 115, 22, 0.1)",
                      fontSize: `${10 * tooltipScale / scale}px`,
                      fontFamily: "'Inter', system-ui, sans-serif",
                      pointerEvents: "auto",
                      cursor: dragging?.index === index ? "grabbing" : "grab",
                      userSelect: "none",
                      lineHeight: 1.4
                    }}
                  >
                    <div style={{
                      fontWeight: 900,
                      color: "#7c2d12",
                      borderBottom: `${1 / scale}px solid #ffedd5`,
                      paddingBottom: `${4 * tooltipScale / scale}px`,
                      marginBottom: `${6 * tooltipScale / scale}px`,
                      fontSize: `${11 * tooltipScale / scale}px`,
                      textAlign: 'center',
                      textTransform: 'uppercase'
                    }}>{ent.category || 'ITEM'}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: `${3 * tooltipScale / scale}px` }}>
                      {ent.details && Object.entries(ent.details).map(([label, val]) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>{label.replace('Color', '').replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span style={{ color: '#ea580c', fontWeight: 800 }}>{val || "-"}</span>
                        </div>
                      ))}
                      {!ent.details && <div style={{ textAlign: 'center', color: '#64748b', fontSize: `${9 * tooltipScale / scale}px` }}>No extra details</div>}
                    </div>
                  </div>
                </foreignObject>
              </>
            )}
          </g>
        );
      })}

      {/* 2. PROGRESS DOTS & LINE */}
      {currentEntrance?.points && (
        <g>
          {currentEntrance.points.length >= 2 && (
            <polyline
              points={currentEntrance.points.map(p => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="#000000"
              strokeWidth={2 / scale}
              strokeDasharray={4 / scale}
              opacity={0.6}
            />
          )}
          {currentEntrance.points.map((p, i) => (
            <PlusIcon key={i} x={p.x} y={p.y} scale={scale} color="#000000" />
          ))}
        </g>
      )}
    </svg>
  );
}