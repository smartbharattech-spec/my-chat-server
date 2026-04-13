import { useSyncExternalStore } from 'react';

// --- State ---
let active = false;
let isDrawing = false;
let mode = 'pen'; // 'pen' | 'eraser' | 'text'
let color = '#ef4444'; // Default red
let size = 3;
let paths = []; // Array of { points: [{x,y}], color, size, mode }
let texts = []; // Array of { id, x, y, text, color, size }
let currentPath = null;

// Snapshot for useSyncExternalStore
let snapshot = {
  active,
  isDrawing,
  mode,
  color,
  size,
  paths,
  texts,
  currentPath
};

const listeners = new Set();
const emit = () => {
  snapshot = { active, isDrawing, mode, color, size, paths, texts, currentPath };
  
  // Update global state for persistence
  if (typeof window !== 'undefined') {
    window.vastuFreeHandState = { paths, texts, active };
  }
  
  listeners.forEach(l => l());
};

// --- Actions ---

export function toggleFreeHand(val) {
  active = typeof val === 'boolean' ? val : !active;
  if (!active) isDrawing = false;
  emit();
}

export function setFreeHandMode(m) {
  mode = m; // 'pen', 'eraser' or 'text'
  emit();
}

export function setFreeHandColor(c) {
  color = c;
  emit();
}

export function setFreeHandSize(s) {
  size = s;
  emit();
}

export function addFreeHandText(text, point) {
    if (!text) return;
    texts = [...texts, {
        id: Date.now() + Math.random(),
        x: point.x,
        y: point.y,
        text,
        color,
        size: Math.max(14, size * 5) // Text should be readable
    }];
    emit();
}

export function updateFreeHandText(id, updates) {
    texts = texts.map(t => t.id === id ? { ...t, ...updates } : t);
    emit();
}

export function removeFreeHandText(id) {
    texts = texts.filter(t => t.id !== id);
    emit();
}

export function startPath(point) {
  if (!active || mode === 'text') return;
  isDrawing = true;
  currentPath = {
    points: [point],
    color,
    size,
    mode
  };
  emit();
}

export function addPointToPath(point) {
  if (!isDrawing || !currentPath) return;
  
  // Optimization: Don't add if point is too close to last point
  const lastPoint = currentPath.points[currentPath.points.length - 1];
  const dist = Math.sqrt(Math.pow(point.x - lastPoint.x, 2) + Math.pow(point.y - lastPoint.y, 2));
  
  if (dist > 1.5) {
    // Immutable update to ensure React triggers re-render
    currentPath = {
      ...currentPath,
      points: [...currentPath.points, point]
    };
    emit();
  }
}

export function endPath() {
  if (!isDrawing || !currentPath) return;
  
  if (currentPath.points.length > 1) {
    paths = [...paths, currentPath];
  }
  
  currentPath = null;
  isDrawing = false;
  emit();
}

export function undoFreeHand() {
  if (paths.length > 0) {
    paths = paths.slice(0, -1);
    emit();
  } else if (texts.length > 0) {
    texts = texts.slice(0, -1);
    emit();
  }
}

export function clearFreeHand() {
  paths = [];
  texts = [];
  currentPath = null;
  isDrawing = false;
  emit();
}

// --- Hook ---

export function useFreeHand() {
  const state = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => snapshot
  );

  return {
    ...state,
    toggleFreeHand,
    setFreeHandMode,
    setFreeHandColor,
    setFreeHandSize,
    addFreeHandText,
    updateFreeHandText,
    removeFreeHandText,
    undoFreeHand,
    clearFreeHand
  };
}

export function useFreeHandActive() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => active
  );
}

export function getFreeHandState() {
  return { active, isDrawing, mode, color, size, paths, texts, currentPath };
}

// --- Restoration Listener ---
if (typeof window !== 'undefined') {
  window.addEventListener('vastu-restore-state', (e) => {
    if (e.detail && e.detail.freehand) {
      paths = e.detail.freehand.paths || [];
      texts = e.detail.freehand.texts || [];
      emit();
    }
  });
}
