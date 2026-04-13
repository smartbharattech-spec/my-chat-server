import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Box, 
    Container, 
    Typography, 
    Paper, 
    Button, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Stack,
    MenuItem,
    Chip,
    CircularProgress,
    List,
    ListItem,
    ListItemIcon,
    Divider
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ListIcon from "@mui/icons-material/List";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import MarketplaceSidebar from '../../components/MarketplaceSidebar';
import BlockingOverlay from '../../components/BlockingOverlay';
import { useToast } from '../../services/ToastService';
import courseService from '../../services/courseService';
import './OccultExpertPremium.css';

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=400";

export default function CourseManager() {
    const navigate = useNavigate();
    const thumbnailInputRef = useRef(null);
    const [user, setUser] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [openCurriculumDialog, setOpenCurriculumDialog] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ title: "", description: "", price: "", thumbnail: "", status: "active" });
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [curriculum, setCurriculum] = useState([]);
    const { showToast } = useToast();

    useEffect(() => {
        const storedUser = localStorage.getItem('occult_user');
        if (!storedUser) {
            navigate('/occult/login');
        } else {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchCourses(parsedUser);
        }
    }, [navigate]);

    const fetchCourses = async (userToUse = user) => {
        const activeUser = userToUse || user;
        if (!activeUser) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/courses.php?expert_id=${activeUser.id || activeUser.userId}`);
            const data = await res.json();
            if (data.status === 'success') setCourses(data.data);
        } catch (error) {
            showToast("Error fetching courses", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setThumbnailFile(file);
            setThumbnailPreview(URL.createObjectURL(file));
        }
    };

    const handleSaveCourse = async () => {
        setSaving(true);
        try {
            const body = new FormData();
            Object.keys(formData).forEach(key => body.append(key, formData[key]));
            if (editingId) body.append('id', editingId);
            else body.append('expert_id', user.id || user.userId);
            if (thumbnailFile) body.append('thumbnail_file', thumbnailFile);

            const res = await fetch("/api/courses.php", {
                method: "POST",
                body: body
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                showToast("Course saved successfully", "success");
                setOpenDialog(false);
                setThumbnailFile(null);
                setThumbnailPreview("");
                fetchCourses();
                
                // Automatically open curriculum manager for new courses
                if (!editingId && data.id) {
                    handleOpenCurriculum({ id: data.id });
                }
            } else {
                showToast(data.message || "Error saving course", "error");
            }
        } catch (error) {
            showToast("Network Error", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleOpenCurriculum = async (course) => {
        setLoading(true);
        try {
            const res = await courseService.getCourseById(course.id);
            if (res.status === 'success') {
                setSelectedCourse(res.data);
                let currentCurriculum = res.data.curriculum || [];
                // Automatically add a default section if curriculum is empty
                if (currentCurriculum.length === 0) {
                    currentCurriculum = [{ id: Date.now(), title: "Section 1", lessons: [{ id: Date.now() + 1, title: "Lesson 1", video_url: "", video_filename: "", pdf_filename: "" }] }];
                }
                setCurriculum(currentCurriculum);
                setOpenCurriculumDialog(true);
            }
        } catch (error) {
            showToast("Error loading curriculum", "error");
        } finally {
            setLoading(false);
        }
    };

    const addTopic = () => {
        const newTopic = { id: Date.now(), title: "New Section", lessons: [] };
        setCurriculum([...curriculum, newTopic]);
    };

    const addLesson = (topicId) => {
        setCurriculum(curriculum.map(topic => {
            if (topic.id === topicId) {
                return { 
                    ...topic, 
                    lessons: [...topic.lessons, { id: Date.now(), title: "New Lesson", video_url: "", video_filename: "", pdf_filename: "" }] 
                };
            }
            return topic;
        }));
    };

    const updateLesson = (topicId, lessonId, field, value) => {
        setCurriculum(curriculum.map(topic => {
            if (topic.id === topicId) {
                return {
                    ...topic,
                    lessons: topic.lessons.map(lesson => lesson.id === lessonId ? { ...lesson, [field]: value } : lesson)
                };
            }
            return topic;
        }));
    };

    const saveCurriculum = async () => {
        setSaving(true);
        try {
            const body = new FormData();
            body.append('id', selectedCourse.id);
            body.append('title', selectedCourse.title);
            body.append('description', selectedCourse.description);
            body.append('price', selectedCourse.price);
            body.append('thumbnail', selectedCourse.thumbnail);
            body.append('status', selectedCourse.status);
            body.append('curriculum', JSON.stringify(curriculum));

            const res = await fetch("/api/courses.php", {
                method: "POST",
                body: body
            });
            const data = await res.json();
            if (data.status === 'success') {
                showToast("Curriculum updated!", "success");
                setOpenCurriculumDialog(false);
            }
        } catch (error) {
            showToast("Error saving curriculum", "error");
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;

    return (
        <div className="premium-dashboard-container" style={{ display: 'flex' }}>
            <BlockingOverlay />
            <MarketplaceSidebar user={user} role="expert" />

            <div className="premium-main-wrapper">
                <div className="premium-content-area">
                    <Container maxWidth="xl">
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 900, color: '#1E293B' }}>Course Management</Typography>
                                <Typography variant="body2" color="#64748b" sx={{ fontWeight: 600 }}>Create and manage your educational content</Typography>
                            </Box>
                            <Button 
                                variant="contained" 
                                startIcon={<AddIcon />} 
                                onClick={() => { setEditingId(null); setFormData({ title: "", description: "", price: "", thumbnail: "", status: "active" }); setThumbnailPreview(""); setOpenDialog(true); }}
                                sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' }, borderRadius: '12px', fontWeight: 800, py: 1.5, px: 3 }}
                            >
                                Create New Course
                            </Button>
                        </Box>

                        <TableContainer component={Paper} className="premium-glass-card" sx={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                            <Table>
                                <TableHead sx={{ bgcolor: '#FFFBEB' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, color: '#92400e' }}>COURSE INFO</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#92400e' }}>PRICE</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#92400e' }}>STATUS</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, color: '#92400e' }}>ACTIONS</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading && !openCurriculumDialog ? (
                                        <TableRow><TableCell colSpan={5} align="center" sx={{ py: 10 }}><CircularProgress sx={{ color: '#f59e0b' }} /></TableCell></TableRow>
                                    ) : courses.map((course) => (
                                        <TableRow key={course.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                                    <Box 
                                                        component="img" 
                                                        src={course.thumbnail || PLACEHOLDER_IMAGE} 
                                                        sx={{ width: 60, height: 60, borderRadius: '12px', bgcolor: '#f1f5f9', border: '1px solid #e2e8f0', objectFit: 'cover' }} 
                                                        onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                                                    />
                                                    <Box>
                                                        <Typography sx={{ fontWeight: 800, color: '#0f172a' }}>{course.title}</Typography>
                                                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#94a3b8' }}>ID: #{course.id}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 950, color: '#0f172a' }}>₹{course.price}</TableCell>
                                            <TableCell>
                                                <div className="premium-status-badge" style={{ 
                                                    backgroundColor: course.status === 'active' ? '#dcfce7' : '#f1f5f9', 
                                                    color: course.status === 'active' ? '#166534' : '#64748b' 
                                                }}>
                                                    {course.status.toUpperCase()}
                                                </div>
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton onClick={() => handleOpenCurriculum(course)} sx={{ color: '#f59e0b', bgcolor: 'rgba(245, 158, 11, 0.1)', mr: 1, '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.2)' } }} title="Manage Curriculum"><ListIcon /></IconButton>
                                                <IconButton onClick={() => { setEditingId(course.id); setFormData(course); setThumbnailPreview(course.thumbnail); setOpenDialog(true); }} sx={{ bgcolor: '#f1f5f9', mr: 1 }}><EditIcon /></IconButton>
                                                <IconButton onClick={() => { if(window.confirm("Delete?")) courseService.deleteCourse(course.id).then(fetchCourses); }} sx={{ color: '#EF4444', bgcolor: '#fef2f2' }}><DeleteIcon /></IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Container>

                    {/* 🔸 CREATE/EDIT DIALOG */}
                    <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
                        <DialogTitle sx={{ fontWeight: 900, color: '#0f172a', fontSize: '1.5rem' }}>{editingId ? "Edit Course" : "Create New Course"}</DialogTitle>
                        <DialogContent>
                            <Stack spacing={3} sx={{ mt: 2 }}>
                                <TextField label="Course Title" fullWidth value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} variant="outlined" InputProps={{ sx: { borderRadius: '12px' } }} />
                                <TextField label="Description" multiline rows={3} fullWidth value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} variant="outlined" InputProps={{ sx: { borderRadius: '12px' } }} />
                                <Stack direction="row" spacing={2}>
                                    <TextField label="Price (₹)" type="number" fullWidth value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} variant="outlined" InputProps={{ sx: { borderRadius: '12px' } }} />
                                    <TextField select label="Status" fullWidth value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} variant="outlined" InputProps={{ sx: { borderRadius: '12px' } }}>
                                        <MenuItem value="active">Active</MenuItem>
                                        <MenuItem value="inactive">Inactive</MenuItem>
                                    </TextField>
                                </Stack>
                                
                                <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 800, mb: 1, display: 'block' }}>COURSE THUMBNAIL</Typography>
                                    <Box 
                                        onClick={() => thumbnailInputRef.current?.click()}
                                        sx={{ 
                                            border: '2px dashed #cbd5e1', borderRadius: '16px', p: 3, textAlign: 'center', cursor: 'pointer',
                                            bgcolor: '#f8fafc', '&:hover': { bgcolor: '#f1f5f9', borderColor: '#f59e0b' },
                                            position: 'relative', overflow: 'hidden', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        {thumbnailPreview ? (
                                            <Box component="img" src={thumbnailPreview} sx={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute' }} />
                                        ) : (
                                            <Stack alignItems="center">
                                                <CloudUploadIcon sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#64748b' }}>Click to upload thumbnail</Typography>
                                            </Stack>
                                        )}
                                        <input type="file" ref={thumbnailInputRef} hidden accept="image/*" onChange={handleThumbnailChange} />
                                    </Box>
                                </Box>
                            </Stack>
                        </DialogContent>
                        <DialogActions sx={{ p: 4, pt: 2 }}>
                            <Button onClick={() => setOpenDialog(false)} sx={{ fontWeight: 800, color: '#000000' }}>Cancel</Button>
                            <Button variant="contained" onClick={handleSaveCourse} disabled={saving} sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' }, borderRadius: '12px', fontWeight: 800, px: 4, py: 1.5 }}>
                                {saving ? <CircularProgress size={20} /> : "Save Course"}
                            </Button>
                        </DialogActions>
                    </Dialog>

                    {/* 🔸 CURRICULUM MANAGER DIALOG */}
                    <Dialog open={openCurriculumDialog} onClose={() => setOpenCurriculumDialog(false)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
                        <DialogTitle sx={{ fontWeight: 950, color: '#0f172a', fontSize: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Curriculum Manager
                            <Button startIcon={<AddIcon />} variant="contained" onClick={addTopic} sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' }, borderRadius: '100px' }}>Add Section</Button>
                        </DialogTitle>
                        <DialogContent>
                             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                                {curriculum.map((topic, topicIdx) => (
                                    <Paper key={topic.id} className="premium-glass-card" sx={{ borderRadius: '20px', overflow: 'hidden' }}>
                                        <Box sx={{ p: 2, bgcolor: '#FFFBEB', display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid #fef3c7' }}>
                                            <Typography sx={{ fontWeight: 900, color: '#92400e', minWidth: '100px' }}>SECTION {topicIdx + 1}</Typography>
                                            <TextField 
                                                size="small" fullWidth variant="standard" value={topic.title} 
                                                onChange={(e) => setCurriculum(curriculum.map(t => t.id === topic.id ? {...t, title: e.target.value} : t))}
                                                InputProps={{ sx: { fontWeight: 800, fontSize: '1.1rem' }, disableUnderline: true }}
                                            />
                                            <IconButton size="small" onClick={() => setCurriculum(curriculum.filter(t => t.id !== topic.id))} sx={{ color: '#EF4444', bgcolor: '#fef2f2' }}><DeleteIcon size={18} /></IconButton>
                                            <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addLesson(topic.id)} sx={{ borderRadius: '8px', color: '#f59e0b', borderColor: '#f59e0b' }}>Lesson</Button>
                                        </Box>
                                        <List>
                                            {topic.lessons.map((lesson) => (
                                                <ListItem key={lesson.id} divider sx={{ px: 3, py: 2 }}>
                                                    <ListItemIcon><PlayCircleFilledIcon sx={{ color: '#f59e0b', fontSize: 32 }} /></ListItemIcon>
                                                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                        <TextField label="Lesson Title" size="small" fullWidth value={lesson.title} onChange={(e) => updateLesson(topic.id, lesson.id, 'title', e.target.value)} />
                                                        <TextField label="YouTube URL" size="small" fullWidth value={lesson.video_url} onChange={(e) => updateLesson(topic.id, lesson.id, 'video_url', e.target.value)} />
                                                    </Box>
                                                    <IconButton onClick={() => setCurriculum(curriculum.map(t => t.id === topic.id ? { ...t, lessons: t.lessons.filter(l => l.id !== lesson.id) } : t))} sx={{ ml: 2, color: '#EF4444' }}><DeleteIcon /></IconButton>
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Paper>
                                ))}
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ p: 4 }}>
                            <Button onClick={() => setOpenCurriculumDialog(false)} sx={{ fontWeight: 800, color: '#000000' }}>Cancel</Button>
                            <Button variant="contained" onClick={saveCurriculum} disabled={saving} sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' }, borderRadius: '12px', fontWeight: 800, px: 6, py: 1.5 }}>Save All</Button>
                        </DialogActions>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
