import { Box, Typography, Button, CircularProgress, Dialog, TextField } from "@mui/material";
import { useState, useRef, useEffect } from "react";
import { useCanvasView } from "../services/tool/canvasViewService";
import { useRotation } from "../services/tool/rotateService";
import { useMeasure, handleClickOnImage, getBoundaryState } from "../services/tool/boundaryService";
import { useCenterPoint } from "../services/tool/centerService";
import { useShaktiChakra } from "../services/tool/shaktiChakraService";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { useScale } from "../services/tool/scaleService";
import { getLocalCoordinates } from "../services/tool/drawingService";
import { setMousePos as setBoundaryMousePos } from "../services/tool/boundaryService";

// Services
import { useEntrance, handleEntranceClick } from "../services/tool/entranceService";
import EntranceLayer from "./ImageCanvas/EntranceLayer";
import GridLayer from "./ImageCanvas/GridLayer";
import MarmaLayer from "./ImageCanvas/MarmaLayer";
import DevtaLayer from "./ImageCanvas/DevtaLayer";
import DrawingOverlay from "./ImageCanvas/DrawingOverlay";
import ScaleLayer from "./ImageCanvas/ScaleLayer";
import ZoneReportLayer from "./ImageCanvas/ZoneReportLayer";
import MeasureLayer from "./ImageCanvas/MeasureLayer";
import CrosshairLayer from "./ImageCanvas/CrosshairLayer";
import { useTapeMeasure } from "../services/tool/measureService";
import { useFreeHandActive, getFreeHandState, startPath, addPointToPath, endPath, addFreeHandText, setFreeHandMode } from "../services/tool/freeHandService";
import FreehandLayer from "./ImageCanvas/FreehandLayer";
import TextLayer from "./ImageCanvas/TextLayer";
import React, { useMemo } from "react";

// Memoized Layer components to prevent flickering
const MemoDrawingOverlay = React.memo(DrawingOverlay);
const MemoEntranceLayer = React.memo(EntranceLayer);
const MemoMarmaLayer = React.memo(MarmaLayer);
const MemoGridLayer = React.memo(GridLayer);
const MemoDevtaLayer = React.memo(DevtaLayer);
const MemoScaleLayer = React.memo(ScaleLayer);
const MemoZoneReportLayer = React.memo(ZoneReportLayer);
const MemoMeasureLayer = React.memo(MeasureLayer);
const MemoCrosshairLayer = React.memo(CrosshairLayer);
const MemoFreehandLayer = React.memo(FreehandLayer);
const MemoTextLayer = React.memo(TextLayer);

