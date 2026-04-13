import React, { useState, useEffect } from "react";
import {
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Zoom,
    TextField,
    Switch,
    FormControlLabel,
    Box,
    Button,
    IconButton,
    Tooltip,
    Grid,
    Chip,
    Checkbox,
    ToggleButton,
    ToggleButtonGroup,
    MenuItem,
    Autocomplete
} from "@mui/material";
import Divider from '@mui/material/Divider';
import { useNavigate } from "react-router-dom";
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import LockIcon from "@mui/icons-material/Lock";
import UpgradeIcon from "@mui/icons-material/Upgrade";
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CancelIcon from '@mui/icons-material/Cancel';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import KitchenIcon from '@mui/icons-material/Kitchen';
import WcIcon from '@mui/icons-material/Wc';
import TempleHinduIcon from '@mui/icons-material/TempleHindu';
import BedIcon from '@mui/icons-material/Bed';
import LocalLaundryServiceIcon from '@mui/icons-material/LocalLaundryService';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import WorkIcon from '@mui/icons-material/Work';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import StairsIcon from '@mui/icons-material/Stairs';
import WashIcon from '@mui/icons-material/Wash';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import InventoryIcon from '@mui/icons-material/Inventory';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { useEntrance } from "../services/tool/entranceService";
import { useCenterPoint } from "../services/tool/centerService";
import { useShaktiChakra } from "../services/tool/shaktiChakraService";
import { useMeasure } from "../services/tool/boundaryService";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ReferenceLine,
    ResponsiveContainer,
    Cell,
    LabelList
} from "recharts";

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

    const dx = midX - center.x;
    const dy = center.y - midY;
    let mathDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (mathDeg < 0) mathDeg += 360;

    const vastuDeg = (450 - mathDeg) % 360;
    const correctedAngle = (vastuDeg - (rotation || 0) + 360) % 360;

    const step = 360 / (zones || 16);
    const zoneIndex = Math.floor(correctedAngle / step);

    const zoneLabels16 = [
        "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
        "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
    ];
    return zoneLabels16[zoneIndex % 16];
};

const primaryButtonStyle = {
    bgcolor: "#f97316",
    color: "#fff",
    fontWeight: 800,
    borderRadius: 2,
    px: 3,
    textTransform: "none",
    "&:hover": { bgcolor: "#ea580c" }
};

const dialogButtonStyle = {
    bgcolor: "#f97316",
    color: "#fff",
    fontWeight: 700,
    borderRadius: 2,
    px: 4,
    "&:hover": { bgcolor: "#ea580c" }
};

const extraElements = [
    { name: "Entrance", icon: <MeetingRoomIcon sx={{ fontSize: 16 }} /> },
    { name: "Kitchen", icon: <KitchenIcon sx={{ fontSize: 16 }} /> },
    { name: "Toilet", icon: <WcIcon sx={{ fontSize: 16 }} /> },
    { name: "Mandir", icon: <TempleHinduIcon sx={{ fontSize: 16 }} /> },
    { name: "Master Bed", icon: <BedIcon sx={{ fontSize: 16 }} /> },
    { name: "Kids Bed", icon: <BedIcon sx={{ fontSize: 16 }} /> },
    { name: "W. Machine", icon: <LocalLaundryServiceIcon sx={{ fontSize: 16 }} /> },
    { name: "Locker", icon: <LockIcon sx={{ fontSize: 16 }} /> },
    { name: "Study Table", icon: <AutoStoriesIcon sx={{ fontSize: 16 }} /> },
    { name: "Dining", icon: <RestaurantIcon sx={{ fontSize: 16 }} /> },
    { name: "Office Desk", icon: <WorkIcon sx={{ fontSize: 16 }} /> },
    { name: "Fam. Photo", icon: <InsertPhotoIcon sx={{ fontSize: 16 }} /> },
    { name: "Trophies", icon: <EmojiEventsIcon sx={{ fontSize: 16 }} /> },
    { name: "O.H. Tank", icon: <WaterDropIcon sx={{ fontSize: 16 }} /> },
    { name: "U.G. Tank", icon: <WaterDropIcon sx={{ fontSize: 16 }} /> },
    { name: "Septic Tank", icon: <WashIcon sx={{ fontSize: 16 }} /> },
    { name: "Dustbin", icon: <CancelIcon sx={{ fontSize: 16 }} /> },
    { name: "Staircase Area", icon: <StairsIcon sx={{ fontSize: 16 }} /> },
    { name: "Staircase Landing", icon: <StairsIcon sx={{ fontSize: 16 }} /> },
];

