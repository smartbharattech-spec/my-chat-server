import React from "react";
import { Box, Typography, IconButton, Tooltip, Button, TextField, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions, Zoom, Slider } from "@mui/material";
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import CreateIcon from "@mui/icons-material/Create"; // 🔥 draw icon
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import ClearIcon from "@mui/icons-material/Clear";
import VisibilityIcon from "@mui/icons-material/Visibility"; // 🔥 Show icon
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff"; // 🔥 Hide icon
import StraightenIcon from "@mui/icons-material/Straighten"; // 🔥 Scale/Measure icon
import RuleIcon from "@mui/icons-material/Rule"; // 🔥 Set Measure icon
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BrushIcon from "@mui/icons-material/Brush";
import DeleteIcon from "@mui/icons-material/Delete";
import PaletteIcon from "@mui/icons-material/Palette";
import AutoFixOffIcon from '@mui/icons-material/AutoFixOff';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import Popover from '@mui/material/Popover';

import { useCanvasView } from "../services/tool/canvasViewService";
import {
  setRotation,
  useRotation
} from "../services/tool/rotateService";
import {
  toggleMeasure,
  undoPoint,
  redoPoint,
  useMeasure,
  setBoundaryThickness
} from "../services/tool/boundaryService";

// Nayi service se logic import kiya
import { useDrawingLogic } from "../services/tool/drawingService";
import { useScale } from "../services/tool/scaleService";
import { useShaktiChakra } from "../services/tool/shaktiChakraService";
import { useDevta } from "../services/tool/devtaService";
import { useMarma } from "../services/tool/marmaService";
import { useGrid } from "../services/tool/gridService";
import { useEntrance } from "../services/tool/entranceService";
import { resetCenter } from "../services/tool/centerService";
import { useTapeMeasure } from "../services/tool/measureService";
import { detectBoundary } from "../services/tool/autoBoundaryService";
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { Backdrop, CircularProgress } from '@mui/material';
import { setPoints } from "../services/tool/boundaryService";
import { useFreeHand } from "../services/tool/freeHandService";