export default function ImageCanvas({ image, readOnly = false }) {
  const { scale, offset, setTransform, syncTransform, setScale: setZoom, setOffset, resetView, isInteracting, setInteracting } = useCanvasView();
  const { angle } = useRotation();
  const { points, active: isPlotActive } = useMeasure();
  const centerPoint = useCenterPoint();
  const { isActive, rotation, zoneCount } = useShaktiChakra();

  const isEntranceMode = useEntrance(state => state.isEntranceMode);
  const activePointsNeeded = useEntrance(state => state.activePointsNeeded);
  const globalDragging = useEntrance(state => state.dragging);
  const isTapeActive = useTapeMeasure(state => state.isActive);
  const tapeMeasureHasStart = useTapeMeasure(state => !!state.currentStart);
  const tapeMeasureHasEnd = useTapeMeasure(state => !!state.currentEnd);
  const isPickingScale = useScale(state => state.isPickingScale);
  const addTapePoint = useTapeMeasure(state => state.addPoint);
  const setTempEnd = useTapeMeasure(state => state.setTempEnd);
  
  const freeHandActive = useFreeHandActive();

  const isAnyToolActive = isPlotActive || isTapeActive || isPickingScale || isEntranceMode || freeHandActive;

  const wrapperRef = useRef(null);
  const containerRef = useRef(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [showAddTextDialog, setShowAddTextDialog] = useState(false);
  const [clickPos, setClickPos] = useState({ x: 0, y: 0 });
  const [newText, setNewText] = useState("");
  const viewportRect = useRef({ width: 0, height: 0, left: 0, top: 0 });
  const lastStableScaleRef = useRef(scale);

  // Reset loading state when image source changes
  useEffect(() => {
    setIsImageLoading(true);
  }, [image]);

  // When interaction stops, update the stable scale for sharpening
  useEffect(() => {
    if (!isInteracting) {
      lastStableScaleRef.current = scale;
    }
  }, [isInteracting, scale]);

  // Use the frozen scale for children during interaction
  const activeScale = isInteracting ? lastStableScaleRef.current : scale;

  // Update viewport dimensions on mount and resize
  useEffect(() => {
    const container = document.getElementById("canvas-viewport");
    if (!container) return;

    const updateRect = () => {
      viewportRect.current = container.getBoundingClientRect();
    };

    const observer = new ResizeObserver(updateRect);
    observer.observe(container);
    updateRect(); // Initial measure

    return () => observer.disconnect();
  }, []);

  // Drag Pan State (Delta-Based)
  const isDraggingItem = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 }); // Tracks previous frame's coordinates
  const startGesturePos = useRef({ x: 0, y: 0 }); // Tracks initial click/touch down

  const handleImageLoad = (e) => {
    setImgSize({
      w: e.target.naturalWidth,
      h: e.target.naturalHeight
    });
    setIsImageLoading(false);
  };

  // --- INTERACTION REFS (Moved Up to Avoid ReferenceErrors) ---
  const activePointers = useRef(new Map());
  const initialPinchDistance = useRef(null);
  const initialPinchScale = useRef(null);
  const initialPinchPan = useRef(null);
  const initialPinchCenter = useRef(null);
  const isZooming = useRef(false);

  // --- SCROLLBAR state & calculations (Moved Up to Avoid ReferenceErrors) ---
  const [viewportSize, setViewportSize] = useState({ w: 1000, h: 800 });
  const scaledObjWidth = imgSize.w * scale;
  const scaledObjHeight = imgSize.h * scale;
  const maxPanX = Math.max(0, (scaledObjWidth - viewportSize.w) / 2 + 300);
  const maxPanY = Math.max(0, (scaledObjHeight - viewportSize.h) / 2 + 300);
  const scrollbarThick = 12;
  const hRatio = Math.min(1, viewportSize.w / (scaledObjWidth + 600));
  const vRatio = Math.min(1, viewportSize.h / (scaledObjHeight + 600));
  const hThumbWidth = Math.max(40, viewportSize.w * hRatio);
  const vThumbHeight = Math.max(40, viewportSize.h * vRatio);
  const hTrackLength = viewportSize.w - scrollbarThick;
  const vTrackLength = viewportSize.h - scrollbarThick;
  const hThumbMaxPos = hTrackLength - hThumbWidth;
  const vThumbMaxPos = vTrackLength - vThumbHeight;
  const isDraggingScrollbar = useRef(false);
  const scrollbarDragStart = useRef({ mouse: 0, startOffset: 0, type: null });

  // Inverse logic for natural scrolling view
  const getThumbX = () => {
    if (maxPanX === 0) return 0;
    let ratio = (-offset.x + maxPanX) / (2 * maxPanX);
    ratio = Math.max(0, Math.min(1, ratio));
    return ratio * hThumbMaxPos;
  };

  const getThumbY = () => {
    if (maxPanY === 0) return 0;
    let ratio = (-offset.y + maxPanY) / (2 * maxPanY);
    ratio = Math.max(0, Math.min(1, ratio));
    return ratio * vThumbMaxPos;
  };

  // --- CENTER TEXT ADD EVENT ---
  useEffect(() => {
    const handler = (e) => {
        const { text } = e.detail;
        if (text && imgSize.w) {
            addFreeHandText(text, { x: imgSize.w / 2, y: imgSize.h / 2 });
            setFreeHandMode('pen');
        }
    };
    window.addEventListener('vastu-add-text-center', handler);
    return () => window.removeEventListener('vastu-add-text-center', handler);
  }, [imgSize]);

  const handleAddTextAtPoint = () => {
    if (!newText.trim()) return;
    addFreeHandText(newText, clickPos);
    setFreeHandMode('pen');
    setNewText("");
    setShowAddTextDialog(false);
  };

  // Measure viewport size on window resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setViewportSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMapClick = (e) => {
    if (readOnly) return;
    if (isDraggingItem.current) return;

    // Safety check for movement during click
    const dxTotal = Math.abs(e.clientX - startGesturePos.current.x);
    const dyTotal = Math.abs(e.clientY - startGesturePos.current.y);
    if (dxTotal > 7 || dyTotal > 7) return; // Threshold for treating as a click

    if (isTapeActive && !tapeMeasureHasEnd) {
      // Only add points if endpoint is not yet set
      const p = getLocalCoordinatesForImage(e, wrapperRef, scale, angle, imgSize);
      addTapePoint(p);
    } else if (isEntranceMode) {
      handleEntranceClick(e, wrapperRef, scale, angle, imgSize, activePointsNeeded);
    } else if (getFreeHandState().active && getFreeHandState().mode === 'text') {
      const p = getLocalCoordinatesForImage(e, wrapperRef, scale, angle, imgSize);
      setClickPos(p);
      setShowAddTextDialog(true);
    } else {
      handleClickOnImage(e, wrapperRef, scale, angle, imgSize);
    }
  };

  const getLocalCoordinatesForImage = (e, wrapperRef, scale, angle, imgSize) => {
    return getLocalCoordinates(e, wrapperRef.current, scale, angle, imgSize);
  };

  // --- ZOOM ON WHEEL (INTERPOLATED SMOOTH ANIMATION) ---
  const zoomRafId = useRef(null);
  const zoomStopTimer = useRef(null);
  const currentScaleRef = useRef(scale);
  const currentOffsetRef = useRef(offset);
  const targetScaleRef = useRef(scale);
  const targetOffsetRef = useRef(offset);

  // Use a ref for isInteracting so we can safely check it during render
  // without causing extra re-renders or hook count mismatches
  const isInteractingRef = useRef(false);
  isInteractingRef.current = isInteracting;

  // Always sync internal refs to the latest React state values
  // (These are just ref assignments, not state mutations - safe in render)
  if (!isInteractingRef.current) {
    currentScaleRef.current = scale;
    currentOffsetRef.current = { ...offset };
    targetScaleRef.current = scale;
    targetOffsetRef.current = { ...offset };
  }

  useEffect(() => {
    const container = containerRef.current;
    const canvas = wrapperRef.current;
    if (!container || !canvas) return;

    const animateZoom = () => {
      const canvasEl = wrapperRef.current;
      if (!canvasEl) return;

      const cScale = currentScaleRef.current;
      const tScale = targetScaleRef.current;
      const cOff = currentOffsetRef.current;
      const tOff = targetOffsetRef.current;

      const lerp = 0.2; // Slightly faster for responsiveness

      const diffScale = Math.abs(tScale - cScale);
      const diffX = Math.abs(tOff.x - cOff.x);
      const diffY = Math.abs(tOff.y - cOff.y);

      // Animation Completion Check
      if (diffScale < 0.0005 && diffX < 0.05 && diffY < 0.05) {
        currentScaleRef.current = tScale;
        currentOffsetRef.current = tOff;

        canvasEl.style.transform = `translate3d(calc(-50% + ${tOff.x}px), calc(-50% + ${tOff.y}px), 0) scale(${tScale}) rotate(${angle}deg)`;

        // 🚀 CRITICAL FIX: Clear the RAF ID immediately when the loop stops
        // This allows handleWheelManual to restart the loop if new events arrive
        // before the debounced setTransform (which causes a full React render) fires.
        zoomRafId.current = null;

        clearTimeout(zoomStopTimer.current);
        zoomStopTimer.current = setTimeout(() => {
          syncTransform(tScale, tOff);
        }, 100);
        return;
      }

      // Interpolate
      const nextScale = cScale + (tScale - cScale) * lerp;
      const nextOffset = {
        x: cOff.x + (tOff.x - cOff.x) * lerp,
        y: cOff.y + (tOff.y - cOff.y) * lerp,
      };

      currentScaleRef.current = nextScale;
      currentOffsetRef.current = nextOffset;

      canvasEl.style.transform = `translate3d(calc(-50% + ${nextOffset.x}px), calc(-50% + ${nextOffset.y}px), 0) scale(${nextScale}) rotate(${angle}deg)`;

      zoomRafId.current = requestAnimationFrame(animateZoom);
    };

    const handleWheelManual = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const container = containerRef.current;
      const canvasEl = wrapperRef.current;
      if (!container || !canvasEl) return;

      clearTimeout(zoomStopTimer.current);

      if (!isInteractingRef.current) {
        setInteracting(true);
      }

      // --- [FIX] Touchpad Panning vs Zooming ---
      // Distinguish between touchpad pinch-to-zoom (ctrlKey: true) and 
      // touchpad two-finger scroll (pan) for a more professional feel.
      if (!e.ctrlKey && Math.abs(e.deltaY) < 100 && Math.abs(e.deltaX) < 100) {
        // This is likely a touchpad scroll or high-res mouse scroll (not a zoom)
        const newOffset = { 
          x: currentOffsetRef.current.x - e.deltaX, 
          y: currentOffsetRef.current.y - e.deltaY 
        };
        currentOffsetRef.current = newOffset;
        targetOffsetRef.current = newOffset;
        canvasEl.style.transform = `translate3d(calc(-50% + ${newOffset.x}px), calc(-50% + ${newOffset.y}px), 0) scale(${currentScaleRef.current}) rotate(${angle}deg)`;
        
        zoomStopTimer.current = setTimeout(() => {
          syncTransform(currentScaleRef.current, currentOffsetRef.current);
        }, 150);
        return;
      }

      // Use target scale as base for next jump to prevent "stuttering" during rapid scrolls
      const prevScale = targetScaleRef.current;
      const prevOffset = targetOffsetRef.current;

      // Logarithmic/Exponential Zoom for natural feel
      // [FIX] Use actual delta values for smoother experience on touchpads/high-res mice
      const zoomIntensity = 0.001; 
      const delta = -e.deltaY;
      const factor = Math.exp(delta * zoomIntensity);
      const newScale = Math.min(Math.max(prevScale * factor, 0.1), 10);

      if (newScale === prevScale) {
        // Still need to trigger sync if we were interacting
        if (isInteractingRef.current) {
            zoomStopTimer.current = setTimeout(() => {
                setTransform(targetScaleRef.current, targetOffsetRef.current);
                setInteracting(false);
            }, 150);
        }
        return;
      }

      let rect = viewportRect.current;
      if (!rect || !rect.width) {
        rect = container.getBoundingClientRect();
        viewportRect.current = rect;
      }
      if (!rect || !rect.width) return; // Guard

      // Mouse position relative to viewport center
      const mouseX = e.clientX - (rect.left + rect.width / 2);
      const mouseY = e.clientY - (rect.top + rect.height / 2);

      // Formula: Offset must shift to keep the point under the mouse fixed
      const ratio = newScale / (prevScale || 1);
      const newOffset = {
        x: mouseX - (mouseX - prevOffset.x) * ratio,
        y: mouseY - (mouseY - prevOffset.y) * ratio
      };

      // Update Targets immediately
      targetScaleRef.current = newScale;
      targetOffsetRef.current = newOffset;

      // If animation not running, start it
      if (!zoomRafId.current) {
        zoomRafId.current = requestAnimationFrame(animateZoom);
      }
    };

    container.addEventListener("wheel", handleWheelManual, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheelManual);
      if (zoomRafId.current) cancelAnimationFrame(zoomRafId.current);
      clearTimeout(zoomStopTimer.current);
    };
  }, [setTransform, angle, setInteracting, image]); // Added image to re-run when viewport is available


  const handlePointerDown = (e) => {
    // 🛑 Cancel Zoom Animation immediately on any manual gesture
    if (zoomRafId.current) {
      cancelAnimationFrame(zoomRafId.current);
      zoomRafId.current = null;
      
      // 🚀 IMPORTANT: Commit the CURRENT animated values into the application state
      syncTransform(currentScaleRef.current, currentOffsetRef.current);
    }
    clearTimeout(zoomStopTimer.current);

    // Add/Update pointer
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // 🚀 [FIX] Always update lastPos on any pointer down to prevent jumping 
    // when switching between pointers or starting a new gesture.
    lastPos.current = { x: e.clientX, y: e.clientY };
    startGesturePos.current = { x: e.clientX, y: e.clientY };

    if (activePointers.current.size === 1) {
      isZooming.current = false;
      isDraggingItem.current = false;
    } else if (activePointers.current.size === 2) {
      isZooming.current = true;
      const pts = Array.from(activePointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      initialPinchDistance.current = dist;
      initialPinchScale.current = scale;
      initialPinchPan.current = { ...offset };
      
      const rect = containerRef.current.getBoundingClientRect();
      initialPinchCenter.current = {
        x: ((pts[0].x + pts[1].x) / 2) - (rect.left + rect.width / 2),
        y: ((pts[0].y + pts[1].y) / 2) - (rect.top + rect.height / 2)
      };
    }

    // --- FREEHAND DRAW START ---
    const fhState = getFreeHandState();
    if (fhState.active && activePointers.current.size === 1) {
      const p = getLocalCoordinatesForImage(e, wrapperRef, scale, angle, imgSize);
      startPath(p);
      e.stopPropagation();
    }
  };

  // --- GLOBAL MOVE/UP LISTENERS ---
  // We use window-level move/up to ensure panning/zooming continues 
  // even if the mouse leaves the canvas area, providing a pro desktop feel.
  useEffect(() => {
    const handleGlobalPointerMove = (e) => {
      // 1. Update pointer position for multi-touch/mouse tracking
      if (activePointers.current.has(e.pointerId)) {
        activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      // 2. Tool Tracking (Always track if over or dragging)
      const p = getLocalCoordinatesForImage(e, wrapperRef, scale, angle, imgSize);
      setBoundaryMousePos(p);
      if (isTapeActive) useTapeMeasure.getState().setMousePos(p);

      // 3. Single Pointer Interactions (Pan / Dragging)
      if (activePointers.current.size === 1) {
        // Tape Measure live line
        if (isTapeActive && tapeMeasureHasStart && !tapeMeasureHasEnd) {
          setTempEnd(p);
        }

        // --- FREEHAND DRAW MOVE ---
        const fhState = getFreeHandState();
        if (fhState.active && fhState.isDrawing) {
          addPointToPath(p);
          return;
        }

        if (readOnly) {
          // Panning only for read-only
          if (e.buttons === 1 || e.pointerType === 'touch') {
            const dx = e.clientX - lastPos.current.x;
            const dy = e.clientY - lastPos.current.y;
            const totalMoveX = Math.abs(e.clientX - startGesturePos.current.x);
            const totalMoveY = Math.abs(e.clientY - startGesturePos.current.y);

            if (totalMoveX > 3 || totalMoveY > 3) {
              isDraggingItem.current = true;
              if (!isInteractingRef.current) setInteracting(true);
              const newOffset = { x: currentOffsetRef.current.x + dx, y: currentOffsetRef.current.y + dy };
              currentOffsetRef.current = newOffset;
              targetOffsetRef.current = newOffset;
              if (wrapperRef.current) {
                wrapperRef.current.style.transform = `translate3d(calc(-50% + ${newOffset.x}px), calc(-50% + ${newOffset.y}px), 0) scale(${currentScaleRef.current}) rotate(${angle}deg)`;
              }
              clearTimeout(zoomStopTimer.current);
              zoomStopTimer.current = setTimeout(() => {
                syncTransform(currentScaleRef.current, currentOffsetRef.current);
              }, 150);
            }
            lastPos.current = { x: e.clientX, y: e.clientY };
          }
          return;
        }

        // Object Dragging Checks
        const tapeState = useTapeMeasure.getState();
        const scaleDragging = useScale.getState().isDragging;
        const boundaryDragging = getBoundaryState().isDragging;
        const entranceDragging = useEntrance.getState().dragging;

        if (tapeState.draggedPointInfo || scaleDragging || boundaryDragging || entranceDragging) {
          if (tapeState.draggedPointInfo) tapeState.updateDraggedPoint(p);
          return;
        }

        // Map Panning (Left Button or Touch)
        if (e.buttons === 1 || e.pointerType === 'touch') {
          const dx = e.clientX - lastPos.current.x;
          const dy = e.clientY - lastPos.current.y;
          const totalMoveX = Math.abs(e.clientX - startGesturePos.current.x);
          const totalMoveY = Math.abs(e.clientY - startGesturePos.current.y);

          if (totalMoveX > 3 || totalMoveY > 3) {
          isDraggingItem.current = true;
          if (!isInteractingRef.current) {
             setInteracting(true);
          }
          
          const newOffset = { 
            x: currentOffsetRef.current.x + dx, 
            y: currentOffsetRef.current.y + dy 
          };
          
          // 🔄 DIRECT DOM UPDATE FOR PANNING
          // We update refs and DOM directly to avoid 60FPS React state updates
          currentOffsetRef.current = newOffset;
          targetOffsetRef.current = newOffset;
          
          const canvasEl = wrapperRef.current;
          if (canvasEl) {
            canvasEl.style.transform = `translate3d(calc(-50% + ${newOffset.x}px), calc(-50% + ${newOffset.y}px), 0) scale(${currentScaleRef.current}) rotate(${angle}deg)`;
          }

          // Debounced synchronization back to state/store
          clearTimeout(zoomStopTimer.current);
          zoomStopTimer.current = setTimeout(() => {
            syncTransform(currentScaleRef.current, currentOffsetRef.current);
          }, 150);
        }
        lastPos.current = { x: e.clientX, y: e.clientY };
        }
      }

      // 4. Pinch-to-Zoom (Multi-touch)
      else if (activePointers.current.size === 2 && isZooming.current) {
        const pts = Array.from(activePointers.current.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[1].y - pts[0].y);

        if (initialPinchDistance.current) {
          const ratio = dist / initialPinchDistance.current;
          const newScale = Math.max(0.1, Math.min(10, initialPinchScale.current * ratio));
          const centerX = (pts[0].x + pts[1].x) / 2;
          const centerY = (pts[0].y + pts[1].y) / 2;
          const rect = viewportRect.current;

          if (rect && rect.width) {
            const mouseX = centerX - (rect.left + rect.width / 2);
            const mouseY = centerY - (rect.top + rect.height / 2);
            // [FIX] Safety check for division by zero
            const safeInitialScale = initialPinchScale.current || 1;
            const scaleRatio = newScale / safeInitialScale;
            const relInitialCenterX = initialPinchCenter.current.x - initialPinchPan.current.x;
            const relInitialCenterY = initialPinchCenter.current.y - initialPinchPan.current.y;
            
            const newOffset = {
              x: mouseX - relInitialCenterX * scaleRatio,
              y: mouseY - relInitialCenterY * scaleRatio,
            };

            currentScaleRef.current = newScale;
            targetScaleRef.current = newScale;
            currentOffsetRef.current = newOffset;
            targetOffsetRef.current = newOffset;

            if (wrapperRef.current) {
              wrapperRef.current.style.transform = `translate3d(calc(-50% + ${newOffset.x}px), calc(-50% + ${newOffset.y}px), 0) scale(${newScale}) rotate(${angle}deg)`;
            }

            if (!isInteractingRef.current) setInteracting(true);
            clearTimeout(zoomStopTimer.current);
            zoomStopTimer.current = setTimeout(() => {
              setTransform(newScale, newOffset);
              setInteracting(false);
            }, 100);
          }
        }
      }

      // 5. Scrollbar Dragging
      if (isDraggingScrollbar.current) {
        const { mouse, startOffset, type } = scrollbarDragStart.current;
        if (type === 'h') {
          const deltaMouse = e.clientX - mouse;
          const dragRatio = deltaMouse / (viewportSize.w - (imgSize.w * scale * (viewportSize.w / (imgSize.w * scale + 600)))); // This is getting complex, let's use the refs/state
          // Actually, let's just use the shared variables maxPanX, hThumbMaxPos etc.
          // Since they are available in the scope of useEffect
          const deltaMouseX = e.clientX - mouse;
          const dragRatioX = deltaMouseX / hThumbMaxPos;
          const newOffsetX = startOffset - (dragRatioX * 2 * maxPanX);
          setOffset(prev => ({ ...prev, x: Math.max(-maxPanX, Math.min(maxPanX, newOffsetX)) }));
        } else {
          const deltaMouseY = e.clientY - mouse;
          const dragRatioY = deltaMouseY / vThumbMaxPos;
          const newOffsetY = startOffset - (dragRatioY * 2 * maxPanY);
          setOffset(prev => ({ ...prev, y: Math.max(-maxPanY, Math.min(maxPanY, newOffsetY)) }));
        }
      }
    };

    const handleGlobalPointerUp = (e) => {
      activePointers.current.delete(e.pointerId);

      if (activePointers.current.size < 2) {
        isZooming.current = false;
        initialPinchDistance.current = null;
        
        // 🚀 [FIX] Refresh lastPos for the remaining pointer to prevent the "jump"
        // when one finger is lifted after a pinch gesture.
        if (activePointers.current.size === 1) {
          const remaining = Array.from(activePointers.current.values())[0];
          lastPos.current = { x: remaining.x, y: remaining.y };
        }
      }

      if (activePointers.current.size === 0) {
        isDraggingItem.current = false;
        if (!zoomRafId.current && !zoomStopTimer.current) {
          setInteracting(false);
        }
      }

      const tapeState = useTapeMeasure.getState();
      if (tapeState.draggedPointInfo) tapeState.stopDraggingPoint();

      if (isDraggingScrollbar.current) {
        isDraggingScrollbar.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }

      // --- FREEHAND DRAW END ---
      const fhState = getFreeHandState();
      if (fhState.isDrawing) {
        endPath();
      }
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [scale, offset, angle, imgSize, viewportSize, isTapeActive, tapeMeasureHasStart, tapeMeasureHasEnd, freeHandActive]);

  const handleScrollbarMouseDown = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingScrollbar.current = true;
    scrollbarDragStart.current = {
      mouse: type === 'h' ? e.clientX : e.clientY,
      startOffset: type === 'h' ? offset.x : offset.y,
      type
    };
    document.body.style.cursor = 'grab';
    document.body.style.userSelect = 'none';
  };


  if (!image) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", width: "100%", bgcolor: "#cbd5e1" }}>
        <Typography variant="h6" color="text.secondary">Please upload a floor plan</Typography>
      </Box>
    );
  }

  return (
    <Box
      id="canvas-viewport"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      // Panning and zoom move/up are handled globally in useEffect
      sx={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        // PREMIUM LIGHT BACKGROUND: Subtle Slate with Soft Grid and Glow
        bgcolor: "#f8fafc", // Very light slate
        backgroundImage: `
          radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.8) 0%, transparent 80%),
          radial-gradient(#e2e8f0 1.5px, transparent 1.5px)
        `,
        backgroundSize: "100% 100%, 30px 30px",
        backgroundPosition: "0 0, 0 0",
        cursor: (readOnly) ? "grab" : ((globalDragging || isAnyToolActive) ? "crosshair" : "grab"),
        "&:active": { cursor: (readOnly) ? "grabbing" : ((globalDragging || isAnyToolActive) ? "crosshair" : "grabbing") },
        touchAction: "none"
      }}
    >
      {/* RESET VIEW BUTTON */}
      <Button
        variant="contained"
        size="small"
        onClick={() => { resetView(); }}
        startIcon={<RestartAltIcon />}
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 1000,
          bgcolor: "white",
          color: "text.primary",
          "&:hover": { bgcolor: "#f1f5f9" },
          textTransform: "none",
          fontWeight: 600,
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
        }}
      >
        Reset View
      </Button>

      {/* INFINITE WORKSPACE WRAPPER */}
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          pointerEvents: "none"
        }}
      >
        <Box
          id="vastu-canvas"
          ref={wrapperRef}
          onClick={handleMapClick}
          style={{
            transform: `translate3d(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px), 0) scale(${scale}) rotate(${angle}deg)`,
            opacity: isImageLoading ? 0 : 1,
            transition: "opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: imgSize.w,
            height: imgSize.h,
            pointerEvents: "auto",
            transformOrigin: "center center",
            willChange: "transform",
            backfaceVisibility: "hidden",
            transformStyle: "preserve-3d",
            lineHeight: 0,
            // ENHANCED AESTHETICS (Light Theme optimized)
            boxShadow: "0 20px 40px -8px rgba(0, 0, 0, 0.15)",
            borderRadius: "4px",
            border: "1px solid rgba(0, 0, 0, 0.05)",
            bgcolor: "#fff",
            userSelect: "none"
          }}
        >
          <img
            src={image}
            alt="Floor Plan"
            onLoad={handleImageLoad}
            draggable={false}
            loading="eager"
            fetchpriority="high"
            style={{
              display: "block",
              pointerEvents: "none",
              maxWidth: "none",
              width: imgSize.w ? `${imgSize.w}px` : "auto",
              height: imgSize.h ? `${imgSize.h}px` : "auto",
              imageRendering: scale > 1 ? "high-quality" : "auto", // Dynamically handle quality
              fontSmoothing: "antialiased"
            }}
          />

          {/* DRAWING LAYERS - Memoized to prevent flickering during rapid state updates */}
          <MemoDrawingOverlay
            points={points}
            centerPoint={centerPoint}
            isActive={isActive}
            zoneCount={zoneCount}
            rotation={rotation}
            isPlotActive={isPlotActive}
            scale={activeScale}
            imgSize={imgSize}
          />
          <MemoFreehandLayer imgSize={imgSize} />
          <MemoTextLayer imgSize={imgSize} scale={activeScale} />
          <MemoEntranceLayer scale={activeScale} />
          <MemoMarmaLayer scale={activeScale} points={points} />
          <MemoGridLayer scale={activeScale} points={points} />
          <MemoDevtaLayer scale={activeScale} centerPoint={centerPoint} points={points} />
          <MemoScaleLayer scale={activeScale} angle={angle} imgSize={imgSize} />
          <MemoZoneReportLayer scale={activeScale} points={points} />
          <MemoMeasureLayer scale={activeScale} />
          {!readOnly && <MemoCrosshairLayer />}
        </Box>
      </Box>

      {/* 🔸 CUSTOM ADD TEXT DIALOG FOR CANVAS CLICKS */}
      <Dialog 
        open={showAddTextDialog} 
        onClose={() => setShowAddTextDialog(false)}
        sx={{ zIndex: 999999 }}
        PaperProps={{ sx: { borderRadius: 4, p: 1, minWidth: 320 } }}
      >
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                Add Label here
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', mb: 2, display: 'block' }}>
                Enter the text for this location.
            </Typography>
            <TextField
                autoFocus
                fullWidth
                placeholder="Living Room..."
                variant="outlined"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTextAtPoint()}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
                <Button onClick={() => setShowAddTextDialog(false)} sx={{ color: '#64748b' }}>Cancel</Button>
                <Button 
                    onClick={handleAddTextAtPoint} 
                    variant="contained" 
                    sx={{ bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' }, borderRadius: 2 }}
                >
                    Add Label
                </Button>
            </Box>
        </Box>
      </Dialog>

      {/* PREMIUM PRELOADER OVERLAY */}
      {isImageLoading && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            bgcolor: "rgba(248, 250, 252, 0.8)", // Semi-transparent version of screen bg
            backdropFilter: "blur(8px)",
            transition: "all 0.4s ease"
          }}
        >
          <Box sx={{ position: "relative", display: "inline-flex", mb: 2 }}>
            <CircularProgress 
              size={60} 
              thickness={4} 
              sx={{ color: "#f97316" }} 
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: "absolute",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box
                component="img"
                src="/assets/favicon.png" // Fallback to favicon if available, or just the spinner
                sx={{ width: 30, height: 30, borderRadius: "50%", opacity: 0.8 }}
                onError={(e) => e.target.style.display = 'none'}
              />
            </Box>
          </Box>
          <Typography 
            variant="h6" 
            sx={{ 
                color: "#1e293b", 
                fontWeight: 600, 
                letterSpacing: "0.5px",
                textShadow: "0 2px 4px rgba(0,0,0,0.05)"
            }}
          >
            Loading Map...
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ color: "#64748b", mt: 1, fontWeight: 500 }}
          >
            Optimizing for your device
          </Typography>
        </Box>
      )}

      {/* HORIZONTAL SCROLLBAR */}
      {scale > 0.5 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: `calc(100% - ${scrollbarThick}px)`,
            height: scrollbarThick,
            bgcolor: 'rgba(0,0,0,0.05)',
            zIndex: 1400,
            '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' }
          }}
        >
          <Box
            onMouseDown={(e) => handleScrollbarMouseDown(e, 'h')}
            sx={{
              position: 'absolute',
              top: 2,
              bottom: 2,
              left: getThumbX(),
              width: hThumbWidth,
              bgcolor: isDraggingScrollbar.current && scrollbarDragStart.current.type === 'h' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)',
              borderRadius: 4,
              cursor: 'grab',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.4)' },
              '&:active': { cursor: 'grabbing' }
            }}
          />
        </Box>
      )}

      {/* VERTICAL SCROLLBAR */}
      {scale > 0.5 && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: scrollbarThick,
            height: `calc(100% - ${scrollbarThick}px)`,
            bgcolor: 'rgba(0,0,0,0.05)',
            zIndex: 1400,
            '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' }
          }}
        >
          <Box
            onMouseDown={(e) => handleScrollbarMouseDown(e, 'v')}
            sx={{
              position: 'absolute',
              left: 2,
              right: 2,
              top: getThumbY(),
              height: vThumbHeight,
              bgcolor: isDraggingScrollbar.current && scrollbarDragStart.current.type === 'v' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)',
              borderRadius: 4,
              cursor: 'grab',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.4)' },
              '&:active': { cursor: 'grabbing' }
            }}
          />
        </Box>
      )}

    </Box>
  );
}
