import {
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  Card,
  Chip,
  Grid,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useToast } from "../services/ToastService";
import Loader from "./Loader";

const API_URL = "/api/user_profile.php";

export default function AccountDetails({ user, onRefresh }) {
  const { showToast } = useToast();
  const email = localStorage.getItem("email");

  const [form, setForm] = useState({
    firstname: "",
    email: email || "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const firstLetter = form.firstname
    ? form.firstname.charAt(0).toUpperCase()
    : email
      ? email.charAt(0).toUpperCase()
      : "U";

  /* ================= FETCH USER (API ONLY) ================= */
  useEffect(() => {
    if (!email) return;

    setLoading(true);

    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "fetch",
        email: email,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status) {
          setForm({
            firstname: res.data.firstname || "",
            email: res.data.email || email,
            password: "",
          });
        } else {
          showToast(res.message || "User not found", "error");
        }
      })
      .catch(() => {
        showToast("API error", "error");
      })
      .finally(() => setLoading(false));
  }, [email, showToast]);

  /* ================= HANDLE CHANGE ================= */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ================= UPDATE USER ================= */
  const handleUpdate = () => {
    setLoading(true);

    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        email: email,
        firstname: form.firstname,
        password: form.password,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status) {
          showToast(res.message || "Profile updated", "success");
          setForm({ ...form, password: "" });
          if (onRefresh) onRefresh();
        } else {
          showToast(res.message || "Update failed", "error");
        }
      })
      .catch(() => showToast("API error", "error"))
      .finally(() => setLoading(false));
  };

  if (loading) return <Loader />;

  return (
    <Box sx={{ width: "100%" }}>
      {/* USER INFO BAR */}
      <Card
        sx={{
          p: 3,
          mb: 4,
          display: "flex",
          alignItems: "center",
          gap: 2,
          borderRadius: 4,
          border: "1px solid #fed7aa",
        }}
      >
        <Avatar
          sx={{
            width: 56,
            height: 56,
            fontSize: 22,
            fontWeight: 800,
            background: "linear-gradient(135deg,#f97316,#ea580c)",
          }}
        >
          {firstLetter}
        </Avatar>

        <Box>
          <Typography sx={{ fontWeight: 800 }}>
            {form.firstname || "User"}
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#7c2d12" }}>
            {form.email}
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
            {user?.is_verified == 1 ? (
              <Chip label="Verified" size="small" color="success" sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
            ) : (
              <Chip label="Unverified" size="small" color="error" sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
            )}
            {user?.is_consultant == 1 && (
              <Chip label="Vastu Consultant" size="small" color="warning" sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
            )}
          </Box>
        </Box>
      </Card>

      {/* PLAN & USAGE DETAILS */}
      <Card
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 4,
          border: "1px solid #fed7aa",
          borderTop: "6px solid #431407",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: "#431407" }}>
          💎 Plan & Usage Details
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="#9a3412" fontWeight={700}>Current Plan</Typography>
            <Typography variant="body1" fontWeight={600}>
              {user?.plan || "Free Plan"}
              {user?.plan_id && <Chip label="Active" size="small" color="success" sx={{ ml: 1, height: 20 }} />}
            </Typography>
          </Grid>

          {user?.plan_expiry && (
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="#9a3412" fontWeight={700}>Plan Expiry</Typography>
              <Typography variant="body1" fontWeight={600} color="#c2410c">
                {new Date(user.plan_expiry).toLocaleDateString()}
              </Typography>
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="#9a3412" fontWeight={700}>Project Usage</Typography>
            <Typography variant="body1" fontWeight={600}>
              {user?.project_count_current_cycle || 0} Projects Created
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="#9a3412" fontWeight={700}>Single Slots</Typography>
            <Typography variant="body1" fontWeight={600}>
              {user?.available_single_slots || 0} Available
            </Typography>
          </Grid>
        </Grid>
      </Card>

      {/* EDIT FORM */}
      <Card
        sx={{
          p: 4,
          borderRadius: 4,
          border: "1px solid #fed7aa",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
          Edit Account Details
        </Typography>

        <TextField
          label="First Name"
          name="firstname"
          fullWidth
          value={form.firstname}
          onChange={handleChange}
          sx={{ mb: 3 }}
        />

        <TextField
          label="Email"
          fullWidth
          value={form.email}
          disabled
          sx={{ mb: 3 }}
        />

        <TextField
          label="New Password"
          name="password"
          type="password"
          fullWidth
          value={form.password}
          onChange={handleChange}
          placeholder="Leave blank to keep old password"
          sx={{ mb: 4 }}
        />

        <Button
          fullWidth
          onClick={handleUpdate}
          sx={{
            py: 1.4,
            fontWeight: 800,
            borderRadius: 3,
            background: "linear-gradient(135deg,#f97316,#ea580c)",
            color: "#fff",
          }}
        >
          Update Profile
        </Button>
      </Card>
    </Box>
  );
}
