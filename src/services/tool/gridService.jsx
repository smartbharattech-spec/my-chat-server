import { create } from 'zustand';

export const useGrid = create((set) => ({
    isActive: false,
    toggleGrid: (val) => set({ isActive: val }),
}));

// --- RESTORATION LISTENER ---
if (typeof window !== 'undefined') {
    window.addEventListener('vastu-restore-state', (e) => {
        if (e.detail && e.detail.grid) {
            useGrid.setState({ isActive: !!e.detail.grid.isActive });
        } else {
            useGrid.setState({ isActive: false });
        }
    });
}
