import { useEntrance } from './entranceService';
import { useMarma } from './marmaService';

/**
 * PERSISTENT STATE SERVICE - Gathers state from all modules and saves to DB
 */

export const gatherFullState = (projectId) => {
    // 🛑 DATA ISOLATION GUARD: Don't gather state if IDs don't match
    if (projectId && window.vastuProjectId && String(projectId) !== String(window.vastuProjectId)) {
        console.error(`[DATA ISOLATION BLOCK] Cannot save ID ${projectId} because current memory belongs to ${window.vastuProjectId}.`);
        return null;
    }

    return {
        shakti: window.vastuShaktiState || null,
        marma: useMarma.getState() || { isActive: false }, // Added Marma persistence
        entrances: useEntrance.getState().entrances || [],
        customZoneRemedies: useEntrance.getState().customZoneRemedies || [], // Added persistence for multi-zone remedies
        boundary: window.vastuBoundaryState || { points: [], active: false },
        center: window.vastuCenterState || null,
        devta: window.vastuDevtaState || null,
        image: window.vastuImageState || null,
        overlay: window.vastuOverlayState ?? true,
        zoom: window.vastuZoomState || 1,
        rotate: window.vastuRotateState || 0,
        pan: window.vastuPanState || { x: 0, y: 0 },
        freehand: window.vastuFreeHandState || null
    };
};

export const saveProjectProgress = async (projectId, email) => {
    if (!projectId || !email) return { status: 'error', message: 'Missing project context' };

    const state = gatherFullState(projectId);

    // 🛑 If gatherFullState returns null, it means there's a project ID mismatch
    if (!state) {
        return { status: 'error', message: 'Data isolation guard prevented saving old memory to new project.' };
    }

    try {
        const response = await fetch("/api/projects.php", {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: projectId,
                email: email,
                project_data: JSON.stringify(state)
            })
        });

        return await response.json();
    } catch (err) {
        console.error("Save Error:", err);
        return { status: 'error', message: err.message };
    }
};
