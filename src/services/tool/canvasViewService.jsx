import { create } from 'zustand';

/**
 * 🛠️ UNIFIED CANVAS VIEW SERVICE
 * Manages scale and pan offset atomically to prevent rendering jitter.
 */
export const useCanvasView = create((set, get) => ({
    scale: 1,
    offset: { x: 0, y: 0 },
    isInteracting: false,

    // --- Actions ---
    setInteracting: (val) => set({ isInteracting: val }),

    setTransform: (newScale, newOffset) => {
        const clampedScale = Math.min(Math.max(newScale, 0.1), 10);
        set({ scale: clampedScale, offset: newOffset });
        // Update global window state for vanilla JS/legacy compatibility
        if (typeof window !== 'undefined') {
            window.vastuZoomState = clampedScale;
            window.vastuPanState = newOffset;
        }
    },

    syncTransform: (newScale, newOffset) => {
        const clampedScale = Math.min(Math.max(newScale, 0.1), 10);
        set({ scale: clampedScale, offset: newOffset, isInteracting: false });
        // Update global window state for vanilla JS/legacy compatibility
        if (typeof window !== 'undefined') {
            window.vastuZoomState = clampedScale;
            window.vastuPanState = newOffset;
        }
    },

    setScale: (newScale) => {
        const s = typeof newScale === 'function' ? newScale(get().scale) : newScale;
        const clamped = Math.min(Math.max(s, 0.1), 10);
        set({ scale: clamped });
        if (typeof window !== 'undefined') window.vastuZoomState = clamped;
    },

    setOffset: (newOffset) => {
        const o = typeof newOffset === 'function' ? newOffset(get().offset) : newOffset;
        set({ offset: o });
        if (typeof window !== 'undefined') window.vastuPanState = o;
    },

    resetView: () => {
        const defaultState = { scale: 1, offset: { x: 0, y: 0 } };
        set(defaultState);
        if (typeof window !== 'undefined') {
            window.vastuZoomState = 1;
            window.vastuPanState = defaultState.offset;
        }
    }
}));

// Restoration listener for project-wide state loading
if (typeof window !== 'undefined') {
    window.addEventListener('vastu-restore-state', (e) => {
        if (e.detail) {
            const zoomVal = typeof e.detail.zoom !== 'undefined' ? Number(e.detail.zoom) : 1;
            const panVal = e.detail.pan || { x: 0, y: 0 };
            useCanvasView.getState().setTransform(zoomVal, panVal);
        }
    });

    // Export legacy service-style functions for backward compatibility if needed
    window.vastuSetZoom = (val) => useCanvasView.getState().setScale(val);
    window.vastuSetPan = (val) => useCanvasView.getState().setOffset(val);
}
