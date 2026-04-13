import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../services/ToastService';
import { useAuth } from '../../services/AuthService';
import './OccultAuth.css';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

const STARS = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 0.5,
    delay: `${Math.random() * 5}s`,
    duration: `${3 + Math.random() * 4}s`,
}));

const IconMail = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
);
const IconLock = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
);
const IconEye = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
    </svg>
);
const IconEyeOff = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>
    </svg>
);
const IconShield = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
);
const IconArrow = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
);
const IconAlert = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
);

export default function OccultLogin() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { loginMarketplace } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [lockedUntil, setLockedUntil] = useState(null);
    const formRef = useRef(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('occult_user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            if (user.role === 'admin') navigate('/occult/admin');
            else if (user.role === 'expert' || user.role === 'user') navigate('/occult/settings');
        }
    }, [navigate]);

    const isLocked = lockedUntil && Date.now() < lockedUntil;
    const lockMinutes = isLocked ? Math.ceil((lockedUntil - Date.now()) / 60000) : 0;

    const validateEmail = (val) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!val) return 'Email is required';
        if (!emailRegex.test(val)) return 'Enter a valid email address';
        return '';
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (isLocked) {
            showToast(`Too many attempts. Try again in ${lockMinutes} minute(s).`, 'error');
            return;
        }

        const emailErr = validateEmail(email);
        setEmailError(emailErr);
        if (emailErr) return;

        if (!password || password.length < 6) {
            showToast('Password must be at least 6 characters.', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/marketplace/auth_login.php", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password: password.trim() })
            });

            const data = await response.json();
            if (data.status === 'success') {
                setAttempts(0);
                localStorage.setItem('occult_token', data.data.token);
                localStorage.setItem('occult_user', JSON.stringify(data.data));
                loginMarketplace(data.data);
                showToast(data.message || 'Login successful', 'success');

                if (data.data.role === 'admin') navigate('/occult/admin');
                else navigate('/occult/settings');
            } else {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);
                if (newAttempts >= MAX_ATTEMPTS) {
                    setLockedUntil(Date.now() + LOCKOUT_MS);
                    showToast(`Account locked. Try again in 5 minutes.`, 'error');
                } else {
                    showToast(data.message || 'Login failed', 'error');
                }
            }
        } catch (error) {
            showToast('Server error. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="occult-auth-root">
            {/* Stars */}
            <div className="occult-stars">
                {STARS.map(s => (
                    <div key={s.id} className="occult-star" style={{
                        top: s.top, left: s.left, width: `${s.size}px`, height: `${s.size}px`,
                        animationDelay: s.delay, animationDuration: s.duration
                    }} />
                ))}
            </div>

            <main className="occult-auth-layout">
                {/* ── Left Panel ── */}
                <aside className="occult-auth-left">
                    <div className="occult-orb orb-1" />
                    <div className="occult-orb orb-2" />

                    <div className="occult-brand-logo">
                        <div className="occult-brand-icon-box">🔱</div>
                        <div className="occult-brand-text">
                            <div className="occult-brand-name">Sanatan Gurukul</div>
                            <div className="occult-brand-sub">Occult Platform</div>
                        </div>
                    </div>

                    <h1 className="occult-left-title">
                        Welcome back to <br />
                        <span className="occult-text-gradient">The Sacred</span> <br />
                        Platform.
                    </h1>

                    <p className="occult-left-desc">
                        Manage your consultations, spiritual growth, and professional presence all in one place.
                    </p>

                    <div className="occult-auth-badges">
                        {[
                            { icon: '🔒', label: 'End-to-End Encrypted' },
                            { icon: '🛡️', label: 'Secure Authentication' },
                            { icon: '✨', label: 'Spiritual Community' },
                        ].map(b => (
                            <div key={b.label} className="occult-auth-badge">
                                <div className="badge-icon">{b.icon}</div>
                                <span className="badge-label">{b.label}</span>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* ── Right Panel ── */}
                <section className="occult-auth-right">
                    {/* Mobile Header (Inside right panel for better flow) */}
                    <header className="occult-mobile-auth-header">
                        <div className="occult-brand-logo">
                            <div className="occult-brand-icon-box">🔱</div>
                            <div className="occult-brand-text">
                                <div className="occult-brand-name">Sanatan Gurukul</div>
                            </div>
                        </div>
                        <h2>Secure Sign In</h2>
                        <p>Log in to manage your consultations & spiritual journey.</p>
                    </header>

                    <div className="occult-auth-card occult-fade-in">
                        <div className="occult-card-top">
                            <div className="occult-card-icon-row">
                                <div className="occult-card-icon-badge">
                                    <IconShield />
                                </div>
                                <h2 className="occult-card-title">Sign In</h2>
                            </div>
                            <p className="occult-card-subtitle">Enter your details to access your account.</p>
                        </div>

                        {attempts > 0 && !isLocked && (
                            <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(245,158,11,0.1)', color: '#fcd34d', fontSize: '0.8rem', marginBottom: '20px', border: '1px solid rgba(245,158,11,0.2)' }}>
                                {MAX_ATTEMPTS - attempts} attempt(s) remaining before lockout.
                            </div>
                        )}

                        <form onSubmit={handleLogin} ref={formRef}>
                            <div className="occult-form-field">
                                <div className="occult-label-row">
                                    <span className="occult-label-text">Email Address</span>
                                </div>
                                <div className="occult-input-box">
                                    <span className="occult-input-ico"><IconMail /></span>
                                    <input
                                        type="email"
                                        className={`occult-input-field${emailError ? ' error' : ''}`}
                                        placeholder="you@example.com"
                                        value={email}
                                        disabled={isLocked}
                                        onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                                    />
                                </div>
                                {emailError && <div className="occult-error-msg"><IconAlert /> {emailError}</div>}
                            </div>

                            <div className="occult-form-field">
                                <div className="occult-label-row">
                                    <span className="occult-label-text">Password</span>
                                    <span className="occult-label-link" onClick={() => navigate('/occult/forgot-password')}>Forgot?</span>
                                </div>
                                <div className="occult-input-box">
                                    <span className="occult-input-ico"><IconLock /></span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="occult-input-field"
                                        placeholder="••••••••"
                                        value={password}
                                        disabled={isLocked}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="occult-input-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <IconEyeOff /> : <IconEye />}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="occult-auth-btn" disabled={loading || isLocked}>
                                {loading ? 'Authenticating...' : 'Sign In Securely'}
                                {!loading && <IconArrow />}
                            </button>
                        </form>

                        <div className="occult-switch-row">
                            Don't have an account? 
                            <span className="occult-switch-link" onClick={() => navigate('/occult/register')}>Create one</span>
                        </div>

                        <div className="occult-security-note">
                            <IconLock />
                            Protected by end-to-end encryption.
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
