import {
    Box,
    Typography,
    Container,
    Paper,
    IconButton,
    AppBar,
    Toolbar,
    useMediaQuery,
    useTheme,
    Button,
    Dialog,
    TextField,
    Chip,
    Avatar,
    Stack,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Tabs,
    Tab,
    TablePagination
} from "@mui/material";
import { useEffect, useState, useRef } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AdminSidebar from "../components/AdminSidebar";
import { useToast } from "../services/ToastService";
import { 
    Image as ImageIcon, 
    X, 
    CheckCircle,
    Clock,
    User,
    Folder,
    MessageSquare,
    Send,
    Download
} from "lucide-react";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";

export default function AdminTracker() {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    const [submissions, setSubmissions] = useState([]);
    const [chats, setChats] = useState({});
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(isDesktop);
    const { showToast } = useToast();

    // Filters & Pagination
    const [filterStatus, setFilterStatus] = useState('all');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Chat/Update states
    const [resultInput, setResultInput] = useState({ id: null, message: "", image: null });
    const [sendingChat, setSendingChat] = useState(null);
    const [lightboxImg, setLightboxImg] = useState(null);

    const fileInputRef = useRef(null);

    useEffect(() => {
        setDrawerOpen(isDesktop);
    }, [isDesktop]);

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/tracker.php");
            const data = await res.json();
            if (data.status === "success") {
                setSubmissions(data.data);
                data.data.forEach(sub => fetchChats(sub.id));
            }
        } catch (e) {
            showToast("Failed to fetch tracker submissions", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchChats = async (submissionId) => {
        try {
            const res = await fetch('/api/tracker.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_chats', submission_id: submissionId })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setChats(prev => ({ ...prev, [submissionId]: data.data }));
            }
        } catch (error) {
            console.error("Error fetching chats:", error);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            showToast("Image size must be less than 2MB", "warning");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setResultInput(prev => ({ ...prev, image: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleSendChat = async (subId, message, imageBase64) => {
        if (!message.trim() && !imageBase64) return;
        
        setSendingChat(subId);
        try {
            const res = await fetch('/api/tracker.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'add_chat',
                    submission_id: subId,
                    sender_role: 'expert', // Admin acts as expert
                    message: message,
                    image: imageBase64,
                    sender_email: localStorage.getItem("email")
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                showToast('Update sent successfully!', 'success');
                setResultInput({ id: null, message: "", image: null });
                fetchChats(subId);
                fetchSubmissions(); // refresh status
            } else {
                showToast(data.message || 'Failed to send update', 'error');
            }
        } catch (e) {
            showToast('An error occurred', 'error');
        } finally {
            setSendingChat(null);
        }
    };

    const filteredSubmissions = submissions.filter(sub => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'completed') return sub.status === 'completed';
        if (filterStatus === 'pending') return sub.status !== 'completed';
        return true;
    });

    const paginatedSubmissions = filteredSubmissions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Reset page to 0 when filter changes
    useEffect(() => {
        setPage(0);
    }, [filterStatus]);

    return (
        <Box sx={{ display: 'flex', minHeight: "100vh", backgroundColor: "#f8fafc" }}>
            <AdminSidebar open={drawerOpen} onClose={() => setDrawerOpen(!drawerOpen)} isDesktop={isDesktop} />

            <Box sx={{ flexGrow: 1 }}>
                <AppBar position="sticky" elevation={0} sx={{ backgroundColor: "#fff", color: '#0f172a', borderBottom: '1px solid #e2e8f0' }}>
                    <Toolbar>
                        <IconButton color="inherit" onClick={() => setDrawerOpen(!drawerOpen)} sx={{ mr: 2 }}><MenuIcon /></IconButton>
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" fontWeight={800}>All Trackers & Remedies</Typography>
                            <Typography variant="caption" color="textSecondary">Monitor remedies from all experts across all users</Typography>
                        </Box>
                    </Toolbar>
                </AppBar>

                <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
                    <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #e2e8f0', borderRadius: 4 }}>
                        <Tabs 
                            value={filterStatus} 
                            onChange={(e, val) => setFilterStatus(val)}
                            textColor="primary"
                            indicatorColor="primary"
                            sx={{ '& .MuiTab-root': { fontWeight: 800, textTransform: 'none' } }}
                        >
                            <Tab value="all" label="All Remedies" />
                            <Tab value="pending" label="Pending / In Progress" />
                            <Tab value="completed" label="Completed" />
                        </Tabs>
                    </Paper>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress color="primary" /></Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {paginatedSubmissions.map((sub) => (
                                <Accordion 
                                    key={sub.id} 
                                    elevation={0}
                                    disableGutters
                                    sx={{ 
                                        borderRadius: '16px !important', 
                                        border: '1px solid #e2e8f0', 
                                        bgcolor: '#fff',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&::before': { display: 'none' },
                                        '&::after': {
                                            content: '""',
                                            position: 'absolute',
                                            left: 0, top: 0, bottom: 0,
                                            width: 6,
                                            bgcolor: sub.status === 'completed' ? '#22c55e' : '#f97316'
                                        }
                                    }}
                                >
                                    <AccordionSummary
                                        expandIcon={<ExpandMoreIcon sx={{ color: '#0f172a' }} />}
                                        sx={{ 
                                            px: { xs: 2, md: 3 }, 
                                            py: 1,
                                            borderBottom: '1px solid #f8fafc',
                                            '& .MuiAccordionSummary-content': { m: 0 }
                                        }}
                                    >
                                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', flex: 1 }}>
                                                <Chip 
                                                    label={sub.status?.toUpperCase() || 'PENDING'}
                                                    size="small"
                                                    sx={{ 
                                                        fontWeight: 900, 
                                                        px: 1,
                                                        bgcolor: sub.status === 'completed' ? '#dcfce7' : '#fff7ed', 
                                                        color: sub.status === 'completed' ? '#166534' : '#9a3412',
                                                        fontSize: '0.7rem',
                                                        height: 24,
                                                        border: sub.status === 'completed' ? '1px solid #86efac' : '1px solid #ffedd5'
                                                    }}
                                                />
                                                <Chip size="small" label={`Expert: ${sub.admin_email}`} sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20, bgcolor: '#f1f5f9', color: '#475569', border: 'none' }} />
                                                <Chip size="small" label={`User: ${sub.user_email}`} sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20, bgcolor: '#eff6ff', color: '#1d4ed8', border: 'none' }} />
                                                {sub.zone && <Chip size="small" label={sub.zone} sx={{ fontWeight: 900, fontSize: '0.65rem', height: 20, bgcolor: '#f0fdf4', color: '#15803d', border: 'none' }} />}
                                                {sub.p_name && <Typography variant="caption" fontWeight={800} color="#94a3b8" sx={{ fontSize: '0.7rem', display: { xs: 'none', sm: 'block' } }}>[{sub.p_name}]</Typography>}
                                                <Typography variant="body2" fontWeight={800} color="#1e293b" sx={{ ml: { xs: 0, md: 1 }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
                                                    {sub.problem ? sub.problem : 'Remedy Tracker'}
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" fontWeight={700} color="#94a3b8" sx={{ whiteSpace: 'nowrap' }}>
                                                {new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </Typography>
                                        </Box>
                                    </AccordionSummary>

                                    <AccordionDetails sx={{ px: { xs: 2, md: 3 }, pt: 3, pb: 3, bgcolor: '#f8fafc' }}>
                                        {/* PROBLEM / CHALLENGE */}
                                        <Box sx={{ mb: 3, bgcolor: '#fff', p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
                                            <Typography variant="caption" fontWeight={900} color="#94a3b8" sx={{ textTransform: 'uppercase', display: 'block', fontSize: '0.65rem', mb: 1, letterSpacing: 1 }}>
                                                THE CHALLENGE / PROBLEM:
                                            </Typography>
                                            <Typography variant="h6" fontWeight={800} color="#1e293b" sx={{ fontSize: '1.1rem', lineHeight: 1.4 }}>
                                                {sub.problem || 'No problem description provided.'}
                                            </Typography>
                                        </Box>

                                        {/* RESOLUTION STEPS */}
                                        <Box sx={{ mb: 3, p: 3, bgcolor: '#fff', borderRadius: 3, border: '1px solid #e2e8f0', borderLeft: '4px solid #f97316' }}>
                                            <Typography variant="caption" fontWeight={900} color="#64748b" sx={{ textTransform: 'uppercase', display: 'block', fontSize: '0.65rem', mb: 1 }}>RESOLUTION STEPS:</Typography>
                                            <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.95rem', lineHeight: 1.6, fontWeight: 500 }}>
                                                {sub.steps || sub.actions}
                                            </Typography>
                                        </Box>

                                        {/* CHAT / ACTIVITY HISTORY */}
                                        <Box sx={{ mt: 2, mb: 3 }}>
                                            <Typography variant="caption" fontWeight={900} color="#94a3b8" sx={{ textTransform: 'uppercase', display: 'block', fontSize: '0.65rem', mb: 2, letterSpacing: 1 }}>
                                                ACTIVITY & CONVERSATION:
                                            </Typography>
                                            
                                            <Stack spacing={2}>
                                                {chats[sub.id]?.map((msg, mIdx) => (
                                                    <Box key={msg.id || mIdx} sx={{ 
                                                        display: 'flex', 
                                                        flexDirection: 'column',
                                                        alignItems: msg.sender_role === 'expert' ? 'flex-end' : 'flex-start',
                                                        width: '100%'
                                                    }}>
                                                        <Box sx={{ 
                                                            p: 2, 
                                                            borderRadius: 4, 
                                                            maxWidth: '85%',
                                                            bgcolor: msg.sender_role === 'expert' ? '#fff7ed' : '#ffffff',
                                                            border: msg.sender_role === 'expert' ? '1px solid #fed7aa' : '1px solid #e2e8f0',
                                                            position: 'relative'
                                                        }}>
                                                            <Typography variant="caption" fontWeight={900} sx={{ 
                                                                display: 'block', 
                                                                mb: 0.5, 
                                                                color: msg.sender_role === 'expert' ? '#f97316' : '#3b82f6',
                                                                fontSize: '0.6rem',
                                                                textTransform: 'uppercase'
                                                            }}>
                                                                {msg.sender_role === 'expert' ? `Expert (${msg.sender_email})` : `User (${msg.sender_email})`}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ 
                                                                color: msg.sender_role === 'expert' ? '#431407' : '#1e293b',
                                                                fontWeight: 600,
                                                                lineHeight: 1.5,
                                                                fontSize: '0.9rem'
                                                            }}>
                                                                {msg.message}
                                                            </Typography>
                                                            {msg.image && (
                                                                <Box sx={{ mt: 1.5, borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
                                                                    <img 
                                                                        src={`/${msg.image}`} 
                                                                        alt="Attachment" 
                                                                        style={{ width: '100%', height: 'auto', display: 'block', cursor: 'zoom-in' }} 
                                                                        onClick={() => setLightboxImg(msg.image)}
                                                                    />
                                                                </Box>
                                                            )}
                                                        </Box>
                                                        <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.5, fontSize: '0.6rem', px: 1 }}>
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                                
                                                {(!chats[sub.id] || chats[sub.id].length === 0) && (
                                                    <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                                                        No updates shared yet.
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </Box>

                                        {/* Reply Interface */}
                                        {resultInput.id === sub.id ? (
                                            <Box sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 4, bgcolor: '#fff' }}>
                                                <TextField
                                                    placeholder="Type an expert reply or update..."
                                                    fullWidth
                                                    multiline
                                                    rows={2}
                                                    value={resultInput.message}
                                                    onChange={(e) => setResultInput({ ...resultInput, message: e.target.value })}
                                                    variant="outlined"
                                                    sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: '#f8fafc' } }}
                                                />
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Button variant="outlined" onClick={() => fileInputRef.current.click()} startIcon={<ImageIcon size={18} />} sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 800, borderColor: '#e2e8f0', color: '#64748b' }}>
                                                            Add Photo Ref
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
                                                        <Button onClick={() => setResultInput({ id: null, message: "", image: null })} sx={{ fontWeight: 800, color: '#64748b' }}>Cancel</Button>
                                                        <Button 
                                                            onClick={() => handleSendChat(sub.id, resultInput.message, resultInput.image)} 
                                                            variant="contained" 
                                                            disabled={sendingChat === sub.id || (!resultInput.message.trim() && !resultInput.image)}
                                                            endIcon={sendingChat === sub.id ? <CircularProgress size={16} color="inherit" /> : <Send size={18} />}
                                                            sx={{ bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' }, borderRadius: 3, px: 3, fontWeight: 900, textTransform: 'none' }}
                                                        >
                                                            Send Reply
                                                        </Button>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        ) : (
                                            <Button 
                                                variant="contained" 
                                                onClick={() => setResultInput({ id: sub.id, message: "", image: null })}
                                                startIcon={<MessageSquare size={18} />}
                                                sx={{ bgcolor: '#fff', color: '#0f172a', border: '2px solid #0f172a', '&:hover': { bgcolor: '#f8fafc' }, borderRadius: 3, py: 1.5, px: 3, fontWeight: 900, textTransform: 'none' }}
                                                fullWidth
                                            >
                                                Post an Expert Update
                                            </Button>
                                        )}
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                            {filteredSubmissions.length === 0 && (
                                <Box sx={{ py: 10, textAlign: 'center' }}>
                                    <Typography variant="h6" color="textSecondary" fontWeight={700}>No remedies found for the selected filter.</Typography>
                                </Box>
                            )}

                            {filteredSubmissions.length > 0 && (
                                <Paper elevation={0} sx={{ mt: 2, mb: 4, border: '1px solid #e2e8f0', borderRadius: 4 }}>
                                    <TablePagination
                                        rowsPerPageOptions={[10, 25, 50, 100]}
                                        component="div"
                                        count={filteredSubmissions.length}
                                        rowsPerPage={rowsPerPage}
                                        page={page}
                                        onPageChange={handleChangePage}
                                        onRowsPerPageChange={handleChangeRowsPerPage}
                                        sx={{
                                            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                                                fontWeight: 700,
                                                color: '#64748b'
                                            }
                                        }}
                                    />
                                </Paper>
                            )}
                        </Box>
                    )}
                </Container>
            </Box>

            <Dialog 
                open={!!lightboxImg} 
                onClose={() => setLightboxImg(null)} 
                maxWidth="xl" 
                sx={{ zIndex: 99999 }}
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
                            startIcon={<DownloadIcon />}
                            sx={{ fontWeight: 800, px: { xs: 2, md: 4 }, py: 1, borderRadius: 3, bgcolor: '#f59e0b', color: '#fff', '&:hover': { bgcolor: '#ea580c' } }}
                        >
                            Download
                        </Button>
                        <Button 
                            variant="contained" 
                            onClick={() => setLightboxImg(null)} 
                            startIcon={<CloseIcon />}
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
