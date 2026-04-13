import React, { useState, useEffect } from 'react';
import {
    Box, Typography, CircularProgress, Grid, Divider, Avatar, 
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button
} from '@mui/material';
import { Wallet, Zap, AlertCircle, ShoppingBag, History, TrendingUp, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MarketplaceSidebar from '../../components/MarketplaceSidebar';
import { useToast } from '../../services/ToastService';
import './UserWallet.css';

export default function UserWallet() {
    const navigate = useNavigate();
    const [credits, setCredits] = useState(0);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [expertPlans, setExpertPlans] = useState([]);
    const [plansLoading, setPlansLoading] = useState(true);
    const [userRequests, setUserRequests] = useState([]);
    const [requesting, setRequesting] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, plan: null, expertName: '' });
    const { showToast } = useToast();

    useEffect(() => {
        const storedUser = localStorage.getItem('occult_user');
        if (!storedUser) {
            navigate('/occult/login');
        } else {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchCredits(parsedUser.id);
            fetchExpertPlans(parsedUser.id);
            fetchUserRequests(parsedUser.id);
        }
    }, [navigate]);

    const fetchCredits = async (userId) => {
        try {
            const response = await fetch(`/api/marketplace/get_user_credits.php?user_id=${userId}`);
            const data = await response.json();
            if (data.status === 'success') {
                setCredits(data.credits);
            }
        } catch (err) {
            console.error('Wallet fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchExpertPlans = async (userId) => {
        setPlansLoading(true);
        try {
            const res = await fetch(`/api/marketplace/get_followed_experts.php?user_id=${userId}`);
            const data = await res.json();
            if (data.status === 'success' && data.data.length > 0) {
                const experts = data.data;
                const planRequests = experts.map(expert =>
                    fetch(`/api/marketplace/get_credit_plans.php?expert_id=${expert.user_id}`)
                        .then(r => r.json())
                        .then(planData => ({
                            expert,
                            plans: planData.status === 'success' ? planData.data : []
                        }))
                        .catch(() => ({ expert, plans: [] }))
                );
                const results = await Promise.all(planRequests);
                const withPlans = results.filter(r => r.plans.length > 0);
                setExpertPlans(withPlans);
            } else {
                setExpertPlans([]);
            }
        } catch (err) {
            console.error('Error fetching expert plans', err);
            setExpertPlans([]);
        } finally {
            setPlansLoading(false);
        }
    };

    const fetchUserRequests = async (userId) => {
        try {
            const res = await fetch(`/api/marketplace/get_user_credit_requests.php?user_id=${userId}`);
            const data = await res.json();
            if (data.status === 'success') setUserRequests(data.data);
        } catch (err) { console.error('Error fetching requests', err); }
    };

    const handlePurchaseRequest = (plan, expertName) => {
        setConfirmDialog({ open: true, plan, expertName: expertName || 'Expert' });
    };

    const confirmPurchase = async () => {
        const plan = confirmDialog.plan;
        if (!plan) return;

        setRequesting(true);
        try {
            const res = await fetch('/api/marketplace/save_credit_payment.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, plan_id: plan.id })
            });
            const data = await res.json();
            if (data.status === 'success') {
                const orderId = `CREDIT_${data.id}_${Date.now()}`;
                const returnUrl = encodeURIComponent(window.location.href);
                window.location.href = `/phonepe-payment?amount=${data.amount}&order_id=${orderId}&type=CREDIT&return_url=${returnUrl}`;
            } else {
                showToast('error', data.message || 'Failed to initiate purchase');
            }
        } catch (err) {
            showToast('error', 'Request failed. Try again.');
        } finally {
            setRequesting(false);
            setConfirmDialog({ open: false, plan: null, expertName: '' });
        }
    };

    if (loading) return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc' }}>
            <CircularProgress color="warning" />
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f8fafc', minHeight: '100vh', width: '100%' }}>
            <MarketplaceSidebar user={user} role="user" />

            <Box className="user-wallet-container" sx={{ flex: 1, pt: { xs: 12, md: 4 } }}>
                {/* Balance Card */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="premium-wallet-card"
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                        <Box>
                            <Typography className="balance-label">Current Balance</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Zap size={36} fill="#f59e0b" color="#f59e0b" />
                                <Typography className="balance-amount" sx={{ m: 0 }}>
                                    {credits} <span style={{ fontSize: '1.5rem', color: '#94a3b8', fontWeight: 700 }}>Credits</span>
                                </Typography>
                            </Box>
                            <Typography className="balance-info" sx={{ mt: 2 }}>
                                Use these credits for instant messaging and consultations with your favorite experts. 1 credit = 1 response.
                            </Typography>
                        </Box>
                        <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '20px', display: { xs: 'none', md: 'block' } }}>
                            <Wallet size={48} color="rgba(245, 158, 11, 0.4)" />
                        </Box>
                    </Box>
                </motion.div>

                {/* Buy Credits Section */}
                <Box sx={{ mt: 6, mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a' }}>Available Credits Packages</Typography>
                </Box>


                {plansLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 6, justifyContent: 'center' }}>
                        <CircularProgress size={24} sx={{ color: '#6366f1' }} />
                        <Typography color="textSecondary" fontWeight={600}>Fetching unique plans...</Typography>
                    </Box>
                ) : expertPlans.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8, px: 2, bgcolor: '#fff', borderRadius: '24px', border: '1px dashed #cbd5e1' }}>
                        <Typography variant="h6" fontWeight={800} color="#64748b" gutterBottom>No Plans Found</Typography>
                        <Typography color="textSecondary" sx={{ mb: 3 }}>Follow more experts to see their exclusive credit packages here.</Typography>
                        <Button variant="contained" onClick={() => navigate('/occult/community')} sx={{ borderRadius: '10px', bgcolor: '#6366f1', textTransform: 'none', fontWeight: 800 }}>Browse Experts</Button>
                    </Box>
                ) : (
                    expertPlans.map(({ expert, plans }) => (
                        <div key={expert.user_id} className="expert-plan-section">
                            <div className="expert-info-bar">
                                <Avatar src={expert.profile_image ? `/${expert.profile_image}` : null} sx={{ width: 44, height: 44, fontWeight: 900, bgcolor: '#f59e0b', fontSize: '1.2rem' }}>{expert.name?.charAt(0)}</Avatar>
                                <Box>
                                    <Typography fontWeight={900} color="#1e293b">{expert.name}</Typography>
                                    <Typography variant="caption" color="textSecondary" fontWeight={700}>{expert.primary_skill || 'Spiritual Expert'}</Typography>
                                </Box>
                                <Divider sx={{ flex: 1, ml: 2, opacity: 0.5 }} />
                            </div>

                            <div className="plan-grid">
                                {plans.map((plan, idx) => (
                                    <motion.div 
                                        key={plan.id}
                                        whileHover={{ y: -5 }}
                                        className="premium-plan-card"
                                    >
                                        <Typography className="plan-name">{plan.plan_name}</Typography>
                                        <div className="plan-credits">
                                            <Zap size={14} fill="#f59e0b" color="#f59e0b" />
                                            {plan.credits} Interaction Credits
                                        </div>
                                        <Typography className="plan-price">₹{parseFloat(plan.price).toLocaleString()}</Typography>
                                        <button 
                                            className="buy-button"
                                            onClick={() => handlePurchaseRequest(plan, expert.name)}
                                        >
                                            Purchase Now
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))
                )}

                {/* History Section */}
                <Box sx={{ mt: 8, mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a' }}>Purchase History</Typography>
                </Box>


                <Box sx={{ overflowX: 'auto' }}>
                    <div className="history-table-container">
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>Plan Details</th>
                                    <th>Credits</th>
                                    <th>Amount</th>
                                    <th>Approval</th>
                                    <th>Payment</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>No transactions recorded yet.</td>
                                    </tr>
                                ) : (
                                    userRequests.map(req => (
                                        <tr key={req.id}>
                                            <td>{req.plan_name}</td>
                                            <td>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#f59e0b', fontWeight: 800 }}>
                                                    <Zap size={14} fill="#f59e0b" /> {req.credits}
                                                </Box>
                                            </td>
                                            <td style={{ fontWeight: 900 }}>₹{parseFloat(req.amount).toLocaleString()}</td>
                                            <td>
                                                <span className={`status-chip status-${req.status}`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td>
                                                <Typography sx={{ 
                                                    fontSize: '0.7rem', 
                                                    fontWeight: 900, 
                                                    color: req.payment_status === 'completed' ? '#16a34a' : '#ef4444',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {req.payment_status || 'PENDING'}
                                                </Typography>
                                            </td>
                                            <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                                                {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Box>
            </Box>

            {/* Purchase Confirmation Dialog */}
            <Dialog 
                open={confirmDialog.open} 
                onClose={() => !requesting && setConfirmDialog({ open: false, plan: null, expertName: '' })}
                PaperProps={{ sx: { borderRadius: '24px', p: 1, minWidth: { xs: '90%', sm: 400 } } }}
            >
                <DialogTitle sx={{ fontWeight: 950, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1.5, pt: 3 }}>
                    <AlertCircle size={28} color="#6366f1" /> Confirm Purchase
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 3, fontWeight: 600 }}>
                        You are about to purchase credits from <strong>{confirmDialog.expertName}</strong>. This will allow you to interact directly with them.
                    </DialogContentText>
                    {confirmDialog.plan && (
                        <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                            <Typography fontWeight={900} color="#1e293b">{confirmDialog.plan.plan_name}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, mb: 1.5 }}>
                                <Zap size={14} fill="#f59e0b" color="#f59e0b" />
                                <Typography variant="body2" color="textSecondary" fontWeight={700}>{confirmDialog.plan.credits} Interaction Credits</Typography>
                            </Box>
                            <Typography variant="h4" fontWeight={950} color="#6366f1">₹{parseFloat(confirmDialog.plan.price).toLocaleString()}</Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
                    <Button 
                        onClick={() => setConfirmDialog({ open: false, plan: null, expertName: '' })} 
                        disabled={requesting}
                        sx={{ color: '#64748b', fontWeight: 800, textTransform: 'none' }}
                    >
                        Maybe Later
                    </Button>
                    <Button 
                        onClick={confirmPurchase} 
                        variant="contained" 
                        disabled={requesting}
                        sx={{ bgcolor: '#0f172a', borderRadius: '12px', px: 4, py: 1, fontWeight: 900, textTransform: 'none', '&:hover': { bgcolor: '#f59e0b' } }}
                    >
                        {requesting ? 'Processing...' : 'Confirm & Proceed to Pay'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
