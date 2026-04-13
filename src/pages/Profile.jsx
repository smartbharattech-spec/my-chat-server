import {
  Box,
  Container,
  Paper,
  TextField,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useState, useEffect } from "react";
import { useToast } from "../services/ToastService";
import { useAuth } from "../services/AuthService";
import UserDevices from "../components/UserDevices";

function Profile() {
  const { showToast } = useToast();
  const { user: authUser } = useAuth();

  const [user, setUser] = useState({
    firstname: "",
    email: "",
    mobile: "",
    whatsapp: "",
    city: "",
    state: "",
    is_consultant: 0,
    is_verified: 0,
    plan: "",
    plan_id: null,
    plan_expiry: null,
    project_count_current_cycle: 0,
  });
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authUser?.email) {
      fetchProfile();
    }
  }, [authUser]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user_profile.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fetch", email: authUser.email }),
      });
      const res = await response.json();
      if (res.status) {
        setUser({
          id: res.data.id || "",
          firstname: res.data.firstname || "",
          email: res.data.email || "",
          mobile: res.data.mobile || "",
          whatsapp: res.data.whatsapp || "",
          city: res.data.city || "",
          state: res.data.state || "",
          is_consultant: res.data.is_consultant,
          is_verified: res.data.is_verified,
          plan: res.data.plan,
          plan_id: res.data.plan_id,
          plan_expiry: res.data.plan_expiry,
          project_count_current_cycle: res.data.project_count_current_cycle,
        });
      } else {
        showToast(res.message || "Failed to fetch profile", "error");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      showToast("Error connecting to server", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/user_profile.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          email: user.email,
          firstname: user.firstname,
          mobile: user.mobile,
          whatsapp: user.whatsapp,
          city: user.city,
          state: user.state,
          password: password,
        }),
      });
      const res = await response.json();
      if (res.status) {
        showToast("Profile updated successfully!", "success");
        setPassword(""); // Clear password field after update
      } else {
        showToast(res.message || "Update failed", "error");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast("Error connecting to server", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <CircularProgress sx={{ color: "#f97316" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f8fafc", py: { xs: 4, md: 8 }, px: { xs: 2, md: 4 } }}>
      <Container maxWidth="md">
        <Typography variant="h4" fontWeight={800} color="#431407" mb={1} letterSpacing="-0.5px">
          Account Settings
        </Typography>
        <Typography variant="body1" color="#7c2d12" mb={5}>
          Manage your profile details, subscriptions, and device sessions.
        </Typography>

        <Grid container spacing={4}>
          {/* Left Column: Profile Info & Plan */}
          <Grid item xs={12} md={7}>
            {/* Personal Info Card */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 4 },
                mb: 4,
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Typography variant="h6" fontWeight={700} color="#431407" mb={3}>
                Personal Information
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="body2" fontWeight={600} color="#7c2d12" mb={1}>Full Name</Typography>
                  <TextField
                    name="firstname"
                    value={user.firstname}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: '8px' } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={600} color="#7c2d12">Email Address</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {user.is_verified == 1 ? (
                        <Chip label="Verified" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#dcfce7', color: '#166534' }} />
                      ) : (
                        <Chip label="Unverified" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#fee2e2', color: '#991b1b' }} />
                      )}
                      {user.is_consultant == 1 && (
                        <Chip label="Consultant" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#fef3c7', color: '#92400e' }} />
                      )}
                    </Box>
                  </Box>
                  <TextField
                    name="email"
                    value={user.email}
                    fullWidth
                    disabled
                    variant="outlined"
                    size="small"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: '8px', backgroundColor: '#f8fafc' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" fontWeight={600} color="#7c2d12" mb={1}>Mobile Number</Typography>
                  <TextField
                    name="mobile"
                    value={user.mobile}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: '8px' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" fontWeight={600} color="#7c2d12" mb={1}>WhatsApp</Typography>
                  <TextField
                    name="whatsapp"
                    value={user.whatsapp}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: '8px' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" fontWeight={600} color="#7c2d12" mb={1}>City</Typography>
                  <TextField
                    name="city"
                    value={user.city}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: '8px' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" fontWeight={600} color="#7c2d12" mb={1}>State</Typography>
                  <TextField
                    name="state"
                    value={user.state}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: '8px' } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" fontWeight={600} color="#7c2d12" mb={1}>Change Password</Typography>
                  <TextField
                    type="password"
                    placeholder="Leave blank to keep current"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    variant="outlined"
                    size="small"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: '8px' } }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  disabled={saving}
                  onClick={handleSave}
                  sx={{
                    px: 4,
                    py: 1,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '8px',
                    boxShadow: 'none',
                    backgroundColor: '#f97316',
                    "&:hover": {
                      backgroundColor: '#ea580c',
                      boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                    }
                  }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Right Column: Plan & Devices */}
          <Grid item xs={12} md={5}>
            {/* Plan Usage Card */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 4 },
                mb: 4,
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Typography variant="h6" fontWeight={700} color="#431407" mb={3}>
                Subscription & Plan
              </Typography>

              <Box sx={{ p: 3, borderRadius: '12px', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Current Plan</Typography>
                  {user.plan_id && <Chip label="Active" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#fff' }} />}
                </Box>
                <Typography variant="h4" fontWeight={800} mb={1}>
                  {user.plan || "Free Tier"}
                </Typography>

                {user.plan_expiry && (
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Expires on {new Date(user.plan_expiry).toLocaleDateString()}
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2, borderBottom: '1px solid #f1f5f9' }}>
                <Typography variant="body2" color="#7c2d12" fontWeight={500}>Projects Created</Typography>
                <Typography variant="body2" color="#431407" fontWeight={700}>{user.project_count_current_cycle || 0}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2 }}>
                <Typography variant="body2" color="#7c2d12" fontWeight={500}>Device Limits</Typography>
                <Typography variant="body2" color="#431407" fontWeight={700}>Manage below</Typography>
              </Box>
            </Paper>

            {/* Devices Card Wrapper */}
            <Box sx={{
              '& .MuiPaper-root': { // targeting the inner UserDevices paper
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05) !important',
                border: '1px solid #e2e8f0 !important',
                borderRadius: '16px !important',
                p: { xs: 3, sm: 4 },
                borderTop: 'none !important', // removing old styling if it applies
              }
            }}>
              <UserDevices userId={user.id} />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Profile;
