import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, ArrowDownCircle, CheckCircle, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MarketplaceSidebar from '../../components/MarketplaceSidebar';
import BlockingOverlay from '../../components/BlockingOverlay';
import { useToast } from '../../services/ToastService';
import './OccultExpertPremium.css';
import './ExpertWallet.css';

export default function ExpertWallet() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [openWithdraw, setOpenWithdraw] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem('occult_user');
        if (!storedUser) {
            navigate('/occult/login');
        } else {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchWallet(parsedUser.id);
        }
    }, [navigate]);

    const fetchWallet = async (expertId) => {
        try {
            const response = await fetch(`/api/marketplace/get_wallet.php?expert_id=${expertId}`);
            const data = await response.json();
            if (data.status === 'success') {
                setWallet(data.wallet);
                setTransactions(data.transactions);
            }
        } catch (err) {
            console.error('Wallet fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async () => {
        const amount = parseFloat(withdrawAmount);
        if (!amount || amount <= 0 || (wallet && amount > parseFloat(wallet.balance))) {
            showToast('invalid_amount', 'Invalid withdrawal amount.', 'warning');
            return;
        }

        try {
            const response = await fetch('/api/marketplace/request_withdrawal.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expert_id: user.id, amount })
            });
            const data = await response.json();
            if (data.status === 'success') {
                showToast('withdraw_success', 'Withdrawal request submitted!', 'success');
                setOpenWithdraw(false);
                setWithdrawAmount('');
                fetchWallet(user.id);
            } else {
                showToast('withdraw_error', data.message, 'error');
            }
        } catch (err) {
            showToast('network_error', 'Request failed. Try again.', 'error');
        }
    };

    if (loading) return (
        <div className="expert-wallet-loader-container">
            <div className="expert-wallet-spinner"></div>
        </div>
    );

    return (
        <div className="premium-dashboard-container" style={{ display: 'flex' }}>
            <BlockingOverlay />
            <MarketplaceSidebar user={user} role="expert" />

            <div className="premium-main-wrapper">
                <div className="premium-content-area" style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    {/* Header */}
                    <div className="premium-header animate-fade-in">
                        <h1 className="premium-title">
                            <Wallet size={42} color="#f59e0b" strokeWidth={2.5} />
                            My Financials
                        </h1>
                        <p className="premium-subtitle">Manage your earnings, view payouts, and request withdrawals.</p>
                    </div>

                    {/* Balance Cards */}
                    <div className="expert-wallet-grid animate-fade-in">
                        <div className="premium-metric-card dark">
                            <div className="premium-metric-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)' }}>
                                <Wallet size={32} color="#f59e0b" />
                            </div>
                            <div className="premium-metric-value">₹{parseFloat(wallet?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                            <div className="premium-metric-label">Available Balance</div>
                            <button
                                className="premium-btn-primary"
                                style={{ marginTop: '1.5rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', border: 'none', cursor: 'pointer' }}
                                onClick={() => setOpenWithdraw(true)}
                            >
                                <ArrowDownCircle size={18} />
                                Request Payout
                            </button>
                        </div>

                        <div className="premium-metric-card">
                            <div className="premium-metric-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
                                <TrendingUp size={32} />
                            </div>
                            <div className="premium-metric-value" style={{ color: '#10b981' }}>₹{parseFloat(wallet?.total_earned || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                            <div className="premium-metric-label">Life-time Earnings</div>
                        </div>

                        <div className="premium-metric-card">
                            <div className="premium-metric-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
                                <TrendingDown size={32} />
                            </div>
                            <div className="premium-metric-value" style={{ color: '#ef4444' }}>₹{parseFloat(wallet?.total_withdrawn || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                            <div className="premium-metric-label">Total Withdrawn</div>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <h2 className="premium-section-title animate-fade-in">Recent Transactions</h2>
                    
                    {transactions.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="premium-glass-card" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                            <div style={{ background: '#f1f5f9', width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <Clock size={40} style={{ color: '#94a3b8' }} strokeWidth={1.5} />
                            </div>
                            <p style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 600 }}>Your transaction history is currently empty.</p>
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem' }}>Start earning from your services to see transactions here.</p>
                        </motion.div>
                    ) : (
                        <div className="premium-glass-card animate-fade-in">
                            <AnimatePresence>
                                {transactions.map((tx, idx) => (
                                    <motion.div key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <div className="premium-list-item">
                                            <div className="premium-item-icon" style={{ backgroundColor: tx.type === 'credit' ? '#ecfdf5' : '#fef2f2' }}>
                                                {tx.type === 'credit'
                                                    ? <CheckCircle size={24} color="#10b981" />
                                                    : <ArrowDownCircle size={24} color="#ef4444" />
                                                }
                                            </div>
                                            <div className="premium-item-info">
                                                <div className="premium-item-title">{tx.description}</div>
                                                <div className="premium-item-meta">
                                                    <span>{new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                    <span>•</span>
                                                    <span>ID: #{tx.id}</span>
                                                </div>
                                            </div>
                                            <div className="premium-item-value" style={{ color: tx.type === 'credit' ? '#10b981' : '#ef4444' }}>
                                                {tx.type === 'credit' ? '+' : '-'}₹{parseFloat(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                        {idx < transactions.length - 1 && <div className="expert-divider" />}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* Withdraw Modal */}
            <AnimatePresence>
                {openWithdraw && (
                    <div className="expert-modal-overlay" onClick={() => setOpenWithdraw(false)}>
                        <motion.div 
                            className="expert-modal-container" 
                            onClick={e => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        >
                            <div className="expert-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 className="expert-modal-title">Request Payout</h3>
                                <button onClick={() => setOpenWithdraw(false)} className="btn-ghost" style={{ padding: '0.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="expert-modal-body">
                                <p style={{ color: '#64748b', fontWeight: 500, margin: '0 0 1.5rem 0', fontSize: '1rem' }}>
                                    Available balance for withdrawal: <strong style={{ color: '#0f172a' }}>₹{parseFloat(wallet?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                                </p>
                                
                                <div className="expert-input-group">
                                    <label className="expert-label">Amount to withdraw (₹)</label>
                                    <input 
                                        type="number" 
                                        className="expert-input"
                                        placeholder="Enter amount"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        min="1"
                                        max={wallet?.balance}
                                    />
                                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                                        Funds will be transferred to your registered bank account.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="expert-modal-footer">
                                <button className="btn-ghost" onClick={() => setOpenWithdraw(false)}>Cancel</button>
                                <button 
                                    className="premium-btn-primary" 
                                    style={{ border: 'none', cursor: 'pointer', borderRadius: '14px' }}
                                    onClick={handleWithdraw}
                                >
                                    Confirm Payout
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
