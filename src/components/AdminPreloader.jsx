import { Box, CircularProgress, Typography } from "@mui/material";

const AdminPreloader = ({ inline = false }) => {
    if (inline) {
        return (
            <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress sx={{ color: "#f97316", mb: 1 }} size={40} thickness={4} />
                <Typography variant="caption" sx={{ color: "#9a3412", fontWeight: 700, letterSpacing: 1 }}>
                    LOADING DATA
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255, 247, 237, 0.95)", // Light amber/white background
                zIndex: 9999,
                backdropFilter: "blur(8px)",
            }}
        >
            <CircularProgress sx={{ color: "#f97316", mb: 2 }} size={60} thickness={4} />
            <Typography
                variant="h6"
                sx={{
                    color: "#9a3412",
                    fontWeight: 900,
                    letterSpacing: 1.5,
                    animation: "pulse 1.5s infinite ease-in-out",
                    "@keyframes pulse": {
                        "0%": { opacity: 0.6, transform: "scale(0.98)" },
                        "50%": { opacity: 1, transform: "scale(1)" },
                        "100%": { opacity: 0.6, transform: "scale(0.98)" },
                    },
                }}
            >
                ADMIN PORTAL
            </Typography>
        </Box>
    );
};

export default AdminPreloader;
