import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Zoom,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Chip,
  Checkbox,
  Grid,
  Snackbar,
  Alert,
  Backdrop,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment
} from "@mui/material";
import Divider from '@mui/material/Divider';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BedIcon from '@mui/icons-material/Bed';
import KitchenIcon from '@mui/icons-material/Kitchen';
import WcIcon from '@mui/icons-material/Wc';
import LockIcon from "@mui/icons-material/Lock";
import UpgradeIcon from "@mui/icons-material/Upgrade";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import MedicationIcon from '@mui/icons-material/Medication';
import TempleHinduIcon from '@mui/icons-material/TempleHindu';
import LocalLaundryServiceIcon from '@mui/icons-material/LocalLaundryService';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import WorkIcon from '@mui/icons-material/Work';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import DeleteIcon from '@mui/icons-material/Delete';
import StairsIcon from '@mui/icons-material/Stairs';
import WashIcon from '@mui/icons-material/Wash';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import AdjustIcon from '@mui/icons-material/Adjust';
import GridViewIcon from '@mui/icons-material/GridView';
import LabelIcon from '@mui/icons-material/Label';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import SearchIcon from '@mui/icons-material/Search';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import html2canvas from "html2canvas";

import { useNavigate } from "react-router-dom";

// Services Imports
import { useMeasure, resetMeasure, undoPoint, redoPoint, setBoundaryThickness } from "../services/tool/boundaryService";
import { calculateCenter, resetCenter } from "../services/tool/centerService";
import { useShaktiChakra, getZoneLabel, calculateObjectZones } from "../services/tool/shaktiChakraService";
import ShaktiChakraButton from "./sidebarButtons/ShaktiChakraButton";
import { useCenterPoint } from "../services/tool/centerService";
import { useDevta } from "../services/tool/devtaService";
import { useMarma } from "../services/tool/marmaService";
import { useGrid } from "../services/tool/gridService";
import { useScale } from "../services/tool/scaleService";
import { useEntrance } from "../services/tool/entranceService";
import { useTapeMeasure } from "../services/tool/measureService";
import { useRotation } from "../services/tool/rotateService";
import { drawingService } from "../services/tool/drawingService";
import { useCanvasView } from "../services/tool/canvasViewService";
import { usePlanPermissions } from "../hooks/usePlanPermissions";
import { calculateZoneAreas, calculateDevtaAreas } from "../services/tool/areaService";
import { exportAsImage } from "../services/tool/ExportService";
import { saveProjectProgress } from "../services/tool/persistentStateService";
import TutorialPlayerModal from "./TutorialPlayerModal";
import ReportOptions from "./ReportOptions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Label,
  LabelList,
  ReferenceLine
} from "recharts";
import FolderIcon from "@mui/icons-material/Folder";
import MapIcon from "@mui/icons-material/Map";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';

// Helper to calculate zone dynamically
const getEntranceZone = (entrance, center, rotation, zones) => {
  if (!entrance || !center) return null;

  let midX, midY;

  if (entrance.points && entrance.points.length > 0) {
    const sum = entrance.points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    midX = sum.x / entrance.points.length;
    midY = sum.y / entrance.points.length;
  } else if (entrance.start && entrance.end) {
    midX = (entrance.start.x + entrance.end.x) / 2;
    midY = (entrance.start.y + entrance.end.y) / 2;
  } else {
    return null;
  }

  // 1. Math Angle (CCW from East)
  // dy is inverted (center.y - midY) because screen Y is Down
  const dx = midX - center.x;
  const dy = center.y - midY;
  let mathDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (mathDeg < 0) mathDeg += 360;

  // 2. Vastu Angle (CW from North)
  // 0(E) -> 90, 90(N) -> 0, 180(W) -> 270, 270(S) -> 180
  const vastuDeg = (450 - mathDeg) % 360;

  // 3. Apply Rotation (CW)
  // If map rotates +10 (CW), North line moves +10. A point at old North(0) is now at -10 relative to North.
  // So we subtract rotation.
  const correctedAngle = (vastuDeg - (rotation || 0) + 360) % 360;

  // 4. Get Index with Half-step shift
  // Zone N is centered at 0. So it spans [-step/2, +step/2].
  // 4. Get Index
  // For 16 zones: Center aligned (Index 0 is -11.25 to +11.25). Offset = step/2.
  // For 32 zones: Edge aligned (Index 0 is 0 to 11.25 - N5). Offset = 0.
  const safeZones = zones || 16;
  const step = 360 / safeZones;
  const offset = safeZones === 32 ? 0 : step / 2;

  const index = Math.floor(((correctedAngle + offset) % 360) / step);

  return getZoneLabel(index, safeZones);
};




// --- Styles ---
const accordionStyle = {
  mb: 1.5,
  width: "100% !important",
  boxSizing: "border-box",
  borderRadius: "16px !important",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
  border: "1px solid rgba(0,0,0,0.03)",
  overflow: "hidden", // Ensure children don't bleed out
  "&:before": { display: "none" },
  "& .MuiAccordionSummary-root": {
    px: { xs: 1.5, sm: 2 }, 
  },
  "& .MuiAccordionDetails-root": {
    px: { xs: 1.5, sm: 2 },
  },
  "&.Mui-expanded": {
    margin: { xs: "0 0 16px 0 !important", md: "0 0 24px 0 !important" },
  }
};

const summaryHeaderStyle = { 
  display: "flex", 
  alignItems: "center", 
  gap: 1.5,
  minWidth: 0,
  flexGrow: 1,
  overflow: "hidden"
};

const stepCircleStyle = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  bgcolor: "#f97316",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  fontSize: 13,
};

const primaryButtonStyle = {
  bgcolor: "#f97316",
  color: "#fff",
  fontWeight: 700,
  py: 1.2,
  borderRadius: 2,
  "&:hover": { bgcolor: "#ea580c" },
  textTransform: "none",
};

const noteBoxStyle = {
  bgcolor: "rgba(249, 115, 22, 0.05)",
  p: 1.5,
  borderRadius: 2,
  border: "1px dashed #f97316",
  display: "flex",
  alignItems: "center",
  color: "#ea580c",
  mb: 2,
};

const dialogButtonStyle = {
  bgcolor: "#1e293b",
  color: "#fff",
  px: 4,
  borderRadius: 2,
  fontWeight: 700,
  "&:hover": { bgcolor: "#0f172a" },
  textTransform: "none",
};

const backButtonStyle = {
  display: "inline-block",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 13,
  color: "#ffffff",
  bgcolor: "#f97316",
  px: 2,
  py: 1,
  borderRadius: 2,
  "&:hover": { bgcolor: "#ea580c" },
};

/**
 * TOOL MODULES COMPONENT - FULL VERSION
 * Multiple Entrances Enabled with Zone Badges & Elements
 */
