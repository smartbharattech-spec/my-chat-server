import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, Typography, Button, TextField, CircularProgress, 
    IconButton, Paper, Grid, Dialog, DialogTitle, DialogContent, 
    DialogActions, Chip,
    InputAdornment, Select, MenuItem, FormControl, InputLabel, Checkbox, 
    FormControlLabel, Pagination, Stack, Switch, useMediaQuery, useTheme
} from '@mui/material';
import Divider from '@mui/material/Divider';
import { 
    Plus, Edit, Trash2, ShoppingBag, Image as ImageIcon, 
    Save, X, IndianRupee, Package, Search, Trash, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MarketplaceSidebar from '../../components/MarketplaceSidebar';
import BlockingOverlay from '../../components/BlockingOverlay';
import { useToast } from '../../services/ToastService';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExpertStore() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { showToast } = useToast();
    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [user, setUser] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const itemsPerPage = 5;
    const [isStoreEnabled, setIsStoreEnabled] = useState(false);
    const [expertProfile, setExpertProfile] = useState(null);
    const [toggleLoading, setToggleLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('my_store'); // 'my_store' or 'master_store'
    const [masterProducts, setMasterProducts] = useState([]);
    const [importLoading, setImportLoading] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        image_url: '',
        product_type: 'product',
        is_super_profile: 0,
        attributes: {
            size: [],
            weight: [],
            color: [],
            width: [],
            length: [],
            metal: []
        },
        stock_quantity: 0,
        low_stock_threshold: 5,
        manage_stock: 0,
        bulk_pricing: [], // Array of {qty: '', price: ''}
        images: [], // Array of image URLs
        gst_enabled: 1
    });

    // Multi-value attribute input state: { size: '', weight: '', ... }
    const [attrInputs, setAttrInputs] = useState({ size: '', weight: '', color: '', width: '', length: '', metal: '' });

    const handleAttrAdd = (attr) => {
        const val = attrInputs[attr].trim();
        if (!val) return;
        // Split by comma to allow pasting comma-separated values
        const newVals = val.split(',').map(v => v.trim()).filter(v => v && !formData.attributes[attr].includes(v));
        if (newVals.length === 0) return;
        setFormData(prev => ({
            ...prev,
            attributes: { ...prev.attributes, [attr]: [...prev.attributes[attr], ...newVals] }
        }));
        setAttrInputs(prev => ({ ...prev, [attr]: '' }));
    };

    const handleAttrRemove = (attr, index) => {
        setFormData(prev => ({
            ...prev,
            attributes: { ...prev.attributes, [attr]: prev.attributes[attr].filter((_, i) => i !== index) }
        }));
    };

    const handleAttrKeyDown = (e, attr) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAttrAdd(attr);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('occult_user');
        if (!storedUser) {
            navigate('/occult/login');
        } else {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchProducts(parsedUser.id);
            fetchExpertProfile(parsedUser.id);
            fetchMasterProducts();
        }
    }, [navigate]);

    const fetchExpertProfile = async (userId) => {
        try {
            const response = await fetch(`/api/marketplace/get_expert_profile.php?user_id=${userId}`);
            const data = await response.json();
            if (data.status === 'success') {
                setExpertProfile(data.profile);
                setIsStoreEnabled(data.profile.is_ecommerce_enabled == 1);
            }
        } catch (error) {
            console.error("Error fetching expert profile:", error);
        }
    };

    const fetchProducts = async (expert_id) => {
        try {
            const response = await fetch(`/api/marketplace/get_expert_products.php?expert_id=${expert_id}`);
            const data = await response.json();
            if (data.status === 'success') {
                setProducts(data.products);
            } else {
                // If it's a specific database error about the missing table, we can handle it
                if (data.message && data.message.includes('marketplace_expert_imports')) {
                    showToast("Store system update required. Please contact admin or run migration.", "warning");
                } else {
                    showToast(data.message || "Failed to fetch products.", "error");
                }
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            showToast("Failed to fetch products. Please check your connection.", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchMasterProducts = async () => {
        try {
            const response = await fetch('/api/marketplace/get_all_products.php');
            const data = await response.json();
            if (data.status === 'success') {
                setMasterProducts(data.products);
            }
        } catch (error) {
            console.error("Error fetching master products:", error);
        }
    };

    const handleImportProduct = async (productId, action = 'import') => {
        setImportLoading(productId);
        try {
            const response = await fetch('/api/marketplace/import_product.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    expert_id: user.id,
                    product_id: productId,
                    action: action
                })
            });
            const data = await response.json();
            if (data.status === 'success') {
                showToast(data.message, "success");
                fetchProducts(user.id);
            } else {
                if (data.message && data.message.includes('marketplace_expert_imports')) {
                    showToast("Database update needed to support imports.", "warning");
                } else {
                    showToast(data.message, "error");
                }
            }
        } catch (error) {
            showToast("Action failed. Server error.", "error");
        } finally {
            setImportLoading(null);
        }
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            
            // Parse JSON fields
            const defaultAttrs = { size: [], weight: [], color: [], width: [], length: [], metal: [] };
            let attrs = { ...defaultAttrs };
            let bulk = [];
            let imgs = [];
            try {
                if (product.attributes) {
                    const parsedAttrs = typeof product.attributes === 'string' ? JSON.parse(product.attributes) : product.attributes;
                    // Normalize: convert old string-based values to arrays
                    Object.keys(defaultAttrs).forEach(key => {
                        if (parsedAttrs[key] !== undefined) {
                            if (Array.isArray(parsedAttrs[key])) {
                                attrs[key] = parsedAttrs[key];
                            } else if (parsedAttrs[key]) {
                                attrs[key] = parsedAttrs[key].split(',').map(v => v.trim()).filter(Boolean);
                            } else {
                                attrs[key] = [];
                            }
                        }
                    });
                }
                if (product.bulk_pricing) {
                    bulk = typeof product.bulk_pricing === 'string' ? JSON.parse(product.bulk_pricing) : product.bulk_pricing;
                }
                if (product.images) {
                    imgs = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
                }
            } catch (e) { console.error("Error parsing JSON fields", e); }

            setAttrInputs({ size: '', weight: '', color: '', width: '', length: '', metal: '' });
            setFormData({
                name: product.name,
                description: product.description,
                price: product.price,
                image_url: product.image_url,
                product_type: product.product_type || 'product',
                is_super_profile: parseInt(product.is_super_profile) || 0,
                stock_quantity: parseInt(product.stock_quantity) || 0,
                low_stock_threshold: parseInt(product.low_stock_threshold) || 5,
                manage_stock: parseInt(product.manage_stock) || 0,
                attributes: attrs,
                bulk_pricing: bulk || [],
                images: imgs || [],
                gst_enabled: product.gst_enabled !== undefined ? parseInt(product.gst_enabled) : 1
            });
        } else {
            setEditingProduct(null);
            setAttrInputs({ size: '', weight: '', color: '', width: '', length: '', metal: '' });
            setFormData({
                name: '',
                description: '',
                price: '',
                image_url: '',
                product_type: 'product',
                is_super_profile: 0,
                stock_quantity: 0,
                low_stock_threshold: 5,
                manage_stock: 0,
                attributes: { size: [], weight: [], color: [], width: [], length: [], metal: [] },
                bulk_pricing: [],
                images: [],
                gst_enabled: 1
            });
        }
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setEditingProduct(null);
    };

    const handleImageUpload = async (file, isGallery = false) => {
        if (!file) return;
        const uploadData = new FormData();
        uploadData.append('image', file);
        uploadData.append('expert_id', user.id);

        try {
            const response = await fetch('/api/marketplace/upload_product_image.php', {
                method: 'POST',
                body: uploadData
            });
            const data = await response.json();
            if (data.status === 'success') {
                if (isGallery) {
                    setFormData(prev => ({ ...prev, images: [...prev.images, data.path] }));
                    showToast("Gallery image added.", "success");
                } else {
                    setFormData(prev => ({ ...prev, image_url: data.path }));
                    showToast("Main product image uploaded.", "success");
                }
            } else {
                showToast(data.message, "error");
            }
        } catch (error) {
            showToast("Upload failed.", "error");
        }
    };

    const handleRemoveGalleryImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleAddBulkPricing = () => {
        setFormData(prev => ({
            ...prev,
            bulk_pricing: [...prev.bulk_pricing, { qty: '', price: '' }]
        }));
    };

    const handleRemoveBulkPricing = (index) => {
        setFormData(prev => ({
            ...prev,
            bulk_pricing: prev.bulk_pricing.filter((_, i) => i !== index)
        }));
    };

    const handleBulkPricingChange = (index, field, value) => {
        const updatedBulk = [...formData.bulk_pricing];
        updatedBulk[index][field] = value;
        setFormData(prev => ({ ...prev, bulk_pricing: updatedBulk }));
    };

    const handleSaveProduct = async () => {
        if (!formData.name || !formData.price) {
            showToast("Name and price are required.", "warning");
            return;
        }

        setSaving(true);
        try {
            const response = await fetch('/api/marketplace/create_product.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    expert_id: user.id,
                    id: editingProduct?.id || 0
                })
            });
            const data = await response.json();
            if (data.status === 'success') {
                showToast(data.message, "success");
                fetchProducts(user.id);
                handleCloseModal();
            } else {
                showToast(data.message, "error");
            }
        } catch (error) {
            showToast("Failed to save product.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStore = async (event) => {
        const newValue = event.target.checked;
        setToggleLoading(true);
        try {
            const response = await fetch('/api/marketplace/profile_update.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    name: expertProfile?.name || user.name,
                    phone: expertProfile?.phone || user.phone || '0000000000',
                    role: 'expert',
                    city: expertProfile?.city || '',
                    state: expertProfile?.state || '',
                    slug: expertProfile?.slug || '',
                    is_ecommerce_enabled: newValue ? 1 : 0,
                    // Send other fields to prevent them from being reset if API doesn't handle partial updates well
                    skill: expertProfile?.primary_skill || '',
                    experience: expertProfile?.experience_years || 0,
                    bio: expertProfile?.bio || '',
                    is_live: expertProfile?.is_live || 1,
                    hourly_rate: expertProfile?.hourly_rate || 0,
                    languages: expertProfile?.languages || '',
                    skills: expertProfile?.expertise_tags || '',
                    per_message_charge: expertProfile?.per_message_charge,
                    free_message_limit: expertProfile?.free_message_limit
                })
            });
            const data = await response.json();
            if (data.status === 'success') {
                setIsStoreEnabled(newValue);
                showToast(`Store is now ${newValue ? 'ON' : 'OFF'}`, "success");
            } else {
                showToast(data.message, "error");
            }
        } catch (error) {
            showToast("Failed to update store status.", "error");
        } finally {
            setToggleLoading(false);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;

        try {
            const response = await fetch('/api/marketplace/delete_product.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, expert_id: user.id })
            });
            const data = await response.json();
            if (data.status === 'success') {
                showToast("Product deleted.", "success");
                fetchProducts(user.id);
            } else {
                showToast(data.message, "error");
            }
        } catch (error) {
            showToast("Delete failed.", "error");
        }
    };

    const filteredMyProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredMasterProducts = Array.from(new Map((masterProducts || [])
        .filter(p => !user || parseInt(p.expert_id) !== parseInt(user.id))
        .filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase())
        ).map(item => [item.id, item])).values());

    const myStorePaginated = filteredMyProducts.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    const masterStorePaginated = filteredMasterProducts.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    const pageCount = activeTab === 'my_store' 
        ? Math.ceil(filteredMyProducts.length / itemsPerPage)
        : Math.ceil(filteredMasterProducts.length / itemsPerPage);

    const handlePageChange = (event, value) => {
        setPage(value);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        setPage(1);
    }, [searchQuery, activeTab]);

    if (loading) return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f1f5f9' }}>
            <CircularProgress color="warning" />
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <BlockingOverlay />
            <MarketplaceSidebar user={user} role="expert" />

            <Box sx={{ 
                flex: 1, 
                p: { xs: 2, md: 4, lg: 6 }, 
                pt: { xs: 10, md: 4, lg: 6 }, 
                width: '100%',
                maxWidth: '100vw',
                overflowX: 'hidden'
            }}>
                <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
                {/* Header Section */}
                <Box sx={{ 
                    mb: { xs: 3, md: 5 }, 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: { xs: 'stretch', md: 'flex-start' }, 
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 3,
                    p: { xs: 2.5, sm: 4 },
                    borderRadius: { xs: '24px', sm: '32px' },
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 20px 50px rgba(15, 23, 42, 0.3)'
                }}>
                    {/* Decorative Background Circles */}
                    <Box sx={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', filter: 'blur(40px)' }} />
                    <Box sx={{ position: 'absolute', bottom: '-20px', left: '10%', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.05)', filter: 'blur(30px)' }} />

                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                        <Typography variant="h3" sx={{ 
                            fontWeight: 950, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: { xs: 1.5, md: 2 },
                            letterSpacing: { xs: '-1px', md: '-1.5px' },
                            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                            background: 'linear-gradient(to right, #ffffff, #94a3b8)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            <ShoppingBag size={isMobile ? 32 : 42} color="#f59e0b" style={{ filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.5))' }} />
                            Store Manager
                        </Typography>
                        <Typography variant="subtitle1" sx={{ color: 'rgba(148, 163, 184, 0.8)', mt: 1, fontWeight: 500, maxWidth: '500px', fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                            Design and curate your exclusive collection. Your products define your expert profile.
                        </Typography>
                        
                        <Box sx={{ 
                            mt: 3, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            gap: 2, 
                            p: { xs: '8px 16px', sm: '10px 20px' }, 
                            borderRadius: '16px', 
                            bgcolor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(10px)',
                            width: { xs: '100%', sm: 'auto' }
                        }}>
                            <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.75rem', sm: '0.9rem' }, color: isStoreEnabled ? '#f59e0b' : '#94a3b8', whiteSpace: 'nowrap' }}>
                                Store Visibility: {isStoreEnabled ? 'PUBLIC' : 'HIDDEN'}
                            </Typography>
                            {toggleLoading ? (
                                <CircularProgress size={20} color="warning" />
                            ) : (
                                <Switch 
                                    checked={isStoreEnabled} 
                                    onChange={handleToggleStore}
                                    color="warning"
                                    size={isMobile ? 'small' : 'medium'}
                                    sx={{
                                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#f59e0b' },
                                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#f59e0b' }
                                    }}
                                />
                            )}
                        </Box>
                    </Box>
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'row', md: 'row' }, 
                        gap: 2, 
                        position: 'relative', 
                        zIndex: 1,
                        mt: { xs: 2, md: 0 }
                    }}>
                        <Button 
                            variant="outlined"
                            startIcon={<Eye size={isMobile ? 16 : 22} />}
                            onClick={() => window.open(`/@${user?.slug || ''}`, '_blank')}
                            fullWidth={isMobile}
                            sx={{
                                borderRadius: isMobile ? '12px' : '16px',
                                borderColor: 'rgba(255,255,255,0.3)',
                                color: 'white',
                                fontWeight: 800,
                                px: { xs: 2, sm: 4 },
                                py: { xs: 1.5, sm: 2 },
                                fontSize: { xs: '0.75rem', sm: '1rem' },
                                textTransform: 'none',
                                whiteSpace: 'nowrap',
                                minWidth: 'fit-content',
                                flex: { xs: 1, sm: 1 },
                                '&:hover': {
                                    borderColor: 'white',
                                    bgcolor: 'rgba(255,255,255,0.1)'
                                }
                            }}
                        >
                            {isMobile ? 'View Profile' : 'View Public Profile'}
                        </Button>
                        <Button 
                            variant="contained" 
                            startIcon={<Plus size={isMobile ? 16 : 22} />}
                            onClick={() => handleOpenModal()}
                            fullWidth={isMobile}
                            sx={{ 
                                borderRadius: isMobile ? '12px' : '16px', 
                                bgcolor: '#f59e0b', 
                                color: '#0f172a',
                                fontWeight: 950, 
                                px: { xs: 2, sm: 5 }, 
                                py: { xs: 1.5, sm: 2 },
                                fontSize: { xs: '0.75rem', sm: '1rem' },
                                whiteSpace: 'nowrap',
                                minWidth: 'fit-content',
                                flex: { xs: 1, sm: 1 },
                                boxShadow: '0 10px 20px rgba(245, 158, 11, 0.3)',
                                '&:hover': { 
                                    bgcolor: '#fbbf24',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 15px 30px rgba(245, 158, 11, 0.4)'
                                },
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                textTransform: 'none'
                            }}
                        >
                            {isMobile ? 'Add New' : 'Create New Product'}
                        </Button>
                    </Box>
                </Box>

                {/* Search and Filters with Glassmorphism */}
                <Paper sx={{ 
                    p: 0.5, 
                    mb: 4, 
                    borderRadius: '20px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
                    transition: 'all 0.3s ease',
                    overflow: 'hidden',
                    '&:focus-within': {
                        borderColor: '#f59e0b',
                        boxShadow: '0 15px 40px rgba(245, 158, 11, 0.08)'
                    }
                }}>
                    <Box sx={{ p: isMobile ? 1.5 : 2, display: 'flex', alignItems: 'center', bgcolor: '#f1f5f9', borderRadius: '14px', ml: 0.5 }}>
                        <Search color="#475569" size={isMobile ? 18 : 20} />
                    </Box>
                    <TextField 
                        fullWidth 
                        placeholder={isMobile ? "Search..." : "Filter through your inventory..."} 
                        variant="outlined" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ 
                            '& .MuiOutlinedInput-root': { 
                                borderRadius: '16px',
                                border: 'none',
                                '& fieldset': { border: 'none' },
                                fontSize: { xs: '0.9rem', sm: '1.1rem' },
                                fontWeight: 600,
                                color: '#1e293b'
                            }
                        }}
                    />
                </Paper>

                {/* Tabs Section */}
                <Box sx={{ 
                    mb: 4, 
                    display: 'flex', 
                    gap: { xs: 1, sm: 2 }, 
                    borderBottom: '1px solid #e2e8f0', 
                    pb: 1,
                    justifyContent: { xs: 'center', sm: 'flex-start' },
                    overflowX: 'auto',
                    '&::-webkit-scrollbar': { display: 'none' },
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none'
                }}>
                    <Button 
                        onClick={() => setActiveTab('my_store')}
                        sx={{ 
                            px: { xs: 1.5, sm: 4 }, py: 1.5, borderRadius: '12px', fontWeight: 800, fontSize: { xs: '0.75rem', sm: '0.95rem' },
                            color: activeTab === 'my_store' ? '#f59e0b' : '#64748b',
                            bgcolor: activeTab === 'my_store' ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                            borderBottom: activeTab === 'my_store' ? '3px solid #f59e0b' : 'none',
                            whiteSpace: 'nowrap',
                            '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.08)' }
                        }}
                    >
                        My Store
                    </Button>
                    <Button 
                        onClick={() => setActiveTab('master_store')}
                        sx={{ 
                            px: { xs: 1.5, sm: 4 }, py: 1.5, borderRadius: '12px', fontWeight: 800, fontSize: { xs: '0.75rem', sm: '0.95rem' },
                            color: activeTab === 'master_store' ? '#f59e0b' : '#64748b',
                            bgcolor: activeTab === 'master_store' ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                            borderBottom: activeTab === 'master_store' ? '3px solid #f59e0b' : 'none',
                            whiteSpace: 'nowrap',
                            '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.08)' }
                        }}
                    >
                        Master Inventory
                    </Button>
                </Box>

                {/* Premium Product List */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <AnimatePresence mode="wait">
                        {activeTab === 'my_store' ? (
                            <motion.div
                                key="my_store_view"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '32px' }}
                            >
                                {myStorePaginated.length > 0 ? (
                                    myStorePaginated.map((product, index) => (
                                        <motion.div 
                                            layout 
                                            key={product.id}
                                            style={{ width: '100%' }}
                                        >
                                            <Paper
                                                elevation={0}
                                                onClick={() => navigate(`/occult/product/${product.id}?seller_id=${user.id}`)}
                                                sx={{
                                                    p: { xs: 2, md: 3 },
                                                    borderRadius: 4,
                                                    border: '1px solid #e2e8f0',
                                                    bgcolor: 'white',
                                                    width: '100% !important',
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        transform: 'translateY(-4px)',
                                                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
                                                        borderColor: '#f59e0b',
                                                        '& .product-image': { transform: 'scale(1.1)' }
                                                    }
                                                }}
                                            >
                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    flexDirection: { xs: 'column', md: 'row' },
                                                    alignItems: { xs: 'flex-start', md: 'center' },
                                                    justifyContent: 'space-between',
                                                    gap: { xs: 2, md: 4 }
                                                }}>
                                                    {/* Product Image & Info Section */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: { md: 280 }, flexShrink: 0, width: { xs: '100%', md: 'auto' } }}>
                                                        <Box sx={{ position: 'relative', width: { xs: 70, md: 80 }, height: { xs: 70, md: 80 }, borderRadius: 3, overflow: 'hidden', flexShrink: 0, bgcolor: '#f1f5f9' }}>
                                                            <img 
                                                                src={product.image_url ? `/${product.image_url}` : 'https://placehold.co/200x200?text=Product'} 
                                                                alt={product.name} 
                                                                className="product-image"
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} 
                                                            />
                                                        </Box>
                                                        <Box sx={{ overflow: 'hidden', flex: 1 }}>
                                                            <Typography variant="subtitle1" fontWeight="800" sx={{ lineHeight: 1.2, mb: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: { xs: '1rem', md: '1.1rem' } }}>
                                                                {product.name}
                                                            </Typography>
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Chip 
                                                                    label={(product.product_type || 'product').replace('_', ' ')} 
                                                                    size="small"
                                                                    sx={{ 
                                                                        height: 18, 
                                                                        fontSize: '0.6rem', 
                                                                        fontWeight: 800,
                                                                        bgcolor: 'rgba(245, 158, 11, 0.1)',
                                                                        color: '#f59e0b',
                                                                        textTransform: 'uppercase'
                                                                    }}
                                                                />
                                                                {product.is_super_profile === 1 && (
                                                                    <Chip label="Super" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: '#fef3c7', color: '#92400e' }} />
                                                                )}
                                                            </Stack>
                                                        </Box>
                                                    </Box>

                                                    {/* Details Section (Middle) */}
                                                    <Box sx={{ 
                                                        flex: 1, 
                                                        display: 'flex', 
                                                        flexDirection: { xs: 'column', md: 'row' },
                                                        alignItems: { xs: 'flex-start', md: 'center' },
                                                        gap: { xs: 1.5, md: 4 },
                                                        width: '100%',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a' }}>
                                                                ₹{product.price}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>BASE</Typography>
                                                        </Box>

                                                        <Typography variant="body2" sx={{ 
                                                            color: '#64748b', 
                                                            fontWeight: 500,
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 1,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                            flex: 1
                                                        }}>
                                                            {product.description || 'Professional grade item.'}
                                                        </Typography>

                                                        {parseInt(product.manage_stock) === 1 && (
                                                            <Box>
                                                                {parseInt(product.stock_quantity) <= 0 ? (
                                                                    <Chip label="Out of Stock" size="small" sx={{ bgcolor: '#fef2f2', color: '#ef4444', fontWeight: 800, fontSize: '0.65rem' }} />
                                                                ) : parseInt(product.stock_quantity) <= parseInt(product.low_stock_threshold) ? (
                                                                    <Chip label={`Low Stock: ${product.stock_quantity}`} size="small" sx={{ bgcolor: '#fff7ed', color: '#ea580c', fontWeight: 800, fontSize: '0.65rem' }} />
                                                                ) : (
                                                                    <Chip label={`Stock: ${product.stock_quantity}`} size="small" sx={{ bgcolor: '#f0fdf4', color: '#16a34a', fontWeight: 800, fontSize: '0.65rem' }} />
                                                                )}
                                                            </Box>
                                                        )}
                                                    </Box>

                                                    {/* Action Section */}
                                                    <Box sx={{ width: { xs: '100%', md: 'auto' }, display: 'flex', gap: 1, alignItems: 'center' }}>
                                                        {(parseInt(product.is_imported) === 1 || (product.expert_id && parseInt(product.expert_id) !== parseInt(user?.id))) ? (
                                                            <Button 
                                                                fullWidth={isMobile}
                                                                onClick={(e) => { e.stopPropagation(); handleImportProduct(product.id, 'remove'); }}
                                                                disabled={importLoading === product.id}
                                                                variant="outlined"
                                                                color="error"
                                                                startIcon={<X size={18} />}
                                                                sx={{ borderRadius: 3, fontWeight: 800, textTransform: 'none', px: 3 }}
                                                            >
                                                                {importLoading === product.id ? 'Removing...' : 'Remove Import'}
                                                            </Button>
                                                        ) : (
                                                            <>
                                                                <Button
                                                                    onClick={(e) => { e.stopPropagation(); handleOpenModal(product); }}
                                                                    startIcon={<Edit size={16} />}
                                                                    variant="contained"
                                                                    sx={{ 
                                                                        borderRadius: 3, px: 3, py: 1,
                                                                        textTransform: 'none', fontWeight: 800,
                                                                        bgcolor: 'rgba(15, 23, 42, 0.05)', color: '#0f172a',
                                                                        boxShadow: 'none',
                                                                        '&:hover': { bgcolor: '#0f172a', color: '#fff' }
                                                                    }}
                                                                >
                                                                    Edit
                                                                </Button>
                                                                <IconButton 
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id); }}
                                                                    sx={{ bgcolor: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', '&:hover': { bgcolor: '#ef4444', color: '#fff' }, borderRadius: 3 }}
                                                                >
                                                                    <Trash2 size={18} />
                                                                </IconButton>
                                                            </>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Paper>
                                        </motion.div>
                                    ))
                                ) : (
                                    <Box sx={{ 
                                        width: '100%', maxWidth: '1000px', mx: 'auto', textAlign: 'center', py: 15, px: 4, 
                                        bgcolor: '#ffffff', borderRadius: '40px', 
                                        border: '2px dashed #e2e8f0',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center'
                                    }}>
                                        <Box sx={{ p: 4, bgcolor: '#f8fafc', borderRadius: '50%', mb: 3 }}>
                                            <Package size={80} color="#cbd5e1" />
                                        </Box>
                                        <Typography variant="h4" color="#1e293b" fontWeight="950" sx={{ letterSpacing: '-1px' }}>Inventory is Empty</Typography>
                                        <Typography variant="h6" color="#94a3b8" sx={{ mt: 1, mb: 4, maxWidth: '450px', fontWeight: 400 }}>
                                            Your store doesn't have any items yet. Start adding products or import from the Master Inventory.
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <Button 
                                                variant="contained" size="large"
                                                onClick={() => handleOpenModal()}
                                                sx={{ 
                                                    borderRadius: '24px', bgcolor: '#0f172a', color: 'white', px: 6, py: 2, fontWeight: 900,
                                                    fontSize: '1.1rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                                                    '&:hover': { bgcolor: '#1e293b', transform: 'scale(1.05)' },
                                                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                                                }}
                                            >
                                                Launch New Product
                                            </Button>
                                            <Button 
                                                variant="outlined" size="large"
                                                onClick={() => setActiveTab('master_store')}
                                                sx={{ 
                                                    borderRadius: '24px', borderColor: '#0f172a', color: '#0f172a', px: 6, py: 2, fontWeight: 900,
                                                    fontSize: '1.1rem',
                                                    '&:hover': { bgcolor: '#f8fafc', transform: 'scale(1.05)' },
                                                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                                                }}
                                            >
                                                Browse Master Inventory
                                            </Button>
                                        </Box>
                                    </Box>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="master_store_view"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '32px' }}
                            >
                                {masterStorePaginated.length > 0 ? (
                                    masterStorePaginated.map((product, index) => {
                                        const alreadyImported = products.some(ip => ip.id === product.id);
                                        return (
                                            <motion.div 
                                                key={`master-${product.id}`}
                                                style={{ width: '100%' }}
                                            >
                                                <Paper
                                                    elevation={0}
                                                    sx={{
                                                        p: { xs: 2, md: 3 },
                                                        borderRadius: 4,
                                                        border: '1px solid #e2e8f0',
                                                        bgcolor: 'white',
                                                        width: '100% !important',
                                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        '&:hover': {
                                                            transform: 'translateY(-4px)',
                                                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
                                                            borderColor: '#f59e0b',
                                                            '& .product-image': { transform: 'scale(1.1)' }
                                                        }
                                                    }}
                                                >
                                                    <Box sx={{ 
                                                        display: 'flex', 
                                                        flexDirection: { xs: 'column', md: 'row' },
                                                        alignItems: { xs: 'flex-start', md: 'center' },
                                                        justifyContent: 'space-between',
                                                        gap: { xs: 2, md: 4 }
                                                    }}>
                                                        {/* Product Image & Info Section */}
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: { md: 280 }, flexShrink: 0, width: { xs: '100%', md: 'auto' } }}>
                                                            <Box sx={{ position: 'relative', width: { xs: 70, md: 80 }, height: { xs: 70, md: 80 }, borderRadius: 3, overflow: 'hidden', flexShrink: 0, bgcolor: '#f1f5f9' }}>
                                                                <img 
                                                                    src={product.image_url ? `/${product.image_url}` : 'https://placehold.co/200x200?text=Product'} 
                                                                    alt={product.name} 
                                                                    className="product-image"
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} 
                                                                />
                                                            </Box>
                                                            <Box sx={{ overflow: 'hidden', flex: 1 }}>
                                                                <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.6rem' }}>By {product.expert_name}</Typography>
                                                                <Typography variant="subtitle1" fontWeight="800" sx={{ lineHeight: 1.2, mb: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: { xs: '1rem', md: '1.1rem' } }}>
                                                                    {product.name}
                                                                </Typography>
                                                                <Chip 
                                                                    label={(product.product_type || 'product').replace('_', ' ')} 
                                                                    size="small"
                                                                    sx={{ 
                                                                        height: 18, 
                                                                        fontSize: '0.6rem', 
                                                                        fontWeight: 800,
                                                                        bgcolor: 'rgba(245, 158, 11, 0.1)',
                                                                        color: '#f59e0b',
                                                                        textTransform: 'uppercase'
                                                                    }}
                                                                />
                                                            </Box>
                                                        </Box>

                                                        {/* Details Section (Middle) */}
                                                        <Box sx={{ 
                                                            flex: 1, 
                                                            display: 'flex', 
                                                            flexDirection: { xs: 'column', md: 'row' },
                                                            alignItems: { xs: 'flex-start', md: 'center' },
                                                            gap: { xs: 1.5, md: 4 },
                                                            width: '100%',
                                                            overflow: 'hidden'
                                                        }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a' }}>
                                                                    ₹{product.price}
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>BASE</Typography>
                                                            </Box>

                                                            <Typography variant="body2" sx={{ 
                                                                color: '#64748b', 
                                                                fontWeight: 500,
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 1,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden',
                                                                flex: 1
                                                            }}>
                                                                {product.description || 'Professional grade item.'}
                                                            </Typography>
                                                        </Box>

                                                        {/* Action Section */}
                                                        <Box sx={{ width: { xs: '100%', md: 'auto' } }}>
                                                            <Button 
                                                                fullWidth
                                                                variant="contained"
                                                                disabled={alreadyImported || importLoading === product.id}
                                                                onClick={() => handleImportProduct(product.id, 'import')}
                                                                startIcon={alreadyImported ? <Package size={18} /> : <ShoppingBag size={18} />}
                                                                sx={{ 
                                                                    borderRadius: 3, px: 4, py: 1.5,
                                                                    textTransform: 'none', fontWeight: 800,
                                                                    bgcolor: alreadyImported ? '#10b981' : 'rgba(245, 158, 11, 0.08)', 
                                                                    color: alreadyImported ? '#fff' : '#f59e0b',
                                                                    boxShadow: 'none',
                                                                    '&:hover': { 
                                                                        bgcolor: alreadyImported ? '#059669' : '#f59e0b', 
                                                                        color: '#fff',
                                                                        boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.3)'
                                                                    }
                                                                }}
                                                            >
                                                                {importLoading === product.id ? 'Importing...' : (alreadyImported ? 'Already in Store' : 'Import to My Store')}
                                                            </Button>
                                                        </Box>
                                                    </Box>
                                                </Paper>
                                            </motion.div>
                                        );
                                    })
                                ) : (
                                    <Box sx={{ p: 10, textAlign: 'center', bgcolor: '#fff', borderRadius: '32px' }}>
                                        <ShoppingBag size={64} color="#e2e8f0" />
                                        <Typography variant="h6" sx={{ mt: 2, color: '#94a3b8' }}>No other experts have listed products yet.</Typography>
                                    </Box>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Box>

                {/* Pagination Section */}
                {pageCount > 1 && (
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        mt: 8, 
                        mb: 4,
                        p: 1.5,
                        width: 'fit-content',
                        mx: 'auto',
                        bgcolor: 'rgba(255, 255, 255, 0.5)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '24px',
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                    }}>
                        <Pagination 
                            count={pageCount} 
                            page={page} 
                            onChange={handlePageChange} 
                            size="large"
                            sx={{ 
                                '& .MuiPaginationItem-root': { 
                                    fontWeight: 900, 
                                    borderRadius: '16px',
                                    height: '45px',
                                    width: '45px',
                                    fontSize: '1rem',
                                    transition: 'all 0.2s',
                                    color: '#475569',
                                    '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' }
                                },
                                '& .Mui-selected': { 
                                    bgcolor: '#0f172a !important', 
                                    color: '#fff !important', 
                                    boxShadow: '0 10px 20px rgba(15, 23, 42, 0.2)',
                                    '&:hover': { bgcolor: '#1e293b' } 
                                }
                            }}
                        />
                    </Box>
                )}

                {/* Product Modal - Upgraded to Premium */}
                <Dialog 
                    open={openModal} 
                    onClose={handleCloseModal} 
                    maxWidth="sm" 
                    fullWidth 
                    PaperProps={{ 
                        sx: { 
                            borderRadius: '32px', 
                            p: 2,
                            boxShadow: '0 30px 60px rgba(0,0,0,0.15)',
                            backgroundImage: 'linear-gradient(to bottom right, #ffffff, #f8fafc)'
                        } 
                    }}
                >
                    <DialogTitle sx={{ 
                        fontWeight: 950, 
                        fontSize: '1.75rem',
                        letterSpacing: '-1px',
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        color: '#0f172a',
                        pb: 1
                    }}>
                        {editingProduct ? 'Refine Product' : 'New Creation'}
                        <IconButton onClick={handleCloseModal} sx={{ bgcolor: '#f1f5f9', color: '#475569', '&:hover': { bgcolor: '#e2e8f0' } }}>
                            <X size={20} />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {/* Image Placeholder/Upload Section */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem', mb: 1.5 }}>Display Masterpiece</Typography>
                                    <Box 
                                        onClick={() => fileInputRef.current.click()}
                                        sx={{ 
                                            width: '100%', height: 220, borderRadius: '24px', bgcolor: '#f1f5f9',
                                            backgroundImage: formData.image_url ? `url(/${formData.image_url})` : 'none',
                                            backgroundSize: 'cover', backgroundPosition: 'center',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                            border: '2px dashed #cbd5e1', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            '&:hover': { borderColor: '#f59e0b', bgcolor: '#fffbeb', transform: 'scale(1.01)' }
                                        }}
                                    >
                                        {!formData.image_url && (
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Box sx={{ p: 2, bgcolor: 'white', borderRadius: '50%', display: 'inline-flex', mb: 1, boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                                                    <ImageIcon size={32} color="#f59e0b" />
                                                </Box>
                                                <Typography variant="body2" sx={{ fontWeight: 800, color: '#64748b' }}>Upload Primary Image</Typography>
                                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>Supports JPG, PNG, WEBP</Typography>
                                            </Box>
                                        )}
                                        {formData.image_url && (
                                            <Box sx={{ position: 'absolute', bottom: 12, right: 12, bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(5px)', px: 1.5, py: 0.5, borderRadius: '10px', fontSize: '0.65rem', fontWeight: 900, color: '#0f172a' }}>
                                                CHANGE IMAGE
                                            </Box>
                                        )}
                                    </Box>
                                    <input type="file" ref={fileInputRef} hidden onChange={(e) => handleImageUpload(e.target.files[0], false)} />
                                </Box>

                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem', mb: 1.5 }}>Gallery Collection</Typography>
                                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                        {formData.images.map((img, index) => (
                                            <Box key={index} sx={{ position: 'relative', width: 85, height: 85, borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                                                <img 
                                                    src={`/${img}`} 
                                                    alt={`Gallery ${index}`} 
                                                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x400?text=Broken+Image'; }}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                />
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleRemoveGalleryImage(index)}
                                                    sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(239, 68, 68, 0.9)', color: 'white', '&:hover': { bgcolor: '#ef4444' }, p: 0.5 }}
                                                >
                                                    <X size={12} />
                                                </IconButton>
                                            </Box>
                                        ))}
                                        <Box 
                                            onClick={() => {
                                                const input = document.createElement('input');
                                                input.type = 'file';
                                                input.onchange = (e) => handleImageUpload(e.target.files[0], true);
                                                input.click();
                                            }}
                                            sx={{ 
                                                width: 85, height: 85, borderRadius: '16px', bgcolor: '#f8fafc',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                                border: '2px dashed #cbd5e1', transition: 'all 0.3s',
                                                '&:hover': { borderColor: '#f59e0b', bgcolor: '#fffbeb', transform: 'scale(1.05)' }
                                            }}
                                        >
                                            <Plus size={24} color="#94a3b8" />
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <FormControl fullWidth sx={{ 
                                    '& .MuiOutlinedInput-root': { 
                                        borderRadius: '16px',
                                        bgcolor: '#f8fafc',
                                        fontWeight: 600,
                                        '& fieldset': { borderColor: '#e2e8f0' }
                                    } 
                                }}>
                                    <InputLabel sx={{ fontWeight: 700 }}>Listing Category</InputLabel>
                                    <Select
                                        value={formData.product_type}
                                        label="Listing Category"
                                        onChange={(e) => setFormData({...formData, product_type: e.target.value})}
                                    >
                                        <MenuItem value="product" sx={{ py: 1.5, fontWeight: 600 }}>📦 Physical Product</MenuItem>
                                        <MenuItem value="service" sx={{ py: 1.5, fontWeight: 600 }}>💎 Expertise Service</MenuItem>
                                        <MenuItem value="course" sx={{ py: 1.5, fontWeight: 600 }}>🎓 Educational Course</MenuItem>
                                        <MenuItem value="digital_profile" sx={{ py: 1.5, fontWeight: 600 }}>⚡ Digital Super Profile</MenuItem>
                                    </Select>
                                </FormControl>

                                <TextField 
                                    label="Name of Item" fullWidth required value={formData.name}
                                    placeholder="Enter a captivating name..."
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    sx={{ 
                                        '& .MuiOutlinedInput-root': { 
                                            borderRadius: '16px',
                                            bgcolor: '#f8fafc',
                                            fontWeight: 600,
                                            '& fieldset': { borderColor: '#e2e8f0' }
                                        } 
                                    }}
                                />
                                
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField 
                                        label="Valuation (INR)" fullWidth required type="number" value={formData.price}
                                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                                        helperText={formData.price ? (formData.gst_enabled ? `User will pay ₹${(parseFloat(formData.price) * 1.18).toFixed(2)} (Incl. 18% GST)` : `User will pay ₹${parseFloat(formData.price).toFixed(2)} (No GST)`) : ""}
                                        FormHelperTextProps={{ sx: { fontWeight: 700, color: '#f59e0b' } }}
                                        InputProps={{ 
                                            startAdornment: <InputAdornment position="start"><span style={{ fontWeight: 900, color: '#f59e0b' }}>₹</span></InputAdornment>,
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1, borderLeft: '1px solid #e2e8f0', pl: 2 }}>
                                                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b' }}>GST</Typography>
                                                        <Switch 
                                                            size="small"
                                                            checked={!!formData.gst_enabled}
                                                            onChange={(e) => setFormData({...formData, gst_enabled: e.target.checked ? 1 : 0})}
                                                            color="warning"
                                                        />
                                                    </Box>
                                                </InputAdornment>
                                            )
                                        }}
                                        sx={{ 
                                            '& .MuiOutlinedInput-root': { 
                                                borderRadius: '16px',
                                                bgcolor: '#f8fafc',
                                                fontWeight: 800,
                                                '& fieldset': { borderColor: '#e2e8f0' }
                                            } 
                                        }}
                                    />
                                    {formData.product_type === 'digital_profile' && (
                                        <FormControlLabel
                                            control={
                                                <Checkbox 
                                                    checked={!!formData.is_super_profile} 
                                                    onChange={(e) => setFormData({...formData, is_super_profile: e.target.checked ? 1 : 0})}
                                                    color="warning"
                                                    sx={{ '& .MuiSvgIcon-root': { borderRadius: '6px' } }}
                                                />
                                            }
                                            label={<Typography sx={{ fontWeight: 800, color: '#1e293b' }}>Super Listing</Typography>}
                                        />
                                    )}
                                </Box>

                                <TextField 
                                    label="Item Description" fullWidth multiline rows={4} value={formData.description}
                                    placeholder="Explain the value and details..."
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    sx={{ 
                                        '& .MuiOutlinedInput-root': { 
                                            borderRadius: '16px',
                                            bgcolor: '#f8fafc',
                                            fontWeight: 500,
                                            '& fieldset': { borderColor: '#e2e8f0' }
                                        } 
                                    }}
                                />

                                {(formData.product_type === 'product' || formData.product_type === 'service' || formData.product_type === 'course') && (
                                    <>
                                        <Divider><Typography sx={{ color: '#94a3b8', fontWeight: 900, fontSize: '0.65rem', letterSpacing: '2px', textTransform: 'uppercase' }}>Inventory Management</Typography></Divider>
                                        
                                        <Box sx={{ bgcolor: '#f8fafc', p: 3, borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                            <FormControlLabel
                                                control={
                                                    <Switch 
                                                        checked={!!formData.manage_stock} 
                                                        onChange={(e) => setFormData({...formData, manage_stock: e.target.checked ? 1 : 0})}
                                                        color="warning"
                                                    />
                                                }
                                                label={<Typography sx={{ fontWeight: 800, color: '#1e293b' }}>Enable Inventory Tracking</Typography>}
                                            />
                                            
                                            {!!formData.manage_stock && (
                                                <Grid container spacing={2} sx={{ mt: 1 }}>
                                                    <Grid item xs={6}>
                                                        <TextField 
                                                            label="Current Stock" fullWidth type="number"
                                                            value={formData.stock_quantity}
                                                            onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                                                            sx={{ 
                                                                '& .MuiOutlinedInput-root': { 
                                                                    borderRadius: '16px',
                                                                    bgcolor: 'white',
                                                                    fontWeight: 700
                                                                } 
                                                            }}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <TextField 
                                                            label="Low Stock Alert at" fullWidth type="number"
                                                            value={formData.low_stock_threshold}
                                                            onChange={(e) => setFormData({...formData, low_stock_threshold: e.target.value})}
                                                            sx={{ 
                                                                '& .MuiOutlinedInput-root': { 
                                                                    borderRadius: '16px',
                                                                    bgcolor: 'white',
                                                                    fontWeight: 700
                                                                } 
                                                            }}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            )}
                                        </Box>

                                        <Divider><Typography sx={{ color: '#94a3b8', fontWeight: 900, fontSize: '0.65rem', letterSpacing: '2px', textTransform: 'uppercase' }}>Specifications (Add Multiple Options per Attribute)</Typography></Divider>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                            {['size', 'weight', 'color', 'width', 'length', 'metal'].map((attr) => {
                                                const attrLabel = attr.charAt(0).toUpperCase() + attr.slice(1);
                                                const attrIcons = { size: '📐', weight: '⚖️', color: '🎨', width: '↔️', length: '📏', metal: '🔩' };
                                                return (
                                                    <Box key={attr} sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px', p: 2.5, transition: 'all 0.2s', '&:focus-within': { borderColor: '#f59e0b', boxShadow: '0 0 0 3px rgba(245,158,11,0.08)' } }}>
                                                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                            <span>{attrIcons[attr]}</span> {attrLabel}
                                                        </Typography>
                                                        {/* Tags row */}
                                                        {formData.attributes[attr].length > 0 && (
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
                                                                {formData.attributes[attr].map((val, i) => (
                                                                    <Chip
                                                                        key={i}
                                                                        label={val}
                                                                        size="small"
                                                                        onDelete={() => handleAttrRemove(attr, i)}
                                                                        sx={{
                                                                            fontWeight: 800, fontSize: '0.75rem',
                                                                            bgcolor: 'rgba(245,158,11,0.12)', color: '#b45309',
                                                                            border: '1px solid rgba(245,158,11,0.3)',
                                                                            borderRadius: '8px',
                                                                            height: 28,
                                                                            '& .MuiChip-deleteIcon': { color: '#b45309', '&:hover': { color: '#ef4444' } }
                                                                        }}
                                                                    />
                                                                ))}
                                                            </Box>
                                                        )}
                                                        {/* Input + Add button */}
                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                            <TextField
                                                                size="small"
                                                                fullWidth
                                                                placeholder={`Add ${attrLabel} (press Enter or +)`}
                                                                value={attrInputs[attr]}
                                                                onChange={(e) => setAttrInputs(prev => ({ ...prev, [attr]: e.target.value }))}
                                                                onKeyDown={(e) => handleAttrKeyDown(e, attr)}
                                                                sx={{
                                                                    '& .MuiOutlinedInput-root': {
                                                                        borderRadius: '12px',
                                                                        bgcolor: 'white',
                                                                        fontWeight: 600,
                                                                        fontSize: '0.9rem',
                                                                        '& fieldset': { borderColor: '#e2e8f0' },
                                                                        '&:hover fieldset': { borderColor: '#f59e0b' }
                                                                    }
                                                                }}
                                                            />
                                                            <IconButton
                                                                onClick={() => handleAttrAdd(attr)}
                                                                sx={{
                                                                    bgcolor: attrInputs[attr].trim() ? '#f59e0b' : '#e2e8f0',
                                                                    color: attrInputs[attr].trim() ? '#fff' : '#94a3b8',
                                                                    borderRadius: '12px',
                                                                    width: 40, height: 40,
                                                                    flexShrink: 0,
                                                                    transition: 'all 0.2s',
                                                                    '&:hover': { bgcolor: '#d97706', color: '#fff' }
                                                                }}
                                                            >
                                                                <Plus size={18} />
                                                            </IconButton>
                                                        </Box>
                                                        {formData.attributes[attr].length === 0 && (
                                                            <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', mt: 0.75, fontStyle: 'italic' }}>
                                                                No options added yet. Separate multiple values with commas.
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    </>
                                )}

                                <Divider><Typography sx={{ color: '#94a3b8', fontWeight: 900, fontSize: '0.65rem', letterSpacing: '2px', textTransform: 'uppercase' }}>Commercial Rules</Typography></Divider>
                                <Box>
                                    <AnimatePresence>
                                        {formData.bulk_pricing.map((bp, index) => (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={index}>
                                                <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'center', p: 2, bgcolor: '#f1f5f9', borderRadius: '16px' }}>
                                                    <TextField 
                                                        label="Volume" size="small" type="number" value={bp.qty}
                                                        placeholder="Qty"
                                                        onChange={(e) => handleBulkPricingChange(index, 'qty', e.target.value)}
                                                        sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'white' } }}
                                                    />
                                                    <TextField 
                                                        label="Unit Price" size="small" type="number" value={bp.price}
                                                        onChange={(e) => handleBulkPricingChange(index, 'price', e.target.value)}
                                                        InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                                                        sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: 'white' } }}
                                                    />
                                                    <IconButton onClick={() => handleRemoveBulkPricing(index)} sx={{ color: '#ef4444', bgcolor: '#fff', '&:hover': { bgcolor: '#fef2f2' }, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                                        <Trash size={18} />
                                                    </IconButton>
                                                </Box>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    <Button 
                                        fullWidth
                                        startIcon={<Plus size={18} />} 
                                        onClick={handleAddBulkPricing}
                                        sx={{ 
                                            mt: 1, py: 1.5, borderRadius: '16px', border: '1px dashed #cbd5e1', color: '#475569', fontWeight: 800,
                                            '&:hover': { borderColor: '#f59e0b', color: '#f59e0b', bgcolor: '#fffbeb' },
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Add Bulk Discount Tier
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 4, pt: 2, gap: 2 }}>
                        <Button 
                            onClick={handleCloseModal} 
                            sx={{ color: '#64748b', fontWeight: 800, px: 3, textTransform: 'none', fontSize: '1rem' }}
                        >
                            Discard
                        </Button>
                        <Button 
                            variant="contained" 
                            onClick={handleSaveProduct} 
                            disabled={saving}
                            sx={{ 
                                borderRadius: '18px', 
                                bgcolor: '#0f172a', 
                                color: 'white',
                                fontWeight: 900, 
                                px: 5, 
                                py: 1.5, 
                                fontSize: '1rem',
                                textTransform: 'none',
                                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.2)',
                                '&:hover': { bgcolor: '#1e293b', transform: 'scale(1.02)' },
                                transition: 'all 0.3s'
                            }}
                        >
                            {saving ? <CircularProgress size={24} color="inherit" /> : (editingProduct ? 'Commit Changes' : 'Publish Item')}
                        </Button>
                    </DialogActions>
                </Dialog>
                </Box>
            </Box>
        </Box>
    );
}
