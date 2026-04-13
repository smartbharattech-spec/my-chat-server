import { useState, useEffect } from "react";
import {
    Box, Typography, Container, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Switch, FormControlLabel, useMediaQuery, useTheme, Chip, CircularProgress
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AdminSidebar from "../components/AdminSidebar";
import AdminPreloader from "../components/AdminPreloader";
import MenuIcon from "@mui/icons-material/Menu";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { AppBar, Toolbar, Breadcrumbs, Link as MuiLink, Stack, Tooltip } from "@mui/material";
import { useAuth } from "../services/AuthService";
import { useToast } from "../services/ToastService";
import { useNavigate } from "react-router-dom";

export default function AdminDevtas() {
    const { isAdminLoggedIn, adminUser } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(isDesktop);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [tempHawan, setTempHawan] = useState("");
    const [tempBhog, setTempBhog] = useState("");
    const [tempAttributes, setTempAttributes] = useState("");
    const [tempStatus, setTempStatus] = useState("active");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (!isAdminLoggedIn) {
            navigate("/admin");
        } else if (adminUser?.role !== 'super_admin' && !adminUser?.permissions?.includes('devtas')) {
            showToast("Access Restricted to Devta Management", "error");
            navigate("/admin/dashboard");
        } else {
            fetchDevtas();
        }
    }, [isAdminLoggedIn, navigate, adminUser]);

    useEffect(() => {
        setDrawerOpen(isDesktop);
    }, [isDesktop]);

    const fetchDevtas = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/devta_details.php?all_status=true`);
            const resData = await response.json();
            if (resData.status === "success") {
                setData(resData.data);
            } else {
                showToast(resData.message, "error");
            }
        } catch (error) {
            showToast("Failed to fetch devta details", "error");
        } finally {
            setLoading(false);
        }
    };

    const toggleDrawer = () => setDrawerOpen(!drawerOpen);

    const handleEdit = (item) => {
        setEditingItem(item);
        setTempHawan(item.hawan || "");
        setTempBhog(item.bhog || "");
        setTempAttributes(item.attributes || "");
        setTempStatus(item.status || "active");
        setEditDialogOpen(true);
    };

    const handleSave = async () => {
        if (!editingItem) return;

        try {
            const response = await fetch("/api/manage_devta_details.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "update",
                    id: editingItem.id,
                    hawan: tempHawan,
                    bhog: tempBhog,
                    attributes: tempAttributes,
                    status: tempStatus
                })
            });

            const resData = await response.json();
            if (resData.status === "success") {
                showToast("Devta details updated successfully", "success");
                setData(data.map(item =>
                    item.id === editingItem.id
                        ? { ...item, hawan: tempHawan, bhog: tempBhog, attributes: tempAttributes, status: tempStatus }
                        : item
                ));
                setEditDialogOpen(false);
            } else {
                showToast(resData.message || "Update failed", "error");
            }
        } catch (error) {
            showToast("Error saving details", "error");
        }
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
                                    <Typography color="text.primary" sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#9a3412' }}>Devtas</Typography>
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

                <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
                    <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: "#431407", mb: 0.5 }}>
                                Devta Mandala Management
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#7c2d12", opacity: 0.8, fontWeight: 500 }}>
                                Admin Panel / Devta Details
                            </Typography>
                        </Box>

                        <TextField
                            placeholder="Search Devta..."
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
                    </Box>

                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #ffedd5', overflowX: 'auto' }}>
                        <Table stickyHeader>
                            <TableHead sx={{ backgroundColor: "#fff7ed" }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>Devta Name</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>Hawan</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>Bhog</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>Attributes</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>Status</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, color: "#9a3412" }}>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data
                                    .filter(row => row.devta_name.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map((row) => (
                                        <TableRow key={row.id} hover sx={{ '&:hover': { backgroundColor: "#fffaf5" } }}>
                                            <TableCell sx={{ fontWeight: 700, color: "#431407" }}>
                                                {row.devta_name}
                                            </TableCell>
                                            <TableCell sx={{ color: "#7c2d12", maxWidth: 200 }}>
                                                <Typography noWrap variant="body2">{row.hawan}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ color: "#7c2d12", maxWidth: 200 }}>
                                                <Typography noWrap variant="body2">{row.bhog}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ color: "#7c2d12", maxWidth: 200 }}>
                                                <Typography noWrap variant="body2">{row.attributes}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={row.status === 'active' ? "Published" : "Draft"}
                                                    size="small"
                                                    sx={{
                                                        fontWeight: 700,
                                                        bgcolor: row.status === 'active' ? "#dcfce7" : "#fee2e2",
                                                        color: row.status === 'active' ? "#166534" : "#991b1b"
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton color="primary" onClick={() => handleEdit(row)}>
                                                    <EditIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Container>
            </Box>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} PaperProps={{ sx: { borderRadius: 4, p: 1, minWidth: 500 } }}>
                <DialogTitle sx={{ fontWeight: 900, color: '#431407' }}>
                    Edit Devta: {editingItem?.devta_name}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            label="Hawan Details"
                            multiline
                            rows={2}
                            fullWidth
                            variant="outlined"
                            value={tempHawan}
                            onChange={(e) => setTempHawan(e.target.value)}
                        />
                        <TextField
                            label="Bhog Details"
                            multiline
                            rows={2}
                            fullWidth
                            variant="outlined"
                            value={tempBhog}
                            onChange={(e) => setTempBhog(e.target.value)}
                        />
                        <TextField
                            label="Attributes"
                            multiline
                            rows={3}
                            fullWidth
                            variant="outlined"
                            value={tempAttributes}
                            onChange={(e) => setTempAttributes(e.target.value)}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={tempStatus === 'active'}
                                    onChange={(e) => setTempStatus(e.target.checked ? 'active' : 'draft')}
                                    color="success"
                                />
                            }
                            label={tempStatus === 'active' ? "Published (Visible in Tool)" : "Draft (Hidden from Tool)"}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setEditDialogOpen(false)} sx={{ color: '#7c2d12', fontWeight: 700 }}>Cancel</Button>
                    <Button
                        onClick={handleSave}
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
        </Box>
    );
}
