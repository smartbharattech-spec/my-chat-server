import { create } from 'zustand';

export const useTapeMeasure = create((set, get) => ({
    isActive: false,
    points: [],     // Array of finalized pairs [{start, end}, ...]
    currentStart: null,  // First click point
    currentEnd: null,    // Second click point (before Set)
    tempEnd: null,       // Mouse position while moving (live line)
    mousePos: null,      // Current mouse position on canvas

    // Editing State
    selectedMeasurementIndex: null, // null means no line is selected
    draggedPointInfo: null,         // e.g., { index: 0, type: 'start' | 'end' }

    toggleActive: (val) => set({
        isActive: val !== undefined ? val : !get().isActive,
        currentStart: null,
        currentEnd: null,
        tempEnd: null,
        mousePos: null,
        selectedMeasurementIndex: null,
        draggedPointInfo: null,
    }),

    setMousePos: (p) => set({ mousePos: p }),

    setTempEnd: (p) => {
        // Only update if we have a start but no end yet
        if (get().currentStart && !get().currentEnd) {
            set({ tempEnd: p });
        }
    },

    addPoint: (p) => {
        const { currentStart, currentEnd } = get();
        if (!currentStart) {
            // First click: set start
            set({ currentStart: p, tempEnd: p });
        } else if (!currentEnd) {
            // Second click: fix the end point
            set({ currentEnd: p, tempEnd: null });
        }
        // If both are set, do nothing until user clicks Set
    },

    confirmMeasurement: () => {
        const { currentStart, currentEnd, points } = get();
        if (currentStart && currentEnd) {
            set({
                points: [...points, { start: currentStart, end: currentEnd }],
                currentStart: null,
                currentEnd: null,
                tempEnd: null,
                selectedMeasurementIndex: points.length, // Select newly created line
            });
        }
    },

    // Selection & Editing Actions
    selectMeasurement: (index) => set({ selectedMeasurementIndex: index }),

    startDraggingPoint: (index, type) => set({
        draggedPointInfo: { index, type },
        selectedMeasurementIndex: index
    }),

    updateDraggedPoint: (p) => {
        const { draggedPointInfo, points } = get();
        if (!draggedPointInfo) return;

        const newPoints = [...points];
        const line = { ...newPoints[draggedPointInfo.index] };
        line[draggedPointInfo.type] = p; // update 'start' or 'end'
        newPoints[draggedPointInfo.index] = line;

        set({ points: newPoints });
    },

    stopDraggingPoint: () => set({ draggedPointInfo: null }),

    deleteMeasurement: (index) => {
        const { points, selectedMeasurementIndex } = get();
        const newPoints = points.filter((_, i) => i !== index);
        set({
            points: newPoints,
            selectedMeasurementIndex: selectedMeasurementIndex === index ? null : selectedMeasurementIndex,
            draggedPointInfo: null
        });
    },

    clearSelection: () => set({ selectedMeasurementIndex: null }),

    undo: () => {
        const { currentEnd, currentStart, points } = get();
        if (currentEnd) {
            set({ currentEnd: null });
        } else if (currentStart) {
            set({ currentStart: null, tempEnd: null });
        } else if (points.length > 0) {
            set({ points: points.slice(0, -1) });
        }
    },

    clear: () => set({
        points: [], currentStart: null, currentEnd: null, tempEnd: null,
        mousePos: null,
        selectedMeasurementIndex: null, draggedPointInfo: null
    }),
}));
