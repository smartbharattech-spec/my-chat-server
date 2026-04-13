import React, { useState, useEffect } from 'react';
import {
  Star, Phone, MessageCircle, Moon, Compass,
  Sparkles, CheckCircle, GraduationCap, Play,
  Instagram, Youtube, Twitter, ShieldCheck, Lock, Menu, X, ChevronRight,
  Video, Wallet, Users, LayoutDashboard, BrainCircuit, Store, ScrollText, ShieldAlert, BadgeCheck
} from 'lucide-react';
import StarIcon from "@mui/icons-material/Star";
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../contexts/ChatContext';
import OccultNavbar from '../../components/OccultNavbar';
import OccultFooter from '../../components/OccultFooter';
import './OccultHome.css';

export default function OccultHome() {
  const [scrolled, setScrolled] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate();
  const { onlineUsers } = useChat();


  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);



  const isMobile = windowWidth < 992;
  const xOffset = isMobile ? 80 : 120;


  const tools = [
    { title: "Free Kundli", desc: "Detailed accurate birth charts", icon: <Moon size={32} />, color: "rgba(139, 92, 246, 0.1)" },
    { title: "Vastu Builder", desc: "Proprietary grid & mapping tool", icon: <Compass size={32} />, color: "rgba(245, 158, 11, 0.1)" },
    { title: "Numerology", desc: "Advanced life path calculations", icon: <Sparkles size={32} />, color: "rgba(59, 130, 246, 0.1)" },
    { title: "Daily Panchang", desc: "Auspicious timings & alerts", icon: <CheckCircle size={32} />, color: "rgba(16, 185, 129, 0.1)" },
  ];

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="occultverse-container">
      {/* --- NAVBAR --- */}
      <OccultNavbar />

      {/* 1. HERO SECTION */}
      <section className="hero-section" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.1) 0%, transparent 80%), linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.3)), url('assets/images/hero-bg.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="hero-content-wrapper">
          <div className="hero-split-layout">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="hero-text-content"
            >
              <div className="hero-badge">
                <BadgeCheck size={16} /> The Absolute Gurukul Ecosystem
              </div>
              <h1 className="hero-title">
                Decode your <span className="text-gradient-gold">Destiny.</span> <br />
                Master your Space.
              </h1>
              <p className="hero-sub">
                India's most advanced platform for Vastu experts, spiritual students, and seekers.
                Bridging ancient wisdom with modern technology.
              </p>
              <div className="hero-btns">
                <button className="main-btn" onClick={() => navigate('/occult/register')}>Get Started Now <ChevronRight size={18} /></button>
                {!isMobile && <button className="outline-btn" onClick={() => navigate('/occult/login')}>Expert Login</button>}
              </div>

              <div className="trust-metrics-modern">
                <div className="metric"><span>1000+</span> Experts</div>
                <div className="metric-dot"></div>
                <div className="metric"><span>Global</span> Community</div>
                <div className="metric-dot"></div>
                <div className="metric"><span>Verified</span> Lineage</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="hero-visual-content"
            >
              <div className="expert-model-showcase">
                <motion.div 
                  className="expert-model model-1"
                  initial={{ rotate: -12, x: -xOffset * 1.2, y: 20, opacity: 0 }}
                  animate={{ rotate: -12, x: -xOffset * 1.2, y: 20, opacity: 1 }}
                  whileHover={{ scale: 1.05, zIndex: 10, rotate: -5 }}
                >
                  <img src="assets/images/experts/male-1.png" alt="Expert" />
                  <div className="model-label">
                    <span className="name">Acharya Rajesh</span>
                    <span className="badge">Vedic Astrologer</span>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="expert-model model-2"
                  initial={{ rotate: 0, x: 0, y: 0, scale: 1.1, opacity: 0 }}
                  animate={{ rotate: 0, x: 0, y: 0, scale: 1.1, opacity: 1 }}
                  whileHover={{ scale: 1.15, zIndex: 10 }}
                >
                  <img src="assets/images/experts/female-1.png" alt="Expert" />
                  <div className="model-label">
                    <span className="name">Dr. Sunita V.</span>
                    <span className="badge">Vastu Scientist</span>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="expert-model model-3"
                  initial={{ rotate: 12, x: xOffset * 1.2, y: 20, opacity: 0 }}
                  animate={{ rotate: 12, x: xOffset * 1.2, y: 20, opacity: 1 }}
                  whileHover={{ scale: 1.05, zIndex: 10, rotate: 5 }}
                >
                  <img src="assets/images/experts/male-2.png" alt="Expert" />
                  <div className="model-label">
                    <span className="name">Guru Devansh</span>
                    <span className="badge">Numerology Master</span>
                  </div>
                </motion.div>

                <div className="live-status-pill">
                  <div className="pulse-dot"></div>
                  <span>250+ Mentors Live</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. CORE ECOSYSTEM */}
      <section className="occult-section bg-dark" id="tools">
        <div className="section-header">
          <span className="overline">ECOSYSTEM</span>
          <h2 className="section-title" style={{ color: '#ffffff' }}>A New Paradigm in <span className="text-gradient-gold">Ancient Science.</span></h2>
          <p className="section-subtitle mx-auto">We've unified the fragmented occult market into one seamless, tech-first ecosystem for both experts and seekers.</p>
        </div>
        <motion.div className="features-grid-pro" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
          <motion.div className="feature-pro-card" variants={fadeUp}>
            <div className="feature-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Phone size={28} />
            </div>
            <h3>Instant Connect</h3>
            <p>100% private Wallet-based Voice, Video, and Chat consultations powered by secure VoIP masking tech.</p>
          </motion.div>
          <motion.div className="feature-pro-card" variants={fadeUp}>
            <div className="feature-icon-wrapper" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
              <Compass size={28} />
            </div>
            <h3>Vastu Engine</h3>
            <p>Our proprietary Vastu grid builder creates 16 zones in seconds, saving hours of manual drafting efforts.</p>
          </motion.div>
          <motion.div className="feature-pro-card" variants={fadeUp}>
            <div className="feature-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <Store size={28} />
            </div>
            <h3>Unified Market</h3>
            <p>A highly curated store for spiritual remedies. Let experts seamlessly recommend and earn commissions.</p>
          </motion.div>
          <motion.div className="feature-pro-card" variants={fadeUp}>
            <div className="feature-icon-wrapper" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <GraduationCap size={28} />
            </div>
            <h3>LMS Academy</h3>
            <p>Upskill yourself. Learn profound ancient sciences from top-rated mentors via rich video courses.</p>
          </motion.div>
        </motion.div>
      </section>

      {/* 3. INSTANT CONSULTATIONS */}
      <section className="occult-section bg-gray" id="consult">
        <div className="section-header">
          <span className="overline">SEAMLESS CONNECTION</span>
          <h2 className="section-title">Talk, Chat, or <span style={{ color: '#ec4899' }}>Video Call.</span></h2>
          <p className="section-subtitle mx-auto">Get instant guidance on your terms. Our platform supports lightning-fast Chat, Crystal HD Video, and crystal-clear Voice calls.</p>
        </div>

        <motion.div className="bento-grid" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
          <motion.div className="bento-card" style={{ borderTop: '4px solid #f59e0b' }} variants={fadeUp}>
            <div className="bento-icon" style={{ backgroundColor: '#fffbeb' }}><Phone color="#f59e0b" size={32} /></div>
            <h3>Anonymous VoIP</h3>
            <p>100% Number Masking. Need to talk? Our secure servers connect calls without ever sharing your private number.</p>
          </motion.div>
          <motion.div className="bento-card" style={{ borderTop: '4px solid #3b82f6' }} variants={fadeUp}>
            <div className="bento-icon" style={{ backgroundColor: '#eff6ff' }}><MessageCircle color="#3b82f6" size={32} /></div>
            <h3>Encrypted Chat</h3>
            <p>Share Kundli details, ask follow-up questions, and get precise written remedies through our AES-encrypted chat.</p>
          </motion.div>
          <motion.div className="bento-card" style={{ borderTop: '4px solid #ec4899' }} variants={fadeUp}>
            <div className="bento-icon" style={{ backgroundColor: '#fce7f3' }}><Video color="#ec4899" size={32} /></div>
            <h3>Crystal HD Video</h3>
            <p>Perfect for Palmistry and Face Reading. Connect face-to-face with experts on our robust video infrastructure.</p>
          </motion.div>
        </motion.div>
      </section>

      {/* 8. THE JOURNEY SECTION */}
      <section className="occult-section bg-gray">
        <div className="section-header">
          <span className="overline">YOUR JOURNEY</span>
          <h2 className="section-title">A Path to Perfect <span className="text-gradient-gold">Harmony.</span></h2>
          <p className="section-subtitle mx-auto">From ancient Sanatan wisdom to modern architectural results in three simple, guided steps.</p>
        </div>
        <motion.div className="bento-grid" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
          <motion.div className="bento-card" style={{ borderTop: '4px solid var(--primary-gold)' }} variants={fadeUp}>
            <div className="bento-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}><Compass color="var(--primary-gold)" size={32} /></div>
            <h3>1. Map Your Space</h3>
            <p>Upload your floor plan or birth details. Our high-precision tools generate your 16-zone Vastu grid or detailed Kundli in seconds.</p>
          </motion.div>
          
          <motion.div className="bento-card" style={{ borderTop: '4px solid #6366f1' }} variants={fadeUp}>
            <div className="bento-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}><Video color="#6366f1" size={32} /></div>
            <h3>2. Expert Consult</h3>
            <p>Connect instantly with verified Vastu scientists or Vedic astrologers. Get deep insights and personalized guidance via secure HD Video.</p>
          </motion.div>

          <motion.div className="bento-card" style={{ borderTop: '4px solid #10b981' }} variants={fadeUp}>
            <div className="bento-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}><Sparkles color="#10b981" size={32} /></div>
            <h3>3. Balance & Heal</h3>
            <p>Receive certified remedies and implementation logs. Track the positive energy shifts in your life through your personal dashboard.</p>
          </motion.div>
        </motion.div>
      </section>
      {/* 9. WHY TRUST US SECTION */}
      <section className="occult-section bg-gray">
        <div className="section-header">
          <span className="overline">OUR STANDARDS</span>
          <h2 className="section-title">Why Thousands Trust <span className="text-gradient-gold">Our Gurukul.</span></h2>
          <p className="section-subtitle mx-auto">We don't just connect you with experts; we curate an ecosystem of excellence and integrity.</p>
        </div>
        <div className="features-grid-pro">
           <motion.div className="feature-pro-card" variants={fadeUp}>
              <div className="feature-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                <BadgeCheck size={32} />
              </div>
              <h3>Elite Expert Vetting</h3>
              <p>Only consultants with verified lineage and deep Gurukul training are allowed on our platform. We vet for wisdom, not just popularity.</p>
           </motion.div>

           <motion.div className="feature-pro-card" variants={fadeUp}>
              <div className="feature-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <BrainCircuit size={32} />
              </div>
              <h3>Practical Remedies</h3>
              <p>We bridge the gap between ancient Shastras and modern lifestyle. Our experts provide remedies that are easy to implement in today's homes.</p>
           </motion.div>

           <motion.div className="feature-pro-card" variants={fadeUp}>
              <div className="feature-icon-wrapper" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                <ShieldCheck size={32} />
              </div>
              <h3>Uncompromising Privacy</h3>
              <p>Your spiritual journey is personal. Our VoIP-masked calls and AES-encrypted chats ensure your identity and details never leak.</p>
           </motion.div>
        </div>
      </section>      {/* 10. CATEGORIES SECTION */}
      <section className="occult-section bg-dark">
        <div className="section-header">
          <span className="overline">SPECIALIZATIONS</span>
          <h2 className="section-title" style={{ color: '#ffffff' }}>Explore Our Core <span className="text-gradient-gold">Domains.</span></h2>
          <p className="section-subtitle mx-auto" style={{ color: 'rgba(255,255,255,0.6)' }}>From destinies to dwellings, find the right mentor for your specific life purpose.</p>
        </div>
        <div className="bento-grid">
           <motion.div className="bento-card" variants={fadeUp} onClick={() => navigate('/occult/experts?cat=astrology')} style={{ cursor: 'pointer' }}>
              <div className="bento-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}><Moon size={32} color="var(--primary-gold)" /></div>
              <h3>Vedic Astrology</h3>
              <p>Decode your birth chart and planetary cycles with authentic Gurukul lineages.</p>
           </motion.div>
           <motion.div className="bento-card" variants={fadeUp} onClick={() => navigate('/occult/experts?cat=vastu')} style={{ cursor: 'pointer' }}>
              <div className="bento-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}><Compass size={32} color="#3b82f6" /></div>
              <h3>Vastu Shastra</h3>
              <p>Harmonize your living and workspaces using precise 16-zone energy mapping.</p>
           </motion.div>
           <motion.div className="bento-card" variants={fadeUp} onClick={() => navigate('/occult/experts?cat=numerology')} style={{ cursor: 'pointer' }}>
              <div className="bento-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}><BrainCircuit size={32} color="#10b981" /></div>
              <h3>Numerology</h3>
              <p>Leverage the vibrational power of your name and numbers for abundance.</p>
           </motion.div>
           <motion.div className="bento-card" variants={fadeUp} onClick={() => navigate('/occult/experts?cat=tarot')} style={{ cursor: 'pointer' }}>
              <div className="bento-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}><ScrollText size={32} color="#6366f1" /></div>
              <h3>Tarot Reading</h3>
              <p>Gain clarity on your present and future through intuitive symbolic guidance.</p>
           </motion.div>
           <motion.div className="bento-card" variants={fadeUp} onClick={() => navigate('/occult/experts?cat=palmistry')} style={{ cursor: 'pointer' }}>
              <div className="bento-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}><BadgeCheck size={32} color="#f59e0b" /></div>
              <h3>Palmistry</h3>
              <p>Understand your life's blueprint and potential through the science of hand reading.</p>
           </motion.div>
           <motion.div className="bento-card" variants={fadeUp} onClick={() => navigate('/occult/experts?cat=gems')} style={{ cursor: 'pointer' }}>
              <div className="bento-icon" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)' }}><Sparkles size={32} color="#ec4899" /></div>
              <h3>Energy Healing</h3>
              <p>Clear aura blockages and align your chakras through spiritual coaching.</p>
           </motion.div>
        </div>
      </section>

      {/* 11. ACADEMY */}
      <section className="occult-section" id="academy">
        <div className="academy-box" style={{ background: 'var(--bg-dark)', borderRadius: '48px', padding: isMobile ? '40px 24px' : '80px' }}>
          <div className="academy-content">
            <span className="overline" style={{ color: 'var(--primary-gold)' }}>LMS PLATFORM</span>
            <h2 className="academy-title" style={{ fontSize: isMobile ? '2.5rem' : '4rem' }}>Master the <span className="text-gradient-gold">Academy.</span></h2>
            <p className="academy-text">Learn the ancient sciences from top platform experts via high-definition courses. Upskill and get certified.</p>
            <button className="main-btn" onClick={() => navigate('/occult/shop')}>Explore Courses <Play size={18} /></button>
          </div>
          {!isMobile && (
            <div className="academy-visual">
              <div className="mockup-card" style={{ background: '#fff', padding: '32px', borderRadius: '32px', transform: 'rotate(5deg)', boxShadow: '0 30px 60px rgba(0,0,0,0.3)' }}>
                <div style={{ width: '40px', height: '8px', background: '#e2e8f0', borderRadius: '4px', marginBottom: '20px' }}></div>
                <div style={{ width: '240px', height: '140px', background: '#f1f5f9', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <Play size={48} color="var(--primary-gold)" />
                </div>
                <div style={{ width: '180px', height: '12px', background: '#e2e8f0', borderRadius: '4px', marginBottom: '12px' }}></div>
                <div style={{ width: '100px', height: '12px', background: '#e2e8f0', borderRadius: '4px' }}></div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 12. CTA */}
      <section className="occult-section cta-section" style={{ background: 'var(--bg-darker)', color: '#fff', textAlign: 'center' }}>
        <div className="cta-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 style={{ fontSize: isMobile ? '2.5rem' : '4rem', fontWeight: 950, marginBottom: '24px' }}>Ready to decode the universe?</h2>
            <p style={{ fontSize: '1.25rem', opacity: 0.7, marginBottom: '48px' }}>Join thousands of seekers and guides already on the platform. Start your journey today.</p>
            <div className="hero-btns" style={{ justifyContent: 'center' }}>
              <button className="main-btn" onClick={() => navigate('/occult/register')}>Join as Expert</button>
              <button className="outline-btn" style={{ borderColor: 'rgba(255,255,255,0.2)' }} onClick={() => navigate('/occult/register')}>Join as User</button>
            </div>
          </motion.div>
        </div>
      </section>

      <OccultFooter />
    </div>
  );
}
