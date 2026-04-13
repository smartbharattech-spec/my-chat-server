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
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import Link from "@mui/material/Link";
import { useState, useEffect } from "react";
import { useToast } from "../services/ToastService";
import { useAuth } from "../services/AuthService";
import vastuBg from "../assets/vastu_map_bg_final.png";
import logo from "../assets/logo.png";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  // Show cross-page toast set during registration (if any)
  useEffect(() => {
    const pending = localStorage.getItem("pendingToast");
    if (pending) {
      try {
        const { message, type } = JSON.parse(pending);
        showToast(message, type || "info");
      } catch (e) {
        console.error("Invalid pendingToast:", e);
      }
      localStorage.removeItem("pendingToast");
    }

    // Check for URL query params (verification status)
    const params = new URLSearchParams(window.location.search);
    const verified = params.get("verified");
    const error = params.get("error");

    if (verified === "true") {
      showToast("Email successfully verified! You can now login.", "success");
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      let errorMsg = "An error occurred.";
      if (error === "missing_token") errorMsg = "Verification link is invalid (missing token).";
      if (error === "invalid_token") errorMsg = "Verification link is invalid or expired.";
      if (error === "server_error") errorMsg = "Server error during verification. Please try again.";

      showToast(errorMsg, "error");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [showToast]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Generate or retrieve Device ID
    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
      deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      localStorage.setItem("device_id", deviceId);
    }

    try {
      const response = await fetch(
        "/api/login.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, device_id: deviceId }),
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        login(); // mark user as logged in
        localStorage.setItem("email", email); // Save email to localStorage
        showToast(data.message || "Login successful!", "success");

        // Redirect after toast
        setTimeout(() => {
          if (data.data.is_verified == 1) {
            navigate("/dashboard");
          } else {
            navigate("/verify-pending");
          }
        }, 500);
      } else {
        showToast(data.message || "Invalid email or password", "error");
      }
    } catch (error) {
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#ffffff' }}>

      {/* Left Panel: Out of the Box Immersive Design */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1,
          position: 'relative',
          backgroundColor: '#050505', // Pitch black base
          overflow: 'hidden',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          p: { md: 8, lg: 12 },
          color: '#ffffff'
        }}
      >
        {/* Deep Atmospheric Gradients */}
        <Box
          sx={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(circle at 0% 0%, rgba(234, 88, 12, 0.2) 0%, transparent 40%), radial-gradient(circle at 100% 100%, rgba(249, 115, 22, 0.15) 0%, transparent 40%)',
            zIndex: 0
          }}
        />

        {/* The Vastu Map Background - Balanced overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: `url(${vastuBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.18, // Perfect middle ground
            mixBlendMode: 'color-dodge',
            filter: 'contrast(1.4) brightness(1.1) sepia(0.5) hue-rotate(-15deg)', // Boosted contrast but lowered brightness to keep lines visible without washing out the dark bg
            animation: "slowPan 60s infinite alternate linear",
            "@keyframes slowPan": {
              "0%": { transform: "scale(1.1) translate(0, 0) rotate(0deg)" },
              "100%": { transform: "scale(1.4) translate(-5%, 5%) rotate(2deg)" },
            }
          }}
        />

        {/* Ambient Glowing Orbs */}
        <Box
          sx={{
            position: 'absolute',
            width: '40vw',
            height: '40vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(234, 88, 12, 0.15) 0%, transparent 70%)',
            filter: 'blur(80px)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: "pulseCore 8s infinite alternate ease-in-out",
            "@keyframes pulseCore": {
              "0%": { opacity: 0.5, transform: "translate(-50%, -50%) scale(0.8)" },
              "100%": { opacity: 1, transform: "translate(-50%, -50%) scale(1.2)" },
            }
          }}
        />

        {/* Vertical Cyber Text (Left Edge) */}
        <Box sx={{
          position: 'absolute',
          left: '40px',
          top: '50%',
          transform: 'translateY(-50%) rotate(180deg)',
          writingMode: 'vertical-rl',
          display: 'flex',
          gap: 4,
          alignItems: 'center',
          opacity: 0.3,
          zIndex: 2,
          letterSpacing: '4px',
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          color: '#ffffff',
          "&::before": {
            content: '""',
            display: 'block',
            width: '1px',
            height: '100px',
            background: 'linear-gradient(to bottom, transparent, #ea580c)',
            mb: 2
          }
        }}>
          SYSTEM INITIALIZED // VASTU PROTOCOL ACTIVE
        </Box>

        {/* Main Immersive Content - NO CARD */}
        <Box sx={{ zIndex: 2, position: 'relative', width: '100%', maxWidth: '800px', ml: { md: 4, lg: 8 } }}>

          {/* Logo & Status Ribbon */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 10 }}>
            <Box
              component="img"
              src={logo}
              alt="MyVastuTool Logo"
              sx={{
                width: 90,
                height: 90,
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 15px rgba(234, 88, 12, 0.5))',
                animation: 'floatLogo 6s infinite ease-in-out',
                "@keyframes floatLogo": {
                  "0%, 100%": { transform: "translateY(0)" },
                  "50%": { transform: "translateY(-10px)" },
                }
              }}
            />
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 1.5,
              px: 2.5, py: 1,
              borderRadius: '0', // Sharp corners for modern tech feel
              borderLeft: '2px solid #ea580c',
              background: 'linear-gradient(90deg, rgba(234,88,12,0.1) 0%, transparent 100%)',
            }}>
              <Box sx={{ "&::before": { content: '""', display: 'block', width: 8, height: 8, bgcolor: '#f97316', boxShadow: '0 0 12px #ea580c' } }} />
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#fcd34d', letterSpacing: '2px' }}>NEURAL ARCHITECTURE ACTIVE</Typography>
            </Box>
          </Box>

          {/* GIANT TYPOGRAPHY */}
          <Box sx={{ mb: 6, position: 'relative' }}>
            <Typography variant="h1" sx={{
              fontWeight: 900,
              fontSize: { md: '6rem', lg: '8rem' },
              lineHeight: 0.85,
              textTransform: 'uppercase',
              letterSpacing: '-2px',
              color: 'transparent',
              WebkitTextStroke: '2px rgba(255,255,255,0.1)',
              position: 'relative',
              left: '-5px', // Optically align
              transition: 'all 0.5s',
              "&:hover": { WebkitTextStroke: '2px rgba(255,255,255,0.4)' }
            }}>
              Master
            </Typography>

            <Typography variant="h1" sx={{
              fontWeight: 900,
              fontSize: { md: '6.5rem', lg: '8.5rem' },
              lineHeight: 0.85,
              textTransform: 'uppercase',
              letterSpacing: '-4px',
              color: '#ffffff',
              background: 'linear-gradient(to bottom right, #ffffff 0%, #a1a1aa 50%, #ea580c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.5))',
              position: 'relative',
              zIndex: 2
            }}>
              Your <br /> Space.
            </Typography>

            {/* Spinning decorative geometric circle behind "Space" */}
            <Box sx={{
              position: 'absolute',
              bottom: '-20%',
              right: '-10%',
              width: '300px',
              height: '300px',
              border: '1px dashed rgba(234,88,12,0.3)',
              borderRadius: '50%',
              zIndex: 1,
              animation: 'spinReverse 30s linear infinite',
              "&::before": {
                content: '""',
                position: 'absolute',
                top: '10%', left: '10%', right: '10%', bottom: '10%',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '50%'
              },
              "@keyframes spinReverse": {
                "0%": { transform: "rotate(360deg)" },
                "100%": { transform: "rotate(0deg)" }
              }
            }} />
          </Box>

          <Typography sx={{
            color: '#a1a1aa',
            fontWeight: 400,
            lineHeight: 1.8,
            fontSize: '1.3rem',
            maxWidth: '600px',
            borderLeft: '1px solid rgba(255,255,255,0.2)',
            pl: 4,
            opacity: 0.8,
            mt: 4
          }}>
            Experience precise architectural analysis. Where ancient Vastu wisdom converges with ultra-modern computational intelligence.
          </Typography>

          {/* Minimalist Tech Stats */}
          <Box sx={{
            display: 'flex',
            gap: 6,
            mt: 8,
          }}>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: '2.5rem', color: '#ffffff', lineHeight: 1, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                10k<span style={{ color: '#ea580c' }}>+</span>
              </Typography>
              <Typography sx={{ color: '#71717a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.75rem' }}>PROPERTIES ANALYZED</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: '2.5rem', color: '#ffffff', lineHeight: 1, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                99.9<span style={{ color: '#ea580c' }}>%</span>
              </Typography>
              <Typography sx={{ color: '#71717a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.75rem' }}>COMPUTATIONAL ACCURACY</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Right Panel: Auth Form */}
      <Box
        sx={{
          flex: { xs: 1, md: '0 0 500px', lg: '0 0 600px' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: { xs: 3, sm: 6, md: 8 },
          py: 4,
          backgroundColor: '#ffffff',
          position: 'relative'
        }}
      >
        <Box sx={{
          width: '100%', maxWidth: 400, animation: "fadeInUp 0.6s ease-out",
          "@keyframes fadeInUp": {
            from: { opacity: 0, transform: "translateY(20px)" },
            to: { opacity: 1, transform: "translateY(0)" },
          }
        }}>
          {/* Mobile Only Header Logo */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', mb: 4, justifyContent: 'center' }}>
            <Box
              component="img"
              src={logo}
              alt="MyVastuTool Logo"
              sx={{
                width: 120,
                height: 'auto',
                maxWidth: '100%',
                objectFit: 'contain'
              }}
            />
          </Box>

          <Box sx={{ mb: 6, textAlign: { xs: 'center', md: 'left' } }}>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#431407', mb: 1, letterSpacing: '-1px' }}>
              Welcome back
            </Typography>
            <Typography variant="body1" sx={{ color: '#7c2d12' }}>
              Enter your credentials to access your account.
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ mb: 3 }}>
              <TextField
                label="Email address"
                type="email"
                fullWidth
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                variant="filled"
                InputProps={{ disableUnderline: true }}
                sx={{
                  "& .MuiFilledInput-root": {
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid transparent',
                    transition: 'all 0.2s',
                    "&:hover": {
                      backgroundColor: '#f1f5f9',
                    },
                    "&.Mui-focused": {
                      backgroundColor: '#ffffff',
                      border: '1px solid #ea580c',
                      boxShadow: '0 0 0 4px rgba(234, 88, 12, 0.1)'
                    }
                  }
                }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <TextField
                label="Password"
                type={showPassword ? "text" : "password"}
                fullWidth
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="filled"
                InputProps={{
                  disableUnderline: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ mr: 1, color: '#7c2d12' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiFilledInput-root": {
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid transparent',
                    transition: 'all 0.2s',
                    "&:hover": {
                      backgroundColor: '#f1f5f9',
                    },
                    "&.Mui-focused": {
                      backgroundColor: '#ffffff',
                      border: '1px solid #ea580c',
                      boxShadow: '0 0 0 4px rgba(234, 88, 12, 0.1)'
                    }
                  }
                }}
              />
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 4 }}>
              <Link
                component={RouterLink}
                to="/forgot-password"
                variant="body2"
                underline="hover"
                sx={{ color: '#ea580c', fontWeight: 600 }}
              >
                Forgot your password?
              </Link>
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{
                py: 1.8,
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: "1rem",
                textTransform: "none",
                background: "linear-gradient(135deg, #f97316, #ea580c)",
                color: "#fff",
                boxShadow: "0 8px 20px rgba(249, 115, 22, 0.2)",
                transition: "all 0.2s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 12px 25px rgba(249, 115, 22, 0.3)",
                  background: "linear-gradient(135deg, #ea580c, #c2410c)",
                }
              }}
            >
              {loading ? "Signing in..." : "Sign in to account"}
            </Button>
          </Box>

          <Box sx={{ mt: 6, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              Don't have an account?{" "}
              <Link
                component={RouterLink}
                to="/register"
                underline="hover"
                sx={{ fontWeight: 700, color: "#ea580c" }}
              >
                Create one now
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Login;
