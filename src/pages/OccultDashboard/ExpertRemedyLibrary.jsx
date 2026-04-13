import React, { useState, useEffect } from "react";
import {
    Box, Typography, Container, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Switch, FormControlLabel, useMediaQuery, useTheme, Chip, CircularProgress,
    MenuItem
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import MarketplaceSidebar from "../../components/MarketplaceSidebar";
import BlockingOverlay from "../../components/BlockingOverlay";
import { useToast } from "../../services/ToastService";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function ExpertRemedyLibrary() {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [user, setUser] = useState(null);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState("Entrance");
    const [searchQuery, setSearchQuery] = useState("");

    // Dialog States
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [tempIsPositive, setTempIsPositive] = useState(false);
    const [tempRemedy, setTempRemedy] = useState("");
    const [tempStatus, setTempStatus] = useState("active");

    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [newZone, setNewZone] = useState("");
    const [newIsPositive, setNewIsPositive] = useState(false);
    const [newRemedy, setNewRemedy] = useState("");

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    const [products, setProducts] = useState([]);
    const [tempProductId, setTempProductId] = useState("");
    const [newProductId, setNewProductId] = useState("");

    useEffect(() => {
        const storedUser = localStorage.getItem('occult_user');
        if (!storedUser) {
            navigate('/occult/login');
        } else {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchRemedies(parsedUser.id, category);
            fetchProducts();
        }
    }, [navigate, category]);

    const fetchRemedies = async (expertId, cat) => {
        setLoading(true);
        try {
            // Fetch only this expert's remedies
            const response = await fetch(`/api/entrance_remedies.php?expert_id=${expertId}&category=${encodeURIComponent(cat)}&all_status=true`);
            const resData = await response.json();
            if (resData.status === "success") {
                // Filter to only show expert's own remedies (or we can handle it in PHP if we wanted strictly only expert's)
                // Actually the current API returns Expert + System. Let's filter for ONLY expert's own library here.
                const expertOwn = resData.data.filter(item => item.expert_id == expertId);
                setData(expertOwn);
            } else {
                showToast(resData.message, "error");
            }
        } catch (error) {
            showToast("Failed to fetch remedies", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async (expertId) => {
        try {
            const response = await fetch(`/api/marketplace/get_expert_products.php?expert_id=${expertId}`);
            const resData = await response.json();
            if (resData.status === "success") {
                setProducts(resData.products);
            }
        } catch (error) {
            console.error("Failed to fetch products", error);
        }
    };

    const handleAddRemedy = async () => {
        if (!newZone) return showToast("Zone code is required", "error");

        try {
            const response = await fetch("/api/entrance_remedies.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    expert_id: user.id,
                    category: category,
                    zone_code: newZone,
                    is_positive: newIsPositive ? 1 : 0,
                    remedy: newRemedy,
                    product_id: newProductId || null,
                    status: "active"
                })
            });
            const resData = await response.json();
            if (resData.status === "success") {
                showToast("Remedy added to your library", "success");
                setAddDialogOpen(false);
                setNewZone("");
                setNewRemedy("");
                setNewProductId("");
                setNewIsPositive(false);
                fetchRemedies(user.id, category);
            } else {
                showToast(resData.message, "error");
            }
        } catch (error) {
            showToast("Failed to add remedy", "error");
        }
    };

    const confirmDelete = async () => {
        try {
            // Use manage_remedies for deletion
            const response = await fetch("/api/manage_remedies.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "delete", id: deleteId })
            });
            const resData = await response.json();
            if (resData.status === "success") {
                showToast("Remedy removed from library", "success");
                setDeleteDialogOpen(false);
                setData(data.filter(item => item.id !== deleteId));
            } else {
                showToast(resData.message, "error");
            }
        } catch (error) {
            showToast("Delete failed", "error");
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setTempIsPositive(Number(item.is_positive) === 1);
        setTempRemedy(item.remedy || "");
        setTempProductId(item.product_id || "");
        setTempStatus(item.status || "active");
        setEditDialogOpen(true);
    };

    const handleSaveRemedy = async () => {
        if (!editingItem) return;

        try {
            const response = await fetch("/api/entrance_remedies.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editingItem.id,
                    is_positive: tempIsPositive ? 1 : 0,
                    remedy: tempRemedy,
                    product_id: tempProductId || "",
                    status: tempStatus
                })
            });

            const resData = await response.json();
            if (resData.status === "success") {
                showToast("Remedy updated", "success");
                setData(data.map(item =>
                    item.id === editingItem.id
                        ? { ...item, is_positive: tempIsPositive ? 1 : 0, remedy: tempRemedy, product_id: tempProductId || null, status: tempStatus }
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

    if (!user) return null;

    return (
        <Box sx={{ display: 'flex', minHeight: "100vh", backgroundColor: "#f8fafc" }}>
            <BlockingOverlay />
            <MarketplaceSidebar user={user} role="expert" />

            <Box sx={{ flexGrow: 1, p: { xs: 2, md: 4, lg: 6 }, pt: { xs: 10, md: 4, lg: 6 } }}>
                <Container maxWidth="xl">
                    <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
                        <Box>
                            <Typography variant="h3" sx={{ fontWeight: 950, color: "#0f172a", letterSpacing: '-0.02em', mb: 1 }}>
                                My Tool <span style={{ color: '#f59e0b' }}>Remedies</span>
                            </Typography>
                            <Typography sx={{ color: "#64748b", fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LibraryBooksIcon sx={{ fontSize: 20 }} /> Create and manage your private library of Vastu interventions.
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setAddDialogOpen(true)}
                            sx={{
                                bgcolor: '#0f172a',
                                color: 'white',
                                fontWeight: 800,
                                borderRadius: '16px',
                                px: 4,
                                py: 1.5,
                                textTransform: 'none',
                                fontSize: '1rem',
                                '&:hover': { bgcolor: '#1e293b' },
                                boxShadow: '0 10px 20px rgba(15, 23, 42, 0.15)'
                            }}
                        >
                            Add New Remedy
                        </Button>
                    </Box>

                    {/* Filter & Search Bar */}
                    <Paper sx={{ p: 3, borderRadius: '24px', mb: 4, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <Grid container spacing={3} alignItems="center">
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Category"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                >
                                    <MenuItem value="Entrance">Entrance</MenuItem>
                                    <MenuItem value="Kitchen">Kitchen</MenuItem>
                                    <MenuItem value="Toilet">Toilet</MenuItem>
                                    <MenuItem value="Bedroom">Bedroom</MenuItem>
                                    <MenuItem value="Other">Other</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={8}>
                                <TextField
                                    fullWidth
                                    placeholder="Search by zone or remedy text..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                />
                            </Grid>
                        </Grid>
                    </Paper>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                            <CircularProgress color="warning" />
                        </Box>
                    ) : (
                        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <Table>
                                <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Zone</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Nature</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Custom Remedy</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Status</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, color: '#475569' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data
                                        .filter(row => 
                                            row.zone_code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                            (row.remedy && row.remedy.toLowerCase().includes(searchQuery.toLowerCase()))
                                        )
                                        .map((row) => (
                                        <TableRow key={row.id} hover>
                                            <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>{row.zone_code}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={Number(row.is_positive) === 1 ? "Positive" : "Negative"} 
                                                    size="small"
                                                    sx={{ 
                                                        bgcolor: Number(row.is_positive) === 1 ? "#dcfce7" : "#fee2e2",
                                                        color: Number(row.is_positive) === 1 ? "#166534" : "#991b1b",
                                                        fontWeight: 800
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 400 }}>
                                                <Typography variant="body2" sx={{ color: '#475569', fontStyle: 'italic' }}>
                                                    "{row.remedy || 'No remedy text'}"
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={row.status === 'active' ? "Published" : "Draft"} 
                                                    size="small"
                                                    variant={row.status === 'active' ? "filled" : "outlined"}
                                                    sx={{ fontWeight: 800 }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton onClick={() => handleEdit(row)} sx={{ color: '#6366f1' }}><EditIcon /></IconButton>
                                                <IconButton onClick={() => { setDeleteId(row.id); setDeleteDialogOpen(true); }} sx={{ color: '#ef4444' }}><DeleteIcon /></IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {data.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                                <Typography sx={{ color: '#64748b', fontWeight: 600 }}>
                                                    Your library is empty for this category. Start adding custom remedies!
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Container>
            </Box>

            {/* Dialogs scaled for modern look */}
            <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} PaperProps={{ sx: { borderRadius: '24px', p: 2, maxWidth: 500, width: '100%' } }}>
                <DialogTitle sx={{ fontWeight: 900, fontSize: '1.5rem' }}>Add New Remedy</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField 
                            label="Zone Code (e.g. N1, NE, S3)" 
                            fullWidth 
                            value={newZone} 
                            onChange={(e) => setNewZone(e.target.value)}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />
                        <FormControlLabel
                            control={<Switch checked={newIsPositive} onChange={(e) => setNewIsPositive(e.target.checked)} color="success" />}
                            label={newIsPositive ? "Mark as Positive" : "Mark as Negative"}
                        />
                        <TextField 
                            label="Remedy Guidance" 
                            multiline 
                            rows={4} 
                            fullWidth 
                            value={newRemedy} 
                            onChange={(e) => setNewRemedy(e.target.value)}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />
                        <TextField
                            select
                            label="Link Marketplace Product"
                            fullWidth
                            value={newProductId}
                            onChange={(e) => setNewProductId(e.target.value)}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
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
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setAddDialogOpen(false)} sx={{ fontWeight: 800, color: '#64748b' }}>Cancel</Button>
                    <Button variant="contained" onClick={handleAddRemedy} sx={{ bgcolor: '#0f172a', fontWeight: 800, borderRadius: '12px', px: 3 }}>Add to Library</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} PaperProps={{ sx: { borderRadius: '24px', p: 2, maxWidth: 500, width: '100%' } }}>
                <DialogTitle sx={{ fontWeight: 900, fontSize: '1.5rem' }}>Edit Remedy: {editingItem?.zone_code}</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <FormControlLabel
                            control={<Switch checked={tempIsPositive} onChange={(e) => setTempIsPositive(e.target.checked)} color="success" />}
                            label={tempIsPositive ? "Positive" : "Negative"}
                        />
                        <FormControlLabel
                            control={<Switch checked={tempStatus === 'active'} onChange={(e) => setTempStatus(e.target.checked ? 'active' : 'draft')} color="primary" />}
                            label={tempStatus === 'active' ? "Published (Visible in Tool)" : "Draft (Private)"}
                        />
                        <TextField 
                            label="Remedy Guidance" 
                            multiline 
                            rows={4} 
                            fullWidth 
                            value={tempRemedy} 
                            onChange={(e) => setTempRemedy(e.target.value)}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />
                        <TextField
                            select
                            label="Link Marketplace Product"
                            fullWidth
                            value={tempProductId}
                            onChange={(e) => setTempProductId(e.target.value)}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                            helperText="Link a product from the store to show in reports."
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
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setEditDialogOpen(false)} sx={{ fontWeight: 800, color: '#64748b' }}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveRemedy} sx={{ bgcolor: '#0f172a', fontWeight: 800, borderRadius: '12px', px: 3 }}>Save Changes</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle sx={{ fontWeight: 900 }}>Remove Remedy?</DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: '#64748b', fontWeight: 600 }}>Are you sure you want to remove this remedy from your library? This won't affect past projects.</Typography>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={confirmDelete} sx={{ fontWeight: 800, borderRadius: '12px' }}>Remove</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