export default function GlobalDialogs() {
    const navigate = useNavigate();
    const {
        showSpecDialog, setShowSpecDialog,
        currentEntrance, activeCategory,
        isEditing, updateEntrance, saveEntranceDetails,
        specInput, setSpecInput,
        componentDetails, setComponentDetails,
        remedies, setRemedies,
        selectedRemedy, setSelectedRemedy,
        selectedEntranceIndex, setSelectedEntranceIndex,
        remedyDialogOpen, setRemedyDialogOpen,
        showGraphDialog, setShowGraphDialog,
        graphData, setGraphData,
        openAlert, setOpenAlert,
        upgradeDialogOpen, setUpgradeDialogOpen,
        customRemedyInput, setCustomRemedyInput,
        useCustomRemedyToggle, setUseCustomRemedyToggle,
        customRemedyProductIds, setCustomRemedyProductIds, // New state for individual remedy
        entrances, editIndex, setEditState,
        // Multi-zone remedy states
        customZoneRemedies, addCustomZoneRemedy, updateCustomZoneRemedy, removeCustomZoneRemedy,
        zoneRemedyDialogOpen, setZoneRemedyDialogOpen,
        editingZoneRemedy, setEditingZoneRemedy
    } = useEntrance();

    const [activeGraphZones, setActiveGraphZones] = useState("16");
    const [activeRemedyZones, setActiveRemedyZones] = useState("16"); // 8, 16, 32
    const [selectedZones, setSelectedZones] = useState([]);
    const [zoneRemedyText, setZoneRemedyText] = useState("");
    const [zoneRemedyCategory, setZoneRemedyCategory] = useState("General");
    const [allProducts, setAllProducts] = useState([]);
    const [productSearch, setProductSearch] = useState("");
    const [selectedProducts, setSelectedProducts] = useState([]);

    useEffect(() => {
        // Fetch all products for selection
        fetch('/api/marketplace/get_all_products.php')
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') setAllProducts(data.products);
            })
            .catch(err => console.error("[GlobalDialogs] Error fetching products:", err));
    }, []);

    useEffect(() => {
        if (zoneRemedyDialogOpen) {
            if (editingZoneRemedy) {
                setSelectedZones(editingZoneRemedy.zones || []);
                setZoneRemedyText(editingZoneRemedy.remedy || "");
                setZoneRemedyCategory(editingZoneRemedy.category || "General");
                
                // Determine active zones based on selected zones labels
                if (editingZoneRemedy.zones && editingZoneRemedy.zones.length > 0) {
                    const isAll = editingZoneRemedy.zones.includes('ALL');
                    if (isAll) {
                         // Keep as 'ALL' or set to current scheme? 
                         // User said "all karne per 8,16,32 sare cover hone chiye"
                    }
                    const first = editingZoneRemedy.zones[0];
                    if (first.match(/^[NESW]\d$/)) setActiveRemedyZones("32");
                    else if (["NNE", "ENE", "ESE", "SSE", "SSW", "WSW", "WNW", "NNW"].includes(first)) setActiveRemedyZones("16");
                    else setActiveRemedyZones("8");
                }

                // Parse product_ids if they exist
                if (editingZoneRemedy.product_ids) {
                    try {
                        const ids = Array.isArray(editingZoneRemedy.product_ids) 
                            ? editingZoneRemedy.product_ids 
                            : JSON.parse(editingZoneRemedy.product_ids);
                        
                        const stringIds = ids.map(id => String(id));
                        const initialSelected = allProducts.filter(p => stringIds.includes(String(p.id)));
                        setSelectedProducts(initialSelected);
                    } catch (e) {
                        setSelectedProducts([]);
                    }
                } else {
                    setSelectedProducts([]);
                }
            } else {
                setSelectedZones([]);
                setZoneRemedyText("");
                setZoneRemedyCategory("General");
                setSelectedProducts([]);
            }
            // Reset productSearch to null or empty string, but we want it to show on click
            setProductSearch("");
        }
    }, [zoneRemedyDialogOpen, editingZoneRemedy, allProducts]);

    useEffect(() => {
        if (remedyDialogOpen && selectedEntranceIndex !== null) {
            const ent = entrances[selectedEntranceIndex];
            if (ent && ent.product_ids) {
                try {
                    const ids = typeof ent.product_ids === 'string' ? JSON.parse(ent.product_ids) : ent.product_ids;
                    const stringIds = ids.map(id => String(id));
                    const initialSelected = allProducts.filter(p => stringIds.includes(String(p.id)));
                    setSelectedProducts(initialSelected);
                } catch(e) {
                    setSelectedProducts([]);
                }
            } else {
                setSelectedProducts([]);
            }
            setProductSearch("");
        }
    }, [remedyDialogOpen, selectedEntranceIndex, allProducts, entrances]);

    const handleSaveZoneRemedy = async () => {
        if (selectedZones.length === 0) return;
        
        const remedyData = {
            zones: selectedZones,
            remedy: zoneRemedyText,
            category: zoneRemedyCategory,
            product_ids: JSON.stringify(selectedProducts.map(p => p.id))
        };

        if (editingZoneRemedy) {
            updateCustomZoneRemedy(editingZoneRemedy.id, remedyData);
        } else {
            addCustomZoneRemedy(remedyData);
        }

        // --- Persist to Master DB for Expert ---
        const occultUser = JSON.parse(localStorage.getItem('occult_user') || '{}');
        if (occultUser.role === 'expert') {
            try {
                // Determine zones to save
                const zonesToSave = selectedZones.includes('ALL') ? ['ALL'] : selectedZones;
                
                for (const z of zonesToSave) {
                    await fetch('/api/entrance_remedies.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            expert_id: occultUser.id,
                            category: zoneRemedyCategory,
                            zone_code: z,
                            remedy: zoneRemedyText,
                            product_ids: remedyData.product_ids,
                            status: 'active'
                        })
                    });
                }
            } catch (err) {
                console.error("Error persisting expert remedy to DB:", err);
            }
        }
        
        setZoneRemedyDialogOpen(false);
        setEditingZoneRemedy(null);
        setSelectedProducts([]);
    };

    const zones8 = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const zoneLabels16 = [
        "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
        "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
    ];
    const zones32 = [
        "N1", "N2", "N3", "N4", "N5", "N6", "N7", "N8",
        "E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8",
        "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8",
        "W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"
    ];

    const currentZoneLabels = activeRemedyZones === "8" ? zones8 : (activeRemedyZones === "32" ? zones32 : zoneLabels16);

    // Get unique categories from existing remedies
    const existingCategories = Array.from(new Set([
        "General", "Color Therapy", "Devta Remedy", "Metal Strips", "Relocation",
        ...customZoneRemedies.map(r => r.category).filter(Boolean)
    ]));

    const toggleZone = (zone) => {
        setSelectedZones(prev => {
            if (prev.includes('ALL')) return [zone]; // If it was ALL, switch to single zone
            const next = prev.includes(zone) ? prev.filter(z => z !== zone) : [...prev, zone];
            // If all individual zones selected, maybe don't auto-switch to 'ALL' to avoid confusion, 
            // but we'll let "SELECT ALL" button handle the 'ALL' tag.
            return next;
        });
    };

    const isAllSelected = selectedZones.includes('ALL') || (selectedZones.length === currentZoneLabels.length && selectedZones.length > 0);


    useEffect(() => {
        const occultUser = JSON.parse(localStorage.getItem('occult_user') || '{}');
        const expertId = occultUser.role === 'expert' ? occultUser.id : null;
        const expertParam = expertId ? `&expert_id=${expertId}` : '';

        if (remedies.length === 0) {
            fetch(`/api/entrance_remedies.php?category=all${expertParam}`)
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') setRemedies(data.data);
                })
                .catch(err => console.error("[GlobalDialogs] Error fetching remedies:", err));
        }
    }, [remedies.length, setRemedies]);

    const handleSaveEntranceSpec = () => {
        const targetEnt = isEditing ? entrances[editIndex] : currentEntrance;
        if (!targetEnt) return;

        // Calculate zone for current entry (Always 32 zones for precise mapping)
        const zone = getEntranceZone(targetEnt, centerPoint, rotation, 32);

        if (isEditing) {
            updateEntrance(editIndex, {
                specification: specInput,
                zone: zone,
                details: activeCategory === 'Entrance' ? {} : componentDetails
            });
            setEditState(null, false);
        } else {
            saveEntranceDetails(specInput, zone, activeCategory === 'Entrance' ? {} : componentDetails);
        }

        setSpecInput("");
        setComponentDetails({ itemColor: "", wallColor: "", ceilingColor: "", floorColor: "" });
        setShowSpecDialog(false);
    };

    const centerPoint = useCenterPoint();
    const { rotation, zoneCount } = useShaktiChakra();
    const { points } = useMeasure();


    return (
        <>
            {/* 🔹 DIALOG FOR ENTRANCE SPECIFICATION */}
            <Dialog
                open={showSpecDialog}
                disableEnforceFocus
                disableScrollLock
                hideBackdrop
                sx={{
                    zIndex: 99999,
                    pointerEvents: 'none'
                }}
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        width: 350,
                        pointerEvents: 'auto'
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, fontSize: 18 }}>{activeCategory} Details</DialogTitle>
                <DialogContent>
                    <Typography fontSize={13} color="text.secondary" sx={{ mb: 2 }}>
                        Provide a label or specification for this entrance (e.g., N1, Balcony).
                    </Typography>

                    {(() => {
                        const previewZone = showSpecDialog && currentEntrance ? getEntranceZone(currentEntrance, centerPoint, rotation, zoneCount) : null;
                        const previewRemedyData = remedies.find(r => r.zone_code === previewZone && r.category === (activeCategory || 'Entrance'));

                        if (previewZone) {
                            return (
                                <Box sx={{ mb: 2, p: 1.5, bgcolor: "#f1f5f9", borderRadius: 2, border: "1px dashed #cbd5e1" }}>
                                    <Typography fontSize={12} fontWeight={800} color="#334155">
                                        Detected Zone: <span style={{ color: "#f97316" }}>{previewZone}</span>
                                    </Typography>

                                    {previewRemedyData && (
                                        <>
                                            <Typography fontSize={12} fontWeight={600} color={Number(previewRemedyData.is_positive) ? "#166534" : "#991b1b"} sx={{ mt: 0.5 }}>
                                                Type: {Number(previewRemedyData.is_positive) ? "Positive" : "Negative"}
                                            </Typography>
                                            <Typography fontSize={11} color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-wrap', fontStyle: 'italic', color: '#475569' }}>
                                                <b>Remedy:</b> {previewRemedyData.remedy}
                                            </Typography>
                                        </>
                                    )}
                                </Box>
                            );
                        }
                        return null;
                    })()}

                    <TextField
                        autoFocus
                        fullWidth
                        label={`${activeCategory} Name / Label`}
                        placeholder="e.g. Master Kitchen"
                        variant="outlined"
                        size="small"
                        value={specInput}
                        onChange={(e) => setSpecInput(e.target.value)}
                        sx={{ mb: 2.5 }}
                        InputLabelProps={{ shrink: true }}
                    />

                    {activeCategory !== 'Entrance' && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {[
                                { label: `${activeCategory} Color`, key: 'itemColor' },
                                { label: 'Wall Color', key: 'wallColor' },
                                { label: 'Ceiling Color', key: 'ceilingColor' },
                                { label: 'Floor Color', key: 'floorColor' }
                            ].map((field) => (
                                <TextField
                                    key={field.key}
                                    fullWidth
                                    label={field.label}
                                    variant="outlined"
                                    size="small"
                                    value={componentDetails[field.key] || ""}
                                    onChange={(e) => setComponentDetails({ ...componentDetails, [field.key]: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                />
                            ))}
                        </Box>
                    )}

                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setShowSpecDialog(false)} color="inherit" sx={{ fontWeight: 700, color: '#000000' }}>Skip</Button>
                    <Button onClick={handleSaveEntranceSpec} variant="contained" sx={primaryButtonStyle}>
                        {isEditing ? "Update Details" : "Save Details"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 🔹 DIALOG FOR INSUFFICIENT POINTS ALERT */}
            <Dialog
                open={openAlert}
                TransitionComponent={Zoom}
                onClose={() => setOpenAlert(false)}
                sx={{ zIndex: 99999 }}
                PaperProps={{ sx: { borderRadius: 4, p: 1, minWidth: 320, textAlign: "center" } }}
            >
                <DialogContent>
                    <WarningAmberRoundedIcon sx={{ fontSize: 60, color: "#f97316", mb: 2 }} />
                    <DialogTitle sx={{ fontWeight: 800 }}>Insufficient Points</DialogTitle>
                    <Typography color="#64748b">
                        A minimum of <b>3 points</b> is required to find the geometric center.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: "center", p: 3 }}>
                    <Button onClick={() => setOpenAlert(false)} variant="contained" sx={dialogButtonStyle}>
                        I Understand
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 🔹 UPGRADE DIALOG */}
            <Dialog
                open={upgradeDialogOpen}
                TransitionComponent={Zoom}
                onClose={() => setUpgradeDialogOpen(false)}
                sx={{ zIndex: 99999 }}
                PaperProps={{ sx: { borderRadius: 4, p: 2, minWidth: 350, textAlign: "center" } }}
            >
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 60, height: 60, borderRadius: '50%', bgcolor: 'rgba(249, 115, 22, 0.1)', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LockIcon sx={{ fontSize: 32 }} />
                    </Box>
                    <Typography variant="h6" fontWeight={800} color="#334155">Feature Locked</Typography>
                    <Typography variant="body2" color="text.secondary">Upgrade your plan to unlock full access.</Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: "center", pb: 3, px: 3, flexDirection: 'column', gap: 1 }}>
                    <Button
                        fullWidth
                        variant="contained"
                        startIcon={<UpgradeIcon />}
                        onClick={() => { setUpgradeDialogOpen(false); navigate('/plans'); }}
                        sx={primaryButtonStyle}
                    >
                        Upgrade Plan
                    </Button>
                    <Button fullWidth onClick={() => setUpgradeDialogOpen(false)} sx={{ color: "#64748b", fontWeight: 600 }}>Maybe Later</Button>
                </DialogActions>
            </Dialog>

            {/* 🔹 REMEDY DIALOG */}
            <Dialog
                open={remedyDialogOpen}
                onClose={() => setRemedyDialogOpen(false)}
                disableScrollLock
                hideBackdrop
                maxWidth="sm"
                fullWidth
                sx={{
                    zIndex: 99999,
                    pointerEvents: 'none'
                }}
                PaperProps={{
                    sx: {
                        pointerEvents: 'auto'
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 900, color: "#9a3412", display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ bgcolor: 'rgba(249, 115, 22, 0.1)', p: 1, borderRadius: 2, display: 'flex' }}>
                        {React.cloneElement(extraElements.find(e => e.name === selectedRemedy?.category)?.icon || <MeetingRoomIcon />, { sx: { fontSize: 24, color: '#f97316' } })}
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900 }}>{selectedRemedy?.category || 'Component'} Remedy</Typography>
                        <Typography variant="caption" sx={{ color: '#c2410c' }}>Zone: {selectedRemedy?.zone_code}</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Typography sx={{ fontWeight: 600, color: "#c2410c", mb: 2 }}>Negative Zone detected.</Typography>
                    <Box sx={{ p: 2, bgcolor: '#fef2f2', borderRadius: 2, border: '1px solid #fecaca', mb: 3 }}>
                        <Typography fontSize={11} fontWeight={800} color="#991b1b" sx={{ mb: 1 }}>
                            {selectedRemedy?.expert_id ? "EXPERT REMEDY" : "ADMIN REMEDY"}
                        </Typography>
                        <Typography sx={{ whiteSpace: 'pre-wrap', color: '#334155', fontSize: 14 }}>{selectedRemedy?.remedy || "No remedy available."}</Typography>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                            <Typography fontSize={13} fontWeight={800} color="#334155">Custom Remedy</Typography>
                            <Switch size="small" checked={useCustomRemedyToggle} onChange={(e) => setUseCustomRemedyToggle(e.target.checked)} color="warning" />
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            disabled={!useCustomRemedyToggle}
                            label="Write Your Remedy"
                            value={customRemedyInput}
                            onChange={(e) => setCustomRemedyInput(e.target.value)}
                            sx={{ bgcolor: useCustomRemedyToggle ? '#fff' : '#f1f5f9' }}
                        />

                        {/* 📦 Product Selection for Individual Remedy */}
                        {useCustomRemedyToggle && (
                            <Box sx={{ mt: 2, p: 2, bgcolor: '#fcfcfc', borderRadius: 4, border: '1px solid #f1f5f9' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                    <ShoppingBagIcon sx={{ color: '#f97316', fontSize: 18 }} />
                                    <Typography fontSize={11} fontWeight={900} color="#334155" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Link Products ({selectedProducts.length})
                                    </Typography>
                                </Box>
                                
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                                    {selectedProducts.map((p) => (
                                        <Chip
                                            key={p.id}
                                            label={p.name}
                                            icon={<InventoryIcon sx={{ fontSize: '14px !important', color: '#c2410c !important' }} />}
                                            onDelete={() => setSelectedProducts(prev => prev.filter(item => String(item.id) !== String(p.id)))}
                                            deleteIcon={<DeleteOutlineIcon sx={{ color: '#c2410c !important' }} />}
                                            size="small"
                                            sx={{ 
                                                bgcolor: '#fff7ed', 
                                                color: '#c2410c', 
                                                border: '1px solid #fed7aa',
                                                borderRadius: 1.5,
                                                '& .MuiChip-label': { fontWeight: 800, fontSize: 10 }
                                            }}
                                        />
                                    ))}
                                </Box>

                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Search products..."
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    sx={{ mb: 1 }}
                                    InputProps={{
                                        startAdornment: <SearchIcon sx={{ color: '#f97316', mr: 1, fontSize: 18 }} />,
                                        sx: { borderRadius: 3, bgcolor: '#fff', fontSize: 13 }
                                    }}
                                />

                                {productSearch && (
                                    <Box sx={{ 
                                        maxHeight: 180, 
                                        overflowY: 'auto', 
                                        border: '1px solid #e2e8f0', 
                                        borderRadius: 3, 
                                        bgcolor: '#fff',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                                     }}>
                                 <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', bgcolor: '#f8fafc', position: 'sticky', top: 0, zIndex: 5 }}>
                                     <Typography fontSize={10} fontWeight={900} color="#64748b" sx={{ pl: 1 }}>PRODUCT RESULTS</Typography>
                                     <IconButton size="small" onClick={() => setProductSearch("")} sx={{ color: '#f97316' }}>
                                         <CancelIcon sx={{ fontSize: 18 }} />
                                     </IconButton>
                                 </Box>
                                        {allProducts
                                            .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                                            .map((p) => {
                                                const isSelected = selectedProducts.some(item => String(item.id) === String(p.id));
                                                return (
                                                    <Box
                                                        key={p.id}
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                setSelectedProducts(prev => prev.filter(item => String(item.id) !== String(p.id)));
                                                            } else {
                                                                setSelectedProducts(prev => [...prev, p]);
                                                            }
                                                        }}
                                                        sx={{ 
                                                            p: 1.5, 
                                                            px: 2,
                                                            cursor: 'pointer', 
                                                            display: 'flex', 
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between', 
                                                            '&:hover': { bgcolor: '#fff7ed' },
                                                            borderBottom: '1px solid #f8fafc',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                            {p.images && JSON.parse(p.images)[0] && (
                                                                <Box 
                                                                    component="img" 
                                                                    src={`/api/uploads/products/${JSON.parse(p.images)[0]}`} 
                                                                    sx={{ width: 32, height: 32, borderRadius: 1.5, objectFit: 'cover', border: '1px solid #f1f5f9' }} 
                                                                />
                                                            ) || (
                                                                <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <ShoppingBagIcon sx={{ color: '#cbd5e1', fontSize: 16 }} />
                                                                </Box>
                                                            )}
                                                            <Typography variant="body2" sx={{ fontWeight: isSelected ? 800 : 600, color: isSelected ? '#c2410c' : '#334155', fontSize: 12 }}>
                                                                {p.name}
                                                            </Typography>
                                                        </Box>
                                                        {isSelected && <CheckCircleIcon sx={{ color: '#f97316', fontSize: 18 }} />}
                                                    </Box>
                                                );
                                            })
                                        }
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setRemedyDialogOpen(false)} sx={{ fontWeight: 700, color: '#64748b' }}>Cancel</Button>
                    <Button
                        onClick={async () => {
                            if (selectedEntranceIndex !== null) {
                                // 1. Update local state
                                updateEntrance(selectedEntranceIndex, {
                                    customRemedy: customRemedyInput,
                                    useCustomRemedy: useCustomRemedyToggle
                                });

                                // 2. Sync to DB if it's an expert
                                const occultUser = JSON.parse(localStorage.getItem('occult_user') || '{}');
                                if (occultUser.role === 'expert' && useCustomRemedyToggle && customRemedyInput) {
                                    try {
                                        await fetch('/api/entrance_remedies.php', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                expert_id: occultUser.id,
                                                category: selectedRemedy?.category || 'Entrance',
                                                zone_code: selectedRemedy?.zone_code,
                                                remedy: customRemedyInput,
                                                product_ids: JSON.stringify(selectedProducts.map(p => p.id)),
                                                is_positive: 0, // Assume negative if remedy needed
                                                status: 'active'
                                            })
                                        });
                                        // Optional: refresh remedies list
                                    } catch (err) {
                                        console.error("Error saving expert remedy:", err);
                                    }
                                }

                                // 3. Update entrances state locally
                                updateEntrance(selectedEntranceIndex, {
                                    product_ids: JSON.stringify(selectedProducts.map(p => p.id))
                                });
                            }
                            setRemedyDialogOpen(false);
                        }}
                        variant="contained"
                        sx={primaryButtonStyle}
                    >
                        Save Preference
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 🔹 AREA GRAPH DIALOG */}
            <Dialog
                open={showGraphDialog}
                onClose={() => setShowGraphDialog(false)}
                maxWidth="md"
                fullWidth
                TransitionComponent={Zoom}
                sx={{ zIndex: 99999 }}
                PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
            >
                <Box sx={{
                    background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#fff'
                                     }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <TrendingUpIcon sx={{ color: '#fff' }} />
                        <Typography variant="h6" fontWeight={800}>Area Distribution Analysis</Typography>
                    </Box>
                    <IconButton onClick={() => setShowGraphDialog(false)} sx={{ color: "#fff" }}>
                        <CancelIcon />
                    </IconButton>
                </Box>
                <DialogContent sx={{ px: 3, pt: 1, pb: 1 }}>
                    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                        <ToggleButtonGroup
                            value={activeGraphZones}
                            exclusive
                            onChange={(e, newVal) => newVal && setActiveGraphZones(newVal)}
                            size="small"
                        >
                            <ToggleButton value="8" sx={{ fontSize: 10, fontWeight: 800 }}>8 ZONES</ToggleButton>
                            <ToggleButton value="16" sx={{ fontSize: 10, fontWeight: 800 }}>16 ZONES</ToggleButton>
                            <ToggleButton value="32" sx={{ fontSize: 10, fontWeight: 800 }}>32 ZONES</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    <Box sx={{ width: '100%', height: 500 }}>
                        {(() => {
                            // Determine which data to show based on toggle
                            let currentData = [];
                            if (graphData && !Array.isArray(graphData) && graphData.zones8) {
                                if (activeGraphZones === "8") currentData = graphData.zones8;
                                else if (activeGraphZones === "32") currentData = graphData.zones32;
                                else currentData = graphData.zones16;
                            } else if (Array.isArray(graphData)) {
                                currentData = graphData;
                            }

                            const chartData = currentData.map(d => ({ 
                                ...d, 
                                percentNum: parseFloat(d.percent?.replace('%', '') || 0) 
                            }));
                            const vals = chartData.map(d => d.percentNum);
                            const maxVal = chartData.length > 0 ? Math.max(...vals) : 0;
                            const minVal = chartData.length > 0 ? Math.min(...vals) : 0;
                            const avgVal = chartData.length > 0 ? (vals.reduce((a, b) => a + b, 0) / (vals.length || 1)) : 0;
                            const maxAvg = (maxVal + avgVal) / 2;
                            const minAvg = (minVal + avgVal) / 2;

                            return (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart 
                                        data={chartData} 
                                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="zone" angle={-45} textAnchor="end" height={50} fontSize={10} fontWeight={700} />
                                        <YAxis unit="%" domain={[0, 'auto']} fontSize={11} />
                                        <RechartsTooltip 
                                            formatter={(value) => [`${value.toFixed(2)}%`, 'Area Percentage']}
                                            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                                        />
                                        <Legend verticalAlign="top" height={36}/>
                                        
                                        <Bar dataKey="percentNum" name="Area %" radius={[4, 4, 0, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color || "#f97316"} />
                                            ))}
                                        </Bar>

                                        {chartData.length > 0 && (
                                            <>
                                                <ReferenceLine y={avgVal} stroke="#22c55e" strokeDasharray="5 5" label={{ value: `Avg: ${avgVal.toFixed(1)}%`, position: 'right', fill: '#22c55e', fontSize: 10, fontWeight: 800, background: '#fff' }} />
                                                <ReferenceLine y={maxAvg} stroke="#ef4444" strokeDasharray="3 3" label={{ value: `Max: ${maxAvg.toFixed(1)}%`, position: 'right', fill: '#ef4444', fontSize: 10, fontWeight: 800 }} />
                                                <ReferenceLine y={minAvg} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: `Min: ${minAvg.toFixed(1)}%`, position: 'right', fill: '#3b82f6', fontSize: 10, fontWeight: 800 }} />
                                            </>
                                        )}
                                    </BarChart>
                                </ResponsiveContainer>
                            );
                        })()}
                    </Box>
                </DialogContent>
            </Dialog>

            {/* 🔹 CUSTOM ZONE REMEDY DIALOG (MULTI-ZONE SUPPORT) */}
            <Dialog
                open={zoneRemedyDialogOpen}
                onClose={() => setZoneRemedyDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
                sx={{ zIndex: 99999 }}
            >
                <DialogTitle sx={{ fontWeight: 900, color: "#9a3412" }}>
                    {editingZoneRemedy ? "Edit Zone Remedy" : "Add Custom Zone Remedy"}
                </DialogTitle>
                <DialogContent>
                    <Typography fontSize={13} color="text.secondary" sx={{ mb: 2 }}>
                        Select one or more zones to apply this remedy.
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography fontSize={11} fontWeight={900} color="#64748b" sx={{ textTransform: 'uppercase' }}>
                                Selected Zones: <span style={{ color: '#f97316' }}>{isAllSelected ? "ALL" : (selectedZones.length > 0 ? selectedZones.join(", ") : "None")}</span>
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button 
                                    size="small" 
                                    variant="outlined"
                                    onClick={() => {
                                        if (isAllSelected) setSelectedZones([]);
                                        else setSelectedZones(['ALL']);
                                    }}
                                    sx={{ 
                                        minWidth: 0, 
                                        px: 1.5, 
                                        height: 24, 
                                        fontSize: 9, 
                                        fontWeight: 900, 
                                        borderRadius: 1.5,
                                        borderColor: isAllSelected ? '#f97316' : '#e2e8f0',
                                        color: isAllSelected ? '#f97316' : '#64748b',
                                        bgcolor: isAllSelected ? '#fff7ed' : 'transparent'
                                    }}
                                >
                                    {isAllSelected ? "DESELECT ALL" : "SELECT ALL"}
                                </Button>
                                <ToggleButtonGroup
                                    value={activeRemedyZones}
                                    exclusive
                                    onChange={(e, v) => v && setActiveRemedyZones(v)}
                                    size="small"
                                    sx={{ height: 24 }}
                                    disabled={selectedZones.includes('ALL')}
                                >
                                    <ToggleButton value="8" sx={{ fontSize: 9, fontWeight: 900, px: 1 }}>8Z</ToggleButton>
                                    <ToggleButton value="16" sx={{ fontSize: 9, fontWeight: 900, px: 1 }}>16Z</ToggleButton>
                                    <ToggleButton value="32" sx={{ fontSize: 9, fontWeight: 900, px: 1 }}>32Z</ToggleButton>
                                </ToggleButtonGroup>
                            </Box>
                        </Box>
                        <Grid container spacing={0.5}>
                            {currentZoneLabels.map((zone) => {
                                const isSelected = selectedZones.includes('ALL') || selectedZones.includes(zone);
                                return (
                                    <Grid item xs={2.4} sm={1.5} key={zone}>
                                        <Chip
                                            label={zone}
                                            onClick={() => toggleZone(zone)}
                                            sx={{
                                                width: '100%',
                                                fontWeight: 800,
                                                fontSize: activeRemedyZones === "32" ? 9 : 10,
                                                borderRadius: 1.5,
                                                height: 28,
                                                bgcolor: isSelected ? "#f97316" : "#f8fafc",
                                                color: isSelected ? "#fff" : "#64748b",
                                                border: `1px solid ${isSelected ? "#f97316" : "#e2e8f0"}`,
                                                '&:hover': {
                                                    bgcolor: isSelected ? "#ea580c" : "#f1f5f9"
                                                }
                                            }}
                                        />
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <Autocomplete
                            freeSolo
                            options={existingCategories}
                            value={zoneRemedyCategory}
                            onChange={(e, newVal) => setZoneRemedyCategory(newVal || "General")}
                            onInputChange={(e, newVal) => setZoneRemedyCategory(newVal)}
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    label="Remedy Category" 
                                    placeholder="e.g. Color Therapy, Metal Strips..."
                                    size="small"
                                    InputProps={{
                                        ...params.InputProps,
                                        sx: { borderRadius: 3 }
                                    }}
                                />
                            )}
                        />
                    </Box>

                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Remedy Description"
                        placeholder="Type the remedy for selected zones..."
                        value={zoneRemedyText}
                        onChange={(e) => setZoneRemedyText(e.target.value)}
                        variant="outlined"
                        sx={{
                            mt: 1,
                            "& .MuiOutlinedInput-root": {
                                borderRadius: 3
                            }
                        }}
                    />

                    <Box sx={{ mt: 3, p: 2, bgcolor: '#fcfcfc', borderRadius: 4, border: '1px solid #f1f5f9', position: 'relative' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <ShoppingBagIcon sx={{ color: '#f97316', fontSize: 18 }} />
                            <Typography fontSize={11} fontWeight={900} color="#334155" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Link Products ({selectedProducts.length})
                            </Typography>
                        </Box>
                        
                        {/* Selected Products Chips */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                            {selectedProducts.map((p) => (
                                <Chip
                                    key={p.id}
                                    label={p.name}
                                    icon={<InventoryIcon sx={{ fontSize: '14px !important', color: '#c2410c !important' }} />}
                                    onDelete={() => setSelectedProducts(prev => prev.filter(item => String(item.id) !== String(p.id)))}
                                    deleteIcon={<DeleteOutlineIcon sx={{ color: '#c2410c !important' }} />}
                                    size="small"
                                    sx={{ 
                                        bgcolor: '#fff7ed', 
                                        color: '#c2410c', 
                                        border: '1px solid #fed7aa',
                                        borderRadius: 1.5,
                                        '& .MuiChip-label': { fontWeight: 800, fontSize: 10 }
                                    }}
                                />
                            ))}
                        </Box>

                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search products to link..."
                            value={productSearch}
                            onFocus={() => { if(!productSearch) setProductSearch(" "); }}
                            onChange={(e) => setProductSearch(e.target.value)}
                            sx={{ mb: 1 }}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ color: '#f97316', mr: 1, fontSize: 18 }} />,
                                sx: { borderRadius: 3, bgcolor: '#fff', fontSize: 13 }
                            }}
                        />

                        {productSearch !== "" && (
                            <Box sx={{ 
                                position: 'absolute',
                                bottom: '100%',
                                left: 0,
                                right: 0,
                                zIndex: 10,
                                mb: 1,
                                maxHeight: 200, 
                                overflowY: 'auto', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: 4,
                                bgcolor: '#fff',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                                animation: 'fadeIn 0.2s ease-out'
                                     }}>
                                 <Box sx={{ p: 1, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", bgcolor: "#f8fafc", position: "sticky", top: 0, zIndex: 5 }}>
                                     <Typography fontSize={10} fontWeight={900} color="#64748b" sx={{ pl: 1 }}>PRODUCT RESULTS</Typography>
                                     <IconButton size="small" onClick={() => setProductSearch("")} sx={{ color: "#f97316" }}>
                                         <CancelIcon sx={{ fontSize: 18 }} />
                                     </IconButton>
                                 </Box>
                                {allProducts
                                    .filter(p => p.name.toLowerCase().includes((productSearch || "").trim().toLowerCase()))
                                    .map((p) => {
                                        const isSelected = selectedProducts.some(item => String(item.id) === String(p.id));
                                        const imageUrl = p.image_url || (p.images ? (typeof p.images === 'string' ? JSON.parse(p.images)[0] : p.images[0]) : null);
                                        
                                        return (
                                            <Box
                                                key={p.listing_id || p.id}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setSelectedProducts(prev => prev.filter(item => String(item.id) !== String(p.id)));
                                                    } else {
                                                        setSelectedProducts(prev => [...prev, p]);
                                                    }
                                                }}
                                                sx={{
                                                    p: 1.5,
                                                    px: 2,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    '&:hover': { bgcolor: '#fff7ed' },
                                                    borderBottom: '1px solid #f8fafc',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    {imageUrl && (
                                                        <Box 
                                                            component="img" 
                                                            src={`/${imageUrl}`} 
                                                            sx={{ width: 36, height: 36, borderRadius: 2, objectFit: 'cover', border: '1px solid #f1f5f9' }} 
                                                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100?text=Product'; }}
                                                        />
                                                    ) || (
                                                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <ShoppingBagIcon sx={{ color: '#cbd5e1', fontSize: 18 }} />
                                                        </Box>
                                                    )}
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: isSelected ? 800 : 600, color: isSelected ? '#c2410c' : '#334155', fontSize: 12 }}>
                                                            {p.name}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                                                            ₹{p.price}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                {isSelected && <CheckCircleIcon sx={{ color: '#f97316', fontSize: 20 }} />}
                                            </Box>
                                        );
                                    })
                                }
                                <Box sx={{ p: 1, textAlign: 'center', borderTop: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
                                    <Button 
                                        size="small" 
                                        onClick={() => setProductSearch("")}
                                        sx={{ fontWeight: 800, color: '#f97316', textTransform: 'none', fontSize: 11 }}
                                    >
                                        Close Product List
                                    </Button>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setZoneRemedyDialogOpen(false)} sx={{ fontWeight: 700, color: '#64748b' }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveZoneRemedy}
                        variant="contained"
                        disabled={selectedZones.length === 0}
                        sx={primaryButtonStyle}
                    >
                        {editingZoneRemedy ? "Update Remedy" : "Add Remedy"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
