import React, { useState, useEffect } from 'react';
import { 
    Box, Typography, Paper, Grid, CircularProgress, 
    Button, Card, CardContent, Chip, Avatar,
    IconButton, TextField, InputAdornment
} from '@mui/material';
import Divider from '@mui/material/Divider';
import { LayoutDashboard, Search, FileText, Calendar, User, ArrowRight } from 'lucide-react';
import MarketplaceSidebar from '../../components/MarketplaceSidebar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function UserReports() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const storedUser = localStorage.getItem('occult_user');
        if (!storedUser) {
            navigate('/occult/login');
        } else {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchUserReports(parsedUser);
        }
    }, [navigate]);

    const fetchUserReports = async (currentUser) => {
        try {
            // Fetch using user's email which comprehensively checks follower_id and project email
            const resp = await axios.get(`/api/projects.php?email=${encodeURIComponent(currentUser.email)}`);
            // Note: projects.php returns {status: 'success', data: [...], total: X}
            if (resp.data.status === 'success') {
                setProjects(resp.data.data);
            }
        } catch (err) {
            console.error('Error fetching reports:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = projects.filter(p => 
        p.project_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress color="warning" />
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <MarketplaceSidebar user={user} role="user" />

            <Box sx={{ flex: 1, p: { xs: 2, md: 4, lg: 6 }, pt: { xs: 10, md: 4 } }}>
                <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={900} sx={{ display: 'flex', alignItems: 'center', gap: 2, color: '#1e293b' }}>
                            <LayoutDashboard size={32} color="#f59e0b" />
                            Vastu Analysis Reports
                        </Typography>
                        <Typography color="textSecondary">View maps and remedies shared by your Vastu experts.</Typography>
                    </Box>
                </Box>

                <Paper sx={{ p: 0, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'transparent', boxShadow: 'none' }}>
                    <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                        <TextField
                            placeholder="Search projects..."
                            size="small"
                            fullWidth
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search size={18} color="#64748b" />
                                    </InputAdornment>
                                ),
                                sx: { borderRadius: 3, bgcolor: '#fff' }
                            }}
                        />
                    </Box>

                    {filteredProjects.length === 0 ? (
                        <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 4, bgcolor: '#fff', border: '1px solid #e2e8f0' }}>
                            <FileText size={64} color="#CBD5E1" style={{ marginBottom: 16 }} />
                            <Typography variant="h6" fontWeight={700} color="#64748b">No Reports Found</Typography>
                            <Typography variant="body2" color="textSecondary">When an expert assigns a Vastu analysis to you, it will appear here.</Typography>
                        </Paper>
                    ) : (
                        <Grid container spacing={3}>
                            {filteredProjects.map((project) => (
                                <Grid item xs={12} md={6} lg={4} key={project.id}>
                                    <Card sx={{ 
                                        borderRadius: 4, 
                                        border: '1px solid #e2e8f0', 
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                                        '&:hover': { boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', borderColor: '#f59e0b20' },
                                        transition: 'all 0.2s'
                                    }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                <Chip 
                                                    label={project.property_type || 'Residential'} 
                                                    size="small" 
                                                    sx={{ bgcolor: '#f1f5f9', fontWeight: 800, color: '#475569', borderRadius: 1.5 }} 
                                                />
                                                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Calendar size={12} />
                                                    {new Date(project.created_at).toLocaleDateString()}
                                                </Typography>
                                            </Box>

                                            <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a', mb: 1, lineClamp: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                                                {project.project_name}
                                            </Typography>
                                            
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                                <Avatar sx={{ width: 20, height: 20, fontSize: '0.65rem', bgcolor: '#f59e0b' }}>E</Avatar>
                                                <Typography variant="caption" fontWeight={700} color="textSecondary">
                                                    Expert Analysis
                                                </Typography>
                                            </Box>

                                            <Divider sx={{ mb: 2, opacity: 0.5 }} />

                                            <Box sx={{ mb: 3 }}>
                                                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Issue Addressed</Typography>
                                                <Typography variant="body2" fontWeight={600} sx={{ color: '#475569', mt: 0.5 }}>
                                                    {project.project_issue || 'General Maintenance'}
                                                </Typography>
                                            </Box>

                                            <Box sx={{ display: 'flex', gap: 1.5 }}>
                                                <Button 
                                                    fullWidth 
                                                    variant="contained" 
                                                    onClick={() => navigate(`/occult/report/${project.id}`)}
                                                    sx={{ 
                                                        bgcolor: '#0f172a', 
                                                        color: '#fff',
                                                        borderRadius: 3,
                                                        py: 1,
                                                        textTransform: 'none',
                                                        fontWeight: 800,
                                                        '&:hover': { bgcolor: '#1e293b' }
                                                    }}
                                                >
                                                    Preview
                                                </Button>
                                                <Button 
                                                    fullWidth 
                                                    variant="outlined" 
                                                    onClick={() => navigate(`/occult/report/${project.id}?download=true`)}
                                                    sx={{ 
                                                        borderColor: '#e2e8f0',
                                                        color: '#475569',
                                                        borderRadius: 3,
                                                        py: 1,
                                                        textTransform: 'none',
                                                        fontWeight: 800,
                                                        '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' }
                                                    }}
                                                >
                                                    Download
                                                </Button>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Paper>
            </Box>
        </Box>
    );
}
