import React, { useState, useEffect, useRef } from 'react';
import './ExpertTracker.css';
import { 
    BarChart2, 
    CheckCircle, 
    Clock, 
    Activity, 
    MessageSquare, 
    Calendar,
    User as UserIcon,
    Folder,
    AlertCircle,
    Image as ImageIcon,
    Plus,
    X,
    ChevronRight,
    Target,
    ChevronLeft,
    Loader2
} from 'lucide-react';
import MarketplaceSidebar from '../../components/MarketplaceSidebar';
import BlockingOverlay from '../../components/BlockingOverlay';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_TRACKER = '/api/tracker.php';
const API_PROJECTS = '/api/projects.php';
const API_FOLLOWERS = '/api/marketplace/get_followers.php';

export default function ExpertTracker() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submissions, setSubmissions] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    
    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Note/Result Dialog states
    const [noteDialogOpen, setNoteDialogOpen] = useState(false);
    const [selectedSub, setSelectedSub] = useState(null);
    const [currentNote, setCurrentNote] = useState("");
    const [expertImage, setExpertImage] = useState(null);
    const [resultStatus, setResultStatus] = useState('working');
    const [saving, setSaving] = useState(false);

    // Chat / Multi-reply state
    const [chats, setChats] = useState({}); // { submissionId: [messages] }
    const [sendingChat, setSendingChat] = useState(null); // submissionId

    // Initiation Dialog states
    const [initiateOpen, setInitiateOpen] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [followers, setFollowers] = useState([]);
    const [selectedFollower, setSelectedFollower] = useState(null);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [remedies, setRemedies] = useState([]);
    const [selectedRemedy, setSelectedRemedy] = useState(null);
    const [initiationNote, setInitiationNote] = useState("");

    const fileInputRef = useRef(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('occult_user');
        if (!storedUser) {
            navigate('/occult/login');
        } else {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchSubmissions(parsedUser.email);
            fetchFollowers(parsedUser.id);
        }
    }, [navigate]);

    const fetchSubmissions = async (email) => {
        setLoading(true);
        try {
            const resp = await axios.get(`${API_TRACKER}?email=${encodeURIComponent(email)}`);
            if (resp.data.status === 'success') {
                setSubmissions(resp.data.data);
                resp.data.data.forEach(sub => fetchChats(sub.id));
            }
        } catch (err) {
            showSnackbar('Failed to fetch tracker data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchChats = async (submissionId) => {
        try {
            const resp = await axios.post(API_TRACKER, { action: 'get_chats', submission_id: submissionId });
            if (resp.data.status === 'success') {
                setChats(prev => ({ ...prev, [submissionId]: resp.data.data }));
            }
        } catch (e) {
            console.error("Failed to fetch chats for", submissionId);
        }
    };

    const handleSendChat = async (submissionId, message, image = null) => {
        if (!message.trim() && !image) return;
        
        setSendingChat(submissionId);
        try {
            const resp = await axios.post(API_TRACKER, {
                action: 'send_chat',
                submission_id: submissionId,
                role: 'expert',
                message: message.trim(),
                image: image
            });
            if (resp.data.status === 'success') {
                fetchChats(submissionId);
                fetchSubmissions(user.email); 
                setNoteDialogOpen(false);
                setCurrentNote("");
                setExpertImage(null);
            }
        } catch (e) {
            showSnackbar('Failed to send message', 'error');
        } finally {
            setSendingChat(null);
        }
    };

    const fetchFollowers = async (expertId) => {
        try {
            const resp = await axios.get(`${API_FOLLOWERS}?expert_id=${expertId}`);
            if (resp.data.status === 'success') setFollowers(resp.data.data);
        } catch (err) { console.error("Followers fetch error", err); }
    };

    const fetchProjects = async (followerEmail) => {
        try {
            const resp = await axios.get(`${API_PROJECTS}?email=${encodeURIComponent(followerEmail)}`);
            if (resp.data.status === 'success') setProjects(resp.data.data);
        } catch (err) { console.error("Projects fetch error", err); }
    };

    const fetchRemedies = async (projectId) => {
        try {
            const resp = await axios.post(API_TRACKER, { action: 'get_project_remedies', project_id: projectId });
            if (resp.data.status === 'success') setRemedies(resp.data.data);
        } catch (err) { console.error("Remedies extract error", err); }
    };

    const handleInitiateOpen = () => {
        setInitiateOpen(true);
        setActiveStep(0);
        setSelectedFollower(null);
        setSelectedProject(null);
        setSelectedRemedy(null);
    };

    const handleNext = () => {
        if (activeStep === 0 && selectedFollower) {
            fetchProjects(selectedFollower.email);
            setActiveStep(1);
        } else if (activeStep === 1 && selectedProject) {
            fetchRemedies(selectedProject.id);
            setActiveStep(2);
        } else if (activeStep === 2 && selectedRemedy) {
            setActiveStep(3);
        }
    };

    const handleBack = () => setActiveStep((prev) => prev - 1);

    const handleCreateTracker = async () => {
        setSaving(true);
        try {
            const resp = await axios.post(API_TRACKER, {
                action: 'submit',
                project_id: selectedProject.id,
                project_name: selectedProject.project_name,
                email: selectedFollower.email,
                problem: selectedRemedy.problem,
                steps: selectedRemedy.steps,
                remedy_id: selectedRemedy.id,
                category: 'remedy',
                zone: selectedRemedy.zone,
                initiated_by: 'expert',
                admin_email: user.email,
                experience: initiationNote
            });

            if (resp.data.status === 'success') {
                showSnackbar('Tracker initiated successfully!', 'success');
                setInitiateOpen(false);
                fetchSubmissions(user.email);
            } else {
                showSnackbar(resp.data.message, 'error');
            }
        } catch (err) {
            showSnackbar('Failed to create tracker', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleOpenNoteDialog = (sub) => {
        setSelectedSub(sub);
        setCurrentNote(sub.admin_note || "");
        setResultStatus(sub.result_status || 'working');
        setExpertImage(null);
        setNoteDialogOpen(true);
    };

    const handleSaveNote = async () => {
        if (!currentNote.trim() && !expertImage) {
            showSnackbar('Please enter a message or add a photo', 'warning');
            return;
        }

        setSaving(true);
        try {
            if (resultStatus !== selectedSub.result_status) {
                await axios.post(API_TRACKER, {
                    action: 'update_note',
                    id: selectedSub.id,
                    result_status: resultStatus
                });
            }
            await handleSendChat(selectedSub.id, currentNote, expertImage);
            showSnackbar('Expert observation shared!', 'success');
        } catch (err) {
            showSnackbar('Failed to save observation', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setExpertImage(reader.result);
        reader.readAsDataURL(file);
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
        setTimeout(() => setSnackbar({ open: false, message: '', severity: 'success' }), 4000);
    };

    const paginatedSubmissions = submissions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <div className="tracker-container">
            <BlockingOverlay />
            <MarketplaceSidebar user={user} role="expert" />

            <div className="tracker-content">
                <div className="tracker-header">
                    <div className="header-title-group">
                        <div className="title-icon-wrapper">
                            <Target size={32} color="#f59e0b" />
                        </div>
                        <div className="tracker-title">
                            <h1>Result Tracker</h1>
                            <p>Monitor how your remedies are performing on the ground.</p>
                        </div>
                    </div>
                    <button className="btn-primary" onClick={handleInitiateOpen}>
                        <Plus size={18} /> Track New Remedy
                    </button>
                </div>

                <div className="tracker-table-card">
                    <div className="table-responsive hidden-mobile">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Project & User</th>
                                    <th>Assigned Remedy</th>
                                    <th>User Experience</th>
                                    <th>Expert Comment / Result</th>
                                    <th style={{ textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="empty-state">
                                            <Loader2 className="animate-spin" size={32} />
                                            <p style={{ marginTop: '1rem' }}>Loading tracking data...</p>
                                        </td>
                                    </tr>
                                ) : paginatedSubmissions.length > 0 ? (
                                    paginatedSubmissions.map((sub) => (
                                        <tr key={sub.id}>
                                            <td>
                                                <span className="project-name">{sub.p_name || sub.project_name}</span>
                                                <span className="user-email">{sub.user_email}</span>
                                                <div className="status-badge-container">
                                                    <span className={`status-badge ${
                                                        sub.result_status === 'resolved' ? 'status-resolved' : 
                                                        (sub.status === 'completed' ? 'status-new' : 'status-working')
                                                    }`}>
                                                        {sub.result_status === 'resolved' ? 'RESOLVED' : (sub.status === 'completed' ? 'NEW RESPONSE' : 'WORKING')}
                                                    </span>
                                                    {sub.status === 'completed' && sub.result_status !== 'resolved' && (
                                                        <div className="pulse-dot" title="Action Required" />
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="remedy-problem">{sub.problem}</span>
                                                <span className="remedy-steps">{sub.steps}</span>
                                                {sub.zone && <span className="zone-chip">{sub.zone}</span>}
                                            </td>
                                            <td>
                                                {sub.experience ? (
                                                    <div className="experience-wrapper">
                                                        <p className="experience-quote">"{sub.experience}"</p>
                                                        {sub.user_image && (
                                                            <img src={`/${sub.user_image}`} className="submission-img" alt="User upload" />
                                                        )}
                                                    </div>
                                                ) : <span className="item-sub">⏱️ Waiting for user...</span>}
                                            </td>
                                            <td>
                                                {sub.admin_note ? (
                                                    <div>
                                                        <p className="expert-comment">{sub.admin_note}</p>
                                                        {sub.expert_image && (
                                                            <img src={`/${sub.expert_image}`} className="submission-img" alt="Expert guidance" />
                                                        )}
                                                    </div>
                                                ) : <span className="item-sub">No result recorded yet</span>}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button className="btn-outline" onClick={() => handleOpenNoteDialog(sub)}>
                                                    Record Result
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="empty-state">
                                            <AlertCircle size={48} color="#e2e8f0" style={{ marginBottom: '1rem' }} />
                                            <p className="item-sub">No remedies are currently being tracked for your projects.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View - Card List */}
                    <div className="visible-mobile tracker-mobile-list">
                        {loading ? (
                            <div className="empty-state">
                                <Loader2 className="animate-spin" size={32} color="var(--secondary-color)" />
                                <p style={{ marginTop: '1rem', fontWeight: 600 }}>Loading Tracking Cases...</p>
                            </div>
                        ) : paginatedSubmissions.length > 0 ? (
                            paginatedSubmissions.map((sub) => (
                                <div key={sub.id} className="tracker-mobile-card">
                                    <div className="mobile-card-header">
                                        <div className="mobile-card-title-group">
                                            <span className="project-name">{sub.p_name || sub.project_name}</span>
                                            <span className="user-email">{sub.user_email}</span>
                                        </div>
                                        <span className={`status-badge ${
                                            sub.result_status === 'resolved' ? 'status-resolved' : 
                                            (sub.status === 'completed' ? 'status-new' : 'status-working')
                                        }`}>
                                            {sub.result_status === 'resolved' ? 'RESOLVED' : (sub.status === 'completed' ? 'NEW RESPONSE' : 'WORKING')}
                                        </span>
                                    </div>

                                    <div className="mobile-card-body">
                                        <div className="mobile-info-section">
                                            <label className="mobile-label">Remedy Tracking</label>
                                            <span className="remedy-problem">{sub.problem}</span>
                                            {sub.zone && <span className="zone-chip">{sub.zone}</span>}
                                        </div>

                                        <div className="mobile-info-section">
                                            <label className="mobile-label">Latest Feedback from User</label>
                                            {sub.experience ? (
                                                <div className="experience-wrapper">
                                                    <p className="experience-quote">"{sub.experience}"</p>
                                                    {sub.user_image && (
                                                        <img src={`/${sub.user_image}`} className="submission-img" alt="User upload" />
                                                    )}
                                                </div>
                                            ) : (
                                                <div style={{ padding: '1rem', background: '#f1f5f9', borderRadius: '1rem', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                                                    <span className="item-sub">⏱️ Waiting for implementation...</span>
                                                </div>
                                            )}
                                        </div>

                                        {sub.admin_note && (
                                            <div className="mobile-info-section" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                                                <label className="mobile-label">My Last Instruction</label>
                                                <p className="expert-comment" style={{ fontSize: '0.85rem' }}>{sub.admin_note}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mobile-card-footer">
                                        <button className="btn-primary-small" onClick={() => handleOpenNoteDialog(sub)}>
                                            <MessageSquare size={16} /> Record Result / Instructions
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <AlertCircle size={48} color="#e2e8f0" style={{ marginBottom: '1rem' }} />
                                <p className="item-sub">No active tracking cases found.</p>
                            </div>
                        )}
                    </div>

                    <div className="pagination-container">
                        <span>Rows per page:</span>
                        <select 
                            className="pagination-select" 
                            value={rowsPerPage} 
                            onChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                        </select>
                        <span>{page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, submissions.length)} of {submissions.length}</span>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button className="pagination-btn" onClick={() => setPage(page - 1)} disabled={page === 0}>
                                <ChevronLeft size={20} />
                            </button>
                            <button className="pagination-btn" onClick={() => setPage(page + 1)} disabled={(page + 1) * rowsPerPage >= submissions.length}>
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Initiate Remedy Modal */}
            {initiateOpen && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h2>Initiate Remedy Tracking</h2>
                            <button className="btn-text" onClick={() => setInitiateOpen(false)}><X size={24} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="custom-stepper">
                                {['User', 'Project', 'Remedy', 'Init'].map((label, idx) => (
                                    <div key={label} className={`step-item ${activeStep === idx ? 'active' : ''} ${activeStep > idx ? 'completed' : ''}`}>
                                        <div className="step-circle">{activeStep > idx ? <CheckCircle size={16} /> : idx + 1}</div>
                                        <span className="step-label">{label}</span>
                                        <div className="step-line" />
                                    </div>
                                ))}
                            </div>

                            {activeStep === 0 && (
                                <ul className="custom-list">
                                    {followers.map(f => (
                                        <li key={f.email} className={`list-item ${selectedFollower?.email === f.email ? 'selected' : ''}`} onClick={() => setSelectedFollower(f)}>
                                            <div>
                                                <span className="item-main">{f.name}</span>
                                                <span className="item-sub">{f.email}</span>
                                            </div>
                                            {selectedFollower?.email === f.email && <ChevronRight size={18} color="#f59e0b" />}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {activeStep === 1 && (
                                <ul className="custom-list">
                                    {projects.map(p => (
                                        <li key={p.id} className={`list-item ${selectedProject?.id === p.id ? 'selected' : ''}`} onClick={() => setSelectedProject(p)}>
                                            <div>
                                                <span className="item-main">{p.project_name}</span>
                                                <span className="item-sub">{p.property_type}</span>
                                            </div>
                                            {selectedProject?.id === p.id && <ChevronRight size={18} color="#f59e0b" />}
                                        </li>
                                    ))}
                                    {projects.length === 0 && <p className="empty-state" style={{ padding: '2rem' }}>No projects found for this user.</p>}
                                </ul>
                            )}

                            {activeStep === 2 && (
                                <ul className="custom-list">
                                    {remedies.map(r => (
                                        <li key={r.id} className={`list-item ${selectedRemedy?.id === r.id ? 'selected' : ''}`} onClick={() => setSelectedRemedy(r)}>
                                            <div>
                                                <span className="item-main">{r.title}</span>
                                                <span className="item-sub">{r.problem}</span>
                                            </div>
                                        </li>
                                    ))}
                                    {remedies.length === 0 && <p className="empty-state" style={{ padding: '2rem' }}>No assigned remedies found in this project.</p>}
                                </ul>
                            )}

                            {activeStep === 3 && (
                                <div style={{ paddingTop: '0.5rem' }}>
                                    <div className="input-group">
                                        <label className="input-label">Initial Observation (Optional):</label>
                                        <textarea 
                                            className="custom-textarea" 
                                            rows={3} 
                                            placeholder="Why are we tracking this? (e.g. Health issues reported)" 
                                            value={initiationNote} 
                                            onChange={e => setInitiationNote(e.target.value)}
                                        />
                                    </div>
                                    <div style={{ padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '0.75rem', border: '1px solid #bae6fd' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#0369a1', letterSpacing: '0.05em' }}>TRACKING SUMMARY:</span>
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                                            <p><b>User:</b> {selectedFollower?.name}</p>
                                            <p><b>Project:</b> {selectedProject?.project_name}</p>
                                            <p><b>Remedy:</b> {selectedRemedy?.title}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-text" onClick={() => setInitiateOpen(false)}>Cancel</button>
                            <div style={{ flex: 1 }} />
                            {activeStep > 0 && <button className="btn-text" onClick={handleBack}>Back</button>}
                            {activeStep < 3 ? (
                                <button className="btn-primary" onClick={handleNext} disabled={(activeStep === 0 && !selectedFollower) || (activeStep === 1 && !selectedProject) || (activeStep === 2 && !selectedRemedy)}>
                                    Next
                                </button>
                            ) : (
                                <button className="btn-primary" onClick={handleCreateTracker} disabled={saving}>
                                    {saving ? <><Loader2 className="animate-spin" size={16} /> Creating...</> : 'Start Tracking'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Documentation Modal */}
            {noteDialogOpen && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h2>Remedy Progress & Chat</h2>
                            <button className="btn-text" onClick={() => !saving && setNoteDialogOpen(false)}><X size={24} /></button>
                        </div>
                        <div className="modal-body">
                            <p className="item-sub" style={{ marginBottom: '1.5rem' }}>View implementation history and provide your expert observation.</p>
                            
                            <div className="chat-container">
                                {(chats[selectedSub?.id] || []).map((msg, mIdx) => (
                                    <div key={msg.id || mIdx} className={`chat-bubble ${msg.sender_role === 'expert' ? 'bubble-expert' : 'bubble-user'}`}>
                                        <span className={`bubble-role ${msg.sender_role === 'expert' ? 'expert' : 'user'}`}>
                                            {msg.sender_role === 'expert' ? 'My Advice' : 'User Update'}
                                        </span>
                                        <p className="bubble-msg">{msg.message}</p>
                                        {msg.image && (
                                            <img src={`/${msg.image}`} className="submission-img" alt="Chat upload" />
                                        )}
                                        <span className="chat-time">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                ))}
                                {(!chats[selectedSub?.id] || chats[selectedSub?.id].length === 0) && (
                                    <p className="item-sub" style={{ textAlign: 'center', padding: '1rem', fontStyle: 'italic' }}>No conversation history yet.</p>
                                )}
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1.5rem 0' }} />

                            <div className="input-group">
                                <label className="input-label">Update Overall Status</label>
                                <select className="custom-select" value={resultStatus} onChange={e => setResultStatus(e.target.value)}>
                                    <option value="working">Still in Progress / Working</option>
                                    <option value="resolved">Resolved / Success (Mark Done)</option>
                                </select>
                            </div>
                            
                            <div className="input-group">
                                <label className="input-label">Send New Observation/Reply:</label>
                                <textarea 
                                    className="custom-textarea" 
                                    rows={3} 
                                    placeholder="Provide your iterative guidance or final conclusion..." 
                                    value={currentNote} 
                                    onChange={e => setCurrentNote(e.target.value)}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <ImageIcon size={18} /> Attach Guidance Photo:
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <input type="file" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImageChange} />
                                    <div className="upload-area" onClick={() => fileInputRef.current.click()}>
                                        {expertImage ? <img src={expertImage} className="upload-preview" alt="Preview" /> : <Plus size={24} color="#94a3b8" />}
                                    </div>
                                    {expertImage && <button className="btn-text" style={{ color: 'var(--accent-red)' }} onClick={() => setExpertImage(null)}>Remove</button>}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-text" onClick={() => setNoteDialogOpen(false)} disabled={saving}>Cancel</button>
                            <button className="btn-primary" onClick={handleSaveNote} disabled={saving || (!currentNote.trim() && !expertImage)}>
                                {saving ? <><Loader2 className="animate-spin" size={16} /> Sending...</> : 'Send & Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Snackbar */}
            {snackbar.open && (
                <div className={`custom-snackbar snackbar-${snackbar.severity}`}>
                    {snackbar.severity === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span>{snackbar.message}</span>
                </div>
            )}
        </div>
    );
}
