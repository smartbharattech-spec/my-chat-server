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
    AppBar,
    Toolbar,
    Stack,
    Breadcrumbs,
    Link,
    Tooltip,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from "@mui/icons-material/Menu";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../services/AuthService";
import { useToast } from "../services/ToastService";
import AdminSidebar from "../components/AdminSidebar";
import AdminPreloader from "../components/AdminPreloader";

export default function AdminMapRequests() {
    const { isAdminLoggedIn, adminUser } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(isDesktop);

    useEffect(() => {
        setDrawerOpen(isDesktop);
    }, [isDesktop]);

    // Table States
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalRequests, setTotalRequests] = useState(0);

    // Delete States
    const [deleteId, setDeleteId] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Upload Map States
    const [uploadReqId, setUploadReqId] = useState(null);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // View Map States
    const [previewMap, setPreviewMap] = useState(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);

    useEffect(() => {
        if (!isAdminLoggedIn) {
            navigate("/admin");
        } else {
            fetchRequests();
        }
    }, [isAdminLoggedIn, page, rowsPerPage]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/map_requests.php`);
            const data = await response.json();
            if (data.status === "success") {
                setRequests(data.data);
                setTotalRequests(data.data.length);
            } else {
                setRequests([]);
                setTotalRequests(0);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            showToast("Failed to fetch map requests", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            const response = await fetch("/api/map_requests.php", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: newStatus }),
            });
            const data = await response.json();
            if (data.status === "success") {
                showToast("Status updated", "success");
                fetchRequests();
            } else {
                showToast(data.message, "error");
            }
        } catch (error) {
            showToast("Update failed", "error");
        }
    };

    const confirmDelete = async () => {
        try {
            const response = await fetch(`/api/map_requests.php?id=${deleteId}`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (data.status === "success") {
                showToast("Request deleted", "success");
                fetchRequests();
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

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast("Please upload an image file", "error");
            return;
        }

        setUploading(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            try {
                const response = await fetch("/api/map_requests.php", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: uploadReqId,
                        created_map: reader.result,
                        status: 'completed'
                    }),
                });
                const data = await response.json();
                if (data.status === "success") {
                    showToast("Map uploaded successfully", "success");
                    fetchRequests();
                    setUploadDialogOpen(false);
                } else {
                    showToast(data.message, "error");
                }
            } catch (error) {
                showToast("Upload failed", "error");
            } finally {
                setUploading(false);
            }
        };
    };

    const toggleDrawer = () => setDrawerOpen(!drawerOpen);

    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (loading && requests.length === 0) return <AdminPreloader />;

    return (
        <Box sx={{ display: 'flex', minHeight: "100vh", backgroundColor: "#fffbf7" }}>
            <AdminSidebar open={drawerOpen} onClose={toggleDrawer} isDesktop={isDesktop} />

            <Box sx={{ flexGrow: 1, width: { md: `calc(100% - ${drawerOpen ? 260 : 80}px)` }, transition: 'width 0.3s' }}>
                <AppBar position="sticky" elevation={0} sx={{ bgcolor: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(12px)", color: '#431407', borderBottom: '1px solid rgba(255, 237, 213, 0.5)', zIndex: 1100 }}>
                    <Toolbar sx={{ justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton color="inherit" edge="start" onClick={toggleDrawer} sx={{ mr: 2 }}>
                                <MenuIcon />
                            </IconButton>
                            <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
                                <Link underline="hover" color="inherit" href="/admin/dashboard" sx={{ fontWeight: 600 }}>Dashboard</Link>
                                <Typography color="text.primary" sx={{ fontWeight: 700, color: '#9a3412' }}>Map Build Requests</Typography>
                            </Breadcrumbs>
                        </Box>
                        <IconButton><AccountCircleIcon sx={{ color: '#f97316' }} /></IconButton>
                    </Toolbar>
                </AppBar>

                <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
                    <Box sx={{ mb: 5 }}>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: "#431407", mb: 1 }}>Map Build Requests</Typography>
                        <Typography variant="body1" sx={{ color: "#7c2d12", opacity: 0.7 }}>Manage user requests for professional Vastu map creation.</Typography>
                    </Box>

                    <TableContainer component={Paper} sx={{ borderRadius: 6, overflowX: 'auto', border: '1px solid rgba(255, 237, 213, 0.4)' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#fff7ed' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800 }}>USER</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>WHATSAPP</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>PHONE</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>REQUIREMENTS</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>STATUS</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>DATE</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800 }}>ACTIONS</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {requests.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((req) => (
                                    <TableRow key={req.id} sx={{ '&:hover': { bgcolor: '#fffcf9' } }}>
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 800 }}>{req.user_name}</Typography>
                                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>{req.user_email}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Link 
                                                href={`https://wa.me/${req.whatsapp_number?.replace(/\D/g, '')}`} 
                                                target="_blank" 
                                                sx={{ color: '#16a34a', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                                            >
                                                {req.whatsapp_number || '-'}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{req.contact_number || '-'}</TableCell>
                                        <TableCell sx={{ maxWidth: 200 }}>
                                            <Typography variant="body2" sx={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 1,
                                                WebkitBoxOrient: 'vertical'
                                            }}>
                                                {req.requirements || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                size="small"
                                                value={req.status}
                                                onChange={(e) => handleStatusUpdate(req.id, e.target.value)}
                                                sx={{
                                                    borderRadius: 2,
                                                    fontSize: '0.8rem',
                                                    fontWeight: 700,
                                                    bgcolor: req.status === 'pending' ? '#fff7ed' : req.status === 'completed' ? '#f0fdf4' : '#f1f5f9'
                                                }}
                                            >
                                                <MenuItem value="pending">Pending</MenuItem>
                                                <MenuItem value="processing">Processing</MenuItem>
                                                <MenuItem value="completed">Completed</MenuItem>
                                                <MenuItem value="cancelled">Cancelled</MenuItem>
                                            </Select>
                                        </TableCell>
                                        <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                {req.created_map ? (
                                                    <Tooltip title="View Uploaded Map">
                                                        <IconButton onClick={() => { setPreviewMap(req.created_map); setViewDialogOpen(true); }} color="primary">
                                                            <VisibilityIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                ) : (
                                                    <Tooltip title="Upload Built Map">
                                                        <IconButton onClick={() => { setUploadReqId(req.id); setUploadDialogOpen(true); }} color="success">
                                                            <CloudUploadIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                <IconButton onClick={() => { setDeleteId(req.id); setDeleteDialogOpen(true); }} color="error">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <TablePagination
                            rowsPerPageOptions={[10, 25, 50]}
                            component="div"
                            count={totalRequests}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </TableContainer>
                </Container>

                <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                    <DialogTitle>Delete Request?</DialogTitle>
                    <DialogContent><DialogContentText>This action cannot be undone.</DialogContentText></DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button onClick={confirmDelete} color="error" variant="contained">Delete</Button>
                    </DialogActions>
                </Dialog>

                {/* UPLOAD DIALOG */}
                <Dialog open={uploadDialogOpen} onClose={() => !uploading && setUploadDialogOpen(false)} maxWidth="xs" fullWidth>
                    <DialogTitle sx={{ fontWeight: 800 }}>Upload Built Map</DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ mb: 3 }}>
                            Upload the Vastu map you created for this user. The status will automatically change to 'Completed'.
                        </DialogContentText>
                        <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                        />
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<CloudUploadIcon />}
                            onClick={() => fileInputRef.current.click()}
                            disabled={uploading}
                            sx={{ py: 2, borderRadius: 3, borderStyle: 'dashed', borderWidth: 2 }}
                        >
                            {uploading ? "Uploading..." : "Select Map Image"}
                        </Button>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>Cancel</Button>
                    </DialogActions>
                </Dialog>

                {/* VIEW DIALOG */}
                <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md">
                    <DialogTitle sx={{ fontWeight: 800 }}>Uploaded Map Preview</DialogTitle>
                    <DialogContent>
                        {previewMap && (
                            <Box sx={{ width: '100%', textAlign: 'center' }}>
                                <img
                                    src={`/api/uploads/maps/${previewMap}`}
                                    alt="Built Map"
                                    style={{ maxWidth: '100%', borderRadius: 8 }}
                                />
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={() => window.open(`/api/uploads/maps/${previewMap}`, '_blank')}
                        >
                            Open Full Image
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Box>
    );
}
