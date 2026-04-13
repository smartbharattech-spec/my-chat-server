import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Backdrop,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  InputAdornment,
  IconButton,
} from "@mui/material";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import Link from "@mui/material/Link";
import { useState } from "react";
import { useToast } from "../services/ToastService"; // import Toast
import vastuBg from "../assets/vastu_map_bg_final.png";
import logo from "../assets/logo.png";

function Register() {
  const navigate = useNavigate();
  const { showToast } = useToast(); // sirf showToast use karenge

  const [firstname, setFirstname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mobile, setMobile] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [isConsultant, setIsConsultant] = useState("0"); // Default 'No'
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({});

  const validate = () => {
    let tempErrors = {};

    // Password Validation
    // Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      tempErrors.password = "Password must be at least 8 characters, include an uppercase letter, a lowercase letter, a number, and a special character.";
    }

    // Mobile Validation (10 digits)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile)) {
      tempErrors.mobile = "Mobile number must be exactly 10 digits.";
    }

    // WhatsApp Validation (10 digits)
    if (!mobileRegex.test(whatsapp)) {
      tempErrors.whatsapp = "WhatsApp number must be exactly 10 digits.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      showToast("Please fix the errors in the form.", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/createaccount.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstname, email, password, mobile, whatsapp, city, state, is_consultant: isConsultant }),
        }
      );

      // HTTP status check
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server Error: ${response.status} - ${text}`);
      }

      let data;
      try {
        const text = await response.text(); // Read text first to debug if needed
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("Server Raw Response:", text); // Log raw response for debugging
          throw new Error("Invalid JSON response from server.");
        }
      } catch (jsonError) {
        throw new Error("Invalid JSON response from server.");
      }

      if (data.status === "success") {
        // Show toast via ToastService and then redirect to login
        showToast(data.message || "Registration successful! Please check your email to verify your account.", "success");
        localStorage.setItem("email", email); // Store email for VerifyEmailPending page
        setTimeout(() => navigate("/verify-pending"), 2000);
      } else {
        const message = data.message || "Registration failed. Please check your input.";
        showToast(message, "error");
        console.error("Registration failed:", data);
      }
    } catch (error) {
      console.error("Error during registration:", error);
      showToast(`Error: ${error.message}`, "error");
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
            filter: 'contrast(1.4) brightness(1.1) sepia(0.5) hue-rotate(-15deg)',
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
              Join The
            </Typography>

            <Typography variant="h1" sx={{
              fontWeight: 900,
              fontSize: { md: '7rem', lg: '9.5rem' },
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
              Elite.
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
            Create an account to unlock advanced Vastu analysis features and elevate your workflow to unprecedented levels.
          </Typography>

          {/* Minimalist Tech Stats */}
          <Box sx={{
            display: 'flex',
            gap: 6,
            mt: 8,
          }}>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: '2.5rem', color: '#ffffff', lineHeight: 1, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                250<span style={{ color: '#ea580c' }}>+</span>
              </Typography>
              <Typography sx={{ color: '#71717a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.75rem' }}>PROFESSIONALS JOINED</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: '2.5rem', color: '#ffffff', lineHeight: 1, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                24<span style={{ color: '#ea580c' }}>/</span>7
              </Typography>
              <Typography sx={{ color: '#71717a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.75rem' }}>CLOUD COMPUTATION</Typography>
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
          position: 'relative',
          overflowY: 'auto'
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

          <Box sx={{ mb: 4, textAlign: { xs: 'center', md: 'left' } }}>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#431407', mb: 1, letterSpacing: '-1px' }}>
              Create an account
            </Typography>
            <Typography variant="body1" sx={{ color: '#7c2d12' }}>
              Fill in your details to get started.
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ mb: 2 }}>
              <TextField
                label="Full Name"
                fullWidth
                required
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                variant="filled"
                InputProps={{ disableUnderline: true }}
                sx={{
                  "& .MuiFilledInput-root": {
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid transparent',
                    transition: 'all 0.2s',
                    "&:hover": { backgroundColor: '#f1f5f9' },
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
                    "&:hover": { backgroundColor: '#f1f5f9' },
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
                type={showPassword ? "text" : "password"}
                fullWidth
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!errors.password}
                helperText={errors.password || "Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char"}
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
                    "&:hover": { backgroundColor: '#f1f5f9' },
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
                label="Mobile Number"
                fullWidth
                required
                value={mobile}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setMobile(val);
                }}
                error={!!errors.mobile}
                helperText={errors.mobile}
                inputProps={{ maxLength: 10, inputMode: 'numeric' }}
                variant="filled"
                InputProps={{ disableUnderline: true }}
                sx={{
                  "& .MuiFilledInput-root": {
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid transparent',
                    transition: 'all 0.2s',
                    "&:hover": { backgroundColor: '#f1f5f9' },
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
                label="WhatsApp Number"
                fullWidth
                required
                value={whatsapp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setWhatsapp(val);
                }}
                error={!!errors.whatsapp}
                helperText={errors.whatsapp}
                inputProps={{ maxLength: 10, inputMode: 'numeric' }}
                variant="filled"
                InputProps={{ disableUnderline: true }}
                sx={{
                  "& .MuiFilledInput-root": {
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid transparent',
                    transition: 'all 0.2s',
                    "&:hover": { backgroundColor: '#f1f5f9' },
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
                label="City"
                fullWidth
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                variant="filled"
                InputProps={{ disableUnderline: true }}
                sx={{
                  "& .MuiFilledInput-root": {
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid transparent',
                    transition: 'all 0.2s',
                    "&:hover": { backgroundColor: '#f1f5f9' },
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
                label="State"
                fullWidth
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                variant="filled"
                InputProps={{ disableUnderline: true }}
                sx={{
                  "& .MuiFilledInput-root": {
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid transparent',
                    transition: 'all 0.2s',
                    "&:hover": { backgroundColor: '#f1f5f9' },
                    "&.Mui-focused": {
                      backgroundColor: '#ffffff',
                      border: '1px solid #ea580c',
                      boxShadow: '0 0 0 4px rgba(234, 88, 12, 0.1)'
                    }
                  }
                }}
              />
            </Box>
            <Box sx={{ mt: 3, mb: 3, p: 2, borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#431407', mb: 1 }}>
                Are you a Vastu Consultant?
              </Typography>
              <RadioGroup
                row
                value={isConsultant}
                onChange={(e) => setIsConsultant(e.target.value)}
              >
                <FormControlLabel value="1" control={<Radio sx={{ color: "#cbd5e1", '&.Mui-checked': { color: "#ea580c" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Yes</Typography>} />
                <FormControlLabel value="0" control={<Radio sx={{ color: "#cbd5e1", '&.Mui-checked': { color: "#ea580c" } }} />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>No</Typography>} />
              </RadioGroup>
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
              {loading ? "Creating account..." : "Register"}
            </Button>
          </Box>

          <Box sx={{ mt: 5, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              Already have an account?{" "}
              <Link
                component={RouterLink}
                to="/login"
                underline="hover"
                sx={{ fontWeight: 700, color: "#ea580c" }}
              >
                Sign in
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Full screen loader overlay */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1, flexDirection: 'column', gap: 2 }}
        open={loading}
      >
        <CircularProgress color="inherit" size={60} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Creating your account...
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Please wait, this may take a few seconds.
        </Typography>
      </Backdrop>
    </Box>
  );
}

export default Register;
