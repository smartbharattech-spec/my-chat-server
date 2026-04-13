import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    IconButton, 
    List, 
    ListItem, 
    ListItemText, 
    ListItemIcon,
    Divider,
    Paper,
    Drawer,
    useMediaQuery,
    useTheme,
    CircularProgress,
    Button,
    LinearProgress
} from "@mui/material";
import { useParams, useNavigate } from 'react-router-dom';
import Header from "../../components/OccultNavbar";
import PlayLessonIcon from '@mui/icons-material/PlayLesson';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';

import { useToast } from '../../services/ToastService';
import courseService from '../../services/courseService';

export default function CoursePlayer() {
    const { id: courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(true);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [progress, setProgress] = useState([]); // List of completed lesson IDs
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchCourseContent();
        const handleContextMenu = (e) => e.preventDefault();
        document.addEventListener('contextmenu', handleContextMenu);
        return () => document.removeEventListener('contextmenu', handleContextMenu);
    }, [courseId]);

    const fetchCourseContent = async () => {
        const stored = localStorage.getItem('occult_user');
        if (!stored) { navigate('/occult/login'); return; }
        const userData = JSON.parse(stored);
        setUser(userData);

        setLoading(true);
        try {
            const accessRes = await fetch(`/api/check_course_access.php?user_id=${userData.id}&course_id=${courseId}`);
            const accessData = await accessRes.json();
            
            if (!accessData.access) {
                showToast("Please purchase the course to access the content.", "warning");
                navigate(`/occult/course/${courseId}`);
                return;
            }

            const res = await courseService.getCourseById(courseId);
            if (res.status === 'success') {
                setCourse(res.data);
                
                // Fetch progress
                const progRes = await fetch(`/api/get_user_courses.php?user_id=${userData.id}`);
                const progData = await progRes.json();
                if (progData.status === 'success') {
                    // Find this specific course in the data
                    const thisCourse = progData.data.find(c => c.id == courseId);
                    if (thisCourse) {
                    // For detailed progress, we'll need a specific endpoint or assume the user courses returns a list
                    // Let's create a dedicated progress fetcher for accuracy
                    fetchDetailedProgress(userData.id, courseId);
                    }
                }

                if (res.data.curriculum && res.data.curriculum[0]?.lessons[0]) {
                    setCurrentLesson(res.data.curriculum[0].lessons[0]);
                }
            } else {
                console.error("Course load failed:", res.message);
            }
        } catch (error) {
            console.error("Error fetching course", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDetailedProgress = async (userId, cId) => {
        try {
            const res = await fetch(`/api/get_course_progress.php?user_id=${userId}&course_id=${cId}`);
            const data = await res.json();
            if (data.status === 'success') {
                setProgress(data.completed_lessons.map(l => l.lesson_id));
            }
        } catch (e) { console.error(e); }
    };

    const markLessonComplete = async (lessonId) => {
        if (!user || progress.includes(lessonId)) return;
        
        try {
            const res = await fetch('/api/update_course_progress.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, course_id: courseId, lesson_id: lessonId })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setProgress([...progress, lessonId]);
                showToast("Lesson marked as completed!", "success");
            }
        } catch (e) { console.error(e); }
    };

    const getAllLessons = () => {
        if (!course || !course.curriculum) return [];
        return course.curriculum.flatMap(topic => topic.lessons);
    };

    const playNextLesson = () => {
        const allLessons = getAllLessons();
        const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id);
        if (currentIndex < allLessons.length - 1) {
            setCurrentLesson(allLessons[currentIndex + 1]);
        } else {
            showToast("You've reached the end of the course!", "info");
        }
    };

    const playPreviousLesson = () => {
        const allLessons = getAllLessons();
        const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id);
        if (currentIndex > 0) {
            setCurrentLesson(allLessons[currentIndex - 1]);
        }
    };

    const isYouTube = (url) => {
        if (!url) return false;
        return url.includes('youtube.com') || url.includes('youtu.be');
    }

    const getYouTubeEmbed = (url) => {
        if (!url) return "";
        let id = "";
        if (url.includes('v=')) id = url.split('v=')[1].split('&')[0];
        else if (url.includes('be/')) id = url.split('be/')[1].split('?')[0];
        return `https://www.youtube.com/embed/${id}?modestbranding=1&rel=0&showinfo=0`;
    }

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress sx={{ color: '#f59e0b' }} />
        </Box>
    );

    if (!course) return <Typography>Access Denied or Course Not Found</Typography>;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#F1F5F9' }}>
            {/* 🔸 MINI HEADER */}
            <Paper elevation={0} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, zIndex: 1200, borderBottom: '1px solid #E2E8F0' }}>
                <IconButton onClick={() => navigate(-1)}><ChevronLeftIcon /></IconButton>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', flexGrow: 1 }}>{course.title}</Typography>
                <IconButton onClick={() => setDrawerOpen(!drawerOpen)} sx={{ display: { md: 'none' } }}>
                    <MenuIcon />
                </IconButton>
            </Paper>

            <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                {/* 🔸 MAIN CONTENT AREA */}
                <Box sx={{ flexGrow: 1, p: { xs: 0, md: 4 }, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    {currentLesson ? (
                        <Box sx={{ maxWidth: 1000, mx: 'auto', width: '100%' }}>
                            <Paper sx={{ borderRadius: { xs: 0, md: 4 }, overflow: 'hidden', bgcolor: 'black', mb: 3, position: 'relative', pt: isYouTube(currentLesson.video_url) ? '56.25%' : 0 }}>
                                {isYouTube(currentLesson.video_url) ? (
                                    <iframe 
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                        src={getYouTubeEmbed(currentLesson.video_url)}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                ) : (
                                    <video 
                                        key={currentLesson.id}
                                        controls 
                                        controlsList="nodownload" 
                                        disablePictureInPicture
                                        onEnded={() => markLessonComplete(currentLesson.id)}
                                        style={{ width: '100%', maxHeight: '600px', display: 'block' }}
                                    >
                                        <source src={currentLesson.video_url || `/api/uploads/${currentLesson.video_filename}`} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                )}
                            </Paper>
                            
                            <Box sx={{ mb: 4 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 900, color: progress.length >= (course?.total_lessons || 1) ? '#10b981' : '#64748B' }}>
                                        {progress.length >= (course?.total_lessons || 1) ? '🎉 Course Completed!' : `Course Progress: ${Math.round((progress.length / (course?.total_lessons || 1)) * 100)}%`}
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8' }}>
                                        {progress.length} of {course?.total_lessons || 0} lessons completed
                                    </Typography>
                                </Box>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={(progress.length / (course?.total_lessons || 1)) * 100} 
                                    sx={{ 
                                        height: 12, 
                                        borderRadius: 6, 
                                        bgcolor: '#E2E8F0', 
                                        '& .MuiLinearProgress-bar': { 
                                            bgcolor: '#f59e0b', 
                                            borderRadius: 6,
                                            backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
                                            backgroundSize: '1rem 1rem'
                                        } 
                                    }}
                                />
                            </Box>
                            
                            <Box sx={{ px: 2, pb: 4 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 3 }}>
                                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F172A' }}>{currentLesson.title}</Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={progress.includes(currentLesson.id) ? <CheckCircleIcon /> : <PlayLessonIcon />}
                                        onClick={() => markLessonComplete(currentLesson.id)}
                                        disabled={progress.includes(currentLesson.id)}
                                        sx={{ 
                                            bgcolor: progress.includes(currentLesson.id) ? '#10b981' : '#f59e0b',
                                            '&:hover': { bgcolor: progress.includes(currentLesson.id) ? '#059669' : '#ea580c' },
                                            borderRadius: 3, px: 3, fontWeight: 800, textTransform: 'none'
                                        }}
                                    >
                                        {progress.includes(currentLesson.id) ? 'Completed' : 'Mark as Completed'}
                                    </Button>
                                </Box>

                                <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                                    <Button 
                                        variant="outlined"
                                        onClick={playPreviousLesson}
                                        sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700, borderColor: '#cbd5e1', color: '#64748b' }}
                                    >
                                        Previous Lesson
                                    </Button>
                                    <Button 
                                        variant="outlined"
                                        onClick={playNextLesson}
                                        sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700, borderColor: '#f59e0b', color: '#f59e0b' }}
                                    >
                                        Next Lesson
                                    </Button>
                                </Box>
                                <Divider sx={{ my: 3 }} />
                                
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Resources</Typography>
                                {currentLesson.pdf_filename && (
                                    <Button 
                                        variant="outlined" 
                                        startIcon={<PictureAsPdfIcon />}
                                        onClick={() => window.open(`/api/uploads/${currentLesson.pdf_filename}`, '_blank')}
                                        sx={{ textTransform: 'none', borderRadius: 2, color: '#f59e0b', borderColor: '#f59e0b', '&:hover': { borderColor: '#d97706', bgcolor: 'rgba(245, 158, 11, 0.05)' } }}
                                    >
                                        Read PDF Resource (Protected)
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <Typography>Select a lesson to start learning</Typography>
                        </Box>
                    )}
                </Box>

                {/* 🔸 SIDEBAR DRAWER */}
                <Drawer
                    variant={isMobile ? "temporary" : "persistent"}
                    anchor="right"
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    PaperProps={{ 
                        sx: { 
                            width: { xs: '100%', md: 350 }, 
                            borderLeft: '1px solid #E2E8F0',

                            bgcolor: 'white',
                            position: 'relative',
                            height: '100%'
                        } 
                    }}
                >
                    <Box sx={{ p: 3, bgcolor: '#FFFBEB', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                            <Typography sx={{ fontWeight: 900, color: '#f59e0b' }}>Course Content</Typography>
                            <Typography variant="caption" color="text.secondary">Expert Curated Modules</Typography>
                        </Box>
                        <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: '#f59e0b', mt: -1, mr: -1 }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <Divider />
                    <Box sx={{ overflowY: 'auto' }}>
                        {course.curriculum && course.curriculum.map((topic, tIdx) => (
                            <Box key={topic.id}>
                                <Box sx={{ px: 3, py: 2, bgcolor: '#F8FAFC' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', display: 'block', mb: 0.5 }}>
                                        SECTION {tIdx + 1}
                                    </Typography>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#334155' }}>
                                        {topic.title}
                                    </Typography>
                                </Box>
                                <List sx={{ p: 0 }}>
                                    {topic.lessons.map((lesson) => (
                                        <ListItem 
                                            key={lesson.id} 
                                            button 
                                            onClick={() => {
                                                setCurrentLesson(lesson);
                                                if (isMobile) setDrawerOpen(false);
                                            }}
                                            sx={{ 
                                                borderBottom: '1px solid #F8FAFC',
                                                bgcolor: currentLesson?.id === lesson.id ? '#FFFBEB' : 'transparent',
                                                '&:hover': { bgcolor: '#FFFBEB' }
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                {progress.includes(lesson.id) ? (
                                                    <CheckCircleIcon sx={{ color: '#10b981', fontSize: 20 }} />
                                                ) : currentLesson?.id === lesson.id ? (
                                                    <PlayLessonIcon sx={{ color: '#f59e0b' }} />
                                                ) : (
                                                    <OndemandVideoIcon sx={{ fontSize: 20 }} />
                                                )}
                                            </ListItemIcon>
                                            <ListItemText 
                                                primary={lesson.title} 
                                                primaryTypographyProps={{ 
                                                    fontSize: '0.85rem', 
                                                    fontWeight: currentLesson?.id === lesson.id ? 800 : 500,
                                                    color: currentLesson?.id === lesson.id ? '#f59e0b' : '#475569'
                                                }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        ))}
                    </Box>
                </Drawer>
            </Box>
        </Box>
    );
}
