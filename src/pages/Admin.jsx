import {
    Box,
    Button,
    TextField,
    Typography,
    Container,
    Paper,
    InputAdornment,
    IconButton,
} from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useState } from "react";
import { useToast } from "../services/ToastService";
import { useAuth } from "../services/AuthService";

export default function Admin() {
    const navigate = useNavigate();
    const { loginAdmin } = useAuth();
    const { showToast } = useToast();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/admin_login.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.status === "success") {
                localStorage.setItem("adminEmail", email);
                loginAdmin(data.admin);
                showToast(data.message || "Admin Login successful!", "success");

                // Get first permitted route
                const user = data.admin;
                let firstRoute = "/admin/dashboard";
                if (user.role !== 'super_admin') {
                    let permissions = user.permissions || [];
                    if (typeof permissions === 'string') {
                      try { permissions = JSON.parse(permissions); } catch (e) { permissions = []; }
                    }

                    const menuItems = [
                        { path: "/admin/dashboard", permission: "stats" },
                        { path: "/admin/users", permission: "users" },
                        { path: "/admin/projects", permission: "projects" },
                        { path: "/admin/plans", permission: "plans" },
                        { path: "/admin/payments", permission: "payments" },
                        { path: "/admin/map-requests", permission: "projects" },
                        { path: "/admin/reviews", permission: "staff" },
                        { path: "/admin/followups", permission: "followups" },
                        { path: "/admin/followup-requests", permission: "followup_requests" },
                        { path: "/admin/analytics", permission: "stats" },
                        { path: "/admin/staff", permission: "staff" },
                        { path: "/occult/admin?tab=expertsList", permission: "staff" },
                        { path: "/occult/admin?tab=manageUsers", permission: "staff" },
                        { path: "/occult/admin-store", permission: "staff" },
                        { path: "/occult/admin-orders", permission: "staff" },
                        { path: "/admin/tracker", permission: "staff" },
                        { path: "/admin/tutorials", permission: "staff" },
                        { path: "/admin/remedies", permission: "remedies" },
                    ];

                    const permitted = menuItems.find(item => permissions.includes(item.permission));
                    if (permitted) firstRoute = permitted.path;
                }

                setTimeout(() => {
                    navigate(firstRoute);
                }, 500);
            } else {
                showToast(data.message || "Invalid Admin credentials", "error");
            }
        } catch (error) {
            showToast("Something went wrong. Please try again.", "error");
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
                                width: 64,
                                height: 64,
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, #fb923c, #f97316)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                boxShadow: "0 8px 20px rgba(249,115,22,0.2)",
                            }}
                        >
                            <AdminPanelSettingsIcon sx={{ fontSize: 32 }} />
                        </Box>

                        <Typography variant="h4" sx={{ fontWeight: 800, color: "#9a3412" }}>
                            Admin Access
                        </Typography>

                        <Typography variant="body2" sx={{ color: "#c2410c", fontWeight: 500 }}>
                            Enter administrative credentials to proceed
                        </Typography>
                    </Box>

                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            label="Admin Email"
                            type="email"
                            fullWidth
                            required
                            margin="normal"
                            variant="outlined"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    '& fieldset': { borderColor: '#fed7aa' },
                                    '&:hover fieldset': { borderColor: '#f97316' },
                                    '&.Mui-focused fieldset': { borderColor: '#f97316' },
                                },
                                '& .MuiInputLabel-root.Mui-focused': { color: '#9a3412' },
                            }}
                        />

                        <TextField
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            fullWidth
                            required
                            margin="normal"
                            variant="outlined"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    '& fieldset': { borderColor: '#fed7aa' },
                                    '&:hover fieldset': { borderColor: '#f97316' },
                                    '&.Mui-focused fieldset': { borderColor: '#f97316' },
                                },
                                '& .MuiInputLabel-root.Mui-focused': { color: '#9a3412' },
                            }}
                        />

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                            <Button
                                component={RouterLink}
                                to="/admin/forgot-password"
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 700,
                                    color: "#9a3412",
                                    fontSize: "0.85rem",
                                    "&:hover": { bgcolor: "transparent", color: "#f97316" }
                                }}
                            >
                                Forgot Password?
                            </Button>
                        </Box>

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            disabled={loading}
                            sx={{
                                mt: 4,
                                py: 1.5,
                                fontWeight: 800,
                                fontSize: "1rem",
                                borderRadius: 3,
                                color: "#fff",
                                background: "linear-gradient(90deg, #f97316, #ea580c)",
                                boxShadow: "0 4px 15px rgba(249, 115, 22, 0.3)",
                                textTransform: "none",
                                "&:hover": {
                                    background: "linear-gradient(90deg, #ea580c, #f97316)",
                                    boxShadow: "0 6px 20px rgba(249, 115, 22, 0.4)",
                                },
                                "&:disabled": {
                                    background: "#fdba74",
                                }
                            }}
                        >
                            {loading ? "Authenticating..." : "Login to Dashboard"}
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}
