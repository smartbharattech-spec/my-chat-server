import { create } from 'zustand';

export const useScale = create((set, get) => ({
    isPickingScale: false,
    isPopupOpen: false, // New state for popup visibility
    scalePoints: [], // [{x, y}, {x, y}]
    inputFeet: 10,
    inputInches: 0,
    pixelsPerFoot: null,
    isMeasuring: false,
    isDragging: false,

    togglePickingScale: () => {
        const { isPickingScale } = get();
        if (!isPickingScale) {
            set({
                isPickingScale: true,
                isPopupOpen: true, // Open popup when starting
                isMeasuring: false,
                scalePoints: [] // Points are empty initially
            });
        } else {
            set({ isPickingScale: false, isPopupOpen: false, scalePoints: [], isDragging: false });
        }
    },

    setIsDragging: (val) => set({ isDragging: val }),

    acceptPopup: () => {
        let cx = 500, cy = 500;
        const container = document.getElementById('vastu-canvas');
        if (container) {
            cx = container.clientWidth / 2;
            cy = container.clientHeight / 2;
        }

        set({
            isPopupOpen: false, // Close popup, show points
            scalePoints: [
                { x: cx - 100, y: cy },
                { x: cx + 100, y: cy }
            ]
        });
    },

    togglePopup: () => set(state => ({ isPopupOpen: !state.isPopupOpen })),

    setScalePoints: (points) => set({ scalePoints: points }),

    updatePoint: (index, x, y) => {
        const { scalePoints } = get();
        const newPoints = [...scalePoints];
        newPoints[index] = { x, y };
        set({ scalePoints: newPoints });
    },

    setInputFeet: (val) => set({ inputFeet: val }),
    setInputInches: (val) => set({ inputInches: val }),

    calculateScale: (shouldClosePopup = true) => {
        const { scalePoints, inputFeet, inputInches } = get();
        if (scalePoints.length === 2) {
            const dx = scalePoints[1].x - scalePoints[0].x;
            const dy = scalePoints[1].y - scalePoints[0].y;
            const distancePixels = Math.sqrt(dx * dx + dy * dy);
            const totalFeet = parseFloat(inputFeet) + (parseFloat(inputInches) / 12);
            if (totalFeet > 0) {
                const ppf = distancePixels / totalFeet;
                set({ pixelsPerFoot: ppf, isPickingScale: false });
                return ppf;
            }
        }
        return null;
    },

    toggleMeasuring: () => set(state => ({ isMeasuring: !state.isMeasuring, isPickingScale: false, isPopupOpen: false })),

    clearScale: () => set({
        isPickingScale: false,
        isPopupOpen: false,
        scalePoints: [],
        pixelsPerFoot: null,
        isMeasuring: false
    })
}));

// RESTORATION LISTENER
if (typeof window !== 'undefined') {
    window.addEventListener('vastu-restore-state', (e) => {
        if (e.detail && e.detail.scale) {
            useScale.setState(e.detail.scale);
        }
    });
}
