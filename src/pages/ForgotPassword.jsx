import { useState } from "react";
import {
    Box,
    Button,
    TextField,
    Typography,
    Container,
    Paper,
    CircularProgress,
    IconButton,
    InputAdornment
} from "@mui/material";
import LockResetIcon from "@mui/icons-material/LockReset";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import SecurityIcon from '@mui/icons-material/Security';
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import Link from "@mui/material/Link";
import { useToast } from "../services/ToastService";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [step, setStep] = useState(1); // 1: Email, 2: Verify Code, 3: New Password
    const [loading, setLoading] = useState(false);

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Step 1: Send Verification Code
    const handleSendCode = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/auth_request.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();

            if (data.status) {
                showToast(data.message, "success");
                setStep(2);
            } else {
                showToast(data.message, "error");
            }
        } catch (error) {
            showToast("Something went wrong. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify Code
    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/auth_request.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }),
            });
            const data = await response.json();

            if (data.status) {
                showToast("Code verified successfully", "success");
                setStep(3);
            } else {
                showToast(data.message, "error");
            }
        } catch (error) {
            showToast("Something went wrong. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/auth_reset_password.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp, new_password: newPassword }),
            });
            const data = await response.json();

            if (data.status) {
                showToast(data.message, "success");
                setTimeout(() => navigate("/login"), 1500);
            } else {
                showToast(data.message, "error");
            }
        } catch (err) {
            showToast("Server error", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: 2,
            }}
        >
            <Container maxWidth="xs">
                <Paper
                    elevation={6}
                    sx={{ p: 4, borderRadius: 4, borderTop: "6px solid #f97316" }}
                >
                    {/* Header */}
                    <Box
                        sx={{
                            textAlign: "center",
                            mb: 4,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 1,
                        }}
                    >
                        <Box
                            sx={{
                                width: 56,
                                height: 56,
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, #f97316, #ea580c)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                boxShadow: "0 8px 20px rgba(249,115,22,0.4)",
                            }}
                        >
                            <LockResetIcon sx={{ fontSize: 26 }} />
                        </Box>

                        <Typography variant="h5" sx={{ fontWeight: 700, color: "#9a3412" }}>
                            {step === 1 && "Start Recovery"}
                            {step === 2 && "Verification"}
                            {step === 3 && "New Password"}
                        </Typography>

                        <Typography variant="body2" sx={{ color: "#7c2d12", maxWidth: 260 }}>
                            {step === 1 && "Enter your email to receive a verification code."}
                            {step === 2 && "Enter the 6-digit code sent to your email."}
                            {step === 3 && "Create a secure new password for your account."}
                        </Typography>
                    </Box>

                    {/* Form Step 1: Email */}
                    {step === 1 && (
                        <Box component="form" onSubmit={handleSendCode}>
                            <TextField
                                label="Email Address"
                                type="email"
                                fullWidth
                                required
                                margin="normal"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                InputProps={{
                                    startAdornment: <MarkEmailReadIcon color="action" sx={{ mr: 1 }} />,
                                }}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                disabled={loading}
                                sx={{
                                    mt: 3,
                                    py: 1.3,
                                    fontWeight: 700,
                                    color: "#fff",
                                    background: "linear-gradient(90deg, #f97316, #ea580c)",
                                    "&:hover": {
                                        background: "linear-gradient(90deg, #ea580c, #c2410c)",
                                    },
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : "Send Verification Code"}
                            </Button>
                        </Box>
                    )}

                    {/* Form Step 2: Verify Code */}
                    {step === 2 && (
                        <Box component="form" onSubmit={handleVerifyCode}>
                            <TextField
                                label="Verification Code"
                                type="text"
                                fullWidth
                                required
                                margin="normal"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                InputProps={{
                                    startAdornment: <SecurityIcon color="action" sx={{ mr: 1 }} />,
                                }}
                                inputProps={{
                                    maxLength: 6,
                                    style: { letterSpacing: 8, textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }
                                }}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                disabled={loading}
                                sx={{
                                    mt: 3,
                                    py: 1.3,
                                    fontWeight: 700,
                                    color: "#fff",
                                    background: "linear-gradient(90deg, #f97316, #ea580c)",
                                    "&:hover": {
                                        background: "linear-gradient(90deg, #ea580c, #c2410c)",
                                    },
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : "Verify Code"}
                            </Button>

                            <Button
                                onClick={() => setStep(1)}
                                fullWidth
                                sx={{
                                    mt: 1,
                                    textTransform: "none",
                                    color: "#ffffff",
                                    bgcolor: "rgba(0,0,0,0.1)",
                                    "&:hover": { bgcolor: "rgba(0,0,0,0.2)" }
                                }}
                            >
                                Incorrect Email?
                            </Button>
                        </Box>
                    )}

                    {/* Form Step 3: New Password */}
                    {step === 3 && (
                        <Box component="form" onSubmit={handleResetPassword}>
                            <TextField
                                label="New Password"
                                type={showPassword ? "text" : "password"}
                                fullWidth
                                required
                                margin="normal"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                InputProps={{
                                    startAdornment: <VpnKeyIcon color="action" sx={{ mr: 1 }} />,
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                disabled={loading}
                                sx={{
                                    mt: 3,
                                    py: 1.3,
                                    fontWeight: 700,
                                    color: "#fff",
                                    background: "linear-gradient(90deg, #f97316, #ea580c)",
                                    "&:hover": {
                                        background: "linear-gradient(90deg, #ea580c, #c2410c)",
                                    },
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : "Reset Password"}
                            </Button>
                        </Box>
                    )}

                    {/* Back to Login */}
                    <Typography variant="body2" align="center" sx={{ mt: 3 }}>
                        Remembered?{" "}
                        <Link
                            component={RouterLink}
                            to="/login"
                            underline="none"
                            sx={{ fontWeight: 600, color: "#c2410c" }}
                        >
                            Login
                        </Link>
                    </Typography>
                </Paper>
            </Container>
        </Box>
    );
}
