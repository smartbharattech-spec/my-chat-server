import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, MessageSquare, ArrowLeft, Mail, Phone, 
    Calendar, Search, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MarketplaceSidebar from '../../components/MarketplaceSidebar';
import { useChat } from '../../contexts/ChatContext';
import './OccultExpertPremium.css';
import './ExpertBills.css';

const FollowerCard = ({ follower, index, isOnline, handleChat, formatDate, navigate }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, delay: index * 0.05, cubicBezier: [0.4, 0, 0.2, 1] }}
            className="premium-table-row"
            style={{ 
                background: 'white', 
                borderRadius: '24px', 
                padding: '1.5rem 2rem', 
                marginBottom: '1rem',
                border: '1px solid rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                alignItems: window.innerWidth < 768 ? 'flex-start' : 'center',
                gap: '2rem',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
                transition: 'all 0.3s ease'
            }}
        >
            {/* Profile Info Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: '240px' }}>
                <div style={{ position: 'relative' }}>
                    <div style={{ 
                        width: '60px', height: '60px', borderRadius: '18px', 
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.5rem', fontWeight: 900, boxShadow: '0 8px 16px -4px rgba(245, 158, 11, 0.3)'
                    }}>
                        {follower.profile_image ? (
                            <img src={`/${follower.profile_image}`} alt="" style={{ width: '100%', height: '100%', borderRadius: '18px', objectFit: 'cover' }} />
                        ) : (
                            follower.name.charAt(0)
                        )}
                    </div>
                    <div style={{ 
                        position: 'absolute', bottom: '-4px', right: '-4px',
                        width: '18px', height: '18px', borderRadius: '50%',
                        background: isOnline ? '#22c55e' : '#94a3b8', 
                        border: '3px solid #fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }} />
                </div>
                <div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.25rem' }}>{follower.name}</div>
                    <span style={{ 
                        fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px',
                        background: isOnline ? 'rgba(34, 197, 94, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                        color: isOnline ? '#16a34a' : '#64748b',
                        textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}>
                        {isOnline ? 'Active Now' : 'Offline'}
                    </span>
                </div>
            </div>

            {/* Contact Details */}
            <div style={{ 
                flex: 1, display: 'flex', 
                flexDirection: window.innerWidth < 1024 ? 'column' : 'row',
                gap: window.innerWidth < 1024 ? '0.75rem' : '3rem',
                color: '#64748b'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>
                    <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '10px' }}><Mail size={16} /></div>
                    {follower.email}
                </div>
                {follower.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>
                        <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '10px' }}><Phone size={16} /></div>
                        {follower.phone}
                    </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>
                    <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '10px' }}><Calendar size={16} /></div>
                    Joined {formatDate(follower.followed_at)}
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', width: window.innerWidth < 768 ? '100%' : 'auto' }}>
                <button
                    onClick={() => handleChat(follower)}
                    className="premium-btn-primary"
                    style={{ 
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        padding: '0.875rem 1.75rem', borderRadius: '14px', border: 'none', cursor: 'pointer',
                        fontSize: '0.95rem', fontWeight: 800
                    }}
                >
                    <MessageSquare size={18} /> Chat
                </button>
            </div>
        </motion.div>
    );
};

