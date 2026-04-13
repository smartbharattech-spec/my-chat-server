const fs = require('fs');
const file = 'c:/xampp/htdocs/myvastutool/src/pages/OccultDashboard/UserTracker.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Imports
content = content.replace(
`    Stack, Rating, Switch, FormControlLabel
} from '@mui/material';`,
`    Stack, Rating, Switch, FormControlLabel, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';`
);

content = content.replace(
`    BarChart2, 
    CheckCircle, `,
`    BarChart2, 
    ChevronDown,
    CheckCircle, `
);

// 2. States
content = content.replace(
`    // Result update states
    const [updateOpen, setUpdateOpen] = useState(false);
    const [selectedSub, setSelectedSub] = useState(null);
    const [experience, setExperience] = useState("");
    const [userImage, setUserImage] = useState(null);
    const [submitting, setSubmitting] = useState(false);`,
`    // Result update states
    const [resultInput, setResultInput] = useState({ id: null, experience: "", image: null });
    const [submitting, setSubmitting] = useState(false);`
);

// 3. handleSendChat
content = content.replace(
`                setUpdateOpen(false);
                setExperience("");
                setUserImage(null);`,
`                setResultInput({ id: null, experience: "", image: null });`
);

// 4. Update helpers
content = content.replace(
`    const handleOpenUpdate = (sub) => {
        setSelectedSub(sub);
        setExperience(sub.experience || "");
        setUserImage(null);
        setUpdateOpen(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            setSnackbar({ open: true, message: 'Image size must be less than 2MB', severity: 'warning' });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setUserImage(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleUpdateResult = async () => {
        if (!experience.trim() && !userImage) {
            setSnackbar({ open: true, message: 'Please enter a message or add a photo', severity: 'warning' });
            return;
        }
        handleSendChat(selectedSub.id, experience, userImage);
    };`,
`    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            setSnackbar({ open: true, message: 'Image size must be less than 2MB', severity: 'warning' });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setResultInput(prev => ({ ...prev, image: reader.result }));
        };
        reader.readAsDataURL(file);
    };`
);

// 5. Replace Paper mapping and Dialog (massive text block)
const startIdx = content.indexOf('{submissions.map((sub, index) => (');
const endStr = '</DialogContent>\r\n            </Dialog>';
const fallbackEndStr = '</DialogContent>\n            </Dialog>';
let idx2 = content.indexOf(endStr);
let shift = endStr.length;
if (idx2 === -1) {
    idx2 = content.indexOf(fallbackEndStr);
    shift = fallbackEndStr.length;
}

