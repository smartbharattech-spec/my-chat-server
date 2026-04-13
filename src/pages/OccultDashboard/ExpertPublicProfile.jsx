import React, { useEffect, useState } from 'react';
import { Box, Typography, Container, IconButton, Chip, Button, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Snackbar } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Star, MessageSquare, Video, ArrowLeft, Share2,
    Sparkles, Globe, ShieldCheck, Zap, Heart, Instagram, Facebook, Twitter, Users, Check, MapPin, Award, Clock, DollarSign, User,
    ShoppingBag, Package, ShoppingCart, Info, ArrowRight, PlayCircle
} from 'lucide-react';
import OccultNavbar from '../../components/OccultNavbar';
import OccultFooter from '../../components/OccultFooter';
import { useToast } from '../../services/ToastService';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../services/AuthService';
import { useCart } from '../../contexts/CartContext';
import './ExpertPublicProfile.css';

export default function ExpertPublicProfile() {
    const { atSlug } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { setActiveConversation, onlineUsers } = useChat();
    const { user } = useAuth();
    const { addToCart, setIsCartOpen } = useCart();
    const [expert, setExpert] = useState(null);
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [courses, setCourses] = useState([]);
    const [orderDialog, setOrderDialog] = useState({ open: false, product: null, type: 'product' });
    const [ordering, setOrdering] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followDialogOpen, setFollowDialogOpen] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [cartSnack, setCartSnack] = useState(false);

    const slug = atSlug?.startsWith('@') ? atSlug.substring(1) : atSlug;

    useEffect(() => {
        const fetchProfile = async () => {
            if (!slug) {
                navigate('/occult');
                return;
            }
            try {
                const response = await fetch(`/api/marketplace/get_public_profile.php?slug=${slug}`);
                const data = await response.json();
                if (data.status === 'success') {
                    setExpert(data.profile);
                } else {
                    showToast('expert_not_found', 'Expert not found', 'error');
                    navigate('/occult');
                }
            } catch (err) {
                console.error('Error fetching expert profile:', err);
                showToast('error_fetching', 'Error connecting to server', 'error');
            } finally {
                setLoading(false);
            }
        };

        const fetchAllData = async () => {
            await fetchProfile();
        };

        fetchAllData();
        window.scrollTo(0, 0);
    }, [slug, navigate, showToast]);

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
                    console.error('Error fetching products:', err);
                }
            };
            fetchProducts();

            const fetchCourses = async () => {
                try {
                    const response = await fetch(`/api/courses.php?expert_id=${expert.user_id}`);
                    const data = await response.json();
                    if (data.status === 'success') {
                        setCourses(data.data);
                    }
                } catch (err) {
                    console.error('Error fetching courses:', err);
                }
            };
            fetchCourses();
        }
    }, [expert]);

    useEffect(() => {
        if (user && expert?.user_id) {
            const checkFollowStatus = async () => {
                try {
                    const response = await fetch(`/api/marketplace/check_follow_status.php?user_id=${user.id}&expert_id=${expert.user_id}`);
                    const data = await response.json();
                    if (data.status === 'success') {
                        setIsFollowing(data.is_following);
                    }
                } catch (err) {
                    console.error('Error checking follow status:', err);
                }
            };
            checkFollowStatus();
        }
    }, [user, expert]);

    if (loading) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                    <Sparkles size={48} color="#b45309" />
                </motion.div>
            </Box>
        );
    }

    if (!expert) return null;

    const isOwnProfile = user && user.id === expert.user_id;

    const handleChat = (product = null) => {
        if (!user) {
            showToast('login_required', 'Please login to start a consultation', 'warning');
            navigate('/occult/login');
            return;
        }

        if (user.role === 'expert' && !isOwnProfile) {
            showToast('only_users', 'Only seekers can consult with experts.', 'info');
            return;
        }

        if (!isFollowing && !isOwnProfile) {
            setFollowDialogOpen(true);
            return;
        }

        const initialMessage = product ? `I am interested in your offering: ${product.name}. Could you provide more details?` : "";

        setActiveConversation({
            id: null,
            expert_id: expert.user_id,
            user_id: user.id,
            other_party_name: expert.name,
            profile_image: expert.profile_image ? `/${expert.profile_image}` : null,
            initialMessage: initialMessage
        });

        // Auto-navigate to expert dashboard if they are already in communication? 
        // No, let's just open the chat drawer/modal if it exists.
        // For now, the existing chat system handles setActiveConversation.
    };

    const handleAddToCart = (product) => {
        if (!user) {
            showToast('login_required', 'Please login to add items to cart', 'warning');
            navigate('/occult/login');
            return;
        }
        if (user.role === 'expert') {
            showToast('expert_restriction', 'Experts cannot purchase products.', 'info');
            return;
        }
        addToCart(product, { id: expert.user_id, name: expert.name });
        setIsCartOpen(true);
    };

    const handleBuyNow = (product) => {
        if (!user) {
            showToast('login_required', 'Please login to purchase', 'warning');
            navigate('/occult/login');
            return;
        }
        if (user.role === 'expert') {
            showToast('expert_restriction', 'Experts cannot purchase products.', 'info');
            return;
        }
        
        if (!isFollowing && !isOwnProfile) {
            setFollowDialogOpen(true);
            return;
        }

        setOrderDialog({ open: true, product, type: 'product' });
    };

    const handleBuyCourse = (course) => {
        if (!user) {
            showToast('login_required', 'Please login to purchase course', 'warning');
            navigate('/occult/login');
            return;
        }
        if (user.role === 'expert') {
            showToast('expert_restriction', 'Experts cannot purchase courses.', 'info');
            return;
        }
        
        if (!isFollowing && !isOwnProfile) {
            setFollowDialogOpen(true);
            return;
        }

        setOrderDialog({ open: true, product: course, type: 'course' });
    };

    const handleFollow = async () => {
        if (!user) {
            showToast('login_required', 'Please login to follow experts', 'warning');
            navigate('/occult/login');
            return;
        }
        
        setFollowLoading(true);
        try {
            const response = await fetch('/api/marketplace/follow_expert.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    user_id: user.id,
                    expert_id: expert.user_id,
                    action: isFollowing ? 'unfollow' : 'follow'
                })
            });
            const data = await response.json();
            if (data.status === 'success') {
                setIsFollowing(!isFollowing);
                showToast('follow_success', data.message, 'success');
            } else {
                showToast('follow_error', data.message, 'error');
            }
        } catch (err) {
            showToast('follow_error', 'Failed to update follow status', 'error');
        } finally {
            setFollowLoading(false);
        }
    };

    const handleConfirmOrder = async () => {
        const item = orderDialog.product;
        const itemType = orderDialog.type; // 'product' or 'course'
        setOrdering(true);
        try {
            const response = await fetch('/api/marketplace/place_order.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    expert_id: expert.user_id,
                    product_id: item.id,
                    amount: item.price,
                    type: itemType
                })
            });
            const data = await response.json();
            if (data.status === 'success') {
                const orderId = `OCCULT_${data.order_id}_${Date.now()}`;
                setOrderDialog({ open: false, product: null, type: 'product' });
                showToast('order_success', 'Order created. Redirecting to payment...', 'success');
                setTimeout(() => {
                    navigate(`/phonepe-payment?amount=${data.total}&order_id=${orderId}&type=${itemType}`);
                }, 1000);
            } else {
                showToast('order_error', data.message || 'Order failed.', 'error');
            }
        } catch (err) {
            showToast('network_error', 'Could not place order. Try again.', 'error');
        } finally {
            setOrdering(false);
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        showToast('link_copied', 'Profile link copied to clipboard!', 'success');
    };

    const isOnline = expert.is_online == 1 || onlineUsers.has(String(expert.user_id));
    const isStoreEnabled = parseInt(expert.is_ecommerce_enabled) === 1;

    return (
        <div className="expert-profile-wrapper">
            <OccultNavbar variant="light" />



            {/* Minimal Back Button */}
            <IconButton
                onClick={() => navigate(-1)}
                sx={{
                    position: 'absolute', top: 80, left: 24, zIndex: 100,
                    bgcolor: 'rgba(255,255,255,0.8)', color: '#0f172a',
                    backdropFilter: 'blur(10px)', border: '1px solid rgba(0,0,0,0.1)',
                    '&:hover': { bgcolor: '#fff', transform: 'scale(1.05)' }
                }}
            >
                <ArrowLeft size={24} />
            </IconButton>

            {/* Banner Section */}
            <div className="profile-banner">
                {expert.banner_image ? (
                    <img src={expert.banner_image.startsWith('http') ? expert.banner_image : `/${expert.banner_image}`} alt="Banner" className="banner-img" />
                ) : (
                    <div className="banner-gradient" />
                )}
            </div>

            <Container maxWidth="lg" className="profile-content-container">
                {/* Profile Header Card */}
                <div className="profile-header-card">
                    <div className="profile-header-top">
                        <div className="profile-avatar-wrapper">
                            {expert.profile_image ? (
                                <img src={expert.profile_image.startsWith('http') ? expert.profile_image : `/${expert.profile_image}`} alt={expert.name} className="profile-avatar-img" />
                            ) : (
                                <div className="profile-avatar-fallback">
                                    {expert.name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            {isOnline && <div className="online-indicator-large" title="Active Now" />}
                        </div>
                        <div className="profile-actions-top">
                            {(!user || user.role !== 'expert' || isOwnProfile) && (
                                <>
                                    {!isOwnProfile && (
                                        <Button
                                            className={`btn-follow-modern ${isFollowing ? 'active' : ''}`}
                                            onClick={handleFollow}
                                            disabled={followLoading}
                                            startIcon={isFollowing ? <Check size={18} /> : <Heart size={18} />}
                                        >
                                            {isFollowing ? 'Following' : 'Follow'}
                                        </Button>
                                    )}
                                    <Button
                                        className="btn-consult-modern"
                                        onClick={() => handleChat()}
                                        startIcon={isOnline ? <MessageSquare size={18} /> : <Zap size={18} />}
                                    >
                                        Consult Phase
                                    </Button>
                                </>
                            )}
                            <IconButton className="action-circle-btn" onClick={handleShare}>
                                <Share2 size={20} color="#64748b" />
                            </IconButton>
                            {isOwnProfile && (
                                <>
                                    <IconButton 
                                        className="action-circle-btn" 
                                        onClick={() => navigate('/occult/expert/manage-courses')}
                                        title="Manage Courses"
                                        sx={{ mr: 1 }}
                                    >
                                        <PlayCircle size={20} color="#f59e0b" />
                                    </IconButton>
                                    <IconButton 
                                        className="action-circle-btn" 
                                        onClick={() => navigate('/occult/settings')}
                                        title="Profile Settings"
                                    >
                                        <Sparkles size={20} color="#f59e0b" />
                                    </IconButton>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="profile-header-info">
                        <h1 className="expert-name-modern">
                            {expert.name}
                            <ShieldCheck size={32} color="#f59e0b" fill="#fff7ed" style={{ marginLeft: 12 }} />
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                             <Chip 
                                 label={`@${expert.slug}`} 
                                 size="small" 
                                 sx={{ 
                                     bgcolor: 'rgba(245, 158, 11, 0.1)', 
                                     color: '#b45309', 
                                     fontWeight: 800,
                                     fontFamily: '"Outfit", sans-serif',
                                     border: '1px solid rgba(245, 158, 11, 0.2)',
                                     px: 1,
                                     height: '28px',
                                     '& .MuiChip-label': { px: 1 }
                                 }} 
                             />
                        </div>
                        <h2 className="expert-skill-modern">{expert.primary_skill} • {expert.expert_type || 'Consultant'}</h2>
                        <div className="expert-location-modern">
                            <MapPin size={16} color="#94a3b8" />
                            <span>{expert.city || 'Unknown'}, {expert.state || 'India'}</span>
                            <span className="dot-separator">•</span>
                            <Globe size={16} color="#94a3b8" />
                            <span>{expert.languages || 'English, Hindi'}</span>
                        </div>
                    </div>

                    <div className="profile-stats-bar">
                        <div className="stat-block">
                            <span className="stat-val">{expert.experience_years || '12'}+</span>
                            <span className="stat-lbl">Years Exp</span>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat-block">
                            <span className="stat-val" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                4.9 <Star size={18} color="#f59e0b" fill="#f59e0b" />
                            </span>
                            <span className="stat-lbl">Rating</span>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat-block">
                            <span className="stat-val">₹{expert.hourly_rate || '0'}</span>
                            <span className="stat-lbl">Per Session</span>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat-block">
                            <span className="stat-val">₹{expert.per_message_charge || '1'}</span>
                            <span className="stat-lbl">Per Msg</span>
                        </div>
                    </div>
                </div>

                {/* Two Column Layout for About & Details */}
                <div className="profile-body-grid">
                    <div className="profile-section-card">
                        <h3 className="section-heading-modern">
                            <Award size={24} color="#ea580c" />
                            About {expert.name}
                        </h3>
                        <p className="bio-text-modern">
                            {expert.bio || "In a world seeking answers, true wisdom is a beacon. My mission is to provide foundational guidance that empowers your journey through the mystic arts and cosmic alignment."}
                        </p>
                    </div>

                    <div className="profile-section-card">
                        <h3 className="section-heading-modern">
                            <Zap size={24} color="#ea580c" />
                            Expertise
                        </h3>
                        <div className="expertise-tags-modern">
                            {(expert.expertise_tags || 'Vedic Astrology').split(',').map(tag => (
                                <span key={tag} className="expertise-tag-modern">{tag.trim()}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Store Section */}
                {isStoreEnabled ? (
                    <div className="store-section-container">
                        <div className="section-header-centered">
                            <div className="section-badge">
                                <ShoppingBag size={14} style={{ marginRight: '6px' }} />
                                Divine Offerings
                            </div>
                            <h2 className="section-title-main">Exclusive Store</h2>
                            <p className="section-subtitle">Specially curated remedies and consultations for your spiritual growth.</p>
                        </div>

                        {products.length > 0 ? (
                            <div className="products-grid-premium">
                                {products.map((product) => (
                                    <div
                                        className="product-card-premium"
                                        key={product.id}
                                        onClick={() => navigate(`/occult/product/${product.id}?seller_id=${expert.user_id}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="product-image-box">
                                            {(!user || user.role !== 'expert') && (
                                                <IconButton 
                                                    className="product-chat-btn"
                                                    onClick={(e) => { e.stopPropagation(); handleChat(product); }}
                                                    title="Inquire about this product"
                                                >
                                                    <MessageSquare size={18} />
                                                </IconButton>
                                            )}
                                            <img
                                                src={product.image_url ? `/${product.image_url}` : 'https://placehold.co/600x400?text=Sacred+Item'}
                                                alt={product.name}
                                                onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Sacred+Item'; }}
                                            />
                                        </div>
                                        <div className="product-info-box">
                                            <h3 className="product-name-premium">{product.name}</h3>
                                            <p className="product-desc-premium">{product.description}</p>
                                            {(!user || user.role !== 'expert') && (
                                                <Button
                                                    variant="contained"
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/occult/product/${product.id}?seller_id=${expert.user_id}`); }}
                                                    startIcon={<ArrowRight size={18} />}
                                                    fullWidth
                                                    className="product-add-cart-btn-new"
                                                >
                                                    View Product
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 8, px: 2, borderRadius: '24px', bgcolor: '#fffbeb', border: '1px dashed rgba(245, 158, 11, 0.3)' }}>
                                <Package size={48} color="#f59e0b" style={{ marginBottom: '16px', opacity: 0.8 }} />
                                <Typography variant="h6" fontWeight="800" color="#0f172a" fontFamily='"Outfit", sans-serif'>Products coming soon!</Typography>
                                <Typography color="textSecondary">This expert hasn't added any products to their store yet.</Typography>
                            </Box>
                        )}
                    </div>
                ) : (
                    isOwnProfile && (
                        <Box sx={{ mt: 4, p: 4, borderRadius: '24px', border: '2px dashed #e2e8f0', textAlign: 'center', bgcolor: '#f8fafc' }}>
                            <ShoppingBag size={48} color="#94a3b8" style={{ marginBottom: '16px', opacity: 0.5 }} />
                            <Typography variant="h6" fontWeight="800" color="#475569">Your Store is Currently Hidden</Typography>
                            <Typography color="textSecondary" sx={{ mb: 3 }}>Only you can see this message. To show your store to seekers, enable it in settings.</Typography>
                            <Button 
                                variant="contained" 
                                onClick={() => navigate('/occult/settings')}
                                sx={{ bgcolor: '#0f172a', color: '#white', borderRadius: '100px', px: 4, fontWeight: 800, textTransform: 'none' }}
                            >
                                Open Store Settings
                            </Button>
                        </Box>
                    )
                )}

                {/* Courses Section */}
                <div className="store-section-container" style={{ marginTop: '80px' }}>
                    <div className="section-header-centered">
                        <div className="section-badge">
                            <PlayCircle size={14} style={{ marginRight: '6px' }} />
                            Sacred Knowledge
                        </div>
                        <h2 className="section-title-main">Video Courses</h2>
                        <p className="section-subtitle">Learn ancient wisdom from {expert.name} through structured video lessons.</p>
                    </div>

                    {courses.length > 0 ? (
                        <div className="products-grid-premium">
                            {courses.map((course) => (
                                <div
                                    className="product-card-premium"
                                    key={course.id}
                                    onClick={() => navigate(`/occult/course/${course.id}`)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="product-image-box">
                                        <img
                                            src={course.thumbnail || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=400'}
                                            alt={course.title}
                                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=400'; }}
                                        />
                                        <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 10px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800, backdropFilter: 'blur(5px)' }}>
                                            COURSE
                                        </div>
                                    </div>
                                    <div className="product-info-box">
                                        <h3 className="product-name-premium">{course.title}</h3>
                                        <p className="product-desc-premium">{course.description}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                                            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f59e0b' }}>₹{course.price}</span>
                                            {(!user || user.role !== 'expert') && (
                                                <Button
                                                    variant="contained"
                                                    onClick={(e) => { e.stopPropagation(); handleBuyCourse(course); }}
                                                    sx={{ bgcolor: '#0f172a', borderRadius: '10px', textTransform: 'none', fontWeight: 800 }}
                                                >
                                                    Enroll Now
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 8, px: 2, borderRadius: '24px', bgcolor: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                            <PlayCircle size={48} color="#94a3b8" style={{ marginBottom: '16px', opacity: 0.5 }} />
                            <Typography variant="h6" fontWeight="800" color="#64748b">No courses uploaded yet</Typography>
                            <Typography color="textSecondary">Visit this section soon for upcoming educational content.</Typography>
                        </Box>
                    )}
                </div>
            </Container>

            {/* Back Button Floating */}
            <IconButton
                onClick={() => navigate(-1)}
                sx={{
                    position: 'fixed', bottom: 40, left: 40, zIndex: 100,
                    width: 60, height: 60, bgcolor: '#fff', color: '#0f172a',
                    backdropFilter: 'blur(10px)', border: '1px solid rgba(0,0,0,0.05)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    '&:hover': { bgcolor: '#f1f5f9', transform: 'scale(1.1)' }
                }}
            >
                <ArrowLeft size={28} />
            </IconButton>

            {/* Order Confirmation Dialog */}
            <Dialog
                open={orderDialog.open}
                onClose={() => !ordering && setOrderDialog({ open: false, product: null })}
                PaperProps={{
                    sx: { borderRadius: '24px', p: 1, maxWidth: '400px', width: '90%' }
                }}
            >
                <DialogTitle sx={{ fontWeight: 900, fontSize: '1.5rem', pb: 1 }}>
                    Confirm Purchase
                </DialogTitle>
                <DialogContent>
                    <Typography color="textSecondary" sx={{ mb: 3 }}>
                        Confirm purchase of <strong>{orderDialog.product?.name}</strong>.
                    </Typography>
                    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <div style={{ width: 50, height: 50, borderRadius: '12px', overflow: 'hidden' }}>
                            <img
                                src={orderDialog.product?.image_url ? `/${orderDialog.product.image_url}` : 'https://placehold.co/100x100?text=Item'}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <Box>
                            <Typography fontWeight={800}>{orderDialog.product?.name}</Typography>
                            <Typography variant="body2" color="textSecondary">Base: ₹{orderDialog.product?.price}</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ p: 1.5, textAlign: 'right' }}>
                        <Typography variant="caption" sx={{ display: 'block', color: '#64748b' }}>+ 18% GST: ₹{(parseFloat(orderDialog.product?.price || 0) * 0.18).toFixed(2)}</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#f59e0b' }}>Total: ₹{(parseFloat(orderDialog.product?.price || 0) * 1.18).toFixed(2)}</Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
                    <Button
                        onClick={() => setOrderDialog({ open: false, product: null })}
                        disabled={ordering}
                        sx={{ color: '#64748b', fontWeight: 700, textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmOrder}
                        disabled={ordering}
                        variant="contained"
                        sx={{
                            bgcolor: '#f59e0b', fontWeight: 800, textTransform: 'none', borderRadius: 3, px: 3,
                            '&:hover': { bgcolor: '#ea580c' }
                        }}
                    >
                        {ordering ? <CircularProgress size={20} color="inherit" /> : 'Confirm Order'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={followDialogOpen}
                onClose={() => setFollowDialogOpen(false)}
                PaperProps={{ sx: { borderRadius: '24px', p: 1, maxWidth: '400px' } }}
            >
                <DialogTitle sx={{ fontWeight: 900, fontSize: '1.5rem', pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                        <Heart size={24} fill="#f59e0b" />
                    </Box>
                    Follow Expert
                </DialogTitle>
                <DialogContent>
                    <Typography variant="h6" fontWeight="800" sx={{ mb: 1 }}>Follow up first!</Typography>
                    <Typography color="textSecondary">
                        Please follow <strong>{expert.name}</strong> to start a consultation or purchase services. Following helps you stay updated with their insights.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={() => setFollowDialogOpen(false)} sx={{ color: '#64748b', fontWeight: 700, textTransform: 'none' }}>
                        Maybe Later
                    </Button>
                    <Button
                        onClick={() => {
                            setFollowDialogOpen(false);
                            handleFollow();
                        }}
                        variant="contained"
                        sx={{ bgcolor: '#f59e0b', fontWeight: 800, textTransform: 'none', borderRadius: 3, px: 3, '&:hover': { bgcolor: '#ea580c' } }}
                    >
                        Follow Now
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={cartSnack}
                autoHideDuration={3000}
                onClose={() => setCartSnack(false)}
                message="Item added to cart!"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                sx={{
                    '& .MuiSnackbarContent-root': {
                        bgcolor: '#10b981',
                        color: 'white',
                        fontWeight: 700,
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(16,185,129,0.3)'
                    }
                }}
            />

            <OccultFooter />
        </div>
    );
}
