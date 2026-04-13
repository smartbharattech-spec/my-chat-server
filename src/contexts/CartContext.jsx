import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [cartItems, setCartItems] = useState(() => {
        try {
            const saved = localStorage.getItem('occult_cart');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('occult_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const generateCartItemId = (product, options = {}) => {
        const type = product.product_type || 'product';
        return `${type}-${product.id}-${JSON.stringify(options)}`;
    };

    const addToCart = (product, expert, selectedOptions = {}) => {
        setCartItems(prev => {
            const cartItemId = generateCartItemId(product, selectedOptions);
            const existing = prev.find(item => item.cartItemId === cartItemId);
            if (existing) {
                return prev.map(item =>
                    item.cartItemId === cartItemId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, expert, quantity: 1, selectedOptions, cartItemId }];
        });
    };

    const removeFromCart = (cartItemId) => {
        setCartItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
    };

    const updateQuantity = (cartItemId, qty) => {
        if (qty <= 0) {
            removeFromCart(cartItemId);
            return;
        }
        setCartItems(prev =>
            prev.map(item =>
                item.cartItemId === cartItemId ? { ...item, quantity: qty } : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
        localStorage.removeItem('occult_cart');
    };

    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartSubtotal = cartItems.reduce(
        (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
        0
    );
    const cartGst = cartSubtotal * 0.18;
    const cartTotal = cartSubtotal + cartGst;

    return (
        <CartContext.Provider value={{ 
            cartItems, addToCart, removeFromCart, updateQuantity, clearCart, 
            cartCount, cartSubtotal, cartGst, cartTotal,
            isCartOpen, setIsCartOpen
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
}
