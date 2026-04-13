import { useSyncExternalStore } from "react";

const STORAGE_KEY = "imageRotate";
const STEP = 15; // har click me 15 deg

// ----------------------
// Global State
// ----------------------
let angle = 0;
if (typeof window !== 'undefined') {
  window.vastuRotateState = angle;
}
const listeners = new Set();

function emit() {
  listeners.forEach((l) => l());
}

function setAngle(value) {
  angle = value % 360; // 0-359 deg loop
  if (typeof window !== 'undefined') {
    window.vastuRotateState = angle;
  }
  emit();
}

// ----------------------
// Service API
// ----------------------
export function rotateClockwise() {
  setAngle(angle + STEP);
}

export function rotateCounterClockwise() {
  setAngle(angle - STEP);
}

export function setRotation(value) {
  setAngle(value);
}

export function resetRotation() {
  setAngle(0);
}

// ----------------------
// React hook
// ----------------------
export function useRotation() {
  const angleValue = useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => angle
  );

  return {
    angle: angleValue,
    rotateClockwise,
    rotateCounterClockwise,
    setRotation,
    resetRotation,
  };
}

// --- 5. RESTORATION LISTENER ---
if (typeof window !== 'undefined') {
  window.addEventListener('vastu-restore-state', (e) => {
    console.log("[Service:Rotate] Restore event received:", e.detail);
    if (e.detail) {
      const rotateVal = typeof e.detail.rotate !== 'undefined' ? Number(e.detail.rotate) : 0;
      console.log("[Service:Rotate] Setting angle to:", rotateVal);
      setAngle(rotateVal);
    }
  });
}
