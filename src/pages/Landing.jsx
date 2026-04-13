import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, LayoutDashboard, Store, Users, 
  ChevronRight, ArrowRight, ShieldCheck, 
  Sparkles, Menu, X, Mail, Phone, MapPin
} from 'lucide-react';
import './Landing.css';

export default function Landing() {
    const [scrolled, setScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fadeUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    return (
        <div className="landing-container">
            {/* --- NAVIGATION --- */}
            <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
                <div className="nav-content">
                    <div className="logo-container" onClick={() => navigate('/')}>
                        <div className="card-icon-blob" style={{ width: '32px', height: '32px', marginBottom: 0 }}>
                            <Compass size={18} color="white" />
                        </div>
                        <span className="logo-text">MyVastu<span className="logo-orange">Tool</span></span>
                    </div>

                    <div className="nav-actions">
                        <a href="#features" className="btn-login">Features</a>
                        <a href="#about" className="btn-login">About</a>
                        <button className="btn-login" onClick={() => navigate('/login')}>Login</button>
                        <button className="btn-signup" onClick={() => navigate('/register')}>Get Started</button>
                    </div>

                    {/* Mobile Menu Button - simplified for demonstration */}
                    <div className="mobile-only" style={{ display: 'none' }}>
                       <Menu size={24} onClick={() => setIsMenuOpen(true)} />
                    </div>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <section className="landing-hero">
                <div className="hero-main">
                    <motion.div 
                        className="hero-text"
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                    >
                        <h1>Master Your Space with <span className="logo-orange">Ancient Wisdom.</span></h1>
                        <p>The ultimate professional ecosystem for Vastu analysis, remedial architecture, and spiritual growth. Powered by experts, used by thousands.</p>
                        <div className="hero-cta">
                            <button className="hero-btn-primary" onClick={() => navigate('/register')}>Start Free Analysis <ArrowRight size={20} style={{ marginLeft: '8px' }} /></button>
                            <button className="hero-btn-secondary" onClick={() => navigate('/occult')}>Explore Marketplace</button>
                        </div>
                    </motion.div>

                    <motion.div 
                        className="hero-visual"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <div className="hero-card-mockup">
                            <div className="card-icon-blob">
                                <Compass size={48} color="white" />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '12px' }}>Professional Vastu Engine</h3>
                            <p style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', maxWidth: '300px' }}>Calculate 16 zones in seconds. Precise grid mapping for harmonized living.</p>
                        </div>
                        
                        {/* Decorative background elements */}
                        <div style={{ 
                            position: 'absolute', 
                            top: '-20px', 
                            right: '-20px', 
                            width: '200px', 
                            height: '200px', 
                            background: 'rgba(249, 115, 22, 0.2)', 
                            borderRadius: '50%',
                            filter: 'blur(40px)',
                            zIndex: 1
                        }}></div>
                    </motion.div>
                </div>
            </section>

            {/* --- KEY FEATURES --- */}
            <section className="landing-section" id="features">
                <div className="section-header">
                    <motion.div initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }}>
                       <h2 style={{ color: 'var(--bg-dark)' }}>Platform Developed for <span className="logo-orange">Excellence.</span></h2>
                       <p>A unified suite of tools designed to help both consultants and homeowners achieve perfect spatial alignment.</p>
                    </motion.div>
                </div>

                <div className="features-grid">
                    <motion.div className="feature-card" initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }}>
                        <div className="feat-icon"><LayoutDashboard size={32} /></div>
                        <h3>Smart Vastu Grid</h3>
                        <p>Our proprietary engine maps your floor plan against the 16 zones of Vastu Shastra with surgical precision.</p>
                    </motion.div>

                    <motion.div className="feature-card" initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }}>
                        <div className="feat-icon"><Store size={32} /></div>
                        <h3>Occult Marketplace</h3>
                        <p>Highly curated spiritual remedies, vetted gemstones, and expert consultation services all in one place.</p>
                    </motion.div>

                    <motion.div className="feature-card" initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }}>
                        <div className="feat-icon"><Users size={32} /></div>
                        <h3>Certified Experts</h3>
                        <p>Connect with a global community of verified consultants for personalized home analysis and life coaching.</p>
                    </motion.div>
                </div>
            </section>

            {/* --- TRUST BANNER --- */}
            <section className="landing-section" id="about" style={{ background: 'var(--bg-soft)', borderRadius: '60px 60px 0 0' }}>
               <div className="hero-main" style={{ gridTemplateColumns: '1fr 1fr' }}>
                   <div style={{ flex: 1 }}>
                       <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '24px' }}>Over 10,000+ Maps <span className="logo-orange">Generated.</span></h2>
                       <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '40px' }}>
                           My Vastu Tool was founded with the mission to bridge the gap between ancient Sanatan lineage and modern architectural needs. 
                           We provide enterprise-grade tools for consultants and accessible wisdom for homeowners.
                       </p>
                       <div className="trust-badges" style={{ display: 'flex', gap: '32px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                             <ShieldCheck color="var(--primary-orange)" /> 100% Reliable
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                             <Sparkles color="var(--primary-orange)" /> Advanced Tech
                          </div>
                       </div>
                   </div>
                   <div className="hero-visual">
                      <div style={{ 
                          width: '100%', 
                          height: '340px', 
                          background: 'linear-gradient(135deg, var(--bg-dark), #1e293b)', 
                          borderRadius: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: 'var(--shadow-xl)'
                      }}>
                         <LayoutDashboard size={80} color="var(--primary-orange)" />
                      </div>
                   </div>
               </div>
            </section>

            {/* --- FINAL CTA --- */}
            <section className="landing-section" style={{ textAlign: 'center', background: 'var(--bg-white)', paddingBottom: '160px' }}>
                <motion.div initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }}>
                    <h2 style={{ fontSize: '3rem', fontWeight: '950', marginBottom: '32px' }}>Ready to balance <span className="logo-orange">your life?</span></h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', marginBottom: '60px' }}>Join the Gurukul of modern architectural wisdom today.</p>
                    <button className="hero-btn-primary" onClick={() => navigate('/register')} style={{ padding: '24px 64px', fontSize: '1.25rem' }}>Create Free Account</button>
                </motion.div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <h3>MyVastu<span className="logo-orange">Tool</span></h3>
                        <p>Empowering millions to harmonize their space through digital Vastu analysis and certified expert consultations.</p>
                        <div className="social-links" style={{ marginTop: '32px', display: 'flex', gap: '20px' }}>
                           <Mail size={24} style={{ opacity: 0.6 }} />
                           <Phone size={24} style={{ opacity: 0.6 }} />
                           <MapPin size={24} style={{ opacity: 0.6 }} />
                        </div>
                    </div>
                    
                    <div className="footer-col">
                        <h4>Product</h4>
                        <div className="footer-links">
                           <a href="#">Vastu Builder</a>
                           <a href="#">Occult Market</a>
                           <a href="#">Expert Directory</a>
                           <a href="#">Remedy Logs</a>
                        </div>
                    </div>

                    <div className="footer-col">
                        <h4>Experts</h4>
                        <div className="footer-links">
                           <a href="/occult/login">Partner Program</a>
                           <a href="#">Certification</a>
                           <a href="#">Consultant CRM</a>
                           <a href="#">API Access</a>
                        </div>
                    </div>

                    <div className="footer-col">
                        <h4>Legal</h4>
                        <div className="footer-links">
                           <a href="#">Privacy Policy</a>
                           <a href="#">Terms of Use</a>
                           <a href="#">Cookie Policy</a>
                           <a href="#">Disclaimer</a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© {new Date().getFullYear()} My Vastu Tool Technologies. Designed for Harmonious Living.</p>
                </div>
            </footer>
        </div>
    );
}
