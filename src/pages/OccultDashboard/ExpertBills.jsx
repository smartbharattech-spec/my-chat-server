import React, { useState, useEffect, useMemo } from 'react';
import { 
    FileText, Download, Eye, Calendar, User, ShoppingBag, 
    ArrowRight, X, CreditCard, ChevronRight, Printer, Share2, Zap, AlertTriangle,
    CheckCircle2, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MarketplaceSidebar from '../../components/MarketplaceSidebar';
import './OccultExpertPremium.css';
import './ExpertWallet.css';
import './ExpertBills.css';

export default function ExpertBills() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0); // 0: Bills, 1: Sales
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [earnings, setEarnings] = useState([]);
    const [adminBills, setAdminBills] = useState([]);
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockReason, setBlockReason] = useState('');
    const [paying, setPaying] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ show: false, billIdOrIds: null, isBulk: false });

    useEffect(() => {
        const storedUser = localStorage.getItem('occult_user');
        if (!storedUser) {
            navigate('/occult/login');
        } else {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchData(parsedUser.id);
        }
    }, [navigate]);

    const fetchData = async (userId) => {
        setLoading(true);
        try {
            // 1. Fetch Sales (Earnings)
            const side1 = await fetch(`/api/marketplace/get_orders.php?user_id=${userId}&role=expert`);
            const data1 = await side1.json();
            if (data1.status === 'success') setEarnings(data1.orders || []);

            // 2. Fetch Admin Bills
            const side2 = await fetch(`/api/marketplace/expert_billing.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_bills', expert_id: userId })
            });
            const data2 = await side2.json();
            if (data2.status === 'success') {
                setAdminBills(data2.bills || []);
                setIsBlocked(data2.is_blocked);
                setBlockReason(data2.block_reason);
            }
        } catch (err) {
            console.error('Error fetching billing data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePayBill = async (billIdOrIds) => {
        const isBulk = Array.isArray(billIdOrIds);
        setConfirmModal({ show: true, billIdOrIds, isBulk });
    };

    const confirmPayment = async () => {
        const { billIdOrIds, isBulk } = confirmModal;
        setConfirmModal({ show: false, billIdOrIds: null, isBulk: false });
        
        setPaying(true);
        try {
            const endpoint = '/api/marketplace/expert_billing.php';
            const body = isBulk 
                ? { action: 'pay_bills_bulk', expert_id: user.id, bill_ids: billIdOrIds }
                : { action: 'pay_bill', expert_id: user.id, bill_id: billIdOrIds };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            alert(data.message);
            if (data.status === 'success') fetchData(user.id);
        } catch (err) {
            alert("Failed to pay bill.");
        } finally {
            setPaying(false);
        }
    };

    if (loading) return (
        <div className="expert-wallet-loader-container">
            <div className="expert-wallet-spinner"></div>
        </div>
    );

    return (
        <div className="premium-dashboard-container" style={{ display: 'flex' }}>
            <MarketplaceSidebar user={user} role="expert" />

            <div className="premium-main-wrapper">
                <div className="premium-content-area" style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header */}
                <div className="premium-header animate-fade-in">
                    <h1 className="premium-title">
                        <div className="premium-metric-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', marginBottom: 0 }}>
                            <FileText size={32} color="#f59e0b" strokeWidth={2.5} />
                        </div>
                        Billing & Commissions
                    </h1>
                    <p className="premium-subtitle">Manage your earnings and admin commission payments.</p>
                </div>

                {/* Account Blocked Alert */}
                {isBlocked && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        className="expert-alert-error animate-fade-in"
                    >
                        <AlertTriangle className="expert-alert-icon" size={32} />
                        <div>
                            <div style={{ fontWeight: 900, fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Account Blocked</div>
                            <div style={{ opacity: 0.9, marginTop: '0.25rem', fontWeight: 500 }}>{blockReason}</div>
                        </div>
                    </motion.div>
                )}

                {/* Custom Tabs */}
                <div className="expert-tabs-container animate-fade-in">
                    <div 
                        className={`expert-tab ${activeTab === 0 ? 'active' : ''}`} 
                        onClick={() => setActiveTab(0)}
                    >
                        Admin Bills (Dues)
                    </div>
                    <div 
                        className={`expert-tab ${activeTab === 1 ? 'active' : ''}`} 
                        onClick={() => setActiveTab(1)}
                    >
                        My Sales (Earnings)
                    </div>
                </div>

                {/* Content Table Area */}
                <motion.div 
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, cubicBezier: [0.4, 0, 0.2, 1] }}
                    className="animate-fade-in"
                >
                    {activeTab === 0 ? (
                        <AdminBillsTable bills={adminBills} onPay={handlePayBill} paying={paying} />
                    ) : (
                        <EarningsTable earnings={earnings} />
                    )}
                </motion.div>
            </div>
        </div>

            {/* Custom Payment Confirmation Modal */}
            <AnimatePresence>
                {confirmModal.show && (
                    <div className="premium-modal-overlay" onClick={() => setConfirmModal({ show: false, billIdOrIds: null, isBulk: false })}>
                        <motion.div 
                            className="premium-modal"
                            onClick={e => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        >
                            <div className="premium-modal-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
                                        <CreditCard size={24} color="#f59e0b" />
                                    </div>
                                    <h3 className="premium-modal-title">Confirm Payment</h3>
                                </div>
                                <button className="premium-modal-close" onClick={() => setConfirmModal({ show: false, billIdOrIds: null, isBulk: false })}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="premium-modal-body">
                                <p style={{ color: '#475569', fontSize: '1.1rem', lineHeight: 1.6, fontWeight: 500 }}>
                                    {confirmModal.isBulk 
                                        ? `Are you sure you want to pay all ${confirmModal.billIdOrIds.length} pending bills from your wallet balance?`
                                        : "Are you sure you want to settle this bill using your wallet balance?"
                                    }
                                </p>
                                <div style={{ 
                                    marginTop: '1.5rem', 
                                    padding: '1.25rem', 
                                    background: '#f8fafc', 
                                    borderRadius: '16px', 
                                    display: 'flex', 
                                    alignItems: 'flex-start', 
                                    gap: '1rem',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <Info size={20} color="#64748b" style={{ marginTop: '0.2rem' }} />
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>
                                        Transaction will be immediate. This action cannot be undone once confirmed.
                                    </p>
                                </div>
                            </div>
                            <div className="premium-modal-footer">
                                <button className="premium-btn-secondary" onClick={() => setConfirmModal({ show: false, billIdOrIds: null, isBulk: false })}>
                                    Cancel
                                </button>
                                <button className="premium-btn-primary" onClick={confirmPayment}>
                                    Confirm & Pay
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function AdminBillsTable({ bills, onPay, paying }) {
    const processedBills = useMemo(() => {
        const grouped = [];
        const pendingChats = {
            ids: [],
            amount: 0,
            created_at: null,
            status: 'pending',
            activity_type: 'chat_message',
            isGroup: true
        };

        bills.forEach(bill => {
            if (bill.activity_type === 'chat_message' && bill.status === 'pending') {
                pendingChats.ids.push(bill.id);
                pendingChats.amount += parseFloat(bill.amount);
                if (!pendingChats.created_at || new Date(bill.created_at) > new Date(pendingChats.created_at)) {
                    pendingChats.created_at = bill.created_at;
                }
            } else {
                grouped.push({ ...bill, isGroup: false });
            }
        });

        if (pendingChats.ids.length > 1) {
            grouped.unshift(pendingChats);
        } else if (pendingChats.ids.length === 1) {
            const single = bills.find(b => b.id === pendingChats.ids[0]);
            grouped.unshift({ ...single, isGroup: false });
        }
        return grouped;
    }, [bills]);

    return (
        <div className="expert-table-card">
            {/* Desktop Table View */}
            <div className="expert-table-wrapper">
                <table className="expert-table">
                    <thead>
                        <tr>
                            <th>Activity</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedBills.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '5rem 0' }}>
                                    <div style={{ background: '#f1f5f9', width: '64px', height: '64px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                        <FileText size={32} style={{ color: '#94a3b8' }} />
                                    </div>
                                    <p style={{ color: '#64748b', fontWeight: 600 }}>No admin bills found.</p>
                                </td>
                            </tr>
                        ) : (
                            processedBills.map((bill) => (
                                <tr key={bill.isGroup ? 'chats' : bill.id}>
                                    <td>
                                        <div style={{ fontWeight: 800, textTransform: 'capitalize' }}>
                                            {bill.isGroup ? `Chat Messages (${bill.ids.length})` : (bill.activity_type || "activity").replace(/_/g, ' ')}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, marginTop: '2px' }}>
                                            {bill.isGroup ? `#GROUP-CHATS` : `#BILL-${bill.id}`}
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 900, color: '#0f172a' }}>
                                        ₹{parseFloat(bill.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ color: '#64748b' }}>
                                        {new Date(bill.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td>
                                        <span className={`expert-badge ${bill.status === 'paid' ? 'success' : 'warning'}`}>
                                            {bill.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        {bill.status === 'pending' && (
                                            <button 
                                                className="premium-btn-primary" 
                                                style={{ border: 'none', cursor: 'pointer', scale: '0.85', transformOrigin: 'right center' }}
                                                disabled={paying}
                                                onClick={() => onPay(bill.isGroup ? bill.ids : bill.id)}
                                            >
                                                {bill.isGroup ? 'Pay All' : 'Pay Now'}
                                            </button>
                                        )}
                                        {bill.status === 'paid' && (
                                            <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', fontWeight: 800, fontSize: '0.85rem' }}>
                                                <CheckCircle2 size={16} /> SQUEAKY CLEAN
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="expert-bills-grid">
                {processedBills.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 0' }}>No bills found.</div>
                ) : (
                    processedBills.map((bill) => (
                        <div key={bill.isGroup ? 'chats-mobile' : bill.id} className="expert-bill-card">
                            <div className="expert-bill-header">
                                <div className="expert-bill-id">{bill.isGroup ? "#GROUP-CHATS" : `#BILL-${bill.id}`}</div>
                                <span className={`expert-badge ${bill.status === 'paid' ? 'success' : 'warning'}`}>
                                    {bill.status}
                                </span>
                            </div>
                            <div className="expert-bill-activity">
                                {bill.isGroup ? `Chat Messages (${bill.ids.length})` : (bill.activity_type || "activity").replace(/_/g, ' ')}
                            </div>
                            
                            <div className="expert-bill-date">
                                <Calendar size={14} />
                                {new Date(bill.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>

                            <div className="expert-bill-amount-row">
                                <div className="expert-bill-amount">
                                    ₹{parseFloat(bill.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                                {bill.status === 'pending' && (
                                    <button 
                                        className="premium-btn-primary" 
                                        style={{ border: 'none', cursor: 'pointer', padding: '0.6rem 1.25rem', borderRadius: '12px' }}
                                        disabled={paying}
                                        onClick={() => onPay(bill.isGroup ? bill.ids : bill.id)}
                                    >
                                        {bill.isGroup ? 'Pay All' : 'Pay Now'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function EarningsTable({ earnings }) {
    return (
        <div className="expert-table-card">
            {/* Desktop Table View */}
            <div className="expert-table-wrapper">
                <table className="expert-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Seeker</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {earnings.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '5rem 0' }}>
                                    <div style={{ background: '#f1f5f9', width: '64px', height: '64px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                        <ShoppingBag size={32} style={{ color: '#94a3b8' }} />
                                    </div>
                                    <p style={{ color: '#64748b', fontWeight: 600 }}>No sales records found.</p>
                                </td>
                            </tr>
                        ) : (
                            earnings.map((e) => (
                                <tr key={e.id}>
                                    <td style={{ fontWeight: 600 }}>#INV-{e.id}</td>
                                    <td style={{ fontWeight: 800 }}>{e.seeker_name}</td>
                                    <td style={{ fontWeight: 900, color: '#0f172a' }}>
                                        ₹{parseFloat(e.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td style={{ color: '#64748b' }}>
                                        {new Date(e.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td>
                                        <span className="expert-badge outline" style={{ 
                                            color: e.status === 'paid' ? '#10b981' : '#64748b',
                                            borderColor: e.status === 'paid' ? 'rgba(16, 185, 129, 0.2)' : '#e2e8f0'
                                        }}>
                                            {e.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="expert-bills-grid">
                {earnings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 0' }}>No sales records found.</div>
                ) : (
                    earnings.map((e) => (
                        <div key={e.id} className="expert-bill-card">
                            <div className="expert-bill-header">
                                <div className="expert-bill-id">#INV-{e.id}</div>
                                <span className="expert-badge outline" style={{ 
                                    color: e.status === 'paid' ? '#10b981' : '#64748b',
                                    borderColor: e.status === 'paid' ? 'rgba(16, 185, 129, 0.2)' : '#e2e8f0'
                                }}>
                                    {e.status}
                                </span>
                            </div>
                            <div className="expert-bill-activity" style={{ fontSize: '1rem', color: '#64748b' }}>
                                Sale to <span style={{ color: '#1e293b', fontWeight: 900 }}>{e.seeker_name}</span>
                            </div>
                            
                            <div className="expert-bill-date">
                                <Calendar size={14} />
                                {new Date(e.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>

                            <div className="expert-bill-amount-row">
                                <div className="expert-bill-amount" style={{ color: '#10b981' }}>
                                    +₹{parseFloat(e.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

const Avatar = ({ initials, color }) => (
    <div style={{ 
        width: '32px', 
        height: '32px', 
        borderRadius: '8px', 
        background: color + '20', 
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.8rem',
        fontWeight: 900,
        flexShrink: 0
    }}>
        {initials}
    </div>
);
