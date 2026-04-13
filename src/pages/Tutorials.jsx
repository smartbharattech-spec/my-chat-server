import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Stack,
    CircularProgress,
    IconButton,
    Paper,
    Dialog,
    DialogContent,
    DialogTitle,
    Button,
    Tooltip,
    Chip
} from "@mui/material";
import PlayCircleFilledWhiteIcon from "@mui/icons-material/PlayCircleFilledWhite";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import WatchLaterIcon from "@mui/icons-material/WatchLater";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { useState, useEffect } from "react";
import { useToast } from "../services/ToastService";
import { motion, AnimatePresence } from "framer-motion";



export default function Tutorials() {
    const { showToast } = useToast();
    const [tutorials, setTutorials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [openModal, setOpenModal] = useState(false); useEffect(() => {
        fetchTutorials();
    }, []);

    const fetchTutorials = async () => {
        try {
            const res = await fetch("/api/tutorials.php");
            const data = await res.json();
            if (data.status === "success") {
                setTutorials(data.data);
            }
        } catch (error) {
            showToast("Error loading tutorials", "error");
        } finally {
            setLoading(false);
        }
    };

    const handlePlayVideo = (tut) => {
        setSelectedVideo(tut);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setTimeout(() => setSelectedVideo(null), 300);
    };

    const getYouTubeId = (url) => {
        if (!url) return null;
        try {
            if (url.includes("youtube.com/watch?v=")) {
                return new URL(url).searchParams.get("v");
            } else if (url.includes("youtu.be/")) {
                return url.split("/").pop().split("?")[0];
            } else if (url.includes("youtube.com/embed/")) {
                return url.split("/").pop().split("?")[0];
            }
        } catch (e) {
            console.error("Invalid URL", e);
        }
        return null;
    };

    const getVideoSource = (tut) => {
        if (!tut) return "";
        if (tut.video_filename) {
            return `/api/uploads/tutorials/${tut.video_filename}`;
        }
        const videoId = getYouTubeId(tut.video_url);
        return videoId ? `https://www.youtube.com/embed/${videoId}` : tut.video_url;
    };

    const getThumbnail = (tut) => {
        const ytId = getYouTubeId(tut.video_url);
        if (ytId) {
            return `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
        }
        return null; // Fallback to gradient/icon
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
    };

    return (
        <Box sx={{ width: "100%", p: { xs: 2, md: 4 }, background: "transparent", minHeight: "calc(100vh - 100px)" }}>
            {/* Header Section */}
            <Box component={motion.div} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} sx={{ mb: 4 }}>
                <Stack direction="row" alignItems="center" spacing={3}>
                    <Box sx={{
                        p: 2,
                        borderRadius: "20px",
                        background: "linear-gradient(135deg, #f97316, #ea580c)",
                        color: "#fff",
                        boxShadow: "0 10px 25px rgba(234, 88, 12, 0.3)",
                        display: "flex"
                    }}>
                        <VideoLibraryIcon sx={{ fontSize: 32 }} />
                    </Box>
                    <Box>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: "#431407", letterSpacing: "-0.03em", mb: 0.5 }}>
                            Video Tutorials
                        </Typography>
                        <Typography variant="body1" sx={{ color: "#7c2d12", opacity: 0.7, fontWeight: 600 }}>
                            Master MyVastuTool with our step-by-step video guides.
                        </Typography>
                    </Box>
                </Stack>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                    <CircularProgress sx={{ color: "#f97316" }} />
                </Box>
            ) : tutorials.length === 0 ? (
                <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 6, bgcolor: 'rgba(255,255,255,0.4)', border: '2px dashed #fed7aa' }}>
                    <VideoLibraryIcon sx={{ fontSize: 60, color: "#9a3412", opacity: 0.2, mb: 2 }} />
                    <Typography sx={{ color: '#9a3412', fontWeight: 800, fontSize: "1.1rem" }}>
                        No tutorials available yet.
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#c2410c', opacity: 0.6 }}>Check back soon for new content!</Typography>
                </Paper>
            ) : (
                <Stack spacing={6} component={motion.div} variants={containerVariants} initial="hidden" animate="visible" sx={{ maxWidth: "1200px", mx: "auto" }}>
                    {tutorials.map((tut) => {
                        const thumbnail = getThumbnail(tut);
                        return (
                            <Box key={tut.id} component={motion.div} variants={cardVariants}>
                                <Card
                                    whileHover={{ y: -12, scale: 1.01 }}
                                    onClick={() => handlePlayVideo(tut)}
                                    sx={{
                                        borderRadius: "40px",
                                        display: 'flex',
                                        flexDirection: { xs: 'column', md: 'row' },
                                        cursor: 'pointer',
                                        border: "2px solid #fed7aa",
                                        background: "#ffffff",
                                        overflow: 'hidden',
                                        position: 'relative',
                                        boxShadow: "0 15px 45px rgba(124, 45, 18, 0.06)",
                                        minHeight: { md: "380px" },
                                        transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                                        "&:hover": {
                                            boxShadow: "0 45px 90px rgba(154, 52, 18, 0.18)",
                                            borderColor: "#f97316",
                                            "& .thumb-img": { transform: "scale(1.1)" }
                                        }
                                    }}
                                >
                                    {/* Video Thumbnail Area (Left Side on Desktop) */}
                                    <Box sx={{
                                        position: 'relative',
                                        width: { xs: '100%', md: '50%' },
                                        minHeight: { xs: "250px", md: "100%" },
                                        overflow: "hidden",
                                        background: "#000"
                                    }}>
                                        {thumbnail ? (
                                            <Box
                                                component="img"
                                                className="thumb-img"
                                                src={thumbnail}
                                                sx={{
                                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                                    objectFit: 'cover', transition: "transform 0.6s ease", opacity: 0.8
                                                }}
                                            />
                                        ) : (
                                            <Box sx={{
                                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                                background: "linear-gradient(45deg, #431407, #9a3412)",
                                                display: "flex", alignItems: "center", justifyContent: "center"
                                            }}>
                                                <VideoLibraryIcon sx={{ fontSize: 100, color: "rgba(255,255,255,0.1)" }} />
                                            </Box>
                                        )}

                                        {/* Premium Overlay */}
                                        <Box sx={{
                                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                            background: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 100%)",
                                            zIndex: 1,
                                            display: { xs: 'none', md: 'block' }
                                        }} />

                                        {/* Play Button Overlay */}
                                        <Box sx={{
                                            position: 'absolute', top: "50%", left: "50%",
                                            transform: "translate(-50%, -50%)",
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            zIndex: 2
                                        }}>
                                            <PlayCircleFilledWhiteIcon
                                                className="play-btn"
                                                sx={{
                                                    fontSize: 100, color: '#fff', opacity: 0.9,
                                                    transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                                    filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.3))"
                                                }}
                                            />
                                        </Box>
                                    </Box>

                                    {/* Content Area (Right Side on Desktop) */}
                                    <CardContent sx={{
                                        flex: 1,
                                        p: { xs: 4, md: 6 },
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        background: "#fff"
                                    }}>
                                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                            <Box sx={{
                                                bgcolor: "#fff7ed", color: "#f97316", px: 2, py: 0.8,
                                                borderRadius: "12px", fontSize: "0.85rem", fontWeight: 900,
                                                letterSpacing: 1, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 1
                                            }}>
                                                <WatchLaterIcon sx={{ fontSize: 16 }} />
                                                Tutorial
                                            </Box>
                                        </Stack>
                                        <Typography variant="h3" sx={{ fontWeight: 900, color: "#431407", mb: 2, letterSpacing: -1.5, lineHeight: 1 }}>
                                            {tut.title}
                                        </Typography>
                                        <Typography variant="h6" sx={{
                                            color: "#7c2d12", opacity: 0.7, fontWeight: 500, lineHeight: 1.6, mb: 4,
                                            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                        }}>
                                            {tut.description}
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            startIcon={<PlayArrowIcon sx={{ fontSize: 24 }} />}
                                            sx={{
                                                borderRadius: "20px",
                                                bgcolor: "#ea580c", color: "#fff",
                                                fontWeight: 900, textTransform: "none", py: 2.5, px: 6,
                                                fontSize: "1.2rem", width: "fit-content",
                                                boxShadow: "0 12px 28px rgba(234, 88, 12, 0.3)",
                                                "&:hover": { bgcolor: "#c2410c", boxShadow: "0 18px 35px rgba(234, 88, 12, 0.4)" }
                                            }}
                                        >
                                            Watch Full Video
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Box>
                        );
                    })}
                </Stack>
            )}

            {/* Video Playback Modal */}
            <Dialog
                open={openModal}
                onClose={handleCloseModal}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: "28px",
                        overflow: 'hidden',
                        bgcolor: '#000',
                        position: 'relative',
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                    }
                }}
            >
                <DialogTitle sx={{
                    position: 'absolute', right: 16, top: 16, zIndex: 10, p: 0
                }}>
                    <Tooltip title="Close">
                        <IconButton onClick={handleCloseModal} sx={{
                            color: '#fff', bgcolor: 'rgba(0,0,0,0.3)', backdropFilter: "blur(10px)",
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' }
                        }}>
                            <CloseOutlinedIcon />
                        </IconButton>
                    </Tooltip>
                </DialogTitle>

                <DialogContent sx={{ p: 0, lineHeight: 0 }}>
                    {selectedVideo && (
                        <Box sx={{ width: '100%', pt: '56.25%', position: 'relative' }}>
                            {selectedVideo.video_filename ? (
                                <video
                                    controls
                                    autoPlay
                                    style={{
                                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                        objectFit: 'contain'
                                    }}
                                    src={getVideoSource(selectedVideo)}
                                />
                            ) : (
                                <iframe
                                    src={`${getVideoSource(selectedVideo)}?autoplay=1`}
                                    style={{
                                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                        border: 'none'
                                    }}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            )}
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}
