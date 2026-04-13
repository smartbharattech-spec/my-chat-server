import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Button, Chip, CircularProgress, Avatar,
    Dialog, DialogTitle, DialogContent, DialogActions, IconButton, useTheme, useMediaQuery
} from '@mui/material';
import Divider from '@mui/material/Divider';
import { ShoppingBag, Package, Truck, CheckCircle, Clock, AlertTriangle, Search, CreditCard, Tag, Calendar, ChevronRight, Copy, MapPin, Layers, Play } from 'lucide-react';
import { TextField, InputAdornment, Tabs, Tab } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MarketplaceSidebar from '../../components/MarketplaceSidebar';
import { useToast } from '../../services/ToastService';

const statusConfig = {
    pending:   { label: 'Processing', color: '#f59e0b', bgcolor: '#fffbeb', icon: <Clock size={16} /> },
    paid:      { label: 'Confirmed',  color: '#3b82f6', bgcolor: '#eff6ff', icon: <ShoppingBag size={16} /> },
    shipped:   { label: 'In Transit', color: '#8b5cf6', bgcolor: '#f5f3ff', icon: <Truck size={16} /> },
    delivered: { label: 'Delivered',  color: '#10b981', bgcolor: '#ecfdf5', icon: <CheckCircle size={16} /> },
    cancelled: { label: 'Cancelled',  color: '#ef4444', bgcolor: '#fef2f2', icon: <AlertTriangle size={16} /> },
    on_hold:   { label: 'On Hold',    color: '#64748b', bgcolor: '#f1f5f9', icon: <AlertTriangle size={16} /> },
};

const paymentStatusConfig = {
    pending:   { label: 'Unpaid',    color: '#64748b', bgcolor: '#f1f5f9' },
    completed: { label: 'Payment Success', color: '#10b981', bgcolor: '#ecfdf5' },
    failed:    { label: 'Payment Failed', color: '#ef4444', bgcolor: '#fef2f2' },
};