export default function ToolModules({ 
  onBack, 
  isDetailsFilled, 
  onShowDetails,
  activeProjectName,
  activeProjectId: propActiveProjectId,
  onSwitchProject,
  onBulkExport
}) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Project Context
  const activeProjectId = propActiveProjectId || localStorage.getItem("active_project_id");
  const userEmail = localStorage.getItem("email");
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingFull, setIsExportingFull] = useState(false);

  // --- PROJECT NAVIGATOR STATE ---
  const [navFolders, setNavFolders] = useState([]);
  const [navProjects, setNavProjects] = useState([]);
  const [loadingNav, setLoadingNav] = useState(false);
  const [navExpanded, setNavExpanded] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState(null);

  const fetchNavData = async () => {
    if (!userEmail) return;
    setLoadingNav(true);
    try {
      const fRes = await fetch(`/api/folders.php?email=${userEmail}`);
      const fData = await fRes.json();
      if (fData.status === "success") setNavFolders(fData.data);

      const pRes = await fetch(`/api/projects.php?email=${userEmail}&limit=1000`);
      const pData = await pRes.json();
      if (pData.status === "success") setNavProjects(pData.data);
    } catch (error) {
      console.error("Navigator fetch error:", error);
    } finally {
      setLoadingNav(false);
    }
  };

  useEffect(() => {
    if (navExpanded && navFolders.length === 0) {
      fetchNavData();
    }
  }, [navExpanded]);

  // --- TUTORIAL SYSTEM STATE ---
  const [tutorials, setTutorials] = useState([]);
  const [playerModal, setPlayerModal] = useState({ open: false, videoUrl: "", videoFilename: "", title: "" });

  useEffect(() => {
    fetch("/api/tutorials.php")
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") setTutorials(data.data);
      })
      .catch(err => console.error("Error fetching tutorials:", err));
  }, []);

  const playTutorialForTool = (toolName) => {
    const tut = tutorials.find(t => t.tool_name === toolName);
    if (tut) {
      setPlayerModal({
        open: true,
        videoUrl: tut.video_url,
        videoFilename: tut.video_filename,
        title: tut.title
      });
    } else {
      showAlert(`No tutorial found for ${toolName}`, "info");
    }
  };

  // Auto-Save Effect — using ref to track status to avoid re-renders
  const saveStatusRef = useRef("idle");
  const [saveStatus, setSaveStatus] = useState("idle");
  
  const updateSaveStatus = (status) => {
    // Only trigger a React state update if the value actually changed
    if (saveStatusRef.current !== status) {
      saveStatusRef.current = status;
      setSaveStatus(status);
    }
  };


  const handleManualSave = async () => {
    setSaveStatus("saving");
    const res = await saveProjectProgress(activeProjectId, userEmail);
    if (res.status === "success") {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } else {
      setSaveStatus("error");
    }
  };
  const {
    points,
    active: isPlotActive,
    toggleMeasure,
    resetMeasure: hookResetMeasure,
    undoPoint: hookUndoPoint,
    redoPoint: hookRedoPoint,
    canUndo,
    canRedo,
    boundaryThickness
  } = useMeasure();

  // 🔥 Canvas View Service for resetting zoom/pan during export
  const { resetView } = useCanvasView();

  const {
    isActive, rotation, zoneCount,
    lineThickness, labelSize, labelDistance,
    setActive, setRotation, setZoneCount,
    setLineThickness, setLabelSize, setLabelDistance,
    reset: resetChakra
  } = useShaktiChakra();
  const devta = useDevta();
  const centerPoint = useCenterPoint();
  const { isActive: isMarmaActive, toggleMarma } = useMarma();
  const { isActive: isGridActive, toggleGrid } = useGrid();
  const { clearScale } = useScale();
  const {
    entrances,
    removeEntrance,
    showSpecDialog,
    setShowSpecDialog,
    setActiveCategory,
    // New states from store
    specInput, setSpecInput,
    componentDetails, setComponentDetails,
    remedies, setRemedies,
    selectedRemedy, setSelectedRemedy,
    selectedEntranceIndex, setSelectedEntranceIndex,
    remedyDialogOpen, setRemedyDialogOpen,
    showGraphDialog, setShowGraphDialog,
    openAlert, setOpenAlert,
    upgradeDialogOpen, setUpgradeDialogOpen,
    customRemedyInput, setCustomRemedyInput,
    useCustomRemedyToggle, setUseCustomRemedyToggle,
    tooltipScale, setTooltipScale,
    currentEntrance, isEditing, updateEntrance, saveEntranceDetails,
    setEditState, editIndex,
    graphData, setGraphData,
    handleShowRemedy, handleEditItem,
    activeCategory, isEntranceMode, setIsEntranceMode, resetEntrance,
    // Multi-zone remedy states
    customZoneRemedies, addCustomZoneRemedy, updateCustomZoneRemedy, removeCustomZoneRemedy,
    zoneRemedyDialogOpen, setZoneRemedyDialogOpen,
    editingZoneRemedy, setEditingZoneRemedy
  } = useEntrance();

  useEffect(() => {
    if (!activeProjectId || !userEmail) return;

    // 🛑 REAL-TIME DEBOUNCED SAVE
    // This effect triggers whenever any core Vastu state changes.
    // We wait for 2.5 seconds of "silence" (no edits) before committing to DB.
    
    const debounceTimer = setTimeout(async () => {
      // Don't auto-save if we are currently exporting (to avoid UI flicker/state locks)
      if (isExporting || isExportingFull) return;

      updateSaveStatus("saving");
      const res = await saveProjectProgress(activeProjectId, userEmail);
      if (res.status === "success") {
        updateSaveStatus("saved");
        setTimeout(() => updateSaveStatus("idle"), 2000);
      } else {
        updateSaveStatus("error");
      }
    }, 2500); // 2.5s debounce

    return () => clearTimeout(debounceTimer);
  }, [
    activeProjectId, 
    userEmail,
    // --- Dependencies that trigger a save ---
    points,
    isActive, 
    rotation, 
    zoneCount,
    lineThickness, 
    labelSize, 
    labelDistance,
    devta.isActive,
    devta.mandalaSize,
    isMarmaActive,
    isGridActive,
    entrances,
    boundaryThickness
  ]);
  const vastuTapeMeasure = useTapeMeasure();
  const { angle } = useRotation();
  const { allowedTools, loading: loadingPermissions } = usePlanPermissions();

  // --- Snackbar Alert State ---
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  const showAlert = (message, severity = "warning") => {
    setSnackbar({ open: true, message, severity });
  };
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // --- Workflow Validation ---
  const validateStep = (type) => {
    if (points.length < 3) {
      showAlert("Please draw Plot Boundary and set Center first.", "error");
      return false;
    }
    if (!centerPoint) {
      showAlert("Please calculate Center Point first.", "error");
      return false;
    }
    
    // 🔥 DOWNLOAD VALIDATION
    if (type === 'export' && !isDetailsFilled) {
      showAlert("Please fill in Property & Personal Details first to download reports.", "error");
      if (onShowDetails) {
        setTimeout(() => onShowDetails(), 1500); // Small delay so they can read the toast
      }
      return false;
    }

    return true;
  };

  // Remedies state is now in useEntrance store

  const [includeRemedies, setIncludeRemedies] = useState(true); // New: Include remedies in export
  const [shaktiWarningOpen, setShaktiWarningOpen] = useState(false);


  const handleMarmaToggle = (checked) => {
    if (checked) {
      if (!validateStep('marma')) return;
    }
    toggleMarma(checked);
  };




  // Permissions


  // Helper to check permission
  const hasAccess = (toolId) => {
    if (loadingPermissions) return true;
    if (!allowedTools || allowedTools.length === 0) return false;
    return allowedTools.includes(toolId);
  };

  const handleLockedClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setUpgradeDialogOpen(true);
  };


  // --- AREA CALCULATION MEMO ---
  const areaData8 = React.useMemo(() => {
    if (!centerPoint || points.length < 3) return [];
    return calculateZoneAreas(centerPoint, points, rotation, 8);
  }, [centerPoint, points, rotation]);

  const areaData16 = React.useMemo(() => {
    if (!centerPoint || points.length < 3) return [];
    return calculateZoneAreas(centerPoint, points, rotation, 16);
  }, [centerPoint, points, rotation]);

  const areaData32 = React.useMemo(() => {
    if (!centerPoint || points.length < 3) return [];
    return calculateZoneAreas(centerPoint, points, rotation, 32);
  }, [centerPoint, points, rotation]);

  // For backward compatibility and specialized logic
  const areaData = React.useMemo(() => {
    if (zoneCount === 8) return areaData8;
    if (zoneCount === 32) return areaData32;
    return areaData16;
  }, [zoneCount, areaData8, areaData16, areaData32]);

  const totalArea = React.useMemo(() => {
    return areaData.reduce((acc, curr) => acc + parseFloat(curr.area), 0);
  }, [areaData]);

  const [devtaSearch, setDevtaSearch] = useState("");
  const devtaAreaData = React.useMemo(() => {
    if (!centerPoint || points.length < 3 || !devta.isActive) return [];
    const fullData = calculateDevtaAreas(centerPoint, points, rotation, devta.mandalaSize);
    
    if (!devtaSearch) return fullData;
    return fullData.filter(d => d.devta.toLowerCase().includes(devtaSearch.toLowerCase()));
  }, [centerPoint, points, rotation, devta.isActive, devta.mandalaSize, devtaSearch]);


  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Local state for inputs to avoid re-render issues
  const [degreeInput, setDegreeInput] = useState(rotation);
  const [zoneInput, setZoneInput] = useState(zoneCount);

  // Future Elements List
  const extraElements = [
    { name: "Entrance", icon: <MeetingRoomIcon sx={{ fontSize: 16 }} />, pointsNeeded: 2 },
    { name: "Kitchen", icon: <KitchenIcon sx={{ fontSize: 16 }} />, pointsNeeded: 4 },
    { name: "Toilet", icon: <WcIcon sx={{ fontSize: 16 }} />, pointsNeeded: 4 },
    { name: "Mandir", icon: <TempleHinduIcon sx={{ fontSize: 16 }} />, pointsNeeded: 4 },
    { name: "Master Bed", icon: <BedIcon sx={{ fontSize: 16 }} />, pointsNeeded: 4 },
    { name: "Kids Bed", icon: <BedIcon sx={{ fontSize: 16 }} />, pointsNeeded: 4 },
    { name: "W. Machine", icon: <LocalLaundryServiceIcon sx={{ fontSize: 16 }} />, pointsNeeded: 4 },
    { name: "Locker", icon: <LockIcon sx={{ fontSize: 16 }} />, pointsNeeded: 4 },
    { name: "Study Table", icon: <AutoStoriesIcon sx={{ fontSize: 16 }} />, pointsNeeded: 4 },
    { name: "Dining", icon: <RestaurantIcon sx={{ fontSize: 16 }} />, pointsNeeded: 4 },
    { name: "Office Desk", icon: <WorkIcon sx={{ fontSize: 16 }} />, pointsNeeded: 4 },
    { name: "Fam. Photo", icon: <InsertPhotoIcon sx={{ fontSize: 16 }} />, pointsNeeded: 4 },
    { name: "Trophies", icon: <EmojiEventsIcon sx={{ fontSize: 16 }} />, pointsNeeded: 4 },
    { name: "O.H. Tank", icon: <WaterDropIcon sx={{ fontSize: 16 }} />, pointsNeeded: 4 },
    { name: "U.G. Tank", icon: <WaterDropIcon sx={{ fontSize: 16 }} />, pointsNeeded: 4 },
    { name: "Septic Tank", icon: <WashIcon sx={{ fontSize: 16 }} />, pointsNeeded: 4 },
    { name: "Dustbin", icon: <DeleteIcon sx={{ fontSize: 16 }} />, pointsNeeded: 4 },
    { name: "Staircase Area", icon: <StairsIcon sx={{ fontSize: 16 }} />, pointsNeeded: 4 },
    { name: "Staircase Landing", icon: <StairsIcon sx={{ fontSize: 16 }} />, pointsNeeded: 4 },
  ];


  // Sync local state when service state changes
  React.useEffect(() => {
    setDegreeInput(rotation);
  }, [rotation]);

  React.useEffect(() => {
    setZoneInput(zoneCount);
  }, [zoneCount]);

  // --- Handlers ---

  const handleResetAll = (e) => {
    if (e) e.stopPropagation();
    console.log("[ToolModules] Reset button clicked, opening confirm...");
    setShowResetConfirm(true);
  };

  const handleConfirmReset = () => {
    try {
      // 1. Plot Boundary & Center
      if (typeof hookResetMeasure === 'function') hookResetMeasure();
      else resetMeasure();
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
      if (vastuTapeMeasure && typeof vastuTapeMeasure.clear === 'function') vastuTapeMeasure.clear();
      if (typeof clearScale === 'function') clearScale();

      // 6. Explicitly ensure everything is off
      if (typeof setIsEntranceMode === 'function') setIsEntranceMode(false);
      if (typeof setActive === 'function') setActive(false);

      showAlert("Master Reset: All data and markings cleared.", "success");
    } catch (err) {
      console.error("[Reset Error]:", err);
      showAlert("Reset partial failure: " + err.message, "error");
    }
    setShowResetConfirm(false);
  };

  const handleUndo = (e) => {
    if (e) e.stopPropagation();
    if (typeof hookUndoPoint === 'function') {
      hookUndoPoint();
    }
  };

  const handleRedo = (e) => {
    if (e) e.stopPropagation();
    if (typeof hookRedoPoint === 'function') {
      hookRedoPoint();
    }
  };

  const handleDegreeChange = (event, newValue) => {
    setRotation(newValue);
  };

  const handleDegreeInputChange = (e) => {
    const val = e.target.value;
    setDegreeInput(val);
    const numVal = parseFloat(val);
    if (!isNaN(numVal)) {
      setRotation(numVal);
    }
  };

  const handleZoneChange = (e) => {
    const val = e.target.value;
    setZoneInput(val);
    setZoneCount(val);
  };


  // const shaktiChakra = useShaktiChakra(); // Removed redundant call by directly using the values from the first call
  const shaktiChakra = {
    isActive, rotation, zoneCount,
    lineThickness, labelSize, labelDistance,
    setActive, setRotation, setZoneCount,
    setLineThickness, setLabelSize, setLabelDistance,
    reset: resetChakra
  };

  return (
    <Box sx={{
      background: "transparent",
      borderRadius: 3,
      p: { xs: 0.5, sm: 1.5 }, 
      width: "100%",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden" 
    }}>

      {/* ðŸ”¹ HEADER SECTION */}
      <Box sx={{
        mb: 2,
        p: 2,
        borderRadius: 3,
        background: "linear-gradient(135deg,#f97316 0%,#fb923c 100%)",
        color: "#fff",
        boxShadow: "0 4px 15px rgba(249, 115, 22, 0.3)",
        position: "relative"
      }}>
        <Box sx={{ pr: 12 }}>
          <Typography 
            variant="overline" 
            sx={{ 
                lineHeight: 1, 
                display: 'block', 
                mb: 0.5, 
                opacity: 0.9, 
                fontWeight: 700,
                letterSpacing: 1.5,
                color: 'rgba(255,255,255,0.95)',
                fontSize: '0.65rem'
            }}
          >
            {localStorage.getItem("active_project_folder_name") || "Home"}
          </Typography>
          <Typography fontWeight={900} fontSize={20} letterSpacing={-0.2} sx={{ lineHeight: 1.1, mb: 0.5 }}>
            {activeProjectName || "Vastu Module"}
          </Typography>

          <Typography fontSize={10} sx={{ opacity: 0.8, fontWeight: 500 }}>
            Advanced Plot Intelligence System v2.5
          </Typography>
        </Box>
        <Box sx={{
          position: "absolute",
          top: 10,
          right: 10,
          display: "flex",
          gap: 0.5,
          zIndex: 9999, // Ensure it's above everything in the header
          pointerEvents: "auto",
        }}>
          <Tooltip title="Undo last point">
            <IconButton
              onClick={handleUndo}
              disabled={!canUndo}
              size="medium"
              sx={{
                color: (canUndo) ? "white" : "rgba(255,255,255,0.3)",
                bgcolor: "rgba(255,255,255,0.1)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
              }}
            >
              <UndoIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Redo point">
            <IconButton
              onClick={handleRedo}
              disabled={!canRedo}
              size="medium"
              sx={{
                color: (canRedo) ? "white" : "rgba(255,255,255,0.3)",
                bgcolor: "rgba(255,255,255,0.1)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
              }}
            >
              <RedoIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Reset Layout & Clear All">
            <IconButton
              onClick={handleResetAll}
              size="medium"
              sx={{
                color: "white",
                bgcolor: "rgba(255,255,255,0.2)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.4)" },
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
              }}
            >
              <RestartAltIcon fontSize="medium" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Dialog
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        TransitionComponent={Zoom}
        sx={{ zIndex: 4000 }} // Ensure it's above sidebars and headers
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
            This will permanently delete:
          </Typography>
          <Box sx={{
            display: "inline-block",
            textAlign: "left",
            bgcolor: "#fff7ed",
            p: 2,
            borderRadius: 2,
            border: "1px solid #ffedd5",
            mb: 2,
            width: "100%"
          }}>
            <Typography variant="body2" color="#7c2d12" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              â€¢ All Plot Boundary Points
            </Typography>
            <Typography variant="body2" color="#7c2d12" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              â€¢ Calculated Center Point
            </Typography>
            <Typography variant="body2" color="#7c2d12" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              â€¢ Shakti Chakra & Devta Settings
            </Typography>
          </Box>
          <Typography variant="body2" color="#dc2626" fontWeight={700}>
            All your current progress will be lost.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', gap: 2, px: 3, pb: 4 }}>
          <Tooltip title="Cancel master reset">
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
          </Tooltip>
          <Tooltip title="Confirm and reset everything (cannot be undone)">
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
          </Tooltip>
        </DialogActions>
      </Dialog>

      {/* ðŸ”¹ MODULES ACCORDIONS */}
      {/* 🚀 PROJECT NAVIGATOR SECTION */}
      <Accordion 
        expanded={navExpanded} 
        onChange={() => setNavExpanded(!navExpanded)}
        sx={{
          ...accordionStyle,
          bgcolor: "#fff7ed",
          border: "1px solid #fed7aa",
          mb: 3
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={summaryHeaderStyle}>
            <GridViewIcon sx={{ color: "#f97316" }} />
            <Typography sx={{ fontWeight: 800, color: "#9a3412" }}>Project Navigator</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 1 }}>
          {loadingNav ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} sx={{ color: '#f97316' }} />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* --- Home / Root Folder Group --- */}
              <Box sx={{ mb: 1 }}>
                <Box 
                    onClick={() => setActiveFolderId(activeFolderId === 'root' ? null : 'root')}
                    sx={{ 
                        p: 1.2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5, 
                        cursor: 'pointer',
                        borderRadius: '12px',
                        bgcolor: activeFolderId === 'root' ? '#ffedd5' : 'transparent',
                        '&:hover': { bgcolor: '#ffedd5' }
                    }}
                >
                    <FolderIcon sx={{ color: '#f97316', fontSize: '1.2rem' }} />
                    <Typography fontSize={13} fontWeight={700} color="#431407">Home / Root</Typography>
                    <ExpandMoreIcon sx={{ ml: 'auto', fontSize: '1rem', transform: activeFolderId === 'root' ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                </Box>
                {activeFolderId === 'root' && (
                    <List dense sx={{ ml: 2, mt: 0.5, borderLeft: '2px solid #fed7aa', pl: 1 }}>
                        {navProjects.filter(p => !p.folder_id).map(project => (
                            <ListItem 
                                key={project.id}
                                disablePadding
                                sx={{ mb: 0.5 }}
                            >
                                <Button
                                    fullWidth
                                    size="small"
                                    onClick={() => onSwitchProject(project.id, project.project_name, project.construction_type, project.project_issue, project.folder_name)}
                                    startIcon={<MapIcon sx={{ fontSize: '1rem !important' }} />}
                                    endIcon={project.id === activeProjectId && <OpenInNewIcon sx={{ fontSize: '0.8rem' }} />}
                                    sx={{ 
                                        justifyContent: 'flex-start',
                                        textTransform: 'none',
                                        color: project.id === activeProjectId ? '#f97316' : '#431407',
                                        fontWeight: project.id === activeProjectId ? 800 : 500,
                                        fontSize: '0.8rem',
                                        borderRadius: '8px',
                                        '&:hover': { bgcolor: '#fff7ed' }
                                    }}
                                >
                                    {project.project_name}
                                </Button>
                            </ListItem>
                        ))}
                    </List>
                )}
              </Box>

              {/* --- User Folders --- */}
              {navFolders.map(folder => (
                <Box key={folder.id} sx={{ mb: 1 }}>
                    <Box 
                        onClick={() => setActiveFolderId(activeFolderId === folder.id ? null : folder.id)}
                        sx={{ 
                            p: 1.2, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1.5, 
                            cursor: 'pointer',
                            borderRadius: '12px',
                            bgcolor: activeFolderId === folder.id ? '#ffedd5' : 'transparent',
                            '&:hover': { bgcolor: '#ffedd5' }
                        }}
                    >
                        <FolderIcon sx={{ color: '#f97316', fontSize: '1.2rem' }} />
                        <Typography fontSize={13} fontWeight={700} color="#431407">{folder.folder_name}</Typography>
                        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Tooltip title="Bulk Export All Project Reports (PDF)">
                                <IconButton 
                                    size="small" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const projectsInFolder = navProjects.filter(p => String(p.folder_id) === String(folder.id));
                                        if (onBulkExport) onBulkExport(folder.folder_name, projectsInFolder);
                                    }}
                                    sx={{ color: '#f97316', '&:hover': { bgcolor: 'rgba(249, 115, 22, 0.1)' } }}
                                >
                                    <CloudDownloadIcon sx={{ fontSize: '1.1rem' }} />
                                </IconButton>
                            </Tooltip>
                            <ExpandMoreIcon sx={{ fontSize: '1rem', transform: activeFolderId === folder.id ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                        </Box>
                    </Box>
                    {activeFolderId === folder.id && (
                        <List dense sx={{ ml: 2, mt: 0.5, borderLeft: '2px solid #fed7aa', pl: 1 }}>
                            {navProjects.filter(p => String(p.folder_id) === String(folder.id)).map(project => (
                                <ListItem 
                                    key={project.id}
                                    disablePadding
                                    sx={{ mb: 0.5 }}
                                >
                                    <Button
                                        fullWidth
                                        size="small"
                                        onClick={() => onSwitchProject(project.id, project.project_name, project.construction_type, project.project_issue, project.folder_name)}
                                        startIcon={<MapIcon sx={{ fontSize: '1rem !important' }} />}
                                        endIcon={project.id === activeProjectId && <OpenInNewIcon sx={{ fontSize: '0.8rem' }} />}
                                        sx={{ 
                                            justifyContent: 'flex-start',
                                            textTransform: 'none',
                                            color: project.id === activeProjectId ? '#f97316' : '#431407',
                                            fontWeight: project.id === activeProjectId ? 800 : 500,
                                            fontSize: '0.8rem',
                                            borderRadius: '8px',
                                            '&:hover': { bgcolor: '#fff7ed' }
                                        }}
                                    >
                                        {project.project_name}
                                    </Button>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>
              ))}
              
              <Button 
                onClick={fetchNavData}
                size="small"
                sx={{ mt: 1, color: '#f97316', fontSize: '0.7rem', fontWeight: 700 }}
              >
                Refresh List
              </Button>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      <Box sx={{ 
        flexGrow: 1, 
        overflowY: "auto", 
        maxHeight: "calc(100vh - 160px)",
        pr: 0.5, // Small padding to avoid scrollbar overlapping content
        '&::-webkit-scrollbar': { width: '6px' },
        '&::-webkit-scrollbar-thumb': { bgcolor: '#f1f5f9', borderRadius: '10px' },
        '&::-webkit-scrollbar-track': { bgcolor: 'transparent' }
      }}>
        <Box sx={{ px: 2, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ef4444' }} />
          <Typography fontSize={11} color="#ef4444" fontWeight={900}>
            FOR PLOT BOUNDARY (RED LINES): USE TOP BAR TOOLS
          </Typography>
        </Box>

        {/* --- 1. CENTER OF GRAVITY MODULE --- */}

        <Box onClickCapture={!hasAccess(1) ? handleLockedClick : undefined} sx={{ cursor: !hasAccess(1) ? 'pointer' : 'default', display: 'none' }}>
                    <Accordion sx={accordionStyle} disabled={!hasAccess(1)}
            onChange={(e, expanded) => {
              if (expanded) {
                if (!isPlotActive) toggleMeasure();
                setIsEntranceMode(false);
              } else {
                if (isPlotActive) toggleMeasure();
              }
            }}
          >
            <AccordionSummary expandIcon={hasAccess(1) ? <ExpandMoreIcon sx={{ color: "#f97316" }} /> : <LockIcon sx={{ color: "#94a3b8", fontSize: 20 }} />}>
              <Box sx={summaryHeaderStyle}>
                <Box sx={{ ...stepCircleStyle, bgcolor: hasAccess(1) ? "#f97316" : "#cbd5e1" }}>1</Box>
                                <Typography fontWeight={700} color={hasAccess(1) ? "#334155" : "#94a3b8"} sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Center</Typography>
              </Box>
              <TutorialButton toolName="Center" tutorials={tutorials} onClick={playTutorialForTool} />
            </AccordionSummary>
            <AccordionDetails>
              <Typography fontSize={12} color="text.secondary" sx={{ mb: 2 }}>
                Define the plot boundary by clicking at least 3 points on the layout. The geometric center will be calculated automatically.
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteOutlineIcon />}
                  onClick={() => {
                    if (window.confirm("Delete entire plot boundary?")) hookResetMeasure();
                  }}
                  sx={{ fontSize: 11, fontWeight: 700, textTransform: 'none' }}
                >
                  Delete Plot
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  startIcon={<UndoIcon />}
                  disabled={!canUndo}
                  onClick={hookUndoPoint}
                  sx={{ fontSize: 11, fontWeight: 700, textTransform: 'none' }}
                >
                  Undo
                </Button>
              </Box>


              <Box sx={{ mt: 2, p: 1, border: "1px solid #f1f5f9", borderRadius: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isGridActive}
                      onChange={(e) => {
                        if (e.target.checked && !validateStep('grid')) return;
                        toggleGrid(e.target.checked);
                      }}
                      size="small"
                      color="primary"
                    />
                  }
                  label={<Typography fontSize={12} fontWeight={700}>Show Vastu Grid (Net View)</Typography>}
                />
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>

        {/* --- 2. SHAKTI CHAKRA MODULE --- */}

        <Box onClickCapture={!hasAccess(2) ? handleLockedClick : undefined} sx={{ cursor: !hasAccess(2) ? 'pointer' : 'default' }}>
          <Accordion sx={accordionStyle} disabled={!hasAccess(2)}>
            <AccordionSummary expandIcon={hasAccess(2) ? <ExpandMoreIcon sx={{ color: "#f97316" }} /> : <LockIcon sx={{ color: "#94a3b8", fontSize: 20 }} />}>
              <Box sx={summaryHeaderStyle}>
                <Box sx={stepCircleStyle}>1</Box>
                                <Typography fontWeight={700} color={hasAccess(2) ? "#334155" : "#94a3b8"} sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Shakti Chakra</Typography>
              </Box>
              <TutorialButton toolName="Shakti Chakra" tutorials={tutorials} onClick={playTutorialForTool} />
            </AccordionSummary>
            <AccordionDetails sx={{ pb: 3 }}>
              <ShaktiChakraButton shaktiChakra={shaktiChakra} devta={devta} validate={() => validateStep('shakti')} />
            </AccordionDetails>
          </Accordion>
        </Box>

        {/* --- 3. REMEDIES ANALYSIS (MULTIPLE ENTRANCE SUPPORT) --- */}

        <Box onClickCapture={!hasAccess(3) ? handleLockedClick : undefined} sx={{ cursor: !hasAccess(3) ? 'pointer' : 'default' }}>
          <Accordion sx={accordionStyle} disabled={!hasAccess(3)}>
            <AccordionSummary expandIcon={hasAccess(3) ? <ExpandMoreIcon sx={{ color: "#f97316" }} /> : <LockIcon sx={{ color: "#94a3b8", fontSize: 20 }} />}>
              <Box sx={summaryHeaderStyle}>
                <Box sx={stepCircleStyle}>2</Box>
                                <Typography fontWeight={700} color={hasAccess(3) ? "#334155" : "#94a3b8"} sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Remedies Analysis</Typography>
              </Box>
              <TutorialButton toolName="Remedies Analysis" tutorials={tutorials} onClick={playTutorialForTool} />
            </AccordionSummary>
            <AccordionDetails>              <Typography fontSize={11} color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
              Click a button below, then mark a point, line, or polygon on the layout.
            </Typography>

              <Grid container spacing={1}>
                {extraElements.map((el, i) => {
                  const isActiveTool = el.name === activeCategory && isEntranceMode;
                  return (
                    <Grid item xs={4} key={i}>
                      <Tooltip title={`Mark ${el.name} location`}>
                        <Button
                          fullWidth
                          variant="contained"
                          size="small"
                          onClick={() => {
                            const isSameCategory = activeCategory === el.name;
                            const newVal = isSameCategory ? !isEntranceMode : true;
                            if (newVal) {
                              if (isPlotActive) toggleMeasure();
                            }
                            setIsEntranceMode(newVal, el.name, el.pointsNeeded);
                          }}
                          sx={{
                            fontSize: 10,
                            fontWeight: 700,
                            py: 1.2,
                            px: 0.5,
                            minHeight: 46,
                            textTransform: "none",
                            lineHeight: 1.2,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                            borderRadius: 2.5,
                            bgcolor: isActiveTool ? "#f97316" : "#fff",
                            color: isActiveTool ? "#fff" : "#475569",
                            border: isActiveTool ? "1px solid #f97316" : "1px solid #f1f5f9",
                            opacity: 1,
                            boxShadow: isActiveTool
                              ? "0 4px 12px rgba(249, 115, 22, 0.4)"
                              : "0 2px 4px rgba(0,0,0,0.03)",
                            "&:hover": {
                              bgcolor: isActiveTool ? "#ea580c" : "#fff",
                              transform: "translateY(-2px)",
                              boxShadow: isActiveTool
                                ? "0 6px 15px rgba(249, 115, 22, 0.5)"
                                : "0 5px 12px rgba(0,0,0,0.08)",
                              borderColor: isActiveTool ? "#ea580c" : "#cbd5e1",
                            },
                            "&:active": {
                              transform: "translateY(0px)",
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
                            <Typography fontSize={11} fontWeight={900} sx={{ opacity: 0.7 }}>+</Typography>
                            <Typography fontSize={10.5} fontWeight={800} letterSpacing={-0.2}>
                              {el.name}
                            </Typography>
                          </Box>
                        </Button>
                      </Tooltip>
                    </Grid>
                  );
                })}
              </Grid>

              {/* Multi-Zone Custom Remedy Button */}
              <Box sx={{ mt: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<MedicationIcon />}
                  onClick={() => setZoneRemedyDialogOpen(true)}
                  sx={{
                    borderRadius: 3,
                    border: '1px solid #f97316',
                    color: '#f97316',
                    fontWeight: 800,
                    textTransform: 'none',
                    py: 1.5,
                    fontSize: 13,
                    '&:hover': {
                      bgcolor: 'rgba(249, 115, 22, 0.05)',
                      borderColor: '#ea580c'
                    }
                  }}
                >
                  Add Custom Zone Remedy
                </Button>
              </Box>

              {isEntranceMode && (
                <Box sx={{ ...noteBoxStyle, mt: 2 }}>
                  <InfoOutlinedIcon sx={{ fontSize: 16, mr: 1 }} />
                  <Typography fontSize={11}>
                    {activeCategory} marking active. Click {activeCategory === 'Entrance' ? '2' : '4'} points on the map.
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography fontSize={12} fontWeight={800} color="#334155">
                  Marked Components ({entrances.length})
                </Typography>
                {entrances.length > 0 && (
                  <Tooltip title="Remove all marked components">
                    <Button
                      size="small"
                      color="error"
                      onClick={() => { if (window.confirm("Clear all marked components?")) resetEntrance(); }}
                      sx={{ fontSize: 9, fontWeight: 700, p: 0 }}
                    >
                      Clear All
                    </Button>
                  </Tooltip>
                )}
              </Box>

              {/* Tooltip Size Controller */}
              <Box sx={{ px: 1, mb: 1.5 }}>
                <Typography fontSize={10} fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                  BOX SIZE (ZOOM) <span>{tooltipScale.toFixed(1)}x</span>
                </Typography>
                <Slider
                  size="small"
                  value={tooltipScale}
                  min={0.5}
                  max={2.5}
                  step={0.1}
                  onChange={(e, val) => setTooltipScale(val)}
                  sx={{
                    color: '#f97316',
                    height: 4,
                    '& .MuiSlider-thumb': {
                      width: 12,
                      height: 12,
                      backgroundColor: '#fff',
                      border: '2px solid #f97316',
                    },
                    '& .MuiSlider-track': { border: 'none' },
                    '& .MuiSlider-rail': { opacity: 0.3 }
                  }}
                />
              </Box>

              <List id="vastu-analysis-list" dense sx={{ width: '100%', bgcolor: '#f8fafc', borderRadius: 2 }}>
                {entrances.length === 0 ? (
                  <Typography fontSize={11} color="text.disabled" textAlign="center" py={2}>
                    No components marked yet.
                  </Typography>
                ) : (
                  entrances.map((ent, index) => (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {(() => {
                            // Precise Zone for Remedy Lookup (Always 32)
                            const preciseZone = getEntranceZone(ent, centerPoint, rotation, 32);

                            const remedyInfo = remedies.find(r => r.zone_code === preciseZone && r.category === (ent.category || 'Entrance'));
                            const isPositive = remedyInfo ? Number(remedyInfo.is_positive) === 1 : false;

                            if (remedyInfo && !isPositive) {
                              return (
                                <Tooltip title={`View Remedy (${preciseZone})`}>
                                  <IconButton
                                    size="small"
                                    sx={{
                                      bgcolor: '#fee2e2',
                                      color: '#ef4444',
                                      border: '1px solid #fca5a5',
                                      width: 24, height: 24,
                                      '&:hover': { bgcolor: '#fecaca' },
                                      zIndex: 10 // Ensure it's above other list items
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log("Opening remedy for:", remedyInfo); // Debug log
                                      handleShowRemedy(remedyInfo, index);
                                    }}
                                  >
                                    <MedicationIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                              );
                            }
                            return null;
                          })()}

                          <Tooltip title="Edit Details">
                            <IconButton edge="end" size="small" onClick={() => handleEditItem(index, ent)}>
                              <EditOutlinedIcon fontSize="small" sx={{ color: "#f97316" }} />
                            </IconButton>
                          </Tooltip>
                          <IconButton edge="end" size="small" onClick={() => removeEntrance(index)}>
                            <DeleteOutlineIcon fontSize="small" color="error" />
                          </IconButton>
                        </Box>
                      }
                      sx={{ borderBottom: "1px solid #e2e8f0" }}
                    >
                      {(() => {
                        // 1. Calculate the precise center zone for remedies (logic remains same)
                        const preciseZone = getEntranceZone(ent, centerPoint, rotation, 32);

                        // 2. Calculate ALL covered zones for display
                        const coveredZonesList = calculateObjectZones(ent, centerPoint, rotation, angle, zoneCount);
                        const coveredZonesLabel = coveredZonesList.join(' + ') || preciseZone;

                        const remedyInfo = remedies.find(r => r.zone_code === preciseZone && r.category === (ent.category || 'Entrance'));
                        const isPositive = remedyInfo ? Number(remedyInfo.is_positive) === 1 : false;

                        // Dynamic Icon
                        const categoryIcon = extraElements.find(e => e.name === ent.category)?.icon || <MeetingRoomIcon sx={{ fontSize: 20 }} />;

                        return (
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ color: "#f97316", display: 'flex' }}>
                                  {React.cloneElement(categoryIcon, { sx: { fontSize: 18 } })}
                                </Box>
                                {ent.specification || `${ent.category || 'Entrance'} ${index + 1}`}
                              </Box>
                            }
                            primaryTypographyProps={{ fontSize: 12, fontWeight: 800, component: 'div' }}
                            secondaryTypographyProps={{ component: 'div' }}
                            secondary={
                              <>
                                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                                  <Chip
                                    label={`Zones: ${coveredZonesLabel}`}
                                    size="small"
                                    sx={{
                                      height: 'auto',
                                      minHeight: 18,
                                      fontSize: 10,
                                      bgcolor: Number(isPositive) === 1 ? "#dcfce7" : "#fee2e2",
                                      color: Number(isPositive) === 1 ? "#166534" : "#991b1b",
                                      border: `1px solid ${Number(isPositive) === 1 ? "#86efac" : "#fca5a5"}`,
                                      mt: 0.5,
                                      fontWeight: 800,
                                      '& .MuiChip-label': {
                                        whiteSpace: 'normal',
                                        px: 1,
                                        py: 0.5
                                      }
                                    }}
                                  />
                                  {remedyInfo?.is_connected_area == 1 && (
                                    <Chip
                                      label="Connected"
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: 10,
                                        bgcolor: "#e0f2fe",
                                        color: "#0369a1",
                                        border: "1px solid #bae6fd",
                                        mt: 0.5,
                                        fontWeight: 800
                                      }}
                                    />
                                  )}
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 0.5 }}>
                                  {Number(isPositive) === 1 ? (
                                    <CheckCircleIcon sx={{ fontSize: 14, color: "#166534" }} />
                                  ) : (
                                    <CancelIcon sx={{ fontSize: 14, color: "#b91c1c" }} />
                                  )}
                                  <Typography
                                    component="div"
                                    fontSize={11}
                                    fontWeight={700}
                                    sx={{
                                      color: Number(isPositive) === 1 ? "#166534" : "#b91c1c"
                                    }}
                                  >
                                    {Number(isPositive) === 1
                                      ? `âœ” Excellent placement for ${ent.category || 'Entrance'}`
                                      : `âœ– Negative placement for ${ent.category || 'Entrance'}`}
                                    {ent.details && (ent.details.itemColor || ent.details.wallColor) && (
                                      <Box sx={{ mt: 0.5, fontSize: 10, color: 'text.secondary', display: 'flex', flexWrap: 'wrap', gap: 1.5, opacity: 0.9 }}>
                                        {ent.details.itemColor && <span><b>{ent.category}:</b> {ent.details.itemColor}</span>}
                                        {ent.details.wallColor && <span><b>Wall:</b> {ent.details.wallColor}</span>}
                                        {ent.details.ceilingColor && <span><b>Ceiling:</b> {ent.details.ceilingColor}</span>}
                                        {ent.details.floorColor && <span><b>Floor:</b> {ent.details.floorColor}</span>}
                                        {remedyInfo && (
                                      <Chip
                                        label={ent.useCustomRemedy ? "Custom (Expert)" : (remedyInfo.expert_id ? "Expert" : "Admin")}
                                        size="small"
                                        sx={{
                                          height: 18,
                                          fontSize: 9,
                                          bgcolor: ent.useCustomRemedy ? "#fff7ed" : (remedyInfo.expert_id ? "#f0f9ff" : "#f1f5f9"),
                                          color: ent.useCustomRemedy ? "#9a3412" : (remedyInfo.expert_id ? "#0369a1" : "#475569"),
                                          border: `1px solid ${ent.useCustomRemedy ? "#fed7aa" : (remedyInfo.expert_id ? "#bae6fd" : "#e2e8f0")}`,
                                          mt: 0.5,
                                          fontWeight: 900,
                                          textTransform: 'uppercase'
                                        }}
                                      />
                                    )}
                                  </Box>
                                    )}
                                  </Typography>
                                </Box>
                              </>
                            }
                          />
                        );
                      })()}


                    </ListItem>
                  ))
                )}

                {/* --- CUSTOM ZONE REMEDIES LIST --- */}
                {customZoneRemedies.length > 0 && (
                  <Box id="vastu-zone-remedies-list">
                    <Divider sx={{ my: 1.5 }} />
                    <Typography fontSize={11} fontWeight={900} color="#64748b" sx={{ mb: 1, px: 2, textTransform: 'uppercase' }}>
                      ZONE REMEDIES ({customZoneRemedies.length})
                    </Typography>
                    {customZoneRemedies.map((remedy) => (
                      <ListItem
                        key={remedy.id}
                        secondaryAction={
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton 
                              size="small" 
                              onClick={() => {
                                setEditingZoneRemedy(remedy);
                                setZoneRemedyDialogOpen(true);
                              }}
                            >
                              <EditOutlinedIcon fontSize="small" sx={{ color: "#f97316" }} />
                            </IconButton>
                            <IconButton size="small" onClick={() => removeCustomZoneRemedy(remedy.id)}>
                              <DeleteOutlineIcon fontSize="small" color="error" />
                            </IconButton>
                          </Box>
                        }
                        sx={{ 
                          bgcolor: '#fff7ed', 
                          mb: 1, 
                          borderRadius: 2, 
                          border: '1px solid #ffedd5',
                          mx: 1,
                          width: 'calc(100% - 16px)'
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <MedicationIcon sx={{ fontSize: 16, color: '#f97316' }} />
                              <Typography fontSize={12} fontWeight={800} color="#9a3412">
                                Zones: {remedy.zones.join(', ')}
                              </Typography>
                              <Chip 
                                label="Expert" 
                                size="small" 
                                sx={{ 
                                  height: 16, 
                                  fontSize: 8, 
                                  fontWeight: 900, 
                                  bgcolor: '#fff7ed', 
                                  color: '#9a3412', 
                                  border: '1px solid #ffedd5',
                                  textTransform: 'uppercase'
                                }} 
                              />
                            </Box>
                          }
                          secondary={
                            <Typography fontSize={11} color="#7c2d12" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                              {remedy.remedy}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </Box>
                )}
              </List>
            </AccordionDetails>
          </Accordion>
        </Box>

        {/* --- 4. MARMA MARKING MODULE --- */}

        <Box onClickCapture={!hasAccess(4) ? handleLockedClick : undefined} sx={{ cursor: !hasAccess(4) ? 'pointer' : 'default' }}>
          <Accordion sx={accordionStyle} disabled={!hasAccess(4)}>
            <AccordionSummary expandIcon={hasAccess(4) ? <ExpandMoreIcon sx={{ color: "#f97316" }} /> : <LockIcon sx={{ color: "#94a3b8", fontSize: 20 }} />}>
              <Box sx={summaryHeaderStyle}>
                <Box sx={{ ...stepCircleStyle, bgcolor: hasAccess(4) ? "#f97316" : "#cbd5e1" }}>3</Box>
                                <Typography fontWeight={700} color={hasAccess(4) ? "#334155" : "#94a3b8"} sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Marma Marking</Typography>
              </Box>
              <TutorialButton toolName="Marma Marking" tutorials={tutorials} onClick={playTutorialForTool} />
            </AccordionSummary>
            <AccordionDetails>
              <Typography fontSize={12} color="text.secondary" sx={{ mb: 2 }}>
                Display Marma (Energy) Lines on the layout.
              </Typography>

              <Box sx={{ mb: 2, p: 1, border: "1px solid #f1f5f9", borderRadius: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isMarmaActive}
                      onChange={(e) => handleMarmaToggle(e.target.checked)}
                      color="error"
                    />
                  }
                  label={<Typography fontSize={13} fontWeight={700}>Show Marma Marking</Typography>}
                />
              </Box>

              <Box sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: 2, border: "1px dashed #fee2e2" }}>
                <Typography fontSize={11} color="#64748b" sx={{ fontStyle: 'italic' }}>
                  <b>Note:</b> This 9x9 grid and diagonals (Karna Rekha) identify sensitive Marma points where heavy construction or nails should be avoided.
                </Typography>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>

        {/* --- OTHER MODULES (Zone Wise Area, Devtas) --- */}
        {/* --- 5. ZONE WISE AREA --- */}

        <Box onClickCapture={!hasAccess(5) ? handleLockedClick : undefined} sx={{ cursor: !hasAccess(5) ? 'pointer' : 'default' }}>
          <Accordion sx={accordionStyle} disabled={!hasAccess(5)}>
            <AccordionSummary expandIcon={hasAccess(5) ? <ExpandMoreIcon sx={{ color: "#f97316" }} /> : <LockIcon sx={{ color: "#94a3b8", fontSize: 20 }} />}>
              <Box sx={summaryHeaderStyle}>
                <Box sx={{ ...stepCircleStyle, bgcolor: hasAccess(5) ? "#f97316" : "#cbd5e1" }}>4</Box>
                                <Typography fontWeight={700} color={hasAccess(5) ? "#334155" : "#94a3b8"} sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Zone Wise Area</Typography>
              </Box>
              <TutorialButton toolName="Zone Wise Area" tutorials={tutorials} onClick={playTutorialForTool} />
            </AccordionSummary>
            <AccordionDetails>
              {/* Assuming areaData, totalArea, and isActive are calculated/defined in the parent component scope */}
              <Box id="vastu-area-report">
                {[
                  { label: "8 ZONES ANALYSIS", data: areaData8 },
                  { label: "16 ZONES ANALYSIS", data: areaData16 },
                  { label: "32 ZONES ANALYSIS", data: areaData32 }
                ].map((section, sIdx) => (
                  <Box key={sIdx} sx={{ mb: sIdx < 2 ? 4 : 0 }}>
                    <Typography fontSize={11} fontWeight={900} color="#f97316" sx={{ mb: 1, px: 1, letterSpacing: 1 }}>
                      {section.label}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, px: 1 }}>
                      <Typography fontSize={10} fontWeight={700} color="#64748b">ZONE</Typography>
                      <Box sx={{ display: 'flex', gap: 3 }}>
                        <Typography fontSize={10} fontWeight={700} color="#64748b">AREA</Typography>
                        <Typography fontSize={10} fontWeight={700} color="#64748b">%</Typography>
                      </Box>
                    </Box>

                    <List dense disablePadding>
                      {section.data.length > 0 ? section.data.map((data, idx) => (
                        <ListItem key={idx} sx={{ py: 0.5, px: 1, borderBottom: '1px solid #f1f5f9' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: data.color, mr: 1.5 }} />
                            <Typography fontSize={12} fontWeight={600} color="#334155">{data.zone}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 80, justifyContent: 'flex-end' }}>
                            <Typography fontSize={12} fontWeight={500} color="#475569">{data.area}</Typography>
                            <Typography fontSize={12} fontWeight={600} color="#1e293b" sx={{ minWidth: 40, textAlign: 'right' }}>{data.percent}</Typography>
                          </Box>
                        </ListItem>
                      )) : (
                        <Typography fontSize={12} color="text.secondary" textAlign="center" py={2}>
                          {!isActive ? "Activate Shakti Chakra first." : "Mark the boundary to calculate areas."}
                        </Typography>
                      )}
                    </List>

                    {section.data.length > 0 && (
                      <Box sx={{ mt: 1, px: 2, py: 1, bgcolor: '#f8fafc', borderRadius: 2, display: 'flex', justifyContent: 'space-between' }}>
                        <Typography fontSize={12} fontWeight={800} color="#334155">TOTAL</Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Typography fontSize={12} fontWeight={800} color="#1e293b">
                            {section.data.reduce((acc, curr) => acc + parseFloat(curr.area), 0).toFixed(2)}
                          </Typography>
                          <Typography fontSize={12} fontWeight={800} color="#1e293b">100.0%</Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>

              <Tooltip title="View Area Analysis Bar Chart">
                <span>
                  <Button
                    fullWidth
                    variant="contained"
                    disabled={areaData16.length === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("[ToolModules] View Graph Clicked.");
                      // Pass all data for the toggle in GlobalDialogs
                      setGraphData({
                        zones8: areaData8,
                        zones16: areaData16,
                        zones32: areaData32
                      });
                      setShowGraphDialog(true);
                    }}
                    sx={{ ...primaryButtonStyle, mt: 3 }}
                  >
                    View Graph (Analysis)
                  </Button>
                </span>
              </Tooltip>
            </AccordionDetails>
          </Accordion>
        </Box>

        {/* --- 6. DEVTA MANDALA (STEP 1) --- */}

        <Box onClickCapture={!hasAccess(6) ? handleLockedClick : undefined} sx={{ cursor: !hasAccess(6) ? 'pointer' : 'default' }}>
          <Accordion sx={accordionStyle} disabled={!hasAccess(6)}>
            <AccordionSummary expandIcon={hasAccess(6) ? <ExpandMoreIcon sx={{ color: "#f97316" }} /> : <LockIcon sx={{ color: "#94a3b8", fontSize: 20 }} />}>
              <Box sx={summaryHeaderStyle}>
                <Box sx={{ ...stepCircleStyle, bgcolor: hasAccess(6) ? "#f97316" : "#cbd5e1" }}>5</Box>
                                <Typography fontWeight={700} color={hasAccess(6) ? "#334155" : "#94a3b8"} sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Devta Mandala</Typography>
              </Box>
              <TutorialButton toolName="Devta Mandala" tutorials={tutorials} onClick={playTutorialForTool} />
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 1, pb: 2 }}>
              <Box sx={{
                p: 2,
                bgcolor: devta.isActive ? 'rgba(249, 115, 22, 0.05)' : '#f8fafc',
                borderRadius: 3,
                border: devta.isActive ? '1px solid #f97316' : '1px solid #e2e8f0',
                transition: 'all 0.3s ease'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography fontSize={13} fontWeight={800} color={devta.isActive ? "#ea580c" : "#64748b"}>
                      Devta System
                    </Typography>
                    <Typography fontSize={10} color="#94a3b8">
                      {devta.isActive ? "Mandala is currently active" : "Enable to show sacred markings"}
                    </Typography>
                  </Box>
                  <Switch
                    checked={devta.isActive}
                    onChange={() => devta.toggleActive()}
                    color="warning"
                  />
                </Box>

                {devta.isActive && (
                  <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography fontSize={12} fontWeight={700} color="#334155">
                        Show Devta Details
                      </Typography>
                      <Typography fontSize={10} color="#94a3b8">
                        Hawan, Bhog & Attributes
                      </Typography>
                    </Box>
                    <Switch
                      checked={devta.showDevtaDetails}
                      onChange={() => devta.toggleDevtaDetails()}
                      color="warning"
                      size="small"
                    />
                  </Box>
                )}

                {devta.isActive && (

                  <Box sx={{ mt: 2 }}>
                    <ToggleButtonGroup
                      value={devta.activeTab}
                      exclusive
                      onChange={(e, val) => { if (val) devta.setTab(val); }}
                      fullWidth
                      size="small"
                      sx={{
                        bgcolor: "#fff",
                        borderRadius: 2,
                        '& .MuiToggleButton-root': {
                          border: 'none',
                          fontWeight: 800,
                          fontSize: 10,
                          py: 0.5,
                          color: '#64748b',
                          '&.Mui-selected': {
                            bgcolor: '#f97316',
                            color: '#fff',
                            '&:hover': { bgcolor: '#ea580c' }
                          }
                        }
                      }}
                    >
                      <ToggleButton value="Markings">MARKINGS</ToggleButton>
                      <ToggleButton value="Area Analysis">AREA ANALYSIS</ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                )}
              </Box>

              {devta.isActive && devta.activeTab === 'Markings' && (
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* STYLE SELECTOR */}
                  <Box>
                    <Typography fontSize={11} fontWeight={800} color="#64748b" sx={{ mb: 1, textTransform: 'uppercase' }}>
                      Mandala Style
                    </Typography>
                    <Grid container spacing={1}>
                      {[
                        { id: 'circular', label: 'Circular', icon: <AdjustIcon sx={{ fontSize: 16 }} /> },
                        { id: 'grid', label: 'Square Grid', icon: <GridViewIcon sx={{ fontSize: 16 }} /> }
                      ].map((style) => (
                        <Grid item xs={6} key={style.id}>
                          <Tooltip title={`Switch to ${style.label} style`}>
                            <Button
                              fullWidth
                              size="small"
                              variant={devta.mandalaStyle === style.id ? "contained" : "outlined"}
                              onClick={() => devta.setMandalaStyle(style.id)}
                              startIcon={style.icon}
                              sx={{
                                textTransform: 'none',
                                fontSize: 11,
                                fontWeight: 700,
                                borderRadius: 2,
                                py: 0.8,
                                bgcolor: devta.mandalaStyle === style.id ? "#f97316" : "transparent",
                                color: devta.mandalaStyle === style.id ? "#fff" : "#94a3b8",
                                borderColor: devta.mandalaStyle === style.id ? "#f97316" : "#e2e8f0",
                                '&:hover': {
                                  bgcolor: devta.mandalaStyle === style.id ? "#ea580c" : "#f8fafc"
                                }
                              }}
                            >
                              {style.label}
                            </Button>
                          </Tooltip>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>

                  {/* MANDALA SIZE SLIDER REMOVED AS PER USER REQUEST */}

                  {/* LAYER TOGGLES */}
                  <Box>
                    <Typography fontSize={11} fontWeight={800} color="#64748b" sx={{ mb: 1, textTransform: 'uppercase' }}>
                      Visible Layers
                    </Typography>
                    <Grid container spacing={1}>
                      {[
                        { id: 'brahmasthan', label: 'Center', active: devta.activeLayers.brahmasthan },
                        { id: 'fourDevtas', label: 'Inner 4', active: devta.activeLayers.fourDevtas },
                        { id: 'eightDevtas', label: 'Middle 8', active: devta.activeLayers.eightDevtas },
                        { id: 'thirtyTwoDevtas', label: 'Outer 32', active: devta.activeLayers.thirtyTwoDevtas }
                      ].map((layer) => (
                        <Grid item xs={6} key={layer.id}>
                          <Tooltip title={`Toggle ${layer.label}`}>
                            <Button
                              fullWidth
                              size="small"
                              variant={layer.active ? "contained" : "outlined"}
                              onClick={() => devta.toggleLayer(layer.id)}
                              sx={{
                                textTransform: 'none',
                                fontSize: 10,
                                fontWeight: 700,
                                borderRadius: 1.5,
                                color: layer.active ? "#fff" : "#64748b",
                                bgcolor: layer.active ? "#fb923c" : "transparent",
                                borderColor: layer.active ? "#fb923c" : "#e2e8f0",
                                '&:hover': { bgcolor: layer.active ? "#f97316" : "#f1f5f9" }
                              }}
                            >
                              {layer.label}
                            </Button>
                          </Tooltip>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>

                  {/* ADDITIONAL ATTRIBUTES REMOVED AS PER USER REQUEST */}
                </Box>
              )}

              {devta.isActive && devta.activeTab === 'Area Analysis' && (
                <Box sx={{ mt: 2 }}>
                  {/* Search Bar */}
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search Devta Name..."
                    value={devtaSearch}
                    onChange={(e) => setDevtaSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 3,
                        fontSize: 12,
                        bgcolor: '#fff',
                        mb: 2,
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#f97316' }
                      }
                    }}
                  />

                  {/* Devta Area List */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, px: 1 }}>
                    <Typography fontSize={10} fontWeight={700} color="#64748b">DEVTA</Typography>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                      <Typography fontSize={10} fontWeight={700} color="#64748b">AREA</Typography>
                      <Typography fontSize={10} fontWeight={700} color="#64748b">%</Typography>
                    </Box>
                  </Box>

                  <List dense disablePadding sx={{ maxHeight: 300, overflowY: 'auto', bgcolor: '#fff', borderRadius: 2, border: '1px solid #f1f5f9' }}>
                    {devtaAreaData.length > 0 ? devtaAreaData.map((data, idx) => (
                      <ListItem key={idx} sx={{ py: 0.5, px: 1, borderBottom: '1px solid #f1f5f9' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: data.color, mr: 1.5 }} />
                          <Typography fontSize={12} fontWeight={600} color="#334155">{data.devta}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 80, justifyContent: 'flex-end' }}>
                          <Typography fontSize={11} fontWeight={500} color="#475569">{data.area}</Typography>
                          <Typography fontSize={11} fontWeight={600} color="#1e293b" sx={{ minWidth: 40, textAlign: 'right' }}>{data.percent}</Typography>
                        </Box>
                      </ListItem>
                    )) : (
                      <Typography fontSize={12} color="text.secondary" textAlign="center" py={2}>
                        No Devtas found matching "{devtaSearch}".
                      </Typography>
                    )}
                  </List>

                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Tooltip title="View Devta Area Bar Chart">
                      <span>
                        <Button
                          fullWidth
                          variant="contained"
                          disabled={devtaAreaData.length === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Map 'devta' key to 'zone' for graph compatibility
                            const mappedData = devtaAreaData.map(d => ({
                              ...d,
                              zone: d.devta // Recharts XAxis uses dataKey="zone"
                            }));
                            setGraphData([...mappedData]);
                            setShowGraphDialog(true);
                          }}
                          sx={{ ...primaryButtonStyle, fontSize: 13 }}
                        >
                          View Devta Area Graph
                        </Button>
                      </span>
                    </Tooltip>

                    <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
                      <Typography fontSize={10} color="#64748b" sx={{ fontStyle: 'italic' }}>
                        <b>Tip:</b> This data is dynamic. Areas will automatically update if the plot boundary changes.
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </Box>


        <ReportOptions 
          isDetailsFilled={isDetailsFilled} 
          onShowDetails={onShowDetails}
          hasAccess={hasAccess}
          handleLockedClick={handleLockedClick}
          externalIsExporting={isExporting}
          externalSetIsExporting={setIsExporting}
          externalIsExportingFull={isExportingFull}
          externalSetIsExportingFull={setIsExportingFull}
        />

      </Box> {/* End of FlexGrow Box for Modules */}

      {/* FOOTER NAVIGATION */}
      <Box sx={{ mt: 'auto', pt: 2, pb: 1, textAlign: 'center', borderTop: '1px solid #f1f5f9' }}>
        <Button
          onClick={onBack}
          sx={{
            ...backButtonStyle,
            textTransform: 'none'
          }}
        >
          Replace Image
        </Button>
      </Box>



      <TutorialPlayerModal
        open={playerModal.open}
        onClose={() => setPlayerModal({ ...playerModal, open: false })}
        videoUrl={playerModal.videoUrl}
        videoFilename={playerModal.videoFilename}
        title={playerModal.title}
      />
    </Box >
  );
}

// Helper to render Tutorial Button in Accordion
const TutorialButton = ({ toolName, tutorials, onClick }) => {
  const hasTutorial = tutorials.some(t => t.tool_name === toolName);
  if (!hasTutorial) return null;

  return (
    <Tooltip title={`Watch ${toolName} Tutorial`}>
      <Box
        role="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick(toolName);
        }}
        sx={{
          color: "#f97316",
          bgcolor: "rgba(249, 115, 22, 0.05)",
          ml: "auto",
          mr: 1,
          p: 0.6,
          borderRadius: "50%",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
          "&:hover": { bgcolor: "rgba(249, 115, 22, 0.15)", transform: "scale(1.1)" },
          "&:active": { transform: "scale(0.95)" }
        }}
      >
        <VideoLibraryIcon sx={{ fontSize: 18 }} />
      </Box>
    </Tooltip>
  );
};


