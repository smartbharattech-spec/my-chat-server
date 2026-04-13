import { useSyncExternalStore } from "react";

let centerPoint = null;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

export function calculateCenter(points) {
  if (!points || points.length < 3) return null;

  let area = 0;
  let cx = 0;
  let cy = 0;

  for (let i = 0; i < points.length; i++) {
    let j = (i + 1) % points.length;
    let crossProduct = points[i].x * points[j].y - points[j].x * points[i].y;
    area += crossProduct;
    cx += (points[i].x + points[j].x) * crossProduct;
    cy += (points[i].y + points[j].y) * crossProduct;
  }

  area /= 2;
  // Agar points linear hain to area 0 ho sakta hai
  if (area === 0) return null;

  cx /= 6 * area;
  cy /= 6 * area;

  centerPoint = { x: cx, y: cy };
  if (typeof window !== 'undefined') {
    window.vastuCenterState = centerPoint;
  }
  emit();
  return centerPoint;
}

export function resetCenter() {
  centerPoint = null;
  if (typeof window !== 'undefined') {
    window.vastuCenterState = null;
  }
  emit();
}

// ----------------------
// Restoration listener
// ----------------------
if (typeof window !== 'undefined') {
  window.addEventListener('vastu-restore-state', (e) => {
    console.log("[Service:Center] Restore event received:", e.detail);
    if (e.detail) {
      centerPoint = e.detail.center || null;
      console.log("[Service:Center] Updated center point:", centerPoint);
      if (typeof window !== 'undefined') {
        window.vastuCenterState = centerPoint;
      }
      emit();
    }
  });
}

export function useCenterPoint() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => centerPoint
  );
}

export function getCenterState() {
  return centerPoint;
}