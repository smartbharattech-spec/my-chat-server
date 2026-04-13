import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Backdrop, CircularProgress, IconButton } from '@mui/material';
import { ShieldAlert, IndianRupee, ArrowRight, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const BlockingOverlay = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isBlocked, setIsBlocked] = useState(false);
    const [isWarning, setIsWarning] = useState(false);
    const [daysRemaining, setDaysRemaining] = useState(null);
    const [blockReason, setBlockReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [showWarning, setShowWarning] = useState(true);

    // Don't show overlay on the billing page itself
    const isBillingPage = location.pathname.includes('/occult/expert-bills');

    useEffect(() => {
        const checkStatus = async () => {
            const storedUser = localStorage.getItem('occult_user');
            if (!storedUser) return;
            
            const user = JSON.parse(storedUser);
            if (user.role !== 'expert') {
                setLoading(false);
                return;
            }

            try {
                // Fetch fresh status from backend to ensure real-time blocking
                const res = await fetch(`/api/marketplace/expert_billing.php?action=get_block_status&expert_id=${user.id}`);
                const data = await res.json();
                
                if (data.status === 'success') {
                    setIsBlocked(parseInt(data.is_blocked) === 1);
                    setIsWarning(data.is_warning);
                    setDaysRemaining(data.days_remaining);
                    setBlockReason(data.block_reason || 'Please settle your pending commissions to restore access.');
                    
                    // Update local storage status
                    const updatedUser = { ...user, is_blocked: data.is_blocked, block_reason: data.block_reason };
                    localStorage.setItem('occult_user', JSON.stringify(updatedUser));
                }
            } catch (err) {
                console.error("Failed to check block status", err);
            } finally {
                setLoading(false);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 30000);
        return () => clearInterval(interval);
    }, [location.pathname]);

    if (loading) return null;
    if (isBillingPage) return null;

    // Hard Block State
    if (isBlocked) {
        return (
            <Backdrop
                open={true}
                sx={{
                    zIndex: 9999,
                    color: '#fff',
                    // Full red background as requested
                    background: 'radial-gradient(circle at center, #991b1b, #7f1d1d)',
                    display: 'flex',
                    flexDirection: 'column',
                    p: 3
                }}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                >
                    <Paper
                        sx={{
                            p: { xs: 4, md: 6 },
                            borderRadius: '40px',
                            maxWidth: '550px',
                            textAlign: 'center',
                            bgcolor: 'white',
                            boxShadow: '0 0 100px rgba(0,0,0,0.5)',
                            border: '5px solid #ef4444'
                        }}
                    >
                        <Box sx={{ 
                            display: 'inline-flex', p: 3, borderRadius: '50%', 
                            bgcolor: '#fee2e2', color: '#ef4444', mb: 4 
                        }}>
                            <ShieldAlert size={80} strokeWidth={2.5} />
                        </Box>

                        <Typography variant="h3" fontWeight="950" sx={{ mb: 2, color: '#7f1d1d', letterSpacing: '-1.5px', textTransform: 'uppercase' }}>
                            ACCESS RESTRICTED
                        </Typography>
                        
                        <Typography variant="h6" sx={{ mb: 4, color: '#334155', fontWeight: 600, lineHeight: 1.4 }}>
                            {blockReason}
                        </Typography>

                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            onClick={() => navigate('/occult/expert-bills')}
                            endIcon={<ArrowRight size={20} />}
                            sx={{
                                py: 2.5, borderRadius: '20px', bgcolor: '#ef4444', fontWeight: '900',
                                textTransform: 'none', fontSize: '1.2rem',
                                '&:hover': { bgcolor: '#991b1b', transform: 'scale(1.02)' },
                                transition: 'all 0.3s'
                            }}
                        >
                            Pay Bills Now
                        </Button>
                    </Paper>
                </motion.div>
            </Backdrop>
        );
    }

    // Warning State (Grace Period)
    if (isWarning && showWarning) {
        return (
            <AnimatePresence>
                <Box
                    component={motion.div}
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 2000,
                        bgcolor: '#f59e0b',
                        color: 'white',
                        px: { xs: 1.5, sm: 4 },
                        py: { xs: 1, sm: 1.5 },
                        display: 'flex',
                        flexDirection: { xs: 'row', sm: 'row' },
                        flexWrap: { xs: 'wrap', sm: 'nowrap' },
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: { xs: 1.5, sm: 3 },
                        boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)',
                        fontWeight: 800,
                        fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem' },
                        textAlign: { xs: 'center', sm: 'left' }
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flex: { xs: '1 1 100%', sm: 'auto' }, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                        <motion.div
                            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                            transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                        >
                            <ShieldAlert size={isWarning && daysRemaining < 2 ? 20 : 24} />
                        </motion.div>
                        <Typography sx={{ fontWeight: 800, fontSize: 'inherit', lineHeight: 1.2 }}>
                            PAYMENT DUE: Restricted in <span style={{ textDecoration: 'underline', color: '#0f172a' }}>{daysRemaining} days</span>
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', sm: 'auto' }, justifyContent: 'center' }}>
                        <Button
                            size="small"
                            variant="contained"
                            onClick={() => navigate('/occult/expert-bills')}
                            sx={{ 
                                bgcolor: 'white', 
                                color: '#f59e0b', 
                                fontWeight: 900, 
                                borderRadius: '8px',
                                textTransform: 'none',
                                px: { xs: 2, sm: 3 },
                                py: 0.5,
                                fontSize: '0.75rem',
                                '&:hover': { bgcolor: '#fff' },
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Pay Bills
                        </Button>
                        <IconButton 
                            size="small" 
                            onClick={() => setShowWarning(false)}
                            sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                        >
                            <X size={20} />
                        </IconButton>
                    </Box>
                </Box>
            </AnimatePresence>
        );
    }

    return null;
};

export default BlockingOverlay;
