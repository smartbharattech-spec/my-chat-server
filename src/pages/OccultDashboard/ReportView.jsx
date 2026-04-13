import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, CircularProgress, 
    Button, Card, CardContent, Chip, IconButton, Badge,
    List, ListItem, ListItemText, Divider, Tooltip, Slider
} from '@mui/material';
import { 
    ArrowLeft, Map as MapIcon, ShieldCheck, Info, MessageSquare, Download, ShoppingCart,
} from 'lucide-react';
import CartDrawer from '../../components/CartDrawer';
import MedicationIcon from '@mui/icons-material/Medication';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import BedIcon from '@mui/icons-material/Bed';
import KitchenIcon from '@mui/icons-material/Kitchen';
import WcIcon from '@mui/icons-material/Wc';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
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
import LockIcon from "@mui/icons-material/Lock";

import MarketplaceSidebar from '../../components/MarketplaceSidebar';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../services/ToastService';
import ImageCanvas from '../../components/ImageCanvas';
import { exportAsImage } from '../../services/tool/ExportService';
import ReportOptions from '../../components/ReportOptions';
import { getZoneLabel, calculateObjectZones } from '../../services/tool/shaktiChakraService';

export default function ReportView() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { addToCart, cartCount, isCartOpen, setIsCartOpen } = useCart();
    const { showToast } = useToast();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState(null);
    const [projectData, setProjectData] = useState(null);
    const [mapImage, setMapImage] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isExportingFull, setIsExportingFull] = useState(false);
    const [adminRemedies, setAdminRemedies] = useState([]);
    const [recommendedProducts, setRecommendedProducts] = useState([]);
    const [tooltipScale, setTooltipScale] = useState(1.0);
    const location = useLocation();

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

        const safeZones = zones || 16;
        const step = 360 / safeZones;
        const offset = safeZones === 32 ? 0 : step / 2;

        const index = Math.floor(((correctedAngle + offset) % 360) / step);

        return getZoneLabel(index, safeZones);
    };

    const extraIcons = [
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
        { name: "Dustbin", icon: <DeleteIcon sx={{ fontSize: 16 }} /> },
        { name: "Staircase Area", icon: <StairsIcon sx={{ fontSize: 16 }} /> },
        { name: "Staircase Landing", icon: <StairsIcon sx={{ fontSize: 16 }} /> },
    ];

    useEffect(() => {
        const storedUser = localStorage.getItem('occult_user');
        if (!storedUser) {
            navigate('/occult/login');
        } else {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchReportDetails(parsedUser.email, parsedUser.id);
            fetchAdminRemedies();
        }
    }, [navigate, projectId]);

    useEffect(() => {
        // Auto-download if ?download=true is in URL
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.get('download') === 'true' && projectData && !loading) {
            handleDownload();
        }
    }, [location.search, projectData, loading]);

    useEffect(() => {
        if (projectData) {
            fetchRecommendedProducts();
        }
    }, [projectData]);

    const fetchRecommendedProducts = async () => {
        const productIds = new Set();
        
        // Extract from entrances
        (projectData.entrances || []).forEach(ent => {
            if (ent.product_ids) {
                try {
                    const ids = typeof ent.product_ids === 'string' ? JSON.parse(ent.product_ids) : ent.product_ids;
                    if (Array.isArray(ids)) ids.forEach(id => productIds.add(id));
                } catch(e) { console.error("Error parsing product_ids from entrance", e); }
            } else if (ent.product_id) {
                productIds.add(ent.product_id);
            }
        });
        
        // Extract from zone remedies
        (projectData.customZoneRemedies || []).forEach(zr => {
            if (zr.product_ids) {
                try {
                    const ids = typeof zr.product_ids === 'string' ? JSON.parse(zr.product_ids) : zr.product_ids;
                    if (Array.isArray(ids)) ids.forEach(id => productIds.add(id));
                } catch(e) { console.error("Error parsing product_ids from zone remedy", e); }
            } else if (zr.product_id) {
                productIds.add(zr.product_id);
            }
        });
        
        if (productIds.size === 0) return;
        
        try {
            const productsData = await Promise.all(
                Array.from(productIds).map(async (id) => {
                    const resp = await axios.get(`/api/marketplace/get_product.php?product_id=${id}`);
                    return resp.data.status === 'success' ? resp.data.product : null;
                })
            );
            setRecommendedProducts(productsData.filter(p => p !== null));
        } catch (err) {
            console.error("Error fetching recommended products:", err);
        }
    };

    const fetchReportDetails = async (email, followerId) => {
        try {
            const resp = await axios.get(`/api/projects.php?action=check&id=${projectId}&email=${email}&follower_id=${followerId}&t=${Date.now()}`);
            if (resp.data.status === 'success' && resp.data.purchased) {
                setProject(resp.data);
                if (resp.data.project_data) {
                    const parsedData = JSON.parse(resp.data.project_data);
                    setProjectData(parsedData);
                    
                    // Setup window globals for ImageCanvas to consume (just like VastuToolScreen does)
                    window.vastuRestoreState = parsedData;
                    window.vastuProjectId = projectId;
                    
                    let finalImage = null;
                    if (resp.data.map_image) {
                        finalImage = `/api/uploads/maps/${resp.data.map_image}`;
                    } else if (parsedData.image) {
                        finalImage = parsedData.image;
                    }
                    const imgUrl = finalImage;
                    setMapImage(imgUrl);
                    window.vastuImageState = imgUrl;

                    // Trigger restoration for all Vastu services
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('vastu-restore-state', { detail: parsedData }));
                    }, 100);
                }
            }
        } catch (err) {
            console.error('Error fetching report details:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAdminRemedies = async () => {
        try {
            const resp = await axios.get('/api/entrance_remedies.php?category=all');
            if (Array.isArray(resp.data)) {
                setAdminRemedies(resp.data);
            }
        } catch (err) {
            console.error("Error fetching admin remedies:", err);
        }
    };

    const handleDownload = async () => {
        if (!project || !projectData) return;
        setIsDownloading(true);
        try {
            // Give a tiny bit of time for canvas to be fully stable
            await new Promise(r => setTimeout(r, 500));
            await exportAsImage('vastu-canvas', `${project.project_name}-Vastu-Report.png`, {
                includeRemedies: true,
                entrances: projectData.entrances || [],
                remedies: adminRemedies,
                customZoneRemedies: projectData.customZoneRemedies || [],
                reportType: 'full'
            });
        } catch (err) {
            console.error("Export error:", err);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleBulkAddToCart = () => {
        if (!user) {
            showToast('Please login to add items to cart', 'warning');
            navigate('/occult/login');
            return;
        }
        
        if (recommendedProducts.length === 0) return;

        recommendedProducts.forEach(p => {
            addToCart(p, { id: p.expert_id, name: p.expert_name }, {});
        });
        
        showToast('All products added to cart!', 'success');
        setIsCartOpen(true); // Auto-open cart drawer
    };

    if (loading) return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress color="warning" />
        </Box>
    );

    if (!project) return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6">Report not found or access denied.</Typography>
            <Button onClick={() => navigate('/occult/reports')}>Back to Reports</Button>
        </Box>
    );

    const entranceRemedies = projectData?.entrances || [];
    const zoneRemedies = projectData?.customZoneRemedies || [];

    return (
        <>
        <Box sx={{ display: 'flex', bgcolor: '#f1f5f9', minHeight: '100vh', maxHeight: '100vh', overflow: 'hidden' }}>
            <MarketplaceSidebar user={user} role="user" />

            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
                {/* Header */}
                <Box sx={{ p: 2, bgcolor: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton onClick={() => navigate('/occult/reports')} size="small">
                            <ArrowLeft size={20} />
                        </IconButton>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
                                {project.project_name} - Analysis Report
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                Expert recommendations and Vastu mapping
                            </Typography>
                        </Box>
                    </Box>
                    <Box>
                        <Chip 
                            label={`ID: ${projectId}`} 
                            size="small" 
                            sx={{ fontWeight: 800, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }} 
                        />
                    </Box>
                </Box>

                <Box sx={{ flex: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, overflow: 'hidden' }}>
                    {/* Map Section */}
                    <Box sx={{ flex: 1, position: 'relative', bgcolor: '#fff0e5', overflow: 'hidden', minHeight: { xs: '300px', md: 'auto' } }}>
                        <ImageCanvas image={mapImage} readOnly={true} />
                        
                        {/* Legend Overlay */}
                        <Box sx={{ position: 'absolute', bottom: 20, right: 20, p: 2, bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', borderRadius: 3, border: '1px solid #e2e8f0', maxWidth: 200, zIndex: 10 }}>
                            <Typography variant="caption" fontWeight={900} sx={{ display: 'block', mb: 1, textTransform: 'uppercase', color: '#64748b' }}>Map Legend</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Box sx={{ width: 10, height: 10, bgcolor: '#f59e0b', borderRadius: '50%' }} />
                                <Typography variant="caption" fontWeight={600}>Shakti Chakra</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 10, height: 10, bgcolor: '#10b981', borderRadius: '50%' }} />
                                <Typography variant="caption" fontWeight={600}>Remedy Points</Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* Discovery / Remedies Sidebar */}
                    <Box sx={{ width: { xs: '100%', md: 400 }, bgcolor: '#fff', borderLeft: { md: '1px solid #e2e8f0' }, borderTop: { xs: '1px solid #e2e8f0', md: 'none' }, display: 'flex', flexDirection: 'column', overflow: { xs: 'visible', md: 'hidden' } }}>
                        <Box sx={{ p: 3, borderBottom: '1px solid #f1f5f9' }}>
                            <Typography variant="h6" fontWeight={900} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#0f172a' }}>
                                <ShieldCheck size={24} color="#f59e0b" />
                                Expert Remedies
                            </Typography>
                            <Typography variant="caption" color="textSecondary">Follow these suggestions for Vastu balance.</Typography>
                        </Box>

                        <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Typography fontSize={12} fontWeight={800} color="#334155">
                                    Marked Components ({entranceRemedies.length})
                                </Typography>
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
                                        color: '#f59e0b',
                                        height: 4,
                                        '& .MuiSlider-thumb': {
                                            width: 12,
                                            height: 12,
                                            backgroundColor: '#fff',
                                            border: '2px solid #f59e0b',
                                        },
                                        '& .MuiSlider-track': { border: 'none' },
                                        '& .MuiSlider-rail': { opacity: 0.3 }
                                    }}
                                />
                            </Box>

                            <List id="vastu-analysis-list" dense sx={{ width: '100%', bgcolor: '#f8fafc', borderRadius: 2 }}>
                                {entranceRemedies.length === 0 ? (
                                    <Typography fontSize={11} color="text.disabled" textAlign="center" py={2}>
                                        No components marked yet.
                                    </Typography>
                                ) : (
                                    entranceRemedies.map((ent, index) => {
                                        const centerPoint = projectData.center;
                                        const rotation = projectData.shakti?.rotation || 0;
                                        const zoneCount = projectData.shakti?.zoneCount || 16;
                                        const angle = projectData.rotate || 0;

                                        // 1. Calculate the precise center zone for remedies
                                        const preciseZone = getEntranceZone(ent, centerPoint, rotation, 32);

                                        // 2. Calculate ALL covered zones for display
                                        const coveredZonesList = calculateObjectZones(ent, centerPoint, rotation, angle, zoneCount);
                                        const coveredZonesLabel = coveredZonesList.join(' + ') || preciseZone;

                                        const remedyInfo = adminRemedies.find(r => r.zone_code === preciseZone && r.category === (ent.category || 'Entrance'));
                                        const isPositive = remedyInfo ? Number(remedyInfo.is_positive) === 1 : false;

                                        const categoryIcon = extraIcons.find(e => e.name === ent.category)?.icon || <MeetingRoomIcon sx={{ fontSize: 20 }} />;

                                        return (
                                            <ListItem
                                                key={index}
                                                sx={{ borderBottom: "1px solid #e2e8f0" }}
                                            >
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Box sx={{ color: "#f59e0b", display: 'flex' }}>
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
                                                                        bgcolor: isPositive ? "#dcfce7" : "#fee2e2",
                                                                        color: isPositive ? "#166534" : "#991b1b",
                                                                        border: `1px solid ${isPositive ? "#86efac" : "#fca5a5"}`,
                                                                        mt: 0.5,
                                                                        fontWeight: 800,
                                                                        '& .MuiChip-label': {
                                                                            whiteSpace: 'normal',
                                                                            px: 1,
                                                                            py: 0.5
                                                                        }
                                                                    }}
                                                                />
                                                            </Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 0.5 }}>
                                                                {isPositive ? (
                                                                    <CheckCircleIcon sx={{ fontSize: 14, color: "#166534" }} />
                                                                ) : (
                                                                    <CancelIcon sx={{ fontSize: 14, color: "#b91c1c" }} />
                                                                )}
                                                                <Typography
                                                                    component="div"
                                                                    fontSize={11}
                                                                    fontWeight={700}
                                                                    sx={{
                                                                        color: isPositive ? "#166534" : "#b91c1c"
                                                                    }}
                                                                >
                                                                    {isPositive
                                                                        ? `✔ Excellent placement for ${ent.category || 'Entrance'}`
                                                                        : `✖ Negative placement for ${ent.category || 'Entrance'}`}
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
                                                            {ent.remedy && (
                                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic', fontSize: 11 }}>
                                                                    "{ent.remedy}"
                                                                </Typography>
                                                            )}
                                                        </>
                                                    }
                                                />
                                            </ListItem>
                                        );
                                    })
                                )}

                                {/* --- ZONE REMEDIES --- */}
                                {zoneRemedies.length > 0 && (
                                    <>
                                        <Divider sx={{ my: 1.5 }} />
                                        <Typography fontSize={11} fontWeight={900} color="#64748b" sx={{ mb: 1, px: 2, textTransform: 'uppercase' }}>
                                            ZONE REMEDIES ({zoneRemedies.length})
                                        </Typography>
                                        {zoneRemedies.map((remedy, idx) => (
                                            <ListItem
                                                key={idx}
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
                                                            <MedicationIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                                                            <Typography fontSize={12} fontWeight={800} color="#9a3412">
                                                                Zones: {remedy.zones ? remedy.zones.join(', ') : remedy.zone_name}
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
                                    </>
                                )}
                            </List>

                            {entranceRemedies.length === 0 && zoneRemedies.length === 0 && (
                                <Box sx={{ p: 4, textAlign: 'center', opacity: 0.6 }}>
                                    <Info size={40} color="#94a3b8" style={{ marginBottom: 8 }} />
                                    <Typography variant="body2" color="textSecondary">No remedies have been explicitly logged for this project yet.</Typography>
                                </Box>
                            )}

                            {/* Recommended Products */}
                            {recommendedProducts.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="overline" sx={{ fontWeight: 900, color: '#f59e0b', mb: 0, display: 'block' }}>
                                            Recommended Products
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            {/* View Cart Button */}
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => setIsCartOpen(true)}
                                                startIcon={
                                                    <Badge badgeContent={cartCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 8, minWidth: 14, height: 14 } }}>
                                                        <ShoppingCart size={14} />
                                                    </Badge>
                                                }
                                                sx={{
                                                    fontWeight: 800,
                                                    color: '#0f172a',
                                                    fontSize: '0.6rem',
                                                    textTransform: 'uppercase',
                                                    borderColor: '#e2e8f0',
                                                    borderRadius: '8px',
                                                    px: 1.5,
                                                    '&:hover': { bgcolor: '#f8fafc', borderColor: '#0f172a' }
                                                }}
                                            >
                                                View Cart
                                            </Button>
                                            {/* Add All to Cart Button */}
                                            <Button 
                                                size="small" 
                                                variant="text" 
                                                onClick={handleBulkAddToCart}
                                                sx={{ 
                                                    fontWeight: 800, 
                                                    color: '#f59e0b', 
                                                    fontSize: '0.6rem', 
                                                    textTransform: 'uppercase',
                                                    '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                                                }}
                                            >
                                                Add All
                                            </Button>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        {recommendedProducts.map((p, idx) => (
                                            <Card key={idx} variant="outlined" sx={{ borderRadius: 3, border: '1px solid #fed7aa', bgcolor: '#fffbf7' }}>
                                                <CardContent sx={{ p: 2 }}>
                                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                                        <Box 
                                                            component="img" 
                                                            src={p.images && p.images.length > 0 ? `/api/uploads/products/${p.images[0]}` : 'https://placehold.co/600x400?text=Product+Image'} 
                                                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400?text=Product+Image'; }}
                                                            onClick={() => navigate(`/occult/product/${p.id}`)}
                                                            sx={{ width: 60, height: 60, borderRadius: 2, objectFit: 'cover', border: '1px solid #e2e8f0', cursor: 'pointer' }} 
                                                        />
                                                        <Box sx={{ flex: 1 }}>
                                                            <Typography 
                                                                variant="subtitle2" 
                                                                fontWeight={800} 
                                                                color="#9a3412" 
                                                                onClick={() => navigate(`/occult/product/${p.id}`)}
                                                                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                                            >
                                                                {p.name}
                                                            </Typography>
                                                            <Typography variant="body2" fontWeight={700} color="#f59e0b">
                                                                ₹{p.price}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                                                <Button 
                                                                    size="small" 
                                                                    variant="contained" 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (!user) {
                                                                            showToast('Please login to add items to cart', 'warning');
                                                                            navigate('/occult/login');
                                                                            return;
                                                                        }
                                                                        addToCart(p, { id: p.expert_id, name: p.expert_name }, {});
                                                                        showToast(`${p.name} added to cart!`, 'success');
                                                                        setIsCartOpen(true); // ✅ Auto-open cart
                                                                    }}
                                                                    sx={{ 
                                                                        borderRadius: 2, 
                                                                        fontSize: '0.65rem', 
                                                                        textTransform: 'none', 
                                                                        bgcolor: '#f59e0b',
                                                                        '&:hover': { bgcolor: '#d97706' }
                                                                    }}
                                                                >
                                                                    Add to Cart
                                                                </Button>
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Box>
                                </Box>
                            )}
                            
                            {/* DOWNLOAD OPTIONS & ACTIONS (Moved into scrollable area) */}
                            <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #f1f5f9' }}>
                                <ReportOptions 
                                    isDetailsFilled={true}
                                    showAccordion={false}
                                    projectId={projectId}
                                    externalIsExporting={isDownloading}
                                    externalSetIsExporting={setIsDownloading}
                                    externalIsExportingFull={isExportingFull}
                                    externalSetIsExportingFull={setIsExportingFull}
                                />

                                <Button 
                                    fullWidth 
                                    variant="outlined" 
                                    startIcon={<MessageSquare size={18} />}
                                    onClick={() => navigate('/occult/tracker')}
                                    sx={{ 
                                        borderRadius: 2, 
                                        textTransform: 'none', 
                                        fontWeight: 700, 
                                        color: '#6366f1', 
                                        borderColor: '#6366f120',
                                        '&:hover': { bgcolor: '#6366f105', borderColor: '#6366f1' },
                                        mt: 2
                                    }}
                                >
                                    Ask Expert a Question
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>

        {/* Cart Drawer - slides in from right */}
        <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </>
    );
}
