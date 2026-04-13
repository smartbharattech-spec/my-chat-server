import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Container, 
    Typography, 
    Grid, 
    Paper, 
    Button, 
    List, 
    ListItem, 
    ListItemText, 
    ListItemIcon,
    Divider,
    Avatar,
    Chip,
    CircularProgress,
    Breadcrumbs,
    Link,
    IconButton,
    Tabs,
    Tab
} from "@mui/material";
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    PlayCircle, 
    ShieldCheck, 
    Clock, 
    Monitor, 
    ChevronRight,
    Star,
    Award,
    CheckCircle2,
    ShoppingCart,
    ShoppingBag,
    Share2,
    Info,
    MessageSquare,
    Layers,
    Play
} from 'lucide-react';
import OccultNavbar from "../../components/OccultNavbar";
import OccultFooter from "../../components/OccultFooter";
import courseService from '../../services/courseService';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../services/ToastService';
import { useAuth } from '../../services/AuthService';
import './CourseDetail.css';

export default function CourseDetail() {
    const { productId: courseId } = useParams();
    const navigate = useNavigate();
    const { addToCart, setIsCartOpen } = useCart();
    const { showToast } = useToast();
    const { user } = useAuth();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        fetchCourse();
        window.scrollTo(0, 0);
    }, [courseId]);

    const fetchCourse = async () => {
        setLoading(true);
        try {
            const res = await courseService.getCourseById(courseId);
            if (res.status === 'success') {
                setCourse(res.data);
            }
        } catch (error) {
            console.error("Error fetching course", error);
            showToast('course_error', 'Failed to load course details', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = () => {
        if (!user) {
            showToast('login_required', 'Please login to add courses to your cart', 'warning');
            navigate('/occult/login');
            return;
        }
        if (!course) return;

        // Map course data to product structure for Cart
        const productForCart = {
            ...course,
            name: course.title,
            image_url: course.thumbnail,
            price: course.price,
            product_type: 'course'
        };

        const expert = {
            id: course.expert_id,
            name: course.expert_name || "Academy Expert"
        };

        addToCart(productForCart, expert, {});
        showToast('cart_added', 'Course added to cart!', 'success');
        setIsCartOpen(true);
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f8fafc' }}>
            <CircularProgress sx={{ color: '#f59e0b' }} />
        </Box>
    );

    if (!course) return (
        <div className="course-detail-wrapper">
            <OccultNavbar />
            <Box sx={{ py: 20, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={900} sx={{ color: '#0f172a' }}>Course Not Found</Typography>
                <Button 
                    variant="contained"
                    onClick={() => navigate('/occult/shop')} 
                    sx={{ mt: 3, bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' }, borderRadius: '12px', fontWeight: 800 }}
                >
                    Back to Shop
                </Button>
            </Box>
            <OccultFooter />
        </div>
    );

    return (
        <div className="course-detail-wrapper">
            <OccultNavbar />
            
            <div className="course-custom-container">
                {/* Breadcrumbs */}
                <div className="course-breadcrumbs">
                    <Breadcrumbs separator={<ChevronRight size={14} />} sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        <Link underline="hover" color="inherit" onClick={() => navigate('/occult')} sx={{ cursor: 'pointer' }}>
                            Marketplace
                        </Link>
                        <Link underline="hover" color="inherit" onClick={() => navigate('/occult/shop')} sx={{ cursor: 'pointer' }}>
                            Courses
                        </Link>
                        <Typography color="text.primary" sx={{ fontWeight: 800, fontSize: '0.85rem' }}>{course.title}</Typography>
                    </Breadcrumbs>
                </div>

                <div className="course-main-layout">
                    {/* Left: Media */}
                    <div className="course-media-section">
                        <motion.div 
                            className="course-main-thumbnail"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <img 
                                src={course.thumbnail || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=600"} 
                                alt={course.title}
                                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=600"; }}
                            />
                            <div className="play-overlay">
                                <IconButton sx={{ bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: '#fff', p: 3 }}>
                                    <PlayCircle size={48} fill="#f59e0b" color="#f59e0b" />
                                </IconButton>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right: Details */}
                    <div className="course-info-section">
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <Chip 
                                icon={<Layers size={14} />}
                                label="Educational Course"
                                size="small"
                                sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#b45309', fontWeight: 900, mb: 3 }}
                            />
                            
                            <h1 className="course-title-primary">{course.title}</h1>
                            
                            <div className="course-rating-box">
                                <div className="stars">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={i < 4 ? "#f59e0b" : "none"} color="#f59e0b" />)}
                                </div>
                                <span className="rating-text">4.8 (120 Enrollments)</span>
                            </div>

                            <div className="course-price-box">
                                <span className="currency">₹</span>
                                <span className="amount">{course.price}</span>
                                <span className="label">Lifetime Access</span>
                            </div>

                            <p className="course-short-desc">{course.description}</p>

                            <div className="course-actions-group">
                                <Button 
                                    variant="contained" 
                                    fullWidth
                                    startIcon={<ShoppingCart size={20} />}
                                    onClick={handleAddToCart}
                                    sx={{ 
                                        bgcolor: '#f59e0b', 
                                        '&:hover': { bgcolor: '#d97706', transform: 'translateY(-3px)' },
                                        borderRadius: '16px',
                                        py: 2,
                                        fontWeight: 900,
                                        fontSize: '1.1rem',
                                        boxShadow: '0 10px 20px rgba(245, 158, 11, 0.3)',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    Add to Cart
                                </Button>
                            </div>

                            <div className="course-trust-badges">
                                <div className="badge-item">
                                    <ShieldCheck size={18} />
                                    <span>Verified Content</span>
                                </div>
                                <div className="badge-item">
                                    <Clock size={18} />
                                    <span>Self-Paced</span>
                                </div>
                                <div className="badge-item">
                                    <Award size={18} />
                                    <span>Certification</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Bottom: Tabs */}
                <div className="course-bottom-section">
                    <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: '1px solid #e2e8f0', '& .MuiTab-root': { fontWeight: 800, px: { xs: 2, md: 5 } } }}>
                        <Tab label="Curriculum" />
                        <Tab label="Description" />
                        <Tab label="Expert" />
                    </Tabs>

                    <div className="course-tab-content">
                        {tabValue === 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                {course.curriculum && course.curriculum.length > 0 ? (
                                    <div className="curriculum-stack">
                                        {course.curriculum.map((topic, idx) => (
                                            <div key={topic.id} className="curriculum-topic-card">
                                                <div className="topic-header">
                                                    <span className="topic-num">Section {idx+1}</span>
                                                    <h3>{topic.title}</h3>
                                                    <Chip label={`${topic.lessons?.length || 0} Lessons`} size="small" />
                                                </div>
                                                <div className="lessons-list">
                                                    {topic.lessons?.map((lesson) => (
                                                        <div key={lesson.id} className="lesson-row">
                                                            <PlayCircle size={18} color="#f59e0b" />
                                                            <span>{lesson.title}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-curriculum">Curriculum details are being finalized...</div>
                                )}
                            </motion.div>
                        )}
                        {tabValue === 1 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="course-full-desc">
                                <Typography variant="h6" fontWeight={800} gutterBottom>Course Overview</Typography>
                                <Typography sx={{ color: '#475569', lineHeight: 1.8 }}>{course.description}</Typography>
                            </motion.div>
                        )}
                        {tabValue === 2 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="course-expert-card">
                                <Avatar 
                                    src={course.expert_profile_image ? `/${course.expert_profile_image}` : null} 
                                    sx={{ width: 80, height: 80, mb: 2, border: '2px solid #f59e0b' }} 
                                />
                                <Typography variant="h5" fontWeight={900}>{course.expert_name || "Academy Expert"}</Typography>
                                <Typography color="textSecondary" sx={{ fontWeight: 700, mb: 2 }}>Certified Lead Instructor</Typography>
                                <Button 
                                    variant="outlined" 
                                    onClick={() => navigate(`/@${course.expert_slug}`)}
                                    sx={{ borderRadius: '12px', borderColor: '#f59e0b', color: '#f59e0b', fontWeight: 800 }}
                                >
                                    View Expert Profile
                                </Button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            <OccultFooter />
        </div>
    );
}
