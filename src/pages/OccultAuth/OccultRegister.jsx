import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../services/ToastService';
import './OccultAuth.css';

const STARS = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 0.5,
    delay: `${Math.random() * 5}s`,
    duration: `${3 + Math.random() * 4}s`,
}));

const IconUser = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
);
const IconMail = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
);
const IconPhone = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
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

export default function OccultRegister() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [role, setRole] = useState('user');
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', password: '',
        expert_type: 'consultant'
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        const e = {};
        if (!formData.name.trim()) e.name = 'Name is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Invalid email';
        if (!/^[0-9+\s-]{7,15}$/.test(formData.phone)) e.phone = 'Invalid phone';
        if (formData.password.length < 8) e.password = 'Min 8 characters';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const api = role === 'user' ? "/api/marketplace/auth_register_user.php" : "/api/marketplace/auth_register_expert.php";
            const body = role === 'user' 
                ? JSON.stringify({ ...formData }) 
                : (() => {
                    const fd = new FormData();
                    Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
                    return fd;
                  })();

            const response = await fetch(api, {
                method: 'POST',
                headers: role === 'user' ? { 'Content-Type': 'application/json' } : undefined,
                body
            });

            const data = await response.json();
            if (data.status === 'success') {
                showToast(data.message, 'success');
                navigate('/occult/login');
            } else {
                showToast(data.message, 'error');
            }
        } catch (error) {
            showToast('Connection error', 'error');
        } finally {
            setLoading(false);
        }
    };

    const inputProps = (key) => ({
        value: formData[key],
        onChange: (e) => {
            setFormData({ ...formData, [key]: e.target.value });
            setErrors({ ...errors, [key]: '' });
        },
        className: `occult-input-field${errors[key] ? ' error' : ''}`
    });

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
                        Join the <br />
                        <span className="occult-text-gradient">Spiritual</span> <br />
                        Revolution.
                    </h1>

                    <p className="occult-left-desc">
                        {role === 'expert' 
                            ? 'Register as an expert, showcase your skills, and consult globally.' 
                            : 'Create a free account to save your Kundlis, Vastu layouts and consult experts.'}
                    </p>

                    <div className="occult-auth-badges">
                        {[
                            { icon: '🛡️', label: 'End-to-End Encrypted' },
                            { icon: '✨', label: 'Trusted by Experts' },
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
                    <header className="occult-mobile-auth-header">
                        <div className="occult-brand-logo">
                            <div className="occult-brand-icon-box">🔱</div>
                            <div className="occult-brand-name">Sanatan Gurukul</div>
                        </div>
                        <h2>Create Account</h2>
                        <p>Begin your journey on the sacred platform today.</p>
                    </header>

                    <div className="occult-auth-card occult-fade-in" style={{ maxWidth: '540px' }}>
                        <div className="occult-card-top">
                            <div className="occult-card-icon-row">
                                <div className="occult-card-icon-badge"><IconShield /></div>
                                <h2 className="occult-card-title">Registration</h2>
                            </div>
                            <p className="occult-card-subtitle">Fill in the details below to create your account.</p>
                        </div>

                        {/* Role Toggle */}
                        <div className="occult-toggle-group">
                            <button 
                                className={`occult-toggle-btn${role === 'user' ? ' active' : ''}`}
                                onClick={() => setRole('user')}
                            >
                                I am a User
                            </button>
                            <button 
                                className={`occult-toggle-btn${role === 'expert' ? ' active' : ''}`}
                                onClick={() => setRole('expert')}
                            >
                                I am an Expert
                            </button>
                        </div>

                        <form onSubmit={handleRegister}>
                            <div className="occult-form-row">
                                <div className="occult-form-field" style={{ flex: 1 }}>
                                    <div className="occult-label-row"><span className="occult-label-text">Full Name</span></div>
                                    <div className="occult-input-box">
                                        <span className="occult-input-ico"><IconUser /></span>
                                        <input type="text" placeholder="John Doe" {...inputProps('name')} />
                                    </div>
                                    {errors.name && <div className="occult-error-msg">{errors.name}</div>}
                                </div>
                                <div className="occult-form-field" style={{ flex: 1 }}>
                                    <div className="occult-label-row"><span className="occult-label-text">Phone</span></div>
                                    <div className="occult-input-box">
                                        <span className="occult-input-ico"><IconPhone /></span>
                                        <input type="tel" placeholder="+91 0000000000" {...inputProps('phone')} />
                                    </div>
                                    {errors.phone && <div className="occult-error-msg">{errors.phone}</div>}
                                </div>
                            </div>

                            <div className="occult-form-field">
                                <div className="occult-label-row"><span className="occult-label-text">Email Address</span></div>
                                <div className="occult-input-box">
                                    <span className="occult-input-ico"><IconMail /></span>
                                    <input type="email" placeholder="you@example.com" {...inputProps('email')} />
                                </div>
                                {errors.email && <div className="occult-error-msg">{errors.email}</div>}
                            </div>

                            <div className="occult-form-field">
                                <div className="occult-label-row"><span className="occult-label-text">Password</span></div>
                                <div className="occult-input-box">
                                    <span className="occult-input-ico"><IconLock /></span>
                                    <input 
                                        type={showPassword ? 'text' : 'password'} 
                                        placeholder="Min 8 characters" 
                                        {...inputProps('password')} 
                                    />
                                    <button type="button" className="occult-input-btn" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <IconEyeOff /> : <IconEye />}
                                    </button>
                                </div>
                                {errors.password && <div className="occult-error-msg">{errors.password}</div>}
                            </div>

                            {role === 'expert' && (
                                <div className="occult-form-field">
                                    <div className="occult-label-row"><span className="occult-label-text">Expert Type</span></div>
                                    <select 
                                        className="occult-input-field" 
                                        style={{ paddingLeft: '18px' }}
                                        value={formData.expert_type}
                                        onChange={(e) => setFormData({ ...formData, expert_type: e.target.value })}
                                    >
                                        <option value="consultant">Consultant</option>
                                        <option value="teacher">Teacher</option>
                                        <option value="both">Both</option>
                                    </select>
                                </div>
                            )}

                            <button type="submit" className="occult-auth-btn" disabled={loading}>
                                {loading ? 'Registering...' : (role === 'user' ? 'Create User Account' : 'Create Expert Account')}
                                {!loading && <IconArrow />}
                            </button>
                        </form>

                        <div className="occult-switch-row">
                            Already have an account? 
                            <span className="occult-switch-link" onClick={() => navigate('/occult/login')}>Log in here</span>
                        </div>

                        <div className="occult-security-note">
                            Your data is end-to-end encrypted and stored securely.
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
