import React, { useEffect, useState } from 'react';
import { 
    Box, Typography, Avatar, CircularProgress, Breadcrumbs, Link,
    Tab, Tabs, Paper, Chip, Button, IconButton,
    useMediaQuery, useTheme
} from '@mui/material';
import Divider from '@mui/material/Divider';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    ShoppingBag, MessageSquare, 
    Share2, ShieldCheck, Truck, RotateCcw, 
    Star, Info, Package, ChevronRight,
    Layers, Zap, Globe, ShoppingCart
} from 'lucide-react';
import OccultNavbar from '../../components/OccultNavbar';
import OccultFooter from '../../components/OccultFooter';
import { useToast } from '../../services/ToastService';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../services/AuthService';
import { useCart } from '../../contexts/CartContext';
import './ProductDetail.css';

export default function ProductDetail() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { setActiveConversation } = useChat();
    const { user } = useAuth();
    const { addToCart, setIsCartOpen } = useCart();

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [tabValue, setTabValue] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [showFullDesc, setShowFullDesc] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const searchParams = new URLSearchParams(window.location.search);
                const sellerId = searchParams.get('seller_id');
                const response = await fetch(`/api/marketplace/get_product.php?product_id=${productId}${sellerId ? `&seller_id=${sellerId}` : ''}`);
                const data = await response.json();
                if (data.status === 'success' && data.product) {
                    setProduct(data.product);
                    
                    let defaults = {};
                    if (data.product?.attributes) {
                        Object.entries(data.product.attributes).forEach(([key, val]) => {
                            if (val) {
                                if (Array.isArray(val) && val.length > 0) {
                                    defaults[key] = val[0];
                                } else if (typeof val === 'string') {
                                    defaults[key] = val.includes(',') ? val.split(',')[0].trim() : val.trim();
                                }
                            }
                        });
                    }
                    setSelectedOptions(defaults);
                } else {
                    showToast('product_error', data?.message || 'Product not found', 'error');
                }
            } catch (err) {
                showToast('error_fetching', 'Error connecting to server', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
        window.scrollTo(0, 0);
    }, [productId, navigate, showToast]);

    if (loading) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc' }}>
                <CircularProgress color="warning" />
            </Box>
        );
    }

    if (!product) return null;

    const isOutOfStock = parseInt(product.manage_stock) === 1 && parseInt(product.stock_quantity) <= 0;
    const isLowStock = parseInt(product.manage_stock) === 1 && parseInt(product.stock_quantity) > 0 && parseInt(product.stock_quantity) <= parseInt(product.low_stock_threshold);

    const allImages = [product.image_url, ...(product.images || [])].filter(Boolean);

    const handleAddToCart = () => {
        if (!user) {
            showToast('login_required', 'Please login to add items to cart', 'warning');
            navigate('/occult/login');
            return;
        }
        const activeExpertId = product.seller_id || product.expert_id;
        addToCart(product, { id: activeExpertId, name: product.expert_name }, selectedOptions);
        showToast('cart_added', 'Item added to cart!', 'success');
        setIsCartOpen(true);
    };

    const handleInquire = () => {
        if (!user) {
            showToast('login_required', 'Please login to inquire', 'warning');
            navigate('/occult/login');
            return;
        }
        const activeExpertId = product.seller_id || product.expert_id;
        setActiveConversation({
            id: null,
            expert_id: activeExpertId,
            user_id: user.id,
            other_party_name: product.expert_name,
            profile_image: product.expert_profile_image ? `/${product.expert_profile_image}` : null,
            initialMessage: `I am interested in your offering: ${product.name}. Could you provide more details?`
        });
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        showToast('link_copied', 'Product link copied to clipboard!', 'success');
    };

    return (
        <div className="product-detail-wrapper">
            <OccultNavbar />

            <div className="product-custom-container">
                {/* Breadcrumbs */}
                <div className="product-breadcrumbs">
                    <Breadcrumbs 
                        separator={<ChevronRight size={14} />} 
                        sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}
                    >
                        <Link underline="hover" color="inherit" onClick={() => navigate('/occult')} sx={{ cursor: 'pointer' }}>
                            Marketplace
                        </Link>
                        <Link underline="hover" color="inherit" onClick={() => navigate(`/@${product.expert_slug}`)} sx={{ cursor: 'pointer' }}>
                            {product.expert_name}
                        </Link>
                        <Typography color="text.primary" sx={{ fontSize: '0.85rem', fontWeight: 700 }}>
                            {product.name}
                        </Typography>
                    </Breadcrumbs>
                </div>

                <div className="product-main-layout">
                    {/* Left Section: Gallery */}
                    <div className="product-gallery-section">
                        <div className="product-gallery">
                            <motion.div 
                                className="main-image-container"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <img 
                                    src={`/${allImages[activeImage]}`} 
                                    alt={product.name} 
                                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/800x800?text=Product+Image'; }}
                                />
                                {product.is_super_profile === 1 && (
                                    <div className="super-badge">Super Choice</div>
                                )}
                            </motion.div>

                            {allImages.length > 1 && (
                                <div className="thumbnail-grid">
                                    {allImages.map((img, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`thumb-item ${activeImage === idx ? 'active' : ''}`}
                                            onClick={() => setActiveImage(idx)}
                                        >
                                            <img 
                                                src={`/${img}`} 
                                                alt={`Thumb ${idx}`} 
                                                onError={(e) => { e.currentTarget.src = 'https://placehold.co/200x200?text=Broken'; }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Section: Info */}
                    <div className="product-details-section">
                        <motion.div 
                            className="info-content-wrapper"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <Box sx={{ mb: 2 }}>
                                <Chip 
                                    icon={
                                        product.product_type === 'digital_profile' ? <Zap size={14} /> :
                                        product.product_type === 'service' ? <Globe size={14} /> :
                                        product.product_type === 'course' ? <Layers size={14} /> :
                                        <Package size={14} />
                                    }
                                    label={
                                        product.product_type === 'digital_profile' ? 'Digital Super Profile' :
                                        product.product_type === 'service' ? 'Expertise Service' :
                                        product.product_type === 'course' ? 'Educational Course' :
                                        'Physical Product'
                                    } 
                                    size="small" 
                                    sx={{ 
                                        bgcolor: 'rgba(245, 158, 11, 0.14)', 
                                        color: '#b45309', 
                                        fontWeight: 900,
                                        textTransform: 'uppercase',
                                        letterSpacing: '1.5px',
                                        fontSize: '0.65rem',
                                        mb: 2.5,
                                        px: 1,
                                        borderRadius: '6px'
                                    }} 
                                />
                                <Typography variant="h3" sx={{ 
                                    fontWeight: 950, 
                                    color: '#0f172a', 
                                    mb: 1.5, 
                                    letterSpacing: '-2px', 
                                    lineHeight: 1.05,
                                    fontSize: { xs: '1.75rem', md: '2.5rem' }
                                }}>
                                    {product.name}
                                </Typography>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={16} fill={i < 4 ? "#f59e0b" : "none"} color="#f59e0b" />
                                        ))}
                                        <Typography sx={{ fontWeight: 800, ml: 1, fontSize: '0.95rem' }}>4.0</Typography>
                                    </Box>
                                    <div style={{ width: '2px', height: '16px', backgroundColor: '#e2e8f0' }} />
                                    <Typography color="textSecondary" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>12 Authentic Reviews</Typography>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'flex-start', flexDirection: 'column', gap: 1, mb: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
                                        <Typography variant="h2" sx={{ fontWeight: 950, color: '#f59e0b', fontSize: { xs: '2.5rem', md: '3rem' }, display: 'flex', alignItems: 'flex-start' }}>
                                            <span style={{ fontSize: '1.2rem', marginTop: '12px', fontWeight: 900 }}>₹</span>
                                            {product.price}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 700, mb: 2 }}>per unit</Typography>
                                    </Box>
                                    
                                    {parseInt(product.manage_stock) === 1 && (
                                        <Chip 
                                            label={isOutOfStock ? 'Currently Unavailable' : isLowStock ? `Hurry! Only ${product.stock_quantity} left` : `${product.stock_quantity} Units in Stock`}
                                            size="small"
                                            color={isOutOfStock ? "error" : isLowStock ? "warning" : "success"}
                                            sx={{ 
                                                fontWeight: 900, 
                                                borderRadius: '10px', 
                                                px: 1,
                                                fontSize: '0.75rem',
                                                height: 28,
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                            }}
                                        />
                                    )}
                                </Box>
                            </Box>

                            <Box sx={{ mb: 4 }}>
                                <Typography 
                                    variant="body1" 
                                    sx={{ 
                                        color: '#64748b', 
                                        lineHeight: 1.6, 
                                        fontSize: '1rem', 
                                        fontWeight: 500,
                                        display: showFullDesc ? 'block' : '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: showFullDesc ? 'visible' : 'hidden'
                                    }}
                                >
                                    {product.description}
                                </Typography>
                                <Link 
                                    onClick={() => setShowFullDesc(!showFullDesc)}
                                    sx={{ 
                                        color: '#f59e0b', 
                                        cursor: 'pointer', 
                                        fontSize: '0.85rem', 
                                        fontWeight: 800, 
                                        textDecoration: 'none',
                                        mt: 1,
                                        display: 'inline-block',
                                        '&:hover': { textDecoration: 'underline' }
                                    }}
                                >
                                    {showFullDesc ? 'Hide Details' : 'Read Full Details'}
                                </Link>
                            </Box>

                            {/* Attributes Section */}
                            {product.attributes && Object.entries(product.attributes).some(([k, v]) => v) && (
                                <div className="product-attributes-custom-v2">
                                    <div className="attributes-header-new">
                                        <Layers size={18} color="#f59e0b" />
                                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: '0.75rem' }}>Specifications & Options</Typography>
                                    </div>
                                    
                                    <div className="attributes-vert-stack">
                                        {Object.entries(product.attributes).map(([key, value]) => {
                                            if (!value || (Array.isArray(value) && value.length === 0)) return null;
                                            const options = Array.isArray(value) ? value : (typeof value === 'string' ? value.split(',').map(s => s.trim()) : [String(value)]);
                                            const isMultiple = options.length > 1;

                                            const scrollContainerId = `scroll-${key}`;
                                            const scroll = (direction) => {
                                                const container = document.getElementById(scrollContainerId);
                                                if (container) {
                                                    const scrollAmount = direction === 'left' ? -150 : 150;
                                                    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                                                }
                                            };

                                            return (
                                                <div className="attribute-inline-row" key={key}>
                                                    <div className="attribute-label-inline">
                                                        <span className="dot-mini"></span>
                                                        <Typography className="attr-key-v2">{key}</Typography>
                                                    </div>
                                                    
                                                    <div className="options-scroller-container">
                                                        {isMultiple && (
                                                            <IconButton onClick={() => scroll('left')} size="small" className="scroll-arrow left-arrow">
                                                                <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />
                                                            </IconButton>
                                                        )}
                                                        
                                                        <div className="options-list-v2" id={scrollContainerId}>
                                                            {options.map((opt, i) => {
                                                                const isSelected = (selectedOptions[key] || options[0]) === opt;
                                                                return (
                                                                    <div 
                                                                        key={i}
                                                                        className={`v2-option-chip ${isSelected && isMultiple ? 'selected' : ''} ${!isMultiple ? 'readonly' : ''}`}
                                                                        onClick={() => isMultiple && setSelectedOptions(prev => ({ ...prev, [key]: opt }))}
                                                                    >
                                                                        {opt}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {isMultiple && (
                                                            <IconButton onClick={() => scroll('right')} size="small" className="scroll-arrow right-arrow">
                                                                <ChevronRight size={14} />
                                                            </IconButton>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="action-buttons-custom">
                                <Button 
                                    variant="contained" 
                                    size="large"
                                    fullWidth
                                    disabled={isOutOfStock}
                                    startIcon={isOutOfStock ? <Info size={20} /> : <ShoppingCart size={20} />}
                                    sx={{ 
                                        borderRadius: '20px', py: 2.2, fontWeight: 900, textTransform: 'none',
                                        fontSize: '1.1rem',
                                        bgcolor: isOutOfStock ? '#cbd5e1' : '#f59e0b', color: '#fff', 
                                        '&:hover': { bgcolor: isOutOfStock ? '#cbd5e1' : '#d97706', transform: 'translateY(-3px)', boxShadow: '0 12px 24px rgba(245, 158, 11, 0.3)' },
                                        transition: 'all 0.3s'
                                    }}
                                    onClick={handleAddToCart}
                                >
                                    {isOutOfStock ? 'Currently Unavailable' : 'Add to Cart'}
                                </Button>
                            </div>

                            {/* Floating Inquiry Button */}
                            <IconButton 
                                className="floating-inquiry-btn"
                                onClick={handleInquire}
                                title="Inquire about this product"
                            >
                                <MessageSquare size={24} />
                                <div className="btn-ripple"></div>
                            </IconButton>

                            <Divider sx={{ mb: 4, mt: 2 }} />

                            {/* Expert Info Card */}
                            <div 
                                className="expert-card-custom"
                                onClick={() => navigate(`/@${product.expert_slug}`)}
                            >
                                <Avatar 
                                    src={product.expert_profile_image ? `/${product.expert_profile_image}` : null} 
                                    sx={{ width: 60, height: 60, bgcolor: '#f59e0b', boxShadow: '0 8px 16px rgba(245, 158, 11, 0.2)' }}
                                >
                                    {product.expert_name?.charAt(0)}
                                </Avatar>
                                <div className="expert-card-content">
                                    <Typography variant="body2" sx={{ fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '1.5px', mb: 0.5 }}>Official Creator</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{product.expert_name}</Typography>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>Certified Expert Listing</Typography>
                                </div>
                                <IconButton sx={{ bgcolor: 'white', border: '1px solid #e2e8f0' }}><ChevronRight size={20} /></IconButton>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Bottom Sections */}
                <div id="product-tabs" className="product-bottom-tabs">
                    <Tabs 
                        value={tabValue} 
                        onChange={(e, v) => setTabValue(v)} 
                        sx={{ 
                            borderBottom: '1px solid #e2e8f0',
                            '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', fontSize: '1rem', px: 4 }
                        }}
                    >
                        <Tab label="Description" />
                        <Tab label="Shipping & Returns" />
                        <Tab label="Expert Insights" />
                    </Tabs>

                    <div className="tabs-content-area">
                        {tabValue === 0 && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <Typography variant="h5" sx={{ fontWeight: 900, mb: 3 }}>About this item</Typography>
                                <Typography sx={{ color: '#475569', lineHeight: 2, fontSize: '1.1rem', maxWidth: '800px' }}>
                                    {product.description}
                                    <br /><br />
                                    This product is curated by {product.expert_name} specifically for seekers looking to enhance their spiritual practice. 
                                    Every item undergoes a verification process to ensure authenticity and energetic alignment.
                                </Typography>
                            </motion.div>
                        )}
                        {tabValue === 1 && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                                    <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                                        <Truck size={32} color="#f59e0b" style={{ marginBottom: '16px' }} />
                                        <Typography variant="h6" fontWeight="800">Fast Delivery</Typography>
                                        <Typography variant="body2" color="textSecondary">Ships within 24-48 hours. Express shipping available globally.</Typography>
                                    </div>
                                    <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                                        <RotateCcw size={32} color="#f59e0b" style={{ marginBottom: '16px' }} />
                                        <Typography variant="h6" fontWeight="800">7-Day Returns</Typography>
                                        <Typography variant="body2" color="textSecondary">Hassle-free returns if the product doesn't meet your expectations.</Typography>
                                    </div>
                                    <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                                        <ShieldCheck size={32} color="#f59e0b" style={{ marginBottom: '16px' }} />
                                        <Typography variant="h6" fontWeight="800">Secure Payment</Typography>
                                        <Typography variant="body2" color="textSecondary">100% encrypted checkout with PhonePe and multiple gateway support.</Typography>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        {tabValue === 2 && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <Typography variant="h5" sx={{ fontWeight: 900, mb: 3 }}>Message from {product.expert_name}</Typography>
                                <Paper sx={{ p: 4, borderRadius: '32px', bgcolor: 'rgba(245, 158, 11, 0.05)', border: '1px dashed #f59e0b' }}>
                                    <Typography sx={{ fontStyle: 'italic', color: '#1e293b', fontSize: '1.2rem', lineHeight: 1.8 }}>
                                        "I recommend this {product.name} for those who are currently undergoing a period of transition. 
                                        In my professional experience, such remedies help stabilize the energy field and provide clarity."
                                    </Typography>
                                    <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar src={product.expert_profile_image ? `/${product.expert_profile_image}` : null} />
                                        <Typography fontWeight="800">{product.expert_name}</Typography>
                                    </Box>
                                </Paper>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            <OccultFooter />
        </div>
    );
}
