import React, { useState, useEffect } from 'react';
import { 
    Package, Truck, CheckCircle, Clock, AlertTriangle, 
    TrendingUp, ShoppingBag, Link as LinkIcon, 
    ChevronRight, Info, Search, CheckCircle2, Calendar, User, Copy, X, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MarketplaceSidebar from '../../components/MarketplaceSidebar';
import BlockingOverlay from '../../components/BlockingOverlay';
import { useToast } from '../../services/ToastService';
import { 
    Box, Typography, Paper, Grid, Button, Chip, CircularProgress, 
    TextField, InputAdornment, Tabs, Tab, Avatar, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';

const statusConfig = {
    pending:   { label: 'Pending',   color: '#f59e0b', bgcolor: '#fffbeb', icon: <Clock size={16} /> },
    paid:      { label: 'Fulfillment Ready', color: '#3b82f6', bgcolor: '#eff6ff', icon: <Package size={16} /> },
    shipped:   { label: 'In Transit', color: '#8b5cf6', bgcolor: '#f5f3ff', icon: <Truck size={16} /> },
    delivered: { label: 'Delivered', color: '#10b981', bgcolor: '#ecfdf5', icon: <CheckCircle2 size={16} /> },
    cancelled: { label: 'Cancelled', color: '#ef4444', bgcolor: '#fef2f2', icon: <AlertTriangle size={16} /> },
    on_hold:   { label: 'On Hold',   color: '#64748b', bgcolor: '#f1f5f9', icon: <AlertTriangle size={16} /> },
};

export default function ExpertOrders() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [totalEarned, setTotalEarned] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const [trackingModal, setTrackingModal] = useState({ show: false, order: null });
    const [trackingLink, setTrackingLink] = useState('');
    const [trackingId, setTrackingId] = useState('');

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
            const response = await fetch(`/api/marketplace/get_orders.php?user_id=${userId}&role=expert`);
            const data = await response.json();
            if (data.status === 'success') {
                setOrders(data.orders);
                const earned = data.orders
                    .filter(o => o.status === 'delivered')
                    .reduce((sum, o) => sum + parseFloat(o.amount), 0);
                setTotalEarned(earned);
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
        } finally {
            setLoading(false);
        }
    };

    const openTrackingModal = (order) => {
        setTrackingModal({ show: true, order });
        setTrackingLink(order.tracking_link || '');
        setTrackingId(order.tracking_id || '');
    };

    const handleSaveTracking = async () => {
        try {
            const resp = await fetch('/api/marketplace/set_tracking.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    order_id: trackingModal.order.id, 
                    expert_id: user.id, 
                    tracking_link: trackingLink, 
                    tracking_id: trackingId 
                })
            });
            const data = await resp.json();
            if (data.status === 'success') {
                showToast('tracking', 'Tracking information updated successfully', 'success');
                setTrackingModal({ show: false, order: null });
                fetchOrders(user.id);
            } else {
                showToast('tracking_err', data.message || 'Failed to update tracking', 'error');
            }
        } catch (err) {
            showToast('tracking_err', 'Error saving tracking information', 'error');
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = (
            order.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.seeker_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id?.toString().includes(searchTerm)
        );
        const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (loading) return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress color="warning" />
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <BlockingOverlay />
            <MarketplaceSidebar user={user} role="expert" />

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
                        Store Manager
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontWeight: 600, mt: 1 }}>Track item deliveries, manage fulfillment, and view your store performance.</Typography>
                </Box>

                {/* Stats Dashboard */}
                <Grid container spacing={3} sx={{ mb: 6 }}>
                    {[
                        { label: 'Store Earnings', value: `₹${totalEarned.toLocaleString()}`, icon: <TrendingUp size={22} />, color: '#10b981', bg: '#ecfdf5' },
                        { label: 'Total Volume', value: orders.length, icon: <ShoppingBag size={22} />, color: '#3b82f6', bg: '#eff6ff' },
                        { label: 'Items to Ship', value: orders.filter(o => o.status === 'paid').length, icon: <Truck size={22} />, color: '#f59e0b', bg: '#fffbeb' },
                        { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, icon: <CheckCircle2 size={22} />, color: '#8b5cf6', bg: '#f5f3ff' },
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

                {/* Search & Filter Bar */}
                <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                    <TextField
                        placeholder="Search by buyer name or order tracking ID..."
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
                            '& .MuiTabs-indicator': { height: '100%', borderRadius: 3, bgcolor: '#f59e0b', zIndex: 0 },
                            '& .MuiTab-root': { fontWeight: 900, fontSize: '0.8rem', color: '#64748b', zIndex: 1, '&.Mui-selected': { color: '#fff' }, px: 3, minHeight: 40 }
                        }}
                    >
                        <Tab label="All Sales" value="all" />
                        <Tab label="To Ship" value="paid" />
                        <Tab label="In Transit" value="shipped" />
                        <Tab label="Delivered" value="delivered" />
                    </Tabs>
                </Box>

                {/* Orders List */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <AnimatePresence mode="popLayout">
                        {filteredOrders.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 12, bgcolor: '#fff', borderRadius: 5, border: '1px dashed #e2e8f0' }}>
                                <ShoppingBag size={80} color="#cbd5e1" style={{ marginBottom: 20 }} />
                                <Typography variant="h5" sx={{ color: '#64748b', fontWeight: 950 }}>No sales recorded</Typography>
                                <Typography sx={{ color: '#94a3b8', fontWeight: 600 }}>Once customers purchase your mystical items, they will appear here.</Typography>
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
                                            '&:hover': { transform: 'translateY(-10px)', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.08)', borderColor: '#f59e0b' }
                                        }}>
                                            {/* Product Image Section */}
                                            <Box sx={{ 
                                                width: { xs: '100%', md: 100 }, height: 100, borderRadius: 4, 
                                                bgcolor: '#f8fafc', border: '1px solid #f1f5f9', p: 1, flexShrink: 0,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                overflow: 'hidden'
                                            }}>
                                                <img 
                                                    src={order.product_image ? (order.product_image.startsWith('http') ? order.product_image : `/${order.product_image}`) : (order.product_type === 'course' ? 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=200&fit=crop' : 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&h=200&fit=crop')} 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                                                    alt="Item"
                                                    onError={(e) => {
                                                        e.target.src = order.product_type === 'course' 
                                                            ? 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=200&fit=crop' 
                                                            : 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&h=200&fit=crop';
                                                    }}
                                                />
                                            </Box>

                                            {/* Order Details Section */}
                                            <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1, alignItems: 'center' }}>
                                                    <Chip label={`#SALE-${order.id}`} size="small" sx={{ fontWeight: 950, bgcolor: '#f1f5f9', color: '#64748b', borderRadius: '8px', fontSize: '0.65rem' }} />
                                                    <Chip 
                                                        label={order.product_type === 'course' ? "COURSE" : "PRODUCT"} 
                                                        size="small" 
                                                        sx={{ 
                                                            fontWeight: 950, 
                                                            bgcolor: order.product_type === 'course' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(100, 116, 139, 0.1)', 
                                                            color: order.product_type === 'course' ? '#0ea5e9' : '#64748b', 
                                                            borderRadius: '8px', 
                                                            fontSize: '0.65rem' 
                                                        }} 
                                                    />
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

                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', mt: 1.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Avatar sx={{ width: 24, height: 24, bgcolor: '#3b82f6', fontSize: '0.7rem', fontWeight: 900 }}>{order.seeker_name?.charAt(0)}</Avatar>
                                                        <Box>
                                                            <Typography variant="body2" sx={{ fontWeight: 900, color: '#1e293b' }}>{order.seeker_name}</Typography>
                                                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase' }}>Customer</Typography>
                                                        </Box>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Calendar size={14} color="#94a3b8" />
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8' }}>
                                                            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>

                                            {/* Pricing & State */}
                                            <Box sx={{ textAlign: { xs: 'left', md: 'right' }, width: { xs: '100%', md: 'auto' }, borderLeft: { md: '1px solid #f1f5f9' }, pl: { md: 4 }, minWidth: 150 }}>
                                                <Typography variant="h4" sx={{ fontWeight: 950, color: '#0f172a', letterSpacing: '-1.5px' }}>₹{parseFloat(order.amount).toLocaleString('en-IN')}</Typography>
                                                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'flex-end' }, gap: 0.5 }}>
                                                    <Chip 
                                                        icon={sc.icon}
                                                        label={sc.label} 
                                                        size="small" 
                                                        sx={{ fontWeight: 950, bgcolor: sc.bgcolor, color: sc.color, px: 1, border: `1px solid ${sc.color}40`, height: 26 }} 
                                                    />
                                                </Box>
                                            </Box>

                                            {/* Fulfillment Actions */}
                                            <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', md: 'auto' }, justifyContent: 'flex-end' }}>
                                                {order.product_type !== 'course' && (order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered') && (
                                                    <Button 
                                                        variant="contained" 
                                                        onClick={() => openTrackingModal(order)}
                                                        sx={{ 
                                                            bgcolor: '#0f172a', color: '#fff', py: 1.5, px: 3, borderRadius: '14px', fontWeight: 950, textTransform: 'none',
                                                            '&:hover': { bgcolor: '#1e293b', transform: 'translateY(-2px)' }, transition: '0.3s'
                                                        }}
                                                        startIcon={<Truck size={18} />}
                                                    >
                                                        {order.tracking_id ? 'Update Tracking' : 'Fulfill & Dispatch'}
                                                    </Button>
                                                )}
                                                <IconButton 
                                                    sx={{ bgcolor: '#f8fafc', color: '#64748b', borderRadius: '14px', width: 48, height: 48 }}
                                                    onClick={() => navigate(`/occult/product/${order.product_id}`)}
                                                >
                                                    <ChevronRight size={22} />
                                                </IconButton>
                                            </Box>
                                        </Paper>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </Box>
            </Box>

            {/* Tracking Update Modal */}
            <Dialog 
                open={trackingModal.show} 
                onClose={() => setTrackingModal({ show: false, order: null })} 
                maxWidth="sm" 
                fullWidth 
                sx={{ '& .MuiDialog-paper': { borderRadius: '28px', p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 950, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ bgcolor: '#f59e0b10', p: 1.5, borderRadius: 3, display: 'flex' }}>
                        <Truck size={24} color="#f59e0b" />
                    </Box>
                    Fulfillment Status
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: '#64748b', fontWeight: 600, mb: 4 }}>Provide tracking details to notify <strong style={{ color: '#0f172a' }}>{trackingModal.order?.seeker_name}</strong> about their shipment.</Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            fullWidth
                            label="Tracking / Courier Link"
                            placeholder="https://shiprocket.co/tracking/..."
                            value={trackingLink}
                            onChange={(e) => setTrackingLink(e.target.value)}
                            InputProps={{ sx: { borderRadius: 3, fontWeight: 800 } }}
                        />
                        <TextField
                            fullWidth
                            label="Tracking ID / AWB"
                            placeholder="e.g., AWB123456789"
                            value={trackingId}
                            onChange={(e) => setTrackingId(e.target.value)}
                            InputProps={{ sx: { borderRadius: 3, fontWeight: 800 } }}
                        />

                        <Box sx={{ bgcolor: '#eff6ff', p: 2, borderRadius: 4, display: 'flex', gap: 2, alignItems: 'flex-start', border: '1px solid #dbeafe' }}>
                            <Info size={20} color="#3b82f6" />
                            <Typography variant="body2" sx={{ color: '#1e40af', fontWeight: 800 }}>
                                Saving these details will automatically send a notification and tracking link to the customer.
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, gap: 1 }}>
                    <Button onClick={() => setTrackingModal({ show: false, order: null })} sx={{ fontWeight: 900, color: '#64748b' }}>Discard</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSaveTracking}
                        sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#ea580c' }, borderRadius: 3, px: 4, py: 1.2, fontWeight: 950 }}
                    >
                        Confirm Shipment
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
