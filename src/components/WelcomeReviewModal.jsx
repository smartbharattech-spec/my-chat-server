import {
    Dialog,
    DialogContent,
    Box,
    Typography,
    Button,
    Rating,
    TextField,
    IconButton,
    Card,
    CardContent,
    Stack,
    Fade,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    ToggleButton,
    ToggleButtonGroup,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tabs,
    Tab,
    Grid,
    CircularProgress,
} from "@mui/material";
import Divider from '@mui/material/Divider';
import { useState, useEffect } from "react";
import CloseIcon from "@mui/icons-material/Close";
import StarIcon from "@mui/icons-material/Star";
import RateReviewIcon from "@mui/icons-material/RateReview";
import GroupsIcon from "@mui/icons-material/Groups";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { useToast } from "../services/ToastService";

export default function WelcomeReviewModal({ open, onClose, projectIssues = [] }) {
    const { showToast } = useToast();
    const [view, setView] = useState("welcome"); // welcome, submit, view_all, success
    const [submitting, setSubmitting] = useState(false);
    const [publicReviews, setPublicReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);

    // Multi-category reviews state
    const [categoryReviews, setCategoryReviews] = useState({
        General: { rating: 5, comment: "", icon: "✨", label: "General Experience", isSaving: false, isSaved: false },
        Health: { rating: 5, comment: "", icon: "⚕️", label: "Health & Wellness", isSaving: false, isSaved: false },
        Wealth: { rating: 5, comment: "", icon: "💰", label: "Wealth & Prosperity", isSaving: false, isSaved: false },
        Relationship: { rating: 5, comment: "", icon: "❤️", label: "Love & Relationship", isSaving: false, isSaved: false }
    });

    const email = localStorage.getItem("email");

    useEffect(() => {
        if (view === "view_all") {
            fetchReviews();
        }
    }, [view]);

    const fetchReviews = async () => {
        setLoadingReviews(true);
        try {
            const res = await fetch("api/reviews.php");
            const data = await res.json();
            if (data.status === "success") setPublicReviews(data.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingReviews(false);
        }
    };

    const handleUpdateReview = (category, field, value) => {
        setCategoryReviews(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [field]: value,
                isSaved: false // Reset saved status on edit
            }
        }));
    };

    const handleSaveIndividualReview = async (category) => {
        const review = categoryReviews[category];
        if (!review.comment.trim()) {
            showToast(`Please write a comment for ${category}`, "warning");
            return;
        }

        setCategoryReviews(prev => ({
            ...prev,
            [category]: { ...prev[category], isSaving: true }
        }));

        try {
            const res = await fetch("/api/reviews.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "submit",
                    email,
                    remedy_name: category,
                    rating: review.rating,
                    comment: review.comment
                })
            });
            const data = await res.json();
            if (data.status === "success") {
                setCategoryReviews(prev => ({
                    ...prev,
                    [category]: { ...prev[category], isSaving: false, isSaved: true }
                }));
                showToast(`${category} review saved!`, "success");
            } else {
                showToast(data.message || "Save failed", "error");
                setCategoryReviews(prev => ({
                    ...prev,
                    [category]: { ...prev[category], isSaving: false }
                }));
            }
        } catch (e) {
            showToast("Save failed", "error");
            setCategoryReviews(prev => ({
                ...prev,
                [category]: { ...prev[category], isSaving: false }
            }));
        }
    };

    const handleSubmitBulk = async () => {
        // Filter reviews that have at least some comment AND are not already saved
        const unsavedReviews = Object.entries(categoryReviews)
            .filter(([key, data]) => data.comment.trim().length > 0 && !data.isSaved)
            .map(([key, data]) => ({
                remedy_name: key,
                rating: data.rating,
                comment: data.comment
            }));

        // If no unsaved reviews but some are saved, just go to success
        const hasSavedReviews = Object.values(categoryReviews).some(r => r.isSaved);

        if (unsavedReviews.length === 0) {
            if (hasSavedReviews) {
                setView("success");
            } else {
                showToast("Please provide at least one comment", "warning");
            }
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/reviews.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "submit_bulk",
                    email,
                    reviews: unsavedReviews
                })
            });
            const data = await res.json();
            if (data.status === "success") {
                setView("success");
            } else {
                showToast(data.message || "Submission failed", "error");
            }
        } catch (e) {
            showToast("Submission failed", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const graphicUrl = "/vastu_review_welcome_graphic_1770062777717.png";

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            disableScrollLock={false}
            sx={{ zIndex: 4000 }}
            PaperProps={{
                sx: {
                    background: "linear-gradient(135deg, #fff 0%, #fff7ed 100%)",
                    borderRadius: 6,
                    maxHeight: '90vh'
                }
            }}
        >
            <DialogContent sx={{ p: 0, position: "relative", display: 'flex', flexDirection: 'column' }}>
                <IconButton
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    sx={{
                        position: "absolute",
                        right: 16,
                        top: 12,
                        zIndex: 10,
                        bgcolor: "rgba(255,117,22,0.1)",
                        color: "#f97316",
                        width: 44,
                        height: 44,
                        "&:hover": { bgcolor: "rgba(255,117,22,0.2)" },
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                >
                    <CloseIcon />
                </IconButton>

                <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, flexGrow: 1, height: '100%' }}>
                    <Box
                        sx={{
                            flex: 1,
                            flexShrink: 0,
                            background: `url(${graphicUrl}) center/cover no-repeat`,
                            position: "relative",
                            display: "flex",
                            alignItems: "flex-end",
                            p: 6,
                            minHeight: { xs: 300, md: 'auto' }
                        }}
                    >
                        <Box sx={{
                            bgcolor: "rgba(255,117,22,0.95)",
                            p: 3,
                            borderRadius: 4,
                            backdropFilter: "blur(8px)",
                            color: "#fff",
                            boxShadow: "0 15px 35px rgba(0,0,0,0.2)",
                            maxWidth: 400
                        }}>
                            <Typography variant="h5" fontWeight={900} sx={{ mb: 1 }}>Welcome back!</Typography>
                            <Typography variant="body1" sx={{ opacity: 0.9, lineHeight: 1.4, fontWeight: 600 }}>
                                Your wisdom helps us build the most precise Tracker in the world.
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ flex: 1, p: { xs: 3, md: 4, lg: 5 }, display: "flex", flexDirection: "column", minWidth: 0, overflow: 'hidden', height: { md: 'auto', lg: '80vh' } }}>
                        {view === "welcome" && (
                            <Fade in>
                                <Box sx={{ maxWidth: 500, mx: 'auto', textAlign: 'center' }}>
                                    <Typography variant="h4" fontWeight={900} color="#431407" gutterBottom>
                                        Review - Write Your Progress 🚀
                                    </Typography>
                                    <Typography variant="body1" color="#7c2d12" sx={{ mb: 4, opacity: 0.8, fontWeight: 600 }}>
                                        It will help you to get precise Support according to your needs and requirements.
                                    </Typography>

                                    <Stack spacing={2}>
                                        <Button
                                            fullWidth
                                            type="button"
                                            variant="contained"
                                            size="large"
                                            startIcon={<RateReviewIcon />}
                                            onClick={() => setView("submit")}
                                            sx={{
                                                borderRadius: 3,
                                                py: 2,
                                                fontWeight: 800,
                                                bgcolor: "#f97316",
                                                color: "#fff",
                                                fontSize: '1.2rem',
                                                "&:hover": { bgcolor: "#ea580c" }
                                            }}
                                        >
                                            Write a Review
                                        </Button>
                                        <Button
                                            fullWidth
                                            type="button"
                                            variant="outlined"
                                            size="large"
                                            startIcon={<GroupsIcon />}
                                            onClick={() => setView("view_all")}
                                            sx={{
                                                borderRadius: 3,
                                                py: 1.5,
                                                fontWeight: 700,
                                                color: "#9a3412",
                                                borderColor: "#fdba74"
                                            }}
                                        >
                                            View Community Reviews
                                        </Button>
                                    </Stack>

                                    <Box sx={{ mt: 6 }}>
                                        <Divider sx={{ mb: 2 }}>
                                            <Typography variant="caption" color="text.disabled" sx={{ letterSpacing: 2 }}>TRUSTED BY 1000+ USERS</Typography>
                                        </Divider>
                                        <Stack direction="row" spacing={1} justifyContent="center">
                                            {[1, 2, 3, 4, 5].map(i => <StarIcon key={i} sx={{ color: '#fbbf24', fontSize: 30 }} />)}
                                        </Stack>
                                    </Box>
                                </Box>
                            </Fade>
                        )}

                        {view === "submit" && (
                            <Fade in>
                                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="h4" fontWeight={900} color="#431407" gutterBottom>
                                        Write Your Reviews
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                        You can provide ratings and comments for multiple categories at once.
                                    </Typography>

                                    <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1.5, '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#f97316', borderRadius: 3 } }}>
                                        <Stack spacing={2.5}>
                                            {Object.entries(categoryReviews).map(([key, data]) => (
                                                <Box key={key}>
                                                    <Card
                                                        variant="outlined"
                                                        sx={{
                                                            borderRadius: 4,
                                                            borderColor: data.isSaved ? '#16a34a' : '#fed7aa',
                                                            bgcolor: '#fff',
                                                            transition: 'all 0.3s ease',
                                                            boxShadow: data.isSaved ? '0 4px 12px rgba(22, 163, 74, 0.1)' : '0 2px 8px rgba(0,0,0,0.02)',
                                                            '&:hover': {
                                                                boxShadow: '0 8px 16px rgba(0,0,0,0.05)',
                                                                transform: 'translateY(-2px)'
                                                            }
                                                        }}
                                                    >
                                                        <CardContent sx={{ p: 2.5 }}>
                                                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                                    <Typography fontSize="1.2rem">{data.icon}</Typography>
                                                                    <Typography variant="body2" fontWeight={800} color="#431407">
                                                                        {data.label}
                                                                    </Typography>
                                                                </Stack>
                                                                {data.isSaved && (
                                                                    <Chip
                                                                        label="Saved"
                                                                        size="small"
                                                                        color="success"
                                                                        icon={<CheckCircleIcon sx={{ fontSize: '1rem !important' }} />}
                                                                        sx={{ fontWeight: 700, height: 24 }}
                                                                    />
                                                                )}
                                                            </Stack>

                                                            <Box sx={{ mb: 2 }}>
                                                                <Rating
                                                                    value={data.rating}
                                                                    onChange={(e, v) => handleUpdateReview(key, 'rating', v)}
                                                                    size="medium"
                                                                />
                                                            </Box>

                                                            <TextField
                                                                fullWidth
                                                                placeholder={`Tell us about your ${key} experience...`}
                                                                multiline
                                                                rows={2}
                                                                value={data.comment}
                                                                onChange={(e) => handleUpdateReview(key, 'comment', e.target.value)}
                                                                variant="filled"
                                                                sx={{
                                                                    mb: 2,
                                                                    '& .MuiFilledInput-root': { bgcolor: '#fff7ed', borderRadius: 2 },
                                                                    '& .MuiFilledInput-underline:before, & .MuiFilledInput-underline:after': { display: 'none' }
                                                                }}
                                                            />

                                                            <Button
                                                                fullWidth
                                                                type="button"
                                                                variant={data.isSaved ? "outlined" : "contained"}
                                                                color={data.isSaved ? "success" : "primary"}
                                                                onClick={() => handleSaveIndividualReview(key)}
                                                                disabled={data.isSaving}
                                                                size="small"
                                                                sx={{
                                                                    borderRadius: 2,
                                                                    fontWeight: 700,
                                                                    py: 1,
                                                                    bgcolor: data.isSaved ? 'transparent' : '#f97316',
                                                                    borderColor: data.isSaved ? '#16a34a' : 'transparent',
                                                                    color: data.isSaved ? '#16a34a' : '#fff',
                                                                    '&:hover': {
                                                                        bgcolor: data.isSaved ? 'rgba(22, 163, 74, 0.05)' : '#ea580c'
                                                                    }
                                                                }}
                                                            >
                                                                {data.isSaving ? <CircularProgress size={20} color="inherit" /> : data.isSaved ? "Update Review" : "Save Review"}
                                                            </Button>
                                                        </CardContent>
                                                    </Card>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Box>

                                    <Divider sx={{ my: 3 }} />

                                    <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 'auto' }}>
                                        <Button
                                            variant="text"
                                            type="button"
                                            onClick={() => setView("welcome")}
                                            sx={{ fontWeight: 700, color: '#9a3412', px: 4 }}
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            variant="contained"
                                            type="button"
                                            onClick={handleSubmitBulk}
                                            disabled={submitting}
                                            sx={{
                                                borderRadius: 3,
                                                px: 6,
                                                py: 1.5,
                                                fontWeight: 800,
                                                bgcolor: "#431407",
                                                color: "#fff",
                                                "&:hover": { bgcolor: "#000" }
                                            }}
                                        >
                                            {submitting ? <CircularProgress size={24} color="inherit" /> : "Submit All & Finish"}
                                        </Button>
                                    </Stack>
                                </Box>
                            </Fade>
                        )}

                        {view === "view_all" && (
                            <Fade in>
                                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="h5" fontWeight={900} color="#431407" gutterBottom>
                                        Community Reviews
                                    </Typography>

                                    <Box sx={{ flexGrow: 1, overflowY: 'auto', mt: 2, pr: 1 }}>
                                        {loadingReviews ? (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                                                <CircularProgress sx={{ color: '#f97316' }} />
                                            </Box>
                                        ) : publicReviews.length > 0 ? (
                                            <List>
                                                {publicReviews.slice(0, 20).map((rev) => (
                                                    <ListItem key={rev.id} alignItems="flex-start" sx={{ mb: 2, bgcolor: '#fff', borderRadius: 3, border: '1px solid #ffedd5', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                                        <ListItemAvatar>
                                                            <Avatar sx={{ bgcolor: '#f97316' }}>{rev.firstname?.charAt(0) || 'U'}</Avatar>
                                                        </ListItemAvatar>
                                                        <ListItemText
                                                            primary={
                                                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                                                        <Typography variant="subtitle2" fontWeight={800} noWrap>
                                                                            {rev.firstname || (rev.email && rev.email.split('@')[0]) || "User"}
                                                                        </Typography>
                                                                        <Chip
                                                                            label={rev.remedy_name || 'General'}
                                                                            size="small"
                                                                            variant="outlined"
                                                                            sx={{
                                                                                height: 'auto',
                                                                                minHeight: 20,
                                                                                py: 0.2,
                                                                                fontSize: 10,
                                                                                mt: 0.5,
                                                                                borderColor: '#fed7aa',
                                                                                color: '#f97316',
                                                                                maxWidth: '100%',
                                                                                '& .MuiChip-label': {
                                                                                    whiteSpace: 'normal',
                                                                                    wordBreak: 'break-word',
                                                                                    display: 'block',
                                                                                    px: 1
                                                                                }
                                                                            }}
                                                                        />
                                                                    </Box>
                                                                    <Rating value={Number(rev.rating)} size="small" readOnly sx={{ flexShrink: 0, mt: 0.5 }} />
                                                                </Stack>
                                                            }
                                                            secondary={
                                                                <Typography variant="body2" sx={{ my: 1, color: '#431407', fontStyle: 'italic' }}>"{rev.comment}"</Typography>
                                                            }
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        ) : (
                                            <Typography align="center" color="text.secondary">No reviews yet. Be the first to share your experience!</Typography>
                                        )}
                                    </Box>

                                    <Button
                                        onClick={() => setView("welcome")}
                                        sx={{ mt: 2, fontWeight: 700, color: '#9a3412', alignSelf: 'center' }}
                                    >
                                        Go Back
                                    </Button>
                                </Box>
                            </Fade>
                        )}
                        {view === "success" && (
                            <Fade in>
                                <Box sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    py: 4
                                }}>
                                    <CheckCircleIcon sx={{ fontSize: 100, color: '#16a34a', mb: 3 }} />
                                    <Typography variant="h4" fontWeight={900} color="#431407" gutterBottom>
                                        Thank You! 🌟
                                    </Typography>
                                    <Typography variant="h6" color="#7c2d12" sx={{ mb: 4, opacity: 0.8, maxWidth: 400 }}>
                                        Your multi-category feedback has been submitted successfully. It helps us build a better tool for everyone.
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        type="button"
                                        onClick={onClose}
                                        sx={{
                                            borderRadius: 3,
                                            px: 8,
                                            py: 2,
                                            fontWeight: 800,
                                            bgcolor: "#431407",
                                            color: "#fff",
                                            fontSize: '1.1rem',
                                            "&:hover": { bgcolor: "#000" }
                                        }}
                                    >
                                        Return to Project
                                    </Button>
                                </Box>
                            </Fade>
                        )}
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
}
