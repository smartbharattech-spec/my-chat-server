import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Container, 
    Typography, 
    Grid, 
    Card, 
    CardMedia, 
    CardContent, 
    Button, 
    Chip, 
    Skeleton,
    TextField,
    InputAdornment
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { useNavigate } from 'react-router-dom';
import Header from "../../components/OccultNavbar";
import Footer from "../../components/OccultFooter";
import courseService from '../../services/courseService';

export default function AllCourses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const res = await courseService.getCourses();
            if (res.status === 'success') {
                setCourses(res.data);
            }
        } catch (error) {
            console.error("Error fetching courses", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCourses = courses.filter(c => 
        c.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Box sx={{ bgcolor: "#F8FAFC", minHeight: "100vh" }}>
            <Header />
            <Box sx={{ 
                background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)", 
                py: 10, 
                px: 2, 
                textAlign: 'center', 
                color: 'white',
                mb: 6
            }}>
                <Typography variant="h3" sx={{ fontWeight: 900, mb: 2 }}>Unlock Your Occult Potential</Typography>
                <Typography variant="h6" sx={{ opacity: 0.8, mb: 4, maxWidth: 600, mx: 'auto' }}>
                    Master Numerology, Vastu, Astrology, and more with our expert-led video courses.
                </Typography>
                
                <Box sx={{ maxWidth: 600, mx: 'auto' }}>
                    <TextField 
                        fullWidth
                        placeholder="Search for courses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: 'white' }} />
                                    </InputAdornment>
                                ),
                                sx: { 
                                    bgcolor: 'rgba(255,255,255,0.1)', 
                                    color: 'white', 
                                    borderRadius: 3,
                                    '& fieldset': { border: 'none' },
                                    backdropFilter: 'blur(10px)'
                                }
                            }
                        }}
                    />
                </Box>
            </Box>

            <Container maxWidth="xl" sx={{ pb: 10 }}>
                <Grid container spacing={4}>
                    {loading ? (
                        [1,2,3,4].map(i => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                                <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 4, mb: 1 }} />
                                <Skeleton width="60%" />
                                <Skeleton width="40%" />
                            </Grid>
                        ))
                    ) : filteredCourses.length === 0 ? (
                        <Grid item xs={12} sx={{ textAlign: 'center', py: 10 }}>
                            <Typography variant="h5" color="text.secondary">No courses found matching your search.</Typography>
                        </Grid>
                    ) : (
                        filteredCourses.map((course) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={course.id}>
                                <Card 
                                    sx={{ 
                                        borderRadius: 5, 
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                                        transition: '0.3s transform ease',
                                        '&:hover': { transform: 'translateY(-10px)' },
                                        cursor: 'pointer',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                    onClick={() => navigate(`/occult/course/${course.id}`)}
                                >
                                    <CardMedia
                                        component="img"
                                        height="180"
                                        image={course.thumbnail || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=400"}
                                        alt={course.title}
                                        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=400"; }}
                                    />
                                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                        <Chip label="Bestseller" size="small" sx={{ bgcolor: '#FEF3C7', color: '#D97706', fontWeight: 800, mb: 1, fontSize: '0.65rem' }} />
                                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: "#1E293B", lineHeight: 1.3 }}>
                                            {course.title}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: "#64748B", mb: 2, height: 40, overflow: 'hidden' }}>
                                            {course.description}
                                        </Typography>
                                        
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                            <PlayCircleOutlineIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
                                            <Typography variant="caption" sx={{ color: "#f59e0b", fontWeight: 700 }}>Exclusive Content</Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                                            <Typography variant="h5" sx={{ fontWeight: 900, color: "#0F172A" }}>
                                                ₹{course.price}
                                            </Typography>
                                            <Button 
                                                variant="contained" 
                                                size="small"
                                                sx={{ borderRadius: 2, bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' }, textTransform: 'none', fontWeight: 700 }}
                                            >
                                                View Details
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))
                    )}
                </Grid>
            </Container>
            <Footer />
        </Box>
    );
}
