import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Button, Avatar, Grid, Container, 
    IconButton, useTheme, useMediaQuery, Chip, CircularProgress 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, Settings, MessageSquare, Star, Search, 
    Zap, Sparkles, Heart, Bell, ChevronRight, Activity, Filter
} from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import MarketplaceSidebar from '../../components/MarketplaceSidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../../utils/config';

export default function UserDashboard() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
    
    const { setActiveConversation, onlineUsers } = useChat();
    const [user, setUser] = useState(null);
    const [followedExperts, setFollowedExperts] = useState([]);
    const [loadingFollows, setLoadingFollows] = useState(true);
    const [credits, setCredits] = useState(0);

    useEffect(() => {
        const storedUser = localStorage.getItem('occult_user');
        if (!storedUser) {
            navigate('/occult/login');
        } else {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchFollowedExperts(parsedUser.id);
            fetchCredits(parsedUser.id);
        }
    }, [navigate]);

    const fetchCredits = async (userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/marketplace/get_user_credits.php?user_id=${userId}`);
            const data = await response.json();
            if (data.status === 'success') {
                setCredits(data.credits);
            }
        } catch (err) {
            console.error('Error fetching credits:', err);
        }
    };

    const fetchFollowedExperts = async (userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/marketplace/get_followed_experts.php?user_id=${userId}`);
            const data = await response.json();
            if (data.status === 'success') {
                setFollowedExperts(data.data);
            }
        } catch (err) {
            console.error('Error fetching followed experts:', err);
        } finally {
            setLoadingFollows(false);
        }
    };

    const handleChat = (expert) => {
        const expertUserId = expert.user_id || expert.userId;
        setActiveConversation({
            id: null,
            expert_id: expertUserId,
            user_id: user.id || user.userId,
            other_party_name: expert.name,
            profile_image: expert.profile_image ? `/${expert.profile_image}` : null
        });
    };

    if (!user) return null;

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f8fafc', minHeight: '100vh', color: '#0f172a' }}>
            <MarketplaceSidebar user={user} role="user" />

            <Box sx={{ 
                flex: 1, 
                pt: { xs: 10, md: 0 },
                p: { xs: 2, md: 6 },
                position: 'relative'
            }}>
                {/* Background Accent */}
                <Box sx={{ 
                    position: 'absolute', top: 0, right: 0, width: '400px', height: '400px', 
                    background: 'radial-gradient(circle, rgba(245, 158, 11, 0.05) 0%, transparent 70%)', 
                    zIndex: 0, pointerEvents: 'none' 
                }} />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ position: 'relative', zIndex: 1 }}
                >
                    {/* Header */}
                    <Box sx={{ mb: 6, position: 'relative' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: 3, mb: 4 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h3" fontWeight="900" sx={{ mb: 1, color: '#0f172a', fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.5rem' }, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                                    Namaste, {user.name}
                                </Typography>
                                <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 500, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                                    Your path to spiritual clarity begins here.
                                </Typography>
                            </Box>
                            
                            {/* Wallet Display */}
                            <Paper
                                onClick={() => navigate('/occult/user-wallet')}
                                sx={{
                                    alignSelf: { xs: 'flex-start', sm: 'center' },
                                    width: { xs: '100%', sm: 'auto' },
                                    cursor: 'pointer',
                                    transition: '0.2s',
                                    '&:hover': { transform: 'translateY(-4px)' },
                                    p: 2, px: 3, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2,
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    color: 'white', boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.4)'
                                }}
                            >
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.2)' }}>
                                    <Zap size={20} />
                                </Box>
                                <Box>
                                    <Typography variant="caption" fontWeight="800" sx={{ opacity: 0.9, letterSpacing: 0.5, textTransform: 'uppercase' }}>My Balance</Typography>
                                    <Typography variant="h5" fontWeight="900">₹{credits}</Typography>
                                </Box>
                            </Paper>
                        </Box>

                        {/* Recommendation Banner */}
                        <Paper sx={{ 
                            p: { xs: 3, md: 4 }, borderRadius: { xs: 4, md: 6 }, 
                            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
                            color: 'white', position: 'relative', overflow: 'hidden',
                            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                        }}>
                            <Box sx={{ position: 'relative', zIndex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                    <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
                                        <Sparkles size={20} />
                                    </Box>
                                    <Typography variant="h6" fontWeight="900" sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' } }}>Complete Your Aura Profile</Typography>
                                </Box>
                                <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 3, maxWidth: '550px', fontWeight: 500, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                                    Adding your birth details helps experts provide more accurate guidance specifically tailored to your energy.
                                </Typography>
                                <Button
                                    variant="contained"
                                    fullWidth={isMobile}
                                    onClick={() => navigate('/occult/settings')}
                                    sx={{
                                        bgcolor: '#f59e0b', color: '#000', fontWeight: 950, px: 4, py: 1.5, 
                                        borderRadius: 2.5, textTransform: 'none',
                                        '&:hover': { bgcolor: '#fbbf24' }
                                    }}
                                >
                                    Update Profile
                                </Button>
                            </Box>
                            {/* Mystical Icon in corner */}
                            {!isMobile && (
                                <Box sx={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.05, color: 'white' }}>
                                    <Activity size={240} />
                                </Box>
                            )}
                        </Paper>
                    </Box>

                    {/* Followed Experts Section */}
                    <Box sx={{ mb: 6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Heart size={24} color="#f59e0b" fill="#f59e0b" />
                                <Typography variant="h5" fontWeight="800">Experts You Follow</Typography>
                            </Box>
                            {followedExperts.length > 0 && (
                                <Button 
                                    endIcon={<ChevronRight size={18} />} 
                                     onClick={() => navigate('/occult/following')}
                                    sx={{ color: '#64748b', fontWeight: 700, textTransform: 'none' }}
                                >
                                    Explore More
                                </Button>
                            )}
                        </Box>

                        {loadingFollows ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress size={32} color="warning" />
                            </Box>
                        ) : followedExperts.length > 0 ? (
                            <Grid container spacing={3}>
                                {followedExperts.map((expert) => (
                                    <Grid item xs={12} sm={6} lg={4} key={expert.user_id}>
                                        <Paper 
                                            elevation={0}
                                            onClick={() => navigate(`/@${expert.slug}`)}
                                            sx={{ 
                                                p: 2.5, borderRadius: 5, border: '1px solid #e2e8f0',
                                                transition: '0.3s', cursor: 'pointer',
                                                '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', borderColor: '#f59e0b' }
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                                <Avatar 
                                                    src={expert.profile_image ? `/${expert.profile_image}` : null}
                                                    sx={{ width: 60, height: 60, borderRadius: 4, bgcolor: '#f59e0b' }}
                                                >
                                                    {expert.name.charAt(0)}
                                                </Avatar>
                                                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                                                    <Typography variant="subtitle1" fontWeight="800" noWrap>{expert.name}</Typography>
                                                    <Typography variant="body2" color="textSecondary" noWrap>{expert.primary_skill}</Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                        <Star size={14} fill="#f59e0b" color="#f59e0b" />
                                                        <Typography variant="caption" fontWeight="700">{expert.rating || '4.9'}</Typography>
                                                    </Box>
                                                </Box>
                                                <IconButton 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleChat(expert);
                                                    }}
                                                    sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', '&:hover': { bgcolor: '#f59e0b', color: '#fff' } }}
                                                >
                                                    <MessageSquare size={20} />
                                                </IconButton>
                                            </Box>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Paper sx={{ p: 6, borderRadius: 6, textAlign: 'center', border: '2px dashed #e2e8f0', bgcolor: 'transparent' }}>
                                <Box sx={{ mb: 2, color: '#f59e0b', opacity: 0.5 }}>
                                    <Heart size={48} />
                                </Box>
                                <Typography variant="h6" fontWeight="800" gutterBottom>No experts followed yet</Typography>
                                <Typography color="textSecondary" sx={{ mb: 3 }}>Follow experts to get quick access to consultations and updates.</Typography>
                                <Button 
                                    variant="outlined" 
                                    onClick={() => navigate('/occult/following')}
                                    startIcon={<Search size={18} />}
                                    sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 800, borderColor: '#f59e0b', color: '#f59e0b' }}
                                >
                                    Find Experts
                                </Button>
                            </Paper>
                        )}
                    </Box>

                </motion.div>
            </Box>
        </Box>
    );
}
