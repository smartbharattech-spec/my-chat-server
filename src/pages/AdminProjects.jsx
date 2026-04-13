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
    IconButton,
    InputAdornment,
    TextField,
    TablePagination,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    useMediaQuery,
    useTheme,
    Chip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    Input,
    AppBar,
    Toolbar,
    Stack,
    Breadcrumbs,
    Link,
    Tooltip,
} from "@mui/material";
import Divider from '@mui/material/Divider';
import { motion, AnimatePresence } from "framer-motion";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PaymentIcon from '@mui/icons-material/Payment';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import FolderIcon from "@mui/icons-material/Folder";
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import EditIcon from "@mui/icons-material/Edit";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import LaunchIcon from "@mui/icons-material/Launch";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../services/AuthService";
import { useToast } from "../services/ToastService";
import AdminSidebar from "../components/AdminSidebar";
import AdminPreloader from "../components/AdminPreloader";
import { debounce } from "lodash";

const ALL_CATEGORIES = [
    "Entrance", "Kitchen", "Toilet", "Mandir", "Master Bed", "Kids Bed",
    "W. Machine", "Locker", "Study Table", "Dining", "Office Desk",
    "Fam. Photo", "Trophies", "O.H. Tank", "U.G. Tank", "Septic Tank",
    "Dustbin", "Staircase Area", "Staircase Landing"
];

const ZONES_8 = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const ZONES_16 = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
];
const ZONES_32 = [
    "N5", "N6", "N7", "N8", "E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8",
    "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8",
    "N1", "N2", "N3", "N4"
];

