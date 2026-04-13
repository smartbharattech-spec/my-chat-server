import { Box, Button, Container, Paper, Typography } from "@mui/material";
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../services/AuthService";
import { useToast } from "../services/ToastService";

export default function VerifyEmailPending() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { showToast } = useToast();
    const email = localStorage.getItem("email");
    const [resending, setResending] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleResend = async () => {
        if (!email) {
            showToast("No email found. Please login again.", "error");
            return;
        }

        setResending(true);
        try {
            const response = await fetch("/api/resend_verification.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            if (data.status === "success") {
                showToast(data.message, "success");
            } else {
                showToast(data.message, "error");
            }
        } catch (error) {
            showToast("Failed to resend email. Please try again.", "error");
        } finally {
            setResending(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "radial-gradient(circle at center, #fff7ed 0%, #ffedd5 100%)",
                p: 2
            }}
        >
            <Container maxWidth="xs">
                <Paper
                    elevation={6}
                    sx={{
                        p: 4,
                        textAlign: "center",
                        borderRadius: 6,
                        background: "rgba(255, 255, 255, 0.9)",
                        backdropFilter: "blur(10px)",
                    }}
                >
                    <Box
                        sx={{
                            width: 80,
                            height: 80,
                            borderRadius: "50%",
                            bgcolor: "#fff7ed",
                            color: "#f97316",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mx: "auto",
                            mb: 3,
                            boxShadow: "0 8px 16px rgba(249, 115, 22, 0.2)"
                        }}
                    >
                        <MarkEmailUnreadIcon sx={{ fontSize: 40 }} />
                    </Box>

                    <Typography variant="h5" fontWeight={800} color="#431407" gutterBottom>
                        Verify Your Email
                    </Typography>

                    <Typography variant="body1" color="#7c2d12" sx={{ mb: 2 }}>
                        We've sent a verification link to <strong>{email}</strong>.
                    </Typography>

                    <Typography variant="body2" color="#7c2d12" sx={{ mb: 4, opacity: 0.8 }}>
                        Please check your inbox (and spam folder) and click the link to activate your account. You won't be able to access the dashboard until you verify.
                    </Typography>

                    <Button
                        variant="contained"
                        onClick={handleResend}
                        fullWidth
                        disabled={resending}
                        sx={{
                            mb: 2,
                            borderRadius: 3,
                            textTransform: "none",
                            fontWeight: 700,
                            background: "linear-gradient(90deg, #f97316, #ea580c)",
                            color: "#fff",
                            py: 1.2,
                            "&:hover": {
                                background: "linear-gradient(90deg, #ea580c, #c2410c)",
                            }
                        }}
                    >
                        {resending ? "Resending..." : "Resend Verification Email"}
                    </Button>

                    <Button
                        variant="outlined"
                        onClick={handleLogout}
                        fullWidth
                        sx={{
                            borderRadius: 3,
                            textTransform: "none",
                            fontWeight: 700,
                            color: "#f97316",
                            borderColor: "#fed7aa",
                            "&:hover": {
                                borderColor: "#f97316",
                                bgcolor: "#fff7ed"
                            }
                        }}
                    >
                        Back to Login
                    </Button>
                </Paper>
            </Container>
        </Box>
    );
}
