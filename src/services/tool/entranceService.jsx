import { create } from 'zustand';

export const useEntrance = create((set, get) => ({
  entrances: [],
  currentEntrance: null,
  isEntranceMode: false,
  activeCategory: 'Entrance',
  activePointsNeeded: 2,
  showSpecDialog: false,
  tooltipScale: 1,
  editIndex: null,
  isEditing: false,
  dragging: null, // Global drag state for conflict resolution

  // --- NEW STATES FOR GLOBAL DIALOGS ---
  specInput: '',
  componentDetails: {
    itemColor: "",
    wallColor: "",
    ceilingColor: "",
    floorColor: ""
  },
  remedies: [],
  selectedRemedy: null,
  selectedEntranceIndex: null,
  remedyDialogOpen: false,
  showGraphDialog: false,
  openAlert: false,
  upgradeDialogOpen: false,
  customRemedyInput: '',
  useCustomRemedyToggle: false,
  graphData: [],
  customZoneRemedies: [], // New state for multi-zone expert remedies
  zoneRemedyDialogOpen: false,
  editingZoneRemedy: null,

  setSpecInput: (val) => set({ specInput: val }),
  setComponentDetails: (details) => set({ componentDetails: details }),
  setRemedies: (remedies) => set({ remedies }),
  setSelectedRemedy: (remedy) => set({ selectedRemedy: remedy }),
  setSelectedEntranceIndex: (index) => set({ selectedEntranceIndex: index }),
  setRemedyDialogOpen: (val) => set({ remedyDialogOpen: val }),
  setShowGraphDialog: (val) => set({ showGraphDialog: val }),
  setOpenAlert: (val) => set({ openAlert: val }),
  setUpgradeDialogOpen: (val) => set({ upgradeDialogOpen: val }),
  setCustomRemedyInput: (val) => set({ customRemedyInput: val }),
  setUseCustomRemedyToggle: (val) => set({ useCustomRemedyToggle: val }),
  setGraphData: (data) => set({ graphData: data }),
  setCustomZoneRemedies: (remedies) => set({ customZoneRemedies: remedies }),
  setZoneRemedyDialogOpen: (val) => set({ zoneRemedyDialogOpen: val }),
  setEditingZoneRemedy: (remedy) => set({ editingZoneRemedy: remedy }),

  setIsEntranceMode: (val, category = 'Entrance', pointsNeeded = 2) => set({
    isEntranceMode: val,
    activeCategory: category,
    activePointsNeeded: pointsNeeded,
    currentEntrance: null, // Reset progress when toggling
    isEditing: false,
    editIndex: null,
    dragging: null,
    specInput: '',
    componentDetails: { itemColor: "", wallColor: "", ceilingColor: "", floorColor: "" }
  }),
  setShowSpecDialog: (val) => set({ showSpecDialog: val }),
  setTooltipScale: (val) => set({ tooltipScale: val }),
  setEditState: (index, isEditing) => set({ editIndex: index, isEditing }),
  setActiveCategory: (category) => set({ activeCategory: category }),
  setDragging: (dragData) => set({ dragging: dragData }),

  handleShowRemedy: (remedy, index) => {
    set({
      selectedRemedy: remedy,
      selectedEntranceIndex: index,
      remedyDialogOpen: true,
      // Sync local display states if needed
      customRemedyInput: get().entrances[index]?.customRemedy || '',
      useCustomRemedyToggle: get().entrances[index]?.useCustomRemedy || false
    });
  },

  handleEditItem: (index, ent) => {
    set({
      isEntranceMode: false,
      activeCategory: ent.category || "Entrance",
      editIndex: index,
      isEditing: true,
      specInput: ent.specification || "",
      componentDetails: ent.details || { itemColor: "", wallColor: "", ceilingColor: "", floorColor: "" },
      showSpecDialog: true
    });
  },

  // Clicks handle karne ke liye naya function (Refactored for reliability)
  addPoint: (point) => set((state) => {
    const targetPoints = Number(state.activePointsNeeded) || 2;

    if (!state.currentEntrance) {
      return {
        currentEntrance: {
          points: [point],
          category: state.activeCategory,
          pointsNeeded: targetPoints,
          start: point // Legacy support
        },
        showSpecDialog: false,
        specInput: '',
        componentDetails: { itemColor: "", wallColor: "", ceilingColor: "", floorColor: "" }
      };
    }

    const newPoints = [...state.currentEntrance.points, point];
    const currentTargetPoints = state.currentEntrance.pointsNeeded || targetPoints;

    if (newPoints.length === currentTargetPoints) {
      return {
        currentEntrance: {
          ...state.currentEntrance,
          points: newPoints,
          end: point // Legacy support for Entrance
        },
        showSpecDialog: true
      };
    }

    return {
      currentEntrance: {
        ...state.currentEntrance,
        points: newPoints
      }
    };
  }),

  saveEntranceDetails: (spec, zone, details = {}, customRemedy = '', useCustomRemedy = false) => set((state) => ({
    entrances: [...state.entrances, {
      ...state.currentEntrance,
      specification: spec,
      zone: zone,
      details: details,
      customRemedy: customRemedy,
      useCustomRemedy: useCustomRemedy
    }],
    currentEntrance: null,
    isEntranceMode: false,
    showSpecDialog: false
  })),

  updateEntrance: (index, updates) => set((state) => ({
    entrances: state.entrances.map((ent, i) => i === index ? { ...ent, ...updates } : ent)
  })),

  removeEntrance: (index) => set((state) => ({
    entrances: state.entrances.filter((_, i) => i !== index)
  })),

  addCustomZoneRemedy: (remedy) => set((state) => ({
    customZoneRemedies: [...state.customZoneRemedies, { ...remedy, id: Date.now() }]
  })),

  updateCustomZoneRemedy: (id, updates) => set((state) => ({
    customZoneRemedies: state.customZoneRemedies.map(r => r.id === id ? { ...r, ...updates } : r)
  })),

  removeCustomZoneRemedy: (id) => set((state) => ({
    customZoneRemedies: state.customZoneRemedies.filter(r => r.id !== id)
  })),

  resetEntrance: () => set({ 
    currentEntrance: null, 
    entrances: [], 
    customZoneRemedies: [] 
  })
}));

import { getLocalCoordinates } from './drawingService';

// Canvas click handling helper
export const handleEntranceClick = (e, wrapperRef, scale, angle = 0, imgSize = { w: 0, h: 0 }, pointsNeeded = 4) => {
  if (!wrapperRef.current) return;
  const p = getLocalCoordinates(e, wrapperRef.current, scale, angle, imgSize);
  useEntrance.getState().addPoint(p, pointsNeeded);
};

// --- RESTORATION LISTENER ---
if (typeof window !== 'undefined') {
  window.addEventListener('vastu-restore-state', (e) => {
    console.log("[Service:Entrance] Restore event received:", e.detail);
    if (e.detail) {
      console.log("[Service:Entrance] Updating entrances count:", (e.detail.entrances || []).length);
      useEntrance.setState({
        entrances: e.detail.entrances || [],
        customZoneRemedies: e.detail.customZoneRemedies || [],
        currentEntrance: null,
        isEntranceMode: false
      });
    }
  });
}