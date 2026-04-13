import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Grid, 
    Paper, CircularProgress, IconButton, useTheme, useMediaQuery
} from '@mui/material';
import { X as CloseIcon, Zap, Wallet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../services/ToastService';

const CreditPlansDialog = ({ open, onClose, userId, expertId }) => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [requestingId, setRequestingId] = useState(null);
    const { showToast } = useToast();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        if (open) {
            fetchPlans();
        }
    }, [open, expertId]);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const url = expertId 
                ? `/api/marketplace/get_credit_plans.php?expert_id=${expertId}`
                : '/api/marketplace/get_credit_plans.php';
            const response = await fetch(url);
            const data = await response.json();
            if (data.status === 'success') {
                setPlans(data.data);
            } else {
                showToast('Failed to load plans', 'error');
            }
        } catch (err) {
            console.error('Error fetching plans:', err);
            showToast('Error connecting to server', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestPurchase = async (plan) => {
        setRequestingId(plan.id);
        try {
            const res = await fetch('/api/marketplace/save_credit_payment.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, plan_id: plan.id })
            });
            const data = await res.json();
            if (data.status === 'success') {
                const orderId = `CREDIT_${data.id}_${Date.now()}`;
                const returnUrl = encodeURIComponent(window.location.href);
                window.location.href = `/phonepe-payment?amount=${data.amount}&order_id=${orderId}&type=CREDIT&return_url=${returnUrl}`;
            } else {
                showToast(data.message || 'Failed to initiate purchase', 'error');
            }
        } catch (err) {
            showToast('Request failed. Try again.', 'error');
        } finally {
            setRequestingId(null);
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { 
                    borderRadius: '40px', 
                    overflow: 'hidden',
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.25)',
                    minHeight: '70vh'
                }
            }}
        >
            <DialogTitle sx={{ p: 0 }}>
                <Box sx={{ 
                    p: { xs: 2.5, md: 3 }, 
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)', 
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Decorative abstract shapes */}
                    <Box sx={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(60px)' }} />
                    <Box sx={{ position: 'absolute', bottom: -50, left: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', filter: 'blur(40px)' }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, zIndex: 1 }}>
                        <Box sx={{ 
                            p: 1.5, 
                            bgcolor: 'rgba(255,255,255,0.15)', 
                            borderRadius: '16px', 
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                        }}>
                            <Wallet size={28} strokeWidth={1.5} />
                        </Box>
                        <Box>
                            <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-0.04em', mb: 0.5, fontSize: { xs: '1.4rem', md: '1.8rem' }, textShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                Recharge Credits
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500, fontSize: { xs: '0.85rem', md: '0.95rem' }, maxWidth: 500, lineHeight: 1.3 }}>
                                Choose a premium plan to continue your spiritual journey with our experts
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)', transform: 'rotate(90deg)' }, transition: '0.4s all', zIndex: 1 }}>
                        <CloseIcon size={28} />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
                        <CircularProgress size={60} sx={{ color: '#6366f1' }} />
                        <Typography sx={{ mt: 3, color: 'text.secondary', fontWeight: 700, fontSize: '1.2rem' }}>Fetching best plans for you...</Typography>
                    </Box>
                ) : plans.length === 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, textAlign: 'center' }}>
                        <Box sx={{ 
                            p: 3, 
                            bgcolor: 'rgba(245, 158, 11, 0.08)', 
                            borderRadius: '50%', 
                            mb: 2,
                            border: '2px dashed rgba(245, 158, 11, 0.3)'
                        }}>
                             <AlertCircle size={48} color="#f59e0b" />
                        </Box>
                        <Typography variant="h5" fontWeight={900} color="#1e293b" gutterBottom>No Plans Available</Typography>
                        <Typography color="textSecondary" sx={{ maxWidth: 400, fontWeight: 500, mb: 3 }}>
                            This expert hasn't created any custom credit plans yet. Please check back later or contact support.
                        </Typography>
                        <Button 
                            variant="outlined" 
                            onClick={onClose}
                            sx={{ borderRadius: '12px', textTransform: 'none', px: 4, fontWeight: 700 }}
                        >
                            Go Back
                        </Button>
                    </Box>
                ) : (
                    <Grid container spacing={2.5} justifyContent="center" sx={{ mb: 2, mt: '80px' }}>
                        {plans.map((plan, index) => (
                            <Grid item xs={12} sm={6} md={plans.length >= 4 ? 3 : 4} key={plan.id}>
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.5 }}
                                    style={{ height: '100%' }}
                                >
                                    <Paper sx={{ 
                                        p: 3, 
                                        borderRadius: '32px', 
                                        height: '100%',
                                        minHeight: { xs: 'auto', md: '480px' },
                                        display: 'flex',
                                        flexDirection: 'column',
                                        border: '1px solid rgba(226, 232, 240, 0.8)',
                                        background: 'rgba(255, 255, 255, 0.7)',
                                        backdropFilter: 'blur(10px)',
                                        transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&:hover': {
                                            transform: 'translateY(-8px)',
                                            boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.25)',
                                            borderColor: '#6366f1',
                                            '& .plan-icon-bg': { transform: 'scale(1.1) rotate(5deg)', bgcolor: 'rgba(99, 102, 241, 0.12)' }
                                        }
                                    }}>
                                        {/* Ribbon for Popularity (conditional) */}
                                        {plan.plan_name.toLowerCase().includes('value') && (
                                            <Box sx={{ 
                                                position: 'absolute', top: 15, right: -25, bgcolor: '#f59e0b', color: 'white', px: 4, py: 0.25, 
                                                transform: 'rotate(45deg)', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.05em', boxShadow: '0 4px 8px rgba(245, 158, 11, 0.2)'
                                            }}>
                                                BEST VALUE
                                            </Box>
                                        )}
                                        <Typography variant="h6" fontWeight={900} color="#0f172a" sx={{ mb: 0.5, fontSize: '1.2rem', letterSpacing: '-0.01em' }}>
                                            {plan.plan_name}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 2 }}>
                                            <Typography variant="h3" fontWeight={950} sx={{ 
                                                background: 'linear-gradient(135deg, #1e293b 0%, #6366f1 100%)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                fontSize: '2.2rem'
                                            }}>
                                                ₹{parseFloat(plan.price).toFixed(0)}
                                            </Typography>
                                            <Typography variant="caption" fontWeight={900} color="text.secondary" sx={{ letterSpacing: '0.1em', opacity: 0.6, fontSize: '0.7rem' }}>
                                                ONCE
                                            </Typography>
                                        </Box>
                                        <Box sx={{ mb: 2.5, flexGrow: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                                <Box className="plan-icon-bg" sx={{ 
                                                    p: 1, 
                                                    bgcolor: 'rgba(245, 158, 11, 0.08)', 
                                                    borderRadius: '12px',
                                                    transition: '0.3s all'
                                                }}>
                                                    <Zap size={18} color="#f59e0b" fill="#f59e0b" />
                                                </Box>
                                                <Typography variant="body2" fontWeight={800} color="#334155" sx={{ fontSize: '0.95rem' }}>
                                                    {plan.credits} <span style={{ opacity: 0.6, fontWeight: 600 }}>Credits</span>
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                                <Box sx={{ p: 1, bgcolor: 'rgba(34, 197, 94, 0.08)', borderRadius: '12px' }}>
                                                    <CheckCircle2 size={18} color="#22c55e" />
                                                </Box>
                                                <Typography variant="body2" fontWeight={700} color="#64748b" sx={{ fontSize: '0.85rem' }}>
                                                    Instant Activation
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box sx={{ p: 1, bgcolor: 'rgba(99, 102, 241, 0.08)', borderRadius: '12px' }}>
                                                    <CheckCircle2 size={18} color="#6366f1" />
                                                </Box>
                                                <Typography variant="body2" fontWeight={700} color="#64748b" sx={{ fontSize: '0.85rem' }}>
                                                    Full Expert Access
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ mt: 'auto' }}>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                onClick={() => handleRequestPurchase(plan)}
                                                disabled={requestingId === plan.id}
                                                sx={{ 
                                                    borderRadius: '16px',
                                                    py: 1.5,
                                                    textTransform: 'none',
                                                    fontWeight: 900,
                                                    fontSize: '0.95rem',
                                                    bgcolor: '#6366f1',
                                                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                                    '&:hover': { 
                                                        bgcolor: '#4f46e5', 
                                                        boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)',
                                                        transform: 'scale(1.02)'
                                                    },
                                                    boxShadow: '0 4px 12px -2px rgba(99, 102, 241, 0.3)',
                                                    transition: '0.3s all'
                                                }}
                                            >
                                                {requestingId === plan.id ? <CircularProgress size={22} color="inherit" /> : 'Buy Now'}
                                            </Button>
                                        </Box>
                                    </Paper>
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </DialogContent>
            
            <DialogActions sx={{ p: { xs: 2.5, md: 3 }, pt: 0, justifyContent: 'center' }}>
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5, 
                    p: 1.5, 
                    bgcolor: 'rgba(245, 158, 11, 0.08)', 
                    borderRadius: '16px',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    width: '100%',
                    backdropFilter: 'blur(5px)'
                }}>
                    <AlertCircle size={20} color="#f59e0b" />
                    <Typography variant="body2" sx={{ color: '#92400e', fontWeight: 600, fontSize: '0.85rem' }}>
                        Need a custom plan or help with payment? <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Contact support</span> for immediate assistance.
                    </Typography>
                </Box>
            </DialogActions>
        </Dialog>
    );
};

export default CreditPlansDialog;
