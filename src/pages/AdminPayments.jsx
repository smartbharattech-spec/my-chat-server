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
    Checkbox,
    Tooltip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import FolderIcon from "@mui/icons-material/Folder";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Grid from "@mui/material/Grid";
import MenuIcon from "@mui/icons-material/Menu";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { AppBar, Toolbar, Breadcrumbs, Link as MuiLink, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../services/AuthService";
import { useToast } from "../services/ToastService";
import AdminSidebar from "../components/AdminSidebar";
import AdminPreloader from "../components/AdminPreloader";

export default function AdminPayments() {
    const { isAdminLoggedIn, adminUser } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(isDesktop);

    // Table States
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");
    const [selected, setSelected] = useState([]);

    // Dialog States
    const [deleteId, setDeleteId] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
    const [statusId, setStatusId] = useState(null);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState("Active");

    // Property Detail States
    const [propDetailsOpen, setPropDetailsOpen] = useState(false);
    const [selectedProp, setSelectedProp] = useState(null);
    const [propLoading, setPropLoading] = useState(false);

    useEffect(() => {
        if (!isAdminLoggedIn) {
            navigate("/admin");
        } else if (adminUser?.role !== 'super_admin' && !adminUser?.permissions?.includes('payments')) {
            showToast("Access Restricted to Payment Management", "error");
            navigate("/admin/dashboard");
        } else {
            fetchUnifiedData();
        }
    }, [isAdminLoggedIn, navigate, adminUser]);

    useEffect(() => {
        setDrawerOpen(isDesktop);
    }, [isDesktop]);

    const fetchUnifiedData = async () => {
        setLoading(true);
        try {
            // Already joined in backend get_all_payments.php
            const response = await fetch("/api/get_all_payments.php");
            const resData = await response.json();
            if (resData.status === "success") {
                setData(resData.data);
            }
        } catch (error) {
            showToast("Failed to fetch records", "error");
        } finally {
            setLoading(false);
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
            const newSelecteds = filteredData.map((n) => n.id);
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

    const handleStatusUpdate = async () => {
        try {
            const response = await fetch("/api/approve_payment.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ payment_id: statusId, status: selectedStatus }),
            });
            const resData = await response.json();
            if (resData.status === "success") {
                showToast(resData.message, "success");
                setData(data.map(p => p.id === statusId ? { ...p, status: selectedStatus } : p));
            } else {
                showToast(resData.message, "error");
            }
        } catch (error) {
            showToast("Update failed", "error");
        } finally {
            setStatusDialogOpen(false);
            setStatusId(null);
        }
    };

    const confirmDelete = async () => {
        try {
            const response = await fetch("/api/delete_record.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ type: "payment", id: deleteId }),
            });
            const resData = await response.json();
            if (resData.status === "success") {
                showToast("Record deleted", "success");
                setData(data.filter(p => p.id !== deleteId));
                setSelected(selected.filter(id => id !== deleteId));
            } else {
                showToast(resData.message, "error");
            }
        } catch (error) {
            showToast("Delete failed", "error");
        } finally {
            setDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    const handleViewProperty = async (email) => {
        setPropLoading(true);
        setPropDetailsOpen(true);
        try {
            const response = await fetch(`/api/get_user_details.php?email=${encodeURIComponent(email)}`);
            const resData = await response.json();
            if (resData.status === "success" && resData.data.length > 0) {
                setSelectedProp(resData.data[0]);
            } else {
                setSelectedProp(null);
                showToast("No property details found for this user", "info");
            }
        } catch (error) {
            showToast("Failed to fetch property details", "error");
        } finally {
            setPropLoading(false);
        }
    };

    const confirmBulkDelete = async () => {
        try {
            const response = await fetch("/api/delete_record.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ type: "payment", id: selected.join(',') }),
            });
            const resData = await response.json();
            if (resData.status === "success") {
                showToast(`${selected.length} records removed`, "success");
                setData(data.filter(p => !selected.includes(p.id)));
                setSelected([]);
            } else {
                showToast(resData.message, "error");
            }
        } catch (error) {
            showToast("Bulk delete failed", "error");
        } finally {
            setBulkDeleteDialogOpen(false);
        }
    };

    const filteredData = data.filter((p) =>
        p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.plan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.project_name && p.project_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

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
                                    <Typography color="text.primary" sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#9a3412' }}>Payments</Typography>
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
                                Project & Payment Hub
                            </Typography>
                            <Typography variant="body1" sx={{ color: "#7c2d12", opacity: 0.8 }}>
                                Unified view of वास्तु projects and their subscription status.
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
                                placeholder="Search email, project or plan..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                sx={{
                                    width: { xs: '100%', md: 400 },
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
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            color="primary"
                                            indeterminate={selected.length > 0 && selected.length < filteredData.length}
                                            checked={filteredData.length > 0 && selected.length === filteredData.length}
                                            onChange={handleSelectAllClick}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>S.No</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>Project Context</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>Email Address</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>Subscription Plan</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>Price</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>Status</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, color: "#9a3412" }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((p, index) => {
                                    const isItemSelected = isSelected(p.id);
                                    return (
                                        <TableRow
                                            key={p.id}
                                            hover
                                            onClick={(event) => handleClick(event, p.id)}
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
                                                    <Avatar sx={{ bgcolor: "#ffedd5", color: '#f97316' }}>
                                                        <FolderIcon fontSize="small" />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography sx={{ fontWeight: 700, color: "#431407" }}>
                                                            {p.project_name || "New Project"}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#c2410c', opacity: 0.7 }}>
                                                            {new Date(p.created_at).toLocaleDateString()}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ color: "#7c2d12" }}>{p.email}</TableCell>
                                            <TableCell>
                                                <Chip label={p.plan} size="small" variant="outlined" sx={{ fontWeight: 700, borderColor: '#ffedd5', color: '#9a3412' }} />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>
                                                ₹{p.price ? p.price.toString().replace(/[₹,]/g, '') : "0"}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={p.status}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: p.status === 'Active' ? '#dcfce7' :
                                                            p.status === 'Pending' ? '#fff7ed' :
                                                                p.status === 'Rejected' ? '#fee2e2' : '#f3f4f6',
                                                        color: p.status === 'Active' ? '#166534' :
                                                            p.status === 'Pending' ? '#9a3412' :
                                                                p.status === 'Rejected' ? '#991b1b' : '#374151',
                                                        fontWeight: 800
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                                    {p.status === 'Pending' && (
                                                        <Tooltip title="Update Status">
                                                            <IconButton
                                                                color="primary"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setStatusId(p.id);
                                                                    setSelectedStatus("Active");
                                                                    setStatusDialogOpen(true);
                                                                }}
                                                            >
                                                                <EditIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip title="View Property Details">
                                                        <IconButton
                                                            color="info"
                                                            onClick={(e) => { e.stopPropagation(); handleViewProperty(p.email); }}
                                                        >
                                                            <VisibilityIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <IconButton
                                                        color="error"
                                                        onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); setDeleteDialogOpen(true); }}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {filteredData.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                                            <Typography sx={{ color: '#c2410c', fontWeight: 600 }}>No project or payment records found.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <TablePagination
                            rowsPerPageOptions={[10, 25, 50]}
                            component="div"
                            count={filteredData.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            sx={{ borderTop: '1px solid #ffedd5' }}
                        />
                    </TableContainer>
                </Container>
            </Box>

            {/* Status Update Confirmation */}
            <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} PaperProps={{ sx: { borderRadius: 4, p: 1, minWidth: 320 } }}>
                <DialogTitle sx={{ fontWeight: 900, color: '#431407' }}>Update Payment Status</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#7c2d12', mb: 3 }}>
                        Select the new status for this payment record.
                    </DialogContentText>
                    <FormControl fullWidth sx={{ mt: 1 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={selectedStatus}
                            label="Status"
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            sx={{ borderRadius: 3 }}
                        >
                            <MenuItem value="Pending">Pending</MenuItem>
                            <MenuItem value="Active">Active</MenuItem>
                            <MenuItem value="Rejected">Rejected</MenuItem>
                            <MenuItem value="Cancelled">Cancelled</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setStatusDialogOpen(false)} sx={{ color: '#ffffff', fontWeight: 700, bgcolor: 'rgba(0,0,0,0.1)', "&:hover": { bgcolor: 'rgba(0,0,0,0.2)' } }}>Cancel</Button>
                    <Button
                        onClick={handleStatusUpdate}
                        variant="contained"
                        sx={{
                            backgroundColor: '#f97316',
                            color: '#ffffff',
                            fontWeight: 800,
                            borderRadius: 3,
                            '&:hover': { backgroundColor: '#ea580c' }
                        }}
                    >
                        Update Status
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Single Delete Confirmation */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 900, color: '#431407' }}>Delete Record?</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#7c2d12' }}>
                        This deletion is permanent. All payment and project history for this entry will be removed.
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
                <DialogTitle sx={{ fontWeight: 900, color: '#431407' }}>Bulk Delete Records?</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#7c2d12' }}>
                        You are about to delete {selected.length} records. This action cannot be undone.
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
                        Delete {selected.length} Records
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Property Details Modal */}
            <Dialog
                open={propDetailsOpen}
                onClose={() => setPropDetailsOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: "#9a3412" }}>
                    User Property Information
                </DialogTitle>
                <DialogContent dividers>
                    {propLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                            <CircularProgress sx={{ color: '#f97316' }} />
                        </Box>
                    ) : selectedProp ? (
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: "#9a3412", textTransform: "uppercase" }}>User Name</Typography>
                                <Typography sx={{ fontWeight: 700 }}>{selectedProp.name}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: "#9a3412", textTransform: "uppercase" }}>User Email</Typography>
                                <Typography sx={{ fontWeight: 700 }}>{selectedProp.email}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: "#9a3412", textTransform: "uppercase" }}>North Tilt</Typography>
                                <Typography sx={{ fontWeight: 700 }}>{selectedProp.north_tilt || "N/A"}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: "#9a3412", textTransform: "uppercase" }}>Facing</Typography>
                                <Typography sx={{ fontWeight: 700 }}>{selectedProp.facing || "N/A"}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: "#9a3412", textTransform: "uppercase" }}>Property Type</Typography>
                                <Typography sx={{ fontWeight: 700 }}>{selectedProp.house_type}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: "#9a3412", textTransform: "uppercase" }}>Time Living</Typography>
                                <Typography sx={{ fontWeight: 700 }}>{selectedProp.time_living || "N/A"}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: "#9a3412", textTransform: "uppercase" }}>Profession</Typography>
                                <Typography sx={{ fontWeight: 700 }}>{selectedProp.profession || "N/A"}</Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <Box sx={{ p: 2, bgcolor: "#fff7ed", borderRadius: 3, border: "1px solid #fed7aa" }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "#9a3412", mb: 2 }}>Compass Tally</Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={4}>
                                            <Typography variant="caption" sx={{ color: "#7c2d12", fontWeight: 700 }}>Main Gate</Typography>
                                            <Typography sx={{ fontWeight: 600 }}>{selectedProp.main_gate || "-"}</Typography>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Typography variant="caption" sx={{ color: "#7c2d12", fontWeight: 700 }}>Kitchen</Typography>
                                            <Typography sx={{ fontWeight: 600 }}>{selectedProp.kitchen || "-"}</Typography>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Typography variant="caption" sx={{ color: "#7c2d12", fontWeight: 700 }}>Mandir</Typography>
                                            <Typography sx={{ fontWeight: 600 }}>{selectedProp.mandir || "-"}</Typography>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Typography variant="caption" sx={{ color: "#7c2d12", fontWeight: 700 }}>Toilet</Typography>
                                            <Typography sx={{ fontWeight: 600 }}>{selectedProp.toilet || "-"}</Typography>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Typography variant="caption" sx={{ color: "#7c2d12", fontWeight: 700 }}>Septic Tank</Typography>
                                            <Typography sx={{ fontWeight: 600 }}>{selectedProp.septic_tank || "-"}</Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Grid>
                        </Grid>
                    ) : (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography sx={{ color: '#7c2d12' }}>No property details found for this user.</Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setPropDetailsOpen(false)} variant="contained" sx={{ borderRadius: 2, bgcolor: "#f97316", "&:hover": { bgcolor: "#ea580c" } }}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
