import React, { useState, useRef } from "react";
import ReactDOM from "react-dom";
import { useScale } from "../../services/tool/scaleService";
import { useRotation } from "../../services/tool/rotateService";
import { Box, TextField, InputAdornment, IconButton, Paper, Typography, Button, Dialog } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Draggable from 'react-draggable';

import { useToast } from '../../services/ToastService';
import { getLocalCoordinates } from '../../services/tool/drawingService';

export default function ScaleLayer({ scale, angle, imgSize }) {
    const { showToast } = useToast();
    const {
        isPickingScale, scalePoints, updatePoint,
        inputFeet, setInputFeet,
        inputInches, setInputInches,
        calculateScale, togglePickingScale,
        pixelsPerFoot, isPopupOpen, togglePopup, acceptPopup
    } = useScale();
    const [draggingIdx, setDraggingIdx] = useState(null);
    const nodeRef = useRef(null);

    // If neither picking nor already set, don't show
    if (!isPickingScale && !pixelsPerFoot) return null;

    // Handle Set Scale button click
    const handleSetScale = (e) => {
        e.stopPropagation();
        const ppf = calculateScale(false);
        if (ppf) {
            showToast(`Scale set: 1 ft = ${Math.round(ppf)} px. Now you can measure!`, 'success');
        }
    };


    const handlePointerDown = (e, idx) => {
        if (!isPickingScale) return;
        useScale.getState().setIsDragging(true);
        setDraggingIdx(idx);
    };

    const handlePointerMove = (e) => {
        if (draggingIdx === null) return;

        const container = document.getElementById('vastu-canvas');
        if (!container || !imgSize) return;

        // Use the unified coordinate mapping system
        const pos = getLocalCoordinates(e, container, scale, angle, imgSize);
        updatePoint(draggingIdx, pos.x, pos.y);
    };

    const handlePointerUp = () => {
        if (draggingIdx !== null) {
            useScale.getState().setIsDragging(false);
            if (pixelsPerFoot) {
                // If we were dragging and scale is active, recalc immediately but don't close popup
                calculateScale(false);
            }
        }
        setDraggingIdx(null);
    };




    return (
        <Box
            id="scale-layer-container"
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 200
            }}
        >
            <svg
                viewBox={imgSize && imgSize.w ? `0 0 ${imgSize.w} ${imgSize.h}` : `0 0 ${document.getElementById('vastu-canvas')?.clientWidth || 1000} ${document.getElementById('vastu-canvas')?.clientHeight || 1000}`}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    overflow: 'visible',
                    display: isPickingScale && !isPopupOpen ? 'block' : 'none',
                    pointerEvents: draggingIdx !== null ? 'all' : 'none'
                }}
            >
                {/* Infinite Crosshairs for Scale Points */}
                {scalePoints.map((p, idx) => (
                    <g key={`crosshair-${idx}`} style={{ pointerEvents: 'none' }}>
                        <line
                            x1="0" y1={p.y}
                            x2="100%" y2={p.y}
                            stroke="rgba(0,0,0,0.5)"
                            strokeWidth={1 / scale}
                            strokeDasharray={`${4 / scale}, ${4 / scale}`}
                        />
                        <line
                            x1={p.x} y1="0"
                            x2={p.x} y2="100%"
                            stroke="rgba(0,0,0,0.5)"
                            strokeWidth={1 / scale}
                            strokeDasharray={`${4 / scale}, ${4 / scale}`}
                        />
                    </g>
                ))}

                {/* Scale Line */}
                {scalePoints.length === 2 && (
                    <line
                        x1={scalePoints[0].x} y1={scalePoints[0].y}
                        x2={scalePoints[1].x} y2={scalePoints[1].y}
                        stroke={isPickingScale ? "#f97316" : "#3b82f6"}
                        strokeWidth={2 / scale}
                        strokeDasharray={isPickingScale ? `${5 / scale},${5 / scale}` : "none"}
                        opacity={isPickingScale ? 0.8 : 0.6}
                    />
                )}

                {/* Scale Handles (Plus Icons) */}
                {isPickingScale && scalePoints.map((p, idx) => (
                    <g
                        key={idx}
                        style={{ cursor: 'move', pointerEvents: 'all' }}
                        onPointerDown={(e) => handlePointerDown(e, idx)}
                    >
                        {/* Transparent hit area */}
                        <circle cx={p.x} cy={p.y} r={20 / scale} fill="transparent" />

                        {/* Plus Icon */}
                        <line
                            x1={p.x} y1={p.y - (10 / scale)}
                            x2={p.x} y2={p.y + (10 / scale)}
                            stroke="#000"
                            strokeWidth={2 / scale}
                        />
                        <line
                            x1={p.x - (10 / scale)} y1={p.y}
                            x2={p.x + (10 / scale)} y2={p.y}
                            stroke="#000"
                            strokeWidth={2 / scale}
                        />
                    </g>
                ))}
            </svg>

            {/* Constant Label on Overlay (HTML for interactive button) */}
            {pixelsPerFoot && scalePoints.length === 2 && (
                <div style={{
                    position: 'absolute',
                    left: (scalePoints[0].x + scalePoints[1].x) / 2 * scale, // Approximate for now, sync with canvas transform is tricky here without wrapper
                    // We can stick to SVG text if we don't need buttons, or use ForeignObject
                    // Let's use ForeignObject inside SVG to keep coordinates simple
                }} />
            )}

            {/* Constant Label and Edit Button (HTML Overlay) */}
            {pixelsPerFoot && scalePoints.length === 2 && (
                <div
                    style={{
                        position: 'absolute',
                        top: (scalePoints[0].y + scalePoints[1].y) / 2,
                        left: (scalePoints[0].x + scalePoints[1].x) / 2,
                        transform: `translate(-50%, -100%) scale(${1 / scale}) rotate(${-angle}deg)`, // Counter-scale & Counter-rotate
                        transformOrigin: 'bottom center',
                        pointerEvents: 'auto',
                        zIndex: 205
                    }}
                >
                    <Typography
                        variant="body2"
                        onClick={(e) => {
                            e.stopPropagation();
                            togglePopup();
                        }}
                        sx={{
                            whiteSpace: 'nowrap',
                            color: '#1e293b',
                            fontWeight: 900,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            textShadow: '0 0 4px white, 0 0 4px white, 0 0 4px white', // For readability on images
                            userSelect: 'none',
                            '&:hover': { color: '#f97316' }
                        }}
                    >
                        {inputFeet}' {inputInches}"
                    </Typography>
                </div>
            )}

            {/* STABLE DIALOG POPUP - Prevents "dancing" behavior */}
            <Dialog
                open={isPickingScale && isPopupOpen}
                onClose={() => togglePopup()}
                hideBackdrop={true} // Allow interacting with canvas
                disableEnforceFocus={true} // Critical for cross-interaction
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        overflow: 'hidden',
                        maxWidth: 320,
                        boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                        border: '1px solid #fecaca',
                        pointerEvents: 'auto'
                    }
                }}
                sx={{
                    zIndex: 3000,
                    pointerEvents: 'none', // Root is transparent to clicks
                    '& .MuiDialog-container': {
                        pointerEvents: 'none'
                    },
                    '& .MuiPaper-root': {
                        pointerEvents: 'auto' // Only dialog body blocks
                    }
                }}
            >
                <Box sx={{
                    background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
                    p: 2,
                    textAlign: "center",
                    borderBottom: "1px solid #ffedd5"
                }}>
                    <Typography variant="subtitle1" fontWeight={900} color="#7c2d12" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <span style={{ fontSize: '1.2rem' }}>📏</span> Set Plot Scale
                    </Typography>
                    <Typography variant="caption" color="#9a3412" fontWeight={600}>
                        Enter the distance between the two points
                    </Typography>
                </Box>

                <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
                        <TextField
                            label="Feet"
                            value={inputFeet}
                            onChange={(e) => setInputFeet(e.target.value)}
                            size="small"
                            type="number"
                            variant="outlined"
                            InputProps={{
                                endAdornment: <InputAdornment position="end">ft</InputAdornment>,
                                sx: { fontWeight: 800, borderRadius: 2 }
                            }}
                            sx={{ width: 100 }}
                        />
                        <TextField
                            label="Inches"
                            value={inputInches}
                            onChange={(e) => setInputInches(e.target.value)}
                            size="small"
                            type="number"
                            variant="outlined"
                            InputProps={{
                                endAdornment: <InputAdornment position="end">in</InputAdornment>,
                                sx: { fontWeight: 800, borderRadius: 2 }
                            }}
                            sx={{ width: 100 }}
                        />
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                        <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            onClick={(e) => { e.stopPropagation(); acceptPopup(); }}
                            startIcon={<CheckCircleIcon fontSize="small" />}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 800,
                                borderRadius: 3,
                                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)',
                                py: 1
                            }}
                        >
                            Next
                        </Button>
                        <Button
                            fullWidth
                            variant="outlined"
                            color="error"
                            onClick={togglePickingScale}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                borderRadius: 3,
                                py: 0.5,
                                fontSize: '0.8rem',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                '&:hover': { border: '1px solid #ef4444', bgcolor: 'rgba(239, 68, 68, 0.05)' }
                            }}
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Dialog>

            {/* Floating Set Scale Button */}
            {!isPopupOpen && isPickingScale && scalePoints.length === 2 && typeof document !== 'undefined' && ReactDOM.createPortal(
                <Box
                    sx={{
                        position: 'fixed',
                        bottom: 30,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 2000,
                        pointerEvents: 'auto'
                    }}
                >
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={handleSetScale}
                        sx={{
                            fontWeight: 800,
                            borderRadius: '30px',
                            px: 4,
                            py: 1.5,
                            boxShadow: '0 8px 24px rgba(34, 197, 94, 0.4)',
                            border: '2px solid #fff'
                        }}
                    >
                        Set Scale
                    </Button>
                </Box>,
                document.body
            )}
        </Box>
    );
}
