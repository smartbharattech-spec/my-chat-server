import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Button, Chip, CircularProgress, Select, MenuItem, FormControl, InputLabel, Avatar, IconButton
} from '@mui/material';
import { Package, Truck, CheckCircle, Clock, AlertTriangle, ShieldCheck, Search, DollarSign, Calendar, ChevronRight, User, MoreVertical, Activity } from 'lucide-react';
import { TextField, InputAdornment, Tabs, Tab } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MarketplaceSidebar from '../../components/MarketplaceSidebar';
import { useToast } from '../../services/ToastService';

const statusConfig = {
    pending:   { label: 'Pending',   color: '#f59e0b', bgcolor: '#fffbeb', icon: <Clock size={16} /> },
    paid:      { label: 'Paid',      color: '#3b82f6', bgcolor: '#eff6ff', icon: <DollarSign size={16} /> },
    shipped:   { label: 'Shipped',   color: '#8b5cf6', bgcolor: '#f5f3ff', icon: <Truck size={16} /> },
    delivered: { label: 'Delivered', color: '#10b981', bgcolor: '#ecfdf5', icon: <CheckCircle size={16} /> },
    cancelled: { label: 'Cancelled', color: '#ef4444', bgcolor: '#fef2f2', icon: <AlertTriangle size={16} /> },
    on_hold:   { label: 'On Hold',   color: '#64748b', bgcolor: '#f1f5f9', icon: <AlertTriangle size={16} /> },
};

const paymentStatusConfig = {
    pending:   { label: 'Unpaid',    color: '#64748b', bgcolor: '#f1f5f9' },
    completed: { label: 'Payment Success', color: '#10b981', bgcolor: '#ecfdf5' },
    failed:    { label: 'Payment Failed', color: '#ef4444', bgcolor: '#fef2f2' },
};