export default function UserOrders() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { showToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const [trackingDialog, setTrackingDialog] = useState(false);
    const [activeTracking, setActiveTracking] = useState(null);

    const openTracking = (order) => {
        setActiveTracking(order);
        setTrackingDialog(true);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        showToast('copy_success', 'Tracking ID copied to clipboard!', 'success');
    };

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
            const response = await fetch(`/api/marketplace/get_orders.php?user_id=${userId}&role=user`);
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

    const handleMarkDelivered = async (orderId) => {
        if (!window.confirm('Mark this order as received?')) return;

        try {
            const response = await fetch('/api/marketplace/update_order_status.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: orderId, status: 'delivered', user_id: user.id, role: 'user' })
            });
            const data = await response.json();
            if (data.status === 'success') {
                showToast('order_delivered', 'Order marked as delivered!', 'success');
                fetchOrders(user.id);
            } else {
                showToast('error', data.message, 'error');
            }
        } catch (err) {
            showToast('error', 'Failed to update order.', 'error');
        }
    };

    const filteredOrders = orders.filter(order => {
        // Hide courses from orders list as they belong to "My Courses"
        if (order.product_type === 'course') return false;
        
        const matchesSearch = (
            order.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.expert_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id?.toString().includes(searchTerm)
        );
        const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const statsSummary = React.useMemo(() => {
        const total = orders.length;
        const totalSpent = orders.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
        const active = orders.filter(o => ['paid', 'shipped'].includes(o.status)).length;
        const delivered = orders.filter(o => o.status === 'delivered').length;
        return { total, totalSpent, active, delivered };
    }, [orders]);

    if (loading) return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress color="warning" />
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <MarketplaceSidebar user={user} role="user" />

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
                            fontSize: { xs: '2rem', md: '3rem' }
                        }}
                    >
                        My Orders
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontWeight: 600, mt: 1 }}>Track all your spiritual product orders and digital services.</Typography>
                </Box>

                {/* Stats Summary Section */}
                <Grid container spacing={3} sx={{ mb: 6 }}>
                    {[
                        { label: 'Yearly Spent', value: `₹${statsSummary.totalSpent.toLocaleString()}`, icon: <CreditCard size={22} />, color: '#10b981', bg: '#ecfdf5' },
                        { label: 'Active Orders', value: statsSummary.active, icon: <Clock size={22} />, color: '#f59e0b', bg: '#fffbeb' },
                        { label: 'Completed', value: statsSummary.delivered, icon: <CheckCircle size={22} />, color: '#8b5cf6', bg: '#f5f3ff' },
                    ].map((stat, i) => (
                        <Grid item xs={4} sm={4} key={i}>
                            <Paper 
                                sx={{ 
                                    p: { xs: 1.5, sm: 3 }, borderRadius: { xs: 3, sm: 5 }, border: '1px solid #f1f5f9', 
                                    display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: { xs: 1, sm: 3 },
                                    boxShadow: '0 10px 20px -10px rgba(0,0,0,0.04)',
                                    textAlign: { xs: 'center', sm: 'left' }
                                }}
                            >
                                <Box sx={{ 
                                    width: { xs: 40, sm: 56 }, height: { xs: 40, sm: 56 }, 
                                    borderRadius: { xs: 2.5, sm: 4 }, bgcolor: stat.bg, color: stat.color, 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {stat.icon}
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: { xs: '0.5rem', sm: '0.65rem' } }}>{stat.label}</Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 950, color: '#0f172a', fontSize: { xs: '0.9rem', sm: '1.5rem', md: '2.125rem' } }}>{stat.value}</Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}

                </Grid>

                {/* Filter Section */}
                <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                    <TextField
                        placeholder="Search by order ID or product name..."
                        fullWidth
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Search size={20} color="#94a3b8" /></InputAdornment>,
                            sx: { borderRadius: 4, bgcolor: '#fff', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }
                        }}
                    />
                    <Tabs
                        value={filterStatus}
                        onChange={(e, val) => setFilterStatus(val)}
                        variant="scrollable"
                        sx={{
                            bgcolor: '#fff', p: 0.5, borderRadius: 4, border: '1px solid #f1f5f9',
                            '& .MuiTabs-indicator': { height: '100%', borderRadius: 3, bgcolor: '#f59e0b', zIndex: 0 },
                            '& .MuiTab-root': { fontWeight: 900, fontSize: '0.85rem', color: '#64748b', zIndex: 1, '&.Mui-selected': { color: '#fff' } }
                        }}
                    >
                        <Tab label="All" value="all" />
                        <Tab label="Pending" value="pending" />
                        <Tab label="Paid" value="paid" />
                        <Tab label="Shipped" value="shipped" />
                        <Tab label="Delivered" value="delivered" />
                    </Tabs>
                </Box>

                {/* Orders List */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <AnimatePresence mode="popLayout">
                        {filteredOrders.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 10, bgcolor: '#fff', borderRadius: 5, border: '1px dashed #e2e8f0' }}>
                                <Package size={64} color="#cbd5e1" style={{ marginBottom: 16 }} />
                                <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 900 }}>No Orders Found</Typography>
                                <Typography sx={{ color: '#94a3b8' }}>You haven't placed any orders matching this criteria.</Typography>
                            </Box>
                        ) : (
                            filteredOrders.map((order) => {
                                const sc = statusConfig[order.status] || statusConfig.pending;
                                return (
                                    <motion.div 
                                        key={order.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        transition={{ duration: 0.3 }}
                                    >
                                        <Paper sx={{ 
                                            p: { xs: 2.5, md: 4 }, 
                                            borderRadius: 5, 
                                            border: '1px solid #f1f5f9', 
                                            display: 'flex', 
                                            flexDirection: { xs: 'column', md: 'row' },
                                            alignItems: 'center',
                                            gap: { xs: 3, md: 5 },
                                            transition: '0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                            '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.08)', borderColor: '#f59e0b' }
                                        }}>
                                            {/* Order Image Section */}
                                            <Box sx={{ 
                                                width: { xs: '100%', md: 120 }, height: 120, borderRadius: 4, 
                                                bgcolor: '#f8fafc', border: '1px solid #f1f5f9', p: 1, flexShrink: 0,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <img 
                                                    src={order.product_image ? (order.product_image.startsWith('http') || order.product_image.startsWith('/') ? order.product_image : `/${order.product_image}`) : 'https://placehold.co/120x120'} 
                                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                />
                                            </Box>

                                            {/* Order Info Section */}
                                            <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1, alignItems: 'center' }}>
                                                    <Chip label={`#ORDER-${order.id}`} size="small" sx={{ fontWeight: 900, bgcolor: '#f1f5f9', borderRadius: '8px' }} />
                                                    
                                                    {order.product_type && (
                                                        <Chip 
                                                            icon={order.product_type === 'course' ? <Layers size={12} /> : <Tag size={12} />} 
                                                            label={(order.product_type).toUpperCase()} 
                                                            size="small" 
                                                            sx={{ 
                                                                fontWeight: 950, 
                                                                bgcolor: order.product_type === 'course' ? 'rgba(245, 158, 11, 0.14)' : 'rgba(14, 165, 233, 0.14)', 
                                                                color: order.product_type === 'course' ? '#b45309' : '#0284c7',
                                                                fontSize: '0.65rem',
                                                                height: 24,
                                                                borderRadius: '6px',
                                                                letterSpacing: '0.5px'
                                                            }} 
                                                        />
                                                    )}

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

                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Avatar src={order.expert_profile_image ? `/${order.expert_profile_image}` : null} sx={{ width: 24, height: 24 }} />
                                                        <Typography variant="body2" sx={{ fontWeight: 900, color: '#475569' }}>{order.expert_name}</Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Calendar size={16} color="#94a3b8" />
                                                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#94a3b8' }}>
                                                            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>

                                            {/* Pricing Section */}
                                            <Box sx={{ textAlign: { xs: 'left', md: 'right' }, width: { xs: '100%', md: 'auto' }, borderLeft: { md: '1px solid #f1f5f9' }, pl: { md: 4 } }}>
                                                <Typography variant="h4" sx={{ fontWeight: 950, color: '#0f172a' }}>₹{order.amount}</Typography>
                                                <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'flex-end' }, gap: 0.5 }}>
                                                    <Chip 
                                                        icon={sc.icon}
                                                        label={sc.label} 
                                                        size="small" 
                                                        sx={{ fontWeight: 900, bgcolor: sc.bgcolor, color: sc.color, px: 1, height: 26, border: `1px solid ${sc.color}40` }} 
                                                    />
                                                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '1px', color: paymentStatusConfig[order.payment_status]?.color }}>
                                                        {paymentStatusConfig[order.payment_status]?.label || 'UNPAID'}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {/* Action Section */}
                                            <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', md: 'auto' }, justifyContent: 'flex-end' }}>
                                                {order.product_type === 'course' ? (
                                                    (order.status === 'paid' || order.status === 'delivered') && (
                                                        <Button 
                                                            variant="contained" 
                                                            startIcon={<Play size={18} fill="currentColor" />}
                                                            onClick={() => navigate(`/occult/learn/${order.product_id}`)}
                                                            sx={{ 
                                                                bgcolor: '#f59e0b', py: 1.5, px: 3, borderRadius: '14px', fontWeight: 900, textTransform: 'none',
                                                                boxShadow: '0 8px 16px rgba(245, 158, 11, 0.25)',
                                                                '&:hover': { bgcolor: '#d97706', transform: 'translateY(-2px)' }, transition: '0.3s'
                                                            }}
                                                        >
                                                            Open Course
                                                        </Button>
                                                    )
                                                ) : (
                                                    (order.status === 'paid' || order.status === 'shipped') && (
                                                        <Button 
                                                            variant="contained" 
                                                            onClick={() => handleMarkDelivered(order.id)}
                                                            sx={{ 
                                                                bgcolor: '#10b981', py: 1.5, px: 3, borderRadius: '14px', fontWeight: 900, textTransform: 'none',
                                                                '&:hover': { bgcolor: '#059669', transform: 'translateY(-2px)' }, transition: '0.3s'
                                                            }}
                                                        >
                                                            Mark Received
                                                        </Button>
                                                    )
                                                )}
                                                {(order.tracking_link || order.tracking_id) && (
                                                    <IconButton 
                                                        onClick={() => openTracking(order)}
                                                        sx={{ bgcolor: '#eff6ff', color: '#3b82f6', borderRadius: '14px', width: 48, height: 48 }}
                                                    >
                                                        <MapPin size={22} />
                                                    </IconButton>
                                                )}
                                                </Box>
                                            </Paper>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </Box>
            </Box>

            <Dialog open={trackingDialog} onClose={() => setTrackingDialog(false)} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: '32px', p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 950, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Truck size={28} color="#f59e0b" />
                    Tracking Details
                </DialogTitle>
                <DialogContent>
                    {activeTracking && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
                            <Box sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                <Typography variant="body2" sx={{ fontWeight: 950, color: '#64748b', textTransform: 'uppercase', mb: 1, letterSpacing: '1px' }}>Order Identifier</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Typography variant="h6" fontWeight={900}>#{activeTracking.tracking_id || activeTracking.id}</Typography>
                                    <IconButton onClick={() => copyToClipboard(activeTracking.tracking_id || activeTracking.id)}><Copy size={18} /></IconButton>
                                </Box>
                            </Box>
                            {activeTracking.tracking_link && (
                                <Box sx={{ minHeight: "500px", p: 1, bgcolor: "#fff", borderRadius: "32px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                                    <div 
                                        className="as-track-widget" 
                                        data-tracking-number={activeTracking.tracking_id || activeTracking.id} 
                                        data-domain="track.aftership.com"
                                        data-width="100%"
                                        data-height="500"
                                    ></div>
                                    <script type="text/javascript" src="https://sdk.aftership.com/v1/aftership.js"></script>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setTrackingDialog(false)} sx={{ fontWeight: 900, color: '#f59e0b', fontSize: '1rem' }}>Done</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
