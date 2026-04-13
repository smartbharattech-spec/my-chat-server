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

export default function AdminForgotPassword() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [step, setStep] = useState(1); // 1: Email, 2: Verify OTP, 3: New Password
    const [loading, setLoading] = useState(false);

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Step 1: Request OTP
    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/admin_forgot_password.php", {
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

    // Step 2 & 3: Reset Password (using same API in this implementation)
    // Wait, the backend logic expects email, otp, and new_password.
    // So we can show step 2 for OTP entry, then step 3 for password entry.
    // But we only call the API at the final step.
    
    const handleVerifyOtp = (e) => {
        e.preventDefault();
        if (otp.length === 6) {
            setStep(3);
        } else {
            showToast("Please enter a 6-digit code", "warning");
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showToast("Passwords do not match", "error");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/admin_reset_password.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp, new_password: newPassword }),
            });
            const data = await response.json();

            if (data.status) {
                showToast(data.message, "success");
                setTimeout(() => navigate("/admin"), 2000);
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
                background: "linear-gradient(135deg, #fffcf9 0%, #ffedd5 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: 2,
            }}
        >
            <Container maxWidth="xs">
                <Paper
                    elevation={8}
                    sx={{
                        p: 4,
                        borderRadius: 5,
                        borderTop: "6px solid #f97316",
                        backgroundColor: "#ffffff",
                    }}
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
                                background: "linear-gradient(135deg, #fb923c, #f97316)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                boxShadow: "0 8px 20px rgba(249,115,22,0.3)",
                            }}
                        >
                            <LockResetIcon sx={{ fontSize: 26 }} />
                        </Box>

                        <Typography variant="h5" sx={{ fontWeight: 800, color: "#9a3412" }}>
                            {step === 1 && "Admin Recovery"}
                            {step === 2 && "Security Verification"}
                            {step === 3 && "Reset Password"}
                        </Typography>

                        <Typography variant="body2" sx={{ color: "#c2410c", fontWeight: 500 }}>
                            {step === 1 && "Enter your admin email to receive a recovery code."}
                            {step === 2 && "Enter the 6-digit code sent to your admin email."}
                            {step === 3 && "Create a secure new password for your admin account."}
                        </Typography>
                    </Box>

                    {/* Step 1: Email */}
                    {step === 1 && (
                        <Box component="form" onSubmit={handleRequestOtp}>
                            <TextField
                                label="Admin Email"
                                type="email"
                                fullWidth
                                required
                                margin="normal"
                                variant="outlined"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                InputProps={{
                                    startAdornment: <MarkEmailReadIcon color="action" sx={{ mr: 1 }} />,
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 3,
                                        '& fieldset': { borderColor: '#fed7aa' },
                                        '&:hover fieldset': { borderColor: '#f97316' },
                                        '&.Mui-focused fieldset': { borderColor: '#f97316' },
                                    },
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
                                    py: 1.5,
                                    fontWeight: 800,
                                    borderRadius: 3,
                                    background: "linear-gradient(90deg, #f97316, #ea580c)",
                                    boxShadow: "0 4px 15px rgba(249, 115, 22, 0.3)",
                                    "&:hover": {
                                        background: "linear-gradient(90deg, #ea580c, #f97316)",
                                    },
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : "Request Recovery Code"}
                            </Button>
                        </Box>
                    )}

                    {/* Step 2: Verification */}
                    {step === 2 && (
                        <Box component="form" onSubmit={handleVerifyOtp}>
                            <TextField
                                label="Verification Code"
                                type="text"
                                fullWidth
                                required
                                margin="normal"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                                InputProps={{
                                    startAdornment: <SecurityIcon color="action" sx={{ mr: 1 }} />,
                                }}
                                inputProps={{
                                    maxLength: 6,
                                    style: { letterSpacing: 8, textAlign: 'center', fontSize: '1.4rem', fontWeight: 'bold' }
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 3,
                                        '& fieldset': { borderColor: '#fed7aa' },
                                        '&.Mui-focused fieldset': { borderColor: '#f97316' },
                                    },
                                }}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                sx={{
                                    mt: 3,
                                    py: 1.5,
                                    fontWeight: 800,
                                    borderRadius: 3,
                                    background: "linear-gradient(90deg, #f97316, #ea580c)",
                                }}
                            >
                                Continue to Reset
                            </Button>

                            <Button
                                onClick={() => setStep(1)}
                                fullWidth
                                sx={{ mt: 2, textTransform: "none", color: "#9a3412" }}
                            >
                                Changed your mind? Go back
                            </Button>
                        </Box>
                    )}

                    {/* Step 3: New Password */}
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
                                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': { borderRadius: 3, '& fieldset': { borderColor: '#fed7aa' } },
                                }}
                            />

                            <TextField
                                label="Confirm New Password"
                                type={showPassword ? "text" : "password"}
                                fullWidth
                                required
                                margin="normal"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                InputProps={{
                                    startAdornment: <VpnKeyIcon color="action" sx={{ mr: 1 }} />,
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': { borderRadius: 3, '& fieldset': { borderColor: '#fed7aa' } },
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
                                    py: 1.5,
                                    fontWeight: 800,
                                    borderRadius: 3,
                                    background: "linear-gradient(90deg, #16a34a, #15803d)",
                                    "&:hover": { background: "#15803d" }
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : "Update Admin Password"}
                            </Button>
                        </Box>
                    )}

                    {/* Back to Login */}
                    <Box sx={{ mt: 4, textAlign: "center" }}>
                        <Typography variant="body2" sx={{ color: "#7c2d12" }}>
                            Remember your credentials?{" "}
                            <Link
                                component={RouterLink}
                                to="/admin"
                                underline="hover"
                                sx={{ fontWeight: 800, color: "#9a3412" }}
                            >
                                Back to Log In
                            </Link>
                        </Typography>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}