export default function AdminOrders() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        const storedUser = localStorage.getItem('occult_user');
        if (!storedUser) {
            navigate('/occult/login');
        } else {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchOrders(parsedUser.id);
        }
    }, [navigate]);

    const fetchOrders = async (userId) => {
        try {
            const response = await fetch(`/api/marketplace/get_orders.php?user_id=${userId}&role=admin`);
            const data = await response.json();
            if (data.status === 'success') {
                setOrders(data.orders);
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId, newStatus, userId) => {
        try {
            const response = await fetch('/api/marketplace/update_order_status.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: orderId, status: newStatus, user_id: userId, role: 'admin' })
            });
            const data = await response.json();
            if (data.status === 'success') {
                showToast('status_updated', `Order status updated to ${newStatus}.`, 'success');
                fetchOrders(userId);
            } else {
                showToast('error', data.message, 'error');
            }
        } catch (err) {
            showToast('error', 'Failed to update order.', 'error');
        }
    };

    const handleApprovePayment = async (orderId, userId) => {
        if (!window.confirm("Manually approve this payment? This should only be done if you've verified the payment manually.")) return;
        try {
            const response = await fetch('/api/marketplace/admin_approve_order.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: orderId, admin_id: userId })
            });
            const data = await response.json();
            if (data.status === 'success') {
                showToast('payment_approved', 'Payment approved successfully.', 'success');
                fetchOrders(userId);
            } else {
                showToast('error', data.message, 'error');
            }
        } catch (err) {
            showToast('error', 'Failed to approve payment.', 'error');
        }
    };
    
    const filteredOrders = orders.filter(order => {
        const matchesSearch = (
            order.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.seeker_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.expert_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id?.toString().includes(searchTerm)
        );
        const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const statsSummary = React.useMemo(() => {
        const total = orders.length;
        const revenue = orders.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
        const pending = orders.filter(o => o.status === 'pending' || o.status === 'paid').length;
        const delivered = orders.filter(o => o.status === 'delivered').length;
        return { total, revenue, pending, delivered };
    }, [orders]);

    if (loading) return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress color="warning" />
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <MarketplaceSidebar user={user} role="admin" />

            <Box sx={{ flex: 1, p: { xs: 2, md: 4, lg: 6 }, pt: { xs: 10, md: 4, lg: 6 }, maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                <Box sx={{ mb: 6 }}>
                    <Typography 
                        variant="h3" 
                        sx={{ 
                            fontWeight: 950, 
                            color: '#0f172a', 
                            letterSpacing: '-2px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2,
                            fontSize: { xs: '2.2rem', md: '3.5rem' }
                        }}
                    >
                        Master Control
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontWeight: 600, mt: 1 }}>Administrator dashboard for overseeing all spiritual marketplace transactions.</Typography>
                </Box>

                {/* Stats Summary Section */}
                <Grid container spacing={3} sx={{ mb: 6 }}>
                    {[
                        { label: 'Net Revenue', value: `₹${statsSummary.revenue.toLocaleString()}`, icon: <DollarSign size={22} />, color: '#10b981', bg: '#ecfdf5' },
                        { label: 'Operations', value: statsSummary.total, icon: <Package size={22} />, color: '#3b82f6', bg: '#eff6ff' },
                        { label: 'Active Queue', value: statsSummary.pending, icon: <Activity size={22} />, color: '#f59e0b', bg: '#fffbeb' },
                        { label: 'Fulfilled', value: statsSummary.delivered, icon: <CheckCircle size={22} />, color: '#8b5cf6', bg: '#f5f3ff' },
                    ].map((stat, i) => (
                        <Grid item xs={12} sm={3} key={i}>
                            <Paper 
                                sx={{ 
                                    p: 3, borderRadius: 5, border: '1px solid #f1f5f9', 
                                    display: 'flex', alignItems: 'center', gap: 2.5,
                                    boxShadow: '0 10px 20px -10px rgba(0,0,0,0.04)'
                                }}
                            >
                                <Box sx={{ width: 52, height: 52, borderRadius: 4, bgcolor: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {stat.icon}
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.6rem' }}>{stat.label}</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 950, color: '#0f172a' }}>{stat.value}</Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                {/* Filter Section */}
                <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                    <TextField
                        placeholder="Look up orders, buyers, or mystical experts..."
                        fullWidth
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Search size={22} color="#94a3b8" /></InputAdornment>,
                            sx: { borderRadius: 4, bgcolor: '#fff', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)', height: 56 }
                        }}
                    />
                    <Tabs
                        value={filterStatus}
                        onChange={(e, val) => setFilterStatus(val)}
                        variant="scrollable"
                        sx={{
                            bgcolor: '#fff', p: 0.8, borderRadius: 4, border: '1px solid #f1f5f9', minHeight: 56,
                            '& .MuiTabs-indicator': { height: '100%', borderRadius: 3, bgcolor: '#0f172a', zIndex: 0 },
                            '& .MuiTab-root': { fontWeight: 900, fontSize: '0.8rem', color: '#64748b', zIndex: 1, '&.Mui-selected': { color: '#fff' }, px: 3, minHeight: 40 }
                        }}
                    >
                        <Tab label="Everything" value="all" />
                        <Tab label="Pending" value="pending" />
                        <Tab label="Confirmed" value="paid" />
                        <Tab label="Dispatched" value="shipped" />
                        <Tab label="Success" value="delivered" />
                    </Tabs>
                </Box>

                {/* Orders List */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <AnimatePresence mode="popLayout">
                        {filteredOrders.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 12, bgcolor: '#fff', borderRadius: 5, border: '1px dashed #e2e8f0' }}>
                                <Package size={80} color="#cbd5e1" style={{ marginBottom: 20 }} />
                                <Typography variant="h5" sx={{ color: '#64748b', fontWeight: 950 }}>Database Empty</Typography>
                                <Typography sx={{ color: '#94a3b8', fontWeight: 600 }}>No orders match your current administrative filter.</Typography>
                            </Box>
                        ) : (
                            filteredOrders.map((order) => {
                                const sc = statusConfig[order.status] || statusConfig.pending;
                                return (
                                    <motion.div 
                                        key={order.id}
                                        layout
                                        initial={{ opacity: 0, y: 30 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        transition={{ duration: 0.4, cubicBezier: [0.16, 1, 0.3, 1] }}
                                    >
                                        <Paper sx={{ 
                                            p: { xs: 2.5, md: 4 }, 
                                            borderRadius: 6, 
                                            border: '1px solid #f1f5f9', 
                                            display: 'flex', 
                                            flexDirection: { xs: 'column', md: 'row' },
                                            alignItems: 'center',
                                            gap: { xs: 3, md: 4 },
                                            transition: '0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                            '&:hover': { transform: 'translateY(-10px)', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.1)', borderColor: '#0f172a' }
                                        }}>
                                            {/* Product Image Section */}
                                            <Box sx={{ 
                                                width: { xs: '100%', md: 110 }, height: 110, borderRadius: 5, 
                                                bgcolor: '#f8fafc', border: '1px solid #f1f5f9', p: 1.5, flexShrink: 0,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <img 
                                                    src={order.product_image ? `/${order.product_image}` : 'https://placehold.co/120x120'} 
                                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                    alt="Order"
                                                />
                                            </Box>

                                            {/* Order Details Section */}
                                            <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1, alignItems: 'center' }}>
                                                    <Chip label={`ADMIN_ID_${order.id}`} size="small" sx={{ fontWeight: 950, bgcolor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '0.65rem' }} />
                                                    <Typography 
                                                        variant="h5" 
                                                        sx={{ 
                                                            fontWeight: 950, color: '#0f172a', letterSpacing: '-1px',
                                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        {order.product_name}
                                                    </Typography>
                                                </Box>

                                                {order.selected_options && (() => {
                                                    try {
                                                        const opts = typeof order.selected_options === 'string' 
                                                            ? JSON.parse(order.selected_options) 
                                                            : order.selected_options;
                                                        
                                                        if (!opts || Object.keys(opts).length === 0) return null;
                                                        
                                                        return (
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                                                {Object.entries(opts).map(([k, v]) => (
                                                                    <span key={k} style={{ 
                                                                        fontSize: '0.75rem', 
                                                                        color: '#0284c7', 
                                                                        fontWeight: 800, 
                                                                        background: '#f0f9ff', 
                                                                        padding: '4px 12px', 
                                                                        borderRadius: '10px', 
                                                                        border: '1px solid #bae6fd',
                                                                        textTransform: 'capitalize'
                                                                    }}>
                                                                        {k.replace(/_/g, ' ')}: {v}
                                                                    </span>
                                                                ))}
                                                            </Box>
                                                        );
                                                    } catch(e) { return null; }
                                                })()}

                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', mt: 2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: '#eff6ff', px: 2, py: 1, borderRadius: '12px' }}>
                                                        <User size={14} color="#3b82f6" />
                                                        <Box>
                                                            <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 900, display: 'block', fontSize: '0.6rem', textTransform: 'uppercase' }}>Buyer</Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 900, color: '#1e3a8a' }}>{order.seeker_name}</Typography>
                                                        </Box>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: '#f5f3ff', px: 2, py: 1, borderRadius: '12px' }}>
                                                        <ShieldCheck size={14} color="#8b5cf6" />
                                                        <Box>
                                                            <Typography variant="caption" sx={{ color: '#8b5cf6', fontWeight: 900, display: 'block', fontSize: '0.6rem', textTransform: 'uppercase' }}>Expert</Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 900, color: '#4c1d95' }}>{order.expert_name}</Typography>
                                                        </Box>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Calendar size={14} color="#94a3b8" />
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8' }}>
                                                            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>

                                            {/* Financials & Status */}
                                            <Box sx={{ textAlign: { xs: 'left', md: 'right' }, width: { xs: '100%', md: 'auto' }, borderLeft: { md: '1px solid #f1f5f9' }, pl: { md: 4 }, minWidth: 160 }}>
                                                <Typography variant="h4" sx={{ fontWeight: 950, color: '#0f172a', letterSpacing: '-1.5px' }}>₹{order.amount}</Typography>
                                                <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'flex-end' }, gap: 1 }}>
                                                    <Chip 
                                                        icon={sc.icon}
                                                        label={sc.label} 
                                                        size="small" 
                                                        sx={{ fontWeight: 950, bgcolor: sc.bgcolor, color: sc.color, px: 1, border: `1px solid ${sc.color}40` }} 
                                                    />
                                                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '1px', color: paymentStatusConfig[order.payment_status]?.color }}>
                                                        PAYMENT: {paymentStatusConfig[order.payment_status]?.label || 'UNPAID'}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {/* Administrative Controls */}
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: { xs: '100%', md: 240 } }}>
                                                <FormControl fullWidth size="small">
                                                    <InputLabel sx={{ fontWeight: 800, fontSize: '0.8rem' }}>Change State</InputLabel>
                                                    <Select
                                                        label="Change State"
                                                        value={order.status}
                                                        onChange={(e) => handleStatusChange(order.id, e.target.value, user.id)}
                                                        sx={{ borderRadius: '12px', fontWeight: 900, fontSize: '0.85rem' }}
                                                    >
                                                        {Object.entries(statusConfig).map(([key, val]) => (
                                                            <MenuItem key={key} value={key} sx={{ fontWeight: 800 }}>{val.label}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                                
                                                {order.payment_status !== 'completed' && (
                                                    <Button 
                                                        fullWidth
                                                        variant="contained" 
                                                        onClick={() => handleApprovePayment(order.id, user.id)}
                                                        sx={{ 
                                                            bgcolor: '#10b981', py: 1, borderRadius: '12px', fontWeight: 950, textTransform: 'none', fontSize: '0.75rem',
                                                            '&:hover': { bgcolor: '#059669' }
                                                        }}
                                                    >
                                                        Force Approve Payment
                                                    </Button>
                                                )}
                                                
                                                <Button 
                                                    fullWidth
                                                    variant="outlined"
                                                    sx={{ 
                                                        borderColor: '#e2e8f0', color: '#64748b', py: 1, borderRadius: '12px', fontWeight: 950, textTransform: 'none', fontSize: '0.75rem',
                                                        '&:hover': { bgcolor: '#f1f5f9', borderColor: '#cbd5e1' }
                                                    }}
                                                    onClick={() => navigate(`/occult/product/${order.product_id}`)}
                                                >
                                                    Investigate Item
                                                </Button>
                                            </Box>
                                        </Paper>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </Box>
            </Box>
        </Box>
    );
}