export default function TopBar({ onShowDetails, image }) {
  const { scale, offset, setTransform } = useCanvasView();
  const { active, undoPoint, redoPoint, canUndo, canRedo, boundaryThickness } = useMeasure();

  // Drawing service se toggle state aur function nikaala
  const { showOverlay, toggleOverlay } = useDrawingLogic();

  const {
    isPickingScale, togglePickingScale, clearScale,
    inputFeet, setInputFeet,
    inputInches, setInputInches,
    calculateScale, pixelsPerFoot
  } = useScale();

  const points = useMeasure(s => s.points);

  const { resetMeasure: resetBoundary } = useMeasure();
  const { reset: resetChakra } = useShaktiChakra();
  const devta = useDevta();
  const { toggleMarma } = useMarma();
  const { toggleGrid } = useGrid();
  const { resetEntrance } = useEntrance();
  const tapeMeasure = useTapeMeasure();
  const tapeCurrentEnd = useTapeMeasure(s => s.currentEnd);
  const confirmMeasurement = useTapeMeasure(s => s.confirmMeasurement);

  // Angle state for highlighting active button
  const { angle } = useRotation();

  // Freehand Service
  const freeHand = useFreeHand();
  const [colorAnchorEl, setColorAnchorEl] = React.useState(null);
  const [sizeAnchorEl, setSizeAnchorEl] = React.useState(null);

  const [showResetConfirm, setShowResetConfirm] = React.useState(false);
  const [showTextDialog, setShowTextDialog] = React.useState(false);
  const [newText, setNewText] = React.useState("");
  const [isScanning, setIsScanning] = React.useState(false);

  const handleAddTextToCenter = () => {
    if (!newText.trim()) return;
    // Dispatch event to ImageCanvas to get center coordinates
    window.dispatchEvent(new CustomEvent('vastu-add-text-center', { detail: { text: newText } }));
    setNewText("");
    setShowTextDialog(false);
  };

  const handleAutoScan = async () => {
    if (!image) return;
    setIsScanning(true);
    try {
      const detectedPoints = await detectBoundary(image);
      if (detectedPoints && detectedPoints.length >= 3) {
        setPoints(detectedPoints);
        if (!active) toggleMeasure(); // Auto-enable tool to show result
      }
    } catch (err) {
      console.error("Auto-scan failed:", err);
      alert("Auto Boundary detection failed. Please try manual drawing.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmReset = () => {
    try {
      // 1. Plot Boundary & Center
      resetBoundary();
      resetCenter();

      // 2. Shakti Chakra
      if (typeof resetChakra === 'function') resetChakra();

      // 3. Deities & Marma
      if (devta && typeof devta.reset === 'function') devta.reset();
      if (typeof toggleMarma === 'function') toggleMarma(false);

      // 4. Grid & Entrances
      if (typeof toggleGrid === 'function') toggleGrid(false);
      if (typeof resetEntrance === 'function') resetEntrance();

      // 5. Tape & Exclusions
      if (tapeMeasure && typeof tapeMeasure.clear === 'function') tapeMeasure.clear();

      // 6. Explicitly ensure everything is off
      if (typeof useEntrance.getState === 'function') useEntrance.getState().setIsEntranceMode(false);

    } catch (err) {
      console.error("[TopBar Reset Error]:", err);
    }
    setShowResetConfirm(false);
  };

  const calculateArea = () => {
    if (!pixelsPerFoot || points.length < 3) return 'N/A';

    // Shoelace formula for area in pixels squared
    let areaPx = 0;
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      areaPx += p1.x * p2.y - p2.x * p1.y;
    }
    areaPx = Math.abs(areaPx) / 2;

    // Convert to sq ft
    const areaSqFt = areaPx / (pixelsPerFoot * pixelsPerFoot);
    return `${Math.round(areaSqFt)} sq.ft(${Math.round(areaPx)} px²)`;
  };

  const totalArea = calculateArea();

  return (
    <Box
      sx={{
        height: { xs: "auto", md: "70px" },
        minHeight: "60px",
        background: "rgba(249, 115, 22, 0.95)",
        backdropFilter: "blur(20px)",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: "center",
        justifyContent: "space-between",
        px: { xs: 1, sm: 3 },
        py: { xs: 1, md: 0 },
        color: "#fff",
        boxShadow: "0 4px 30px rgba(0,0,0,0.2)",
        position: 'relative', 
        zIndex: 1400,
        isolation: 'isolate',
        pointerEvents: 'auto',
        borderBottom: "1px solid rgba(255,255,255,0.2)",
        gap: { xs: 1, md: 0 }
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* LEFT TITLE */}
      <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, width: { xs: '100%', md: 'auto' }, justifyContent: { xs: 'center', md: 'flex-start' } }}>
        <Typography variant="h6" sx={{ fontWeight: 800, whiteSpace: 'nowrap', fontSize: { xs: '0.9rem', sm: '1.25rem' }, letterSpacing: 0.5 }}>
          Vastu Tracker Pro
        </Typography>
      </Box>

      {/* RIGHT TOOLS - SCROLLABLE ON MOBILE */}
      <Box sx={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 0.5, 
        width: { xs: '100%', md: 'auto' },
        overflowX: { xs: 'auto', md: 'visible' },
        pb: { xs: 0.5, md: 0 },
        '&::-webkit-scrollbar': { height: '4px' },
        '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.3)', borderRadius: '10px' }
      }}>

        {/* 1. VIEW CONTROLS */}
        <Tooltip disableFocusListener disableTouchListener title={showOverlay ? "Hide Drawing Layers" : "Show Drawing Layers"}>
          <IconButton
            onClick={(e) => { toggleOverlay(); e.currentTarget.blur(); }}
            sx={{ color: showOverlay ? "#fff" : "rgba(255,255,255,0.5)" }}
          >
            {showOverlay ? <VisibilityIcon /> : <VisibilityOffIcon />}
          </IconButton>
        </Tooltip>

        <Tooltip disableFocusListener disableTouchListener title="Property & Personal Details">
          <IconButton
            onClick={(e) => { onShowDetails && onShowDetails(); e.currentTarget.blur(); }}
            sx={{ color: "#fff" }}
          >
            <AssignmentIcon />
          </IconButton>
        </Tooltip>

        <Tooltip disableFocusListener disableTouchListener title="Zoom Out">
          <IconButton onClick={(e) => {
            const newScale = Math.max(scale - 0.1, 0.1);
            const ratio = newScale / (scale || 1);
            setTransform(newScale, { x: offset.x * ratio, y: offset.y * ratio });
            e.currentTarget.blur();
          }} sx={{ color: "#fff" }}>
            <ZoomOutIcon />
          </IconButton>
        </Tooltip>

        <Tooltip disableFocusListener disableTouchListener title="Zoom In">
          <IconButton onClick={(e) => {
            const newScale = Math.min(scale + 0.1, 10);
            const ratio = newScale / (scale || 1);
            setTransform(newScale, { x: offset.x * ratio, y: offset.y * ratio });
            e.currentTarget.blur();
          }} sx={{ color: "#fff" }}>
            <ZoomInIcon />
          </IconButton>
        </Tooltip>

        <Box sx={{ width: 1, height: 24, background: "rgba(255,255,255,.3)", mx: 1 }} />


        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', bgcolor: 'rgba(255,255,255,0.15)', p: 0.5, borderRadius: '14px', flexShrink: 0 }}>
          {[
            { deg: 0, label: 'N', tooltip: 'North (0°)' },
            { deg: 90, label: 'E', tooltip: 'East (90°)' },
            { deg: 180, label: 'S', tooltip: 'South (180°)' },
            { deg: 270, label: 'W', tooltip: 'West (270°)' }
          ].map((item) => {
            const isActive = Math.abs(angle - item.deg) < 0.1;
            return (
              <Tooltip key={item.deg} disableFocusListener disableTouchListener title={item.tooltip}>
                <Button
                  variant={isActive ? "contained" : "text"}
                  size="small"
                  onClick={(e) => { setRotation(item.deg); e.currentTarget.blur(); }}
                  sx={{
                    minWidth: { xs: '32px', sm: '40px' },
                    height: { xs: '28px', sm: '32px' },
                    px: { xs: 0.5, sm: 1 },
                    bgcolor: isActive ? '#fff' : 'transparent',
                    color: isActive ? '#f97316' : '#fff',
                    fontSize: '0.7rem',
                    fontWeight: 900,
                    borderRadius: '10px',
                    textTransform: 'none',
                    "&:hover": {
                      bgcolor: isActive ? '#fff' : 'rgba(255,255,255,0.2)',
                    },
                    transition: '0.2s all'
                  }}
                >
                  {item.label}
                </Button>
              </Tooltip>
            );
          })}
        </Box>

        <Box sx={{ width: 1, height: 24, background: "rgba(255,255,255,.3)", mx: 1 }} />

        {/* 3. DRAW & MEASURE TOOLS */}

        {/* Draw Line */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: active ? "rgba(255,255,255,0.1)" : "transparent", px: 1, borderRadius: 2 }}>
          <Tooltip disableFocusListener disableTouchListener title={active ? "Stop Line Drawing" : "Draw Red Plot Lines (Boundary)"}>
            <IconButton
              onClick={(e) => { toggleMeasure(); e.currentTarget.blur(); }}
              sx={{ color: active ? "#22c55e" : "#fff", bgcolor: active ? "rgba(255,255,255,0.2)" : "transparent" }}
            >
              <CreateIcon />
            </IconButton>
          </Tooltip>

          {/* 🔥 MAGIC AUTO-SCAN BUTTON */}
          {image && (
            <Tooltip disableFocusListener disableTouchListener title="Auto-Detect Layout (Magic Scan)">
              <IconButton
                onClick={(e) => { handleAutoScan(); e.currentTarget.blur(); }}
                sx={{ 
                  color: "#fff", 
                  bgcolor: "rgba(255,255,255,0.1)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                  ml: 0.5
                }}
              >
                <AutoFixHighIcon />
              </IconButton>
            </Tooltip>
          )}
          {active && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: { xs: 80, sm: 130 }, flexShrink: 0 }}>
              <Tooltip title="Boundary Thickness">
                <Slider
                  size="small"
                  value={boundaryThickness || 2}
                  min={1}
                  max={10}
                  step={1}
                  onChange={(e, val) => setBoundaryThickness(val)}
                  sx={{
                    color: '#fff',
                    flexGrow: 1,
                    '& .MuiSlider-thumb': {
                      width: 10,
                      height: 10,
                      backgroundColor: '#fff',
                    }
                  }}
                />
              </Tooltip>
            </Box>
          )}
        </Box>

        <Tooltip disableFocusListener disableTouchListener title="Undo Last Point">
          <IconButton
            onClick={(e) => { undoPoint(); e.currentTarget.blur(); }}
            sx={{ color: active ? "#fff" : "rgba(255,255,255,0.3)" }}
            disabled={!active || !canUndo}
          >
            <UndoIcon />
          </IconButton>
        </Tooltip>

        <Tooltip disableFocusListener disableTouchListener title="Redo Point">
          <IconButton
            onClick={(e) => { redoPoint(); e.currentTarget.blur(); }}
            sx={{ color: (active && canRedo) ? "#fff" : "rgba(255,255,255,0.3)" }}
            disabled={!active || !canRedo}
          >
            <RedoIcon />
          </IconButton>
        </Tooltip>

        <Tooltip disableFocusListener disableTouchListener title="Master Reset (Clear All)">
          <IconButton
            onClick={(e) => {
              console.log("[TopBar] Reset icon clicked");
              setShowResetConfirm(true);
              e.currentTarget.blur();
            }}
            sx={{
              color: "#fff",
              bgcolor: "rgba(255,255,255,0.1)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.2)" }
            }}
          >
            <ClearIcon />
          </IconButton>
        </Tooltip>

        <Box sx={{ width: 1, height: 24, background: "rgba(255,255,255,.3)", mx: 1 }} />

        {/* 4. FREEHAND DRAWING TOOLS */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: freeHand.active ? "rgba(255,255,255,0.15)" : "transparent", px: 1, py: 0.5, borderRadius: 2 }}>
          <Tooltip title={freeHand.active ? "Stop Freehand Drawing" : "Freehand Drawing (Pen)"}>
            <IconButton
              onClick={(e) => { 
                freeHand.toggleFreeHand(); 
                if (!freeHand.active) freeHand.setFreeHandMode('pen');
                e.currentTarget.blur(); 
              }}
              sx={{ color: freeHand.active && freeHand.mode === 'pen' ? "#4ade80" : "#fff", bgcolor: freeHand.active && freeHand.mode === 'pen' ? "rgba(255,255,255,0.1)" : "transparent" }}
            >
              <BrushIcon />
            </IconButton>
          </Tooltip>

          {freeHand.active && (
            <>
              <Tooltip title="Eraser">
                <IconButton
                  onClick={(e) => { freeHand.setFreeHandMode(freeHand.mode === 'eraser' ? 'pen' : 'eraser'); e.currentTarget.blur(); }}
                  sx={{ color: freeHand.mode === 'eraser' ? "#fb7185" : "#fff", bgcolor: freeHand.mode === 'eraser' ? "rgba(255,255,255,0.1)" : "transparent" }}
                >
                  <AutoFixOffIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Add Text Annotation">
                <IconButton
                  onClick={(e) => { 
                      if (freeHand.mode === 'text' && freeHand.active) {
                          setShowTextDialog(true);
                      } else {
                          freeHand.toggleFreeHand(true);
                          freeHand.setFreeHandMode('text');
                      }
                      e.currentTarget.blur(); 
                  }}
                  sx={{ color: (freeHand.active && freeHand.mode === 'text') ? "#3b82f6" : "#fff", bgcolor: (freeHand.active && freeHand.mode === 'text') ? "rgba(255,255,255,0.1)" : "transparent" }}
                >
                  <TextFieldsIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Line Color">
                <IconButton
                  onClick={(e) => setColorAnchorEl(e.currentTarget)}
                  sx={{ color: freeHand.color }}
                >
                  <PaletteIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Line Size">
                <IconButton
                  onClick={(e) => setSizeAnchorEl(e.currentTarget)}
                  sx={{ color: "#fff" }}
                >
                  <HorizontalRuleIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Undo Drawing">
                <IconButton
                  onClick={(e) => { freeHand.undoFreeHand(); e.currentTarget.blur(); }}
                  sx={{ color: "#fff" }}
                >
                  <UndoIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Clear Drawing">
                <IconButton
                  onClick={(e) => { freeHand.clearFreeHand(); e.currentTarget.blur(); }}
                  sx={{ color: "#fff" }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>

        {/* Color Popover */}
        <Popover
          open={Boolean(colorAnchorEl)}
          anchorEl={colorAnchorEl}
          onClose={() => setColorAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
          PaperProps={{
            sx: {
              p: 2,
              borderRadius: 4,
              bgcolor: '#fff',
              boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
              border: '1px solid rgba(0,0,0,0.1)',
              zIndex: 99999,
              mt: 1
            }
          }}
          sx={{ zIndex: 99999 }}
          marginThreshold={10}
        >
          <Typography variant="caption" sx={{ fontWeight: 900, mb: 1.5, display: 'block', color: '#64748b', textAlign: 'center', letterSpacing: 1 }}>SELECT COLOR</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
            {['#ef4444', '#3b82f6', '#22c55e', '#000000', '#f59e0b', '#8b5cf6'].map(c => (
              <Box
                key={c}
                onClick={() => { freeHand.setFreeHandColor(c); setColorAnchorEl(null); }}
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: c,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  border: freeHand.color === c ? '3px solid #f97316' : '2px solid rgba(0,0,0,0.05)',
                  boxShadow: freeHand.color === c ? '0 4px 12px rgba(249, 115, 22, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
                  '&:hover': { transform: 'scale(1.15)', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' },
                  transition: '0.2s all cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
              />
            ))}
          </Box>
        </Popover>

        {/* Size Popover */}
        <Popover
          open={Boolean(sizeAnchorEl)}
          anchorEl={sizeAnchorEl}
          onClose={() => setSizeAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
          PaperProps={{
            sx: {
              p: 2.5,
              width: { xs: 240, sm: 280 },
              borderRadius: 4,
              bgcolor: '#fff',
              boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
              border: '1px solid rgba(0,0,0,0.1)',
              zIndex: 99999,
              mt: 1
            }
          }}
          sx={{ zIndex: 99999 }}
          marginThreshold={10}
        >
          <Typography variant="caption" sx={{ fontWeight: 900, mb: 2, display: 'block', color: '#64748b', letterSpacing: 1 }}>BRUSH THICKNESS: {freeHand.size}PX</Typography>
          <Slider
            value={freeHand.size}
            min={1}
            max={30}
            step={1}
            onChange={(e, val) => freeHand.setFreeHandSize(val)}
            sx={{ 
                color: '#f97316',
                '& .MuiSlider-thumb': {
                    width: 20,
                    height: 20,
                    '&:hover, &.Mui-focusVisible': {
                        boxShadow: '0 0 0 8px rgba(249, 115, 22, 0.16)',
                    },
                },
            }}
          />
        </Popover>

        <Box sx={{ width: 1, height: 24, background: "rgba(255,255,255,.3)", mx: 1 }} />

        {/* Scale & Measure */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip disableFocusListener disableTouchListener title={isPickingScale ? "Cancel Picking Scale" : "Pick Scale (2 points)"}>
            <Button
              size="small"
              variant={isPickingScale || pixelsPerFoot ? "contained" : "outlined"}
              startIcon={<StraightenIcon />}
              onClick={(e) => {
                togglePickingScale();
                tapeMeasure.toggleActive(false); // Disable tape measure if active
                e.currentTarget.blur();
              }}
              sx={{
                px: 2,
                py: 1,
                fontWeight: 800,
                borderRadius: '12px',
                borderColor: 'rgba(255,255,255,0.5)',
                bgcolor: isPickingScale ? '#fff' : (pixelsPerFoot ? 'rgba(255,255,255,0.2)' : 'transparent'),
                color: isPickingScale ? '#f97316' : '#fff',
                '&:hover': { 
                    bgcolor: isPickingScale ? '#fff' : 'rgba(255,255,255,0.3)',
                    borderColor: '#fff'
                },
                whiteSpace: 'nowrap',
                textTransform: 'none'
              }}
            >
              {isPickingScale ? "Picking Scale" : "Pick Scale"}
            </Button>
          </Tooltip>

          <Tooltip disableFocusListener disableTouchListener title="Measure Mode">
            <Button
              size="small"
              variant={tapeMeasure.isActive ? "contained" : "outlined"}
              startIcon={<RuleIcon />}
              onClick={(e) => {
                tapeMeasure.toggleActive();
                if (isPickingScale) {
                  togglePickingScale(); // Just disable picking mode, keep the set scale
                }
                e.currentTarget.blur();
              }}
              sx={{
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.5)',
                bgcolor: tapeMeasure.isActive ? '#22c55e' : 'transparent',
                '&:hover': { bgcolor: tapeMeasure.isActive ? '#16a34a' : 'rgba(255,255,255,0.1)' }
              }}
            >
              Measure
            </Button>
          </Tooltip>

          {/* CLEAR ALL MEASUREMENTS BUTTON */}
          {tapeMeasure.points && tapeMeasure.points.length > 0 && (
            <Tooltip disableFocusListener disableTouchListener title="Clear all measurement lines">
              <IconButton
                size="small"
                onClick={(e) => { tapeMeasure.clear(); e.currentTarget.blur(); }}
                sx={{
                  color: '#fff',
                  bgcolor: 'rgba(239, 68, 68, 0.8)',
                  ml: 0.5,
                  '&:hover': { bgcolor: '#b91c1c' }
                }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* SET button: appears ONLY when 2nd point is fixed and waiting to confirm */}
          {tapeMeasure.isActive && tapeCurrentEnd && (
            <Tooltip disableFocusListener disableTouchListener title="Set this measurement line">
              <Button
                size="small"
                variant="contained"
                startIcon={<CheckCircleIcon />}
                onClick={(e) => { confirmMeasurement(); e.currentTarget.blur(); }}
                sx={{
                  color: '#fff',
                  bgcolor: '#16a34a',
                  fontWeight: 800,
                  animation: 'pulse-green 1.5s infinite',
                  '@keyframes pulse-green': {
                    '0%': { boxShadow: '0 0 0 0 rgba(22,163,74,0.6)' },
                    '70%': { boxShadow: '0 0 0 8px rgba(22,163,74,0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(22,163,74,0)' },
                  },
                  '&:hover': { bgcolor: '#15803d' }
                }}
              >
                Set
              </Button>
            </Tooltip>
          )}

          {/* MEASUREMENT STATS */}
          {pixelsPerFoot && (
            <Box sx={{ 
              ml: 1, px: 1, py: 0.5, border: '1px solid rgba(255,255,255,0.3)', borderRadius: 1.5, 
              bgcolor: 'rgba(255,255,255,0.15)', minWidth: 80, textAlign: 'center', flexShrink: 0 
            }}>
              <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.1, fontSize: '0.65rem', fontWeight: 700 }}>
                1'={Math.round(pixelsPerFoot)}px
              </Typography>
            </Box>
          )}
        </Box>
        {/* 🔸 RESET CONFIRMATION DIALOG (Same as SidePanel for consistency) */}
        <Dialog
          open={showResetConfirm}
          onClose={() => setShowResetConfirm(false)}
          TransitionComponent={Zoom}
          sx={{ zIndex: 4000 }}
          PaperProps={{
            sx: {
              borderRadius: 5,
              overflow: "hidden",
              maxWidth: 400,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
            }
          }}
        >
          <Box sx={{
            background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
            p: 3,
            textAlign: "center",
            borderBottom: "1px solid #fecaca"
          }}>
            <Box sx={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              bgcolor: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)"
            }}>
              <WarningAmberRoundedIcon sx={{ color: '#ef4444', fontSize: 32 }} />
            </Box>
            <Typography variant="h6" fontWeight={900} color="#991b1b">
              Reset Everything?
            </Typography>
          </Box>

          <DialogContent sx={{ textAlign: 'center', pt: 3, pb: 2 }}>
            <Typography variant="body1" color="#451a03" fontWeight={600} gutterBottom>
              This will permanently delete your markings.
            </Typography>
            <Typography variant="body2" color="#dc2626" fontWeight={700}>
              All your current progress will be lost.
            </Typography>
          </DialogContent>

          <DialogActions sx={{ justifyContent: 'center', gap: 2, px: 3, pb: 4 }}>
            <Button
              onClick={() => setShowResetConfirm(false)}
              sx={{
                color: '#475569',
                fontWeight: 800,
                textTransform: 'none',
                px: 3,
                py: 1,
                borderRadius: 3,
                "&:hover": { bgcolor: "#f1f5f9" }
              }}
            >
              No, Cancel
            </Button>
            <Button
              onClick={handleConfirmReset}
              variant="contained"
              sx={{
                bgcolor: '#ef4444',
                color: 'white',
                fontWeight: 800,
                textTransform: 'none',
                px: 4,
                py: 1,
                borderRadius: 3,
                boxShadow: '0 8px 16px rgba(239, 68, 68, 0.25)',
                '&:hover': { bgcolor: '#dc2626', boxShadow: '0 8px 20px rgba(239, 68, 68, 0.4)' }
              }}
            >
              Yes, Reset Everything
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

      {/* 🔸 LOADING BACKDROP FOR AUTO-SCAN */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 4000, flexDirection: 'column', gap: 2 }}
        open={isScanning}
      >
        <CircularProgress color="inherit" />
        <Typography variant="h6" fontWeight={700}>Scanning Layout Boundary...</Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>Identifying outermost walls automatically</Typography>
      </Backdrop>

      {/* 🔸 PREMIUM TEXT ENTRY DIALOG */}
      <Dialog 
        open={showTextDialog} 
        onClose={() => setShowTextDialog(false)}
        sx={{ zIndex: 999999 }}
        PaperProps={{ sx: { borderRadius: 4, p: 1, minWidth: 320 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextFieldsIcon sx={{ color: '#f97316' }} /> Add Label
        </DialogTitle>
        <DialogContent>
            <Typography variant="caption" sx={{ color: '#64748b', mb: 2, display: 'block' }}>
                Enter the text you want to place on your map. You can move it after adding.
            </Typography>
            <TextField
                autoFocus
                fullWidth
                placeholder="e.g. Living Room, Entrance..."
                variant="outlined"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTextToCenter()}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setShowTextDialog(false)} sx={{ color: '#64748b', fontWeight: 700 }}>Cancel</Button>
            <Button 
                onClick={handleAddTextToCenter} 
                variant="contained" 
                sx={{ bgcolor: '#f97316', fontWeight: 700, px: 3, borderRadius: 2, '&:hover': { bgcolor: '#ea580c' } }}
            >
                Add to Center
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}