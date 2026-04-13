import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, TablePagination, 
    TextField, InputAdornment, Avatar, Chip, MenuItem, 
    Select, FormControl, InputLabel, Grid, CircularProgress,
    IconButton, Tooltip, Stack
} from '@mui/material';
import Divider from '@mui/material/Divider';
import { 
    Search, Filter, Users, ShieldCheck, ShoppingBag, 
    BarChart2, Clock, CheckCircle, AlertCircle, RefreshCw,
    ExternalLink, MessageCircle
} from 'lucide-react';
import MarketplaceSidebar from "../../components/MarketplaceSidebar";
import { useToast } from '../../services/ToastService';
import { motion } from 'framer-motion';

export default function OccultAdminTracker() {
    const { showToast } = useToast();
    const [user, setUser] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filters
    const [search, setSearch] = useState('');
    const [expertId, setExpertId] = useState('');
    const [userId, setUserId] = useState('');
    const [productId, setProductId] = useState('');

    // Metadata for filters
    const [experts, setExperts] = useState([]);
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        const storedUser = localStorage.getItem('occult_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        fetchMetadata();
        fetchLogs();
    }, []);

    const fetchMetadata = async () => {
        try {
            const [expRes, userRes, prodRes] = await Promise.all([
                fetch("/api/marketplace/admin_get_experts.php").then(r => r.json()),
                fetch("/api/marketplace/admin_get_users.php").then(r => r.json()),
                fetch("/api/marketplace/admin_get_products.php").then(r => r.json())
            ]);

            if (expRes.status === 'success') setExperts(expRes.data);
            if (userRes.status === 'success') setUsers(userRes.data);
            if (prodRes.status === 'success') setProducts(prodRes.products);
        } catch (err) {
            console.error("Failed to fetch metadata", err);
        }
    };

    const fetchLogs = async () => {
        setRefreshing(true);
        try {
            const params = new URLSearchParams();
            params.append('action', 'admin_all_entries');
            if (search) params.append('search', search);
            if (expertId) params.append('expert_id', expertId);
            if (userId) params.append('user_id', userId);
            if (productId) params.append('product_id', productId);

            const res = await fetch(`/api/marketplace/occult_tracker.php?${params.toString()}`);
            const data = await res.json();
            if (data.status === 'success') {
                setLogs(data.data);
            } else {
                showToast(data.message, 'error');
            }
        } catch (err) {
            showToast("Failed to fetch logs", "error");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogs();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, expertId, userId, productId]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (!user) return null;

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f8fafc', minHeight: '100vh', color: '#0f172a' }}>
            <MarketplaceSidebar user={user} role="admin" />

            <Box sx={{ flex: 1, p: { xs: 2, md: 6 } }}>
                {/* Header */}
                <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h3" fontWeight="900" sx={{ mb: 1, fontSize: { xs: '2rem', md: '3rem' } }}>Tracker Logs</Typography>
                        <Typography variant="h6" sx={{ color: '#64748b' }}>Monitor interactions, problems, and remedies across the marketplace.</Typography>
                    </Box>
                    <IconButton onClick={fetchLogs} disabled={refreshing} sx={{ bgcolor: 'white', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                    </IconButton>
                </Box>

                {/* Filters */}
                <Paper sx={{ p: 3, mb: 4, borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6} lg={3}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Search by name, email, problem..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search size={18} color="#94a3b8" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3} lg={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Expert</InputLabel>
                                <Select
                                    value={expertId}
                                    label="Expert"
                                    onChange={(e) => setExpertId(e.target.value)}
                                >
                                    <MenuItem value="">All Experts</MenuItem>
                                    {experts.map(exp => (
                                        <MenuItem key={exp.id} value={exp.id}>{exp.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3} lg={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>User</InputLabel>
                                <Select
                                    value={userId}
                                    label="User"
                                    onChange={(e) => setUserId(e.target.value)}
                                >
                                    <MenuItem value="">All Users</MenuItem>
                                    {users.map(u => (
                                        <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3} lg={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Product</InputLabel>
                                <Select
                                    value={productId}
                                    label="Product"
                                    onChange={(e) => setProductId(e.target.value)}
                                >
                                    <MenuItem value="">All Products</MenuItem>
                                    {products.map(p => (
                                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Logs Table */}
                <Paper sx={{ borderRadius: 6, border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <TableContainer>
                        <Table sx={{ minWidth: 800 }}>
                            <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                <TableRow>
                                    <TableCell sx={{ color: '#64748b', fontWeight: 'bold' }}>USER / EXPERT</TableCell>
                                    <TableCell sx={{ color: '#64748b', fontWeight: 'bold' }}>PROBLEM & EXPERIENCE</TableCell>
                                    <TableCell sx={{ color: '#64748b', fontWeight: 'bold' }}>REMEDIES / PRODUCTS</TableCell>
                                    <TableCell sx={{ color: '#64748b', fontWeight: 'bold' }} align="center">STATUS</TableCell>
                                    <TableCell sx={{ color: '#64748b', fontWeight: 'bold' }} align="right">DATE</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                                <CircularProgress size={24} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                                <BarChart2 size={48} color="#cbd5e1" />
                                                <Typography color="textSecondary" fontWeight="bold">No tracker logs found matching your criteria.</Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((log) => (
                                        <TableRow key={log.id} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.01)' } }}>
                                            <TableCell sx={{ verticalAlign: 'top' }}>
                                                <Stack spacing={2}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#e0e7ff', color: '#4338ca', fontSize: '0.8rem' }}>{log.user_display_name?.charAt(0) || log.user_name?.charAt(0)}</Avatar>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight="bold">{log.user_display_name || log.user_name}</Typography>
                                                            <Typography variant="caption" color="textSecondary">User</Typography>
                                                        </Box>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#fef3c7', color: '#92400e', fontSize: '0.8rem' }}>{log.expert_name?.charAt(0) || '?'}</Avatar>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight="bold">{log.expert_name || 'Unassigned'}</Typography>
                                                            <Typography variant="caption" color="textSecondary">Expert</Typography>
                                                        </Box>
                                                    </Box>
                                                </Stack>
                                            </TableCell>
                                            <TableCell sx={{ verticalAlign: 'top', maxWidth: 300 }}>
                                                <Box sx={{ mb: 2 }}>
                                                    <Typography variant="caption" color="error" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                                        <AlertCircle size={12} /> PROBLEM
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#334155' }}>{log.problem}</Typography>
                                                </Box>
                                                {log.experience && (
                                                    <Box>
                                                        <Typography variant="caption" color="primary" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                                            <MessageCircle size={12} /> PERSONAL EXPERIENCE
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#475569' }}>"{log.experience}"</Typography>
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell sx={{ verticalAlign: 'top' }}>
                                                {log.guidance && log.guidance.length > 0 ? (
                                                    <Stack spacing={2}>
                                                        {log.guidance.map((g, idx) => (
                                                            <Box key={g.id} sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                                                <Typography variant="caption" fontWeight="bold" color="textSecondary" sx={{ mb: 1, display: 'block' }}>REMEDY #{log.guidance.length - idx}</Typography>
                                                                <Typography variant="body2" sx={{ mb: 1 }}>{g.expert_remedy}</Typography>
                                                                {g.product_name && (
                                                                    <Chip 
                                                                        icon={<ShoppingBag size={14} />} 
                                                                        label={g.product_name} 
                                                                        size="small" 
                                                                        variant="outlined"
                                                                        sx={{ bgcolor: 'white', fontWeight: 'bold' }}
                                                                    />
                                                                )}
                                                            </Box>
                                                        ))}
                                                    </Stack>
                                                ) : (
                                                    <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>No guidance provided yet.</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="center" sx={{ verticalAlign: 'top' }}>
                                                <Chip 
                                                    label={log.status.toUpperCase()} 
                                                    size="small"
                                                    sx={{ 
                                                        fontWeight: 'bold', 
                                                        fontSize: '0.65rem',
                                                        bgcolor: log.status === 'resolved' ? '#dcfce7' : log.status === 'open' ? '#fee2e2' : '#fef3c7',
                                                        color: log.status === 'resolved' ? '#166534' : log.status === 'open' ? '#991b1b' : '#92400e'
                                                    }} 
                                                />
                                                <Box sx={{ mt: 1 }}>
                                                    <Tooltip title="Result Type">
                                                        <Chip 
                                                            label={log.result_type} 
                                                            size="small" 
                                                            variant="outlined"
                                                            sx={{ 
                                                                fontSize: '0.6rem',
                                                                color: log.result_type === 'positive' ? '#10b981' : log.result_type === 'negative' ? '#ef4444' : '#64748b',
                                                                borderColor: log.result_type === 'positive' ? '#10b981' : log.result_type === 'negative' ? '#ef4444' : '#cbd5e1'
                                                            }}
                                                        />
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right" sx={{ verticalAlign: 'top' }}>
                                                <Typography variant="body2" fontWeight="bold">{new Date(log.created_at).toLocaleDateString()}</Typography>
                                                <Typography variant="caption" color="textSecondary">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        component="div"
                        count={logs.length}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Paper>
            </Box>
        </Box>
    );
}
