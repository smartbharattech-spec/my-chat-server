import { useSyncExternalStore } from "react";

let panOffset = { x: 0, y: 0 };
const listeners = new Set();

function emit() {
    listeners.forEach((l) => l());
}

export function setPan(offset) {
    if (typeof offset === 'function') {
        panOffset = offset(panOffset);
    } else {
        panOffset = offset;
    }
    if (typeof window !== 'undefined') {
        window.vastuPanState = panOffset;
    }
    emit();
}

export function resetPan() {
    panOffset = { x: 0, y: 0 };
    if (typeof window !== 'undefined') {
        window.vastuPanState = panOffset;
    }
    emit();
}

export function usePan() {
    const offset = useSyncExternalStore(
        (callback) => {
            listeners.add(callback);
            return () => listeners.delete(callback);
        },
        () => panOffset
    );

    return { offset, setPan, resetPan };
}

// Restoration listener
if (typeof window !== 'undefined') {
    window.addEventListener('vastu-restore-state', (e) => {
        if (e.detail && e.detail.pan) {
            panOffset = e.detail.pan;
            if (typeof window !== 'undefined') {
                window.vastuPanState = panOffset;
            }
            emit();
        }
    });

    // Initialize window.vastuPanState if it doesn't exist
    if (window.vastuPanState === undefined) {
        window.vastuPanState = panOffset;
    }
}