export default function ExpertFollowers() {
    const navigate = useNavigate();
    const { setActiveConversation, onlineUsers } = useChat();
    
    const [user] = useState(() => {
        const stored = localStorage.getItem('occult_user');
        return stored ? JSON.parse(stored) : null;
    });
    const [followers, setFollowers] = useState([]);
    const [loading, setLoading] = useState(!user);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        if (!user) {
            navigate('/occult/login');
            return;
        }

        fetchFollowers(user.id);
        const interval = setInterval(() => fetchFollowers(user.id, true), 15000);
        return () => clearInterval(interval);
    }, [navigate, user?.id]);

    const fetchFollowers = async (expertId, silent = false) => {
        if (!silent && !followers.length) setLoading(true);
        try {
            const response = await fetch(`/api/marketplace/get_followers.php?expert_id=${expertId}`);
            const data = await response.json();
            if (data.status === 'success') {
                if (JSON.stringify(data.data) !== JSON.stringify(followers)) {
                    setFollowers(data.data);
                }
            }
        } catch (err) {
            console.error('Error fetching followers:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChat = (follower) => {
        setActiveConversation({
            id: null,
            expert_id: user.id,
            user_id: follower.user_id,
            other_party_name: follower.name,
            profile_image: follower.profile_image ? `/${follower.profile_image}` : null
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const filteredFollowers = useMemo(() => {
        const filtered = followers.filter(f => 
            f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            f.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (f.phone && f.phone.includes(searchQuery))
        );

        return [...filtered].sort((a, b) => {
            const aOnline = a.is_online == 1 || onlineUsers.has(String(a.user_id));
            const bOnline = b.is_online == 1 || onlineUsers.has(String(b.user_id));
            if (aOnline && !bOnline) return -1;
            if (!aOnline && bOnline) return 1;
            return a.name.localeCompare(b.name);
        });
    }, [followers, searchQuery, onlineUsers]);

    useEffect(() => setPage(1), [searchQuery]);

    const paginatedFollowers = useMemo(() => {
        const startIndex = (page - 1) * itemsPerPage;
        return filteredFollowers.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredFollowers, page]);

    if (!user) return null;

    return (
        <div className="premium-dashboard-container" style={{ display: 'flex' }}>
            <MarketplaceSidebar user={user} role="expert" />

            <div className="premium-content-area" style={{ flex: 1 }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div className="premium-header animate-fade-in">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '0.5rem' }}>
                        <button 
                            onClick={() => navigate(-1)} 
                            className="premium-modal-close"
                            style={{ background: 'white', border: '1px solid #e2e8f0', width: '42px', height: '42px' }}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="premium-title" style={{ margin: 0 }}>
                            Followers <span style={{ color: '#f59e0b', marginLeft: '0.5rem' }}>Community</span>
                        </h1>
                    </div>
                    <p className="premium-subtitle">
                        You have <strong style={{ color: '#0f172a' }}>{followers.length}</strong> people following your work
                    </p>
                </div>

                <div className="animate-fade-in" style={{ marginBottom: '2.5rem' }}>
                    <div style={{ 
                        position: 'relative', 
                        maxWidth: '500px',
                        background: 'white',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
                    }}>
                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                            <Search size={20} />
                        </div>
                        <input 
                            type="text" 
                            className="premium-input" 
                            style={{ 
                                paddingLeft: '3.5rem', border: 'none', 
                                background: 'transparent', height: '56px', fontSize: '1.05rem' 
                            }}
                            placeholder="Search by name, email or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 15, gap: 2, padding: '10rem 0' }}>
                        <div className="expert-wallet-spinner" />
                        <p style={{ fontWeight: 800, color: '#94a3b8', marginTop: '1.5rem' }}>SYNCING COMMUNITY...</p>
                    </div>
                ) : filteredFollowers.length > 0 ? (
                    <div className="animate-fade-in">
                        <AnimatePresence mode="popLayout">
                            {paginatedFollowers.map((follower, index) => {
                                const followerId = String(follower.user_id);
                                const isOnline = follower.is_online == 1 || Array.from(onlineUsers).some(id => String(id) === followerId);
                                return (
                                    <FollowerCard 
                                        key={follower.user_id}
                                        follower={follower} 
                                        index={index} 
                                        isOnline={isOnline}
                                        handleChat={handleChat}
                                        formatDate={formatDate}
                                        navigate={navigate}
                                    />
                                );
                            })}
                        </AnimatePresence>

                        {filteredFollowers.length > itemsPerPage && (
                            <div style={{ 
                                display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '3rem' 
                            }}>
                                {Array.from({ length: Math.ceil(filteredFollowers.length / itemsPerPage) }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setPage(i + 1)}
                                        style={{ 
                                            width: '48px', height: '48px', borderRadius: '14px', 
                                            border: 'none', cursor: 'pointer', fontWeight: 900,
                                            background: page === i + 1 ? '#f59e0b' : 'white',
                                            color: page === i + 1 ? 'white' : '#64748b',
                                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="premium-glass-card" style={{ textAlign: 'center', padding: '8rem 2rem', borderStyle: 'dashed', borderWidth: '2px' }}>
                        <div style={{ background: '#fef3c7', width: '100px', height: '100px', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: '#f59e0b' }}>
                            <Users size={52} strokeWidth={1.5} />
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', marginBottom: '1rem' }}>
                            {searchQuery ? 'No matches found' : 'Your community is growing!'}
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '1.2rem', maxWidth: '500px', margin: '0 auto 2rem', fontWeight: 500, lineHeight: 1.6 }}>
                            {searchQuery 
                                ? `We couldn't find any followers matching "${searchQuery}". Try a different name or email.`
                                : "Keep sharing your profile to attract more followers. Everyone who follows you will appear right here."
                            }
                        </p>
                        {!searchQuery && (
                            <button className="premium-btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
                                <ExternalLink size={20} style={{ marginRight: '0.75rem' }} /> Share Profile
                            </button>
                        )}
                    </motion.div>
                )}
                </div>
            </div>
        </div>
    );
}
