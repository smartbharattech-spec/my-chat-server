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
    Checkbox,
    FormControlLabel,
    FormGroup,
    Chip,
    Stack,
    MenuItem,
    Select,
    FormControl,
    InputLabel
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import PersonIcon from "@mui/icons-material/Person";
import ShieldIcon from '@mui/icons-material/Shield';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../services/AuthService";
import { useToast } from "../services/ToastService";
import AdminSidebar from "../components/AdminSidebar";
import AdminPreloader from "../components/AdminPreloader";
import MenuIcon from "@mui/icons-material/Menu";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { AppBar, Toolbar, Breadcrumbs, Link as MuiLink, Tooltip } from "@mui/material";

const PERMISSIONS = [
    { id: 'stats', label: 'Dashboard Stats' },
    { id: 'users', label: 'User Management' },
    { id: 'projects', label: 'Vastu Projects' },
    { id: 'plans', label: 'Subscription Plans' },
    { id: 'payments', label: 'Payment Approvals' },
    { id: 'remedies', label: 'Basic Vastu (Remedies)' },
    { id: 'staff', label: 'Staff Management' },
    { id: 'followups', label: 'My Follow-ups' },
    { id: 'followup_requests', label: 'Follow-up Requests' }
];

export default function AdminStaff() {
    const { isAdminLoggedIn, adminUser } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(isDesktop);

    const isSuperAdmin = adminUser?.role === 'super_admin';

    // Table States
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");

    // Dialog States
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        username: '',
        email: '',
        password: '',
        role: 'staff',
        permissions: []
    });

    const [deleteId, setDeleteId] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    useEffect(() => {
        if (!isAdminLoggedIn) {
            navigate("/admin");
        } else if (!isSuperAdmin && !adminUser?.permissions?.includes('staff')) {
            showToast("Access restricted", "error");
            navigate("/admin/dashboard");
        } else {
            fetchStaff();
        }
    }, [isAdminLoggedIn, isSuperAdmin, navigate]);

    useEffect(() => {
        setDrawerOpen(isDesktop);
    }, [isDesktop]);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/get_admin_users.php");
            const data = await response.json();
            if (data.status === "success") {
                setStaff(data.data);
            }
        } catch (error) {
            showToast("Failed to fetch account data", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (member = null) => {
        if (member) {
            setEditMode(true);
            setFormData({
                id: member.id,
                username: member.username,
                email: member.email,
                password: '',
                role: member.role,
                permissions: member.permissions || []
            });
        } else {
            setEditMode(false);
            setFormData({
                id: '',
                username: '',
                email: '',
                password: '',
                role: 'staff',
                permissions: []
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handlePermissionChange = (permId) => {
        const newPermissions = formData.permissions.includes(permId)
            ? formData.permissions.filter(p => p !== permId)
            : [...formData.permissions, permId];
        setFormData({ ...formData, permissions: newPermissions });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("/api/manage_admin_user.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: editMode ? 'update' : 'create',
                    ...formData
                }),
            });
            const data = await response.json();
            if (data.status === "success") {
                showToast(data.message, "success");
                handleCloseDialog();
                fetchStaff();
            } else {
                showToast(data.message, "error");
            }
        } catch (error) {
            showToast("Operation failed", "error");
        }
    };

    const handleDeleteClick = (id) => {
        if (id === adminUser.id) {
            showToast("You cannot delete yourself", "warning");
            return;
        }
        setDeleteId(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await fetch("/api/manage_admin_user.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: 'delete', id: deleteId }),
            });
            const data = await response.json();
            if (data.status === "success") {
                showToast("Staff removed successfully", "success");
                fetchStaff();
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

    const filteredStaff = staff.filter((s) =>
        s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleDrawer = () => setDrawerOpen(!drawerOpen);
    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

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
                                    <Typography color="text.primary" sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#9a3412' }}>Staff</Typography>
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
                                Role & Permissions
                            </Typography>
                            <Typography variant="body1" sx={{ color: "#7c2d12", opacity: 0.8 }}>
                                Manage administrative access and role-based permissions.
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => handleOpenDialog()}
                                sx={{
                                    borderRadius: 3,
                                    textTransform: 'none',
                                    fontWeight: 800,
                                    bgcolor: '#f97316',
                                    '&:hover': { bgcolor: '#ea580c' }
                                }}
                            >
                                Add New Role
                            </Button>
                            <TextField
                                variant="outlined"
                                placeholder="Search roles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                sx={{
                                    width: { xs: '100%', md: 300 },
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

                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #ffedd5', overflowX: 'auto' }}>
                        <Table>
                            <TableHead sx={{ backgroundColor: "#fff7ed" }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>Admin Profile</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>Role</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>Permissions</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, color: "#9a3412" }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredStaff.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((member) => (
                                    <TableRow key={member.id} hover sx={{ '&:hover': { backgroundColor: "#fffaf5" } }}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar sx={{ bgcolor: member.role === 'super_admin' ? "#431407" : "#ffedd5", color: member.role === 'super_admin' ? '#fff' : '#f97316', fontWeight: 800 }}>
                                                    {member.username?.charAt(0).toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography sx={{ fontWeight: 700, color: "#431407" }}>{member.username}</Typography>
                                                    <Typography variant="caption" sx={{ color: "#7c2d12", opacity: 0.7 }}>{member.email}</Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={member.role === 'super_admin' ? 'Super Admin' : 'Staff'}
                                                size="small"
                                                sx={{
                                                    fontWeight: 800,
                                                    bgcolor: member.role === 'super_admin' ? 'rgba(67, 20, 7, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                                                    color: member.role === 'super_admin' ? '#431407' : '#f97316'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {member.role === 'super_admin' ? (
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#166534' }}>All Permissions Granted</Typography>
                                            ) : (
                                                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                                    {member.permissions?.length > 0 ? (
                                                        member.permissions.map(p => (
                                                            <Chip key={p} label={p} size="small" variant="outlined" sx={{ fontSize: '10px', height: '20px' }} />
                                                        ))
                                                    ) : (
                                                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>No permissions</Typography>
                                                    )}
                                                </Stack>
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <IconButton
                                                    onClick={() => handleOpenDialog(member)}
                                                    sx={{ color: '#f97316', bgcolor: 'rgba(249, 115, 22, 0.05)' }}
                                                >
                                                    <EditIcon size="small" />
                                                </IconButton>
                                                {member.id !== adminUser.id && (
                                                    <IconButton
                                                        onClick={() => handleDeleteClick(member.id)}
                                                        sx={{ color: '#f87171', bgcolor: 'rgba(248, 113, 113, 0.05)' }}
                                                    >
                                                        <DeleteIcon size="small" />
                                                    </IconButton>
                                                )}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <TablePagination
                            rowsPerPageOptions={[10, 25]}
                            component="div"
                            count={filteredStaff.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </TableContainer>
                </Container>
            </Box>

            {/* Create/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <form onSubmit={handleSubmit}>
                    <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>{editMode ? 'Update Account' : 'Add New Account'}</DialogTitle>
                    <DialogContent>
                        <Stack spacing={3} sx={{ mt: 1 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Username"
                                    fullWidth
                                    required
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                                <TextField
                                    label="Email"
                                    type="email"
                                    fullWidth
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </Box>
                            <TextField
                                label={editMode ? "New Password (leave blank to keep current)" : "Password"}
                                type="password"
                                fullWidth
                                required={!editMode}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />

                            <FormControl fullWidth>
                                <InputLabel>Account Role</InputLabel>
                                <Select
                                    value={formData.role}
                                    label="Account Role"
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <MenuItem value="staff">Staff Member</MenuItem>
                                    <MenuItem value="super_admin">Super Admin</MenuItem>
                                </Select>
                            </FormControl>

                            {formData.role !== 'super_admin' && (
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#9a3412', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ShieldIcon sx={{ fontSize: 18 }} /> Permitted Modules
                                    </Typography>
                                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: '#fffbf7' }}>
                                        <FormGroup sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                                            {PERMISSIONS.map((perm) => (
                                                <FormControlLabel
                                                    key={perm.id}
                                                    control={
                                                        <Checkbox
                                                            checked={formData.permissions.includes(perm.id)}
                                                            onChange={() => handlePermissionChange(perm.id)}
                                                            sx={{ color: '#fdba74', '&.Mui-checked': { color: '#f97316' } }}
                                                        />
                                                    }
                                                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>{perm.label}</Typography>}
                                                />
                                            ))}
                                        </FormGroup>
                                    </Paper>
                                </Box>
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={handleCloseDialog} sx={{ fontWeight: 700, color: '#ffffff', bgcolor: 'rgba(0,0,0,0.1)', "&:hover": { bgcolor: 'rgba(0,0,0,0.2)' } }}>Cancel</Button>
                        <Button
                            type="submit"
                            variant="contained"
                            sx={{ borderRadius: 3, fontWeight: 800, px: 4, bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' } }}
                        >
                            {editMode ? 'Save Changes' : 'Create Access'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 900, color: '#431407' }}>Remove Access?</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#7c2d12' }}>
                        Revoking access will prevent this user from logging into the portal. This action is irreversible.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#7c2d12', fontWeight: 700 }}>Keep User</Button>
                    <Button
                        onClick={confirmDelete}
                        variant="contained"
                        sx={{ backgroundColor: '#ef4444', fontWeight: 800, borderRadius: 3, '&:hover': { backgroundColor: '#b91c1c' } }}
                    >
                        Confirm Removal
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
