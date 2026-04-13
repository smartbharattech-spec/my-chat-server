import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, Users, ShoppingBag, 
    Settings, Star, Wallet, Sparkles, TrendingUp, ChevronRight, 
    Bell, Zap, Globe, Shield, RefreshCcw, Box as BoxIcon,
    Eye, IndianRupee, ExternalLink, Share2, BookOpen,
    ArrowUpRight, Target, Activity, Heart, Clock, PlayCircle
} from 'lucide-react';
import MarketplaceSidebar from '../../components/MarketplaceSidebar';
import BlockingOverlay from '../../components/BlockingOverlay';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../services/ToastService';
import './OccultExpertPremium.css';
import './ExpertBills.css'; // Shared premium styles

const CustomBentoCard = ({ children, gridSpan = 4, delay = 0, className = "" }) => (
    <motion.div
        className={`premium-glass-card ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        style={{ 
            gridColumn: `span ${gridSpan}`, 
            padding: '2rem',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}
    >
        {children}
    </motion.div>
);

export default function ExpertDashboard() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(true);
    const [recentRemedies, setRecentRemedies] = useState([]);
    const [isBlocked, setIsBlocked] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('occult_user');
        if (!storedUser) {
            navigate('/occult/login');
        } else {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchExpertProfile(parsedUser.id);
            fetchRecentRemedies(parsedUser.email);
        }
    }, [navigate]);

    const fetchExpertProfile = async (userId) => {
        try {
            const response = await fetch(`/api/marketplace/get_expert_profile.php?user_id=${userId}`);
            const data = await response.json();
            if (data.status === 'success') {
                setProfile(data.profile);
                const billRes = await fetch('/api/marketplace/expert_billing.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'get_bills', expert_id: userId })
                });
                const billData = await billRes.json();
                if (billData.status === 'success') {
                    setIsBlocked(billData.is_blocked);
                }
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentRemedies = async (email) => {
        try {
            const response = await fetch(`/api/projects.php?email=${email}&limit=20`);
            const res = await response.json();
            if (res.status === 'success' && res.data) {
                const allRemedies = [];
                res.data.forEach(project => {
                    if (project.project_data) {
                        try {
                            const data = JSON.parse(project.project_data);
                            if (data.customZoneRemedies) {
                                data.customZoneRemedies.forEach(rem => {
                                    allRemedies.push({
                                        ...rem,
                                        projectName: project.project_name,
                                        projectId: project.id,
                                        createdAt: project.created_at
                                    });
                                });
                            }
                        } catch (e) { }
                    }
                });
                allRemedies.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setRecentRemedies(allRemedies.slice(0, 3));
            }
        } catch (error) {
            console.error("Error fetching remedies:", error);
        }
    };

    if (loading) return (
        <div className="expert-wallet-loader-container">
            <div className="expert-wallet-spinner"></div>
        </div>
    );
    
    if (!user) return null;

    return (
        <div className="premium-dashboard-container" style={{ display: 'flex' }}>
            <BlockingOverlay />
            <MarketplaceSidebar user={user} role="expert" />

            <div className="premium-main-wrapper">
                <div className="premium-content-area">
                {/* Header */}
                <div className="premium-header animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                            <div className="premium-metric-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', marginBottom: 0, width: '48px', height: '48px' }}>
                                <Sparkles size={24} color="#f59e0b" />
                            </div>
                            <span style={{ color: '#f59e0b', fontWeight: 800, letterSpacing: '0.05em' }}>EXPERT PORTAL</span>
                        </div>
                        <h1 className="premium-title" style={{ margin: 0, fontSize: '3.5rem' }}>
                            Greetings, <span style={{ color: '#f59e0b' }}>{user.name}</span>
                        </h1>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ 
                            background: 'white', padding: '0.75rem 1.5rem', borderRadius: '100px', 
                            display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                        }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isOnline ? '#10b981' : '#cbd5e1', boxShadow: isOnline ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none' }} />
                            <span style={{ fontWeight: 900, fontSize: '0.85rem', color: '#0f172a' }}>{isOnline ? 'ACTIVE' : 'OFFLINE'}</span>
                            <div 
                                onClick={() => setIsOnline(!isOnline)}
                                style={{ 
                                    width: '44px', height: '24px', borderRadius: '100px', 
                                    backgroundColor: isOnline ? '#f59e0b' : '#e2e8f0',
                                    position: 'relative', cursor: 'pointer', transition: 'all 0.3s ease'
                                }}
                            >
                                <div style={{ 
                                    width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                                    position: 'absolute', top: '3px', left: isOnline ? '23px' : '3px',
                                    transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }} />
                            </div>
                        </div>
                        <button className="premium-btn-secondary" onClick={() => window.open(`/@${profile?.slug || ''}`, '_blank')} style={{ borderRadius: '100px', padding: '0 2rem' }}>
                            <Eye size={18} />
                            Live Profile
                        </button>
                    </div>
                </div>

                {/* Bento Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }} className="expert-dashboard-grid animate-fade-in">
                    
                    {/* Primary Stats */}
                    <div style={{ gridColumn: 'span 8', gridRow: 'span 2' }}>
                        <div className="premium-metric-card dark" style={{ height: '100%', padding: '3.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: '-10%', right: '-5%', opacity: 0.05 }}>
                                <TrendingUp size={300} />
                            </div>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <span style={{ opacity: 0.7, fontSize: '1.1rem', fontWeight: 600, letterSpacing: '0.1em' }}>TOTAL REVENUE</span>
                                <div style={{ fontSize: '5rem', fontWeight: 950, margin: '1rem 0' }}>₹45,820<span style={{ fontSize: '2rem', opacity: 0.5 }}>.00</span></div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.5rem 1.25rem', borderRadius: '100px', fontWeight: 800, fontSize: '0.9rem' }}>
                                        +24.5% THIS MONTH
                                    </div>
                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Performance is peaking</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Followers Summary */}
                    <CustomBentoCard gridSpan={4}>
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                            <div className="premium-metric-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                                <Users size={24} />
                            </div>
                            <div>
                                <div style={{ fontSize: '3rem', fontWeight: 950, color: '#0f172a' }}>{profile?.followers_count || 0}</div>
                                <div style={{ color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>LOYAL FOLLOWERS</div>
                            </div>
                            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '10px', marginTop: '1rem', overflow: 'hidden' }}>
                                <motion.div 
                                    initial={{ width: 0 }} 
                                    animate={{ width: '65%' }} 
                                    transition={{ duration: 1.5, delay: 0.5 }}
                                    style={{ height: '100%', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: '10px' }} 
                                />
                            </div>
                        </div>
                    </CustomBentoCard>

                    {/* Active Sessions/Live */}
                    <CustomBentoCard gridSpan={4} delay={0.1}>
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                            <div className="premium-metric-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                                <Activity size={24} />
                            </div>
                            <div>
                                <div style={{ fontSize: '3rem', fontWeight: 950, color: '#0f172a' }}>12</div>
                                <div style={{ color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>ACTIVE QUERIES</div>
                            </div>
                            <button className="premium-btn-primary" style={{ width: '100%', marginTop: '1.5rem', borderRadius: '16px' }} onClick={() => navigate('/occult/expert-followers')}>
                                Respond Now
                            </button>
                        </div>
                    </CustomBentoCard>

                    {/* Public Presence */}
                    <div style={{ gridColumn: 'span 12' }}>
                        <div className="premium-glass-card" style={{ 
                            background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)', 
                            color: 'white', 
                            border: 'none',
                            padding: '3rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ maxWidth: '60%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                    <Globe size={28} />
                                    <h2 style={{ fontSize: '2rem', fontWeight: 950, margin: 0 }}>Public Presence</h2>
                                </div>
                                <p style={{ fontSize: '1.1rem', fontWeight: 500, opacity: 0.9, lineHeight: 1.6 }}>
                                    Your profile is the gateway to your wisdom. Share your unique link to invite seekers into your cosmic universe.
                                </p>
                                <div style={{ 
                                    marginTop: '2rem', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
                                    padding: '1.25rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.3)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem'
                                }}>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        thesanatangurukul.com/@{profile?.slug || 'expert'}
                                    </div>
                                    <button 
                                        className="premium-btn-secondary" 
                                        style={{ background: 'white', color: '#ea580c', border: 'none', padding: '0.75rem 2rem' }}
                                        onClick={() => {
                                            navigator.clipboard.writeText(`https://thesanatangurukul.com/@${profile?.slug || 'expert'}`);
                                            showToast('profile_link', 'Profile link copied to clipboard!', 'success');
                                        }}
                                    >
                                        <Share2 size={18} />
                                        Copy Link
                                    </button>
                                </div>
                            </div>
                            <div style={{ width: '180px', height: '180px', background: 'white', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                                <Sparkles size={80} color="#f59e0b" />
                            </div>
                        </div>
                    </div>

                    {/* Quick Navigation */}
                    <div style={{ gridColumn: 'span 12', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}>
                        {[
                            { label: 'Store Management', icon: <ShoppingBag size={24} />, path: '/occult/expert-store', color: '#10b981' },
                            { label: 'Course Management', icon: <PlayCircle size={24} />, path: '/occult/expert/manage-courses', color: '#f59e0b' },
                            { label: 'Market Tracking', icon: <Target size={24} />, path: '/occult/expert-tracker', color: '#ef4444' },
                            { label: 'Financial Vault', icon: <Wallet size={24} />, path: '/occult/expert-wallet', color: '#8b5cf6' },
                            { label: 'Portal Settings', icon: <Settings size={24} />, path: '/occult/settings', color: '#6366f1' }
                        ].map((item, idx) => (
                            <motion.div 
                                key={idx}
                                whileHover={{ y: -8, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate(item.path)}
                                className="premium-glass-card"
                                style={{ padding: '2rem', cursor: 'pointer', textAlign: 'center' }}
                            >
                                <div style={{ 
                                    background: `${item.color}15`, color: item.color, 
                                    width: '60px', height: '60px', borderRadius: '20px', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 1.5rem'
                                }}>
                                    {item.icon}
                                </div>
                                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>{item.label}</span>
                            </motion.div>
                        ))}
                    </div>

                    {/* Recent Activities */}
                    <CustomBentoCard gridSpan={12} delay={0.2}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.75rem', fontWeight: 950, margin: 0, color: '#0f172a' }}>Divine Interventions</h3>
                                <p style={{ color: '#64748b', fontWeight: 600, margin: '0.25rem 0 0 0' }}>Latest custom remedies added for seekers.</p>
                            </div>
                            <button className="premium-btn-secondary" onClick={() => navigate('/projects')}>
                                All Projects
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        {recentRemedies.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                                <div style={{ background: '#f1f5f9', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                    <BookOpen size={32} color="#cbd5e1" />
                                </div>
                                <p style={{ color: '#94a3b8', fontWeight: 700 }}>No recent remedies found.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {recentRemedies.map((rem, idx) => (
                                    <div key={idx} className="premium-list-item" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                        <div className="premium-item-icon" style={{ backgroundColor: '#fff7ed', color: '#f59e0b' }}>
                                            <Sparkles size={20} />
                                        </div>
                                        <div className="premium-item-info">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                                <div className="premium-status-badge" style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.7rem' }}>PROJECT CASE</div>
                                                <div className="premium-item-title" style={{ fontSize: '1.1rem' }}>{rem.projectName}</div>
                                            </div>
                                            <div className="premium-item-meta">
                                                <span style={{ color: '#0f172a', fontWeight: 800 }}>"{rem.remedy}"</span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div className="premium-item-value" style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                                                {new Date(rem.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </div>
                                            <button className="premium-btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', marginTop: '0.5rem' }} onClick={() => navigate(`/tool?id=${rem.projectId}`)}>
                                                Open Case
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CustomBentoCard>

                </div>
                </div>
            </div>
        </div>
    );
}
