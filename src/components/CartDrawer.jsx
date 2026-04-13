import React from 'react';
import {
    Drawer, Box, Typography, IconButton, Button,
    Avatar, Badge
} from '@mui/material';
import Divider from '@mui/material/Divider';
import { X, Minus, Plus, Trash2, ShoppingCart, Sparkles } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer({ open, onClose }) {
    const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();
    const navigate = useNavigate();

    const handleCheckout = () => {
        onClose();
        navigate('/occult/checkout');
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: { xs: '100vw', sm: 420 },
                    bgcolor: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column'
                }
            }}
        >
            {/* Header */}
            <Box sx={{
                p: 3,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                color: 'white'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ p: 1, bgcolor: 'rgba(245,158,11,0.2)', borderRadius: 2, color: '#f59e0b' }}>
                        <ShoppingCart size={22} />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight="900">My Cart</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    <X size={22} />
                </IconButton>
            </Box>

            {/* Items list */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
                {cartItems.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 10, px: 4 }}>
                        <Box sx={{ mb: 2, color: '#f59e0b', opacity: 0.5 }}>
                            <ShoppingCart size={56} />
                        </Box>
                        <Typography variant="h6" fontWeight="800" gutterBottom color="#0f172a">
                            Your cart is empty
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Browse expert profiles and add divine offerings to your cart.
                        </Typography>
                        <Button
                            variant="outlined"
                            onClick={() => { onClose(); navigate('/occult/shop'); }}
                            sx={{
                                borderRadius: 3, textTransform: 'none', fontWeight: 800,
                                borderColor: '#f59e0b', color: '#f59e0b',
                                '&:hover': { bgcolor: 'rgba(245,158,11,0.05)' }
                            }}
                        >
                            Explore Experts
                        </Button>
                    </Box>
                ) : (
                    cartItems.map(({ product, expert, quantity, selectedOptions, cartItemId }) => (
                        <Box
                            key={cartItemId}
                            sx={{
                                bgcolor: 'white', borderRadius: 3, p: 2, mb: 2,
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                            }}
                        >
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                {/* Product thumbnail */}
                                <Box 
                                    onClick={() => { onClose(); navigate(`/occult/product/${product.id}`); }}
                                    sx={{
                                        width: 70, height: 70, borderRadius: 2, overflow: 'hidden',
                                        flexShrink: 0, bgcolor: '#f1f5f9', cursor: 'pointer'
                                    }}
                                >
                                    <img
                                        src={product.image_url ? `/${product.image_url}` : 'https://placehold.co/70x70?text=Item'}
                                        alt={product.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={e => { e.target.src = 'https://placehold.co/70x70?text=Item'; }}
                                    />
                                </Box>

                                {/* Info */}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography 
                                        variant="subtitle1" 
                                        fontWeight="800" 
                                        noWrap 
                                        onClick={() => { onClose(); navigate(`/occult/product/${product.id}`); }}
                                        sx={{ cursor: 'pointer', '&:hover': { color: '#f59e0b' } }}
                                    >
                                        {product.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap>
                                        by {expert?.name || 'Expert'}
                                    </Typography>
                                    {selectedOptions && Object.keys(selectedOptions).length > 0 && (
                                        <Typography variant="caption" sx={{ color: '#0ea5e9', display: 'block', mt: 0.5, fontWeight: 700 }}>
                                            {Object.entries(selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                                        </Typography>
                                    )}
                                    <Typography variant="body2" fontWeight="900" sx={{ color: '#f59e0b', mt: 0.5 }}>
                                        ₹{(parseFloat(product.price) * quantity).toFixed(2)}
                                    </Typography>
                                </Box>

                                {/* Delete */}
                                <IconButton
                                    size="small"
                                    onClick={() => removeFromCart(cartItemId)}
                                    sx={{ color: '#ef4444', alignSelf: 'flex-start' }}
                                >
                                    <Trash2 size={16} />
                                </IconButton>
                            </Box>

                            {/* Quantity controls */}
                            <Box sx={{
                                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                                gap: 1, mt: 1.5
                            }}>
                                <IconButton
                                    size="small"
                                    onClick={() => updateQuantity(cartItemId, quantity - 1)}
                                    sx={{
                                        width: 28, height: 28,
                                        bgcolor: '#f1f5f9', border: '1px solid #e2e8f0',
                                        '&:hover': { bgcolor: '#e2e8f0' }
                                    }}
                                >
                                    <Minus size={14} />
                                </IconButton>
                                <Typography variant="body2" fontWeight="800" sx={{ minWidth: 24, textAlign: 'center' }}>
                                    {quantity}
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={() => updateQuantity(cartItemId, quantity + 1)}
                                    sx={{
                                        width: 28, height: 28,
                                        bgcolor: '#f59e0b', color: 'white',
                                        '&:hover': { bgcolor: '#d97706' }
                                    }}
                                >
                                    <Plus size={14} />
                                </IconButton>
                            </Box>
                        </Box>
                    ))
                )}
            </Box>

            {/* Footer with total and checkout */}
            {cartItems.length > 0 && (
                <Box sx={{ p: 3, bgcolor: 'white', borderTop: '1px solid #e2e8f0' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight="700" color="text.secondary">
                            Subtotal
                        </Typography>
                        <Typography variant="h6" fontWeight="900" color="#0f172a">
                            ₹{cartTotal.toFixed(2)}
                        </Typography>
                    </Box>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleCheckout}
                        startIcon={<Sparkles size={18} />}
                        sx={{
                            py: 1.5, borderRadius: 3, textTransform: 'none',
                            fontWeight: 900, fontSize: '1rem',
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            boxShadow: '0 8px 20px rgba(245,158,11,0.35)',
                            '&:hover': { background: 'linear-gradient(135deg, #d97706, #b45309)' }
                        }}
                    >
                        Proceed to Checkout
                    </Button>
                </Box>
            )}
        </Drawer>
    );
}
