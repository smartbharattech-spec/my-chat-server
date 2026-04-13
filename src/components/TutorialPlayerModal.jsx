import React from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Box,
    Tooltip
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";

export default function TutorialPlayerModal({ open, onClose, videoUrl, videoFilename, title }) {
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

    const getVideoSource = () => {
        if (videoFilename) {
            return `/api/uploads/tutorials/${videoFilename}`;
        }
        const videoId = getYouTubeId(videoUrl);
        return videoId ? `https://www.youtube.com/embed/${videoId}` : videoUrl;
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: "20px",
                    overflow: 'hidden',
                    bgcolor: '#000',
                    position: 'relative'
                }
            }}
            sx={{ zIndex: 3500 }}
        >
            <DialogTitle sx={{
                position: 'absolute', right: 8, top: 8, zIndex: 10, p: 0
            }}>
                <Tooltip title="Close">
                    <IconButton onClick={onClose} sx={{
                        color: '#fff', bgcolor: 'rgba(0,0,0,0.3)', backdropFilter: "blur(10px)",
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' }
                    }}>
                        <CloseOutlinedIcon />
                    </IconButton>
                </Tooltip>
            </DialogTitle>

            <DialogContent sx={{ p: 0, lineHeight: 0 }}>
                <Box sx={{ width: '100%', pt: '56.25%', position: 'relative' }}>
                    {videoFilename ? (
                        <video
                            controls
                            autoPlay
                            style={{
                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                objectFit: 'contain'
                            }}
                            src={getVideoSource()}
                        />
                    ) : (
                        <iframe
                            src={videoUrl ? `${getVideoSource()}?autoplay=1` : ""}
                            style={{
                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                border: 'none'
                            }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    );
}
