import React, { useState, useEffect } from 'react';
import { 
    Box, Container, Typography, TextField, InputAdornment, 
    Button, Grid, Chip, Skeleton, IconButton, Card, CardMedia, 
    CardContent, CardActions, useTheme, useMediaQuery
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Sparkles, Filter, ShoppingBag, ArrowRight, 
    Package, Zap, Globe, Layers, Star, Info, MessageSquare, ShoppingCart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OccultNavbar from '../../components/OccultNavbar';
import OccultFooter from '../../components/OccultFooter';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../services/AuthService';
import { useToast } from '../../services/ToastService';
import './AllProducts.css';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1]
        }
    }
};

export default function AllProducts() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { addToCart } = useCart();
    const { user } = useAuth();
    const { showToast } = useToast();
    
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('all');

    useEffect(() => {
        fetchAllProducts();
    }, []);

    const fetchAllProducts = async () => {
        try {
            // Reusing get_all_products.php if it exists, or create a similar effect
            // For now, let's assume we can get all products via a marketplace api
            const response = await fetch('/api/marketplace/get_all_products.php');
            const data = await response.json();
            if (data.status === 'success') {
                setProducts(data.products);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = (Array.isArray(products) ? products : []).filter(product => {
        const matchesSearch = (product?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                             (product?.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                             (product?.expert_name || "").toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesType = selectedType === 'all' || product?.product_type === selectedType;
        
        return matchesSearch && matchesType;
    });

    const productTypes = [
        { id: 'all', label: 'All Offerings', icon: <Package size={16} /> },
        { id: 'physical', label: 'Remedies', icon: <Package size={16} /> },
        { id: 'service', label: 'Services', icon: <Globe size={16} /> },
        { id: 'course', label: 'Courses', icon: <Layers size={16} /> },
        { id: 'digital_profile', label: 'Profiles', icon: <Zap size={16} /> },
    ];

    return (
        <div className="all-products-wrapper">
            <OccultNavbar variant="dark" />

            <div className="celestial-bg">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
            </div>

            <Container maxWidth="lg" sx={{ pt: 14, pb: 10 }}>
                <header className="products-header">
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="header-badge">
                            <Sparkles size={16} />
                            <span>Divine Marketplace</span>
                        </div>
                        <h1 className="header-title">Sacred <span className="highlight-text">Offerings</span></h1>
                        <p className="header-subtitle">
                            Explore a curated collection of gemstones, yantras, rituals, and spiritual services 
                            provided by India's top occult experts.
                        </p>
                    </motion.div>

                    <div className="search-and-filter">
                        <div className="search-box">
                            <Search size={22} color="#64748b" />
                            <input 
                                type="text"
                                className="search-input"
                                placeholder="Search for remedies, services, or experts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        
                        <div className="filter-chips">
                            {productTypes.map(type => (
                                <Chip 
                                    key={type.id}
                                    icon={type.icon}
                                    label={type.label}
                                    onClick={() => setSelectedType(type.id)}
                                    className={`filter-chip ${selectedType === type.id ? 'active' : ''}`}
                                />
                            ))}
                        </div>
                    </div>
                </header>

                {loading ? (
                    <Grid container spacing={4}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <Grid item xs={12} sm={6} md={4} key={i}>
                                <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 6, mb: 2 }} />
                                <Skeleton variant="text" sx={{ fontSize: '1.5rem', mb: 1 }} />
                                <Skeleton variant="text" width="60%" />
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <>
                        {filteredProducts.length > 0 ? (
                            <motion.div 
                                className="products-grid-premium"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <Grid container spacing={4}>
                                    {filteredProducts.map(product => {
                                        const isOutOfStock = parseInt(product.manage_stock) === 1 && parseInt(product.stock_quantity) <= 0;
                                        const isLowStock = parseInt(product.manage_stock) === 1 && parseInt(product.stock_quantity) > 0 && parseInt(product.stock_quantity) <= parseInt(product.low_stock_threshold);
                                        
                                        return (
                                        <Grid item xs={12} sm={6} md={4} key={product.listing_id || product.id}>
                                            <motion.div 
                                                className="product-card-premium"
                                                variants={itemVariants}
                                                whileHover={{ y: -10 }}
                                                onClick={() => navigate(`/occult/product/${product.id}?seller_id=${product.seller_id}`)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="product-image-box">
                                                    <IconButton 
                                                        className="product-chat-btn"
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            // For now redirecting to expert profile or opening chat if available
                                                            navigate(`/@${product.expert_slug}`);
                                                        }}
                                                        title="Inquire about this product"
                                                    >
                                                        <MessageSquare size={18} />
                                                    </IconButton>
                                                    <img 
                                                        src={product.image_url ? `/${product.image_url}` : 'https://placehold.co/600x400?text=Sacred+Item'} 
                                                        alt={product.name} 
                                                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400?text=Sacred+Item'; }}
                                                    />
                                                    <div className="product-type-badge">
                                                        {product.product_type === 'digital_profile' ? <Zap size={12} /> :
                                                         product.product_type === 'service' ? <Globe size={12} /> :
                                                         product.product_type === 'course' ? <Layers size={12} /> :
                                                         <Package size={12} />}
                                                    </div>
                                                    
                                                    {/* Custom Stock Badge */}
                                                    {parseInt(product.manage_stock) === 1 && (
                                                        <div className={`stock-badge-ui ${isOutOfStock ? 'out' : isLowStock ? 'low' : 'in'}`}>
                                                            {isOutOfStock ? 'Out of Stock' : 
                                                             isLowStock ? `Only ${product.stock_quantity} left` : 
                                                             `${product.stock_quantity} In Stock`}
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="product-info-box">
                                                    <Typography className="expert-name-link" variant="caption">
                                                        By {product.expert_name}
                                                    </Typography>
                                                    <h3 className="product-name-premium">{product.name}</h3>
                                                    <p className="product-desc-premium">{product.description}</p>
                                                    
                                                    <div className="card-footer-new">
                                                        <Button 
                                                            variant="contained" 
                                                            fullWidth
                                                            className="product-add-cart-btn-new"
                                                            startIcon={<ArrowRight size={18} />}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/occult/product/${product.id}?seller_id=${product.seller_id}`);
                                                            }}
                                                        >
                                                            View Product
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </Grid>
                                        );
                                    })}
                                </Grid>
                            </motion.div>
                        ) : (
                            <div className="no-results">
                                <ShoppingBag size={64} color="#cbd5e1" />
                                <Typography variant="h5" sx={{ mt: 2, fontWeight: 800 }}>No remedies found matching your search</Typography>
                                <Button 
                                    sx={{ mt: 2, color: '#f59e0b', fontWeight: 700 }} 
                                    onClick={() => { setSearchQuery(''); setSelectedType('all'); }}
                                >
                                    View all offerings
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </Container>

            <OccultFooter />
        </div>
    );
}
