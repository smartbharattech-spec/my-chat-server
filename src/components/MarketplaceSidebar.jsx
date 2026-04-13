import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    Search,
    Wallet,
    MessageSquare,
    Calendar,
    Settings,
    LogOut,
    ShieldCheck,
    CreditCard,
    Menu,
    X,
    ShoppingBag,
    Package,
    BarChart2,
    Heart,
    FileText,
    Zap,
    ChevronRight,
    AlertCircle,
    PlayCircle
} from 'lucide-react';
import './MarketplaceSidebar.css';
import { useChat } from '../contexts/ChatContext';

export default function MarketplaceSidebar({ user, role }) {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [logoutOpen, setLogoutOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { isChatOpen } = useChat();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const confirmLogout = () => {
        if (user?.id) {
            fetch('/api/marketplace/logout_session.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ user_id: user.id })
            }).finally(() => {
                localStorage.removeItem('occult_token');
                localStorage.removeItem('occult_user');
                navigate('/occult/login');
            });
        } else {
            localStorage.removeItem('occult_token');
            localStorage.removeItem('occult_user');
            navigate('/occult/login');
        }
    };

    const isAdmin = role === 'admin';
    const isExpert = role === 'expert' || user?.role === 'expert';
    const isUser = role === 'user' || user?.role === 'user';

    const isBlocked = user?.is_blocked === 1 || user?.is_blocked === true;
    const blockReason = user?.block_reason || '';

    const menuItems = [
        ...(isAdmin ? [{ text: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/occult/admin' }] : []),

        ...(isAdmin ? [
            { text: 'Manage Experts', icon: <ShieldCheck size={20} />, path: '/occult/admin?tab=expertsList' },
            { text: 'Manage Users', icon: <Users size={20} />, path: '/occult/admin?tab=manageUsers' },
            { text: 'Credit Plans', icon: <CreditCard size={20} />, path: '/occult/admin?tab=creditPlans' },
            { text: 'Credit Requests', icon: <Heart size={20} />, path: '/occult/admin?tab=creditRequests' },
            { text: 'Billing Settings', icon: <Settings size={20} />, path: '/occult/admin-billing' },
            { text: 'Store', icon: <ShoppingBag size={20} />, path: '/occult/admin-store' },
            { text: 'Order Management', icon: <ShoppingBag size={20} />, path: '/occult/admin-orders' },
            { text: 'Course Orders', icon: <PlayCircle size={20} />, path: '/occult/admin?tab=courseOrders' },
            { text: 'Tracker', icon: <BarChart2 size={20} />, path: '/occult/admin-tracker' },
        ] : []),
        ...(isUser ? [
            { text: 'Following', icon: <Heart size={20} />, path: '/occult/following' },
            { text: 'My Orders', icon: <ShoppingBag size={20} />, path: '/occult/my-orders' },
            { text: 'Tracker', icon: <BarChart2 size={20} />, path: '/occult/tracker' },
            { text: 'My Courses', icon: <PlayCircle size={20} />, path: '/occult/my-courses' },
            { text: 'My Wallet', icon: <Wallet size={20} />, path: '/occult/user-wallet' },
            { text: 'Vastu Reports', icon: <LayoutDashboard size={20} />, path: '/occult/reports' },
            { text: 'Community', icon: <Users size={20} />, path: '/occult/community' },
        ] : []),
        ...(isExpert ? [
            { text: 'Followers', icon: <Users size={20} />, path: '/occult/followers' },
            { text: 'My Store', icon: <ShoppingBag size={20} />, path: '/occult/expert-store' },
            { text: 'My Sales', icon: <Package size={20} />, path: '/occult/expert-orders' },
            { text: 'My Wallet', icon: <CreditCard size={20} />, path: '/occult/expert-wallet' },
            { text: 'Bills', icon: <FileText size={20} />, path: '/occult/expert-bills' },
            { text: 'Tracker', icon: <BarChart2 size={20} />, path: '/occult/expert-tracker' },
            { text: 'Manage Courses', icon: <PlayCircle size={20} color="#f59e0b" />, path: '/occult/expert/manage-courses' },
            { text: 'Manage Plans', icon: <Zap size={20} />, path: '/occult/expert-plans' },
            { text: 'Community', icon: <Users size={20} />, path: '/occult/community' },
            { text: 'Vastu Tool', icon: <LayoutDashboard size={20} />, path: '/dashboard' }
        ] : []),
        { text: 'Profile Settings', icon: <Settings size={20} />, path: '/occult/settings' }
    ];

    const [counts, setCounts] = useState({
        pending_experts: 0,
        total_users: 0,
        total_products: 0,
        total_orders: 0
    });

    useEffect(() => {
        if (isAdmin) {
            fetch("/api/marketplace/admin_dashboard_stats.php")
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        setCounts(data.counts);
                    }
                })
                .catch(err => console.error("Failed to fetch counts", err));
        }
    }, [isAdmin]);

    // Heartbeat logic
    useEffect(() => {
        if (!user?.id) return;

        const sendPing = () => {
            fetch('/api/marketplace/ping_online.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ user_id: user.id })
            }).catch(err => console.error("Ping failed", err));
        };

        const setOffline = () => {
            if (user?.id) {
                const formData = new FormData();
                formData.append('user_id', user.id);
                navigator.sendBeacon('/api/marketplace/logout_session.php', formData);
            }
        };

        sendPing();
        const interval = setInterval(sendPing, 30000);
        window.addEventListener('beforeunload', setOffline);

        return () => {
            clearInterval(interval);
            window.removeEventListener('beforeunload', setOffline);
            setOffline();
        };
    }, [user?.id]);

    const SidebarContent = () => (
        <div className="custom-sidebar-container">
            {/* Header / Brand */}
            <div className="sidebar-brand">
                <div className="brand-logo">
                    <ShieldCheck color="white" size={24} />
                </div>
                <div className="brand-text">
                    THE SANATAN <span>GURUKUL</span>
                </div>
                {isMobile && (
                    <button className="sidebar-close-btn" onClick={handleDrawerToggle}>
                        <X size={24} />
                    </button>
                )}
            </div>

            <div className="sidebar-divider" />

            {/* Profile Summary */}
            <div className="sidebar-profile">
                <div className={`sidebar-avatar ${isBlocked ? 'blocked' : ''}`}>
                    {user?.name?.charAt(0)}
                </div>
                <div className="sidebar-profile-info">
                    <div className="sidebar-profile-name">{user?.name}</div>
                    <div className="sidebar-profile-role">
                        {role} Panel
                        {isBlocked && <span className="blocked-badge">BLOCKED</span>}
                    </div>
                </div>
            </div>

            {isExpert && isBlocked && (
                <div className="sidebar-blocked-alert">
                    <div className="blocked-header">
                        <AlertCircle size={14} /> ACCOUNT BLOCKED
                    </div>
                    <div className="blocked-reason">{blockReason}</div>
                    <button 
                        className="blocked-action-btn"
                        onClick={() => {
                            navigate('/occult/expert-bills');
                            if (isMobile) setMobileOpen(false);
                        }}
                    >
                        View & Pay Bills
                    </button>
                </div>
            )}

            {/* Navigation */}
            <nav className="sidebar-nav">
                <ul className="sidebar-menu">
                    {menuItems.map((item) => {
                        const fullPath = location.pathname + location.search;
                        const isActive = item.path === '#' ? false : (
                            fullPath === item.path || 
                            (location.pathname === item.path && !menuItems.some(otherItem => 
                                otherItem !== item && 
                                otherItem.path.startsWith(item.path) && 
                                otherItem.path.includes('?') && 
                                fullPath === otherItem.path
                            ))
                        );

                        let badgeCount = 0;
                        let badgeType = 'default';
                        if (item.text === 'Manage Experts' && counts.pending_experts > 0) {
                            badgeCount = counts.pending_experts;
                            badgeType = 'danger';
                        } else if (item.text === 'Manage Users' && counts.total_users > 0) {
                            badgeCount = counts.total_users;
                        } else if (item.text === 'Store' && counts.total_products > 0) {
                            badgeCount = counts.total_products;
                        } else if (item.text === 'Order Management' && counts.total_orders > 0) {
                            badgeCount = counts.total_orders;
                        }

                        return (
                            <li key={item.text} className="sidebar-menu-item">
                                <button
                                    className={`sidebar-menu-btn ${isActive ? 'active' : ''}`}
                                    onClick={() => {
                                        if (item.path !== '#') {
                                            navigate(item.path);
                                            if (isMobile) setMobileOpen(false);
                                        }
                                    }}
                                >
                                    <span className="menu-icon">{item.icon}</span>
                                    <span className="menu-text">{item.text}</span>
                                    {badgeCount > 0 && (
                                        <span className={`menu-badge ${badgeType}`}>
                                            {badgeCount}
                                        </span>
                                    )}
                                    {isActive && <ChevronRight size={14} className="active-arrow" />}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Footer / Actions */}
            <div className="sidebar-footer">
                <button className="sidebar-logout-btn" onClick={() => setLogoutOpen(true)}>
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile AppBar */}
            {isMobile && !isChatOpen && (
                <header className="mobile-appbar">
                    <button className="mobile-menu-trigger" onClick={handleDrawerToggle}>
                        <Menu size={24} />
                    </button>
                    <div className="mobile-brand">
                        THE SANATAN <span>GURUKUL</span>
                    </div>
                </header>
            )}

            {/* Desktop / Mobile Sidebar */}
            <aside className={`marketplace-sidebar ${isMobile ? 'mobile' : 'desktop'}`}>
                <AnimatePresence>
                    {(mobileOpen || !isMobile) && (
                        <motion.div
                            initial={isMobile ? { x: -280 } : false}
                            animate={{ x: 0 }}
                            exit={isMobile ? { x: -280 } : false}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="sidebar-wrapper"
                        >
                            <SidebarContent />
                        </motion.div>
                    )}
                </AnimatePresence>
                {isMobile && mobileOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="sidebar-overlay" 
                        onClick={handleDrawerToggle} 
                    />
                )}
            </aside>

            {/* Logout Dialog */}
            <AnimatePresence>
                {logoutOpen && (
                    <div className="premium-modal-overlay" onClick={() => setLogoutOpen(false)}>
                        <motion.div 
                            className="premium-modal logout-modal"
                            onClick={e => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        >
                            <div className="premium-modal-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
                                        <LogOut size={24} color="#ef4444" />
                                    </div>
                                    <h3 className="premium-modal-title">Sign Out</h3>
                                </div>
                                <button className="premium-modal-close" onClick={() => setLogoutOpen(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="premium-modal-body">
                                <p style={{ color: '#64748b', fontSize: '1.1rem', lineHeight: 1.6, fontWeight: 500 }}>
                                    Are you sure you want to sign out? You will need to log in again to access your dashboard.
                                </p>
                            </div>
                            <div className="premium-modal-footer">
                                <button className="premium-btn-secondary" onClick={() => setLogoutOpen(false)}>
                                    Cancel
                                </button>
                                <button className="premium-btn-primary danger" onClick={confirmLogout}>
                                    Yes, Sign Out
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
