import {
    Box,
    Typography,
    Container,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Stack,
    MenuItem,
    Chip,
    useMediaQuery,
    useTheme
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import { useState, useEffect } from "react";
import { useAuth } from "../services/AuthService";
import { useToast } from "../services/ToastService";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";

const VASTU_TOOLS = [
    "General",
    "Center",
    "Shakti Chakra",
    "Remedies Analysis",
    "Marma Marking",
    "Zone Wise Area",
    "Devta Mandala"
];

export default function AdminTutorials() {
    const { isAdminLoggedIn } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    const [tutorials, setTutorials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ title: "", description: "", video_url: "", tool_name: "General", video: null });
    const [editingId, setEditingId] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(isDesktop);

    useEffect(() => {
        if (!isAdminLoggedIn) {
            navigate("/admin");
            return;
        }
        fetchTutorials();
    }, [isAdminLoggedIn, navigate]);

    useEffect(() => {
        setDrawerOpen(isDesktop);
    }, [isDesktop]);

    const fetchTutorials = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/tutorials.php");
            const data = await res.json();
            if (data.status === "success") {
                setTutorials(data.data);
            }
        } catch (error) {
            showToast("Error fetching tutorials", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (tut = null) => {
        if (tut) {
            setEditingId(tut.id);
            setFormData({
                title: tut.title,
                description: tut.description,
                video_url: tut.video_url || "",
                tool_name: tut.tool_name || "General",
                video: null
            });
        } else {
            setEditingId(null);
            setFormData({ title: "", description: "", video_url: "", tool_name: "General", video: null });
        }
        setOpenDialog(true);
    };

    const handleSave = async () => {
        if (!formData.title) {
            showToast("Title is required", "error");
            return;
        }
        setSaving(true);
        try {
            const body = new FormData();
            body.append("title", formData.title);
            body.append("description", formData.description);
            body.append("video_url", formData.video_url);
            body.append("tool_name", formData.tool_name);
            if (formData.video) body.append("video", formData.video);
            if (editingId) body.append("id", editingId);

            const res = await fetch("/api/tutorials.php", {
                method: "POST",
                body: body
            });
            const data = await res.json();
            if (data.status === "success") {
                showToast(editingId ? "Tutorial updated" : "Tutorial created", "success");
                setOpenDialog(false);
                fetchTutorials();
            } else {
                showToast(data.message, "error");
            }
        } catch (error) {
            showToast("Error saving tutorial", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this tutorial?")) return;
        try {
            const res = await fetch("/api/tutorials.php", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });
            const data = await res.json();
            if (data.status === "success") {
                showToast("Tutorial deleted", "success");
                fetchTutorials();
            }
        } catch (error) {
            showToast("Error deleting tutorial", "error");
        }
    };

    const toggleDrawer = () => setDrawerOpen(!drawerOpen);

    return (
        <Box sx={{ display: 'flex', minHeight: "100vh", backgroundColor: "#fffbf7" }}>
            <AdminSidebar open={drawerOpen} onClose={toggleDrawer} isDesktop={isDesktop} />
            <Box sx={{ flexGrow: 1, width: { md: `calc(100% - ${drawerOpen ? 260 : 80}px)` }, transition: 'width 0.3s' }}>
                <Container maxWidth="xl" sx={{ mt: { xs: 4, md: 6 }, mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: "#431407", mb: 1 }}>
                                Manage Tutorials
                            </Typography>
                            <Typography variant="body1" sx={{ color: "#7c2d12", opacity: 0.8 }}>
                                Add and manage video tutorials for your users.
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog()}
                            sx={{ bgcolor: '#f97316', fontWeight: 800, textTransform: 'none', px: 3, borderRadius: "10px", '&:hover': { bgcolor: '#ea580c' } }}
                        >
                            Add Tutorial
                        </Button>
                    </Box>

                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #ffedd5' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: "#fff7ed" }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>Title</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>Tool</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>Description</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: "#9a3412" }}>Video</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, color: "#9a3412" }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={5} align="center"><CircularProgress /></TableCell></TableRow>
                                ) : tutorials.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} align="center">No tutorials found.</TableCell></TableRow>
                                ) : (
                                    tutorials.map((tut) => (
                                        <TableRow key={tut.id} sx={{ '&:hover': { bgcolor: "#fffaf5" } }}>
                                            <TableCell sx={{ fontWeight: 700 }}>{tut.title}</TableCell>
                                            <TableCell>
                                                <Chip size="small" label={tut.tool_name || "General"} sx={{ fontWeight: 800, bgcolor: "#fff7ed", color: "#f97316" }} />
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tut.description}</TableCell>
                                            <TableCell>
                                                {tut.video_filename ? (
                                                    <Chip size="small" label="File Uploaded" color="primary" variant="outlined" />
                                                ) : (
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{tut.video_url}</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton onClick={() => handleOpenDialog(tut)} sx={{ color: "#f97316" }}><EditIcon /></IconButton>
                                                <IconButton onClick={() => handleDelete(tut.id)} sx={{ color: "#ef4444" }}><DeleteIcon /></IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Container>
            </Box>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 900, color: "#431407" }}>{editingId ? "Edit Tutorial" : "Add New Tutorial"}</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            label="Title"
                            fullWidth
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                        <TextField
                            select
                            label="Target Tool"
                            fullWidth
                            value={formData.tool_name}
                            onChange={(e) => setFormData({ ...formData, tool_name: e.target.value })}
                        >
                            {VASTU_TOOLS.map((tool) => (
                                <MenuItem key={tool} value={tool}>{tool}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                        <TextField
                            label="External Video URL (YouTube/Vimeo)"
                            fullWidth
                            value={formData.video_url}
                            onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                        />
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Upload Video File (Alternative)</Typography>
                            <input
                                type="file"
                                accept="video/*"
                                onChange={(e) => setFormData({ ...formData, video: e.target.files[0] })}
                            />
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenDialog(false)} sx={{ fontWeight: 700, color: "#9a3412" }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={saving}
                        sx={{ bgcolor: '#f97316', fontWeight: 800, borderRadius: "8px", px: 4, '&:hover': { bgcolor: '#ea580c' } }}
                    >
                        {saving ? <CircularProgress size={24} color="inherit" /> : "Save Tutorial"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
