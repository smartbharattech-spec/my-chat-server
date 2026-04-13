import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  Typography,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  InputAdornment,
  TablePagination,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Schedule";
import ErrorIcon from "@mui/icons-material/Error";
import SearchIcon from "@mui/icons-material/Search";
import { useToast } from "../services/ToastService";
import {
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from "@mui/material";

function MyPlans({ email, onRefresh }) {
  const { showToast } = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userProfile, setUserProfile] = useState(null);

  // Search and Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Deletion/Action States
  const [deleting, setDeleting] = useState(false);
  const [clearPlanDialogOpen, setClearPlanDialogOpen] = useState(false);

  useEffect(() => {
    if (!email) {
      setError("Email not provided");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        // 1. Fetch User Profile for current active plan
        const profileRes = await fetch("/api/user_profile.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "fetch", email }),
        });
        const profileData = await profileRes.json();
        if (profileData.status) {
          setUserProfile(profileData.data);
        }

        // 2. Fetch Payment History
        const API_URL = "/api/myplan.php";
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();
        if (data.status) {
          setPlans(data.plans);
        } else {
          setPlans([]);
        }
      } catch (err) {
        setError("Unable to connect to service. Please try later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [email]);

  const handleClearAccountPlan = async () => {
    setDeleting(true);
    try {
      const response = await fetch("/api/user_profile.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_plan", email }),
      });
      const data = await response.json();
      if (data.status) {
        showToast("Account plan removed successfully", "success");
        setUserProfile({ ...userProfile, plan: null, plan_id: null, plan_type: null, plan_expiry: null });
        if (onRefresh) onRefresh();
      } else {
        showToast(data.message || "Removal failed", "error");
      }
    } catch (error) {
      showToast("Removal failed", "error");
    } finally {
      setDeleting(false);
      setClearPlanDialogOpen(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredPlans = plans.filter((p) =>
    p.plan_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePayNow = (p) => {
    const amount = Math.round(parseFloat(String(p.price).replace(/[^0-9.]/g, '')) || 0);
    const orderId = `PLAN_${p.id}_${Date.now()}`;
    window.location.href = `#/phonepe-payment?amount=${amount}&order_id=${orderId}&type=plan`;
  };

  const displayedPlans = filteredPlans.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress sx={{ color: "#ea580c" }} />
      </Box>
    );
  }

  if (error && plans.length === 0 && !userProfile?.plan) {
    return (
      <Card sx={{ width: "100%", p: 6, borderRadius: 6, border: "1px dashed #fed7aa", textAlign: "center", bgcolor: "rgba(255,255,255,0.4)" }}>
        <Stack spacing={2} alignItems="center">
          <ErrorIcon sx={{ fontSize: 48, color: "#9a3412", opacity: 0.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#9a3412" }}>
            {error || "No plans found for this account"}
          </Typography>
        </Stack>
      </Card>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {userProfile?.plan && (
        <Card sx={{ p: 3, mb: 4, borderRadius: 4, border: "1px solid #fed7aa", background: "linear-gradient(to right, #ffffff, #fff7ed)" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" sx={{ color: "#f97316", fontWeight: 800, textTransform: "uppercase" }}>Current Active Plan</Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: "#431407" }}>{userProfile.plan}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip
                  label={userProfile.plan_type === 'subscription' ? 'Subscription' : 'Lifetime / Single'}
                  size="small"
                  sx={{ bgcolor: "#f97316", color: "#fff", fontWeight: 700 }}
                />
                {userProfile.plan_expiry && (
                  <Chip
                    label={`Expires: ${new Date(userProfile.plan_expiry).toLocaleDateString()}`}
                    size="small"
                    variant="outlined"
                    sx={{ color: "#ef4444", borderColor: "#ef4444", fontWeight: 700 }}
                  />
                )}
              </Stack>
            </Box>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => setClearPlanDialogOpen(true)}
              sx={{ borderRadius: 2, fontWeight: 700, border: "2px solid" }}
            >
              Remove Plan
            </Button>
          </Stack>
        </Card>
      )}

      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} sx={{ mb: 3, gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "#7c2d12" }}>
          Plan Request History
        </Typography>

        <TextField
          size="small"
          placeholder="Search requests..."
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{
            width: { xs: "100%", sm: 260 },
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              backgroundColor: "#fff",
              "& fieldset": { borderColor: "#fed7aa" },
              "&:hover fieldset": { borderColor: "#f97316" },
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#f97316", fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      <Card
        sx={{
          width: "100%",
          borderRadius: 5,
          border: "1px solid #fed7aa",
          overflow: "hidden",
          backgroundColor: "#ffffff",
          boxShadow: "0 4px 20px rgba(124, 45, 18, 0.05)"
        }}
      >
        <Box sx={{ overflowX: "auto" }}>
          <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
            <Box component="thead" sx={{ bgcolor: "#fff7ed" }}>
              <Box component="tr">
                <Box component="th" sx={{ p: 2, textAlign: "left", color: "#9a3412", fontWeight: 800, fontSize: "0.85rem", borderBottom: "1px solid #fed7aa" }}>PLAN TYPE</Box>
                <Box component="th" sx={{ p: 2, textAlign: "left", color: "#9a3412", fontWeight: 800, fontSize: "0.85rem", borderBottom: "1px solid #fed7aa" }}>PRICE</Box>
                <Box component="th" sx={{ p: 2, textAlign: "left", color: "#9a3412", fontWeight: 800, fontSize: "0.85rem", borderBottom: "1px solid #fed7aa" }}>DATE</Box>
                <Box component="th" sx={{ p: 2, textAlign: "left", color: "#9a3412", fontWeight: 800, fontSize: "0.85rem", borderBottom: "1px solid #fed7aa" }}>STATUS</Box>
                <Box component="th" sx={{ p: 2, textAlign: "right", color: "#9a3412", fontWeight: 800, fontSize: "0.85rem", borderBottom: "1px solid #fed7aa" }}>ACTIONS</Box>
              </Box>
            </Box>
            <Box component="tbody">
              {displayedPlans.length === 0 ? (
                <Box component="tr">
                  <Box component="td" colSpan={5} sx={{ p: 6, textAlign: "center", color: "#7c2d12" }}>
                    No matching requests found.
                  </Box>
                </Box>
              ) : (
                displayedPlans.map((p, idx) => {
                  const isApproved = p.status.toLowerCase() === "active" || p.status.toLowerCase() === "approved";
                  const isRejected = p.status.toLowerCase() === "rejected";
                  const isPending = p.status.toLowerCase() === "pending";
                  const priceDisplay = String(p.price).startsWith("₹") ? p.price : `₹${p.price}`;

                  return (
                    <Box component="tr" key={idx} sx={{ "&:hover": { bgcolor: "#fffaf5" }, transition: "background 0.2s" }}>
                      <Box component="td" sx={{ p: 2, borderBottom: "1px solid #fff7ed" }}>
                        <Chip label={p.plan_name} size="small" sx={{ fontWeight: 700, bgcolor: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa" }} />
                      </Box>
                      <Box component="td" sx={{ p: 2, borderBottom: "1px solid #fff7ed" }}>
                        <Typography sx={{ fontWeight: 800, color: "#9a3412" }}>{priceDisplay}</Typography>
                      </Box>
                      <Box component="td" sx={{ p: 2, borderBottom: "1px solid #fff7ed" }}>
                        <Typography variant="body2" sx={{ color: "#7c2d12", opacity: 0.8 }}>
                          {new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </Typography>
                      </Box>
                      <Box component="td" sx={{ p: 2, borderBottom: "1px solid #fff7ed" }}>
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                          <Chip
                            icon={isApproved ? <CheckCircleIcon style={{ fontSize: 16 }} /> : isPending ? <PendingIcon style={{ fontSize: 16 }} /> : <ErrorIcon style={{ fontSize: 16 }} />}
                            label={p.status}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              px: 1,
                              bgcolor: isApproved ? "#dcfce7" : isRejected ? "#fee2e2" : "#fff7ed",
                              color: isApproved ? "#166534" : isRejected ? "#991b1b" : "#9a3412",
                              "& .MuiChip-icon": { color: "inherit" }
                            }}
                          />
                        </Stack>
                      </Box>
                      <Box component="td" sx={{ p: 2, textAlign: "right", borderBottom: "1px solid #fff7ed" }}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          {p.status === "Pending" && (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handlePayNow(p)}
                              sx={{
                                bgcolor: "#ea580c",
                                "&:hover": { bgcolor: "#c2410c" },
                                textTransform: "none",
                                fontWeight: 800,
                                borderRadius: 2,
                                fontSize: "0.7rem",
                                py: 0.5,
                              }}
                            >
                              Pay Now
                            </Button>
                          )}
                        </Stack>
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>
        </Box>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredPlans.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            color: "#9a3412",
            borderTop: "1px solid #fff7ed",
            ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": {
              fontWeight: 600
            }
          }}
        />
      </Card>

      {/* CLEAR ACCOUNT PLAN CONFIRMATION DIALOG */}
      <Dialog
        open={clearPlanDialogOpen}
        onClose={() => !deleting && setClearPlanDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 4, p: 1, minWidth: 320 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#9a3412" }}>Remove Access Plan?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#431407" }}>
            This will remove your current active plan (<strong>{userProfile?.plan}</strong>) access.
            <br />
            You will no longer be able to open tools for projects tied to this plan until you purchase it again.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setClearPlanDialogOpen(false)} disabled={deleting} sx={{ color: "#7c2d12", fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleClearAccountPlan}
            variant="contained"
            color="error"
            disabled={deleting}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            {deleting ? <CircularProgress size={20} color="inherit" /> : "Remove Plan"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MyPlans;
