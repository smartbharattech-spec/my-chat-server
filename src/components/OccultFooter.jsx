import React from 'react';
import { Instagram, Youtube, Twitter, Sparkles } from 'lucide-react';
import '../pages/OccultHome/OccultHome.css';

export default function OccultFooter() {
    return (
        <footer className="occult-footer">
            <div className="footer-grid">
                <div className="footer-brand">
                    <div className="footer-logo-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <div className="logo-icon" style={{ 
                            width: '32px', 
                            height: '32px', 
                            backgroundColor: 'var(--primary-gold)', 
                            borderRadius: '8px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                        }}>
                            <Sparkles size={18} color="#fff" />
                        </div>
                        <h3 className="footer-logo" style={{ marginBottom: 0 }}>The Sanatan <span className="highlight-text">Gurukul</span></h3>
                    </div>
                    <p className="footer-tagline">India's premier spiritual ecosystem bridging ancient Occult sciences with modern encrypted infrastructure.</p>
                    <div className="social-links">
                        <div className="social-icon"><Instagram size={20} color="white" /></div>
                        <div className="social-icon"><Youtube size={20} color="white" /></div>
                        <div className="social-icon"><Twitter size={20} color="white" /></div>
                    </div>
                </div>
                <div className="footer-nav">
                    <h4 className="footer-heading">Platform</h4>
                    <a href="#" className="footer-link">Consultations</a>
                    <a href="#" className="footer-link">E-Learning LMS</a>
                    <a href="#" className="footer-link">Authentic Shop</a>
                    <a href="#" className="footer-link">Vastu Builder</a>
                </div>
                <div className="footer-nav">
                    <h4 className="footer-heading">Experts</h4>
                    <a href="#" className="footer-link">Apply as Expert</a>
                    <a href="#" className="footer-link">Earnings Guide</a>
                    <a href="#" className="footer-link">Compliance Policy</a>
                </div>
                <div className="footer-trust">
                    <h4 className="footer-heading">Legal & Security</h4>
                    <a href="#" className="footer-link mt-2">Privacy Policy</a>
                    <a href="#" className="footer-link">Terms of Service</a>
                    <a href="#" className="footer-link">Refund Policy</a>
                    <small style={{ color: "var(--text-muted)", display: "block", marginTop: "10px" }}>* Belief-based Service Disclaimer</small>
                </div>
            </div>
            <div className="footer-bottom">
                <p>© {new Date().getFullYear()} The Sanatan Gurukul Technologies. Designed for Excellence.</p>
            </div>
        </footer>
    );
}