if(startIdx !== -1 && idx2 !== -1) {
    const replacement = \`{submissions.map((sub, index) => (
                            <Accordion 
                                key={sub.id || index} 
                                elevation={0}
                                disableGutters
                                sx={{ 
                                    borderRadius: '16px !important', 
                                    border: '1px solid #e2e8f0', 
                                    borderLeft: sub.category === 'remedy' ? '6px solid #f59e0b' : '6px solid #cbd5e1',
                                    mb: 2,
                                    bgcolor: '#fff',
                                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
                                    '&::before': { display: 'none' }
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ChevronDown size={20} color="#64748b" />}
                                    sx={{ px: { xs: 2, md: 3 }, py: 1 }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1, width: '100%' }}>
                                        <Avatar sx={{ bgcolor: sub.category === 'remedy' ? '#fffbeb' : '#f1f5f9', color: sub.category === 'remedy' ? '#d97706' : '#475569', fontWeight: 900, width: 56, height: 56, border: '1px solid #e2e8f0', fontSize: '1.2rem', display: { xs: 'none', sm: 'flex' } }}>
                                            {sub.project_name?.charAt(0) || 'P'}
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                                <Typography variant="h6" fontWeight={900} color="#0f172a" sx={{ fontSize: '1.05rem' }}>
                                                    {sub.project_name || \`Project #\${sub.project_id}\`}
                                                </Typography>
                                                {sub.zone && (
                                                    <Chip label={sub.zone} size="small" sx={{ height: 24, fontSize: '0.75rem', fontWeight: 900, bgcolor: '#f1f5f9', color: '#475569', px: 1 }} />
                                                )}
                                            </Box>
                                            <Typography variant="body2" color="#475569" sx={{ mb: 0, fontWeight: 600 }}>
                                                <strong style={{ color: '#0f172a' }}>Action:</strong> {sub.problem || sub.steps || sub.actions || 'Remedy implementation'}
                                            </Typography>
                                        </Box>
                                        
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, ml: 2, display: { xs: 'none', md: 'flex' } }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: sub.status === 'completed' ? '#dcfce7' : '#fef3c7', color: sub.status === 'completed' ? '#166534' : '#92400e', px: 1.5, py: 0.5, borderRadius: '4px', border: '1px solid', borderColor: sub.status === 'completed' ? '#bbf7d0' : '#fde68a' }}>
                                                {sub.status === 'completed' ? <CheckCircle size={14} /> : <Clock size={14} />}
                                                <Typography variant="caption" fontWeight={900}>
                                                    {sub.status?.toUpperCase() || 'PENDING'}
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" color="textSecondary" fontWeight={600}>
                                                {new Date(sub.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </AccordionSummary>

                                <AccordionDetails sx={{ px: { xs: 2, md: 4 }, pt: 2, pb: 4, borderTop: '1px solid #f1f5f9', bgcolor: '#fafafa' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                        <Typography variant="h6" fontWeight={800} color="#0f172a">Tracker Updates</Typography>
                                        <FormControlLabel
                                            control={
                                                <Switch 
                                                    checked={sub.status === 'completed'} 
                                                    onChange={() => handleToggleStatus(sub)} 
                                                    color="success"
                                                    size="small"
                                                />
                                            }
                                            label={
                                                <Typography variant="caption" fontWeight={900} color="#475569">
                                                    MARK AS COMPLETED
                                                </Typography>
                                            }
                                            labelPlacement="start"
                                        />
                                    </Box>

                                    <Stack spacing={2} sx={{ mb: 4 }}>
                                        {(!chats[sub.id] || chats[sub.id].length === 0) ? (
                                            <Box sx={{ py: 4, textAlign: 'center', bgcolor: '#fff', borderRadius: 4, border: '1px dashed #cbd5e1' }}>
                                                <MessageSquare size={32} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                                                <Typography variant="body2" fontWeight={800} color="#64748b">No Messages Yet</Typography>
                                                <Typography variant="caption" color="textSecondary">Waiting for your first update...</Typography>
                                            </Box>
                                        ) : (
                                            chats[sub.id].map((msg, mIdx) => (
                                                <Box key={msg.id || mIdx} sx={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender_role === 'expert' ? 'flex-start' : 'flex-end' }}>
                                                    <Paper elevation={0} sx={{ p: 2, borderRadius: 4, maxWidth: '85%', bgcolor: msg.sender_role === 'expert' ? '#fff7ed' : '#f0fdf4', border: msg.sender_role === 'expert' ? '1px solid #fed7aa' : '1px solid #dcfce7' }}>
                                                        <Typography variant="caption" fontWeight={900} sx={{ display: 'block', mb: 0.5, color: msg.sender_role === 'expert' ? '#f59e0b' : '#16a34a', fontSize: '0.6rem', textTransform: 'uppercase' }}>
                                                            {msg.sender_role === 'expert' ? 'Expert Advice' : 'My Response'}
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight={600} color={msg.sender_role === 'expert' ? '#92400e' : '#166534'}>
                                                            {msg.message}
                                                        </Typography>
                                                        {msg.image && (
                                                            <Box sx={{ mt: 1.5, borderRadius: 2, overflow: 'hidden' }}>
                                                                <img src={\`/\${msg.image}\`} alt="Attachment" style={{ width: '100%', display: 'block' }} />
                                                            </Box>
                                                        )}
                                                    </Paper>
                                                    <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, fontSize: '0.6rem', px: 1 }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                                                </Box>
                                            ))
                                        )}
                                    </Stack>

                                    {/* Reply Interface */}
                                    {resultInput.id === sub.id ? (
                                        <Box sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 4, bgcolor: '#fff' }}>
                                            <TextField
                                                placeholder="Type an update or ask a question..."
                                                fullWidth
                                                multiline
                                                rows={2}
                                                value={resultInput.experience}
                                                onChange={(e) => setResultInput({ ...resultInput, experience: e.target.value })}
                                                variant="outlined"
                                                sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: '#f8fafc' } }}
                                            />
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Button variant="outlined" onClick={() => fileInputRef.current.click()} startIcon={<ImageIcon size={18} />} sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 800, borderColor: '#e2e8f0', color: '#64748b' }}>
                                                        Add Photo Proof
                                                    </Button>
                                                    <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImageChange} />
                                                    {resultInput.image && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Avatar src={resultInput.image} variant="rounded" sx={{ width: 40, height: 40 }} />
                                                            <Button size="small" color="error" onClick={() => setResultInput({ ...resultInput, image: null })} sx={{ fontWeight: 800, minWidth: 'auto', p: 0.5 }}>Remove</Button>
                                                        </Box>
                                                    )}
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 2 }}>
                                                    <Button onClick={() => setResultInput({ id: null, experience: "", image: null })} sx={{ fontWeight: 800, color: '#64748b' }}>Cancel</Button>
                                                    <Button 
                                                        onClick={() => {
                                                            if (!resultInput.experience.trim() && !resultInput.image) return;
                                                            handleSendChat(sub.id, resultInput.experience, resultInput.image);
                                                        }} 
                                                        variant="contained" 
                                                        disabled={sendingChat === sub.id || (!resultInput.experience.trim() && !resultInput.image)}
                                                        endIcon={sendingChat === sub.id ? <CircularProgress size={16} color="inherit" /> : <ArrowRight size={18} />}
                                                        sx={{ bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' }, borderRadius: 3, px: 3, fontWeight: 900, textTransform: 'none' }}
                                                    >
                                                        Send Update
                                                    </Button>
                                                </Box>
                                            </Box>
                                        </Box>
                                    ) : (
                                        <Button 
                                            variant="contained" 
                                            onClick={() => setResultInput({ id: sub.id, experience: "", image: null })}
                                            startIcon={<MessageSquare size={18} />}
                                            sx={{ bgcolor: '#fff', color: '#0f172a', border: '2px solid #0f172a', '&:hover': { bgcolor: '#f8fafc' }, borderRadius: 3, py: 1, px: 3, fontWeight: 900, textTransform: 'none' }}
                                            fullWidth
                                        >
                                            Post an Update
                                        </Button>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                            ))}
                        </Stack>
                    )}
                </Box>
            </Box>\`
    content = content.substring(0, startIdx) + replacement + content.substring(idx2 + shift);
} else {
    console.log("Could not find replacement block bounds");
}

fs.writeFileSync(file, content);
console.log('Done');
