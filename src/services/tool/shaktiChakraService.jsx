import { useState, useEffect, useCallback } from 'react';

/**
 * 🔮 SHAKTI CHAKRA SERVICE - Complete State Management
 * Store, Hooks, and Vastu Utilities in one file.
 */

// 1. Internal Store - Global State logic
class ShaktiChakraStore {
  constructor() {
    this.state = {
      isActive: false,
      rotation: 0,
      zoneCount: 16,
      lineThickness: 1,
      labelSize: 12,
      labelDistance: 0 // Offset from default position
    };
    this.listeners = new Set();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    if (typeof window !== 'undefined') {
      window.vastuShaktiState = this.state;
    }
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  setActive(val) {
    this.state.isActive = !!val;
    this.notify();
  }

  setRotation(val) {
    this.state.rotation = parseFloat(val) || 0;
    this.notify();
  }

  setZoneCount(val) {
    this.state.zoneCount = parseInt(val) || 16;
    this.notify();
  }

  setLineThickness(val) {
    this.state.lineThickness = parseFloat(val) || 1;
    this.notify();
  }

  setLabelSize(val) {
    this.state.labelSize = parseInt(val) || 12;
    this.notify();
  }

  setLabelDistance(val) {
    this.state.labelDistance = parseInt(val) || 0;
    this.notify();
  }

  getState() {
    return { ...this.state };
  }

  setState(data) {
    if (!data) return;
    this.state = {
      isActive: data.isActive ?? this.state.isActive,
      rotation: data.rotation ?? this.state.rotation,
      zoneCount: data.zoneCount ?? this.state.zoneCount,
      lineThickness: data.lineThickness ?? this.state.lineThickness,
      labelSize: data.labelSize ?? this.state.labelSize,
      labelDistance: data.labelDistance ?? this.state.labelDistance
    };
    this.notify();
  }

  reset() {
    this.state = { isActive: false, rotation: 0, zoneCount: 16, lineThickness: 1, labelSize: 12, labelDistance: 0 };
    this.notify();
  }
}

const shaktiStore = new ShaktiChakraStore();

// --- RESTORATION LISTENER ---
if (typeof window !== 'undefined') {
  window.addEventListener('vastu-restore-state', (e) => {
    console.log("[Service:ShaktiChakra] Restore event received:", e.detail);
    if (e.detail) {
      if (e.detail.shakti) {
        console.log("[Service:ShaktiChakra] Loading saved state for project");
        shaktiStore.setState(e.detail.shakti);
      } else {
        console.log("[Service:ShaktiChakra] No saved state found, resetting to default.");
        shaktiStore.reset();
      }
    }
  });
}

// ========================================
// 📌 HOOKS - For React Components
// ========================================

export const useShaktiChakra = () => {
  const [state, setState] = useState(shaktiStore.getState());

  useEffect(() => {
    const unsubscribe = shaktiStore.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  const setActive = useCallback((val) => shaktiStore.setActive(val), []);
  const setRotation = useCallback((val) => shaktiStore.setRotation(val), []);
  const setZoneCount = useCallback((val) => shaktiStore.setZoneCount(val), []);
  const setLineThickness = useCallback((val) => shaktiStore.setLineThickness(val), []);
  const setLabelSize = useCallback((val) => shaktiStore.setLabelSize(val), []);
  const setLabelDistance = useCallback((val) => shaktiStore.setLabelDistance(val), []);
  const reset = useCallback(() => shaktiStore.reset(), []);

  return {
    ...state,
    setActive,
    setRotation,
    setZoneCount,
    setLineThickness,
    setLabelSize,
    setLabelDistance,
    reset
  };
};

// ========================================
// 🎨 ZONE LABELS - Official Vastu Mapping
// ========================================

const zones8 = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

const zones16 = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
];

// 32 Entrance Zones (N1-N8, E1-E8, S1-S8, W1-W8)
// 32 Entrance Zones (N5 starts at 0°, N4 ends at 360°)
const zones32 = [
  "N5", "N6", "N7", "N8",
  "E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8",
  "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8",
  "W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8",
  "N1", "N2", "N3", "N4"
];

// 32 Devta Names mapped to zones (N5 to N4 in order)
const devtaNames32 = [
  "Soma", "Bhujang", "Aditi", "Diti",           // N5-N8
  "Shikhi", "Parjanya", "Jayant", "Mahendra",   // E1-E4
  "Surya", "Satya", "Bhrisha", "Antariksha",    // E5-E8
  "Agni", "Pusha", "Vitatha", "Grihakshat",     // S1-S4
  "Yama", "Gandharva", "Bhringraj", "Mriga",    // S5-S8
  "Pitri", "Dauvarika", "Sugriva", "Pushpadanta", // W1-W4
  "Varuna", "Asura", "Sosha", "Papyakshman",    // W5-W8
  "Roga", "Naga", "Mukhya", "Bhallat"           // N1-N4
];

export const getZoneLabel = (index, total) => {
  if (total === 8) return zones8[index % 8];
  if (total === 16) return zones16[index % 16];
  if (total === 32) return zones32[index % 32];
  return "";
};

// Get Devta name for a zone
export const getDevtaName = (index, total) => {
  if (total === 32) return devtaNames32[index % 32];
  return null;
};

// Get combined label with Devta name
export const getZoneLabelWithDevta = (index, total) => {
  const zone = getZoneLabel(index, total);
  const devta = getDevtaName(index, total);
  return devta ? `${zone}\n${devta}` : zone;
};

// ========================================
// 📐 GEOMETRY UTILITIES
// ========================================

export const getPointAtAngle = (center, angle, distance) => {
  // Convert to radians (Standard SVG Coordinate System)
  const rad = (angle * Math.PI) / 180;
  return {
    x: center.x + distance * Math.sin(rad),
    y: center.y - distance * Math.cos(rad),
  };
};

/**
 * Calculates all Vastu zones covered by a given object (point, line, or polygon).
 * Replicated from EntranceLayer logic for shared use.
 */
export const calculateObjectZones = (ent, center, rotation, imageRotation, zoneCount) => {
  if (!ent || !center) return [];

  const safeRotation = Number(rotation) || 0;
  const safeZoneCount = Number(zoneCount) || 16;
  const safeImageAngle = Number(imageRotation) || 0;

  const getZoneForPoint = (point) => {
    const dx = point.x - center.x;
    const dy = center.y - point.y;
    let mathDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (mathDeg < 0) mathDeg += 360;
    const vastuDeg = (450 - mathDeg) % 360;
    // Apply Rotation (CW) - Subtraction logic
    const correctedAngle = (vastuDeg - (safeRotation - safeImageAngle) + 360) % 360;
    const step = 360 / safeZoneCount;
    const offset = safeZoneCount === 32 ? 0 : step / 2;
    const index = Math.floor(((correctedAngle + offset) % 360) / step);
    return getZoneLabel(index, safeZoneCount);
  };

  const samplePoints = [];
  if (ent.category === 'Entrance' || !ent.category) {
    if (ent.start && ent.end) {
      // Entrance: sample along the line with 8 points
      const steps = 8;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        samplePoints.push({
          x: ent.start.x + t * (ent.end.x - ent.start.x),
          y: ent.start.y + t * (ent.end.y - ent.start.y)
        });
      }
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

// ========================================
// 🔧 DIRECT SERVICE (For Non-React Logic)
// ========================================

export const shaktiChakraService = {
  getState: () => shaktiStore.getState(),
  setActive: (val) => shaktiStore.setActive(val),
  setRotation: (val) => shaktiStore.setRotation(val),
  setZoneCount: (val) => shaktiStore.setZoneCount(val),
  setLineThickness: (val) => shaktiStore.setLineThickness(val),
  setLabelSize: (val) => shaktiStore.setLabelSize(val),
  setLabelDistance: (val) => shaktiStore.setLabelDistance(val),
  reset: () => shaktiStore.reset(),
  subscribe: (cb) => shaktiStore.subscribe(cb)
};