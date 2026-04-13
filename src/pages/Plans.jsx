import { useState, useEffect } from "react";
import { Box, Typography, Card, CardContent, Stack, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Avatar, IconButton, Menu, MenuItem, Tooltip, Chip } from "@mui/material";
import Divider from '@mui/material/Divider';
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../services/ToastService";

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [loadingPlan, setLoadingPlan] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lastPayment, setLastPayment] = useState(null);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const projectId = queryParams.get("project_id");
  const projectName = queryParams.get("project_name");

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const [userProfile, setUserProfile] = useState(null);
  const [projectProfile, setProjectProfile] = useState(null);

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    const deviceId = localStorage.getItem("device_id");
    await logout(userProfile?.id, deviceId);
    showToast("Logged out successfully", "success");
    navigate("/");
  };

  const fetchUserProfile = async (email) => {
    if (!email) return;
    try {
      const res = await fetch(`/api/user_profile.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fetch", email: email }),
      });
      const data = await res.json();
      if (data.status) {
        setUserProfile(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch user profile");
    }
  };

  const fetchProjectProfile = async (email, id) => {
    if (!email || !id) return;
    try {
      const res = await fetch(`/api/projects.php?action=check&email=${email}&id=${id}`);
      const data = await res.json();
      if (data.status === "success") {
        setProjectProfile(data);
      }
    } catch (error) {
      console.error("Failed to fetch project profile");
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/plans.php");
      const data = await response.json();
      if (data.status === "success") {
        setPlans(data.data);
      } else {
        showToast(data.message, "error");
      }
    } catch (error) {
      showToast("Failed to fetch plans", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const email = localStorage.getItem("email") || "";
    setUserEmail(email);
    fetchPlans();
    fetchUserProfile(email);
    if (projectId) fetchProjectProfile(email, projectId);

    // Handle Payment Status from Redirection
    const status = queryParams.get("status");
    if (status === "success") {
      showToast("Payment Successful!", "success");
      // Clear URL params without reloading
      navigate("/plans", { replace: true });
    } else if (status === "failed") {
      showToast("Payment Failed. Please try again.", "error");
      navigate("/plans", { replace: true });
    }
  }, [projectId]);

  // State for Single Plan Project Modal
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [selectedPlanForProject, setSelectedPlanForProject] = useState(null);
  const [newProjectDetails, setNewProjectDetails] = useState({
    project_name: "",
    construction_type: "Existing",
    project_issue: ""
  });
  const [creatingProject, setCreatingProject] = useState(false);

  const handleProjectDetailsChange = (e) => {
    setNewProjectDetails({ ...newProjectDetails, [e.target.name]: e.target.value });
  };

  const startSinglePlanPurchase = (plan) => {
    setSelectedPlanForProject(plan);
    setProjectModalOpen(true);
  };

  const handleProjectModalClose = () => {
    setProjectModalOpen(false);
    setSelectedPlanForProject(null);
    setNewProjectDetails({ project_name: "", construction_type: "Existing", project_issue: "" });
  };

  const proceedToPaymentWithProject = () => {
    if (!newProjectDetails.project_name) {
      showToast("Please enter a project name", "error");
      return;
    }
    setProjectModalOpen(false);
    // Proceed to buy credits with project details
    handleBuyCredits(selectedPlanForProject, newProjectDetails);
  };

  const handleBuyCredits = async (plan, projectDetails = null) => {
    console.log("handleBuyCredits called for plan:", plan.title, "Type:", plan.plan_type);
    console.log("Project Details:", projectDetails, "Project ID:", projectId);

    if (!userEmail) {
      showToast("User email not found. Please login.", "error");
      return;
    }

    const isSub = userProfile?.plan_type === 'subscription' || userProfile?.plan === 'Marma & Devata Basic';
    const isExpired = userProfile?.plan_expiry && new Date(userProfile.plan_expiry) < new Date();

    // Check if THIS specific plan is already active on the project OR globally
    const isPlanOnProject = String(projectProfile?.plan_id) === String(plan.id) || projectProfile?.plan_name === plan.title;
    const isPlanOnUser = String(userProfile?.plan_id) === String(plan.id) || userProfile?.plan === plan.title;
    const isActive = isPlanOnProject || (isPlanOnUser && !isExpired);

    if (isActive) {
      if (projectId) {
        navigate(`/dashboard?project_id=${projectId}`);
      } else {
        navigate("/dashboard");
      }
      return;
    }

    // Determine purchase type
    let purchaseType = "new_purchase";

    // Treat as "single" if it's explicitly single OR not subscription
    // This allows the modal to open by default if plan_type is missing/null
    if (plan.plan_type !== 'subscription') {
      console.log("Identified as Single Plan (or non-subscription)");
      purchaseType = "single_purchase";
      // If it's a single purchase but no project details are provided yet, open the modal first
      if (!projectDetails && !projectId) { // If inside a project, we don't need new details
        console.log("Opening Project Modal via startSinglePlanPurchase");
        startSinglePlanPurchase(plan);
        return;
      }
    } else if (isSub && !isExpired) {
      if (plan.plan_type === 'subscription') {
        purchaseType = "upgrade";
      }
    }

    const basePrice = parseFloat((plan.price || '0').replace(/[^0-9.]/g, '')) || 0;
    const gstPercent = plan.gst_percentage || 18;
    const totalPrice = Math.round(basePrice + (basePrice * gstPercent / 100));

    const payload = {
      email: userEmail,
      project_id: projectId, // This might be null for new single projects
      plan: plan.title,
      plan_id: plan.id,
      price: totalPrice,
      credits: plan.credits,
      status: "Pending",
      purchase_type: purchaseType,
      current_plan: userProfile?.plan || null,
      current_plan_id: userProfile?.plan_id || null,
      project_details: projectDetails // Pass the new project details
    };
    setLoadingPlan(plan.title);

    try {
      // Handle FREE Plan
      if (plan.is_free == 1) {
        // ... (Free plan logic remains same, maybe enhance for single project later if needed)
        const res = await fetch(`/api/activate_free_plan.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail, project_id: projectId || null, plan_id: plan.id }),
        });
        const data = await res.json();
        if (data.status === "success") {
          showToast(data.message, "success");
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          showToast(data.message, "error");
        }
        return;
      }

      const res = await fetch(`/api/save_payment.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.status === "success") {
        if (data.payment_url) {
          window.location.href = data.payment_url; // Direct redirect if URL provided
        } else {
          // Fallback to manual dialog if no auto-redirect (e.g. manual payment mode)
          setLastPayment({ plan: plan.title, price: plan.price, credits: plan.credits, status: "Pending" });
          setDialogOpen(true);
        }
      } else {
        showToast(data.message || "Something went wrong!", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error connecting to server", "error");
    } finally {
      setLoadingPlan("");
    }
  };
  const handleDialogClose = () => setDialogOpen(false);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", bgcolor: "#fff7ed" }}>
        <CircularProgress sx={{ color: "#f97316" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg,#fff7ed,#ffedd5)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", p: { xs: 2, md: 4 }, fontFamily: "'Poppins', sans-serif", position: "relative" }}>
      {/* User Profile Section */}
      <Box sx={{ position: "absolute", top: 20, right: 20 }}>
        <Tooltip title="Account settings">
          <IconButton
            onClick={handleProfileClick}
            size="small"
            sx={{ ml: 2 }}
            aria-controls={open ? "account-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
          >
            <Avatar sx={{ width: 40, height: 40, bgcolor: "#9a3412", fontWeight: 700 }}>
              {userEmail ? userEmail.charAt(0).toUpperCase() : <AccountCircleIcon />}
            </Avatar>
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={open}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: "visible",
              filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
              mt: 1.5,
              "& .MuiAvatar-root": {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              "&:before": {
                content: '""',
                display: "block",
                position: "absolute",
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: "background.paper",
                transform: "translateY(-50%) rotate(45deg)",
                zIndex: 0,
              },
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem sx={{ pointerEvents: "none", py: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "#4b2e19" }}>{userEmail}</Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: "#ef4444", fontWeight: 600 }}>
            <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
            Logout
          </MenuItem>
        </Menu>
      </Box>

      {/* Back Button */}
      <Box sx={{ position: "absolute", top: 20, left: 20 }}>
        <Tooltip title="Go Back">
          <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: "white", boxShadow: 1, "&:hover": { bgcolor: "#f1f5f9" } }}>
            <ArrowBackIcon sx={{ color: "#9a3412" }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Header */}
      <Box sx={{ textAlign: "center", mb: 5, maxWidth: 700 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: "#9a3412", mb: 1 }}>Vastu Tool Plans & Credits</Typography>
        {projectName && (
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#f97316", mb: 2 }}>
            Selected Project: {projectName}
          </Typography>
        )}
        <Typography sx={{ fontSize: 16, color: "#4b2e19", lineHeight: 1.6 }}>Select a plan to buy credits and unlock complete Vastu insights, detailed room & plot analysis, and actionable remedies.</Typography>
      </Box>

      {/* Plans Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)",
          },
          gap: 4,
          width: "100%",
          maxWidth: 1200,
          mx: "auto",
        }}
      >
        {plans.map((plan) => (
          <Card
            key={plan.id}
            sx={{
              display: "flex",
              flexDirection: "column",
              borderRadius: 4,
              border: "1px solid #fed7aa",
              background: "linear-gradient(180deg,#fff7ed,#ffffff)",
              boxShadow: "0 12px 25px rgba(0,0,0,0.12)",
              transition: "transform 0.3s, box-shadow 0.3s",
              "&:hover": {
                transform: "translateY(-8px)",
                boxShadow: "0 18px 35px rgba(0,0,0,0.18)",
              },
            }}
          >
              <CardContent
                sx={{
                  p: { xs: 2.5, sm: 4 },
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flexGrow: 1,
                }}
              >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: plan.color_start,
                  textAlign: "center",
                  textTransform: "uppercase",
                  mb: 1,
                }}
              >
                {plan.title}
              </Typography>
              {(() => {
                const basePrice = Math.round(parseFloat((plan.price || '0').replace(/[^0-9.]/g, '')) || 0);
                const gstPercent = plan.gst_percentage || 18;
                const gstAmount = Math.round((basePrice * gstPercent) / 100);
                const totalPrice = basePrice + gstAmount;
                return (
                  <>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        mt: 2,
                        mb: 0.5,
                        color: "#9a3412",
                        textAlign: "center",
                      }}
                    >
                      {plan.is_free == 1 ? "FREE" : `₹${totalPrice.toLocaleString('en-IN')}`}
                    </Typography>
                    {plan.is_free != 1 && (
                      <Typography variant="caption" sx={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9a3412', opacity: 0.7, mb: 1 }}>
                        (₹{basePrice.toLocaleString('en-IN')} + {gstPercent}% GST ₹{gstAmount.toLocaleString('en-IN')})
                      </Typography>
                    )}
                    {plan.is_free == 1 && <Box sx={{ mb: 2 }} />}
                  </>
                );
              })()}
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={plan.plan_type === 'subscription' ? 'Subscription' : 'Single Purchase'}
                  size="small"
                  sx={{
                    bgcolor: plan.plan_type === 'subscription' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                    color: plan.plan_type === 'subscription' ? '#3b82f6' : '#f97316',
                    fontWeight: 800,
                    fontSize: 10
                  }}
                />
              </Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Credits: {plan.credits}
              </Typography>
              {plan.validity_days > 0 && (
                <Typography variant="caption" sx={{ color: "#7c2d12", fontWeight: 700, mb: 1 }}>
                  Validity: {plan.validity_days} Days
                </Typography>
              )}
              <Stack spacing={1} sx={{ mb: 3, width: "100%", flexGrow: 1 }}>
                {plan.features && plan.features.map((f, idx) => (
                  <Typography
                    key={idx}
                    sx={{ fontSize: 14, textAlign: "center", color: "#4b2e19" }}
                  >
                    {f}
                  </Typography>
                ))}

                {/* Swap Image Display */}
                {plan.image_swap == 1 && plan.swap_image_url && (
                  <Box sx={{ mt: 2, mb: 2, width: '100%', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "#9a3412", textTransform: 'uppercase', display: 'block', mb: 1 }}>
                      Includes Image Swap
                    </Typography>
                    <img
                      src={`/${plan.swap_image_url}`}
                      alt="Plan Swap"
                      style={{ width: '100%', maxHeight: 150, objectFit: 'contain', borderRadius: 8, border: '1px solid #fed7aa' }}
                    />
                  </Box>
                )}

                {/* Allowed Tools Display */}
                <Box sx={{ mt: 2, width: '100%', textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "#9a3412", textTransform: 'uppercase', display: 'block', mb: 1 }}>
                    Tools Included
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
                    {(() => {
                      const TOOL_NAMES = {
                        1: "Center of Gravity",
                        2: "Shakti Chakra",
                        3: "Basic Vastu",
                        4: "Marma Marking",
                        5: "Zone Areas",
                        6: "Devtas"
                      };

                      let tools = plan.allowed_tools;
                      if (typeof tools === 'string') {
                        try { tools = JSON.parse(tools); } catch (e) { tools = []; }
                      }

                      if (!tools || tools.length === 0) {
                        return <Chip label="All basic tools" size="small" variant="outlined" sx={{ fontSize: 10 }} />;
                      }

                      return tools.map(tid => (
                        <Box key={tid} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircleIcon sx={{ fontSize: 16, color: '#16a34a' }} />
                          <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>
                            {TOOL_NAMES[tid] || `Tool ${tid}`}
                          </Typography>
                        </Box>
                      ));
                    })()}
                  </Box>
                </Box>
              </Stack>
              <Button
                onClick={() => handleBuyCredits(plan)}
                disabled={loadingPlan === plan.title}
                sx={{
                  py: 1.4,
                  px: 6,
                  borderRadius: 3,
                  fontWeight: 800,
                  background: `linear-gradient(135deg,${plan.color_start},${plan.color_end})`,
                  color: "#fff",
                  textTransform: "none",
                  boxShadow: "0 5px 12px rgba(0,0,0,0.1)",
                  "&:hover": { boxShadow: "0 8px 18px rgba(0,0,0,0.15)" },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                {(() => {
                  if (loadingPlan === plan.title) {
                    return <CircularProgress size={24} color="inherit" />;
                  }

                  const isSub = userProfile?.plan_type === 'subscription' || userProfile?.plan === 'Marma & Devata Basic';
                  const isExpired = userProfile?.plan_expiry && new Date(userProfile.plan_expiry) < new Date();

                  const isPlanOnProject = String(projectProfile?.plan_id) === String(plan.id) || projectProfile?.plan_name === plan.title;
                  const isPlanOnUser = String(userProfile?.plan_id) === String(plan.id) || userProfile?.plan === plan.title;
                  const hasUnusedSlot = (userProfile?.unused_single_plans || []).some(up =>
                    String(up.plan_id) === String(plan.id) || up.plan === plan.title
                  );

                  const isActive = isPlanOnProject || (isPlanOnUser && !isExpired) || hasUnusedSlot;

                  if (isActive) {
                    return hasUnusedSlot && !isPlanOnProject ? "Use Credit" : "Open Tool";
                  }

                  if (isSub && !isExpired) {
                    return plan.plan_type === 'subscription' ? "Upgrade Plan" : "Purchase";
                  }

                  return "Buy Credits";
                })()}
              </Button>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Project Details Dialog for Single Plans */}
      <Dialog open={projectModalOpen} onClose={handleProjectModalClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: "#9a3412" }}>
          Create New Project
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, color: "#4b2e19" }}>
            Fill in the details below to start your new Vastu analysis.
          </Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 0.5, color: "#334155" }}>Project Name</Typography>
              <input
                type="text"
                name="project_name"
                value={newProjectDetails.project_name}
                onChange={handleProjectDetailsChange}
                placeholder="e.g. My Dream Home"
                style={{
                  width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "16px"
                }}
              />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 0.5, color: "#334155" }}>Construction Type</Typography>
              <select
                name="construction_type"
                value={newProjectDetails.construction_type}
                onChange={handleProjectDetailsChange}
                style={{
                  width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "16px", background: "white"
                }}
              >
                <option value="Existing">Existing</option>
                <option value="New Construction">New Construction</option>
                <option value="Renovation">Renovation</option>
              </select>
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 0.5, color: "#334155" }}>Primary Objective</Typography>
              <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 0.5 }}>
                What is the main concern you want to address in this project?
              </Typography>
              <select
                name="project_issue"
                value={newProjectDetails.project_issue}
                onChange={handleProjectDetailsChange}
                style={{
                  width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "16px", background: "white"
                }}
              >
                <option value="" disabled>Select Vastu Issue</option>
                <option value="Health">Health</option>
                <option value="Wealth/Finance">Wealth/Finance</option>
                <option value="Relationships">Relationships</option>
                <option value="Career/Job">Career/Job</option>
                <option value="Education">Education</option>
                <option value="General Well-being">General Well-being</option>
                <option value="Other">Other</option>
              </select>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleProjectModalClose} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button
            onClick={proceedToPaymentWithProject}
            variant="contained"
            sx={{
              bgcolor: "#f97316",
              "&:hover": { bgcolor: "#ea580c" },
              fontWeight: 700,
              px: 4
            }}
          >
            Continue to Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Payment Request Saved</DialogTitle>
        <DialogContent>
          {lastPayment && (
            <Typography>Your payment request for <strong>{lastPayment.plan}</strong> ({lastPayment.price}) including <strong>{lastPayment.credits} credits</strong> has been saved. Status: {lastPayment.status}. Please contact support for further details.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">OK</Button>
        </DialogActions>
      </Dialog>
    </Box >
  );
}
