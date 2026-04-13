import React, { useState, useEffect, useRef } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    IconButton,
    Zoom,
    TextField,
    CircularProgress,
    Paper,
    Stack,
    Tooltip,
    Avatar,
    Badge,
    Chip,
    Rating,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from "@mui/material";
import StarIcon from '@mui/icons-material/Star';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { keyframes } from '@mui/system';

const pulse = keyframes`
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
`;
import Divider from '@mui/material/Divider';
import CloseIcon from "@mui/icons-material/Close";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import SendIcon from "@mui/icons-material/Send";
import HistoryIcon from "@mui/icons-material/History";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import ImageIcon from '@mui/icons-material/Image';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import DownloadIcon from '@mui/icons-material/Download';
import { useToast } from "../services/ToastService";

export default function TrackerDialog({ open, onClose, ownerEmail, activeProjectId: propProjectId, activeProjectName: propProjectName }) {
    const { showToast } = useToast();
    const [entries, setEntries] = useState([{ problem: "", steps: "" }]);
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [submissions, setSubmissions] = useState([]);
    const [bannerUrl, setBannerUrl] = useState("");
    const [isBannerEnabled, setIsBannerEnabled] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // Result tracking state
    const [resultInput, setResultInput] = useState({ id: null, experience: "", image: null });
    const [lightboxImg, setLightboxImg] = useState(null);
    const [resultLoading, setResultLoading] = useState(false);
    const [expertReply, setExpertReply] = useState({ id: null, note: "" });
    const [expertReplyLoading, setExpertReplyLoading] = useState(false);

    // Chat / Multi-reply state
    const [chats, setChats] = useState({}); // { submissionId: [messages] }
    const [sendingChat, setSendingChat] = useState(null); // submissionId

    // Review state
    const [reviewInput, setReviewInput] = useState({ id: null, rating: 5, text: "" });
    const [reviewLoading, setReviewLoading] = useState(false);

    const fileInputRef = useRef(null);

    // Use props if available, fallback to localStorage
    const email = ownerEmail || localStorage.getItem("email");
    const activeProjectId = propProjectId || localStorage.getItem("active_project_id");
    const activeProjectName = propProjectName || localStorage.getItem("active_project_name");

    useEffect(() => {
        if (open && email && activeProjectId) {
            syncAndFetch();
            fetchBanner();
        }
    }, [open, email, activeProjectId]);

    const syncAndFetch = async () => {
        setHistoryLoading(true);
        try {
            await fetchHistory();
        } finally {
            setHistoryLoading(false);
        }
    };

    const fetchBanner = async () => {
        try {
            const [urlRes, enRes] = await Promise.all([
                fetch("/api/get_setting.php?key=tracker_banner_url").then(r => r.json()),
                fetch("/api/get_setting.php?key=is_tracker_banner_enabled").then(r => r.json())
            ]);
            if (urlRes.status === "success") setBannerUrl(urlRes.value);
            if (enRes.status === "success" && enRes.value === 'false') {
                setIsBannerEnabled(false);
            } else {
                setIsBannerEnabled(true);
            }
        } catch (e) {
            console.error("Failed to fetch banner");
        }
    };

    const handleAddEntry = () => {
        setEntries([...entries, { problem: "", steps: "" }]);
    };

    const handleRemoveEntry = (index) => {
        const newEntries = [...entries];
        newEntries.splice(index, 1);
        setEntries(newEntries);
    };

    const handleEntryChange = (index, field, value) => {
        const newEntries = [...entries];
        newEntries[index][field] = value;
        setEntries(newEntries);
    };

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const url = activeProjectId 
                ? `/api/tracker.php?project_id=${activeProjectId}` 
                : `/api/tracker.php?email=${encodeURIComponent(email)}`;
            
            const response = await fetch(url);
            const data = await response.json();
            if (data.status === 'success') {
                setSubmissions(data.data);
                // Fetch chats for each submission
                data.data.forEach(sub => fetchChats(sub.id));
            }
        } catch (error) {
            console.error("Error fetching tracker history:", error);
        } finally {
            setHistoryLoading(false);
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
        } catch (e) {
            console.error("Failed to fetch chats for", submissionId);
        }
    };

    const handleSendChat = async (submissionId, message, image = null) => {
        if (!message.trim() && !image) return;
        
        // Determine role: TrackerDialog is used inside the Expert/Admin Vastu Tool.
        // If admin is logged in (via adminUser session), they are always 'expert'.
        // Fallback: check if logged-in email matches the submission's assigned expert email.
        const sub = submissions.find(s => s.id === submissionId);
        const loginEmail = localStorage.getItem("email");
        const isAdminSession = localStorage.getItem("isAdminLoggedIn") === "true" || !!localStorage.getItem("adminUser");
        const role = (isAdminSession || (sub && loginEmail === sub.admin_email)) ? 'expert' : 'user';

        setSendingChat(submissionId);
        try {
            const res = await fetch('/api/tracker.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'send_chat',
                    submission_id: submissionId,
                    role: role,
                    message: message.trim(),
                    image: image
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                fetchChats(submissionId);
                if (role === 'user') fetchHistory(); // To update main status
            }
        } catch (e) {
            showToast("Failed to send message", "error");
        } finally {
            setSendingChat(null);
        }
    };

    const handleUpdateResult = async (id) => {
        if (!resultInput.experience.trim()) {
            showToast("Please describe your experience", "warning");
            return;
        }

        setResultLoading(true);
        try {
            const response = await fetch('/api/tracker.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_status',
                    id: id,
                    status: 'completed',
                    experience: resultInput.experience,
                    user_image: resultInput.image, // Base64
                    project_id: activeProjectId
                })
            });

            const data = await response.json();
            if (data.status === 'success') {
                showToast("Progress report submitted successfully", "success");
                setResultInput({ id: null, experience: "", image: null });
                fetchHistory(); // Refresh
            } else {
                showToast(data.message || "Error submitting progress", "error");
            }
        } catch (error) {
            showToast("Failed to submit progress", "error");
        } finally {
            setResultLoading(false);
        }
    };

    const handleSaveExpertReply = async (id) => {
        if (!expertReply.note.trim()) {
            showToast("Please enter an observation", "warning");
            return;
        }

        setExpertReplyLoading(true);
        try {
            const response = await fetch('/api/tracker.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_note',
                    id: id,
                    admin_note: expertReply.note,
                    result_status: 'resolved'
                })
            });

            const data = await response.json();
            if (data.status === 'success') {
                showToast("Expert observation saved successfully", "success");
                setExpertReply({ id: null, note: "" });
                fetchHistory(); 
            } else {
                showToast(data.message || "Error saving observation", "error");
            }
        } catch (error) {
            showToast("Failed to save observation", "error");
        } finally {
            setExpertReplyLoading(false);
        }
    };

    const handleSubmitReview = async (id) => {
        if (reviewInput.rating < 1) {
            showToast("Please provide a rating", "warning");
            return;
        }

        setReviewLoading(true);
        try {
            const response = await fetch('/api/tracker.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'submit_review',
                    id: id,
                    rating: reviewInput.rating,
                    review: reviewInput.text
                })
            });

            const data = await response.json();
            if (data.status === 'success') {
                showToast("Thank you for your feedback!", "success");
                setReviewInput({ id: null, rating: 5, text: "" });
                fetchHistory(); // Refresh
            } else {
                showToast(data.message || "Error submitting review", "error");
            }
        } catch (error) {
            showToast("Failed to submit review", "error");
        } finally {
            setReviewLoading(false);
        }
    };

    const handleSubmit = async () => {
        const invalid = entries.some(e => !e.problem.trim() || !e.steps.trim());
        if (invalid) {
            showToast("Please provide details for both Problem and Steps in all entries", "warning");
            return;
        }

        setLoading(true);
        try {
            await Promise.all(entries.map(entry =>
                fetch("/api/tracker.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "submit",
                        project_id: activeProjectId,
                        project_name: activeProjectName,
                        email: email,
                        problem: entry.problem.trim(),
                        steps: entry.steps.trim(),
                        category: 'manual',
                        experience: "",
                        admin_email: localStorage.getItem("email") // Track who initiated
                    })
                })
            ));

            showToast("New tracking entries added!", "success");
            setEntries([{ problem: "", steps: "" }]);
            fetchHistory();
        } catch (error) {
            showToast("Network error during submission", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleImageSelect = (e) => {
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

    return (
        <Dialog
            open={open}
            onClose={onClose}
            TransitionComponent={Zoom}
            maxWidth="lg"
            fullWidth
            fullScreen={isFullscreen}
            sx={{ zIndex: 4000 }}
            PaperProps={{
                sx: {
                    borderRadius: isFullscreen ? 0 : 6,
                    background: "linear-gradient(135deg, #ffffff 0%, #fffbf7 100%)",
                    boxShadow: isFullscreen ? "none" : "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
                    maxHeight: isFullscreen ? 'none' : '85vh',
                    overflow: 'hidden'
                }
            }}
        >
            <DialogTitle sx={{ m: 0, p: 3, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid #ffedd5' }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#fff7ed', display: 'flex' }}>
                    <FactCheckIcon sx={{ color: "#f97316", fontSize: 28 }} />
                </Box>
                <Box>
                    <Typography variant="h5" fontWeight={900} color="#431407" sx={{ letterSpacing: -0.5 }}>
                        Vastu Remedy Tracker
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                        Track your Vastu remedies and implementation results
                    </Typography>
                </Box>
                <IconButton
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    sx={{
                        position: 'absolute',
                        right: 56,
                        top: 20,
                        color: "#9a3412",
                        bgcolor: 'transparent',
                        '&:hover': { bgcolor: '#fff7ed' },
                        transition: 'all 0.3s'
                    }}
                >
                    {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 16,
                        top: 20,
                        color: "#9a3412",
                        bgcolor: 'transparent',
                        '&:hover': { bgcolor: '#fff7ed', transform: 'rotate(90deg)' },
                        transition: 'all 0.3s'
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ 
                p: 0, 
                display: 'flex', 
                flexDirection: 'column', 
                overflow: 'hidden', 
                height: isFullscreen ? '100vh' : { xs: '80vh', md: 700 }, 
                maxHeight: isFullscreen ? 'none' : '85vh'
            }}>
                {/* 🔸 DYNAMIC ADMIN BANNER */}
                {bannerUrl && isBannerEnabled && (
                    <Box 
                        sx={{ 
                            width: '100%', 
                            height: { xs: 100, md: 180 }, 
                            flexShrink: 0,
                            overflow: 'hidden',
                            borderBottom: '2px solid #ffedd5',
                            position: 'relative',
                            bgcolor: '#fff7ed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Box 
                            component="img"
                            src={bannerUrl.startsWith('http') ? bannerUrl : `/${bannerUrl}`}
                            alt="Tracker Banner"
                            sx={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover',
                                filter: 'brightness(1)',
                                transition: 'transform 0.5s ease-in-out',
                                '&:hover': { transform: 'scale(1.02)' }
                            }}
                        />
                    </Box>
                )}
                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    flex: 1,
                    minHeight: 0,
                    overflow: { xs: 'auto', md: 'hidden' }
                }}>                    {/* FULL WIDTH PANEL: Activity Logs */}
                    <Box sx={{
                        p: { xs: 2, md: 4 },
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        bgcolor: '#fffbf7',
                        overflow: 'hidden'
                    }}>
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#fef3c7', display: 'flex' }}>
                                <HistoryIcon sx={{ color: "#d97706", fontSize: 24 }} />
                            </Box>
                            <Box>
                                <Typography variant="h6" fontWeight={900} color="#431407">
                                    Assigned Remedies & Progress History
                                </Typography>
                                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                                    Your expert will initiate remedy tracking here as per your project needs.
                                </Typography>
                            </Box>
                        </Stack>

                        <Box className="custom-scrollbar" sx={{
                            flex: 1,
                            overflowY: 'auto',
                            pr: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2.5,
                            '&::-webkit-scrollbar': { width: '6px' },
                            '&::-webkit-scrollbar-track': { background: 'transparent' },
                            '&::-webkit-scrollbar-thumb': { background: '#fed7aa', borderRadius: '10px' },
                            '&::-webkit-scrollbar-thumb:hover': { background: '#f97316' }
                        }}>
                            {historyLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress color="warning" /></Box>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 4 }}>
                                    {submissions.length > 0 ? (
                                        submissions.map((sub) => (
                                            <Accordion 
                                                key={sub.id} 
                                                elevation={0}
                                                disableGutters
                                                defaultExpanded={false}
                                                sx={{ 
                                                    borderRadius: '16px !important', 
                                                    border: '1px solid #fed7aa', 
                                                    bgcolor: '#fff',
                                                    boxShadow: '0 4px 20px rgba(251, 146, 60, 0.05)',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                    mb: 2,
                                                    '&::before': {
                                                        display: 'none'
                                                    },
                                                    '&::after': {
                                                        content: '""',
                                                        position: 'absolute',
                                                        left: 0, top: 0, bottom: 0,
                                                        width: 6,
                                                        bgcolor: sub.status === 'completed' ? '#22c55e' : '#f97316'
                                                    }
                                                }}
                                            >
                                                {/* Header Status Row */}
                                                <AccordionSummary
                                                    expandIcon={<ExpandMoreIcon sx={{ color: '#f97316' }} />}
                                                    sx={{ 
                                                        px: { xs: 2, md: 3 }, 
                                                        py: 1,
                                                        borderBottom: '1px solid #ffedd5',
                                                        '& .MuiAccordionSummary-content': { m: 0 }
                                                    }}
                                                >
                                                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                                            <Chip 
                                                                label={sub.status === 'completed' && !sub.admin_note ? 'USER REPLIED' : (sub.status?.toUpperCase() || 'PENDING')}
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
                                                            {sub.status === 'completed' && !sub.admin_note && (
                                                                <Box sx={{ width: 10, height: 10, bgcolor: '#ef4444', borderRadius: '50%', animation: `${pulse} 2s infinite` }} />
                                                            )}
                                                            {sub.zone && <Chip size="small" label={sub.zone} sx={{ fontWeight: 900, fontSize: '0.65rem', height: 20, bgcolor: '#eff6ff', color: '#1d4ed8', border: 'none' }} />}
                                                            {sub.p_name && <Typography variant="caption" fontWeight={800} color="#94a3b8" sx={{ fontSize: '0.7rem', display: { xs: 'none', sm: 'block' } }}>[{sub.p_name}]</Typography>}
                                                            <Typography variant="body2" fontWeight={800} color="#1e293b" sx={{ ml: { xs: 0, md: 1 }, display: { xs: 'none', md: 'block' } }}>
                                                                {sub.problem ? (sub.problem.length > 50 ? sub.problem.substring(0, 50) + '...' : sub.problem) : 'Remedy Tracker'}
                                                            </Typography>
                                                        </Box>
                                                        <Typography variant="caption" fontWeight={700} color="#94a3b8" sx={{ whiteSpace: 'nowrap', ml: 2 }}>
                                                            {new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </Typography>
                                                    </Box>
                                                </AccordionSummary>

                                                <AccordionDetails sx={{ px: { xs: 2, md: 3 }, pt: 3, pb: 3 }}>
                                                    {/* PROBLEM / CHALLENGE */}
                                                <Box sx={{ mb: 3 }}>
                                                    <Typography variant="caption" fontWeight={900} color="#94a3b8" sx={{ textTransform: 'uppercase', display: 'block', fontSize: '0.65rem', mb: 1, letterSpacing: 1 }}>
                                                        THE CHALLENGE / PROBLEM:
                                                    </Typography>
                                                    <Typography variant="h6" fontWeight={800} color="#1e293b" sx={{ fontSize: '1.1rem', lineHeight: 1.4 }}>
                                                        {sub.problem || 'No problem description provided.'}
                                                    </Typography>
                                                </Box>

                                                {/* RESOLUTION STEPS */}
                                                <Box sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 3, borderLeft: '4px solid #f97316' }}>
                                                    <Typography variant="caption" fontWeight={900} color="#64748b" sx={{ textTransform: 'uppercase', display: 'block', fontSize: '0.65rem', mb: 1 }}>RESOLUTION STEPS provided by Expert:</Typography>
                                                    <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.95rem', lineHeight: 1.6, fontWeight: 500 }}>
                                                        {sub.steps}
                                                    </Typography>
                                                </Box>                                                {/* CHAT / ACTIVITY HISTORY */}
                                                <Box sx={{ mt: 2, mb: 3 }}>
                                                    <Typography variant="caption" fontWeight={900} color="#94a3b8" sx={{ textTransform: 'uppercase', display: 'block', fontSize: '0.65rem', mb: 2, letterSpacing: 1 }}>
                                                        ACTIVITY & CONVERSATION:
                                                    </Typography>
                                                    
                                                    <Stack spacing={2}>
                                                        {chats[sub.id]?.map((msg, mIdx) => (
                                                            <Box key={msg.id || mIdx} sx={{ 
                                                                display: 'flex', 
                                                                flexDirection: 'column',
                                                                alignItems: msg.sender_role === 'expert' ? 'flex-start' : 'flex-end',
                                                                width: '100%'
                                                            }}>
                                                                <Box sx={{ 
                                                                    p: 2, 
                                                                    borderRadius: 4, 
                                                                    maxWidth: '85%',
                                                                    bgcolor: msg.sender_role === 'expert' ? '#fff7ed' : '#f0fdf4',
                                                                    border: msg.sender_role === 'expert' ? '1px solid #fed7aa' : '1px solid #dcfce7',
                                                                    position: 'relative'
                                                                }}>
                                                                    <Typography variant="caption" fontWeight={900} sx={{ 
                                                                        display: 'block', 
                                                                        mb: 0.5, 
                                                                        color: msg.sender_role === 'expert' ? '#f97316' : '#22c55e',
                                                                        fontSize: '0.6rem',
                                                                        textTransform: 'uppercase'
                                                                    }}>
                                                                        {msg.sender_role === 'expert' ? 'Expert Observation' : 'User Response'}
                                                                    </Typography>
                                                                    <Typography variant="body2" sx={{ 
                                                                        color: msg.sender_role === 'expert' ? '#431407' : '#166534',
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

                                                <Divider sx={{ my: 3, borderStyle: 'dashed', borderColor: '#fed7aa' }} />

                                                {/* REPLY INTERFACE */}
                                                <Box sx={{ mt: 2 }}>
                                                    {resultInput.id === sub.id ? (
                                                        <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 4, border: '1px solid #e2e8f0' }}>
                                                            <TextField
                                                                fullWidth
                                                                multiline
                                                                rows={3}
                                                                placeholder="Type your message or implementation update..."
                                                                value={resultInput.experience}
                                                                onChange={(e) => setResultInput({ ...resultInput, experience: e.target.value })}
                                                                sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: '#fff' } }}
                                                            />
                                                            
                                                            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <AssignmentIcon sx={{ fontSize: 18, color: "#94a3b8" }} />
                                                                <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImageSelect} />
                                                                <Button
                                                                    variant="outlined"
                                                                    size="small"
                                                                    startIcon={<AddPhotoAlternateIcon />}
                                                                    onClick={() => fileInputRef.current.click()}
                                                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800, borderColor: '#cbd5e1', color: '#64748b' }}
                                                                >
                                                                    {resultInput.image ? "Change Photo" : "Add Photo"}
                                                                </Button>
                                                                {resultInput.image && (
                                                                    <Box sx={{ width: 40, height: 40, borderRadius: 1.5, overflow: 'hidden', border: '1px solid #fed7aa' }}>
                                                                        <img src={resultInput.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                    </Box>
                                                                )}
                                                            </Box>

                                                            <Stack direction="row" spacing={2}>
                                                                <Button 
                                                                    variant="contained" 
                                                                    onClick={() => {
                                                                        handleSendChat(sub.id, resultInput.experience, resultInput.image);
                                                                        setResultInput({ id: null, experience: "", image: null });
                                                                    }}
                                                                    disabled={sendingChat === sub.id}
                                                                    sx={{ borderRadius: 3, fontWeight: 900, flex: 1, bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}
                                                                >
                                                                    {sendingChat === sub.id ? <CircularProgress size={20} color="inherit" /> : 'Send Message'}
                                                                </Button>
                                                                <Button 
                                                                    variant="outlined" 
                                                                    onClick={() => setResultInput({ id: null, experience: "", image: null })}
                                                                    sx={{ borderRadius: 3, fontWeight: 800, color: '#64748b', borderColor: '#cbd5e1' }}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </Stack>
                                                        </Box>
                                                    ) : reviewInput.id === sub.id ? (
                                                        <Box sx={{ bgcolor: '#fff7ed', p: 2, borderRadius: 4, border: '1px solid #fed7aa' }}>
                                                            <Typography variant="body2" color="#9a3412" fontWeight={800} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <StarIcon sx={{ fontSize: 18 }} /> Rate this Remedy
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                                                <Rating
                                                                    name="remedy-rating"
                                                                    value={reviewInput.rating}
                                                                    onChange={(event, newValue) => {
                                                                        setReviewInput({ ...reviewInput, rating: newValue });
                                                                    }}
                                                                    size="large"
                                                                />
                                                            </Box>
                                                            <TextField
                                                                fullWidth
                                                                multiline
                                                                rows={2}
                                                                placeholder="What do you think about this remedy?"
                                                                value={reviewInput.text}
                                                                onChange={(e) => setReviewInput({ ...reviewInput, text: e.target.value })}
                                                                sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: '#fff' } }}
                                                            />
                                                            <Stack direction="row" spacing={2}>
                                                                <Button 
                                                                    variant="contained" 
                                                                    onClick={() => handleSubmitReview(sub.id)}
                                                                    disabled={reviewLoading}
                                                                    sx={{ borderRadius: 3, fontWeight: 900, flex: 1, bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' } }}
                                                                >
                                                                    {reviewLoading ? <CircularProgress size={20} color="inherit" /> : 'Submit Review'}
                                                                </Button>
                                                                <Button 
                                                                    variant="outlined" 
                                                                    onClick={() => setReviewInput({ id: null, rating: 5, text: "" })}
                                                                    sx={{ borderRadius: 3, fontWeight: 800, color: '#9a3412', borderColor: '#fed7aa' }}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </Stack>
                                                        </Box>
                                                    ) : (
                                                        <Box>
                                                            {(sub.rating && parseInt(sub.rating) > 0) ? (
                                                                <Box sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: 4, border: '1px solid #dcfce7', textAlign: 'center' }}>
                                                                    <Typography variant="body2" color="#166534" fontWeight={800} sx={{ mb: 1 }}>
                                                                        YOUR FEEDBACK
                                                                    </Typography>
                                                                    <Rating value={sub.rating} readOnly size="small" />
                                                                    {sub.review_text && (
                                                                        <Typography variant="body2" sx={{ mt: 1, color: '#166534', fontStyle: 'italic', fontSize: '0.85rem' }}>
                                                                            "{sub.review_text}"
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            ) : (
                                                                <Stack direction="row" spacing={1}>
                                                                    <Button 
                                                                        fullWidth 
                                                                        variant="contained" 
                                                                        onClick={() => setResultInput({ id: sub.id, experience: "", image: null })}
                                                                        startIcon={<ChatBubbleOutlineIcon />}
                                                                        sx={{ 
                                                                            bgcolor: '#fff', 
                                                                            color: '#0f172a',
                                                                            border: '2px solid #0f172a',
                                                                            py: 1, 
                                                                            borderRadius: 3, 
                                                                            fontWeight: 900, 
                                                                            '&:hover': { bgcolor: '#f8fafc', borderColor: '#1e293b' } 
                                                                        }}
                                                                    >
                                                                        {localStorage.getItem("email") === sub.admin_email ? "Reply" : "Update"}
                                                                    </Button>
                                                                </Stack>
                                                            )}
                                                        </Box>
                                                    )}
                                                </Box>
                                                </AccordionDetails>
                                            </Accordion>
                                        ))
                                    ) : (
                                        <Box sx={{ py: 12, textAlign: 'center' }}>
                                            <HistoryIcon sx={{ fontSize: 64, color: "#fed7aa", mb: 2, opacity: 0.5 }} />
                                            <Typography variant="h6" fontWeight={800} color="#9a3412">
                                                No trackable remedies assigned yet.
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary" sx={{ mt: 1, maxWidth: 300, mx: 'auto', fontWeight: 500 }}>
                                                Once your consultant assigns specific remedies, they will appear here for you to report progress.
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, bgcolor: '#ffffff', borderTop: '1px solid #ffedd5' }}>
                <Button
                    onClick={onClose}
                    sx={{
                        color: '#9a3412',
                        fontWeight: 800,
                        px: 3,
                        '&:hover': { bgcolor: '#fff7ed' }
                    }}
                >
                    Close Tracker
                </Button>
            </DialogActions>

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
        </Dialog>
    );
}