export default function AdminProjects() {
    const { isAdminLoggedIn, adminUser } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(isDesktop);

    // Table States
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalProjects, setTotalProjects] = useState(0);

    // Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all"); // New state
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [vastuCategory, setVastuCategory] = useState("all");
    const [issueFilter, setIssueFilter] = useState("all"); // New state

    // Delete States
    const [deleteId, setDeleteId] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Edit States
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [editForm, setEditForm] = useState({
        id: "",
        project_name: "",
        email: "",
        construction_type: "",
        property_type: "",
        project_issue: "",
        plan_id: "",
        plan_name: ""
    });
    const [plans, setPlans] = useState([]);

    // Stats State
    const [stats, setStats] = useState({
        total_projects: 0,
        projects_with_vastu: 0,
        category_counts: {}
    });
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [zoneFilter, setZoneFilter] = useState("all");
    const [zoneDetailsOpen, setZoneDetailsOpen] = useState(false);

    // User Filter States
    const [users, setUsers] = useState([]);
    const [selectedUserEmail, setSelectedUserEmail] = useState("all");
    const [zoneType, setZoneType] = useState(16); // Missing state added
    const [allEntrances, setAllEntrances] = useState([]); // Missing state added

    useEffect(() => {
        if (!isAdminLoggedIn) {
            navigate("/admin");
        } else if (adminUser?.role !== 'super_admin' && !adminUser?.permissions?.includes('projects')) {
            showToast("Access Restricted to Project Management", "error");
            navigate("/admin/dashboard");
        } else {
            fetchProjects();
            fetchStats();
            fetchPlans();
            fetchUsers();
        }
    }, [isAdminLoggedIn, page, rowsPerPage, paymentStatus, typeFilter, issueFilter, startDate, endDate, vastuCategory, zoneFilter, zoneType, selectedUserEmail, adminUser]);

    // Use debounce for search query to avoid too many API calls
    const debouncedFetch = useCallback(
        debounce((query) => {
            fetchProjects(query);
        }, 500),
        [page, rowsPerPage, paymentStatus, typeFilter, startDate, endDate]
    );

    useEffect(() => {
        debouncedFetch(searchQuery);
        return () => debouncedFetch.cancel();
    }, [searchQuery, debouncedFetch]);


    useEffect(() => {
        setDrawerOpen(isDesktop);
    }, [isDesktop]);


    const fetchProjects = async (query = searchQuery) => {
        setLoading(true);
        try {
            // Build Query Params
            const params = new URLSearchParams({
                page: page + 1, // API uses 1-based index
                limit: rowsPerPage,
                search: query,
                status: paymentStatus,
                construction_type: typeFilter,
                start_date: startDate,
                end_date: endDate,
                vastu_category: vastuCategory,
                vastu_zone: zoneFilter,
                zone_type: zoneType,
                project_issue: issueFilter,
                user_email: selectedUserEmail
            });

            const response = await fetch(`/api/get_all_projects.php?${params.toString()}`);
            const data = await response.json();
            if (data.status === "success") {
                setProjects(data.data);
                setTotalProjects(data.total); // API should return total count
            } else {
                setProjects([]);
                setTotalProjects(0);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            showToast("Failed to fetch projects", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch("/api/get_project_stats.php");
            const data = await response.json();
            if (data.status === "success") {
                setStats(data);
                if (data.entrances_all) {
                    setAllEntrances(data.entrances_all);
                }
            }
        } catch (error) {
            console.error("Fetch stats error:", error);
        }
    };

    const fetchPlans = async () => {
        try {
            const response = await fetch("/api/plans.php");
            const data = await response.json();
            if (data.status === "success") {
                setPlans(data.data);
            }
        } catch (error) {
            console.error("Fetch plans error:", error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch("/api/get_all_users.php");
            const data = await response.json();
            if (data.status === "success") {
                setUsers(data.data);
            }
        } catch (error) {
            console.error("Fetch users error:", error);
        }
    };

    const toggleDrawer = () => setDrawerOpen(!drawerOpen);

    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const confirmDelete = async () => {
        try {
            const response = await fetch("/api/delete_record.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ type: "project", id: deleteId }),
            });
            const data = await response.json();
            if (data.status === "success") {
                showToast("Project deleted successfully", "success");
                fetchProjects(); // Refresh list
            } else {
                showToast(data.message, "error");
            }
        } catch (error) {
            showToast("Delete failed", "error");
        } finally {
            setDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    const handleOpenEdit = (project) => {
        setSelectedProject(project);
        setEditForm({
            id: project.id,
            project_name: project.project_name || "",
            email: project.email || "",
            construction_type: project.construction_type || "Existing",
            property_type: project.property_type || "Residential",
            project_issue: project.project_issue || "",
            plan_id: project.plan_id || "",
            plan_name: project.plan_name || ""
        });
        setEditDialogOpen(true);
    };

    const handleSaveEdit = async () => {
        try {
            const response = await fetch("/api/projects.php", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });
            const data = await response.json();
            if (data.status === "success") {
                showToast("Project updated successfully", "success");
                setEditDialogOpen(false);
                fetchProjects();
            } else {
                showToast(data.message, "error");
            }
        } catch (error) {
            showToast("Update failed", "error");
        }
    };

    // Helper to format date for input
    const handleDateChange = (setter) => (e) => {
        setter(e.target.value);
        setPage(0); // Reset to first page on filter change
    };

    const handleOpenTool = (p) => {
        // Store project and user context in localStorage for the tool to pick up
        localStorage.setItem("email", p.email);
        localStorage.setItem("active_project_id", p.id);
        localStorage.setItem("active_project_name", p.project_name);
        localStorage.setItem("active_project_issue", p.project_issue || "");
        localStorage.setItem("vastu_tool_active", "true");
        localStorage.setItem("isLoggedIn", "true"); // Fix: Ensure user dashboard allows access
        window.open("/", "_blank");
    };

    if (loading && projects.length === 0) return <AdminPreloader />;

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
                                    <Link underline="hover" color="inherit" href="/admin/dashboard" sx={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', fontWeight: 600 }}>
                                        Dashboard
                                    </Link>
                                    <Typography color="text.primary" sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#9a3412' }}>Projects</Typography>
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

                <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>

                    {/* Header Section */}
                    <Box sx={{ mb: 5, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 3 }}>
                        <Box>
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                                <Typography variant="h3" sx={{ fontWeight: 900, color: "#431407", letterSpacing: '-0.02em', mb: 1 }}>
                                    Project Repository
                                </Typography>
                                <Typography variant="body1" sx={{ color: "#7c2d12", opacity: 0.7, maxWidth: 600, fontWeight: 500, lineHeight: 1.6 }}>
                                    Centralized management for all user-generated Vastu analysis projects. Track usage, payments, and system-wide statistics.
                                </Typography>
                            </motion.div>
                        </Box>

                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                            <Paper elevation={0} sx={{
                                p: 2,
                                borderRadius: 5,
                                border: '1px solid #ffedd5',
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,247,237,0.7) 100%)',
                                backdropFilter: 'blur(10px)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: '#fff7ed', border: '1px solid #ffedd5' }}>
                                        <TrendingUpIcon sx={{ color: '#f97316' }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#9a3412', opacity: 0.6, textTransform: 'uppercase', display: 'block' }}>Scale</Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#431407' }}>{stats.total_projects} <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Active</span></Typography>
                                    </Box>
                                </Box>
                                <Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: '#f0fdf4', border: '1px solid #dcfce7' }}>
                                        <HomeWorkIcon sx={{ color: '#166534' }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#166534', opacity: 0.6, textTransform: 'uppercase', display: 'block' }}>Utilization</Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#064e3b' }}>{Math.round((stats.projects_with_vastu / (stats.total_projects || 1)) * 100)}%</Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        </motion.div>
                    </Box>


                    {/* Zone Details Dialog */}
                    <AnimatePresence>
                        {zoneDetailsOpen && (
                            <Dialog
                                open={zoneDetailsOpen}
                                onClose={() => setZoneDetailsOpen(false)}
                                maxWidth="xs"
                                fullWidth
                                TransitionComponent={motion.div}
                                PaperProps={{
                                    sx: { borderRadius: 6, p: 1, bgcolor: '#fffcf9' }
                                }}
                            >
                                <DialogTitle sx={{ fontWeight: 900, color: '#431407', textAlign: 'center', pb: 1 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                        <FilterAltIcon sx={{ color: '#f97316', fontSize: 32 }} />
                                        <Typography variant="h6" sx={{ fontWeight: 900 }}>Direction Analysis</Typography>
                                        <Chip
                                            label={`Zone: ${zoneFilter}`}
                                            sx={{
                                                fontWeight: 900,
                                                bgcolor: '#f97316',
                                                color: '#fff',
                                                px: 2
                                            }}
                                        />
                                    </Box>
                                </DialogTitle>
                                <DialogContent>
                                    <Box sx={{ mt: 2 }}>
                                        {(() => {
                                            const zoneItems = allEntrances.filter(ent => ent[`z${zoneType}`] === zoneFilter);
                                            const categorySummary = {};
                                            ALL_CATEGORIES.forEach(cat => categorySummary[cat] = 0);
                                            zoneItems.forEach(ent => {
                                                categorySummary[ent.category] = (categorySummary[ent.category] || 0) + 1;
                                            });

                                            return (
                                                <Stack spacing={1.5}>
                                                    {ALL_CATEGORIES
                                                        .filter(cat => categorySummary[cat] > 0 || cat === "Entrance" || cat === "Kitchen") // Always show important ones or used ones
                                                        .sort((a, b) => categorySummary[b] - categorySummary[a])
                                                        .map(cat => (
                                                            <Paper
                                                                key={cat}
                                                                elevation={0}
                                                                sx={{
                                                                    p: 2,
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    borderRadius: 4,
                                                                    border: '1px solid #ffedd5',
                                                                    bgcolor: categorySummary[cat] > 0 ? '#fff' : 'rgba(255,255,255,0.4)',
                                                                    opacity: categorySummary[cat] > 0 ? 1 : 0.6
                                                                }}
                                                            >
                                                                <Typography sx={{ fontWeight: 800, color: '#9a3412', fontSize: '0.9rem' }}>{cat}</Typography>
                                                                <Typography sx={{
                                                                    fontWeight: 900,
                                                                    color: categorySummary[cat] > 0 ? '#f97316' : '#cbd5e1',
                                                                    fontSize: '1.2rem'
                                                                }}>
                                                                    {categorySummary[cat]}
                                                                </Typography>
                                                            </Paper>
                                                        ))
                                                    }
                                                    {zoneItems.length === 0 && (
                                                        <Typography align="center" sx={{ py: 4, fontWeight: 700, color: '#94a3b8' }}>
                                                            No items found in this sector.
                                                        </Typography>
                                                    )}
                                                </Stack>
                                            );
                                        })()}
                                    </Box>
                                </DialogContent>
                                <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
                                    <Button
                                        onClick={() => setZoneDetailsOpen(false)}
                                        fullWidth
                                        variant="contained"
                                        sx={{
                                            fontWeight: 800,
                                            bgcolor: '#431407',
                                            borderRadius: 4,
                                            py: 1.5,
                                            '&:hover': { bgcolor: '#000' }
                                        }}
                                    >
                                        Close Summary
                                    </Button>
                                </DialogActions>
                            </Dialog>
                        )}
                    </AnimatePresence>

                    {/* Filters Section */}
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#9a3412', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FilterAltIcon sx={{ fontSize: 18 }} /> Search & Filters
                            </Typography>
                            <Chip
                                label={`Total Projects Found: ${totalProjects}`}
                                color="primary"
                                size="small"
                                sx={{
                                    fontWeight: 900,
                                    bgcolor: 'rgba(249, 115, 22, 0.1)',
                                    color: '#f97316',
                                    border: '1px solid #fdba74',
                                    borderRadius: 2
                                }}
                            />
                        </Box>
                        <Paper elevation={0} sx={{ p: 4, borderRadius: 5, border: '1px solid rgba(255, 237, 213, 0.4)', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)' }}>
                            <Grid container spacing={4}>
                                {/* Row 0: Full Width Search */}
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        placeholder="Search by project name, ID, or owner email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 5,
                                                bgcolor: '#fff',
                                                height: '56px',
                                                fontSize: '1.1rem',
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#f97316' },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: '2px' }
                                            }
                                        }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon sx={{ color: '#f97316', mr: 1 }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>

                                {/* Row 1: Dates, Payment, and Basic Filters */}
                                <Grid item xs={12}>
                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                                        <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, width: { xs: '100%', md: 'auto' } }}>
                                            <TextField
                                                label="From Date"
                                                type="date"
                                                fullWidth
                                                value={startDate}
                                                onChange={handleDateChange(setStartDate)}
                                                InputLabelProps={{ shrink: true }}
                                                InputProps={{ startAdornment: <CalendarTodayIcon sx={{ fontSize: 16, mr: 1, color: '#f97316' }} /> }}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4, bgcolor: '#fff' } }}
                                            />
                                            <TextField
                                                label="To Date"
                                                type="date"
                                                fullWidth
                                                value={endDate}
                                                onChange={handleDateChange(setEndDate)}
                                                InputLabelProps={{ shrink: true }}
                                                InputProps={{ startAdornment: <CalendarTodayIcon sx={{ fontSize: 16, mr: 1, color: '#f97316' }} /> }}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4, bgcolor: '#fff' } }}
                                            />
                                        </Box>

                                        <FormControl sx={{ minWidth: 200, width: { xs: '100%', md: 'auto' } }} size="medium">
                                            <InputLabel><PaymentIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} /> Payment</InputLabel>
                                            <Select
                                                value={paymentStatus}
                                                label="Payment Status"
                                                onChange={(e) => { setPaymentStatus(e.target.value); setPage(0); }}
                                                sx={{ borderRadius: 4, bgcolor: '#fff' }}
                                            >
                                                <MenuItem value="all">All Status</MenuItem>
                                                <MenuItem value="Paid">Paid</MenuItem>
                                                <MenuItem value="Unpaid">Unpaid</MenuItem>
                                            </Select>
                                        </FormControl>

                                        <FormControl sx={{ minWidth: 180, width: { xs: '100%', md: 'auto' } }} size="medium">
                                            <InputLabel><HomeWorkIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} /> Type</InputLabel>
                                            <Select
                                                value={typeFilter}
                                                label="Home Type"
                                                onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
                                                sx={{ borderRadius: 4, bgcolor: '#fff' }}
                                            >
                                                <MenuItem value="all">All Types</MenuItem>
                                                <MenuItem value="Existing">Existing</MenuItem>
                                                <MenuItem value="New">New Home</MenuItem>
                                            </Select>
                                        </FormControl>

                                        <FormControl sx={{ minWidth: 200, width: { xs: '100%', md: 'auto' } }} size="medium">
                                            <InputLabel><AccountCircleIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} /> Filter By User</InputLabel>
                                            <Select
                                                value={selectedUserEmail}
                                                label="Filter By User"
                                                onChange={(e) => { setSelectedUserEmail(e.target.value); setPage(0); }}
                                                sx={{ borderRadius: 4, bgcolor: '#fff' }}
                                            >
                                                <MenuItem value="all">All Users</MenuItem>
                                                {users.map((u) => (
                                                    <MenuItem key={u.id} value={u.email}>{u.firstname} ({u.email})</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <Button
                                            variant="outlined"
                                            onClick={() => {
                                                setSearchQuery("");
                                                setPaymentStatus("all");
                                                setTypeFilter("all");
                                                setSelectedUserEmail("all");
                                                setIssueFilter("all");
                                                setVastuCategory("all");
                                                setZoneFilter("all");
                                                setStartDate("");
                                                setEndDate("");
                                                setPage(0);
                                            }}
                                            sx={{
                                                px: 4,
                                                height: '50px',
                                                borderRadius: 4,
                                                fontWeight: 800,
                                                color: '#ffffff',
                                                borderColor: '#fdba74',
                                                bgcolor: '#9a3412',
                                                textTransform: 'none',
                                                '&:hover': { bgcolor: '#7c2d12', borderColor: '#7c2d12' }
                                            }}
                                        >
                                            Reset All
                                        </Button>
                                    </Stack>
                                </Grid>

                                {/* Row 2: Vastu/Zone Filters */}
                                <Grid item xs={12}>
                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                        <FormControl fullWidth size="medium">
                                            <InputLabel><FilterAltIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} /> Vastu Category</InputLabel>
                                            <Select
                                                value={vastuCategory}
                                                label="Vastu Category"
                                                onChange={(e) => { setVastuCategory(e.target.value); setPage(0); }}
                                                sx={{ borderRadius: 4, bgcolor: '#fff' }}
                                            >
                                                <MenuItem value="all">All Vastu Categories</MenuItem>
                                                {ALL_CATEGORIES.map(cat => (
                                                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <FormControl fullWidth size="medium">
                                            <InputLabel><FilterAltIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} /> Map System</InputLabel>
                                            <Select
                                                value={zoneType}
                                                label="Map System"
                                                onChange={(e) => { setZoneType(e.target.value); setZoneFilter("all"); setPage(0); }}
                                                sx={{ borderRadius: 4, bgcolor: '#fff' }}
                                            >
                                                <MenuItem value={8}>8 Zones Map</MenuItem>
                                                <MenuItem value={16}>16 Zones Map</MenuItem>
                                                <MenuItem value={32}>32 Zones Map</MenuItem>
                                            </Select>
                                        </FormControl>

                                        <FormControl fullWidth size="medium">
                                            <InputLabel><FilterAltIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} /> Specific Zone Filter</InputLabel>
                                            <Select
                                                value={zoneFilter}
                                                label="Specific Zone Filter"
                                                onChange={(e) => {
                                                    setZoneFilter(e.target.value);
                                                    setPage(0);
                                                    if (e.target.value !== "all") {
                                                        setSelectedCategory(null);
                                                    }
                                                }}
                                                sx={{ borderRadius: 4, bgcolor: '#fff' }}
                                            >
                                                <MenuItem value="all">All Directions</MenuItem>
                                                {(zoneType === 8 ? ZONES_8 : zoneType === 16 ? ZONES_16 : ZONES_32).map(z => (
                                                    <MenuItem key={z} value={z}>{z}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <FormControl fullWidth size="medium">
                                            <InputLabel><FilterAltIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} /> Project Objective</InputLabel>
                                            <Select
                                                value={issueFilter}
                                                label="Project Objective"
                                                onChange={(e) => { setIssueFilter(e.target.value); setPage(0); }}
                                                sx={{ borderRadius: 4, bgcolor: '#fff' }}
                                            >
                                                <MenuItem value="all">All Objectives</MenuItem>
                                                <MenuItem value="Health">Health</MenuItem>
                                                <MenuItem value="Wealth">Wealth</MenuItem>
                                                <MenuItem value="Relationship">Relationship</MenuItem>
                                                <MenuItem value="Custom">Custom Issue</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Box>

                    {/* Data Table */}
                    <Box sx={{ mb: 6 }}>
                        <TableContainer component={Paper} elevation={0} sx={{
                            borderRadius: 6,
                            border: '1px solid rgba(255, 237, 213, 0.4)',
                            overflowX: 'auto',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.03)',
                            background: '#fff'
                        }}>
                            <Table sx={{ minWidth: 900 }}>
                                <TableHead sx={{ bgcolor: '#fff7ed' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, color: "#9a3412", py: 2.5 }}>REFERENCE</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>PROJECT IDENTITY</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>DIMENSION</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>OBJECTIVE</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>USER INFO</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>PLAN TIER</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>STATUS</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, color: "#9a3412", pr: 4 }}>ACTIONS</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <AnimatePresence mode='popLayout'>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                                                    <AdminPreloader inline />
                                                </TableCell>
                                            </TableRow>
                                        ) : projects.length > 0 ? (
                                            projects.map((p, idx) => (
                                                <TableRow
                                                    component={motion.tr}
                                                    key={p.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                    sx={{
                                                        transition: 'background 0.2s',
                                                        '&:hover': { bgcolor: '#fffcf9' }
                                                    }}
                                                >
                                                    <TableCell>
                                                        <Typography sx={{ color: "#94a3b8", fontWeight: 700, fontSize: '0.8rem' }}>#PRJ-{String(p.id).padStart(4, '0')}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                            <Avatar variant="rounded" sx={{ bgcolor: "#fff7ed", color: '#f97316', width: 44, height: 44, border: '1px solid #ffedd5' }}>
                                                                <FolderIcon />
                                                            </Avatar>
                                                            <Box>
                                                                <Typography sx={{ fontWeight: 800, color: "#431407", display: 'block' }}>{p.project_name}</Typography>
                                                                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>Created {new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Typography>
                                                            </Box>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                            <Chip
                                                                label={p.property_type || "Residential"}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: (p.property_type === 'Commercial') ? "#431407" : "#fffbeb",
                                                                    color: (p.property_type === 'Commercial') ? "#fff" : "#b45309",
                                                                    fontWeight: 900,
                                                                    fontSize: '0.65rem',
                                                                    borderRadius: 1.5,
                                                                    border: '1px solid currentColor'
                                                                }}
                                                            />
                                                            <Chip
                                                                label={String(p.construction_type || "Existing").replace(' Home', '')}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: (p.construction_type?.includes('New')) ? "#e0f2fe" : "#f0fdf4",
                                                                    color: (p.construction_type?.includes('New')) ? "#0369a1" : "#166534",
                                                                    fontWeight: 900,
                                                                    fontSize: '0.65rem',
                                                                    borderRadius: 1.5,
                                                                    pt: 0.2
                                                                }}
                                                            />
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        {p.project_issue ? p.project_issue.split(',').map((issue, i) => (
                                                            <Chip
                                                                key={i}
                                                                label={issue.trim()}
                                                                size="small"
                                                                sx={{
                                                                    mr: 0.5,
                                                                    mb: 0.5,
                                                                    bgcolor: issue.trim() === 'Health' ? '#fef3c7' : issue.trim() === 'Wealth' ? '#dcfce7' : issue.trim() === 'Relationship' ? '#fce7f3' : '#f1f5f9',
                                                                    color: issue.trim() === 'Health' ? '#92400e' : issue.trim() === 'Wealth' ? '#166534' : issue.trim() === 'Relationship' ? '#9d174d' : '#475569',
                                                                    fontWeight: 800,
                                                                    fontSize: '0.65rem',
                                                                    borderRadius: 1.5,
                                                                    border: '1px solid currentColor',
                                                                    opacity: 0.9
                                                                }}
                                                            />
                                                        )) : (
                                                            <Chip label="General" size="small" sx={{ bgcolor: "#f1f5f9", color: "#475569", fontWeight: 800, fontSize: "0.65rem" }} />
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box>
                                                            <Typography sx={{ color: "#431407", fontWeight: 800, fontSize: '0.85rem', display: 'block' }}>{p.user_name || "N/A"}</Typography>
                                                            <Typography sx={{ color: "#475569", fontWeight: 600, fontSize: '0.75rem' }}>{p.email}</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={p.plan_name || "Free Tier"}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{
                                                                borderColor: "#fde68a",
                                                                color: "#92400e",
                                                                fontWeight: 800,
                                                                bgcolor: '#fffbf0',
                                                                fontSize: '0.65rem'
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={p.payment_status?.toUpperCase() || "PENDING"}
                                                            size="small"
                                                            sx={{
                                                                background: p.payment_status === 'Paid' ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                                                                color: p.payment_status === 'Paid' ? '#14532d' : '#7f1d1d',
                                                                fontWeight: 900,
                                                                fontSize: '0.6rem',
                                                                letterSpacing: 0.8,
                                                                px: 0.5,
                                                                height: 24
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ pr: 3 }}>
                                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                            <Tooltip title="Open Vastu Tool">
                                                                <IconButton
                                                                    onClick={() => handleOpenTool(p)}
                                                                    sx={{ color: '#16a34a', bgcolor: '#f0fdf4', '&:hover': { bgcolor: '#dcfce7' } }}
                                                                    size="small"
                                                                >
                                                                    <AutoFixHighIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Edit Project">
                                                                <IconButton
                                                                    onClick={() => handleOpenEdit(p)}
                                                                    sx={{ color: '#f97316', bgcolor: '#fff7ed', '&:hover': { bgcolor: '#ffedd5' } }}
                                                                    size="small"
                                                                >
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Delete Entry">
                                                                <IconButton
                                                                    onClick={() => { setDeleteId(p.id); setDeleteDialogOpen(true); }}
                                                                    sx={{ color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}
                                                                    size="small"
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center" sx={{ py: 12 }}>
                                                    <Box sx={{ opacity: 0.5 }}>
                                                        <FolderIcon sx={{ fontSize: 64, color: '#f97316', mb: 2 }} />
                                                        <Typography sx={{ color: '#431407', fontWeight: 700 }}>No project documentation found.</Typography>
                                                        <Typography variant="caption">Try adjusting your filters or search criteria.</Typography>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </AnimatePresence>
                                </TableBody>
                            </Table>
                            <TablePagination
                                rowsPerPageOptions={[10, 25, 50]}
                                component="div"
                                count={totalProjects}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                sx={{
                                    borderTop: '1px solid #ffedd5',
                                    bgcolor: '#fffbf7',
                                    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                                        fontWeight: 700,
                                        color: '#9a3412',
                                        fontSize: '0.8rem'
                                    }
                                }}
                            />
                        </TableContainer>
                    </Box>
                </Container>
            </Box>

            {/* Edit Project Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 900, color: '#431407' }}>Edit Project Details</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Project Name"
                            value={editForm.project_name}
                            onChange={(e) => setEditForm({ ...editForm, project_name: e.target.value })}
                            variant="outlined"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        />
                        <TextField
                            fullWidth
                            label="Owner Email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            variant="outlined"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        />
                        <FormControl fullWidth variant="outlined">
                            <InputLabel>Property Class</InputLabel>
                            <Select
                                value={editForm.property_type}
                                label="Property Class"
                                onChange={(e) => setEditForm({ ...editForm, property_type: e.target.value })}
                                sx={{ borderRadius: 3 }}
                            >
                                <MenuItem value="Residential">Residential</MenuItem>
                                <MenuItem value="Commercial">Commercial</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth variant="outlined">
                            <InputLabel>Work Type</InputLabel>
                            <Select
                                value={editForm.construction_type}
                                label="Work Type"
                                onChange={(e) => setEditForm({ ...editForm, construction_type: e.target.value })}
                                sx={{ borderRadius: 3 }}
                            >
                                <MenuItem value="Existing">Existing Property Work</MenuItem>
                                <MenuItem value="New">New Property Work</MenuItem>
                            </Select>
                        </FormControl>
                        {editForm.construction_type !== 'New' && (
                            <FormControl fullWidth variant="outlined">
                                <InputLabel>Objective</InputLabel>
                                <Select
                                    value={editForm.project_issue}
                                    label="Objective"
                                    onChange={(e) => setEditForm({ ...editForm, project_issue: e.target.value })}
                                    sx={{ borderRadius: 3 }}
                                >
                                    <MenuItem value="Health">Health</MenuItem>
                                    <MenuItem value="Wealth">Wealth</MenuItem>
                                    <MenuItem value="Relationship">Relationship</MenuItem>
                                    <MenuItem value="Custom">Custom Issue</MenuItem>
                                    <MenuItem value="">General</MenuItem>
                                </Select>
                            </FormControl>
                        )}
                        <FormControl fullWidth variant="outlined">
                            <InputLabel>Assigned Plan</InputLabel>
                            <Select
                                value={editForm.plan_id}
                                label="Assigned Plan"
                                onChange={(e) => {
                                    const selectedPlan = plans.find(p => p.id === e.target.value);
                                    setEditForm({
                                        ...editForm,
                                        plan_id: e.target.value,
                                        plan_name: selectedPlan ? selectedPlan.title : ""
                                    });
                                }}
                                sx={{ borderRadius: 3 }}
                            >
                                <MenuItem value="">None / Free</MenuItem>
                                {plans.map((p) => (
                                    <MenuItem key={p.id} value={p.id}>{p.title}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setEditDialogOpen(false)} sx={{ color: '#7c2d12', fontWeight: 700 }}>Cancel</Button>
                    <Button onClick={handleSaveEdit} variant="contained" sx={{ backgroundColor: '#f97316', fontWeight: 800, borderRadius: 3, '&:hover': { backgroundColor: '#ea580c' } }}>
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 900, color: '#431407' }}>Delete Project?</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#7c2d12' }}>
                        Are you sure you want to delete this project? This action is permanent.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#7c2d12', fontWeight: 700 }}>Cancel</Button>
                    <Button onClick={confirmDelete} variant="contained" sx={{ backgroundColor: '#ef4444', fontWeight: 800, borderRadius: 3, '&:hover': { backgroundColor: '#b91c1c' } }}>
                        Delete Project
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
