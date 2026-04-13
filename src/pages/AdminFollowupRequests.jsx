import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Container,
    Chip,
    Stack,
    CircularProgress,
    useMediaQuery,
    useTheme
} from "@mui/material";
import { useAuth } from "../services/AuthService";
import { useToast } from "../services/ToastService";
import AdminSidebar from "../components/AdminSidebar";
import { useNavigate } from "react-router-dom";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

export default function AdminFollowupRequests() {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    const [drawerOpen, setDrawerOpen] = useState(isDesktop);

    useEffect(() => {
        setDrawerOpen(isDesktop);
    }, [isDesktop]);
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const { adminUser } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetch("/api/followup_assignments.php?action=list_pending");
            const data = await res.json();
            if (data.status === "success") {
                setRequests(data.data);
            } else {
                showToast(data.message, "error");
            }
        } catch (error) {
            showToast("Failed to fetch requests", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (projectId, action) => {
        try {
            const res = await fetch(`/api/followup_assignments.php?action=${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    project_id: projectId,
                    admin_id: adminUser?.id
                })
            });
            const data = await res.json();
            if (data.status === "success") {
                showToast(data.message, "success");
                if (action === 'accept') {
                    // Redirect to Follow-up Center after accepting
                    setTimeout(() => navigate("/admin/followups"), 1500);
                } else {
                    fetchRequests();
                }
            } else {
                showToast(data.message, "error");
            }
        } catch (error) {
            showToast(`Failed to ${action} project`, "error");
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: "100vh", backgroundColor: "#fffbf7" }}>
            <AdminSidebar open={drawerOpen} onClose={() => setDrawerOpen(!drawerOpen)} isDesktop={isDesktop} />

            <Box sx={{ flexGrow: 1, p: { xs: 2, md: 4 } }}>
                <Container maxWidth="lg">
                    <Typography variant="h4" sx={{ fontWeight: 800, color: "#431407", mb: 1 }}>
                        Follow-up Requests
                    </Typography>
                    <Typography variant="body1" sx={{ color: "#7c2d12", mb: 4, opacity: 0.8 }}>
                        Accept pending follow-up projects to start tracking their progress.
                    </Typography>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
                            <CircularProgress sx={{ color: '#f97316' }} />
                        </Box>
                    ) : (
                        <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                            <Table>
                                <TableHead sx={{ bgcolor: "#fff7ed" }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Project Name</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>User Email</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Plan</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {requests.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                                <Typography variant="body1" sx={{ color: "#9a3412", fontStyle: 'italic' }}>
                                                    No pending follow-up requests found.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        requests.map((req) => (
                                            <TableRow key={req.id}>
                                                <TableCell sx={{ fontWeight: 600 }}>{req.project_name}</TableCell>
                                                <TableCell>{req.email}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={req.plan_name}
                                                        size="small"
                                                        sx={{ bgcolor: "#ffedd5", color: "#9a3412", fontWeight: 700 }}
                                                    />
                                                </TableCell>
                                                <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell align="right">
                                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                        <Button
                                                            variant="contained"
                                                            color="success"
                                                            size="small"
                                                            startIcon={<CheckCircleIcon />}
                                                            onClick={() => handleAction(req.id, 'accept')}
                                                            sx={{ borderRadius: 2, textTransform: 'none' }}
                                                        >
                                                            Accept
                                                        </Button>
                                                        <Button
                                                            variant="outlined"
                                                            color="error"
                                                            size="small"
                                                            startIcon={<CancelIcon />}
                                                            onClick={() => handleAction(req.id, 'reject')}
                                                            sx={{ borderRadius: 2, textTransform: 'none' }}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Container>
            </Box>
        </Box>
    );
}
