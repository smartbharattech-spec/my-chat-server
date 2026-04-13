import {
    Box,
    Typography,
    Container,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar,
    Chip,
    Grid,
    CircularProgress,
    Button,
    useMediaQuery,
    useTheme,
    TextField,
    Switch,
    FormControlLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Slider,
    IconButton,
    AppBar,
    Toolbar,
    Stack,
    Breadcrumbs,
    Tooltip
} from "@mui/material";
import Divider from '@mui/material/Divider';
import { 
    People as PeopleIcon, 
    Assignment as AssignmentIcon, 
    AttachMoney as MoneyIcon, 
    VerifiedUser as VerifiedIcon,
    Refresh as RefreshIcon,
    Settings as SettingsIcon,
    CloudUpload as UploadIcon,
    Crop as CropIcon,
    TrendingUp as TrendingUpIcon,
    Save as SaveIcon,
    ChevronRight as ChevronRightIcon,
    Menu as MenuIcon,
    AccountCircle as AccountCircleIcon,
    NavigateNext as NavigateNextIcon
} from "@mui/icons-material";
import { useEffect, useState, useCallback } from "react";
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip as RechartsTooltip, 
    ResponsiveContainer 
} from 'recharts';
import Cropper from 'react-easy-crop';
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../services/AuthService";
import { useToast } from "../services/ToastService";
import AdminPreloader from "../components/AdminPreloader";
import AdminSidebar from "../components/AdminSidebar";

