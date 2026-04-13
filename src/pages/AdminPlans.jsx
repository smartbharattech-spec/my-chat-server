import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar, // Added
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Stack,
    CircularProgress,
    Tooltip,
    Container,
    useMediaQuery,
    useTheme,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Switch,
    FormControlLabel,
    Grid,
    Checkbox,
    ToggleButton,
    ToggleButtonGroup
} from "@mui/material";
import Divider from '@mui/material/Divider';
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../services/AuthService";
import { useToast } from "../services/ToastService";
import AdminSidebar from "../components/AdminSidebar";
import DescriptionIcon from "@mui/icons-material/Description";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import HandymanIcon from "@mui/icons-material/Handyman";
import PaletteIcon from "@mui/icons-material/Palette";
import ImageIcon from "@mui/icons-material/Image";
import SettingsIcon from "@mui/icons-material/Settings";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import MenuIcon from "@mui/icons-material/Menu";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { AppBar, Toolbar, Breadcrumbs, Link as MuiLink } from "@mui/material";

const AdminPlans = () => {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    const [drawerOpen, setDrawerOpen] = useState(isDesktop);

    useEffect(() => {
        setDrawerOpen(isDesktop);
    }, [isDesktop]);

    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        price: "",
        credits: 0,
        features: "",
        color_start: "#f97316",
        color_end: "#fb923c",
        allowed_tools: [], // New field
        plan_type: "single", // New field
        validity_days: 0, // New field
        gst_percentage: 18,
        is_free: false, // New field: Free Plan toggle
        device_limit: 1, // New field
        followup_enabled: false // New field
    });
    const [selectedPlans, setSelectedPlans] = useState([]); // New State
    // Available tools constant
    const AVAILABLE_TOOLS = [
        { id: 1, name: "Center of Gravity (CG)" },
        { id: 2, name: "Shakti Chakra" },
        { id: 3, name: "Basic Vastu Analysis" },
        { id: 4, name: "Marma Marking" },
        { id: 5, name: "Zone Wise Area" },
        { id: 6, name: "Devtas" },
        { id: 7, name: "Devta Exclusion" }, // Added 7th point
        { id: 8, name: "Reports & Exports" } // Added 8th point
    ];

    const { isAdminLoggedIn, adminUser } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAdminLoggedIn) {
            navigate("/admin");
        } else if (adminUser?.role !== 'super_admin' && !adminUser?.permissions?.includes('plans')) {
            showToast("Access Restricted to Plans Management", "error");
            navigate("/admin/dashboard");
        } else {
            fetchPlans();
        }
    }, [isAdminLoggedIn, navigate, adminUser]);

    const fetchPlans = async () => {
        try {
            const res = await fetch("/api/plans.php");
            const data = await res.json();
            if (data.status === "success") {
                setPlans(data.data);
            } else {
                showToast(data.message, "error");
            }
        } catch (error) {
            showToast("Failed to fetch plans", "error");
        } finally {
            setLoading(false);
        }
    };

    const toggleDrawer = () => setDrawerOpen(!drawerOpen);

    const handleOpen = (plan = null) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData({
                title: plan.title,
                price: plan.price,
                credits: plan.credits,
                features: plan.features.join("\n"),
                color_start: plan.color_start,
                color_end: plan.color_end,
                allowed_tools: plan.allowed_tools || [], // Load allowed tools
                plan_type: plan.plan_type || "single",
                validity_days: plan.validity_days || 0,
                gst_percentage: plan.gst_percentage || 18,
                image_swap: parseInt(plan.image_swap) === 1,
                is_free: parseInt(plan.is_free) === 1,
                followup_enabled: parseInt(plan.followup_enabled) === 1,
                swap_image_url: plan.swap_image_url,
                device_limit: plan.device_limit || 1
            });
        } else {
            setEditingPlan(null);
            setFormData({
                title: "",
                price: "",
                credits: 0,
                features: "",
                color_start: "#f97316",
                color_end: "#fb923c",
                allowed_tools: [], // Reset
                plan_type: "single",
                validity_days: 0,
                gst_percentage: 18,
                image_swap: false,
                is_free: false,
                swap_image: null,
                device_limit: 1,
                followup_enabled: false
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    // Handle tool toggle
    const handleToolToggle = (toolId) => {
        setFormData(prev => {
            const current = prev.allowed_tools || [];
            if (current.includes(toolId)) {
                return { ...prev, allowed_tools: current.filter(id => id !== toolId) };
            } else {
                return { ...prev, allowed_tools: [...current, toolId] };
            }
        });
    };

    const handleSubmit = async () => {
        const formDataToSend = new FormData();
        if (editingPlan) formDataToSend.append("id", editingPlan.id);
        formDataToSend.append("title", formData.title);
        formDataToSend.append("price", formData.price);
        formDataToSend.append("credits", formData.credits);
        // Features always as stringified JSON because PHP expects it or handles it
        const customFeatures = formData.features.split("\n").filter(f => f.trim() !== "");
        formDataToSend.append("features", JSON.stringify(customFeatures));

        formDataToSend.append("color_start", formData.color_start);
        formDataToSend.append("color_end", formData.color_end);
        formDataToSend.append("allowed_tools", JSON.stringify(formData.allowed_tools || []));
        formDataToSend.append("plan_type", formData.plan_type);
        formDataToSend.append("validity_days", formData.validity_days);
        formDataToSend.append("gst_percentage", formData.gst_percentage);
        formDataToSend.append("image_swap", formData.image_swap ? 1 : 0);
        formDataToSend.append("is_free", formData.is_free ? 1 : 0);
        formDataToSend.append("followup_enabled", formData.followup_enabled ? 1 : 0);
        formDataToSend.append("device_limit", formData.device_limit);

        if (formData.swap_image) {
            formDataToSend.append("swap_image", formData.swap_image);
        }

        try {
            const res = await fetch("/api/plans.php", {
                method: "POST",
                // headers: { "Content-Type": "application/json" }, // Remove Content-Type for FormData
                body: formDataToSend // Send FormData
            });
            const data = await res.json();
            if (data.status === "success") {
                showToast(data.message, "success");
                fetchPlans();
                handleClose();
            } else {
                showToast(data.message, "error");
            }
        } catch (error) {
            showToast("Failed to save plan", "error");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this plan?")) return;

        try {
            const res = await fetch("/api/plans.php", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });
            const data = await res.json();
            if (data.status === "success") {
                showToast(data.message, "success");
                fetchPlans();
            } else {
                showToast(data.message, "error");
            }
        } catch (error) {
            showToast("Failed to delete plan", "error");
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedPlans(plans.map(p => p.id));
        } else {
            setSelectedPlans([]);
        }
    };

    const handleSelectOne = (id) => {
        setSelectedPlans(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (!selectedPlans.length) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedPlans.length} plans?`)) return;

        try {
            const res = await fetch("/api/plans.php", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: selectedPlans })
            });
            const data = await res.json();
            if (data.status === "success") {
                showToast(data.message, "success");
                setSelectedPlans([]);
                fetchPlans();
            } else {
                showToast(data.message, "error");
            }
        } catch (error) {
            showToast("Failed to delete plans", "error");
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: "100vh", backgroundColor: "#fffbf7" }}>
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
                                    <MuiLink underline="hover" color="inherit" href="/admin/dashboard" sx={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', fontWeight: 600 }}>
                                        Dashboard
                                    </MuiLink>
                                    <Typography color="text.primary" sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#9a3412' }}>Plans</Typography>
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

                <Container maxWidth="xl" sx={{ mt: { xs: 4, md: 6 }, mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: "#431407" }}>
                                Plans Management
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#7c2d12", opacity: 0.8 }}>
                                Create and manage subscription plans for your users
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={2}>
                            {selectedPlans.length > 0 && (
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={handleBulkDelete}
                                    sx={{
                                        borderRadius: 2,
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        borderColor: '#fee2e2',
                                        bgcolor: '#fff1f1',
                                        '&:hover': { bgcolor: '#fef2f2', borderColor: '#ef4444' }
                                    }}
                                >
                                    Delete ({selectedPlans.length})
                                </Button>
                            )}
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => handleOpen()}
                                sx={{
                                    bgcolor: "#f97316",
                                    color: "#fff", // White text
                                    borderRadius: 2,
                                    px: 3,
                                    boxShadow: "0 4px 12px rgba(249, 115, 22, 0.2)",
                                    "&:hover": { bgcolor: "#ea580c" },
                                    textTransform: 'none',
                                    fontWeight: 700
                                }}
                            >
                                Add New Plan
                            </Button>
                        </Stack>
                    </Box>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
                            <CircularProgress sx={{ color: '#f97316' }} />
                        </Box>
                    ) : (
                        <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: "1px solid #ffedd5", overflowX: 'auto' }}>
                            <Table>
                                <TableHead sx={{ bgcolor: "#fff7ed" }}>
                                    <TableRow>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                indeterminate={selectedPlans.length > 0 && selectedPlans.length < plans.length}
                                                checked={plans.length > 0 && selectedPlans.length === plans.length}
                                                onChange={handleSelectAll}
                                                sx={{ color: '#f97316', '&.Mui-checked': { color: '#f97316' } }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: "#9a3412" }}>Title</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: "#9a3412" }}>Price</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: "#9a3412" }}>Project Limit</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: "#9a3412" }}>Type</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: "#9a3412" }}>GST</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: "#9a3412" }}>Validity</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: "#9a3412" }}>Devices</TableCell> {/* New Header */}
                                        <TableCell sx={{ fontWeight: 700, color: "#9a3412" }}>Features</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: "#9a3412" }}>Allowed Tools</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: "#9a3412" }}>Image Swap</TableCell> {/* New Header */}
                                        <TableCell sx={{ fontWeight: 700, color: "#9a3412" }}>Followup</TableCell>

                                        <TableCell sx={{ fontWeight: 700, color: "#9a3412" }}>Is Free</TableCell> {/* New Header */}
                                        <TableCell sx={{ fontWeight: 700, color: "#9a3412" }}>Colors</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, color: "#9a3412" }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {plans.map((plan) => (
                                        <TableRow
                                            key={plan.id}
                                            selected={selectedPlans.includes(plan.id)}
                                            sx={{ '&:hover': { bgcolor: "#fffaf5" } }}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={selectedPlans.includes(plan.id)}
                                                    onChange={() => handleSelectOne(plan.id)}
                                                    sx={{ color: '#f97316', '&.Mui-checked': { color: '#f97316' } }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>{plan.title}</TableCell>
                                            <TableCell>{plan.price}</TableCell>
                                            <TableCell>{plan.credits}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={plan.plan_type === 'subscription' ? 'Subscription' : 'Single'}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: plan.plan_type === 'subscription' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                                                        color: plan.plan_type === 'subscription' ? '#3b82f6' : '#f97316',
                                                        fontWeight: 700
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>{plan.gst_percentage}%</TableCell>
                                            <TableCell>{plan.validity_days > 0 ? `${plan.validity_days} Days` : "Unlimited"}</TableCell>
                                            <TableCell align="center">
                                                <Chip label={plan.device_limit || 1} size="small" variant="outlined" />
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title={plan.features.join(", ")}>
                                                    <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {plan.features.length} features
                                                    </Typography>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: plan.allowed_tools && plan.allowed_tools.length > 0 ? 700 : 400 }}>
                                                    {plan.allowed_tools && plan.allowed_tools.length > 0
                                                        ? `${plan.allowed_tools.length} Tools`
                                                        : "No Tools Selected"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Chip
                                                        label={plan.image_swap == 1 ? "On" : "Off"}
                                                        color={plan.image_swap == 1 ? "success" : "default"}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                    {plan.image_swap == 1 && plan.swap_image_url && (
                                                        <Tooltip title="View Image">
                                                            <Avatar
                                                                src={`/${plan.swap_image_url}`}
                                                                variant="rounded"
                                                                sx={{ width: 40, height: 40, border: '1px solid #ddd' }}
                                                            />
                                                        </Tooltip>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={plan.followup_enabled == 1 ? "Enabled" : "Disabled"}
                                                    color={plan.followup_enabled == 1 ? "success" : "default"}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={plan.is_free == 1 ? "Free" : "Paid"}
                                                    color={plan.is_free == 1 ? "success" : "default"}
                                                    size="small"
                                                    variant="filled"
                                                    sx={{ fontWeight: 700 }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1}>
                                                    <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: plan.color_start, border: '1px solid #ddd' }} />
                                                    <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: plan.color_end, border: '1px solid #ddd' }} />
                                                </Stack>
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton onClick={() => handleOpen(plan)} color="primary" size="small">
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton onClick={() => handleDelete(plan.id)} color="error" size="small">
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Container>
            </Box>

            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 5,
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        overflow: 'hidden'
                    }
                }}
            >
                <DialogTitle sx={{
                    bgcolor: "#fff7ed",
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    borderBottom: '1px solid #ffedd5'
                }}>
                    <Box sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor: "#f97316",
                        display: 'flex',
                        color: '#fff'
                    }}>
                        <ShoppingBagIcon />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: "#431407" }}>
                        {editingPlan ? "Edit Plan Details" : "Create New Plan"}
                    </Typography>
                </DialogTitle>

                <DialogContent sx={{ p: 4, bgcolor: '#fff' }}>
                    <Stack spacing={4} sx={{ mt: 1 }}>

                        {/* Section 1: Basic Info */}
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <DescriptionIcon sx={{ color: '#f97316', fontSize: 20 }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#431407', textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Basic Information
                                </Typography>
                            </Box>
                            <Grid container spacing={3}>
                                <Grid size={12}>
                                    <TextField
                                        label="Plan Name"
                                        placeholder="e.g. Premium Business Plan"
                                        fullWidth
                                        variant="outlined"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <TextField
                                        label="Features List (One per line)"
                                        multiline
                                        rows={3}
                                        fullWidth
                                        placeholder="Enter features of this plan..."
                                        value={formData.features}
                                        onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        <Divider />

                        {/* Section 2: Pricing & Limits */}
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <AttachMoneyIcon sx={{ color: '#f97316', fontSize: 20 }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#431407', textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Pricing & Access Limits
                                </Typography>
                            </Box>
                            <Grid container spacing={3}>
                                <Grid size={12}>
                                    <Box sx={{ p: 2, borderRadius: 3, bgcolor: formData.is_free ? '#f0fdf4' : '#fff', border: formData.is_free ? '1px solid #dcfce7' : '1px dashed #e2e8f0' }}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={formData.is_free}
                                                    onChange={(e) => {
                                                        const isFree = e.target.checked;
                                                        setFormData({
                                                            ...formData,
                                                            is_free: isFree,
                                                            price: isFree ? "0" : formData.price,
                                                            gst_percentage: isFree ? 0 : formData.gst_percentage
                                                        });
                                                    }}
                                                    color="success"
                                                />
                                            }
                                            label={
                                                <Box sx={{ ml: 1 }}>
                                                    <Typography sx={{ fontWeight: 800, color: formData.is_free ? '#166534' : '#64748b', lineHeight: 1.2 }}>Mark as Free Plan</Typography>
                                                    <Typography variant="caption" sx={{ color: formData.is_free ? '#15803d' : '#94a3b8' }}>Users can activate this plan without payment</Typography>
                                                </Box>
                                            }
                                        />
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        label="Price (Display String)"
                                        placeholder={formData.is_free ? "Free" : "e.g. ₹499"}
                                        fullWidth
                                        value={formData.is_free ? "0" : formData.price}
                                        disabled={formData.is_free}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                borderRadius: 3,
                                                bgcolor: formData.is_free ? '#f1f5f9' : 'transparent'
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        label="Project Credit Limit"
                                        type="number"
                                        fullWidth
                                        value={formData.credits}
                                        onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                                        helperText="Total maps/projects allowed"
                                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <Box sx={{ p: 2, borderRadius: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#431407', mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                            Select Plan Type (Crucial for Quota Logic)
                                        </Typography>
                                        <ToggleButtonGroup
                                            value={formData.plan_type}
                                            exclusive
                                            onChange={(e, newType) => {
                                                if (newType !== null) {
                                                    setFormData({ ...formData, plan_type: newType });
                                                }
                                            }}
                                            fullWidth
                                            color="primary"
                                            sx={{
                                                bgcolor: '#fff',
                                                "& .MuiToggleButton-root": {
                                                    py: 1.5,
                                                    fontWeight: 700,
                                                    borderRadius: 2,
                                                    border: '1px solid #e2e8f0',
                                                    '&.Mui-selected': {
                                                        bgcolor: '#f97316',
                                                        color: '#fff',
                                                        '&:hover': { bgcolor: '#ea580c' }
                                                    }
                                                }
                                            }}
                                        >
                                            <ToggleButton value="single">
                                                Single Payment Plan
                                            </ToggleButton>
                                            <ToggleButton value="subscription">
                                                Recurring Subscription
                                            </ToggleButton>
                                        </ToggleButtonGroup>
                                        <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#64748b' }}>
                                            * <b>Subscription</b>: Projects count towards a monthly/yearly quota. <br />
                                            * <b>Single</b>: Project is tied to a specific payment and doesn't use subscription credits.
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <TextField
                                        label="Validity (Days)"
                                        type="number"
                                        fullWidth
                                        value={formData.validity_days}
                                        onChange={(e) => setFormData({ ...formData, validity_days: e.target.value })}
                                        helperText="0 for Unlimited"
                                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <TextField
                                        label="GST (Default 18%)"
                                        type="number"
                                        fullWidth
                                        value={formData.is_free ? 0 : formData.gst_percentage}
                                        disabled={formData.is_free}
                                        onChange={(e) => setFormData({ ...formData, gst_percentage: e.target.value })}
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                borderRadius: 3,
                                                bgcolor: formData.is_free ? '#f1f5f9' : 'transparent'
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Box sx={{ p: 2, borderRadius: 3, bgcolor: '#fdf2f2', border: '1px solid #fee2e2' }}>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <SmartphoneIcon sx={{ color: '#ef4444' }} />
                                            <Box sx={{ flexGrow: 1 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#991b1b' }}>Concurrent Device Limit</Typography>
                                                <Typography variant="caption" sx={{ color: '#b91c1c' }}>Max devices user can login with</Typography>
                                            </Box>
                                            <TextField
                                                type="number"
                                                size="small"
                                                sx={{ width: 80, "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: '#fff' } }}
                                                value={formData.device_limit}
                                                onChange={(e) => setFormData({ ...formData, device_limit: e.target.value })}
                                            />
                                        </Stack>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>

                        <Divider />

                        {/* Section 3: Tools & Style */}
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <HandymanIcon sx={{ color: '#f97316', fontSize: 20 }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#431407', textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Tool Access & Visuals
                                </Typography>
                            </Box>

                            <Grid container spacing={4}>
                                <Grid size={{ xs: 12, md: 7 }}>
                                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, border: '1.5px dashed #ffedd5' }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#9a3412', mb: 2, display: 'block' }}>
                                            SELECT ACTIVATED SIDEBAR TOOLS:
                                        </Typography>
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                            {AVAILABLE_TOOLS.map(tool => {
                                                const isSelected = (formData.allowed_tools || []).includes(tool.id);
                                                return (
                                                    <Chip
                                                        key={tool.id}
                                                        label={tool.name}
                                                        onClick={() => handleToolToggle(tool.id)}
                                                        variant={isSelected ? "filled" : "outlined"}
                                                        sx={{
                                                            borderRadius: 2,
                                                            fontWeight: 700,
                                                            transition: 'all 0.2s',
                                                            bgcolor: isSelected ? "#f97316" : "transparent",
                                                            color: isSelected ? "#fff" : "#7c2d12",
                                                            borderColor: isSelected ? "transparent" : "#ffedd5",
                                                            "&:hover": {
                                                                bgcolor: isSelected ? "#ea580c" : "#fff7ed",
                                                            }
                                                        }}
                                                    />
                                                );
                                            })}
                                        </Box>
                                    </Paper>
                                </Grid>

                                <Grid size={{ xs: 12, md: 5 }}>
                                    <Stack spacing={3}>
                                        <Box sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                                <PaletteIcon sx={{ color: '#64748b', fontSize: 18 }} />
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155' }}>CARD GRADIENT COLORS:</Typography>
                                            </Box>
                                            <Stack spacing={2}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <input
                                                        type="color"
                                                        value={formData.color_start}
                                                        onChange={(e) => setFormData({ ...formData, color_start: e.target.value })}
                                                        style={{ width: 44, height: 44, border: 'none', borderRadius: 8, cursor: 'pointer' }}
                                                    />
                                                    <Typography variant="caption" sx={{ fontWeight: 700 }}>Starting Secondary</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <input
                                                        type="color"
                                                        value={formData.color_end}
                                                        onChange={(e) => setFormData({ ...formData, color_end: e.target.value })}
                                                        style={{ width: 44, height: 44, border: 'none', borderRadius: 8, cursor: 'pointer' }}
                                                    />
                                                    <Typography variant="caption" sx={{ fontWeight: 700 }}>Ending Primary</Typography>
                                                </Box>
                                            </Stack>
                                        </Box>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Box>

                        <Divider />

                        {/* Section 4: Advanced Features */}
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <SettingsIcon sx={{ color: '#f97316', fontSize: 20 }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#431407', textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Advanced Options
                                </Typography>
                            </Box>



                            <Box sx={{ p: 3, borderRadius: 4, bgcolor: '#f0f9ff', border: '1px solid #e0f2fe', mb: 3 }}>
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems={{ md: 'center' }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.image_swap}
                                                onChange={(e) => setFormData({ ...formData, image_swap: e.target.checked })}
                                                color="info"
                                            />
                                        }
                                        label={
                                            <Box sx={{ ml: 1 }}>
                                                <Typography sx={{ fontWeight: 800, color: '#0369a1', lineHeight: 1.2 }}>Enable Auto-Image Swap</Typography>
                                                <Typography variant="caption" sx={{ color: '#0ea5e9' }}>Override project map with plan image</Typography>
                                            </Box>
                                        }
                                    />

                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.followup_enabled}
                                                onChange={(e) => setFormData({ ...formData, followup_enabled: e.target.checked })}
                                                color="secondary"
                                            />
                                        }
                                        label={
                                            <Box sx={{ ml: 1 }}>
                                                <Typography sx={{ fontWeight: 800, color: '#701a75', lineHeight: 1.2 }}>Follow-up Feature</Typography>
                                                <Typography variant="caption" sx={{ color: '#a21caf' }}>Allow users of this plan to use follow-ups</Typography>
                                            </Box>
                                        }
                                    />

                                    {formData.image_swap && (
                                        <Box sx={{ flexGrow: 1, p: 2, bgcolor: '#fff', borderRadius: 3, border: '1px solid #bae6fd' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Box sx={{ position: 'relative' }}>
                                                    {(formData.swap_image || formData.swap_image_url) ? (
                                                        <Avatar
                                                            src={formData.swap_image ? URL.createObjectURL(formData.swap_image) : `/${formData.swap_image_url}`}
                                                            variant="rounded"
                                                            sx={{ width: 60, height: 60, border: '2px solid #0ea5e9' }}
                                                        />
                                                    ) : (
                                                        <Box sx={{ width: 60, height: 60, borderRadius: 2, bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <ImageIcon sx={{ color: '#94a3b8' }} />
                                                        </Box>
                                                    )}
                                                </Box>
                                                <Box>
                                                    <Button
                                                        variant="outlined"
                                                        component="label"
                                                        size="small"
                                                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                                                    >
                                                        Upload New Image
                                                        <input type="file" hidden accept="image/*" onChange={(e) => setFormData({ ...formData, swap_image: e.target.files[0] })} />
                                                    </Button>
                                                    <Typography variant="caption" display="block" sx={{ mt: 0.5, color: '#64748b' }}>Best size: 1024x1024px</Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    )}
                                </Stack>
                            </Box>
                        </Box>

                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 4, pt: 2, bgcolor: '#fcfcfc', borderTop: '1px solid #f1f5f9' }}>
                    <Button
                        onClick={handleClose}
                        sx={{
                            color: "#64748b",
                            fontWeight: 700,
                            px: 3,
                            "&:hover": { bgcolor: '#f1f5f9' }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        sx={{
                            bgcolor: "#f97316",
                            color: "#fff",
                            borderRadius: 3,
                            px: 5,
                            py: 1.2,
                            fontWeight: 900,
                            textTransform: 'none',
                            fontSize: '1rem',
                            boxShadow: "0 10px 15px -3px rgba(249, 115, 22, 0.3)",
                            "&:hover": {
                                bgcolor: "#ea580c",
                                transform: 'translateY(-1px)'
                            }
                        }}
                    >
                        {editingPlan ? "Save Plan Changes" : "Confirm & Create Plan"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminPlans;
