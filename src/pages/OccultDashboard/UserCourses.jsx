import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Button, Chip, CircularProgress, 
    useTheme, useMediaQuery, Card, CardMedia, CardContent, CardActions
} from '@mui/material';
import { PlayCircle, Clock, BookOpen, Star, User, Calendar, ExternalLink, CheckCircle2 } from 'lucide-react';
import { LinearProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MarketplaceSidebar from '../../components/MarketplaceSidebar';
import { useToast } from '../../services/ToastService';

export default function UserCourses() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { showToast } = useToast();
    
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('occult_user');
        if (!storedUser) {
            navigate('/occult/login');
        } else {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchMyCourses(parsedUser.id);
        }
    }, [navigate]);

    const fetchMyCourses = async (userId) => {
        try {
            const response = await fetch(`/api/get_user_courses.php?user_id=${userId}`);
            const data = await response.json();
            if (data.status === 'success') {
                setCourses(data.data);
            }
        } catch (err) {
            console.error('Error fetching courses:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress color="warning" />
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <MarketplaceSidebar user={user} role="user" />

            <Box sx={{ flex: 1, p: { xs: 2, md: 4, lg: 6 }, pt: { xs: 10, md: 4, lg: 6 }, maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                <Box sx={{ mb: 6 }}>
                    <Typography 
                        variant="h3" 
                        sx={{ 
                            fontWeight: 950, 
                            color: '#0f172a', 
                            letterSpacing: '-2px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2,
                            fontSize: { xs: '2.5rem', md: '3.5rem' }
                        }}
                    >
                        My Courses
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontWeight: 600, mt: 1 }}>Access all your purchased digital wisdom and spiritual learnings.</Typography>
                </Box>

                {courses.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 12, bgcolor: '#fff', borderRadius: 8, border: '1px dashed #e2e8f0' }}>
                        <PlayCircle size={80} color="#cbd5e1" style={{ marginBottom: 20 }} />
                        <Typography variant="h5" sx={{ color: '#64748b', fontWeight: 950 }}>No Courses Purchased</Typography>
                        <Typography sx={{ color: '#94a3b8', fontWeight: 600, mb: 4 }}>Begin your spiritual journey today by exploring our expert courses.</Typography>
                        <Button 
                            variant="contained" 
                            onClick={() => navigate('/occult/courses')}
                            sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#ea580c' }, borderRadius: 3, px: 4, py: 1.5, fontWeight: 900 }}
                        >
                            Browse Courses
                        </Button>
                    </Box>
                ) : (
                    <Grid container spacing={4}>
                        <AnimatePresence>
                            {courses.map((course, index) => (
                                <Grid item xs={12} sm={6} md={4} key={course.id}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Card 
                                            sx={{ 
                                                borderRadius: 6, 
                                                overflow: 'hidden', 
                                                border: '1px solid #f1f5f9',
                                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                                                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                                '&:hover': { 
                                                    transform: 'translateY(-10px)', 
                                                    boxShadow: '0 20px 40px -12px rgba(0,0,0,0.1)',
                                                    borderColor: '#f59e0b'
                                                }
                                            }}
                                        >
                                            <Box sx={{ position: 'relative' }}>
                                                <CardMedia
                                                    component="img"
                                                    height="220"
                                                    image={course.thumbnail || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=400"}
                                                    alt={course.title}
                                                />
                                                <Box sx={{ 
                                                    position: 'absolute', top: 16, right: 16, 
                                                    bgcolor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                                                    color: 'white', px: 2, py: 0.5, borderRadius: '100px',
                                                    fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1
                                                }}>
                                                    <Clock size={14} />
                                                    Self-Paced
                                                </Box>
                                            </Box>
                                            
                                            <CardContent sx={{ p: 4 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                                    <Chip 
                                                        label="Lifetime Access" 
                                                        size="small" 
                                                        sx={{ bgcolor: '#fff7ed', color: '#f59e0b', fontWeight: 900, borderRadius: '8px', fontSize: '0.65rem' }} 
                                                    />
                                                    {course.completed_lessons >= course.total_lessons && course.total_lessons > 0 && (
                                                        <Chip 
                                                            label="Completed" 
                                                            size="small" 
                                                            color="success"
                                                            icon={<CheckCircle2 size={14} />}
                                                            sx={{ fontWeight: 900, borderRadius: '8px', fontSize: '0.65rem' }} 
                                                        />
                                                    )}
                                                </Box>
                                                <Typography variant="h5" sx={{ fontWeight: 950, color: '#0f172a', mb: 2, height: '3.5rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                    {course.title}
                                                </Typography>

                                                <Box sx={{ mb: 3 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                        <Typography variant="caption" sx={{ fontWeight: 950, color: '#f59e0b', fontSize: '0.75rem' }}>
                                                            {Math.round((course.completed_lessons / (course.total_lessons || 1)) * 100)}% Complete
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#94A3B8' }}>
                                                            {course.completed_lessons || 0}/{course.total_lessons || 1} Lessons
                                                        </Typography>
                                                    </Box>
                                                    <LinearProgress 
                                                        variant="determinate" 
                                                        value={Math.min(100, Math.round((course.completed_lessons / (course.total_lessons || 1)) * 100))}
                                                        sx={{ 
                                                            height: 10, 
                                                            borderRadius: 5, 
                                                            bgcolor: '#f1f5f9', 
                                                            '& .MuiLinearProgress-bar': { 
                                                                bgcolor: course.completed_lessons >= course.total_lessons && course.total_lessons > 0 ? '#10b981' : '#f59e0b',
                                                                borderRadius: 5,
                                                                backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
                                                                backgroundSize: '1rem 1rem',
                                                                animation: 'progress-bar-stripes 1s linear infinite'
                                                            },
                                                            '@keyframes progress-bar-stripes': {
                                                                from: { backgroundPosition: '1rem 0' },
                                                                to: { backgroundPosition: '0 0' }
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                                
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <User size={16} color="#94a3b8" />
                                                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 700 }}>{course.expert_name}</Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <Calendar size={16} color="#94a3b8" />
                                                        <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                                                            Purchased on {new Date(course.purchase_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </CardContent>
                                            
                                            <CardActions sx={{ p: 4, pt: 0 }}>
                                                <Button 
                                                    fullWidth
                                                    variant="contained"
                                                    startIcon={course.completed_lessons >= course.total_lessons ? <CheckCircle2 size={22} /> : <PlayCircle size={22} />}
                                                    onClick={() => navigate(`/occult/learn/${course.id}`)}
                                                    sx={{ 
                                                        bgcolor: course.completed_lessons >= course.total_lessons ? '#10b981' : '#0f172a', 
                                                        color: 'white', py: 2, borderRadius: 4, fontWeight: 950, textTransform: 'none',
                                                        '&:hover': { bgcolor: course.completed_lessons >= course.total_lessons ? '#059669' : '#1e293b', transform: 'scale(1.02)' }, transition: '0.3s'
                                                    }}
                                                >
                                                    {course.completed_lessons >= course.total_lessons ? 'Completed - Watch Again' : (course.completed_lessons > 0 ? 'Continue Learning' : 'Start Learning')}
                                                </Button>
                                            </CardActions>
                                        </Card>
                                    </motion.div>
                                </Grid>
                            ))}
                        </AnimatePresence>
                    </Grid>
                )}
            </Box>
        </Box>
    );
}
