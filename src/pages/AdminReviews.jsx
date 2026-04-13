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
    IconButton,
    Button,
    Chip,
    Rating,
    AppBar,
    Toolbar,
    useMediaQuery,
    useTheme,
    TablePagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from "@mui/material";
import { useEffect, useState } from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import MenuIcon from "@mui/icons-material/Menu";
import DeleteIcon from "@mui/icons-material/Delete";
import AdminSidebar from "../components/AdminSidebar";
import { useToast } from "../services/ToastService";

export default function AdminReviews() {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(isDesktop);
    const { showToast } = useToast();

    useEffect(() => {
        setDrawerOpen(isDesktop);
    }, [isDesktop]);

    // Pagination states
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Delete states
    const [deleteId, setDeleteId] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const res = await fetch("/api/admin_analytics.php?action=list_reviews");
            const data = await res.json();
            if (data.status === "success") setReviews(data.data);
        } catch (e) {
            showToast("Failed to fetch reviews", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            const res = await fetch("/api/admin_analytics.php?action=update_review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status })
            });
            const data = await res.json();
            if (data.status === "success") {
                showToast(`Review ${status}`, "success");
                fetchReviews();
            }
        } catch (e) {
            showToast("Update failed", "error");
        }
    };

    const handleDeleteReview = async () => {
        try {
            const res = await fetch("/api/admin_analytics.php?action=delete_review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: deleteId })
            });
            const data = await res.json();
            if (data.status === "success") {
                showToast("Review deleted", "success");
                setReviews(reviews.filter(r => r.id !== deleteId));
                setDeleteDialogOpen(false);
            }
        } catch (e) {
            showToast("Delete failed", "error");
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Box sx={{ display: 'flex', minHeight: "100vh", backgroundColor: "#fffbf7" }}>
            <AdminSidebar open={drawerOpen} onClose={() => setDrawerOpen(!drawerOpen)} isDesktop={isDesktop} />

            <Box sx={{ flexGrow: 1 }}>
                <AppBar position="sticky" elevation={0} sx={{ backgroundColor: "#fff", color: '#431407', borderBottom: '1px solid #ffedd5' }}>
                    <Toolbar>
                        <IconButton color="inherit" onClick={() => setDrawerOpen(!drawerOpen)} sx={{ mr: 2 }}><MenuIcon /></IconButton>
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" fontWeight={800}>Remedy Reviews & Impact</Typography>
                            <Typography variant="caption" color="textSecondary">Monitor user benefits and remedy outcomes</Typography>
                        </Box>
                    </Toolbar>
                </AppBar>

                <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
                    {/* STATS COUNTING SECTION */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #ffedd5', background: 'linear-gradient(135deg, #fff 0%, #fff7ed 100%)', display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2 }}>
                                <TrendingUpIcon sx={{ color: '#d97706' }} />
                            </Box>
                            <Box>
                                <Typography variant="caption" fontWeight={700} color="textSecondary" sx={{ textTransform: 'uppercase' }}>Total Reviews</Typography>
                                <Typography variant="h5" fontWeight={900} color="#431407">{reviews.length}</Typography>
                            </Box>
                        </Paper>

                        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #dcfce7', background: 'linear-gradient(135deg, #fff 0%, #f0fdf4 100%)', display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2 }}>
                                <ThumbUpIcon sx={{ color: '#16a34a' }} />
                            </Box>
                            <Box>
                                <Typography variant="caption" fontWeight={700} color="textSecondary" sx={{ textTransform: 'uppercase' }}>Positive Results (Benefit)</Typography>
                                <Typography variant="h5" fontWeight={900} color="#166534">
                                    {reviews.filter(r => Number(r.rating) >= 3).length}
                                </Typography>
                            </Box>
                        </Paper>

                        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #fee2e2', background: 'linear-gradient(135deg, #fff 0%, #fef2f2 100%)', display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2 }}>
                                <ThumbDownIcon sx={{ color: '#dc2626' }} />
                            </Box>
                            <Box>
                                <Typography variant="caption" fontWeight={700} color="textSecondary" sx={{ textTransform: 'uppercase' }}>Negative Results (Loss)</Typography>
                                <Typography variant="h5" fontWeight={900} color="#991b1b">
                                    {reviews.filter(r => Number(r.rating) < 3).length}
                                </Typography>
                            </Box>
                        </Paper>
                    </Box>
                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #ffedd5', overflowX: 'auto' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#fff7ed' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800 }}>User</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Rating</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Comment</TableCell>
                                    <TableCell sx={{ fontWeight: 800 }}>Objective / Remedy</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {reviews.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((rev) => (
                                    <TableRow key={rev.id}>
                                        <TableCell>
                                            <Typography fontWeight={700}>{rev.email}</Typography>
                                            <Typography variant="caption" color="textSecondary">{new Date(rev.created_at).toLocaleDateString()}</Typography>
                                        </TableCell>
                                        <TableCell><Rating value={Number(rev.rating)} readOnly size="small" /></TableCell>
                                        <TableCell sx={{ maxWidth: 400 }}>{rev.comment}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={800}>{rev.remedy_name || 'General'}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                onClick={() => { setDeleteId(rev.id); setDeleteDialogOpen(true); }}
                                                color="error"
                                                sx={{ bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {reviews.length === 0 && !loading && (
                                    <TableRow><TableCell colSpan={5} align="center">No reviews found.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <TablePagination
                            rowsPerPageOptions={[10, 25, 50]}
                            component="div"
                            count={reviews.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            sx={{ borderTop: '1px solid #ffedd5' }}
                        />
                    </TableContainer>
                </Container>
            </Box>

            {/* Delete Confirmation */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle sx={{ fontWeight: 900, color: '#431407' }}>Delete Review?</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#7c2d12' }}>
                        Are you sure you want to delete this review? This action is permanent.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#7c2d12', fontWeight: 700 }}>Cancel</Button>
                    <Button onClick={handleDeleteReview} variant="contained" sx={{ backgroundColor: '#ef4444', fontWeight: 800, borderRadius: 3, '&:hover': { backgroundColor: '#b91c1c' } }}>
                        Delete Review
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
