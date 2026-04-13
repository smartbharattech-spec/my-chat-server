import {
    Box,
    useMediaQuery,
    useTheme,
    Typography,
    Paper,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Stack,
    CircularProgress,
    InputAdornment,
    Tabs,
    Tab,
    Chip,
    Alert,
    Tooltip as MuiTooltip,
    Collapse
} from "@mui/material";
import { useEffect, useState, Fragment } from "react";
import AdminSidebar from "../components/AdminSidebar";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useToast } from "../services/ToastService";
import { useAuth } from "../services/AuthService";

export default function AdminFollowups() {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    const [drawerOpen, setDrawerOpen] = useState(isDesktop);

    useEffect(() => {
        setDrawerOpen(isDesktop);
    }, [isDesktop]);
    const { showToast } = useToast();
    const { adminUser } = useAuth();
    const isSuperAdmin = adminUser?.role === 'super_admin';

    // Tabs State
    const [tabValue, setTabValue] = useState(0);

    // Master Settings State
    const [followups, setFollowups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [days, setDays] = useState('');
    const [editId, setEditId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Tasks State
    const [tasks, setTasks] = useState([]);
    const [tasksLoading, setTasksLoading] = useState(false);

    // My Assignments State
    const [assignments, setAssignments] = useState([]);
    const [assignmentsLoading, setAssignmentsLoading] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        if (!adminUser) return;
        fetchFollowups(); // Always fetch master settings as they are needed for timeline
    }, [adminUser]);

    useEffect(() => {
        if (!adminUser) return;
        if (tabValue === 0) fetchTasks();
        if (tabValue === 1) fetchAssignments();
        // Tab 2 uses fetchFollowups but it's handled above or can be refreshed manually
    }, [tabValue, adminUser]);

    const fetchFollowups = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/followups.php?action=list");
            const result = await res.json();
            if (result.status === "success") setFollowups(result.data);
        } catch (e) {
            showToast("Failed to fetch master settings", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchAssignments = async () => {
        setAssignmentsLoading(true);
        try {
            const res = await fetch(`/api/followup_assignments.php?action=list_assigned&admin_id=${adminUser?.id}`);
            const result = await res.json();
            if (result.status === "success") setAssignments(result.data);
        } catch (e) {
            showToast("Failed to fetch assignments", "error");
        } finally {
            setAssignmentsLoading(false);
        }
    };

    const fetchTasks = async () => {
        setTasksLoading(true);
        try {
            const res = await fetch(`/api/followups.php?action=list_due&admin_id=${adminUser?.id}&is_super=${isSuperAdmin}`);
            const result = await res.json();
            if (result.status === "success") setTasks(result.data);
        } catch (e) {
            showToast("Failed to fetch follow-up tasks", "error");
        } finally {
            setTasksLoading(false);
        }
    };

    const handleMarkComplete = async (projectId) => {
        try {
            const res = await fetch("/api/followups.php?action=mark_complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ project_id: projectId })
            });
            const result = await res.json();
            if (result.status === "success") {
                showToast("Follow-up marked as completed", "success");
                fetchTasks();
            }
        } catch (e) {
            showToast("Action failed", "error");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !days) return showToast("Please fill all fields", "warning");
        setSubmitting(true);
        const action = editId ? 'update' : 'create';
        const payload = editId ? { id: editId, title, days_interval: days } : { title, days_interval: days };
        try {
            const res = await fetch(`/api/followups.php?action=${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (result.status === "success") {
                showToast(editId ? "Updated successfully" : "Created successfully", "success");
                setTitle(''); setDays(''); setEditId(null);
                fetchFollowups();
            } else {
                showToast(result.message || "Operation failed", "error");
            }
        } catch (e) {
            showToast("Network error", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteMaster = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            const res = await fetch("/api/followups.php?action=delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });
            const result = await res.json();
            if (result.status === "success") {
                showToast("Deleted successfully", "info");
                fetchFollowups();
            }
        } catch (e) {
            showToast("Network error", "error");
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: "100vh", backgroundColor: "#fffbf7" }}>
            <AdminSidebar open={drawerOpen} onClose={() => setDrawerOpen(!drawerOpen)} isDesktop={isDesktop} />

            <Box sx={{ flexGrow: 1, p: { xs: 2, md: 4 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={900} color="#431407">
                            Follow-up Center
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                            Logged in as: {adminUser?.username} (ID: {adminUser?.id}) | Role: {adminUser?.role}
                        </Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                            if (tabValue === 0) fetchTasks();
                            if (tabValue === 1) fetchAssignments();
                            if (tabValue === 2) fetchFollowups();
                            showToast("Data refreshed", "info");
                        }}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                        Refresh Data
                    </Button>
                </Stack>

                <Tabs
                    value={tabValue}
                    onChange={(e, v) => setTabValue(v)}
                    sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
                    textColor="secondary"
                    indicatorColor="secondary"
                >
                    <Tab label="Follow-up Tasks" sx={{ fontWeight: 700, textTransform: 'none' }} />
                    <Tab label="My Assignments" sx={{ fontWeight: 700, textTransform: 'none' }} />
                    {isSuperAdmin && <Tab label="Master Settings" sx={{ fontWeight: 700, textTransform: 'none' }} />}
                </Tabs>

                {tabValue === 0 && (
                    <Box>
                        <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
                            {isSuperAdmin ? "Superadmin View: Showing tasks for all admins." : "My Tasks: Showing follow-ups assigned to you."}
                        </Alert>

                        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #ffedd5' }}>
                            <Table>
                                <TableHead sx={{ bgcolor: '#fff7ed' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800 }}>Project / User</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Follow-up Task</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Due Date</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800 }}>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {tasksLoading ? (
                                        <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={30} /></TableCell></TableRow>
                                    ) : tasks.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}>No pending tasks found for today.</TableCell></TableRow>
                                    ) : tasks.map((task) => (
                                        <TableRow key={task.project_id} hover>
                                            <TableCell>
                                                <Typography variant="subtitle2" fontWeight={700}>{task.project_name}</Typography>
                                                <Typography variant="caption" color="textSecondary">{task.email}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={`Step ${parseInt(task.last_followup_step) + 1}: ${task.followup_title}`} size="small" variant="outlined" color="primary" sx={{ fontWeight: 700 }} />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{task.due_date}</Typography>
                                                {task.is_due ? (
                                                    <Typography color="error" variant="caption" fontWeight={800}>DUE TODAY / OVERDUE</Typography>
                                                ) : (
                                                    <Typography color="info.main" variant="caption">{task.days_remaining} days left</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    icon={task.is_due ? <AccessTimeIcon /> : <CheckCircleIcon />}
                                                    label={task.is_due ? "Alert" : "Upcoming"}
                                                    color={task.is_due ? "error" : "success"}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    startIcon={<CheckCircleIcon />}
                                                    onClick={() => handleMarkComplete(task.project_id)}
                                                    sx={{ borderRadius: 2, textTransform: 'none', px: 2, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
                                                >
                                                    Completed
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}

                {tabValue === 1 && (
                    <Box>
                        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #ffedd5' }}>
                            <Table>
                                <TableHead sx={{ bgcolor: '#fff7ed' }}>
                                    <TableRow>
                                        <TableCell sx={{ width: 50, fontWeight: 800 }}>Timeline</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Project Name</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>User Email</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Accepted On</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Current Step</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800 }}>Plan</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {assignmentsLoading ? (
                                        <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={30} /></TableCell></TableRow>
                                    ) : assignments.length === 0 ? (
                                        <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}>You haven't accepted any projects yet.</TableCell></TableRow>
                                    ) : assignments.map((row) => (
                                        <Fragment key={row.id}>
                                            <TableRow hover>
                                                <TableCell>
                                                    <IconButton size="small" onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}>
                                                        {expandedId === row.id ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                                    </IconButton>
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>{row.project_name}</TableCell>
                                                <TableCell>{row.email}</TableCell>
                                                <TableCell>{row.followup_accepted_at ? new Date(row.followup_accepted_at).toLocaleDateString() : 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Chip label={`Step ${row.last_followup_step}`} size="small" variant="outlined" />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Chip label={row.plan_name || row.plan_title} size="small" sx={{ bgcolor: '#ffedd5', color: '#9a3412', fontWeight: 700 }} />
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell style={{ paddingBottom: 0, paddingTop: 0, backgroundColor: '#fdfaf8' }} colSpan={6}>
                                                    <Collapse in={expandedId === row.id} timeout="auto" unmountOnExit>
                                                        <Box sx={{ margin: 2, p: 2, bgcolor: '#ffffff', borderRadius: 3, border: '1px solid #fed7aa', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                                                            <Typography variant="h6" gutterBottom component="div" sx={{ color: '#9a3412', fontWeight: 800, fontSize: '0.9rem', mb: 2 }}>
                                                                Detailed Follow-up Timeline
                                                            </Typography>
                                                            <Table size="small">
                                                                <TableHead>
                                                                    <TableRow>
                                                                        <TableCell sx={{ fontWeight: 700, color: '#7c2d12' }}>Step</TableCell>
                                                                        <TableCell sx={{ fontWeight: 700, color: '#7c2d12' }}>Title</TableCell>
                                                                        <TableCell sx={{ fontWeight: 700, color: '#7c2d12' }}>Scheduled Date</TableCell>
                                                                        <TableCell sx={{ fontWeight: 700, color: '#7c2d12' }}>Status</TableCell>
                                                                    </TableRow>
                                                                </TableHead>
                                                                <TableBody>
                                                                    {followups.map((step, idx) => {
                                                                        const startDate = new Date(row.followup_start_at || row.created_at);
                                                                        const scheduledDate = new Date(startDate);
                                                                        scheduledDate.setDate(startDate.getDate() + parseInt(step.days_interval));

                                                                        const isCompleted = idx < parseInt(row.last_followup_step);
                                                                        const isCurrent = idx === parseInt(row.last_followup_step);
                                                                        const isOverdue = isCurrent && new Date() > scheduledDate;

                                                                        return (
                                                                            <TableRow key={step.id}>
                                                                                <TableCell>#{idx + 1}</TableCell>
                                                                                <TableCell sx={{ fontWeight: 600 }}>{step.title}</TableCell>
                                                                                <TableCell>{scheduledDate.toLocaleDateString()}</TableCell>
                                                                                <TableCell>
                                                                                    {isCompleted ? (
                                                                                        <Chip label="Completed" size="small" color="success" variant="outlined" sx={{ fontWeight: 700 }} />
                                                                                    ) : isCurrent ? (
                                                                                        <Chip label={isOverdue ? "Overdue" : "Active Now"} size="small" color={isOverdue ? "error" : "primary"} sx={{ fontWeight: 700 }} />
                                                                                    ) : (
                                                                                        <Chip label="Upcoming" size="small" variant="outlined" sx={{ fontWeight: 500, opacity: 0.7 }} />
                                                                                    )}
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        );
                                                                    })}
                                                                </TableBody>
                                                            </Table>
                                                        </Box>
                                                    </Collapse>
                                                </TableCell>
                                            </TableRow>
                                        </Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}

                {tabValue === 2 && isSuperAdmin && (
                    <Box>
                        {/* Master CRUD form and table */}
                        <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 4, border: '1px solid #ffedd5' }}>
                            <form onSubmit={handleSubmit}>
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                                    <TextField label="Followup Name" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                                    <TextField label="After" type="number" fullWidth value={days} onChange={(e) => setDays(e.target.value)} InputProps={{ endAdornment: <InputAdornment position="end">Days</InputAdornment> }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                                    <Button type="submit" variant="contained" disabled={submitting} startIcon={<SaveIcon />} sx={{ height: 56, minWidth: 150, borderRadius: 3, bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' } }}>
                                        {submitting ? <CircularProgress size={24} color="inherit" /> : (editId ? 'Update' : 'Add New')}
                                    </Button>
                                    {editId && <Button onClick={() => { setEditId(null); setTitle(''); setDays(''); }} variant="outlined" sx={{ height: 56, borderRadius: 3 }}>Cancel</Button>}
                                </Stack>
                            </form>
                        </Paper>

                        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #ffedd5' }}>
                            <Table>
                                <TableHead sx={{ bgcolor: '#fff7ed' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800 }}>Follow-up Activity</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Days Interval</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={3} align="center"><CircularProgress size={30} /></TableCell></TableRow>
                                    ) : followups.map((item) => (
                                        <TableRow key={item.id} hover>
                                            <TableCell sx={{ fontWeight: 600 }}>{item.title}</TableCell>
                                            <TableCell>{item.days_interval} Days</TableCell>
                                            <TableCell align="right">
                                                <IconButton onClick={() => { setEditId(item.id); setTitle(item.title); setDays(item.days_interval); }} color="primary"><EditIcon /></IconButton>
                                                <IconButton onClick={() => handleDeleteMaster(item.id)} color="error"><DeleteIcon /></IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
