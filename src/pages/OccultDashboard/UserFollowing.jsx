import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, MessageSquare, ArrowLeft, Mail, Star, 
    Calendar, Search, UserMinus, UserCheck, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MarketplaceSidebar from '../../components/MarketplaceSidebar';
import { useChat } from '../../contexts/ChatContext';
import './OccultExpertPremium.css';
import './ExpertBills.css';

const ExpertRow = ({ expert, index, handleChat, formatDate, navigate }) => {
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
                        {expert.profile_image ? (
                            <img src={`/${expert.profile_image}`} alt="" style={{ width: '100%', height: '100%', borderRadius: '18px', objectFit: 'cover' }} />
                        ) : (
                            expert.expert_name ? expert.expert_name.charAt(0) : '?'
                        )}

                    </div>
                </div>
                <div>
                    <div 
                        onClick={() => navigate(`/occult/expert/${expert.user_id}`)}
                        style={{ fontSize: '1.15rem', fontWeight: 950, color: '#0f172a', marginBottom: '0.25rem', cursor: 'pointer' }}
                    >
                        {expert.expert_name}
                    </div>
                    <span style={{ 
                        fontSize: '0.7rem', fontWeight: 800, padding: '2px 10px', borderRadius: '6px',
                        background: '#f1f5f9',
                        color: '#64748b',
                        textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}>
                        {expert.primary_skill || 'Spiritual Expert'}
                    </span>
                </div>
            </div>

            {/* Expert Metas */}
            <div style={{ 
                flex: 1, display: 'flex', 
                flexDirection: window.innerWidth < 1024 ? 'column' : 'row',
                gap: window.innerWidth < 1024 ? '0.75rem' : '3rem',
                color: '#64748b'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>
                    <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '10px' }}><Star size={16} /></div>
                    {expert.avg_rating || '5.0'} Rating
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>
                    <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '10px' }}><Calendar size={16} /></div>
                    Following since {formatDate(expert.followed_at)}
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', width: window.innerWidth < 768 ? '100%' : 'auto' }}>
                <button
                    onClick={() => handleChat(expert)}
                    className="premium-btn-primary"
                    style={{ 
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        padding: '0.875rem 1.75rem', borderRadius: '14px', border: 'none', cursor: 'pointer',
                        fontSize: '0.95rem', fontWeight: 800, background: '#0f172a'
                    }}
                >
                    <MessageSquare size={18} /> Message
                </button>
                <button
                    onClick={() => navigate(`/occult/expert/${expert.user_id}`)}
                    style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '48px', height: '48px', borderRadius: '14px', border: '1px solid #e2e8f0', 
                        background: 'white', cursor: 'pointer'
                    }}
                >
                    <ExternalLink size={18} color="#64748b" />
                </button>
            </div>
        </motion.div>
    );
};

export default function UserFollowing() {
    const navigate = useNavigate();
    const { setActiveConversation } = useChat();
    
    const [user] = useState(() => {
        const stored = localStorage.getItem('occult_user');
        return stored ? JSON.parse(stored) : null;
    });
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(!user);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!user) {
            navigate('/occult/login');
            return;
        }
        fetchFollowing(user.id);
    }, [navigate, user?.id]);

    const fetchFollowing = async (userId) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/marketplace/get_followed_experts.php?user_id=${userId}`);
            const data = await response.json();
            if (data.status === 'success') {
                setFollowing(data.data);
            }
        } catch (err) {
            console.error('Error fetching following:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChat = (expert) => {
        setActiveConversation({
            id: null,
            expert_id: expert.user_id,
            user_id: user.id,
            other_party_name: expert.expert_name,
            profile_image: expert.profile_image ? `/${expert.profile_image}` : null
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const filteredFollowing = useMemo(() => {
        return following.filter(f => 
            (f.expert_name && f.expert_name.toLowerCase().includes(searchQuery.toLowerCase())) || 
            (f.primary_skill && f.primary_skill.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [following, searchQuery]);


    if (!user) return null;

    return (
        <div className="premium-dashboard-container" style={{ display: 'flex', background: '#f8fafc', minHeight: '100vh', width: '100%' }}>
            <MarketplaceSidebar user={user} role="user" />

            <div className="premium-content-area" style={{ flex: 1, padding: '2rem', paddingTop: window.innerWidth < 768 ? '6rem' : '2rem' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div className="premium-header animate-fade-in" style={{ marginBottom: '3rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '0.5rem' }}>
                            <h1 className="premium-title" style={{ margin: 0, fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-2px' }}>
                                My <span style={{ color: '#f59e0b' }}>Following</span>
                            </h1>
                        </div>
                        <p className="premium-subtitle" style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 600 }}>
                            You are following <strong style={{ color: '#0f172a' }}>{following.length}</strong> spiritual experts
                        </p>
                    </div>

                    <div className="animate-fade-in" style={{ marginBottom: '2.5rem' }}>
                        <div style={{ 
                            position: 'relative', 
                            maxWidth: '500px',
                            background: 'white',
                            borderRadius: '20px',
                            border: '1px solid #e2e8f0',
                            overflow: 'hidden',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                <Search size={20} />
                            </div>
                            <input 
                                type="text" 
                                className="premium-input" 
                                style={{ 
                                    paddingLeft: '3.75rem', border: 'none', 
                                    background: 'transparent', height: '64px', fontSize: '1.1rem',
                                    width: '100%'
                                }}
                                placeholder="Search by name or specialty..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 15, gap: 2, padding: '10rem 0' }}>
                            <div className="expert-wallet-spinner" />
                            <p style={{ fontWeight: 800, color: '#94a3b8', marginTop: '1.5rem', letterSpacing: '2px' }}>LOADING CONNECTIONS...</p>
                        </div>
                    ) : filteredFollowing.length > 0 ? (
                        <div className="animate-fade-in">
                            <AnimatePresence mode="popLayout">
                                {filteredFollowing.map((expert, index) => (
                                    <ExpertRow 
                                        key={expert.user_id}
                                        expert={expert} 
                                        index={index} 
                                        handleChat={handleChat}
                                        formatDate={formatDate}
                                        navigate={navigate}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="premium-glass-card" style={{ textAlign: 'center', padding: '8rem 2rem', borderStyle: 'dashed', borderWidth: '2px', borderRadius: '32px' }}>
                            <div style={{ background: '#fef3c7', width: '100px', height: '100px', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: '#f59e0b' }}>
                                <UserCheck size={52} strokeWidth={1.5} />
                            </div>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', marginBottom: '1.5rem', letterSpacing: '-1px' }}>
                                {searchQuery ? 'No matches found' : 'Find your spiritual guide'}
                            </h2>
                            <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 2.5rem', fontWeight: 500, lineHeight: 1.6 }}>
                                {searchQuery 
                                    ? `We couldn't find any experts matching "${searchQuery}".`
                                    : "Start following spiritual experts to stay updated with their posts and get exclusive credit packages."
                                }
                            </p>
                            {!searchQuery && (
                                <button onClick={() => navigate('/occult/community')} className="premium-btn-primary" style={{ padding: '1.25rem 3rem', fontSize: '1.1rem', borderRadius: '18px', background: '#0f172a' }}>
                                    <Search size={20} style={{ marginRight: '0.75rem' }} /> Explore Community
                                </button>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
