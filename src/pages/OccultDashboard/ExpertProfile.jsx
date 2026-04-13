import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, Avatar, Button, Chip } from '@mui/material';
import Divider from '@mui/material/Divider';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MessageSquare, Video, Phone, Award, ShieldCheck, ArrowLeft, ShoppingBag, Package } from 'lucide-react';
import OccultNavbar from '../../components/OccultNavbar';
import OccultFooter from '../../components/OccultFooter';
import { useAuth } from '../../services/AuthService';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../services/ToastService';
import { useChat } from '../../contexts/ChatContext';
import BlockingOverlay from '../../components/BlockingOverlay';

export default function ExpertProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToCart } = useCart();
    const { showToast } = useToast();
    const { setActiveConversation } = useChat();
    const [expert, setExpert] = useState(null);
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);

    const handleBuyNow = (product) => {
        if (!user) {
            showToast('login_required', 'Please login to purchase', 'warning');
            navigate('/occult/login');
            return;
        }
        navigate('/occult/checkout', { state: { product, quantity: 1 } });
    };

    const handleInquire = (product) => {
        if (!user) {
            showToast('login_required', 'Please login to inquire', 'warning');
            navigate('/occult/login');
            return;
        }
        setActiveConversation({
            id: null,
            expert_id: expert.user_id,
            user_id: user.id || user.userId,
            other_party_name: expert.name,
            profile_image: expert.profile_image ? `/${expert.profile_image}` : null,
            initialMessage: `I am interested in ${product.name}. Can you tell me more?`
        });
    };

    useEffect(() => {
        const fetchExpertData = async () => {
            try {
                const response = await fetch(`/api/marketplace/get_expert_profile.php?user_id=${id}`);
                const data = await response.json();
                if (data.status === 'success') {
                    setExpert(data.profile);
                }
            } catch (err) {
                console.error("Error fetching expert", err);
            } finally {
                setLoading(false);
            }
        };
        fetchExpertData();
    }, [id]);

    useEffect(() => {
        if (expert?.user_id) {
            const fetchProducts = async () => {
                try {
                    const response = await fetch(`/api/marketplace/get_expert_products.php?expert_id=${expert.user_id}`);
                    const data = await response.json();
                    if (data.status === 'success') {
                        setProducts(data.products);
                    }
                } catch (err) {
                    console.error("Error fetching products", err);
                }
            };
            fetchProducts();
        }
    }, [expert]);

    if (loading) return <Box sx={{ pt: 20, textAlign: 'center' }}>Loading Profile...</Box>;
    if (!expert) return (
        <Box sx={{ pt: 20, textAlign: 'center' }}>
            <Typography variant="h5">Expert Not Found</Typography>
            <Button onClick={() => navigate('/occult')}>Back to Marketplace</Button>
        </Box>
    );

    return (
        <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <BlockingOverlay />
            <OccultNavbar />

            <Box sx={{ pt: { xs: '100px', md: '120px' }, px: { xs: 2, md: 8 }, pb: 8 }}>
                <Button
                    startIcon={<ArrowLeft size={18} />}
                    onClick={() => navigate(-1)}
                    sx={{ mb: 4, color: '#64748b', fontWeight: 'bold' }}
                >
                    Back
                </Button>

                <Grid container spacing={4}>
                    {/* Left - Profile Sidebar */}
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 4, borderRadius: 4, textAlign: 'center', position: 'sticky', top: '100px' }}>
                            <Avatar
                                src={expert.profile_image ? `/${expert.profile_image}` : undefined}
                                sx={{ width: 120, height: 120, mx: 'auto', mb: 3, bgcolor: '#f59e0b', fontSize: '3rem' }}
                            >
                                {!expert.profile_image && expert.name.charAt(0)}
                            </Avatar>
                            <Typography variant="h4" fontWeight="800" sx={{ mb: 1 }}>{expert.name}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, gap: 1 }}>
                                <Star size={18} color="#f59e0b" fill="#f59e0b" />
                                <Typography fontWeight="bold">4.9</Typography>
                                <Typography color="textSecondary">(120 Reviews)</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
                                <Chip label={expert.primary_skill} color="primary" sx={{ fontWeight: 'bold' }} />
                                <Chip
                                    label={expert.expert_type?.toUpperCase()}
                                    variant="outlined"
                                    sx={{ fontWeight: 'bold', borderColor: expert.expert_type === 'teacher' ? '#8b5cf6' : '#3b82f6', color: expert.expert_type === 'teacher' ? '#8b5cf6' : '#3b82f6' }}
                                />
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            <Box sx={{ textAlign: 'left', mb: 4 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Award size={20} color="#10b981" />
                                    <Typography><strong>{expert.experience_years}+ Years</strong> Experience</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <ShieldCheck size={20} color="#10b981" />
                                    <Typography>Verified Expert</Typography>
                                </Box>
                            </Box>

                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                startIcon={<MessageSquare size={18} />}
                                sx={{ mb: 2, bgcolor: '#f59e0b', py: 1.5, borderRadius: 2 }}
                            >
                                Chat Now
                            </Button>
                            <Button
                                fullWidth
                                variant="outlined"
                                size="large"
                                startIcon={<Phone size={18} />}
                                sx={{ py: 1.5, borderRadius: 2 }}
                            >
                                Call Now
                            </Button>
                        </Paper>
                    </Grid>

                    {/* Right - Details */}
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: 5, borderRadius: 4, mb: 4 }}>
                            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>About the Expert</Typography>
                            <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                                {expert.bio || "No bio available yet."}
                            </Typography>
                        </Paper>

                        {/* Store Section */}
                        {parseInt(expert.is_ecommerce_enabled) === 1 ? (
                            <Paper sx={{ p: 5, borderRadius: 4, mt: 4, bgcolor: '#fffbeb', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                                    <ShoppingBag size={28} color="#f59e0b" />
                                    <Typography variant="h5" fontWeight="900" color="#000">Sacred Store</Typography>
                                </Box>
                                
                                {products.length > 0 ? (
                                    <Grid container spacing={3}>
                                        {products.map((product) => (
                                            <Grid item xs={12} sm={6} key={product.id}>
                                                <Box 
                                                    onClick={() => navigate(`/occult/product/${product.id}`)}
                                                    sx={{ 
                                                        bgcolor: '#fff', p: 2, borderRadius: 3, border: '1px solid #e2e8f0', height: '100%',
                                                        display: 'flex', flexDirection: 'column', transition: '0.3s', cursor: 'pointer',
                                                        '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', borderColor: '#f59e0b' }
                                                    }}
                                                >
                                                    <Box sx={{ position: 'relative', width: '100%', pt: '65%', borderRadius: 2, overflow: 'hidden', mb: 2 }}>
                                                        <img 
                                                            src={product.image_url ? `/${product.image_url}` : 'https://placehold.co/600x400?text=Sacred+Item'} 
                                                            alt={product.name} 
                                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                                                            onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Sacred+Item'; }}
                                                        />
                                                    </Box>
                                                    <Typography variant="h6" fontWeight="800" gutterBottom noWrap>{product.name}</Typography>
                                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2, flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                        {product.description}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                                                        <Typography variant="h6" fontWeight="900" color="#f59e0b">₹{product.price}</Typography>
                                                        {(!user || user.role !== 'expert') && (
                                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                                    <Button 
                                                                        variant="text" size="small" 
                                                                        sx={{ flex: 1, textTransform: 'none', fontWeight: 800, color: '#64748b' }}
                                                                        onClick={(e) => { e.stopPropagation(); handleInquire(product); }}
                                                                    >
                                                                        Inquire
                                                                    </Button>
                                                                    <Button 
                                                                        variant="contained" size="small" 
                                                                        sx={{ flex: 1, textTransform: 'none', fontWeight: 800, bgcolor: '#0f172a', borderRadius: 2 }}
                                                                        onClick={(e) => { e.stopPropagation(); handleBuyNow(product); }}
                                                                    >
                                                                        Buy Now
                                                                    </Button>
                                                                </Box>
                                                                <Button 
                                                                    fullWidth variant="outlined" size="small"
                                                                    sx={{ 
                                                                        borderRadius: 2, textTransform: 'none', fontWeight: 800, 
                                                                        borderColor: '#e2e8f0', color: '#0f172a',
                                                                        '&:hover': { borderColor: '#f59e0b', bgcolor: 'transparent' }
                                                                    }}
                                                                    onClick={() => navigate(`/occult/product/${product.id}`)}
                                                                >
                                                                    View Details
                                                                </Button>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                ) : (
                                    <Box sx={{ textAlign: 'center', py: 6, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 4, border: '1px dashed #cbd5e1' }}>
                                        <Package size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
                                        <Typography variant="h6" fontWeight="700" color="#64748b">No products found</Typography>
                                        <Typography variant="body2" color="textSecondary">This expert has not added any products yet.</Typography>
                                    </Box>
                                )}
                            </Paper>
                        ) : (
                            (user && (user.id == expert.user_id || user.userId == expert.user_id)) && (
                                <Box sx={{ mt: 4, p: 4, borderRadius: '24px', border: '2px dashed #e2e8f0', textAlign: 'center', bgcolor: '#f8fafc' }}>
                                    <ShoppingBag size={48} color="#94a3b8" style={{ marginBottom: '16px', opacity: 0.5 }} />
                                    <Typography variant="h6" fontWeight="800" color="#475569">Your Store is Currently Hidden</Typography>
                                    <Typography color="textSecondary" sx={{ mb: 3 }}>Only you can see this message. To show your store to seekers, enable it in settings.</Typography>
                                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                                        <Button 
                                            variant="contained" 
                                            onClick={() => navigate('/occult/expert/manage-courses')}
                                            sx={{ bgcolor: '#f59e0b', color: 'white', borderRadius: '100px', px: 4, fontWeight: 800, textTransform: 'none', '&:hover': { bgcolor: '#d97706' } }}
                                        >
                                            Manage Courses
                                        </Button>
                                        <Button 
                                            variant="outlined" 
                                            onClick={() => navigate('/occult/settings')}
                                            sx={{ borderColor: '#0f172a', color: '#0f172a', borderRadius: '100px', px: 4, fontWeight: 800, textTransform: 'none' }}
                                        >
                                            Store Settings
                                        </Button>
                                    </Box>
                                </Box>
                            )
                        )}
                    </Grid>
                </Grid>
            </Box>

            <OccultFooter />
        </Box>
    );
}
