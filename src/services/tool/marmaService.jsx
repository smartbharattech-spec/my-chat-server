import { create } from 'zustand';

export const useMarma = create((set) => ({
    isActive: false,
    toggleMarma: (val) => set({ isActive: val }),
}));

// --- RESTORATION LISTENER ---
if (typeof window !== 'undefined') {
    window.addEventListener('vastu-restore-state', (e) => {
        if (e.detail && e.detail.marma) {
            useMarma.setState({ isActive: !!e.detail.marma.isActive });
        } else {
            // Default to off if no saved state found, do NOT auto-activate based on Shakti
            useMarma.setState({ isActive: false });
        }
    });
}
