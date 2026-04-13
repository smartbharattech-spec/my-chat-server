import { useSyncExternalStore } from "react";

/*
  Global reactive zoom store
  Works like a true service (no props, no parent needed)
*/

const STORAGE_KEY = "imageZoom";
const MIN = 0.1;
const MAX = 10;
const STEP = 0.1;

// ----------------------
// Global State
// ----------------------
let scale = 1;
if (typeof window !== 'undefined') {
  window.vastuZoomState = scale;
}
const listeners = new Set();

// Notify all React subscribers
function emit() {
  listeners.forEach((l) => l());
}

// Clamp + Save + Notify
function setScale(value) {
  scale = Math.min(Math.max(value, MIN), MAX);
  if (typeof window !== 'undefined') {
    window.vastuZoomState = scale;
  }
  emit();
}

// ----------------------
// Service API (can be called from anywhere)
// ----------------------
export function zoomIn() {
  console.log("Zoom In clicked! Current scale:", scale);
  setScale(scale + STEP);
}

export function zoomOut() {
  console.log("Zoom Out clicked! Current scale:", scale);
  setScale(scale - STEP);
}

export function setZoom(value) {
  if (typeof value === 'function') {
    setScale(value(scale));
  } else {
    setScale(value);
  }
}

export function resetZoom() {
  setScale(1);
}

// ----------------------
// React hook (subscribe to updates)
// ----------------------
export function useZoom() {
  const scaleValue = useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => scale
  );

  return {
    scale: scaleValue,
    zoomIn,
    zoomOut,
    setZoom,
    resetZoom,
  };
}

// --- 5. RESTORATION LISTENER ---
if (typeof window !== 'undefined') {
  window.addEventListener('vastu-restore-state', (e) => {
    console.log("[Service:Zoom] Restore event received:", e.detail);
    if (e.detail) {
      const zoomVal = typeof e.detail.zoom !== 'undefined' ? Number(e.detail.zoom) : 1;
      console.log("[Service:Zoom] Setting scale to:", zoomVal);
      setScale(zoomVal);
    }
  });
}
