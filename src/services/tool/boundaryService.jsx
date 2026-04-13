import { useSyncExternalStore } from "react";

// ----------------------
// Global state
// ----------------------
let active = false;
let points = [];
let boundaryThickness = 2;
let isDragging = false;
let mousePos = null;

import { calculateCenter } from "./centerService";

// snapshot ko stable rakhne ke liye
let snapshot = {
  active,
  points,
  boundaryThickness,
  isDragging,
};

let mouseSnapshot = mousePos;

const listeners = new Set();
const mouseListeners = new Set();

const emit = () => listeners.forEach((l) => l());
const emitMouse = () => mouseListeners.forEach((l) => l());

let history = [];
let redoStack = [];

// snapshot update helper
function updateSnapshot(saveHistory = true) {
  if (saveHistory) {
    history.push([...points]);
    if (history.length > 30) history.shift(); // Increased limit
    redoStack = []; // Clear redo on new action
  }
  snapshot = {
    active,
    points,
    boundaryThickness,
    isDragging,
  };
  if (typeof window !== 'undefined') {
    window.vastuBoundaryState = { points, active };
  }

  // 🔄 AUTO-CALCULATE CENTER
  if (points.length >= 3) {
    calculateCenter(points);
  }

  emit();
}

// ----------------------
// Service actions
// ----------------------
export function setBoundaryThickness(thickness) {
  boundaryThickness = thickness;
  updateSnapshot(false);
}

export function toggleMeasure() {
  active = !active;
  if (!active) isDragging = false;
  updateSnapshot(false); // Toggle shouldn't save history if points don't change
}

export function setIsDragging(val) {
  isDragging = val;
  updateSnapshot(false);
}

export function setMousePos(pos) {
  mousePos = pos;
  mouseSnapshot = pos;
  emitMouse();
}

export function addPoint(point) {
  if (!active) return;
  points = [...points, point];
  updateSnapshot();
}

export function updatePoint(index, newPoint, saveHistory = true) {
  points = points.map((p, i) => (i === index ? newPoint : p));
  updateSnapshot(saveHistory);
}

export function insertPoint(index, point) {
  if (!active) return;
  const newPoints = [...points];
  newPoints.splice(index, 0, point);
  points = newPoints;
  updateSnapshot();
}

export function removePoint(index) {
  if (!active) return;
  const newPoints = [...points];
  newPoints.splice(index, 1);
  points = newPoints;
  updateSnapshot();
}

export function undoPoint() {
  if (history.length > 1) {
    const currentState = history.pop();
    redoStack.push(currentState);
    points = [...history[history.length - 1]];
    updateSnapshot(false);
  } else if (history.length === 1) {
    const currentState = history.pop();
    redoStack.push(currentState);
    points = [];
    updateSnapshot(false);
  }
}

export function redoPoint() {
  if (redoStack.length > 0) {
    const nextState = redoStack.pop();
    history.push(nextState);
    points = [...nextState];
    updateSnapshot(false);
  }
}

export function resetMeasure() {
  points = [];
  active = false;
  history = [];
  redoStack = [];
  updateSnapshot(false);
}

export function setPoints(newPoints) {
  points = [...newPoints];
  updateSnapshot();
}

import { getLocalCoordinates } from "./drawingService";

// ----------------------
// Optional: Handle click on image
// ----------------------
export function handleClickOnImage(e, wrapperRef, scale, angle = 0, imgSize = { w: 0, h: 0 }) {
  if (!active || !wrapperRef.current) return;

  const p = getLocalCoordinates(e, wrapperRef.current, scale, angle, imgSize);
  addPoint(p);
}

// ----------------------
// React hooks
// ----------------------
export function useMeasure() {
  const state = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => snapshot
  );

  return {
    active: state.active,
    points: state.points,
    boundaryThickness: state.boundaryThickness,
    isDragging: state.isDragging,
    canUndo: history.length > 0,
    canRedo: redoStack.length > 0,
    toggleMeasure,
    addPoint,
    updatePoint,
    undoPoint,
    redoPoint,
    resetMeasure,
    insertPoint,
    removePoint,
  };
}

export function useMousePos() {
  return useSyncExternalStore(
    (cb) => {
      mouseListeners.add(cb);
      return () => mouseListeners.delete(cb);
    },
    () => mouseSnapshot
  );
}

export function getBoundaryState() {
  return { ...snapshot, mousePos, canUndo: history.length > 0, canRedo: redoStack.length > 0 };
}
// ----------------------
// Restoration listener
// ----------------------
if (typeof window !== 'undefined') {
  window.addEventListener('vastu-restore-state', (e) => {
    console.log("[Service:Boundary] Restore event received:", e.detail);
    if (e.detail) {
      points = (e.detail.boundary && e.detail.boundary.points) || [];
      active = (e.detail.boundary && e.detail.boundary.active) || false;
      console.log("[Service:Boundary] Updated state. Points count:", points.length);
      updateSnapshot();
    }
  });
}
