import { Box, Typography, Card, CardContent, Stack, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Avatar, IconButton, Menu, MenuItem, Tooltip, Chip, Alert, Select, OutlinedInput, Checkbox, ListItemText, FormControl } from "@mui/material";
import Divider from '@mui/material/Divider';
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useToast } from "../services/ToastService";

export default function BuyPlans({ email, onPurchase, projectId, projectName }) {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingPlan, setLoadingPlan] = useState("");
    // State for Single Plan Project Modal
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [selectedPlanForProject, setSelectedPlanForProject] = useState(null);
    const [newProjectDetails, setNewProjectDetails] = useState({
        project_name: "",
        construction_type: "Existing",
        project_issue: []
    });

    const handleProjectDetailsChange = (e) => {
        const { name, value } = e.target;
        setNewProjectDetails({
            ...newProjectDetails,
            [name]: value
        });
    };

    const [dialogOpen, setDialogOpen] = useState(false);
    const [lastPayment, setLastPayment] = useState(null);
    const { showToast } = useToast();
    const [userProfile, setUserProfile] = useState(null);
    const [projectProfile, setProjectProfile] = useState(null);

    useEffect(() => {
        fetchPlans();
        if (email) fetchUserProfile(email);
        if (email && projectId) fetchProjectProfile(email, projectId);
    }, [email, projectId]);

    const fetchProjectProfile = async (email, id) => {
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

    const fetchUserProfile = async (email) => {
        try {
            const res = await fetch("/api/user_profile.php", {
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

    const fetchPlans = async () => {
        try {
            const res = await fetch("/api/plans.php");
            const data = await res.json();
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

    const startSinglePlanPurchase = (plan) => {
        setSelectedPlanForProject(plan);
        setProjectModalOpen(true);
    };

    const handleProjectModalClose = () => {
        setProjectModalOpen(false);
        setSelectedPlanForProject(null);
        setNewProjectDetails({ project_name: "", construction_type: "Existing", project_issue: [] });
    };

    const proceedToPaymentWithProject = async () => {
        if (!newProjectDetails.project_name) {
            showToast("Please enter a project name", "error");
            return;
        }
        if (newProjectDetails.project_issue.length === 0) {
            showToast("Please select at least one objective", "error");
            return;
        }

        setProjectModalOpen(false);
        setLoadingPlan(selectedPlanForProject.title);

        try {
            // 1. Create the project IMMEDIATELY
            const projectRes = await fetch("/api/projects.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    project_name: newProjectDetails.project_name,
                    construction_type: newProjectDetails.construction_type,
                    project_issue: newProjectDetails.project_issue.join(", "),
                    plan_name: selectedPlanForProject.title,
                    plan_id: selectedPlanForProject.id
                }),
            });

            const projectData = await projectRes.json();

            if (projectData.status === "success") {
                const newProjectId = projectData.id;
                showToast("Project created. Proceeding to payment...", "success");

                // 2. Start purchase flow WITH the new project ID
                // Convert array to comma-separated string for legacy consistency if needed
                const detailsToSend = {
                    ...newProjectDetails,
                    project_issue: newProjectDetails.project_issue.join(", ")
                };

                await handleBuyCredits(selectedPlanForProject, detailsToSend, newProjectId);
            } else {
                showToast(projectData.message || "Failed to create project", "error");
                setLoadingPlan("");
            }
        } catch (err) {
            showToast("Error creating project", "error");
            setLoadingPlan("");
        }
    };

    const handleBuyCredits = async (plan, projectDetails = null, forcedProjectId = null) => {
        if (!email) {
            showToast("User email not found. Please login.", "error");
            return;
        }

        const isSub = userProfile?.plan_type === 'subscription' || userProfile?.plan === 'Marma & Devata Basic';
        const isExpired = userProfile?.plan_expiry && new Date(userProfile.plan_expiry) < new Date();

        // Check if active on project or user global
        const isPlanOnProject = String(projectProfile?.plan_id) === String(plan.id) || projectProfile?.plan_name === plan.title;
        const isPlanOnUser = String(userProfile?.plan_id) === String(plan.id) || userProfile?.plan === plan.title;
        const isActive = isPlanOnProject || (isPlanOnUser && !isExpired);

        if (isActive) {
            if (projectId) {
                // If it's a project specific view, launch the tool (assuming dashboard handles it via state or we just reload)
                // For now, consistent with Plans.jsx, navigate to dashboard with project_id
                window.location.href = `/dashboard?project_id=${projectId}`;
            } else {
                window.location.href = "/dashboard";
            }
            return;
        }

        // Determine purchase type
        let purchaseType = "new_purchase";

        // Treat as "single" if it's explicitly single OR not subscription
        // This allows the modal to open by default if plan_type is missing/null
        if (plan.plan_type !== 'subscription') {
            purchaseType = "single_purchase";
            // If it's a single purchase but no project details are provided yet, open the modal first
            if (!projectDetails && !projectId) { // If inside a project, we don't need new details
                startSinglePlanPurchase(plan);
                return;
            }
        } else if (isSub && !isExpired) {
            if (plan.plan_type === 'subscription') {
                purchaseType = "upgrade";
            }
        }

        const basePriceStr = typeof plan.price === 'string' ? plan.price : String(plan.price);
        const basePrice = Math.round(parseFloat(basePriceStr.replace(/[^0-9.]/g, '')) || 0);
        const gstPercent = plan.gst_percentage || 18;
        const totalPrice = Math.round(basePrice + (basePrice * gstPercent / 100));

        const effectiveProjectId = projectId || forcedProjectId;

        const payload = {
            email: email,
            project_id: effectiveProjectId || null,
            plan: plan.title,
            plan_id: plan.id,
            price: totalPrice,
            credits: plan.credits,
            status: "Pending",
            purchase_type: purchaseType,
            current_plan: userProfile?.plan || null,
            current_plan_id: userProfile?.plan_id || null,
            project_details: projectDetails // Pass the new project details - CRITICALLY IMPORTANT
        };
        setLoadingPlan(plan.title);

        try {
            // Handle FREE Plan
            if (plan.is_free == 1) {
                const res = await fetch("/api/activate_free_plan.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email,
                        project_id: effectiveProjectId || null,
                        plan_id: plan.id,
                        project_details: projectDetails
                    }),
                });
                const data = await res.json();
                if (data.status === "success") {
                    showToast(data.message, "success");
                    if (onPurchase) onPurchase();
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    showToast(data.message, "error");
                }
                return;
            }

            const res = await fetch("/api/save_payment.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (data.status === "success") {
                const paymentId = data.id;
                // Generate unique Order ID: PLAN_{id}_{timestamp}
                const orderId = `PLAN_${paymentId}_${Date.now()}`;
                // Redirect to Payment Page
                window.location.href = `/phonepe-payment?amount=${totalPrice}&order_id=${orderId}&type=plan`;
            } else {
                showToast(data.message || "Failed to save request", "error");
            }
        } catch (err) {
            showToast("Error connecting to server", "error");
        } finally {
            setLoadingPlan("");
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                <CircularProgress sx={{ color: "#f97316" }} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 1, md: 2 } }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#9a3412", mb: 1 }}>Plans & Credits</Typography>
                <Typography sx={{ color: "#4b2e19", opacity: 0.8 }}>Choose a plan to unlock premium Vastu tools.</Typography>
            </Box>

            {projectName && (
                <Alert severity="info" sx={{ mb: 3, borderRadius: '12px' }}>
                    Applying to project: <strong>{projectName}</strong>
                </Alert>
            )}

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        lg: "repeat(3, 1fr)",
                    },
                    gap: 3,
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
                            background: "#fff",
                            transition: "transform 0.3s",
                            "&:hover": { transform: "translateY(-4px)" },
                        }}
                    >
                        <CardContent sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center", flexGrow: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: plan.color_start, mb: 1 }}>{plan.title}</Typography>
                            {(() => {
                                const basePriceStr = typeof plan.price === 'string' ? plan.price : String(plan.price);
                                const basePrice = Math.round(parseFloat(basePriceStr.replace(/[^0-9.]/g, '')) || 0);
                                const gstPercent = plan.gst_percentage || 18;
                                const gstAmount = Math.round((basePrice * gstPercent) / 100);
                                const totalPrice = basePrice + gstAmount;

                                return (
                                    <>
                                        <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, mb: 0.5, color: "#9a3412" }}>
                                            {plan.is_free == 1 ? "FREE" : `₹${totalPrice.toLocaleString('en-IN')}`}
                                        </Typography>
                                        {plan.is_free != 1 && (
                                            <Typography variant="caption" sx={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9a3412', opacity: 0.7, mb: 2 }}>
                                                (₹{basePrice.toLocaleString('en-IN')} + {gstPercent}% GST ₹{gstAmount.toLocaleString('en-IN')})
                                            </Typography>
                                        )}
                                        {plan.is_free == 1 && <Box sx={{ mb: 2 }} />}
                                    </>
                                );
                            })()}

                            <Chip
                                label={plan.plan_type === 'subscription' ? 'Subscription' : 'Single Purchase'}
                                size="small"
                                sx={{ mb: 2, fontWeight: 700, fontSize: '0.65rem' }}
                            />

                            <Stack spacing={1} sx={{ mb: 3, width: "100%", flexGrow: 1 }}>
                                {(() => {
                                    let features = [];
                                    try {
                                        features = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || []);
                                    } catch (e) { features = [plan.features]; }

                                    if (!Array.isArray(features)) features = [features];

                                    return features.map((f, idx) => (
                                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CheckCircleIcon sx={{ fontSize: 14, color: '#16a34a' }} />
                                            <Typography sx={{ fontSize: 13, color: "#4b2e19" }}>{f}</Typography>
                                        </Box>
                                    ));
                                })()}
                            </Stack>

                            {/* Swap Image Display */}
                            {plan.image_swap == 1 && plan.swap_image_url && (
                                <Box sx={{ mb: 3, width: '100%', textAlign: 'center' }}>
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

                            <Button
                                variant="contained"
                                onClick={() => {
                                    if (plan.plan_type === 'single' && !projectId) {
                                        startSinglePlanPurchase(plan);
                                    } else {
                                        handleBuyCredits(plan);
                                    }
                                }}
                                disabled={
                                    loadingPlan === plan.title ||
                                    (() => {
                                        const isExpired = userProfile?.plan_expiry && new Date(userProfile.plan_expiry) < new Date();
                                        const isPlanOnProject = String(projectProfile?.plan_id) === String(plan.id) || projectProfile?.plan_name === plan.title;
                                        const isPlanOnUser = String(userProfile?.plan_id) === String(plan.id) || userProfile?.plan === plan.title;
                                        const hasUnusedSlot = (userProfile?.unused_single_plans || []).some(up =>
                                            String(up.plan_id) === String(plan.id) || up.plan === plan.title
                                        );
                                        const isActive = isPlanOnProject || (isPlanOnUser && !isExpired) || hasUnusedSlot;
                                        // Disable if it's active AND we aren't just showing "Use Credit"
                                        return isActive && !(hasUnusedSlot && !isPlanOnProject);
                                    })()
                                }
                                fullWidth
                                sx={{
                                    py: 1.5,
                                    borderRadius: "12px",
                                    background: `linear-gradient(135deg,${plan.color_start},${plan.color_end})`,
                                    fontWeight: 700,
                                    textTransform: "none",
                                    "&.Mui-disabled": {
                                        background: "#e2e8f0",
                                        color: "#94a3b8"
                                    }
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

                                    if (isActive) return hasUnusedSlot && !isPlanOnProject ? "Use Credit" : "Purchased";
                                    if (isSub && !isExpired) {
                                        return plan.plan_type === 'subscription' ? "Upgrade Plan" : "Purchase";
                                    }

                                    return "Select Plan";
                                })()}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
                <DialogTitle sx={{ fontWeight: 800 }}>Payment Request Sent</DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: '#4b2e19' }}>
                        Your request for <strong>{lastPayment?.plan}</strong> has been received. Please contact admin to activate.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setDialogOpen(false)} variant="contained" sx={{ borderRadius: '10px' }}>Got it</Button>
                </DialogActions>
            </Dialog>

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
                                Select multiple concerns if needed.
                            </Typography>

                            <FormControl fullWidth size="small">
                                <Select
                                    multiple
                                    name="project_issue"
                                    value={newProjectDetails.project_issue}
                                    onChange={handleProjectDetailsChange}
                                    input={<OutlinedInput />}
                                    renderValue={(selected) => selected.join(', ')}
                                    sx={{
                                        borderRadius: "8px",
                                        background: "white",
                                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" }
                                    }}
                                >
                                    {["Health", "Wealth/Finance", "Relationships", "Career/Job", "Education", "General Well-being", "Other"].map((name) => (
                                        <MenuItem key={name} value={name}>
                                            <Checkbox checked={newProjectDetails.project_issue.indexOf(name) > -1} size="small" />
                                            <ListItemText primary={name} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
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
        </Box>
    );
}
