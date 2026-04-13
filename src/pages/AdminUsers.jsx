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
    Checkbox,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Chip,
    Tooltip,
    TextField,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    useTheme,
    useMediaQuery,
    TablePagination,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";
import UpgradeIcon from '@mui/icons-material/Upgrade';
import { Tabs, Tab } from "@mui/material"; // Import Tabs
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../services/AuthService";
import { useToast } from "../services/ToastService";
import AdminSidebar from "../components/AdminSidebar";
import AdminPreloader from "../components/AdminPreloader";
import UserDevicesModal from "../components/UserDevicesModal";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import DevicesIcon from "@mui/icons-material/Devices";
import MenuIcon from "@mui/icons-material/Menu";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { AppBar, Toolbar, Breadcrumbs, Link as MuiLink } from "@mui/material";

export default function AdminUsers() {
    const { isAdminLoggedIn, adminUser } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(isDesktop);

    // Table States
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");
    const [selected, setSelected] = useState([]);
    const [currentTab, setCurrentTab] = useState(0); // 0: All, 1: Consultants, 2: Users

    // Delete States
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Plan Change States
    const [plans, setPlans] = useState([]);
    const [changePlanUser, setChangePlanUser] = useState(null);
    const [selectedPlanId, setSelectedPlanId] = useState("");
    const [planDialogOpen, setPlanDialogOpen] = useState(false);

    // Device Management States
    const [deviceModalOpen, setDeviceModalOpen] = useState(false);
    const [selectedDeviceUser, setSelectedDeviceUser] = useState(null);

    useEffect(() => {
        if (!isAdminLoggedIn) {
            navigate("/admin");
        } else if (adminUser?.role !== 'super_admin' && !adminUser?.permissions?.includes('users')) {
            showToast("Access Restricted to User Management", "error");
            navigate("/admin/dashboard");
        } else {
            fetchUsers();
            fetchPlans();
        }
    }, [isAdminLoggedIn, navigate, adminUser]);

    useEffect(() => {
        setDrawerOpen(isDesktop);
    }, [isDesktop]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/get_all_users.php");
            const data = await response.json();
            if (data.status === "success") {
                setUsers(data.data);
            }
        } catch (error) {
            showToast("Failed to fetch users", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchPlans = async () => {
        try {
            const res = await fetch("/api/plans.php");
            const data = await res.json();
            if (data.status === "success") {
                setPlans(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch plans");
        }
    };

    const handlePlanChangeClick = (user) => {
        setChangePlanUser(user);
        setSelectedPlanId(user.plan_id || "");
        setPlanDialogOpen(true);
    };

    const handleDeviceClick = (user) => {
        setSelectedDeviceUser(user);
        setDeviceModalOpen(true);
    };

    const submitPlanChange = async () => {
        // If selectedPlanId is empty, it means "None / Remove Plan"
        try {
            const response = await fetch("/api/admin_replace_user_plan.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: changePlanUser.id,
                    plan_id: selectedPlanId
                }),
            });
            const data = await response.json();
            if (data.status === "success") {
                showToast(data.message, "success");
                fetchUsers();
                setPlanDialogOpen(false);
            } else {
                showToast(data.message, "error");
            }
        } catch (error) {
            showToast("Failed to update plan", "error");
        }
    };

    const toggleDrawer = () => setDrawerOpen(!drawerOpen);

    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelecteds = filteredUsers.map((n) => n.id);
            setSelected(newSelecteds);
            return;
        }
        setSelected([]);
    };

    const handleClick = (event, id) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1),
            );
        }

        setSelected(newSelected);
    };

    const handleDeleteClick = (id) => {
        setDeleteId(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await fetch("/api/delete_record.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ type: "user", id: deleteId }),
            });
            const data = await response.json();
            if (data.status === "success") {
                showToast("User deleted successfully", "success");
                setUsers(users.filter(u => u.id !== deleteId));
                setSelected(selected.filter(id => id !== deleteId));
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

    const confirmBulkDelete = async () => {
        try {
            const response = await fetch("/api/delete_record.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ type: "user", id: selected.join(',') }),
            });
            const data = await response.json();
            if (data.status === "success") {
                showToast(`${selected.length} users deleted`, "success");
                setUsers(users.filter(u => !selected.includes(u.id)));
                setSelected([]);
            } else {
                showToast(data.message, "error");
            }
        } catch (error) {
            showToast("Bulk delete failed", "error");
        } finally {
            setBulkDeleteDialogOpen(false);
        }
    };

    const filteredUsers = users.filter((user) => {
        const matchesSearch = user.firstname.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (currentTab === 1) return user.is_consultant == 1; // Consultants
        if (currentTab === 2) return user.is_consultant == 0; // Regular Users

        return true; // All
    });

    const isSelected = (id) => selected.indexOf(id) !== -1;

    if (loading) return <AdminPreloader />;

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
                                    <Typography color="text.primary" sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#9a3412' }}>Users</Typography>
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

                <Container maxWidth="xl" sx={{ py: { xs: 4, md: 8 } }}>
                    <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, justifyContent: 'space-between', alignItems: { md: 'center' } }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: "#431407", mb: 1 }}>
                                User Management
                            </Typography>
                            <Typography variant="body1" sx={{ color: "#7c2d12", opacity: 0.8 }}>
                                Search and manage platform users.
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            {selected.length > 0 && (
                                <Button
                                    variant="contained"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={() => setBulkDeleteDialogOpen(true)}
                                    sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 800 }}
                                >
                                    Delete Selected ({selected.length})
                                </Button>
                            )}
                            <TextField
                                variant="outlined"
                                placeholder="Snapshot search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                sx={{
                                    width: { xs: '100%', md: 350 },
                                    backgroundColor: '#ffffff',
                                    '& .MuiOutlinedInput-root': { borderRadius: 4, border: '1px solid #ffedd5' }
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: '#f97316' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>
                    </Box>

                    <Paper elevation={0} sx={{ mb: 3, borderRadius: 3, bgcolor: 'transparent' }}>
                        <Tabs
                            value={currentTab}
                            onChange={(e, val) => { setCurrentTab(val); setPage(0); }}
                            sx={{
                                '& .MuiTab-root': { fontWeight: 700, borderRadius: 2, mx: 0.5, textTransform: 'none', fontSize: '0.95rem' },
                                '& .Mui-selected': { bgcolor: '#fff7ed', color: '#f97316' },
                                '& .MuiTabs-indicator': { backgroundColor: '#f97316', height: 3 }
                            }}
                        >
                            <Tab label={`All Users (${users.length})`} />
                            <Tab label={`Consultants (${users.filter(u => u.is_consultant == 1).length})`} />
                            <Tab label={`Regular Users (${users.filter(u => u.is_consultant == 0).length})`} />
                        </Tabs>
                    </Paper>

                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #ffedd5', overflowX: 'auto' }}>
                        <Table>
                            <TableHead sx={{ backgroundColor: "#fff7ed" }}>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            color="primary"
                                            indeterminate={selected.length > 0 && selected.length < filteredUsers.length}
                                            checked={filteredUsers.length > 0 && selected.length === filteredUsers.length}
                                            onChange={handleSelectAllClick}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>S.No</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>User Profile</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>Contact Details</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>Joined Date</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>Plan</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>Usage Info</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>Active Devices</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, color: "#9a3412" }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user, index) => {
                                    const isItemSelected = isSelected(user.id);
                                    return (
                                        <TableRow
                                            key={user.id}
                                            hover
                                            onClick={(event) => handleClick(event, user.id)}
                                            role="checkbox"
                                            aria-checked={isItemSelected}
                                            selected={isItemSelected}
                                            sx={{ cursor: 'pointer', '&:hover': { backgroundColor: "#fffaf5" } }}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox color="primary" checked={isItemSelected} />
                                            </TableCell>
                                            <TableCell sx={{ color: "#7c2d12", fontWeight: 700 }}>{page * rowsPerPage + index + 1}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar sx={{ bgcolor: "#ffedd5", color: '#f97316', fontWeight: 800 }}>
                                                        {user.firstname?.charAt(0).toUpperCase()}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography sx={{ fontWeight: 700, color: "#431407" }}>
                                                            {user.firstname}
                                                            {user.is_consultant == 1 && (
                                                                <Chip label="Consultant" size="small" color="warning" sx={{ ml: 1, height: 20, fontSize: '0.65rem', fontWeight: 800 }} />
                                                            )}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: "#7c2d12", opacity: 0.7 }}>{user.email}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                    <Typography variant="body2" sx={{ color: "#7c2d12", fontWeight: 600 }}>M: {user.mobile}</Typography>
                                                    <Typography variant="body2" sx={{ color: "#16a34a", fontWeight: 600 }}>W: {user.whatsapp}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ color: "#7c2d12" }}>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                    <Chip
                                                        label={user.plan || 'Free'}
                                                        size="small"
                                                        sx={{
                                                            fontWeight: 800,
                                                            bgcolor: user.plan_id ? 'rgba(249, 115, 22, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                                                            color: user.plan_id ? '#f97316' : '#64748b'
                                                        }}
                                                    />
                                                    {user.plan_expiry && (
                                                        <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 600 }}>
                                                            Exp: {new Date(user.plan_expiry).toLocaleDateString()}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: (user.project_usage >= user.plan_limit && user.plan_limit > 0) ? "#ef4444" : "#431407" }}>
                                                        {user.project_usage || 0} / {user.plan_limit || (user.plan_id ? "∞" : "0")}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: "#9a3412", opacity: 0.7 }}>
                                                        Projects Created
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Chip
                                                        icon={<SmartphoneIcon sx={{ fontSize: '14px !important' }} />}
                                                        label={user.device_count || 0}
                                                        size="small"
                                                        sx={{
                                                            fontWeight: 800,
                                                            bgcolor: user.device_count > 0 ? 'rgba(249, 115, 22, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                                                            color: user.device_count > 0 ? '#f97316' : '#64748b'
                                                        }}
                                                    />
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                    <Tooltip title="Change Plan / Assign Role">
                                                        <IconButton
                                                            onClick={(e) => { e.stopPropagation(); handlePlanChangeClick(user); }}
                                                            size="small"
                                                            sx={{ color: '#f97316', bgcolor: 'rgba(249, 115, 22, 0.05)' }}
                                                        >
                                                            <UpgradeIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {user.plan_id && (
                                                        <Tooltip title="Delete Current Plan">
                                                            <IconButton
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setChangePlanUser(user);
                                                                    setSelectedPlanId("");
                                                                    setPlanDialogOpen(true); // Open dialog to confirm removal
                                                                }}
                                                                size="small"
                                                                sx={{ color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.05)' }}
                                                            >
                                                                <DeleteIcon fontSize="small" sx={{ transform: 'scale(0.8)' }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    <IconButton
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(user.id); }}
                                                        size="small"
                                                        sx={{ color: '#f87171', bgcolor: 'rgba(248, 113, 113, 0.05)' }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                    <Tooltip title="View Active Devices">
                                                        <IconButton
                                                            onClick={(e) => { e.stopPropagation(); handleDeviceClick(user); }}
                                                            size="small"
                                                            sx={{
                                                                color: '#f97316',
                                                                bgcolor: 'rgba(249, 115, 22, 0.1)',
                                                                '&:hover': { bgcolor: 'rgba(249, 115, 22, 0.2)' }
                                                            }}
                                                        >
                                                            <SmartphoneIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {filteredUsers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                            <Typography sx={{ color: '#c2410c', fontWeight: 600 }}>No users found matching your search.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <TablePagination
                            rowsPerPageOptions={[10, 25, 50]}
                            component="div"
                            count={filteredUsers.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            sx={{ borderTop: '1px solid #ffedd5' }}
                        />
                    </TableContainer>
                </Container>
            </Box>

            {/* Single Delete Confirmation */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 900, color: '#431407' }}>Delete User?</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#7c2d12' }}>
                        This action cannot be undone. All data associated with this user will be permanently removed.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#ffffff', fontWeight: 700, bgcolor: 'rgba(0,0,0,0.1)', "&:hover": { bgcolor: 'rgba(0,0,0,0.2)' } }}>Cancel</Button>
                    <Button
                        onClick={confirmDelete}
                        variant="contained"
                        sx={{
                            backgroundColor: '#ef4444',
                            color: '#ffffff', // Explicitly white text
                            fontWeight: 800,
                            borderRadius: 3,
                            '&:hover': { backgroundColor: '#b91c1c' }
                        }}
                    >
                        Delete Permanently
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bulk Delete Confirmation */}
            <Dialog open={bulkDeleteDialogOpen} onClose={() => setBulkDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 900, color: '#431407' }}>Delete Selected Users?</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#7c2d12' }}>
                        You are about to delete {selected.length} users. This action is irreversible.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setBulkDeleteDialogOpen(false)} sx={{ color: '#ffffff', fontWeight: 700, bgcolor: 'rgba(0,0,0,0.1)', "&:hover": { bgcolor: 'rgba(0,0,0,0.2)' } }}>Cancel</Button>
                    <Button
                        onClick={confirmBulkDelete}
                        variant="contained"
                        sx={{
                            backgroundColor: '#ef4444',
                            color: '#ffffff', // Explicitly white text
                            fontWeight: 800,
                            borderRadius: 3,
                            '&:hover': { backgroundColor: '#b91c1c' }
                        }}
                    >
                        Delete {selected.length} Users
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Change Plan Dialog */}
            <Dialog open={planDialogOpen} onClose={() => setPlanDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 900, color: '#431407' }}>Override Plan</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" sx={{ mb: 2, color: '#7c2d12' }}>
                            Update plan for <b>{changePlanUser?.firstname}</b>. Subscription plans will automatically set an expiry based on validity days.
                        </Typography>
                        <FormControl fullWidth>
                            <InputLabel>Select New Plan</InputLabel>
                            <Select
                                value={selectedPlanId}
                                label="Select New Plan"
                                onChange={(e) => setSelectedPlanId(e.target.value)}
                            >
                                <MenuItem value=""><em>None / Free</em></MenuItem>
                                {plans.map(plan => (
                                    <MenuItem key={plan.id} value={plan.id}>
                                        {plan.title} ({plan.plan_type === 'subscription' ? 'Sub' : 'Single'}) - {plan.price}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setPlanDialogOpen(false)} sx={{ color: '#ffffff', fontWeight: 700, bgcolor: 'rgba(0,0,0,0.1)', "&:hover": { bgcolor: 'rgba(0,0,0,0.2)' } }}>Cancel</Button>
                    <Button
                        onClick={submitPlanChange}
                        variant="contained"
                        sx={{ bgcolor: '#f97316', fontWeight: 800, borderRadius: 3, '&:hover': { bgcolor: '#ea580c' } }}
                    >
                        Apply Plan
                    </Button>
                </DialogActions>
            </Dialog>

            <UserDevicesModal
                open={deviceModalOpen}
                onClose={() => setDeviceModalOpen(false)}
                user={selectedDeviceUser}
            />
        </Box>
    );
}
