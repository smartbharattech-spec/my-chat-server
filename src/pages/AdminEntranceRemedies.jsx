import { useState, useEffect } from "react";
import {
    Box, Typography, Container, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Switch, FormControlLabel, useMediaQuery, useTheme, Chip, CircularProgress, MenuItem
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AddIcon from "@mui/icons-material/Add";
import AdminSidebar from "../components/AdminSidebar";
import AdminPreloader from "../components/AdminPreloader";
import { useAuth } from "../services/AuthService";
import { useToast } from "../services/ToastService";
import { useNavigate, useLocation } from "react-router-dom";

export default function AdminEntranceRemedies() {
    const { isAdminLoggedIn, adminUser } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    const queryParams = new URLSearchParams(location.search);
    const category = queryParams.get("category") || "Entrance";

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(isDesktop);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [tempIsPositive, setTempIsPositive] = useState(false);
    const [tempRemedy, setTempRemedy] = useState("");
    const [tempStatus, setTempStatus] = useState("active"); // New state
    const [searchQuery, setSearchQuery] = useState(""); // 🔍 Search state

    // New States for Add and Delete
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [newZone, setNewZone] = useState("");
    const [newIsPositive, setNewIsPositive] = useState(false);
    const [newRemedy, setNewRemedy] = useState("");

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    const [importing, setImporting] = useState(false);
    const [selectedRows, setSelectedRows] = useState([]);
    const [products, setProducts] = useState([]);
    const [tempProductId, setTempProductId] = useState("");
    const [newProductId, setNewProductId] = useState("");

    useEffect(() => {
        if (!isAdminLoggedIn) {
            navigate("/admin");
        } else if (adminUser?.role !== 'super_admin' && !adminUser?.permissions?.includes('remedies')) {
            showToast("Access Restricted to Remedies Management", "error");
            navigate("/admin/dashboard");
        } else {
            fetchRemedies(category);
            fetchProducts();
        }
    }, [isAdminLoggedIn, navigate, category, adminUser]);

    useEffect(() => {
        setDrawerOpen(isDesktop);
    }, [isDesktop]);

    const fetchRemedies = async (cat) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/entrance_remedies.php?category=${encodeURIComponent(cat)}&all_status=true`);
            const resData = await response.json();
            if (resData.status === "success") {
                setData(resData.data);
            } else {
                showToast(resData.message, "error");
            }
        } catch (error) {
            showToast("Failed to fetch remedies", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/marketplace/get_all_products.php');
            const resData = await response.json();
            if (resData.status === "success") {
                setProducts(resData.products);
            }
        } catch (error) {
            console.error("Failed to fetch products", error);
        }
    };

    const toggleDrawer = () => setDrawerOpen(!drawerOpen);

    const handleAddRemedy = async () => {
        if (!newZone) return showToast("Zone code is required", "error");

        try {
            const response = await fetch("/api/manage_remedies.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "add",
                    category: category,
                    zone_code: newZone,
                    is_positive: newIsPositive ? 1 : 0,
                    remedy: newRemedy,
                    product_ids: newProductId || null,
                    status: "active"
                })
            });
            const resData = await response.json();
            if (resData.status === "success") {
                showToast("Remedy added successfully", "success");
                setAddDialogOpen(false);
                setNewZone("");
                setNewRemedy("");
                setNewProductId("");
                setNewIsPositive(false);
                fetchRemedies(category);
            } else {
                showToast(resData.message, "error");
            }
        } catch (error) {
            showToast("Failed to add remedy", "error");
        }
    };

    const confirmDelete = async () => {
        try {
            const response = await fetch("/api/manage_remedies.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "delete", id: deleteId })
            });
            const resData = await response.json();
            if (resData.status === "success") {
                showToast("Remedy deleted", "success");
                setDeleteDialogOpen(false);
                setData(data.filter(item => item.id !== deleteId));
            } else {
                showToast(resData.message, "error");
            }
        } catch (error) {
            showToast("Delete failed", "error");
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("csv_file", file);
        formData.append("category", category);

        setImporting(true);
        try {
            const response = await fetch("/api/import_remedies.php", {
                method: "POST",
                body: formData
            });
            const resData = await response.json();
            if (resData.status === "success") {
                showToast(resData.message, "success");
                fetchRemedies(category);
            } else {
                showToast(resData.message, "error");
            }
        } catch (error) {
            showToast("Import failed", "error");
        } finally {
            setImporting(false);
            event.target.value = null; // Reset input
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setTempIsPositive(Number(item.is_positive) === 1);
        setTempRemedy(item.remedy || "");
        setTempProductId(item.product_ids || "");
        setTempStatus(item.status || "active");
        setEditDialogOpen(true);
    };

    const handleSaveRemedy = async () => {
        if (!editingItem) return;

        try {
            const payload = new URLSearchParams();
            payload.append("id", editingItem.id);
            payload.append("is_positive", tempIsPositive ? 1 : 0);
            payload.append("remedy", tempRemedy);
            payload.append("product_ids", tempProductId || "");
            payload.append("status", tempStatus);

            const response = await fetch("/api/entrance_remedies.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: payload
            });

            const resData = await response.json();
            if (resData.status === "success") {
                showToast("Remedy updated successfully", "success");
                // Update local state
                setData(data.map(item =>
                    item.id === editingItem.id
                        ? { ...item, is_positive: tempIsPositive ? 1 : 0, remedy: tempRemedy, product_ids: tempProductId || null, status: tempStatus }
                        : item
                ));
                setEditDialogOpen(false);
            } else {
                showToast(resData.message || "Update failed", "error");
            }
        } catch (error) {
            showToast("Error saving remedy", "error");
        }
    };

    if (loading) return <AdminPreloader />;

    return (
        <Box sx={{ display: 'flex', minHeight: "100vh", backgroundColor: "#fffbf7" }}>
            <AdminSidebar open={drawerOpen} onClose={toggleDrawer} isDesktop={isDesktop} />

            <Box sx={{ flexGrow: 1, width: { md: `calc(100% - ${drawerOpen ? 260 : 80}px)` }, transition: 'width 0.3s' }}>
                <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
                    <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: "#431407", mb: 0.5 }}>
                                {category} Remedies
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#7c2d12", opacity: 0.8, fontWeight: 500 }}>
                                Admin Panel / Remedies / {category}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <TextField
                                placeholder="Search nature or remedy..."
                                size="small"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                sx={{
                                    minWidth: 240,
                                    bgcolor: '#fff',
                                    borderRadius: 3,
                                    '& .MuiOutlinedInput-root': { borderRadius: 3, '& fieldset': { borderColor: '#fed7aa' } }
                                }}
                            />
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setAddDialogOpen(true)}
                                sx={{
                                    bgcolor: '#f97316',
                                    fontWeight: 700,
                                    borderRadius: 3,
                                    px: 3,
                                    '&:hover': { bgcolor: '#ea580c' }
                                }}
                            >
                                Add New
                            </Button>
                            <Button
                                component="label"
                                variant="outlined"
                                startIcon={importing ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                                disabled={importing}
                                sx={{
                                    color: '#f97316',
                                    borderColor: '#f97316',
                                    fontWeight: 700,
                                    borderRadius: 3,
                                    '&:hover': { bgcolor: '#fff7ed', borderColor: '#ea580c' }
                                }}
                            >
                                {importing ? "Importing..." : "Bulk Import"}
                                <input type="file" hidden accept=".csv" onChange={handleFileUpload} />
                            </Button>
                        </Box>
                    </Box>

                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #ffedd5', overflowX: 'auto' }}>
                        <Table stickyHeader>
                            <TableHead sx={{ backgroundColor: "#fff7ed" }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>Zone</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>Nature</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>Remedy Text</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>Added By</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>Visibility</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, color: "#9a3412" }}>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Array.isArray(data) && data
                                    .filter(row =>
                                        (row?.zone_code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        (row?.remedy || "").toLowerCase().includes(searchQuery.toLowerCase())
                                    )
                                    .map((row) => (
                                        <TableRow key={row.id} hover sx={{ '&:hover': { backgroundColor: "#fffaf5" } }}>
                                            <TableCell sx={{ fontWeight: 700, color: "#431407" }}>
                                                {row.zone_code}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={Number(row.is_positive) === 1 ? "Positive" : "Negative"}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: Number(row.is_positive) === 1 ? "#dcfce7" : "#fee2e2",
                                                        color: Number(row.is_positive) === 1 ? "#166534" : "#991b1b",
                                                        fontWeight: 700
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ color: "#7c2d12", maxWidth: 400 }}>
                                                <Typography noWrap variant="body2">{row.remedy}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={row.expert_name || "System"}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: row.expert_id ? "#fef3c7" : "#f1f5f9",
                                                        color: row.expert_id ? "#92400e" : "#475569",
                                                        fontWeight: 700,
                                                        border: row.expert_id ? "1px solid #fbbf24" : "1px solid #e2e8f0"
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={row.status === 'active' ? "Published" : "Draft"}
                                                    size="small"
                                                    variant={row.status === 'active' ? "filled" : "outlined"}
                                                    sx={{
                                                        fontWeight: 700,
                                                        bgcolor: row.status === 'active' ? "#f97316" : "transparent",
                                                        color: row.status === 'active' ? "#fff" : "#64748b",
                                                        borderColor: "#cbd5e1"
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton color="primary" onClick={() => handleEdit(row)}>
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton color="error" onClick={() => { setDeleteId(row.id); setDeleteDialogOpen(true); }}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                {data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#9a3412', fontWeight: 600 }}>
                                            No remedies found for {category}.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Container>
            </Box>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} PaperProps={{ sx: { borderRadius: 4, p: 1, minWidth: 400 } }}>
                <DialogTitle sx={{ fontWeight: 900, color: '#431407' }}>
                    Edit Zone: {editingItem?.zone_code}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={tempIsPositive}
                                    onChange={(e) => setTempIsPositive(e.target.checked)}
                                    color="success"
                                />
                            }
                            label={tempIsPositive ? "Positive Nature" : "Negative Nature"}
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={tempStatus === 'active'}
                                    onChange={(e) => setTempStatus(e.target.checked ? 'active' : 'draft')}
                                    color="primary"
                                />
                            }
                            label={
                                <Typography fontWeight={600} color={tempStatus === 'active' ? "primary.main" : "text.secondary"}>
                                    Status: {tempStatus === 'active' ? 'Published' : 'Draft (Hidden from Users)'}
                                </Typography>
                            }
                        />

                        <TextField
                            label="Remedy Description"
                            multiline
                            rows={4}
                            fullWidth
                            variant="outlined"
                            value={tempRemedy}
                            onChange={(e) => setTempRemedy(e.target.value)}
                            helperText="Describe the remedy or leave blank if positive."
                        />

                        <TextField
                            select
                            label="Link Marketplace Product"
                            fullWidth
                            value={tempProductId}
                            onChange={(e) => setTempProductId(e.target.value)}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                            helperText="Link a product from the store to show in reports."
                        >
                            <MenuItem value="">None / No Product</MenuItem>
                            {Array.isArray(products) && products.map((p) => (
                                <MenuItem key={p?.id} value={p?.id}>
                                    {p?.name} (₹{p?.price})
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setEditDialogOpen(false)} sx={{ color: '#7c2d12', fontWeight: 700 }}>Cancel</Button>
                    <Button
                        onClick={handleSaveRemedy}
                        variant="contained"
                        sx={{
                            backgroundColor: '#f97316',
                            color: '#ffffff',
                            fontWeight: 800,
                            borderRadius: 3,
                            '&:hover': { backgroundColor: '#ea580c' }
                        }}
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Dialog */}
            <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} PaperProps={{ sx: { borderRadius: 4, p: 1, minWidth: 400 } }}>
                <DialogTitle sx={{ fontWeight: 900, color: '#431407' }}>Add New {category} Remedy</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            label="Zone Code / Name"
                            fullWidth
                            variant="outlined"
                            value={newZone}
                            onChange={(e) => setNewZone(e.target.value)}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={newIsPositive}
                                    onChange={(e) => setNewIsPositive(e.target.checked)}
                                    color="success"
                                />
                            }
                            label={newIsPositive ? "Positive Nature" : "Negative Nature"}
                        />
                        <TextField
                            label="Remedy Description"
                            multiline
                            rows={4}
                            fullWidth
                            variant="outlined"
                            value={newRemedy}
                            onChange={(e) => setNewRemedy(e.target.value)}
                        />
                        <TextField
                            select
                            label="Link Marketplace Product"
                            fullWidth
                            value={newProductId}
                            onChange={(e) => setNewProductId(e.target.value)}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        >
                            <MenuItem value="">None / No Product</MenuItem>
                            {products.map((p) => (
                                <MenuItem key={p.id} value={p.id}>
                                    {p.name} (₹{p.price})
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setAddDialogOpen(false)} sx={{ color: '#7c2d12', fontWeight: 700 }}>Cancel</Button>
                    <Button onClick={handleAddRemedy} variant="contained" sx={{ bgcolor: '#f97316', fontWeight: 800, '&:hover': { bgcolor: '#ea580c' } }}>Add Remedy</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle sx={{ fontWeight: 900 }}>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete this remedy?</Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
