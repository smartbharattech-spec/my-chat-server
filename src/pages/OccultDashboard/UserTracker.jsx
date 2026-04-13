import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, Typography, Paper, Grid, CircularProgress, 
    Card, CardContent, Chip, Avatar, Button,
    Snackbar, Alert, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
    Stack, Rating, Switch, FormControlLabel,
    Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { 
    BarChart2, 
    CheckCircle, 
    Clock, 
    Activity, 
    MessageSquare, 
    Calendar,
    ArrowRight,
    Star,
    LayoutDashboard,
    Image as ImageIcon,
    Plus,
    ChevronDown,
    X,
    Download
} from 'lucide-react';
import MarketplaceSidebar from '../../components/MarketplaceSidebar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = '/api/tracker.php';

export default function UserTracker() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submissions, setSubmissions] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [lightboxImg, setLightboxImg] = useState(null);
    
    // Result update states
    const [resultInput, setResultInput] = useState({ id: null, experience: "", image: null });
    const [submitting, setSubmitting] = useState(false);

    const fileInputRef = useRef(null);

    // Review state
    const [reviewInput, setReviewInput] = useState({ id: null, rating: 5, text: "" });
    const [reviewLoading, setReviewLoading] = useState(false);

    // Chat / Multi-reply state
    const [chats, setChats] = useState({}); // { submissionId: [messages] }
    const [sendingChat, setSendingChat] = useState(null); // submissionId

    useEffect(() => {
        const storedUser = localStorage.getItem('occult_user');
        if (!storedUser) {
            navigate('/occult/login');
        } else {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchSubmissions(parsedUser.email);
        }
    }, [navigate]);

    const fetchSubmissions = async (email) => {
        try {
            const resp = await axios.get(`${API_BASE}?email=${encodeURIComponent(email)}`);
            if (resp.data.status === 'success') {
                setSubmissions(resp.data.data);
                // Fetch chats for each submission
                resp.data.data.forEach(sub => fetchChats(sub.id));
            }
        } catch (err) {
            console.error('Error fetching tracker submissions:', err);
            setSnackbar({ open: true, message: 'Failed to fetch tracker data', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const fetchChats = async (submissionId) => {
        try {
            const resp = await axios.post(API_BASE, { action: 'get_chats', submission_id: submissionId });
            if (resp.data.status === 'success') {
                setChats(prev => ({ ...prev, [submissionId]: resp.data.data }));
            }
        } catch (e) {
            console.error("Failed to fetch chats for", submissionId);
        }
    };

    const handleSendChat = async (submissionId, message, image = null) => {
        if (!message.trim() && !image) return;
        
        // Role is 'user' for this component
        setSendingChat(submissionId);
        try {
            const resp = await axios.post(API_BASE, {
                action: 'send_chat',
                submission_id: submissionId,
                role: 'user',
                message: message.trim(),
                image: image
            });
            if (resp.data.status === 'success') {
                fetchChats(submissionId);
                fetchSubmissions(user.email); // Refresh main status
                setResultInput({ id: null, experience: "", image: null });
            }
        } catch (e) {
            setSnackbar({ open: true, message: 'Failed to send message', severity: 'error' });
        } finally {
            setSendingChat(null);
        }
    };

    const handleSubmitReview = async (id) => {
        if (reviewInput.rating < 1) {
            setSnackbar({ open: true, message: 'Please provide a rating', severity: 'warning' });
            return;
        }

        setReviewLoading(true);
        try {
            const resp = await axios.post(API_BASE, {
                action: 'submit_review',
                id: id,
                rating: reviewInput.rating,
                review: reviewInput.text
            });

            if (resp.data.status === 'success') {
                setSnackbar({ open: true, message: 'Thank you for your feedback!', severity: 'success' });
                setReviewInput({ id: null, rating: 5, text: "" });
                fetchSubmissions(user.email); // Refresh
            } else {
                setSnackbar({ open: true, message: resp.data.message || 'Error submitting review', severity: 'error' });
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to submit review', severity: 'error' });
        } finally {
            setReviewLoading(false);
        }
    };

    const handleToggleStatus = async (sub) => {
        const newStatus = sub.status === 'completed' ? 'pending' : 'completed';
        try {
            const resp = await axios.post(API_BASE, {
                action: 'update_status',
                id: sub.id,
                status: newStatus,
                experience: sub.experience || ''
            });
            if (resp.data.status === 'success') {
                fetchSubmissions(user.email);
                setSnackbar({ open: true, message: `Remedy marked as ${newStatus}`, severity: 'success' });
            }
        } catch (e) {
            setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' });
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            setSnackbar({ open: true, message: 'Image size must be less than 2MB', severity: 'warning' });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setResultInput(prev => ({ ...prev, image: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    if (loading) return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc' }}>
            <CircularProgress color="warning" />
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <MarketplaceSidebar user={user} role="user" />

            <Box sx={{ flex: 1, p: 0, width: '100%', maxWidth: 'none', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: { xs: 2, md: 4, lg: 5 }, width: '100%', maxWidth: 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Box sx={{ p: 1.5, bgcolor: '#fff7ed', borderRadius: 3, display: 'flex', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.1)' }}>
                            <BarChart2 size={32} color="#f59e0b" />
                        </Box>
                        <Box>
                            <Typography variant="h4" fontWeight={900} sx={{ color: '#0f172a', letterSpacing: -1 }}>
                                Vastu Remedy Tracker
                            </Typography>
                            <Typography color="textSecondary" sx={{ fontWeight: 500 }}>
                                Track your spiritual implementations and project progress.
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ width: '100%', flex: 1, px: { xs: 2, lg: 4, xl: 8 } }}>
                    {submissions.length === 0 ? (
                        <Box sx={{ p: 4, width: '100%', boxSizing: 'border-box' }}>
                            <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 5, border: '2px dashed #e2e8f0', bgcolor: 'transparent', width: '100%' }}>
                                <Activity size={64} color="#94a3b8" style={{ margin: '0 auto 20px' }} />
                                <Typography variant="h6" fontWeight={800} color="#64748b">No active remedy trackers</Typography>
                                <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
                                    Your expert will initiate remedy tracking here once they assign specific tasks for your project.
                                </Typography>
                            </Paper>
                        </Box>
                    ) : (
                        <Stack spacing={0} sx={{ width: '100%', maxWidth: 'none', m: 0, p: 0 }}>
                            {submissions.map((sub, index) => (
                                <Accordion 
                                    key={sub.id || index} 
                                    elevation={0}
                                    disableGutters
                                    sx={{ 
                                        borderRadius: '16px !important', 
                                        border: '1px solid #e2e8f0', 
                                        borderLeft: sub.category === 'remedy' ? '6px solid #f59e0b' : '6px solid #cbd5e1',
                                        mb: 2,
                                        bgcolor: '#fff',
                                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
                                        '&::before': { display: 'none' }
                                    }}
                                >
                                    <AccordionSummary
                                        expandIcon={<ChevronDown size={20} color="#64748b" />}
                                        sx={{ px: { xs: 2, md: 3 }, py: 1 }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1, width: '100%' }}>
                                            <Avatar sx={{ bgcolor: sub.category === 'remedy' ? '#fffbeb' : '#f1f5f9', color: sub.category === 'remedy' ? '#d97706' : '#475569', fontWeight: 900, width: 56, height: 56, border: '1px solid #e2e8f0', fontSize: '1.2rem', display: { xs: 'none', sm: 'flex' } }}>
                                                {sub.project_name?.charAt(0) || 'P'}
                                            </Avatar>
                                            <Box sx={{ flex: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                                    <Typography variant="h6" fontWeight={900} color="#0f172a" sx={{ fontSize: '1.05rem' }}>
                                                        {sub.project_name || `Project #${sub.project_id}`}
                                                    </Typography>
                                                    {sub.zone && (
                                                        <Chip label={sub.zone} size="small" sx={{ height: 24, fontSize: '0.75rem', fontWeight: 900, bgcolor: '#f1f5f9', color: '#475569', px: 1 }} />
                                                    )}
                                                </Box>
                                                <Typography variant="body2" color="#475569" sx={{ mb: 0, fontWeight: 600 }}>
                                                    <strong style={{ color: '#0f172a' }}>Action Item:</strong> {sub.problem || sub.steps || sub.actions || 'Remedy implementation'}
                                                </Typography>
                                            </Box>
                                            
                                            <Box sx={{ flexDirection: 'column', alignItems: 'flex-end', gap: 1, ml: 2, display: { xs: 'none', md: 'flex' } }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: sub.status === 'completed' ? '#dcfce7' : '#fef3c7', color: sub.status === 'completed' ? '#166534' : '#92400e', px: 1.5, py: 0.5, borderRadius: '4px', border: '1px solid', borderColor: sub.status === 'completed' ? '#bbf7d0' : '#fde68a' }}>
                                                    {sub.status === 'completed' ? <CheckCircle size={14} /> : <Clock size={14} />}
                                                    <Typography variant="caption" fontWeight={900}>
                                                        {sub.status?.toUpperCase() || 'PENDING'}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="caption" color="textSecondary" fontWeight={600}>
                                                    {new Date(sub.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </AccordionSummary>

                                    <AccordionDetails sx={{ px: { xs: 2, md: 4 }, pt: 2, pb: 4, borderTop: '1px solid #f1f5f9', bgcolor: '#fafafa' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                            <Typography variant="h6" fontWeight={800} color="#0f172a">Tracker Updates</Typography>
                                            <FormControlLabel
                                                control={
                                                    <Switch 
                                                        checked={sub.status === 'completed'} 
                                                        onChange={() => handleToggleStatus(sub)} 
                                                        color="success"
                                                        size="small"
                                                    />
                                                }
                                                label={
                                                    <Typography variant="caption" fontWeight={900} color="#475569">
                                                        MARK AS {sub.status === 'completed' ? 'PENDING' : 'COMPLETED'}
                                                    </Typography>
                                                }
                                                labelPlacement="start"
                                            />
                                        </Box>

                                        <Stack spacing={2} sx={{ mb: 4 }}>
                                            {(!chats[sub.id] || chats[sub.id].length === 0) ? (
                                                <Box sx={{ py: 4, textAlign: 'center', bgcolor: '#fff', borderRadius: 4, border: '1px dashed #e2e8f0' }}>
                                                    <MessageSquare size={32} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                                                    <Typography variant="body2" fontWeight={800} color="#64748b">No Messages Yet</Typography>
                                                    <Typography variant="caption" color="textSecondary">Waiting for your first update...</Typography>
                                                </Box>
                                            ) : (
                                                chats[sub.id].map((msg, mIdx) => (
                                                    <Box key={msg.id || mIdx} sx={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender_role === 'expert' ? 'flex-start' : 'flex-end', width: '100%' }}>
                                                        <Paper elevation={0} sx={{ p: 2, borderRadius: 4, maxWidth: '85%', bgcolor: msg.sender_role === 'expert' ? '#fff7ed' : '#f0fdf4', border: msg.sender_role === 'expert' ? '1px solid #fed7aa' : '1px solid #dcfce7' }}>
                                                            <Typography variant="caption" fontWeight={900} sx={{ display: 'block', mb: 0.5, color: msg.sender_role === 'expert' ? '#f59e0b' : '#16a34a', fontSize: '0.6rem', textTransform: 'uppercase' }}>
                                                                {msg.sender_role === 'expert' ? 'Expert Advice' : 'My Response'}
                                                            </Typography>
                                                            <Typography variant="body2" fontWeight={600} color={msg.sender_role === 'expert' ? '#92400e' : '#166534'}>
                                                                {msg.message}
                                                            </Typography>
                                                            {msg.image && (
                                                                <Box sx={{ mt: 1.5, borderRadius: 2, overflow: 'hidden' }}>
                                                                    <img 
                                                                        src={`/${msg.image}`} 
                                                                        alt="Attachment" 
                                                                        style={{ width: '100%', display: 'block', cursor: 'zoom-in' }} 
                                                                        onClick={() => setLightboxImg(msg.image)}
                                                                    />
                                                                </Box>
                                                            )}
                                                        </Paper>
                                                        <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, fontSize: '0.6rem', px: 1 }}>
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </Typography>
                                                    </Box>
                                                ))
                                            )}
                                        </Stack>

                                        {/* Reply Interface */}
                                        {resultInput.id === sub.id ? (
                                            <Box sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 4, bgcolor: '#fff' }}>
                                                <TextField
                                                    placeholder="Type an update or ask a question..."
                                                    fullWidth
                                                    multiline
                                                    rows={2}
                                                    value={resultInput.experience}
                                                    onChange={(e) => setResultInput({ ...resultInput, experience: e.target.value })}
                                                    variant="outlined"
                                                    sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: '#f8fafc' } }}
                                                />
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Button variant="outlined" onClick={() => fileInputRef.current.click()} startIcon={<ImageIcon size={18} />} sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 800, borderColor: '#e2e8f0', color: '#64748b' }}>
                                                            Add Photo Proof
                                                        </Button>
                                                        <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImageChange} />
                                                        {resultInput.image && (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Avatar src={resultInput.image} variant="rounded" sx={{ width: 40, height: 40 }} />
                                                                <Button size="small" color="error" onClick={() => setResultInput({ ...resultInput, image: null })} sx={{ fontWeight: 800, minWidth: 'auto', p: 0.5 }}>Remove</Button>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                                        <Button onClick={() => setResultInput({ id: null, experience: "", image: null })} sx={{ fontWeight: 800, color: '#64748b' }}>Cancel</Button>
                                                        <Button 
                                                            onClick={() => {
                                                                if (!resultInput.experience.trim() && !resultInput.image) {
                                                                    setSnackbar({ open: true, message: 'Please enter a message or add a photo', severity: 'warning' });
                                                                    return;
                                                                }
                                                                handleSendChat(sub.id, resultInput.experience, resultInput.image);
                                                            }} 
                                                            variant="contained" 
                                                            disabled={sendingChat === sub.id || (!resultInput.experience.trim() && !resultInput.image)}
                                                            endIcon={sendingChat === sub.id ? <CircularProgress size={16} color="inherit" /> : <ArrowRight size={18} />}
                                                            sx={{ bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' }, borderRadius: 3, px: 3, fontWeight: 900, textTransform: 'none' }}
                                                        >
                                                            Send Update
                                                        </Button>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        ) : (
                                            <Button 
                                                variant="contained" 
                                                onClick={() => setResultInput({ id: sub.id, experience: "", image: null })}
                                                startIcon={<MessageSquare size={18} />}
                                                sx={{ bgcolor: '#fff', color: '#0f172a', border: '2px solid #0f172a', '&:hover': { bgcolor: '#f8fafc' }, borderRadius: 3, py: 1.5, px: 3, fontWeight: 900, textTransform: 'none' }}
                                                fullWidth
                                            >
                                                Post an Update
                                            </Button>
                                        )}
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Stack>
                    )}
                </Box>
            </Box>

            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={4000} 
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} sx={{ borderRadius: 3, fontWeight: 700 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <Dialog 
                open={!!lightboxImg} 
                onClose={() => setLightboxImg(null)} 
                maxWidth="xl" 
                sx={{ zIndex: 9999 }}
                PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', position: 'relative' } }}
            >
                <Box sx={{ position: 'relative', textAlign: 'center' }}>
                    <img src={`/${lightboxImg}`} alt="Zoomed File" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px' }} />
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
                        <Button 
                            variant="contained" 
                            href={`/${lightboxImg}`} 
                            download 
                            target="_blank" 
                            startIcon={<Download size={18} />}
                            sx={{ fontWeight: 800, px: { xs: 2, md: 4 }, py: 1, borderRadius: 3, bgcolor: '#f59e0b', color: '#fff', '&:hover': { bgcolor: '#ea580c' } }}
                        >
                            Download
                        </Button>
                        <Button 
                            variant="contained" 
                            onClick={() => setLightboxImg(null)} 
                            startIcon={<X size={18} />}
                            sx={{ fontWeight: 800, px: { xs: 2, md: 4 }, py: 1, borderRadius: 3, bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}
                        >
                            Close Zoom
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        </Box>
    );
}
