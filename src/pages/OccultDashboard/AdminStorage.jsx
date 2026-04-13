import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Grid, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, TablePagination, 
    IconButton, Chip, TextField, InputAdornment, Avatar, 
    Button, Dialog, DialogTitle, DialogContent, DialogContentText, 
    DialogActions, CircularProgress, Tooltip
} from '@mui/material';
import Divider from '@mui/material/Divider';
import { 
    Package, Search, Trash2, ExternalLink, Filter, 
    LayoutGrid, List as ListIcon, IndianRupee, Tag, 
    Clock, CheckCircle, AlertTriangle, User as UserIcon,
    ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MarketplaceSidebar from '../../components/MarketplaceSidebar';
import { useToast } from '../../services/ToastService';

export default function AdminStorage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [user, setUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, productId: null });

    const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'

    useEffect(() => {
        const storedUser = localStorage.getItem('occult_user');
        if (!storedUser) {
            navigate('/occult/login');
        } else {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.role !== 'admin') {
                navigate('/occult/user-dashboard');
            } else {
                setUser(parsedUser);
                fetchProducts();
            }
        }
    }, [navigate]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/marketplace/admin_get_products.php');
            const data = await response.json();
            if (data.status === 'success') {
                setProducts(data.products);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            showToast("Failed to fetch products.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async () => {
        if (!deleteConfirm.productId) return;
        try {
            const response = await fetch('/api/marketplace/admin_delete_product.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_id: deleteConfirm.productId, admin_id: user.id })
            });
            const data = await response.json();
            if (data.status === 'success') {
                showToast("Product deleted successfully", "success");
                fetchProducts();
            } else {
                showToast(data.message, "error");
            }
        } catch (error) {
            showToast("Failed to delete product", "error");
        } finally {
            setDeleteConfirm({ open: false, productId: null });
        }
    };

    const safeProducts = Array.isArray(products) ? products : [];

    const filteredProducts = safeProducts.filter(p => 
        p?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p?.expert_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p?.id?.toString().includes(searchTerm)
    );

    const stats = [
        { label: 'Total Products', value: safeProducts.length, icon: <ShoppingBag size={20} />, color: '#3b82f6', bg: '#eff6ff' },
        { label: 'Total Experts', value: new Set(safeProducts.map(p => p?.expert_id).filter(Boolean)).size, icon: <UserIcon size={20} />, color: '#8b5cf6', bg: '#f5f3ff' },
        { label: 'Active Items', value: safeProducts.filter(p => p?.status === 'active').length, icon: <CheckCircle size={20} />, color: '#10b981', bg: '#ecfdf5' },
        { label: 'Store Value', value: `₹${safeProducts.reduce((acc, curr) => acc + (parseFloat(curr?.price) || 0), 0).toFixed(0)}`, icon: <IndianRupee size={20} />, color: '#f59e0b', bg: '#fffbeb' },
    ];

    if (loading && products.length === 0) return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress color="warning" />
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <MarketplaceSidebar user={user} role="admin" />

            <Box sx={{ flex: 1, p: { xs: 2, md: 4, lg: 6 }, pt: { xs: 10, md: 4, lg: 6 } }}>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={900} sx={{ display: 'flex', alignItems: 'center', gap: 2, color: '#0f172a' }}>
                            <ShoppingBag size={32} color="#f59e0b" />
                            Marketplace Store
                        </Typography>
                        <Typography color="textSecondary">Manage all products from every expert in one central hub.</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, bgcolor: '#fff', p: 0.5, borderRadius: 3, border: '1px solid #e2e8f0' }}>
                        <IconButton 
                            onClick={() => setViewMode('grid')}
                            sx={{ borderRadius: 2, bgcolor: viewMode === 'grid' ? '#f8fafc' : 'transparent', color: viewMode === 'grid' ? '#f59e0b' : '#64748b' }}
                        >
                            <LayoutGrid size={20} />
                        </IconButton>
                        <IconButton 
                            onClick={() => setViewMode('list')}
                            sx={{ borderRadius: 2, bgcolor: viewMode === 'list' ? '#f8fafc' : 'transparent', color: viewMode === 'list' ? '#f59e0b' : '#64748b' }}
                        >
                            <ListIcon size={20} />
                        </IconButton>
                    </Box>
                </Box>

                {/* --- Stats --- */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {stats.map((stat, i) => (
                        <Grid item xs={12} sm={6} md={3} key={i}>
                            <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: stat.bg, color: stat.color }}>{stat.icon}</Box>
                                <Box>
                                    <Typography variant="caption" color="textSecondary" fontWeight={600}>{stat.label}</Typography>
                                    <Typography variant="h6" fontWeight={900}>{stat.value}</Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                {/* --- Search Bar --- */}
                <Paper sx={{ p: 2, mb: 4, borderRadius: 4, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TextField
                        size="small"
                        placeholder="Search products, experts or ID..."
                        fullWidth
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={18} color="#64748b" />
                                </InputAdornment>
                            ),
                            sx: { borderRadius: 3, bgcolor: '#f8fafc' }
                        }}
                    />
                </Paper>

                {viewMode === 'list' ? (
                    <Paper sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <TableContainer>
                            <Table sx={{ minWidth: 800 }}>
                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>PRODUCT</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>EXPERT</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>PRICE</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>STATUS</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#64748b' }}>CREATED</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#64748b' }} align="right">ACTIONS</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredProducts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((product) => (
                                        <TableRow key={product.id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar 
                                                        src={product.image_url ? `/${product.image_url}` : null} 
                                                        variant="rounded"
                                                        sx={{ width: 44, height: 44, bgcolor: '#f1f5f9' }}
                                                    >
                                                        <Package size={20} color="#cbd5e1" />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body1" fontWeight={700} color="#0f172a">{product.name}</Typography>
                                                        <Typography variant="caption" color="textSecondary">ID: #{product.id}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={700}>{product.expert_name}</Typography>
                                                <Typography variant="caption" color="textSecondary">{product.expert_email}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body1" fontWeight={800} color="#f59e0b">₹{product.price}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={product.status?.toUpperCase()} size="small" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption">{new Date(product.created_at).toLocaleDateString()}</Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton color="error" onClick={() => setDeleteConfirm({ open: true, productId: product.id })}>
                                                    <Trash2 size={18} />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            component="div"
                            count={filteredProducts.length}
                            page={page}
                            onPageChange={(e, p) => setPage(p)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
                        />
                    </Paper>
                ) : (
                    <Box>
                        <Grid container spacing={3}>
                            <AnimatePresence mode="popLayout">
                                {filteredProducts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((product) => (
                                    <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                                        <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                            <Paper sx={{ 
                                                p: 0, borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0',
                                                transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }
                                            }}>
                                                <Box sx={{ height: 160, width: '100%', bgcolor: '#f1f5f9', position: 'relative' }}>
                                                    <img 
                                                        src={product.image_url ? `/${product.image_url}` : 'https://placehold.co/300x200?text=No+Image'} 
                                                        alt={product.name} 
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                    <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                                                        <Chip 
                                                            label={`₹${product.price}`} 
                                                            size="small" 
                                                            sx={{ bgcolor: '#fff', color: '#0f172a', fontWeight: 900, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} 
                                                        />
                                                    </Box>
                                                </Box>
                                                <Box sx={{ p: 2 }}>
                                                    <Typography variant="subtitle1" fontWeight={800} noWrap>{product.name}</Typography>
                                                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Avatar sx={{ width: 22, height: 22, fontSize: '0.7rem', bgcolor: '#f59e0b' }}>{product.expert_name?.charAt(0)}</Avatar>
                                                        <Typography variant="caption" fontWeight={600} color="textSecondary" noWrap>{product.expert_name}</Typography>
                                                    </Box>
                                                    <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography variant="caption" color="#94a3b8">ID: #{product.id}</Typography>
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => setDeleteConfirm({ open: true, productId: product.id })}
                                                            sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' } }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </IconButton>
                                                    </Box>
                                                </Box>
                                            </Paper>
                                        </motion.div>
                                    </Grid>
                                ))}
                            </AnimatePresence>
                        </Grid>
                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                            <TablePagination
                                component="div"
                                count={filteredProducts.length}
                                page={page}
                                onPageChange={(e, p) => setPage(p)}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
                            />
                        </Box>
                    </Box>
                )}
            </Box>

            {/* --- Delete Confirmation --- */}
            <Dialog 
                open={deleteConfirm.open} 
                onClose={() => setDeleteConfirm({ open: false, productId: null })}
                PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <AlertTriangle color="#ef4444" size={24} /> Delete Product?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this product? This action will remove it from the marketplace and cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button 
                        onClick={() => setDeleteConfirm({ open: false, productId: null })}
                        sx={{ textTransform: 'none', fontWeight: 700, color: '#64748b' }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleDeleteProduct}
                        variant="contained" 
                        color="error"
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800, bgcolor: '#ef4444' }}
                    >
                        Delete Permanently
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
