import {
    Box,
    Typography,
    Container,
    Paper,
    TextField,
    Button,
    InputAdornment,
    IconButton,
    CircularProgress,
    Stack,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import {
    Person as PersonIcon,
    Email as EmailIcon,
    Lock as LockIcon,
    Visibility,
    VisibilityOff,
    ArrowForward as ArrowForwardIcon,
    Menu as MenuIcon,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../services/ToastService";
import { useAuth } from "../services/AuthService";
import AdminSidebar from "../components/AdminSidebar";

export default function AdminCreateUser() {
    const { isAdminLoggedIn, adminUser } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(isDesktop);

    useEffect(() => {
        if (!isAdminLoggedIn) {
            navigate("/admin");
        } else if (adminUser?.role !== 'super_admin') {
            showToast("Access Restricted to Super Admins", "error");
            navigate("/admin/dashboard");
        }
    }, [isAdminLoggedIn, navigate, adminUser]);

    useEffect(() => {
        setDrawerOpen(isDesktop);
    }, [isDesktop]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleDrawer = () => setDrawerOpen(!drawerOpen);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            showToast("Passwords do not match", "error");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/admin_register.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: formData.name,
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const data = await response.json();
            if (data.status === "success") {
                showToast("Admin account created successfully!", "success");
                setTimeout(() => navigate("/admin/dashboard"), 1000);
            } else {
                showToast(data.message || "Registration failed", "error");
            }
        } catch (error) {
            showToast("Something went wrong. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: "100vh", backgroundColor: "#fffbf7" }}>
            <AdminSidebar open={drawerOpen} onClose={toggleDrawer} isDesktop={isDesktop} />

            <Box sx={{ flexGrow: 1, width: { md: `calc(100% - ${drawerOpen ? 260 : 80}px)` }, transition: 'width 0.3s' }}>
                <Container maxWidth="md" sx={{ py: 10 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 6,
                            borderRadius: 6,
                            border: '1px solid #ffedd5',
                            backgroundColor: "#ffffff",
                            textAlign: "center",
                        }}
                    >
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                backgroundColor: "#fff7ed",
                                borderRadius: "24px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mx: "auto",
                                mb: 3,
                            }}
                        >
                            <PersonIcon sx={{ fontSize: 40, color: "#f97316" }} />
                        </Box>

                        <Typography variant="h3" sx={{ fontWeight: 900, color: "#431407", mb: 1 }}>
                            Create Admin
                        </Typography>
                        <Typography variant="body1" sx={{ color: "#7c2d12", opacity: 0.8, mb: 6 }}>
                            Register a new administrator for the portal.
                        </Typography>

                        <form onSubmit={handleSubmit}>
                            <Stack spacing={3}>
                                <TextField
                                    fullWidth
                                    name="name"
                                    label="Full Name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonIcon sx={{ color: "#f97316" }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                                />
                                <TextField
                                    fullWidth
                                    name="email"
                                    label="Email Address"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailIcon sx={{ color: "#f97316" }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                                />
                                <TextField
                                    fullWidth
                                    name="password"
                                    label="Password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockIcon sx={{ color: "#f97316" }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                                />
                                <TextField
                                    fullWidth
                                    name="confirmPassword"
                                    label="Confirm Password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockIcon sx={{ color: "#f97316" }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
                                />
                            </Stack>

                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                disabled={loading}
                                endIcon={!loading && <ArrowForwardIcon />}
                                sx={{
                                    mt: 6,
                                    py: 2,
                                    borderRadius: 3,
                                    backgroundColor: "#ea580c",
                                    color: "#ffffff", // Set text color to white
                                    fontSize: "1.1rem",
                                    fontWeight: 800,
                                    textTransform: "none",
                                    "&:hover": { backgroundColor: "#9a3412" },
                                    "&.Mui-disabled": { color: "rgba(255,255,255,0.7)" }
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : "Register Admin"}
                            </Button>
                        </form>
                    </Paper>
                </Container>
            </Box>
        </Box>
    );
}
