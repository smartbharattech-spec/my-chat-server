import { useState, useEffect } from 'react';

// --- 1. GLOBAL STATE (Module level par) ---
let listeners = [];
let globalShowOverlay = true; // Ye asli variable hai
if (typeof window !== 'undefined') {
  window.vastuOverlayState = globalShowOverlay;
}

// Is variable ko update karne ka function
const notify = () => {
  if (typeof window !== 'undefined') {
    window.vastuOverlayState = globalShowOverlay;
  }
  listeners.forEach(listener => listener(globalShowOverlay));
};

// Helper: Angle par point nikalne ke liye
export const getPointAtAngle = (center, angle, distance) => {
  const angleRad = (angle - 90) * (Math.PI / 180);
  return {
    x: center.x + distance * Math.cos(angleRad),
    y: center.y + distance * Math.sin(angleRad),
  };
};

/**
 * Transforms screen coordinates (event) to image-local coordinates
 * with clamping to ensure points stay within the image bounds.
 */
export const getLocalCoordinates = (e, container, scale, angle, imgSize) => {
  if (!container) return { x: 0, y: 0 };
  const rect = container.getBoundingClientRect();

  // 1. Get screen position relative to visual center of bounding box
  const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
  const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

  const cx = clientX - (rect.left + rect.width / 2);
  const cy = clientY - (rect.top + rect.height / 2);

  // 2. Unscale
  const ux = cx / (scale || 1);
  const uy = cy / (scale || 1);

  // 3. Unrotate (Inverse of CSS rotation)
  const rad = (angle * Math.PI) / 180;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);

  const dx = ux * cosA + uy * sinA;
  const dy = -ux * sinA + uy * cosA;

  // 4. Map back to image coordinates (origin at top-left)
  let x = dx + imgSize.w / 2;
  let y = dy + imgSize.h / 2;

  // 5. CLAMP to image boundaries
  x = Math.max(0, Math.min(imgSize.w, x));
  y = Math.max(0, Math.min(imgSize.h, y));

  return { x, y };
};

// Intersection Logic
export const getBoundaryIntersection = (centerPoint, angle, points) => {
  if (!points || points.length < 3 || !centerPoint) return null;
  const rayEnd = getPointAtAngle(centerPoint, angle, 10000); // Increased distance for large images

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const den = (p2.y - p1.y) * (rayEnd.x - centerPoint.x) - (p2.x - p1.x) * (rayEnd.y - centerPoint.y);
    if (den === 0) continue;
    const ua = ((p2.x - p1.x) * (centerPoint.y - p1.y) - (p2.y - p1.y) * (centerPoint.x - p1.x)) / den;
    const ub = ((rayEnd.x - centerPoint.x) * (centerPoint.y - p1.y) - (rayEnd.y - centerPoint.y) * (centerPoint.x - p1.x)) / den;
    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      return {
        x: centerPoint.x + ua * (rayEnd.x - centerPoint.x),
        y: centerPoint.y + ua * (rayEnd.y - centerPoint.y)
      };
    }
  }
  return null;
};

// --- 3. RESTORATION LISTENER ---
if (typeof window !== 'undefined') {
  window.addEventListener('vastu-restore-state', (e) => {
    console.log("[Service:Drawing] Restore event received:", e.detail);
    if (e.detail) {
      globalShowOverlay = typeof e.detail.overlay !== 'undefined' ? !!e.detail.overlay : true;
      console.log("[Service:Drawing] Overlay visibility set to:", globalShowOverlay);
      notify();
    }
  });
}

export const useDrawingLogic = (rotation, zoneCount) => {
  const [showOverlay, setShowOverlay] = useState(globalShowOverlay);

  useEffect(() => {
    listeners.push(setShowOverlay);
    return () => {
      listeners = listeners.filter(l => l !== setShowOverlay);
    };
  }, []);

  const toggleOverlay = () => {
    globalShowOverlay = !globalShowOverlay;
    notify(); // Saare components ko batao ki value change ho gayi
  };

  const safeRotation = Number(rotation) || 0;
  const safeZoneCount = Number(zoneCount) || 16;

  return {
    showOverlay,
    toggleOverlay,
    setOverlay: (val) => { globalShowOverlay = !!val; notify(); },
    safeRotation,
    safeZoneCount,
    getLocalCoordinates
  };
};

export const drawingService = {
  setOverlay: (val) => {
    globalShowOverlay = !!val;
    notify();
  },
  getOverlay: () => globalShowOverlay
};
