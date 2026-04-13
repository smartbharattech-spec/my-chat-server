import React, { useState, useEffect } from 'react';
import { 
    Zap, Plus, Edit2, Trash2, Save, X, AlertCircle, ShoppingBag, 
    TrendingUp, Layout, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MarketplaceSidebar from '../../components/MarketplaceSidebar';
import BlockingOverlay from '../../components/BlockingOverlay';
import { useToast } from '../../services/ToastService';
import './OccultExpertPremium.css';

export default function ExpertCreditPlans() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        plan_name: '',
        credits: '',
        price: '',
        status: 'active'
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('occult_user');
        if (!storedUser) {
            navigate('/occult/login');
        } else {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchPlans(parsedUser.id);
        }
    }, [navigate]);

    const fetchPlans = async (expertId) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/marketplace/expert_manage_plans.php?expert_id=${expertId}`);
            const data = await response.json();
            if (data.status === 'success') {
                setPlans(data.data);
            }
        } catch (err) {
            console.error('Fetch plans error:', err);
            showToast('error', 'Failed to load plans.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (plan = null) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData({
                plan_name: plan.plan_name,
                credits: plan.credits,
                price: plan.price,
                status: plan.status
            });
        } else {
            setEditingPlan(null);
            setFormData({
                plan_name: '',
                credits: '',
                price: '',
                status: 'active'
            });
        }
        setOpenDialog(true);
    };

    const handleSave = async () => {
        if (!formData.plan_name || !formData.credits || !formData.price) {
            showToast('warning', 'Please fill all fields.', 'warning');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...formData,
                expert_id: user.id,
                action: editingPlan ? 'update' : 'create',
                plan_id: editingPlan?.id
            };

            const response = await fetch('/api/marketplace/expert_manage_plans.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (data.status === 'success') {
                showToast('success', editingPlan ? 'Plan updated!' : 'Plan created!', 'success');
                setOpenDialog(false);
                fetchPlans(user.id);
            } else {
                showToast('error', data.message, 'error');
            }
        } catch (err) {
            showToast('error', 'Request failed.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (planId) => {
        if (!window.confirm('Are you sure you want to delete this plan?')) return;

        try {
            const response = await fetch('/api/marketplace/expert_manage_plans.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expert_id: user.id, plan_id: planId, action: 'delete' })
            });
            const data = await response.json();
            if (data.status === 'success') {
                showToast('success', 'Plan deleted.', 'success');
                fetchPlans(user.id);
            } else {
                showToast('error', data.message, 'error');
            }
        } catch (err) {
            showToast('error', 'Request failed.', 'error');
        }
    };

    if (loading) return (
        <div className="premium-loader-container">
            <span className="premium-loader"></span>
        </div>
    );

    return (
        <div className="premium-dashboard-container" style={{ display: 'flex' }}>
            <BlockingOverlay />
            <MarketplaceSidebar user={user} role="expert" />

            <div className="premium-content-area" style={{ flex: 1 }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header */}
                <div className="premium-header animate-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h1 className="premium-title">
                                <Zap size={36} color="#6366f1" style={{ flexShrink: 0 }} />
                                Token Plans
                            </h1>
                            <p className="premium-subtitle">Create dynamic credit packages for your followers.</p>
                        </div>
                        <button
                            onClick={() => handleOpenDialog()}
                            className="premium-btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}
                        >
                            <Plus size={20} />
                            Create New Plan
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="premium-metric-card">
                        <div className="premium-metric-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                            <Layout size={24} />
                        </div>
                        <h2 className="premium-metric-value">{plans.length}</h2>
                        <span className="premium-metric-label">Active Plans</span>
                    </div>
                </div>

                {/* Plans Table */}
                <h3 className="premium-section-title animate-fade-in">Your Pricing Packages</h3>
                
                <div className="premium-table-container animate-fade-in">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>PLAN NAME</th>
                                <th>CREDITS</th>
                                <th>PRICE</th>
                                <th>STATUS</th>
                                <th style={{ textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plans.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '4rem' }}>
                                        <div style={{ color: '#64748b', fontWeight: 600 }}>No plans created yet. Start by creating your first plan!</div>
                                    </td>
                                </tr>
                            ) : (
                                plans.map((plan) => (
                                    <tr key={plan.id}>
                                        <td style={{ fontWeight: 700, color: '#1e293b' }}>{plan.plan_name}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Zap size={16} color="#f59e0b" fill="#f59e0b" />
                                                <span style={{ fontWeight: 700 }}>{plan.credits}</span>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 900, color: '#6366f1' }}>₹{plan.price}</td>
                                        <td>
                                            <span className={`premium-status-badge ${plan.status}`}>
                                                {plan.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button 
                                                onClick={() => handleOpenDialog(plan)} 
                                                className="premium-icon-btn edit"
                                                title="Edit"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(plan.id)} 
                                                className="premium-icon-btn delete"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Custom Modal */}
                <AnimatePresence>
                    {openDialog && (
                        <div className="premium-modal-overlay">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="premium-modal"
                            >
                                <div className="premium-modal-header">
                                    <h2 className="premium-modal-title">
                                        {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                                    </h2>
                                    <button 
                                        className="premium-modal-close"
                                        onClick={() => setOpenDialog(false)}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="premium-modal-body">
                                    <p style={{ color: '#64748b', marginBottom: '1.5rem', fontWeight: 500 }}>
                                        Configure your token package details below.
                                    </p>
                                    
                                    <div className="premium-input-group">
                                        <label className="premium-label">Plan Name</label>
                                        <input 
                                            type="text"
                                            className="premium-input"
                                            placeholder="e.g. Starter Pack, Special Offer"
                                            value={formData.plan_name}
                                            onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                                        />
                                    </div>

                                    <div className="premium-input-row">
                                        <div className="premium-input-group">
                                            <label className="premium-label">Credits (Tokens)</label>
                                            <input 
                                                type="number"
                                                className="premium-input"
                                                value={formData.credits}
                                                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                                            />
                                        </div>
                                        <div className="premium-input-group">
                                            <label className="premium-label">Price (₹)</label>
                                            <input 
                                                type="number"
                                                className="premium-input"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="premium-switch-container">
                                        <div>
                                            <div style={{ fontWeight: 700, color: '#1e293b' }}>Plan Active</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Followers can see and buy this plan</div>
                                        </div>
                                        <label className="premium-switch">
                                            <input 
                                                type="checkbox" 
                                                checked={formData.status === 'active'}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })}
                                            />
                                            <span className="premium-slider"></span>
                                        </label>
                                    </div>
                                </div>
                                <div className="premium-modal-footer">
                                    <button 
                                        className="premium-btn-secondary"
                                        onClick={() => setOpenDialog(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="premium-btn-primary"
                                        onClick={handleSave}
                                        disabled={saving}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}
                                    >
                                        {saving ? (
                                            <span className="premium-loader" style={{ width: '18px', height: '18px', borderThickness: '2px' }}></span>
                                        ) : (
                                            <Save size={18} />
                                        )}
                                        {editingPlan ? 'Update Plan' : 'Save Plan'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
