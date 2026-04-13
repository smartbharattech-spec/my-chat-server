import React, { useState, useEffect } from 'react';
import { Sparkles, Menu, X, LogOut, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Box as MuiBox, Typography as MuiTypography, Badge } from '@mui/material';
import CartDrawer from './CartDrawer';
import { useCart } from '../contexts/CartContext';
import { useChat } from '../contexts/ChatContext';
import '../pages/OccultHome/OccultHome.css';
import './OccultNavbar.css';

export default function OccultNavbar({ variant = 'dark' }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [logoutOpen, setLogoutOpen] = useState(false);
    const navigate = useNavigate();
    const { cartCount, isCartOpen, setIsCartOpen } = useCart();
    const { isChatOpen } = useChat();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        
        const storedUser = localStorage.getItem('occult_user');
        if (storedUser) {
            setIsLoggedIn(true);
            setUser(JSON.parse(storedUser));
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const goToDashboard = () => {
        if (!user) return;
        if (user.role === 'admin') navigate('/occult/admin');
        else if (user.role === 'expert') navigate('/occult/settings');
        else navigate('/occult/user-dashboard');
    };

    const confirmLogout = () => {
        localStorage.removeItem('occult_token');
        localStorage.removeItem('occult_user');
        setIsLoggedIn(false);
        setUser(null);
        setLogoutOpen(false);
        navigate('/occult/login');
    };

    if (isMobile && isChatOpen) return null;

    return (
        <>
            <nav className={`occult-nav ${scrolled ? 'scrolled' : ''} nav-variant-${variant}`}>
                <div className="nav-content">
                    <motion.div className="logo" onClick={() => { navigate('/occult'); window.scrollTo(0, 0); }} style={{ cursor: 'pointer' }}>
                        <div className="logo-icon"><Sparkles size={18} color="#fff" /></div>
                        <span className="logo-text">The Sanatan <span className="highlight-text">Gurukul</span></span>
                    </motion.div>
                    
                    <div className="nav-desktop-only">
                        <div className="nav-links">
                            {/* Navigation links removed as per request */}
                        </div>
                    </div>

                    <div className="nav-actions">
                        {/* Cart Icon - always visible */}
                        <MuiBox
                            onClick={() => setIsCartOpen(true)}
                            sx={{
                                display: 'flex', alignItems: 'center', cursor: 'pointer',
                                p: 1, borderRadius: 2,
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                            }}
                        >
                            <Badge badgeContent={cartCount} color="warning" overlap="circular">
                                <ShoppingCart size={22} color={(scrolled || variant !== 'light') ? '#fff' : '#0f172a'} />
                            </Badge>
                        </MuiBox>

                        {!isLoggedIn ? (
                            /* Desktop login/register buttons */
                            <div className="nav-desktop-only">
                                <button className="btn-secondary" onClick={() => navigate('/occult/login')}>Login</button>
                                <button className="btn-primary" onClick={() => navigate('/occult/register')}>Register</button>
                            </div>
                        ) : (
                            /* Desktop profile pill + logout - hidden on mobile */
                            <div className="nav-desktop-only">
                                <div 
                                    onClick={goToDashboard}
                                    style={{ 
                                        display: 'flex', 
                                        padding: '6px 16px',
                                        borderRadius: '100px',
                                        background: 'rgba(255,255,255,0.08)',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        alignItems: 'center', 
                                        gap: '12px', 
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                                        e.currentTarget.style.borderColor = '#f59e0b';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                                    }}
                                >
                                    <div style={{ 
                                        width: '32px', 
                                        height: '32px', 
                                        borderRadius: '50%', 
                                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        fontWeight: '800',
                                        fontSize: '0.9rem',
                                        color: '#fff',
                                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
                                    }}>
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <span style={{ 
                                        color: (scrolled || variant !== 'light') ? '#fff' : '#0f172a', 
                                        fontSize: '0.9rem', 
                                        fontWeight: '700',
                                        letterSpacing: '0.3px'
                                    }}>
                                        {user.role === 'expert' ? 'My Profile' : 'Dashboard'}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => setLogoutOpen(true)}
                                    style={{ 
                                        background: 'transparent', 
                                        border: 'none', 
                                        color: (scrolled || variant !== 'light') ? 'rgba(255,255,255,0.6)' : '#64748b', 
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '0.9rem',
                                        fontWeight: '700',
                                        transition: '0.3s',
                                        padding: '8px 12px',
                                        borderRadius: '8px'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = (scrolled || variant !== 'light') ? 'rgba(255,255,255,0.6)' : '#64748b'}
                                >
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}

                        {/* Hamburger - only visible on mobile */}
                        <div className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            {isMenuOpen ? <X color={(scrolled || variant !== 'light') ? '#fff' : '#0f172a'} /> : <Menu color={(scrolled || variant !== 'light') ? '#fff' : '#0f172a'} />}
                        </div>
                    </div>
                </div>
            </nav>

            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        className="mobile-menu"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <div className="mobile-links" style={{ display: 'none', flexDirection: 'column', gap: '15px', marginBottom: '20px', padding: '0 10px' }}>
                            {/* Mobile links hidden as per request */}
                        </div>

                        <div className="mobile-actions">
                            {!isLoggedIn ? (
                                <>
                                    <button className="btn-secondary" onClick={() => navigate('/occult/login')}>Login</button>
                                    <button className="btn-primary" onClick={() => navigate('/occult/register')}>Register</button>
                                </>
                            ) : (
                                <>
                                    <button className="btn-primary" fullWidth onClick={goToDashboard}>{user?.role === 'expert' ? 'My Profile' : 'My Dashboard'}</button>
                                    <button 
                                        className="btn-secondary" 
                                        fullWidth 
                                        onClick={() => { setIsMenuOpen(false); setLogoutOpen(true); }}
                                        style={{ marginTop: '10px', borderColor: 'rgba(255,255,255,0.2)' }}
                                    >
                                        Logout
                                    </button>
                                    <button
                                        className="btn-secondary"
                                        onClick={() => { setIsMenuOpen(false); setIsCartOpen(true); }}
                                        style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        <ShoppingCart size={16} />
                                        Cart {cartCount > 0 ? `(${cartCount})` : ''}
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cart Drawer */}
            <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />

            {/* Logout Confirmation Dialog */}
            <Dialog
                open={logoutOpen}
                onClose={() => setLogoutOpen(false)}
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        p: 1,
                        maxWidth: 380,
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.12)'
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
                    <MuiBox sx={{ width: 40, height: 40, bgcolor: 'rgba(239,68,68,0.1)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LogOut size={20} color="#ef4444" />
                    </MuiBox>
                    <MuiTypography fontWeight="800" fontSize="1.1rem" color="#0f172a">Sign Out</MuiTypography>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#64748b', fontSize: '0.95rem' }}>
                        Are you sure you want to sign out? You will need to log in again to access your dashboard.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                    <Button
                        onClick={() => setLogoutOpen(false)}
                        variant="outlined"
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, borderColor: 'rgba(0,0,0,0.15)', color: '#64748b' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={confirmLogout}
                        variant="contained"
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' }, boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}
                    >
                        Yes, Sign Out
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