const AdminDashboard = () => {
    const { isAdminLoggedIn, adminUser } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    
    const [stats, setStats] = useState({ totalUsers: 0, totalProjects: 0, totalPayments: 0, activeSubscribers: 0 });
    const [loading, setLoading] = useState(true);
    const [initialLoading, setInitialLoading] = useState(true);
    const [recentUsers, setRecentUsers] = useState([]);
    const [drawerOpen, setDrawerOpen] = useState(isDesktop);
    
    // Settings state
    const [settings, setSettings] = useState({
        whatsapp: "",
        price: "",
        isTrackerEnabled: true,
        isBannerEnabled: true,
        bannerUrl: ""
    });

    // Cropper state
    const [cropOpen, setCropOpen] = useState(false);
    const [image, setImage] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropComplete = useCallback((_croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    useEffect(() => {
        if (!isAdminLoggedIn) {
            navigate("/admin");
            return;
        }
        fetchData(true);
    }, [isAdminLoggedIn, navigate]);

    useEffect(() => {
        setDrawerOpen(isDesktop);
    }, [isDesktop]);

    const fetchData = (isInitial = false) => {
        if (!isInitial) setLoading(true);
        Promise.all([
            fetch("/api/get_admin_stats.php").then(res => res.json()),
            fetch("/api/get_all_users.php").then(res => res.json()),
            fetch("/api/get_setting.php?key=whatsapp_number").then(res => res.json()),
            fetch("/api/get_setting.php?key=map_build_price").then(res => res.json()),
            fetch("/api/get_setting.php?key=is_tracker_enabled").then(res => res.json()),
            fetch("/api/get_setting.php?key=tracker_banner_url").then(res => res.json()),
            fetch("/api/get_setting.php?key=is_tracker_banner_enabled").then(res => res.json())
        ])
        .then(([statsRes, usersRes, waRes, prRes, trRes, bnRes, bneRes]) => {
            if (statsRes.status === "success") setStats(statsRes.data);
            if (usersRes.status === "success") setRecentUsers(usersRes.data.slice(0, 10));
            setSettings({
                whatsapp: waRes.value || "",
                price: prRes.value || "",
                isTrackerEnabled: trRes.value === 'true',
                isBannerEnabled: bneRes.value !== 'false',
                bannerUrl: bnRes.value || ""
            });
            setLoading(false);
            if (isInitial) setInitialLoading(false);
        })
        .catch(err => {
            console.error(err);
            showToast("Failed to fetch dashboard data", "error");
            setLoading(false);
            if (isInitial) setInitialLoading(false);
        });
    };

    const handleUpdateSetting = (key) => {
        const value = key === 'whatsapp_number' ? settings.whatsapp : key === 'map_build_price' ? settings.price : settings.isTrackerEnabled.toString();
        fetch("/api/save_setting.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key, value }),
        })
        .then(res => res.json())
        .then(res => {
            if (res.status === "success") {
                showToast("Setting updated", "success");
            }
        });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImage(reader.result);
                setCropOpen(true);
            });
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleCropSave = async () => {
        try {
            const canvas = document.createElement('canvas');
            const img = new Image();
            img.src = image;
            await new Promise(resolve => img.onload = resolve);

            const ctx = canvas.getContext('2d');
            canvas.width = 1200;
            canvas.height = 300;

            ctx.drawImage(
                img,
                croppedAreaPixels.x,
                croppedAreaPixels.y,
                croppedAreaPixels.width,
                croppedAreaPixels.height,
                0,
                0,
                1200,
                300
            );

            canvas.toBlob(blob => {
                const formData = new FormData();
                formData.append("banner", blob, "banner.jpg");
                fetch("/api/upload_tracker_banner.php", {
                    method: "POST",
                    body: formData
                })
                .then(res => res.json())
                .then(res => {
                    if (res.status === "success") {
                        showToast("Banner updated", "success");
                        setSettings(prev => ({ ...prev, bannerUrl: res.url }));
                        setCropOpen(false);
                    }
                });
            }, 'image/jpeg', 0.9);
        } catch (e) {
            console.error(e);
            showToast("Crop failed", "error");
        }
    };

    const toggleDrawer = () => setDrawerOpen(!drawerOpen);

    if (initialLoading) return <AdminPreloader />;

    const metricCards = [
        { title: "TOTAL USERS", value: stats?.totalUsers || 0, icon: <PeopleIcon fontSize="medium" />, color: '#3b82f6', bg: '#f0f7ff' },
        { title: "TOTAL PROJECTS", value: stats?.totalProjects || 0, icon: <AssignmentIcon fontSize="medium" />, color: '#10b981', bg: '#ecfdf5' },
        { title: "NET PAYMENTS", value: stats?.totalPayments || 0, icon: <MoneyIcon fontSize="medium" />, color: '#f59e0b', bg: '#fffbeb' },
        { title: "ACTIVE SUBS", value: stats?.activeSubscribers || 0, icon: <TrendingUpIcon fontSize="medium" />, color: '#ef4444', bg: '#fef2f2' }
    ];

    return (
        <Box sx={{ display: 'flex', minHeight: "100vh", bgcolor: "#fffbf5" }}>
            <AdminSidebar open={drawerOpen} onClose={toggleDrawer} isDesktop={isDesktop} />
            
            <Box sx={{ flexGrow: 1, width: { md: `calc(100% - ${drawerOpen ? 260 : 80}px)` }, transition: 'width 0.3s' }}>
                <AppBar
                    position="sticky"
                    elevation={0}
                    sx={{
                        backgroundColor: "rgba(255, 255, 255, 0.8)",
                        backdropFilter: "blur(12px)",
                        color: '#431407',
                        borderBottom: '1px solid rgba(255, 237, 213, 0.5)',
                        zIndex: 1100
                    }}
                >
                    <Toolbar sx={{ justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton color="inherit" edge="start" onClick={toggleDrawer} sx={{ mr: 2, bgcolor: 'rgba(249, 115, 22, 0.05)', '&:hover': { bgcolor: 'rgba(249, 115, 22, 0.1)' } }}>
                                <MenuIcon />
                            </IconButton>
                            <Box>
                                <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ '& .MuiBreadcrumbs-separator': { color: '#fdba74' } }}>
                                    <Typography color="text.primary" sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#9a3412' }}>Dashboard</Typography>
                                </Breadcrumbs>
                            </Box>
                        </Box>

                        <Stack direction="row" spacing={2} alignItems="center">
                            <Tooltip title="Admin Profile">
                                <IconButton sx={{ border: '1px solid #ffedd5' }}>
                                    <AccountCircleIcon sx={{ color: '#f97316' }} />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </Toolbar>
                </AppBar>
                
                <Box sx={{ p: { xs: 2, md: 4 } }}>
                <Container maxWidth="xl">
                    <Grid container spacing={3} sx={{ mb: 5 }}>
                        {metricCards.map((card, index) => (
                            <Grid item xs={12} sm={6} md={3} key={index}>
                                <Paper sx={{ 
                                    p: 2.5, 
                                    borderRadius: 3, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 2,
                                    border: '1px solid #f1f5f9',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                                }}>
                                    <Avatar sx={{ bgcolor: card.bg, color: card.color, width: 48, height: 48, borderRadius: 2 }}>
                                        {card.icon}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>
                                            {card.title}
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b' }}>
                                            {card.value}
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>

                    <Paper sx={{ p: 4, borderRadius: 4, mb: 5, border: '1px solid #fce8d5', bgcolor: '#ffffff' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                            <SettingsIcon sx={{ color: '#f97316' }} />
                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#431407' }}>General Settings</Typography>
                        </Box>
                        
                        <Grid container spacing={4}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#431407' }}>WhatsApp Support Number</Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <TextField
                                        fullWidth
                                        placeholder="+91xxxxxxxxxx"
                                        size="small"
                                        value={settings.whatsapp}
                                        onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                                        sx={{ bgcolor: '#ffffff' }}
                                    />
                                    <Button 
                                        variant="contained" 
                                        startIcon={<SaveIcon />}
                                        onClick={() => handleUpdateSetting("whatsapp_number")}
                                        sx={{ bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' }, textTransform: 'none', px: 3, borderRadius: '8px' }}
                                    >
                                        Save
                                    </Button>
                                </Box>
                                <Typography variant="caption" sx={{ color: '#9a3412', mt: 1, display: 'block' }}>
                                    Used for "Build Your Map" redirection. Format: CountryCode+Number (e.g. 91xxxxxxxxxx)
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#431407' }}>Map Build Price (₹)</Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        size="small"
                                        value={settings.price}
                                        onChange={(e) => setSettings({ ...settings, price: e.target.value })}
                                        sx={{ bgcolor: '#ffffff' }}
                                    />
                                    <Button 
                                        variant="contained" 
                                        startIcon={<SaveIcon />}
                                        onClick={() => handleUpdateSetting("map_build_price")}
                                        sx={{ bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' }, textTransform: 'none', px: 3, borderRadius: '8px' }}
                                    >
                                        Save
                                    </Button>
                                </Box>
                                <Typography variant="caption" sx={{ color: '#9a3412', mt: 1, display: 'block' }}>
                                    Amount charged for professional map creation request.
                                </Typography>
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 4, borderStyle: 'dashed' }} />

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                            <Box>
                                <FormControlLabel
                                    control={
                                        <Switch 
                                            checked={settings.isTrackerEnabled} 
                                            onChange={(e) => {
                                                const val = e.target.checked;
                                                setSettings(prev => ({ ...prev, isTrackerEnabled: val }));
                                                fetch("/api/save_setting.php", {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ key: "is_tracker_enabled", value: val ? "true" : "false" }),
                                                }).then(() => showToast("Tracker status updated", "success"));
                                            }}
                                            sx={{ 
                                                '& .MuiSwitch-switchBase.Mui-checked': { color: '#f97316' },
                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#f97316' }
                                            }}
                                        />
                                    }
                                    label={<Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#431407' }}>Enable Progress Tracker (Global)</Typography>}
                                />
                                <Typography variant="caption" sx={{ color: '#9a3412', display: 'block', ml: 4 }}>
                                    When OFF, the tracker dialog and button will be hidden for all users.
                                </Typography>
                            </Box>
                        </Box>

                        <Box sx={{ mt: 4 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#431407' }}>Progress Tracker Banner</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                                {settings.bannerUrl && (
                                    <Box sx={{ width: 160, height: 40, borderRadius: 1, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                        <img 
                                            src={settings.bannerUrl.startsWith('http') ? settings.bannerUrl : (settings.bannerUrl.startsWith('/') ? settings.bannerUrl : `/${settings.bannerUrl}`)} 
                                            alt="Banner" 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        />
                                    </Box>
                                )}
                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<UploadIcon />}
                                    sx={{ color: '#f97316', borderColor: '#f97316', '&:hover': { borderColor: '#ea580c', bgcolor: '#fff7ed' }, textTransform: 'none', borderRadius: '8px' }}
                                >
                                    {settings.bannerUrl ? "Update Banner" : "Upload Banner"}
                                    <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                                </Button>
                                <FormControlLabel
                                    control={
                                        <Switch 
                                            checked={settings.isBannerEnabled} 
                                            onChange={(e) => {
                                                const val = e.target.checked;
                                                setSettings(prev => ({ ...prev, isBannerEnabled: val }));
                                                fetch("/api/save_setting.php", {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ key: "is_tracker_banner_enabled", value: val ? "true" : "false" }),
                                                }).then(() => showToast("Banner visibility updated", "success"));
                                            }}
                                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#f97316' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#f97316' } }}
                                        />
                                    }
                                    label={<Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#431407' }}>Show Banner</Typography>}
                                    sx={{ ml: 1 }}
                                />
                            </Box>
                        </Box>
                    </Paper>

                    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: '#1e293b' }}>Recent Users</Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>Latest registrations on the platform.</Typography>
                        </Box>
                        <Button 
                            variant="contained" 
                            component={Link} 
                            to="/admin/users"
                            endIcon={<ChevronRightIcon />}
                            sx={{ bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' }, textTransform: 'none', borderRadius: '8px', px: 3 }}
                        >
                            View All Users
                        </Button>
                    </Box>

                    <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ bgcolor: '#fff7ed' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, color: '#9a3412', py: 2 }}>ID</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#9a3412' }}>User</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#9a3412' }}>Email</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#9a3412' }}>Joined</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 800, color: '#9a3412' }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody sx={{ bgcolor: '#ffffff' }}>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                                <CircularProgress size={30} sx={{ color: '#f97316' }} />
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        recentUsers.map((user) => (
                                            <TableRow key={user.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                <TableCell sx={{ fontWeight: 700, color: '#431407' }}>#{user.id}</TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#fce8d5', color: '#f97316', fontSize: '0.8rem', fontWeight: 800 }}>
                                                            {user.firstname?.[0]?.toUpperCase() || 'U'}
                                                        </Avatar>
                                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>{user.firstname || 'Anonymous'}</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ color: '#475569', fontSize: '0.85rem' }}>{user.email}</TableCell>
                                                <TableCell sx={{ color: '#475569', fontSize: '0.85rem' }}>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell align="center">
                                                    <Chip 
                                                        label="Verified" 
                                                        size="small" 
                                                        sx={{ 
                                                            bgcolor: '#fff7ed', 
                                                            color: '#f97316',
                                                            fontWeight: 800,
                                                            fontSize: '0.75rem',
                                                            borderRadius: '6px'
                                                        }} 
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Container>
                </Box>
            </Box>

            {/* Cropper Dialog */}
            <Dialog open={cropOpen} onClose={() => setCropOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 800, color: '#431407' }}>
                    Adjust Tracker Banner
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ position: 'relative', height: 400, width: '100%', bgcolor: '#000', borderRadius: 2, overflow: 'hidden' }}>
                        <Cropper
                            image={image}
                            crop={crop}
                            zoom={zoom}
                            aspect={4 / 1}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                        />
                    </Box>
                    <Box sx={{ mt: 3, px: 2 }}>
                        <Typography variant="caption" sx={{ color: '#9a3412', mb: 1, display: 'block' }}>Zoom Control</Typography>
                        <Slider
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            onChange={(e, v) => setZoom(v)}
                            sx={{ color: '#f97316' }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 4 }}>
                    <Button onClick={() => setCropOpen(false)} sx={{ fontWeight: 700, color: '#64748b' }}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleCropSave}
                        sx={{ borderRadius: '10px', px: 4, fontWeight: 700, bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' } }}
                    >
                        Save & Apply
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminDashboard;
