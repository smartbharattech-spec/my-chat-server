import { useState, useEffect, useCallback } from 'react';

/**
 * 🕉️ DEVTA SERVICE - State Management for Vastu Deities
 * Updated with Immutable State Updates for better React reactivity.
 */

class DevtaStore {
    constructor() {
        this.state = {
            isActive: false,
            showNames: true,
            showBhog: false,
            showPoints: true,
            showShading: true,
            activeLayers: {
                brahmasthan: true,
                fourDevtas: true,
                eightDevtas: true,
                thirtyTwoDevtas: true
            },
            activeTab: 'Markings', // 'Markings' or 'Area Analysis'
            mandalaSize: 1.0,
            showMandala: true, // Show/Hide primary lines/names
            mandalaStyle: 'circular', // 'circular' or 'grid'
            showDevtaDetails: false, // NEW: Show/Hide Hawan, Bhog, Attributes
        };

        this.listeners = new Set();
    }

    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notify() {
        if (typeof window !== 'undefined') {
            window.vastuDevtaState = this.state;
        }
        // Send a fresh copy of state to trigger React re-renders
        this.listeners.forEach(listener => listener({ ...this.state }));
    }

    toggleActive() {
        this.state = { ...this.state, isActive: !this.state.isActive };
        this.notify();
    }

    toggleMandala() {
        this.state = { ...this.state, showMandala: !this.state.showMandala };
        this.notify();
    }

    toggleBrahmasthan() {
        this.toggleLayer('brahmasthan');
    }

    toggleInnerDevtas() {
        this.toggleLayer('fourDevtas');
    }

    setActive(val) {
        this.state = { ...this.state, isActive: !!val };
        this.notify();
    }

    setOption(key, val) {
        if (key in this.state) {
            this.state = { ...this.state, [key]: val };
            this.notify();
        }
    }

    toggleLayer(layerKey) {
        if (layerKey in this.state.activeLayers) {
            this.state = {
                ...this.state,
                activeLayers: {
                    ...this.state.activeLayers,
                    [layerKey]: !this.state.activeLayers[layerKey]
                }
            };
            this.notify();
        }
    }

    setTab(tab) {
        this.state = { ...this.state, activeTab: tab };
        this.notify();
    }

    setMandalaSize(val) {
        this.state = { ...this.state, mandalaSize: parseFloat(val) || 1.0 };
        this.notify();
    }

    setMandalaStyle(style) {
        this.state = { ...this.state, mandalaStyle: style };
        this.notify();
    }

    getState() {
        return { ...this.state };
    }

    setState(data) {
        if (!data) return;
        this.state = {
            ...this.state,
            ...data
        };
        this.notify();
    }

    reset() {
        this.state = {
            isActive: false,
            showNames: true,
            showBhog: false,
            showPoints: true,
            showShading: true,
            activeLayers: {
                brahmasthan: true,
                fourDevtas: true,
                eightDevtas: true,
                thirtyTwoDevtas: true
            },
            activeTab: 'Markings',
            mandalaSize: 1.0,
            mandalaStyle: 'circular',
            showDevtaDetails: false,
        };

        this.notify();
    }
}

const devtaStore = new DevtaStore();

if (typeof window !== 'undefined') {
    window.addEventListener('vastu-restore-state', (e) => {
        console.log("[Service:Devta] Restore event received:", e.detail);
        if (e.detail) {
            if (e.detail.devta) {
                console.log("[Service:Devta] Loading saved state for project");
                devtaStore.setState(e.detail.devta);
            } else {
                console.log("[Service:Devta] No saved state found, resetting to default.");
                devtaStore.reset();
            }
        }
    });
}

export const useDevta = () => {
    const [state, setState] = useState(devtaStore.getState());

    useEffect(() => {
        const unsubscribe = devtaStore.subscribe((newState) => {
            setState(newState);
        });
        return unsubscribe;
    }, []);

    const toggleActive = useCallback(() => devtaStore.toggleActive(), []);
    const toggleMandala = useCallback(() => devtaStore.toggleMandala(), []);
    const toggleBrahmasthan = useCallback(() => devtaStore.toggleBrahmasthan(), []);
    const toggleInnerDevtas = useCallback(() => devtaStore.toggleInnerDevtas(), []);
    const setActive = useCallback((val) => devtaStore.setActive(val), []);
    const setOption = useCallback((key, val) => devtaStore.setOption(key, val), []);
    const toggleLayer = useCallback((layer) => devtaStore.toggleLayer(layer), []);
    const setTab = useCallback((tab) => devtaStore.setTab(tab), []);
    const setMandalaSize = useCallback((val) => devtaStore.setMandalaSize(val), []);
    const setMandalaStyle = useCallback((style) => devtaStore.setMandalaStyle(style), []);
    const toggleDevtaDetails = useCallback(() => devtaStore.setOption('showDevtaDetails', !devtaStore.state.showDevtaDetails), []);
    const reset = useCallback(() => devtaStore.reset(), []);


    return {
        ...state,
        toggleActive,
        toggleMandala,
        toggleBrahmasthan,
        toggleInnerDevtas,
        setActive,
        setOption,
        toggleLayer,
        setTab,
        setMandalaSize,
        setMandalaStyle,
        toggleDevtaDetails,
        reset
    };

};
