import {
    Box,
    Typography,
    Container,
    Paper,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    AppBar,
    Toolbar,
    Card,
    CardContent,
    Avatar,
    LinearProgress,
    useMediaQuery,
    useTheme
} from "@mui/material";
import Divider from '@mui/material/Divider';
import { useEffect, useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupsIcon from "@mui/icons-material/Groups";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import AdminSidebar from "../components/AdminSidebar";
import { useToast } from "../services/ToastService";

export default function AdminRemedyAnalytics() {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    const [stats, setStats] = useState({ remedy_stats: [], user_outcomes: [], remedy_sentiment: [] });
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(isDesktop);
    const { showToast } = useToast();

    useEffect(() => {
        setDrawerOpen(isDesktop);
    }, [isDesktop]);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch("/api/admin_analytics.php?action=analytics");
            const data = await res.json();
            if (data.status === "success") setStats(data);
        } catch (e) {
            showToast("Failed to fetch analytics", "error");
        } finally {
            setLoading(false);
        }
    };

    const totalProfit = stats.user_outcomes.reduce((acc, curr) => acc + parseFloat(curr.profit_earned || 0), 0);
    const avgBenefit = stats.user_outcomes.length > 0
        ? (stats.user_outcomes.reduce((acc, curr) => acc + parseInt(curr.benefit_percentage || 0), 0) / stats.user_outcomes.length).toFixed(1)
        : 0;

    return (
        <Box sx={{ display: 'flex', minHeight: "100vh", backgroundColor: "#fffbf7" }}>
            <AdminSidebar open={drawerOpen} onClose={() => setDrawerOpen(!drawerOpen)} isDesktop={isDesktop} />

            <Box sx={{ flexGrow: 1, width: { md: `calc(100% - ${drawerOpen ? 260 : 80}px)` }, transition: 'width 0.3s' }}>
                <AppBar position="sticky" elevation={0} sx={{ backgroundColor: "#fff", color: '#431407', borderBottom: '1px solid #ffedd5' }}>
                    <Toolbar>
                        <IconButton color="inherit" onClick={() => setDrawerOpen(!drawerOpen)} sx={{ mr: 2 }}><MenuIcon /></IconButton>
                        <Typography variant="h6" fontWeight={800} sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>Remedy ROI & Profit Analytics</Typography>
                    </Toolbar>
                </AppBar>

                <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
                    {/* Summary Cards */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Card sx={{ borderRadius: 4, bgcolor: '#f0fdf4', border: '1px solid #dcfce7' }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{ bgcolor: '#16a34a', width: 56, height: 56 }}><MonetizationOnIcon fontSize="large" /></Avatar>
                                    <Box>
                                        <Typography variant="caption" fontWeight={700} color="#166534">TOTAL USER PROFIT</Typography>
                                        <Typography variant="h4" fontWeight={900} color="#14532d">₹{totalProfit.toLocaleString()}</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Card sx={{ borderRadius: 4, bgcolor: '#eff6ff', border: '1px solid #dbeafe' }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{ bgcolor: '#2563eb', width: 56, height: 56 }}><TrendingUpIcon fontSize="large" /></Avatar>
                                    <Box>
                                        <Typography variant="caption" fontWeight={700} color="#1e40af">AVG. BENEFIT REPORTED</Typography>
                                        <Typography variant="h4" fontWeight={900} color="#1e3a8a">{avgBenefit}%</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Card sx={{ borderRadius: 4, bgcolor: '#fff7ed', border: '1px solid #ffedd5' }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{ bgcolor: '#f97316', width: 56, height: 56 }}><GroupsIcon fontSize="large" /></Avatar>
                                    <Box>
                                        <Typography variant="caption" fontWeight={700} color="#9a3412">ACTIVE TRACKING USERS</Typography>
                                        <Typography variant="h4" fontWeight={900} color="#7c2d12">{stats.user_outcomes.length}</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    <Grid container spacing={4}>
                        {/* Remedy Ranking */}
                        <Grid size={{ xs: 12, lg: 5 }}>
                            <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #ffedd5' }}>
                                <Typography variant="h6" fontWeight={800} gutterBottom color="#431407">Remedy Effectiveness Ranking</Typography>
                                <Divider sx={{ mb: 2 }} />
                                <TableContainer sx={{ overflowX: 'auto' }}>
                                    <Table size="small" sx={{ minWidth: 400 }}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 800 }}>Remedy</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>Impact (%)</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>Total Profit</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {stats.remedy_stats.map((s, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell sx={{ fontWeight: 700 }}>{s.remedy_name}</TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <LinearProgress variant="determinate" value={s.avg_benefit} sx={{ flexGrow: 1, height: 6, borderRadius: 3 }} />
                                                            <Typography variant="caption" fontWeight={700}>{s.avg_benefit}%</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 800, color: '#16a34a' }}>₹{parseFloat(s.total_profit).toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </Grid>

                        {/* Detailed User Outcomes */}
                        <Grid size={{ xs: 12, lg: 7 }}>
                            <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #ffedd5' }}>
                                <Typography variant="h6" fontWeight={800} gutterBottom color="#431407">Detailed User Outcome Reports</Typography>
                                <Divider sx={{ mb: 2 }} />
                                <TableContainer sx={{ maxHeight: 500, overflowX: 'auto' }}>
                                    <Table stickyHeader sx={{ minWidth: 700 }}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 800 }}>User / Project</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>Applied Remedy</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>Outcome</TableCell>
                                                <TableCell sx={{ fontWeight: 800 }}>Profit (₹)</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {stats.user_outcomes.map((u, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={800}>{u.firstname || u.email}</Typography>
                                                        <Typography variant="caption" color="textSecondary">{u.project_name}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={700}>{u.remedy_name}</Typography>
                                                        <Typography variant="caption">{new Date(u.created_at).toLocaleDateString()}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ p: 1, bgcolor: '#f8fafc', borderRadius: 1 }}>
                                                            <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic' }}>"{u.user_notes || 'No notes'}"</Typography>
                                                            <Typography variant="caption" fontWeight={900} color="primary">{u.benefit_percentage}% Improvement</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 900, color: '#16a34a' }}>₹{parseFloat(u.profit_earned).toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* NEW: Review Sentiment & Analysis Table */}
                    <Box sx={{ mt: 4 }}>
                        <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #ffedd5' }}>
                            <Typography variant="h6" fontWeight={800} gutterBottom color="#431407">Remedy Success Rate (Based on User Reviews)</Typography>
                            <Typography variant="caption" sx={{ color: '#9a3412', mb: 2, display: 'block' }}>Analysis of positive vs negative feedback per remedy category.</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <TableContainer sx={{ overflowX: 'auto' }}>
                                <Table sx={{ minWidth: 600 }}>
                                    <TableHead sx={{ bgcolor: '#fffbf7' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800 }}>Remedy Component</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Total Reviews</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Positive Results</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Negative Results</TableCell>
                                            <TableCell sx={{ fontWeight: 800 }}>Success Ratio</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {stats.remedy_sentiment?.map((rs, idx) => {
                                            const total = parseInt(rs.total_reviews);
                                            const pos = parseInt(rs.positive_count);
                                            const ratio = ((pos / total) * 100).toFixed(1);
                                            return (
                                                <TableRow key={idx}>
                                                    <TableCell sx={{ fontWeight: 800, color: '#431407' }}>{rs.remedy_name}</TableCell>
                                                    <TableCell sx={{ fontWeight: 700 }}>{rs.total_reviews}</TableCell>
                                                    <TableCell sx={{ color: '#16a34a', fontWeight: 800 }}>{rs.positive_count}</TableCell>
                                                    <TableCell sx={{ color: '#dc2626', fontWeight: 800 }}>{rs.negative_count}</TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <LinearProgress
                                                                variant="determinate"
                                                                value={parseFloat(ratio)}
                                                                color={parseFloat(ratio) > 70 ? 'success' : parseFloat(ratio) > 40 ? 'warning' : 'error'}
                                                                sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                                                            />
                                                            <Typography variant="body2" fontWeight={900}>{ratio}%</Typography>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {stats.remedy_sentiment?.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center">No remedy-specific feedback data yet.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
}
