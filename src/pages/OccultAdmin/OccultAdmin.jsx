import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Button, Chip, IconButton, Grid, Avatar, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Switch, FormControlLabel, Stack, TextField, LinearProgress, Skeleton, InputAdornment } from '@mui/material';
import Divider from '@mui/material/Divider';
import { 
    LayoutDashboard, Settings, ShieldCheck, ShieldAlert, BadgeCheck, 
    FileText, CheckCircle, XCircle, Users, Clock, AlertCircle, 
    LogOut, Brain, ListChecks, Award, Save, Key, Edit, User, 
    Trash2, Search, ShoppingBag, TrendingUp, DollarSign, Package 
} from 'lucide-react';
import MarketplaceSidebar from "../../components/MarketplaceSidebar";
import { useToast } from '../../services/ToastService';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell 
} from 'recharts';
import './OccultAdmin.css';

export default function OccultAdmin() {
    // Helper for Skeleton Table
    const SkeletonTable = ({ columns = 5, rows = 5 }) => (
        <TableBody>
            {[...Array(rows)].map((_, i) => (
                <TableRow key={i}>
                    {[...Array(columns)].map((_, j) => (
                        <TableCell key={j}>
                            <Skeleton variant="text" height={40} />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </TableBody>
    );

    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const [user, setUser] = useState(null);
    const [experts, setExperts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        onConfirm: null,
        type: 'info' // info, warning, error
    });

    // AI States
    const [viewingExam, setViewingExam] = useState(null);
    const [activeTab, setActiveTab] = useState('queue'); // 'queue', 'examQueue', 'settings'
    const [aiSettings, setAiSettings] = useState({
        openai_api_key: '',
        openai_instructions: ''
    });
    const [savingSettings, setSavingSettings] = useState(false);
    
    // Expert Edit States
    const [editingExpert, setEditingExpert] = useState(null);
    const [editForm, setEditForm] = useState({
        name: '',
        phone: '',
        primary_skill: '',
        experience_years: 0,
        bio: '',
        languages: '',
        hourly_rate: 0,
        expertise_tags: ''
    });
    const [savingExpert, setSavingExpert] = useState(false);
    
    // User Management States
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [userEditForm, setUserEditForm] = useState({
        name: '',
        phone: '',
        city: '',
        state: ''
    });
    const [savingUser, setSavingUser] = useState(false);
    const [creditDialog, setCreditDialog] = useState({ open: false, userId: null, amount: '' });
    const [addingCredit, setAddingCredit] = useState(false);

    // Credit System States
    const [creditPlans, setCreditPlans] = useState([]);
    const [creditRequests, setCreditRequests] = useState([]);
    const [creatingPlan, setCreatingPlan] = useState(false);
    const [newPlan, setNewPlan] = useState({ plan_name: '', credits: 0, price: 0 });
    
    // Course Management States
    const [courseOrders, setCourseOrders] = useState([]);
    const [fetchingCourses, setFetchingCourses] = useState(false);
    
    // Search and Pagination States
    const [expertSearch, setExpertSearch] = useState('');
    const [userSearch, setUserSearch] = useState('');
    const [expertPage, setExpertPage] = useState(0);
    const [userPage, setUserPage] = useState(0);
    const rowsPerPage = 10;

    // Dashboard Data
    const [dashboardData, setDashboardData] = useState({
        counts: {
            total_experts: 0,
            pending_experts: 0,
            total_users: 0,
            total_products: 0,
            total_orders: 0,
            total_revenue: 0
        },
        trends: []
    });
    const [fetchingDash, setFetchingDash] = useState(false);

    // Expert Billing States
    const [billingSummary, setBillingSummary] = useState([]);
    const [selectedExpertBills, setSelectedExpertBills] = useState({ bills: [], user: null });
    const [viewingExpertBills, setViewingExpertBills] = useState(false);
    const [billingLoading, setBillingLoading] = useState(false);
    const [gracePeriod, setGracePeriod] = useState(2);
    const [savingBillingSettings, setSavingBillingSettings] = useState(false);
    

    useEffect(() => {
        const storedUser = localStorage.getItem('occult_user');
        if (!storedUser) {
            navigate('/occult/login');
        } else {
            const parsed = JSON.parse(storedUser);
            if (parsed.role !== 'admin') {
                navigate('/occult/user-dashboard');
            } else {
                setUser(parsed);
                fetchExperts();
                fetchUsers();
                fetchAiSettings();
                fetchDashboardStats();
                fetchCreditPlans();
                fetchCreditRequests();
                
                const params = new URLSearchParams(location.search);
                const tab = params.get('tab');
                if (tab === 'manageUsers') setActiveTab('manageUsers');
                else if (tab === 'expertsList') setActiveTab('expertsList');
                else if (tab === 'examQueue') setActiveTab('examQueue');
                else if (tab === 'settings') setActiveTab('settings');
                else if (tab === 'creditPlans') setActiveTab('creditPlans');
                else if (tab === 'creditRequests') setActiveTab('creditRequests');
                else if (tab === 'expertBilling') setActiveTab('expertBilling');
                else if (tab === 'courseOrders') setActiveTab('courseOrders');
                else setActiveTab('queue');
            }
        }
    }, [navigate, location.search]);

    useEffect(() => {
        if (activeTab === 'expertBilling') {
            fetchBillingSummary();
            fetchBillingSettings();
        }
        if (activeTab === 'courseOrders') {
            fetchCourseOrders();
        }
    }, [activeTab]);

    const fetchCourseOrders = async () => {
        try {
            setFetchingCourses(true);
            const res = await fetch("/api/get_course_purchases.php");
            const data = await res.json();
            if (data.status === 'success') setCourseOrders(data.data);
        } catch (err) { console.error(err); }
        finally { setFetchingCourses(false); }
    };

    const handleApproveCourse = async (id, status) => {
        try {
            const formData = new FormData();
            formData.append('purchase_id', id);
            formData.append('status', status);
            const res = await fetch("/api/admin_approve_course.php", {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.status === 'success') {
                showToast(`Course ${status}!`, 'success');
                fetchCourseOrders();
            }
        } catch (err) { showToast('Error updating course status', 'error'); }
    };

    const fetchBillingSummary = async () => {
        try {
            setBillingLoading(true);
            const res = await fetch("/api/marketplace/admin_expert_billing.php", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_expert_billing_summary', admin_id: user?.id })
            });
            const data = await res.json();
            if (data.status === 'success') setBillingSummary(data.data);
        } catch (err) {
            showToast('Failed to fetch billing summary', 'error');
        } finally {
            setBillingLoading(false);
        }
    };

    const fetchBillingSettings = async () => {
        try {
            const res = await fetch("/api/marketplace/admin_settings.php", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_settings' })
            });
            const data = await res.json();
            if (data.status === 'success' && data.settings.billing_grace_period) {
                setGracePeriod(data.settings.billing_grace_period);
            }
        } catch (err) { console.error(err); }
    };

    const handleSaveBillingSettings = async () => {
        setSavingBillingSettings(true);
        try {
            const res = await fetch("/api/marketplace/admin_settings.php", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'update_settings', 
                    key: 'billing_grace_period', 
                    value: gracePeriod 
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                showToast('Grace period updated successfully', 'success');
                fetchBillingSummary(); // Refresh to update block statuses
            }
        } catch (err) {
            showToast('Failed to save settings', 'error');
        } finally {
            setSavingBillingSettings(false);
        }
    };

    const fetchExpertBillingDetails = async (expertId) => {
        try {
            const res = await fetch("/api/marketplace/admin_expert_billing.php", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_expert_details', admin_id: user?.id, expert_id: expertId })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setSelectedExpertBills({ bills: data.bills, user: data.user });
                setViewingExpertBills(true);
            }
        } catch (err) {
            showToast('Failed to fetch details', 'error');
        }
    };

    const handleMarkBillAsPaid = async (billId, expertId) => {
        try {
            const res = await fetch("/api/marketplace/admin_expert_billing.php", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'mark_bill_paid', admin_id: user?.id, bill_id: billId })
            });
            const data = await res.json();
            if (data.status === 'success') {
                showToast('Bill marked as paid', 'success');
                fetchExpertBillingDetails(expertId);
                fetchBillingSummary();
            }
        } catch (err) {
            showToast('Action failed', 'error');
        }
    };

    const handleToggleExpertBlock = async (expertId, currentlyBlocked) => {
        const action = currentlyBlocked ? 'unblock' : 'block';
        const reason = !currentlyBlocked ? window.prompt("Reason for blocking?", "Unpaid dues/Policy violation") : "";
        
        if (!currentlyBlocked && reason === null) return;

        try {
            const res = await fetch("/api/marketplace/admin_expert_billing.php", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'toggle_block', 
                    admin_id: user?.id, 
                    expert_id: expertId, 
                    is_blocked: currentlyBlocked ? 0 : 1,
                    reason: reason || "Blocked by Administrator."
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                showToast(`Expert ${action}ed successfully`, 'success');
                fetchExperts(); // Refresh main list
                fetchBillingSummary();
                if (viewingExpertBills) fetchExpertBillingDetails(expertId);
            }
        } catch (err) {
            showToast('Block/Unblock failed', 'error');
        }
    };

    const fetchDashboardStats = async () => {
        try {
            setFetchingDash(true);
            const res = await fetch("/api/marketplace/admin_dashboard_stats.php");
            const data = await res.json();
            if (data.status === 'success') {
                setDashboardData(data);
            }
        } catch (err) {
            console.error("Dashboard fetch failed", err);
        } finally {
            setFetchingDash(false);
        }
    };

    const fetchAiSettings = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/marketplace/admin_settings.php", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_settings' })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setAiSettings({
                    ...data.settings,
                    expert_verification_enabled: data.settings.expert_verification_enabled || 'on'
                });
            }
        } catch (err) {
            console.error("Failed to fetch AI settings");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSetting = async (key, value) => {
        setSavingSettings(true);
        try {
            const res = await fetch("/api/marketplace/admin_settings.php", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_settings', key, value })
            });
            const data = await res.json();
            if (data.status === 'success') {
                showToast(`${key} updated!`, 'success');
                fetchAiSettings();
            } else showToast(data.message, 'error');
        } catch (err) {
            showToast('Failed to update setting', 'error');
        } finally {
            setSavingSettings(false);
        }
    };

    const fetchExperts = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/marketplace/admin_get_experts.php");
            const data = await response.json();
            if (data.status === 'success') setExperts(data.data);
            else showToast(data.message, 'error');
        } catch (err) {
            showToast('Failed to fetch experts', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/marketplace/admin_get_users.php");
            const data = await response.json();
            if (data.status === 'success') setUsers(data.data);
            else showToast(data.message, 'error');
        } catch (err) {
            showToast('Failed to fetch users', 'error');
        } finally {
            setLoading(false);
        }
    };


    const closeConfirm = () => setConfirmDialog({ ...confirmDialog, open: false });

    const handleStatusChange = async (expertId, status) => {
        setConfirmDialog({
            open: true,
            title: `Mark expert as ${status}?`,
            message: `Are you sure you want to change this expert's status to ${status}?`,
            type: status === 'rejected' ? 'error' : 'info',
            onConfirm: async () => {
                closeConfirm();
                try {
                    const res = await fetch("/api/marketplace/admin_approve_expert.php", {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ expert_id: expertId, status })
                    });
                    const data = await res.json();
                    if (data.status === 'success') {
                        showToast(data.message, 'success');
                        fetchExperts();
                    } else {
                        showToast(data.message, 'error');
                    }
                } catch (err) {
                    showToast('Failed to change status', 'error');
                }
            }
        });
    };

    const handleVerifyIdentity = async (expertId) => {
        setConfirmDialog({
            open: true,
            title: 'Verify Identity Document?',
            message: "Confirm that you have reviewed the expert's identity proof and it is valid.",
            type: 'info',
            onConfirm: async () => {
                closeConfirm();
                try {
                    const res = await fetch("/api/marketplace/admin_approve_expert.php", {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ expert_id: expertId, action: 'verify_identity' })
                    });
                    const data = await res.json();
                    if (data.status === 'success') {
                        showToast(data.message, 'success');
                        fetchExperts();
                    } else {
                        showToast(data.message, 'error');
                    }
                } catch (err) {
                    showToast('Failed to verify identity', 'error');
                }
            }
        });
    };

    const handleRejectIdentity = async (expertId) => {
        setConfirmDialog({
            open: true,
            title: 'Reject Identity Document?',
            message: "The expert will be notified and asked to re-upload a clear document.",
            type: 'error',
            onConfirm: async () => {
                closeConfirm();
                try {
                    const res = await fetch("/api/marketplace/admin_approve_expert.php", {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ expert_id: expertId, action: 'reject_identity' })
                    });
                    const data = await res.json();
                    if (data.status === 'success') {
                        showToast(data.message, 'warning');
                        fetchExperts();
                    } else {
                        showToast(data.message, 'error');
                    }
                } catch (err) {
                    showToast('Failed to reject identity', 'error');
                }
            }
        });
    };

    const handleInterviewAction = async (expertId, status) => {
        setConfirmDialog({
            open: true,
            title: `Mark Interview as ${status.toUpperCase()}?`,
            message: `This will finalize the expert's verification process.`,
            type: status === 'passed' ? 'info' : 'error',
            onConfirm: async () => {
                closeConfirm();
                try {
                    const res = await fetch("/api/marketplace/admin_approve_expert.php", {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ expert_id: expertId, action: 'interview_result', status })
                    });
                    const data = await res.json();
                    if (data.status === 'success') {
                        showToast(data.message, 'success');
                        setViewingExam(null);
                        fetchExperts();
                    } else showToast(data.message, 'error');
                } catch (err) {
                    showToast('Failed to save interview result', 'error');
                }
            }
        });
    };

    const handleEditExpert = (expert) => {
        setEditingExpert(expert);
        setEditForm({
            name: expert.name || '',
            phone: expert.phone || '',
            primary_skill: expert.primary_skill || '',
            experience_years: expert.experience_years || 0,
            bio: expert.bio || '',
            languages: expert.languages || '',
            hourly_rate: expert.hourly_rate || 0,
            expertise_tags: expert.expertise_tags || ''
        });
    };

    const handleSaveExpert = async () => {
        setSavingExpert(true);
        try {
            const res = await fetch("/api/marketplace/profile_update.php", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: 'expert',
                    user_id: editingExpert.id,
                    ...editForm,
                    skill: editForm.primary_skill, // API expects 'skill'
                    experience: editForm.experience_years, // API expects 'experience'
                    skills: editForm.expertise_tags // API expects 'skills' for tags
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                showToast('Expert updated successfully', 'success');
                setEditingExpert(null);
                fetchExperts();
            } else {
                showToast(data.message || 'Update failed', 'error');
            }
        } catch (err) {
            showToast('Failed to save changes', 'error');
        } finally {
            setSavingExpert(false);
        }
    };

    const handleEditUser = (u) => {
        setEditingUser(u);
        setUserEditForm({
            name: u.name || '',
            phone: u.phone || '',
            city: u.city || '',
            state: u.state || ''
        });
    };

    const handleAddCredits = async () => {
        if (!creditDialog.amount || creditDialog.amount <= 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }
        setAddingCredit(true);
        try {
            const res = await fetch("/api/marketplace/admin_add_credits.php", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    admin_id: user.id || user.user_id,
                    user_id: creditDialog.userId,
                    amount: parseInt(creditDialog.amount)
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                showToast(data.message, 'success');
                setCreditDialog({ open: false, userId: null, amount: '' });
                fetchUsers();
            } else {
                showToast(data.message, 'error');
            }
        } catch (err) {
            showToast('Failed to add credits', 'error');
        } finally {
            setAddingCredit(false);
        }
    };

    const handleSaveUser = async () => {
        setSavingUser(true);
        try {
            const res = await fetch("/api/marketplace/profile_update.php", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: editingUser.id,
                    role: 'user',
                    ...userEditForm
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                showToast('User updated successfully', 'success');
                setEditingUser(null);
                fetchUsers();
            } else {
                showToast(data.message || 'Update failed', 'error');
            }
        } catch (err) {
            showToast('Failed to save changes', 'error');
        } finally {
            setSavingUser(false);
        }
    };

    const fetchCreditPlans = async () => {
        try {
            const res = await fetch(`/api/marketplace/admin_credit_plans.php?admin_id=${user?.id || user?.user_id || 0}`);
            const data = await res.json();
            if (data.status === 'success') setCreditPlans(data.data);
        } catch (err) { console.error(err); }
    };

    const fetchCreditRequests = async () => {
        try {
            const res = await fetch(`/api/marketplace/admin_credit_requests.php?admin_id=${user?.id || user?.user_id || 0}`);
            const data = await res.json();
            if (data.status === 'success') setCreditRequests(data.data);
        } catch (err) { console.error(err); }
    };

    const handleCreateCreditPlan = async () => {
        if (!newPlan.plan_name || newPlan.credits <= 0 || newPlan.price <= 0) { showToast('Invalid plan details', 'warning'); return; }
        setCreatingPlan(true);
        try {
            const res = await fetch("/api/marketplace/admin_credit_plans.php", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: user.id || user.user_id, ...newPlan })
            });
            const data = await res.json();
            if (data.status === 'success') {
                showToast(data.message, 'success');
                setNewPlan({ plan_name: '', credits: 0, price: 0 });
                fetchCreditPlans();
            } else { showToast(data.message, 'error'); }
        } catch (err) { showToast('Failed to create plan', 'error'); }
        finally { setCreatingPlan(false); }
    };

    const handleTogglePlan = async (planId, currentStatus) => {
        try {
            const res = await fetch("/api/marketplace/admin_credit_plans.php", {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: user.id || user.user_id, plan_id: planId, status: currentStatus === 'active' ? 'inactive' : 'active' })
            });
            const data = await res.json();
            if (data.status === 'success') { showToast(data.message, 'success'); fetchCreditPlans(); }
            else { showToast(data.message, 'error'); }
        } catch (err) { showToast('Failed to update plan', 'error'); }
    };

    const handleCreditRequestAction = async (requestId, action) => {
        try {
            const res = await fetch("/api/marketplace/admin_credit_requests.php", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_id: user.id || user.user_id, request_id: requestId, action })
            });
            const data = await res.json();
            if (data.status === 'success') {
                showToast(data.message, 'success');
                fetchCreditRequests();
                fetchUsers();
            } else { showToast(data.message, 'error'); }
        } catch (err) { showToast('Failed to process request', 'error'); }
    };

    const handleDeleteUser = async (userId, role) => {
        setConfirmDialog({
            open: true,
            title: `Delete ${role === 'expert' ? 'Expert' : 'User'}?`,
            message: `Are you sure you want to permanently delete this ${role}? This action cannot be undone.`,
            type: 'error',
            onConfirm: async () => {
                closeConfirm();
                try {
                    const res = await fetch("/api/marketplace/admin_delete_user.php", {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: userId })
                    });
                    const data = await res.json();
                    if (data.status === 'success') {
                        showToast(data.message, 'success');
                        if (role === 'expert') fetchExperts();
                        else fetchUsers();
                    } else {
                        showToast(data.message, 'error');
                    }
                } catch (err) {
                    showToast('Failed to delete user', 'error');
                }
            }
        });
    };

    if (!user) return null;

    const stats = [
        { label: 'Total Experts', value: experts.length, icon: <Users size={20} />, color: '#3b82f6' },
        { label: 'Pending Apps', value: experts.filter(e => e.status === 'pending').length, icon: <Clock size={20} />, color: '#f59e0b' },
        { label: 'Verified Experts', value: experts.filter(e => e.status === 'active').length, icon: <ShieldCheck size={20} />, color: '#10b981' },
    ];

    return (
        <div className="occult-admin-container">
            <MarketplaceSidebar user={user} role="admin" />

            <main className="occult-admin-main">
                {/* Header */}
                <header className="occult-admin-header">
                    <h1 className="occult-admin-title">Control Center</h1>
                    <p className="occult-admin-subtitle">Governance and real-time marketplace analytics.</p>
                </header>

                {activeTab === 'queue' ? (
                    <>
                        {/* Stats Grid */}
                        <div className="stats-grid">
                            {[
                                { label: 'Total Experts', value: dashboardData.counts.total_experts, sub: `${dashboardData.counts.pending_experts} Pending Review`, icon: <Users size={24} />, color: 'var(--accent-primary)' },
                                { label: 'Total Users', value: dashboardData.counts.total_users, sub: 'Active Registered Members', icon: <User size={24} />, color: '#6366f1' },
                                { label: 'Digital Store Items', value: dashboardData.counts.total_products, sub: 'Live Inventory Catalog', icon: <ShoppingBag size={24} />, color: 'var(--accent-gold)' },
                                { label: 'Total Orders', value: dashboardData.counts.total_orders, sub: `₹${dashboardData.counts.total_revenue.toLocaleString()} Revenue`, icon: <Package size={24} />, color: '#10b981' },
                            ].map((stat, i) => (
                                <div key={i} className="stat-card">
                                    <div className="stat-icon-wrapper" style={{ color: stat.color, background: `${stat.color}15` }}>
                                        {stat.icon}
                                    </div>
                                    <div className="stat-label">{stat.label}</div>
                                    <div className="stat-value">{stat.value}</div>
                                    <div className="stat-trend" style={{ color: stat.color }}>
                                        <TrendingUp size={14} /> {stat.sub}
                                    </div>
                                </div>
                            ))}
                        </div>


                        {/* Professional Visual Analytics - 50/50 Screen Split */}
                        <div className="analytics-grid">
                            <div className="chart-container">
                                <header className="chart-header">
                                    <h3 className="chart-title">Marketplace Growth Analysis</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Real-time expert and user acquisition trends.</p>
                                </header>
                                <div style={{ height: 400, width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={dashboardData.trends}>
                                            <defs>
                                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorExperts" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                                itemStyle={{ color: '#0f172a' }}
                                            />
                                            <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                                            <Area type="monotone" dataKey="experts" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorExperts)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="chart-container">
                                <header className="chart-header">
                                    <h3 className="chart-title">Expert Status Distribution</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Breakdown of verified vs pending experts.</p>
                                </header>
                                <div style={{ height: 400, width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                            <Tooltip 
                                                cursor={{fill: 'rgba(0,0,0,0.02)'}}
                                                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)' }}
                                            />
                                            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50}>
                                                {stats.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>


                        {/* Action Queue Table */}
                        <div className="custom-table-container">
                            <header style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Pending Verification Queue</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Review and approve expert applications.</p>
                                </div>
                                <div className="custom-chip chip-warning" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}>
                                    <Clock size={14} /> {experts.filter(e => e.status === 'pending').length} Action Required
                                </div>
                            </header>

                            <div style={{ overflowX: 'auto' }}>
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Expert Details</th>
                                            <th>Primary Skill</th>
                                            <th>Identity</th>
                                            <th>Interview</th>
                                            <th>Status</th>
                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {experts.filter(e => e.status === 'pending').length > 0 ? (
                                            experts.filter(e => e.status === 'pending').map((expert) => (
                                                <tr key={expert.id}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                            <Avatar src={expert.profile_image} sx={{ width: 40, height: 40, border: '2px solid rgba(255,255,255,0.1)' }} />
                                                            <div>
                                                                <div style={{ fontWeight: 700 }}>{expert.name}</div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{expert.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="custom-chip chip-info">{expert.primary_skill}</span>
                                                    </td>
                                                    <td>
                                                        {expert.identity_verified === '1' ? (
                                                            <span className="custom-chip chip-success"><CheckCircle size={14} /> Verified</span>
                                                        ) : (
                                                            <span className="custom-chip chip-warning"><Clock size={14} /> Pending Review</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {expert.exam_score ? (
                                                            <span className="custom-chip chip-success">{expert.exam_score}% Passed</span>
                                                        ) : (
                                                            <span className="custom-chip chip-error">Not Attempted</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className="custom-chip chip-warning">Pending</span>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                            <button 
                                                                className="custom-btn btn-primary" 
                                                                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                                                                onClick={() => handleStatusChange(expert.id, 'active')}
                                                            >
                                                                Approve
                                                            </button>
                                                            <button 
                                                                className="custom-btn" 
                                                                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                                                                onClick={() => handleStatusChange(expert.id, 'rejected')}
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                                        <CheckCircle size={48} opacity={0.2} />
                                                        <span>All clear! No pending applications in the queue.</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : activeTab === 'expertsList' ? (
                    <div className="custom-table-container">
                        <header style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <Users size={24} color="var(--accent-primary)" />
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Registered Experts</h3>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input 
                                    className="custom-btn" 
                                    style={{ paddingLeft: '2.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', width: '250px' }}
                                    placeholder="Search experts..."
                                    value={expertSearch}
                                    onChange={(e) => { setExpertSearch(e.target.value); setExpertPage(0); }}
                                />
                            </div>
                        </header>

                        <div style={{ overflowX: 'auto' }}>
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>Expert</th>
                                        <th>Contact</th>
                                        <th>Skill & Experience</th>
                                        <th style={{ textAlign: 'center' }}>Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>Loading experts...</td></tr>
                                    ) : (
                                        experts
                                            .filter(e => 
                                                (e.name || '').toLowerCase().includes(expertSearch.toLowerCase()) || 
                                                (e.email || '').toLowerCase().includes(expertSearch.toLowerCase()) ||
                                                (e.phone || '').includes(expertSearch)
                                            )
                                            .slice(expertPage * rowsPerPage, (expertPage + 1) * rowsPerPage)
                                            .map((expert) => (
                                                <tr key={expert.id}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>{expert.name?.charAt(0)}</Avatar>
                                                            <div>
                                                                <div style={{ fontWeight: 700 }}>{expert.name}</div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {expert.id}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize: '0.9rem' }}>{expert.email}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{expert.phone}</div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 600 }}>{expert.primary_skill}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{expert.experience_years} Years Exp</div>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                            <span className={`custom-chip ${expert.status === 'active' ? 'chip-success' : expert.status === 'pending' ? 'chip-warning' : 'chip-error'}`}>
                                                                {expert.status}
                                                            </span>
                                                            {parseInt(expert.is_blocked) === 1 && (
                                                                <span className="custom-chip chip-error" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>BLOCKED</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                            <IconButton 
                                                                sx={{ color: parseInt(expert.is_blocked) ? '#10b981' : '#ef4444' }}
                                                                onClick={() => handleToggleExpertBlock(expert.id, parseInt(expert.is_blocked))}
                                                            >
                                                                {parseInt(expert.is_blocked) ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                                                            </IconButton>
                                                            <IconButton sx={{ color: 'var(--accent-primary)' }} onClick={() => handleEditExpert(expert)}>
                                                                <Edit size={18} />
                                                            </IconButton>
                                                            <IconButton sx={{ color: '#ef4444' }} onClick={() => handleDeleteUser(expert.id, 'expert')}>
                                                                <Trash2 size={18} />
                                                            </IconButton>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <TablePagination
                            component="div"
                            count={experts.filter(e => 
                                (e.name || '').toLowerCase().includes(expertSearch.toLowerCase()) || 
                                (e.email || '').toLowerCase().includes(expertSearch.toLowerCase()) ||
                                (e.phone || '').includes(expertSearch)
                            ).length}
                            rowsPerPage={rowsPerPage}
                            page={expertPage}
                            onPageChange={(e, newPage) => setExpertPage(newPage)}
                            rowsPerPageOptions={[rowsPerPage]}
                            sx={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--glass-border)' }}
                        />
                    </div>
                ) : activeTab === 'manageUsers' ? (
                    <div className="custom-table-container">
                        <header style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <User size={24} color="#6366f1" />
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Registered Users</h3>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input 
                                    className="custom-btn" 
                                    style={{ paddingLeft: '2.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', width: '250px' }}
                                    placeholder="Search users..."
                                    value={userSearch}
                                    onChange={(e) => { setUserSearch(e.target.value); setUserPage(0); }}
                                />
                            </div>
                        </header>

                        <div style={{ overflowX: 'auto' }}>
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Contact</th>
                                        <th>Location</th>
                                        <th style={{ textAlign: 'center' }}>Credits</th>
                                        <th style={{ textAlign: 'center' }}>Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>Loading users...</td></tr>
                                    ) : (
                                        users
                                            .filter(u => 
                                                (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) || 
                                                (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                                                (u.phone || '').includes(userSearch)
                                            )
                                            .slice(userPage * rowsPerPage, (userPage + 1) * rowsPerPage)
                                            .map((u) => (
                                                <tr key={u.id}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                            <Avatar sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>{u.name?.charAt(0)}</Avatar>
                                                            <div>
                                                                <div style={{ fontWeight: 700 }}>{u.name}</div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Since: {new Date(u.created_at).toLocaleDateString()}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize: '0.9rem' }}>{u.email}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.phone}</div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize: '0.9rem' }}>{u.city || 'N/A'}, {u.state || 'N/A'}</div>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span className="custom-chip chip-warning">{u.credits || 0} Credits</span>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span className={`custom-chip ${u.status === 'active' ? 'chip-success' : 'chip-error'}`}>
                                                            {u.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                            <IconButton sx={{ color: 'var(--accent-gold)' }} onClick={() => setCreditDialog({ open: true, userId: u.id, amount: '' })}>
                                                                <DollarSign size={18} />
                                                            </IconButton>
                                                            <IconButton sx={{ color: 'var(--accent-primary)' }} onClick={() => handleEditUser(u)}>
                                                                <Edit size={18} />
                                                            </IconButton>
                                                            <IconButton sx={{ color: '#ef4444' }} onClick={() => handleDeleteUser(u.id, 'user')}>
                                                                <Trash2 size={18} />
                                                            </IconButton>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <TablePagination
                            component="div"
                            count={users.filter(u => 
                                (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) || 
                                (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                                (u.phone || '').includes(userSearch)
                            ).length}
                            rowsPerPage={rowsPerPage}
                            page={userPage}
                            onPageChange={(e, newPage) => setUserPage(newPage)}
                            rowsPerPageOptions={[rowsPerPage]}
                            sx={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--glass-border)' }}
                        />

                        {/* Credits Dialog */}
                        <Dialog open={creditDialog.open} onClose={() => setCreditDialog({ ...creditDialog, open: false })} PaperProps={{ sx: { bgcolor: '#1e293b', color: 'white', borderRadius: 4, border: '1px solid var(--glass-border)' } }}>
                            <DialogTitle sx={{ fontWeight: 900 }}>Add Credits to Wallet</DialogTitle>
                            <DialogContent>
                                <DialogContentText sx={{ color: 'var(--text-secondary)', mb: 3 }}>
                                    Adjust the digital balance for this user's marketplace activities.
                                </DialogContentText>
                                <TextField
                                    autoFocus
                                    fullWidth
                                    label="Credit Amount"
                                    type="number"
                                    variant="outlined"
                                    value={creditDialog.amount}
                                    onChange={(e) => setCreditDialog({ ...creditDialog, amount: e.target.value })}
                                    sx={{ 
                                        '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'var(--glass-border)' } },
                                        '& .MuiInputLabel-root': { color: 'var(--text-muted)' }
                                    }}
                                />
                            </DialogContent>
                            <DialogActions sx={{ p: 3 }}>
                                <Button onClick={() => setCreditDialog({ ...creditDialog, open: false })} sx={{ color: 'var(--text-muted)' }}>Cancel</Button>
                            </DialogActions>
                        </Dialog>
                    </div>
                ) : activeTab === 'examQueue' ? (
                    <div className="custom-table-container">
                        <header style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>AI Exam Review Queue</h3>
                        </header>
                        <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                            {experts.filter(e => e.ai_exam_status === 'evaluated' || e.ai_exam_status === 'completed').map(expert => {
                                const passed = (parseInt(expert.ai_exam_marks) || 0) >= 60;
                                return (
                                    <div key={expert.id} className="card" style={{ border: `1px solid ${passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, padding: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <Avatar sx={{ bgcolor: passed ? '#10b981' : '#ef4444' }}>{expert.name?.charAt(0)}</Avatar>
                                                <div><div style={{ fontWeight: 800 }}>{expert.name}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{expert.email}</div></div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 900, color: passed ? '#10b981' : '#ef4444' }}>{expert.ai_exam_marks}%</div></div>
                                        </div>
                                        <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>"{expert.ai_exam_remarks || 'No remarks.'}"</p>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="custom-btn" style={{ flex: 1 }} onClick={() => setViewingExam(expert)}>Review</button>
                                            <button className="custom-btn btn-primary" style={{ flex: 1 }} onClick={() => handleInterviewAction(expert.id, 'passed')}>Approve</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : activeTab === 'settings' ? (
                    <div className="card" style={{ padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.5rem' }}>AI Configuration</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>HF API KEY</label>
                                <input type="password" className="custom-btn" style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'white' }} value={aiSettings.openai_api_key} onChange={e => setAiSettings({...aiSettings, openai_api_key: e.target.value})} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>SYSTEM PROMPT</label>
                                <textarea className="custom-btn" style={{ width: '100%', height: '150px', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'white' }} value={aiSettings.openai_instructions} onChange={e => setAiSettings({...aiSettings, openai_instructions: e.target.value})} />
                            </div>
                            <button className="custom-btn btn-primary" onClick={() => handleUpdateSetting('openai_instructions', aiSettings.openai_instructions)}>Update AI Engine</button>
                        </div>
                    </div>
                ) : activeTab === 'creditPlans' ? (
                    <div className="custom-table-container">
                        <header style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Monetization Plans</h3>
                        </header>
                        <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                            <div className="card" style={{ padding: 0 }}>
                                <table className="custom-table">
                                    <thead><tr><th>Plan</th><th>Credits</th><th>Price</th><th>Action</th></tr></thead>
                                    <tbody>
                                        {creditPlans.map(p => (
                                            <tr key={p.id}><td>{p.plan_name}</td><td>{p.credits}</td><td>₹{p.price}</td><td><button className="custom-btn" onClick={() => handleTogglePlan(p.id, p.status)}>{p.status === 'active' ? 'Archive' : 'Enable'}</button></td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="card" style={{ padding: '1.5rem' }}>
                                <h4 style={{ fontWeight: 800, marginBottom: '1rem' }}>New Plan</h4>
                                <input className="custom-btn" style={{ width: '100%', marginBottom: '1rem' }} placeholder="Plan Name" value={newPlan.plan_name} onChange={e => setNewPlan({...newPlan, plan_name: e.target.value})} />
                                <input className="custom-btn" style={{ width: '100%', marginBottom: '1rem' }} placeholder="Credits" value={newPlan.credits} onChange={e => setNewPlan({...newPlan, credits: e.target.value})} />
                                <input className="custom-btn" style={{ width: '100%', marginBottom: '1rem' }} placeholder="Price" value={newPlan.price} onChange={e => setNewPlan({...newPlan, price: e.target.value})} />
                                <button className="custom-btn btn-primary" style={{ width: '100%' }} onClick={handleCreateCreditPlan}>Launch</button>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'creditRequests' ? (
                    <div className="custom-table-container">
                        <header style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Purchase Requests</h3>
                        </header>
                        <table className="custom-table">
                            <thead><tr><th>User</th><th>Plan</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
                            <tbody>
                                {creditRequests.map(r => (
                                    <tr key={r.id}><td>{r.user_name}</td><td>{r.plan_name}</td><td>₹{r.amount}</td><td><span className={`custom-chip ${r.status === 'approved' ? 'chip-success' : 'chip-warning'}`}>{r.status}</span></td><td>{r.status === 'pending' && <button className="custom-btn btn-primary" onClick={() => handleCreditRequestAction(r.id, 'approve')}>Approve</button>}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : activeTab === 'expertBilling' ? (
                    <div className="custom-table-container">
                        <header style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Expert Billing</h3>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <label style={{ fontSize: '0.7rem' }}>GRACE PERIOD:</label>
                                <input type="number" style={{ width: '50px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'white' }} value={gracePeriod} onChange={e => setGracePeriod(e.target.value)} />
                                <button className="custom-btn btn-primary" style={{ padding: '2px 8px' }} onClick={handleSaveBillingSettings}>Save</button>
                            </div>
                        </header>
                        <table className="custom-table">
                            <thead><tr><th>Expert</th><th>Pending</th><th>Paid</th><th>Status</th><th>Action</th></tr></thead>
                            <tbody>
                                {billingSummary.map(b => (
                                    <tr key={b.id}><td>{b.name}</td><td style={{ color: '#ef4444' }}>₹{b.pending_amount}</td><td style={{ color: '#10b981' }}>₹{b.paid_amount}</td><td><span className={`custom-chip ${parseInt(b.is_blocked) ? 'chip-error' : 'chip-success'}`}>{parseInt(b.is_blocked) ? 'Blocked' : 'Active'}</span></td><td><button className="custom-btn" onClick={() => fetchExpertBillingDetails(b.id)}>Bills</button></td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : activeTab === 'courseOrders' ? (
                    <div className="custom-table-container">
                        <header style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Course Purchase Requests</h3>
                        </header>
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Course</th>
                                    <th>Amount</th>
                                    <th>Payment</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fetchingCourses ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading...</td></tr>
                                ) : courseOrders.length === 0 ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center' }}>No requests found.</td></tr>
                                ) : (
                                    courseOrders.map((order) => (
                                        <tr key={order.id}>
                                            <td>
                                                <div style={{ fontWeight: 700 }}>{order.user_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.user_email}</div>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{order.course_title}</td>
                                            <td style={{ fontWeight: 800 }}>₹{order.amount}</td>
                                            <td>
                                                <div>{order.payment_method}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--accent-primary)' }}>{order.transaction_id}</div>
                                            </td>
                                            <td>
                                                <span className={`custom-chip ${order.payment_status === 'approved' ? 'chip-success' : 'chip-warning'}`}>
                                                    {order.payment_status}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                {order.payment_status === 'pending' && (
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                        <button 
                                                            className="custom-btn btn-primary" 
                                                            onClick={() => handleApproveCourse(order.id, 'approved')}
                                                            style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                                                        >
                                                            Approve
                                                        </button>
                                                        <button 
                                                            className="custom-btn" 
                                                            onClick={() => handleApproveCourse(order.id, 'rejected')}
                                                            style={{ padding: '4px 12px', fontSize: '0.8rem', color: '#ef4444' }}
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : null}
            </main>

            <Dialog open={!!viewingExam} onClose={() => setViewingExam(null)} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: '#0f172a', color: 'white', borderRadius: 4, border: '1px solid var(--glass-border)' } }}>
                {viewingExam && (
                    <>
                        <DialogTitle sx={{ fontWeight: 900, borderBottom: '1px solid var(--glass-border)' }}>Exam Report: {viewingExam.name}</DialogTitle>
                        <DialogContent sx={{ p: 4 }}>
                            <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem' }}>
                                <h4 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>AI Remarks</h4>
                                <p>"{viewingExam.ai_exam_remarks}"</p>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="custom-btn btn-primary" style={{ flex: 1 }} onClick={() => handleInterviewAction(viewingExam.id, 'passed')}>Approve Expert</button>
                                <button className="custom-btn" style={{ flex: 1 }} onClick={() => handleInterviewAction(viewingExam.id, 'failed')}>Reject</button>
                            </div>
                        </DialogContent>
                    </>
                )}
            </Dialog>

            <Dialog open={confirmDialog.open} onClose={closeConfirm} PaperProps={{ sx: { bgcolor: '#1e293b', color: 'white', borderRadius: 4 } }}>
                <DialogTitle>{confirmDialog.title}</DialogTitle>
                <DialogContent><DialogContentText sx={{ color: 'rgba(255,255,255,0.7)' }}>{confirmDialog.message}</DialogContentText></DialogContent>
                <DialogActions><Button onClick={closeConfirm}>Cancel</Button><button className="custom-btn btn-primary" onClick={confirmDialog.onConfirm}>Confirm</button></DialogActions>
            </Dialog>

            <Dialog open={!!editingExpert} onClose={() => setEditingExpert(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#1e293b', color: 'white', borderRadius: 4 } }}>
                <DialogTitle>Edit Expert</DialogTitle>
                <DialogContent>
                    <input className="custom-btn" style={{ width: '100%', marginBottom: '1rem' }} value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                    <input className="custom-btn" style={{ width: '100%', marginBottom: '1rem' }} value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                </DialogContent>
                <DialogActions><Button onClick={() => setEditingExpert(null)}>Cancel</Button><button className="custom-btn btn-primary" onClick={handleSaveExpert}>Save</button></DialogActions>
            </Dialog>

            <Dialog open={!!editingUser} onClose={() => setEditingUser(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#1e293b', color: 'white', borderRadius: 4 } }}>
                <DialogTitle>Edit User</DialogTitle>
                <DialogContent>
                    <input className="custom-btn" style={{ width: '100%', marginBottom: '1rem' }} value={userEditForm.name} onChange={e => setUserEditForm({...userEditForm, name: e.target.value})} />
                    <input className="custom-btn" style={{ width: '100%', marginBottom: '1rem' }} value={userEditForm.phone} onChange={e => setUserEditForm({...userEditForm, phone: e.target.value})} />
                </DialogContent>
                <DialogActions><Button onClick={() => setEditingUser(null)}>Cancel</Button><button className="custom-btn btn-primary" onClick={handleSaveUser}>Save</button></DialogActions>
            </Dialog>

            <Dialog open={viewingExpertBills} onClose={() => setViewingExpertBills(false)} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: '#1e293b', color: 'white', borderRadius: 4 } }}>
                <DialogTitle>Billing Details</DialogTitle>
                <DialogContent>
                    <table className="custom-table">
                        <thead><tr><th>Date</th><th>Activity</th><th>Amount</th><th>Action</th></tr></thead>
                        <tbody>
                            {selectedExpertBills.bills.map(b => (
                                <tr key={b.id}><td>{new Date(b.created_at).toLocaleDateString()}</td><td>{b.activity_type}</td><td>₹{b.amount}</td><td>{b.status === 'pending' && <button className="custom-btn btn-primary" onClick={() => handleMarkBillAsPaid(b.id, b.expert_id)}>Mark Paid</button>}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </DialogContent>
                <DialogActions><Button onClick={() => setViewingExpertBills(false)}>Close</Button></DialogActions>
            </Dialog>
        </div>
    );
}
