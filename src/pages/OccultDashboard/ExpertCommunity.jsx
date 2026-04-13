import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropUtils';
import { 
    MessageSquare, Share2, Image as ImageIcon, 
    Send, ThumbsUp, X, Sparkles, Users,
    Maximize, Minimize, Settings as SettingsIcon,
    Lock, Star, ShieldCheck, CheckCircle2, Wallet, Zap,
    TrendingUp, UserPlus, Video
} from 'lucide-react';
import MarketplaceSidebar from '../../components/MarketplaceSidebar';
import BlockingOverlay from '../../components/BlockingOverlay';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../contexts/ChatContext';
import './ExpertCommunity.css';

const UserAvatar = ({ src, name, size = 48, className = "" }) => {
    const initials = name ? name.charAt(0).toUpperCase() : '?';
    const [error, setError] = useState(false);

    return (
        <div 
            className={`user-avatar-container ${className}`} 
            style={{ 
                width: size, 
                height: size, 
                borderRadius: size > 40 ? '16px' : '50%',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: size > 40 ? '1.5rem' : '0.9rem',
                fontWeight: 900,
                overflow: 'hidden',
                flexShrink: 0,
                boxShadow: '0 4px 10px -2px rgba(245, 158, 11, 0.2)'
            }}
        >
            {src && !error ? (
                <img 
                    src={src.startsWith('http') ? src : `/${src}`} 
                    alt={name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    onError={() => setError(true)}
                />
            ) : (
                initials
            )}
        </div>
    );
};


export default function ExpertCommunity() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setIsChatOpen, conversations, setActiveConversation } = useChat();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('feed');
    const [posts, setPosts] = useState([]);
    const [followedNotJoined, setFollowedNotJoined] = useState([]);
    
    // New Post State
    const [newPostContent, setNewPostContent] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Cropper State
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
    const [tempImageUrl, setTempImageUrl] = useState(null);
    
    // Expert Settings State
    const [expertSettings, setExpertSettings] = useState({ community_type: 'free', community_fee: 0 });

    // Join Mode State
    const [joiningExpert, setJoiningExpert] = useState(null);
    
    // Comment State
    const [commentText, setCommentText] = useState({});
    const [showComments, setShowComments] = useState({});
    const [postComments, setPostComments] = useState({});

    const fileInputRef = useRef(null);
    const videoInputRef = useRef(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('occult_user');
        if (!storedUser) {
            navigate('/occult/login');
        } else {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            if (parsedUser.role === 'expert') {
                fetchExpertSettings(parsedUser.id);
            }
            
            const params = new URLSearchParams(location.search);
            const joinExpertId = params.get('join_expert_id');
            if (joinExpertId) {
                fetchSingleExpert(joinExpertId);
            }

            fetchData(parsedUser);
        }
    }, [navigate, location.search]);

    const fetchData = async (currentUser) => {
        setLoading(true);
        await fetchPosts(currentUser);
        if (currentUser.role === 'user') {
            await fetchFollowedNotJoined(currentUser.id);
        }
        setLoading(false);
    };

    const fetchPosts = async (currentUser) => {
        try {
            const response = await fetch(`/api/marketplace/community_get_posts.php?user_id=${currentUser.id}&role=${currentUser.role}`);
            const data = await response.json();
            if (data.status === 'success') {
                setPosts(data.data);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    const fetchFollowedNotJoined = async (userId) => {
        try {
            const response = await fetch(`/api/marketplace/community_get_followed_not_joined.php?user_id=${userId}`);
            const data = await response.json();
            if (data.status === 'success') {
                setFollowedNotJoined(data.data);
            }
        } catch (error) {
            console.error('Error fetching followed experts:', error);
        }
    };

    const fetchSingleExpert = async (expertId) => {
        try {
            const response = await fetch(`/api/marketplace/get_expert_profile.php?expert_id=${expertId}`);
            const data = await response.json();
            if (data.status === 'success') {
                setJoiningExpert(data.profile);
            }
        } catch (error) {
            console.error('Error fetching expert:', error);
        }
    };

    const fetchExpertSettings = async (expertId) => {
        try {
            const response = await fetch(`/api/marketplace/community_get_expert_settings.php?expert_id=${expertId}`);
            const data = await response.json();
            if (data.status === 'success') {
                setExpertSettings(data.data);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const handleUpdateSettings = async () => {
        try {
            const response = await fetch(`/api/marketplace/community_update_settings.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `expert_id=${user.id}&community_type=${expertSettings.community_type}&community_fee=${expertSettings.community_fee}`
            });
            const data = await response.json();
            if (data.status === 'success') {
                alert('Settings updated successfully!');
            }
        } catch (error) {
            console.error('Error updating settings:', error);
        }
    };

    const handleJoinCommunity = async (expertId) => {
        try {
            const response = await fetch(`/api/marketplace/community_join.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `user_id=${user.id}&expert_id=${expertId}`
            });
            const data = await response.json();
            if (data.status === 'success') {
                alert(data.message);
                setJoiningExpert(null);
                fetchData(user);
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error joining community:', error);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setTempImageUrl(url);
            setIsCropDialogOpen(true);
        }
    };

    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedVideo(file);
            setVideoPreview(URL.createObjectURL(file));
            setSelectedImage(null);
            setImagePreview(null);
        }
    };

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleApplyCrop = async () => {
        try {
            const croppedImageBlob = await getCroppedImg(tempImageUrl, croppedAreaPixels);
            const croppedFile = new File([croppedImageBlob], 'cropped_image.jpg', { type: 'image/jpeg' });
            setSelectedImage(croppedFile);
            setImagePreview(URL.createObjectURL(croppedImageBlob));
            setSelectedVideo(null);
            setVideoPreview(null);
            setIsCropDialogOpen(false);
            setTempImageUrl(null);
        } catch (e) {
            console.error(e);
        }
    };

    const handleCancelCrop = () => {
        setIsCropDialogOpen(false);
        setTempImageUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim() && !selectedImage && !selectedVideo) return;
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('expert_id', user.id);
        formData.append('content', newPostContent);
        if (selectedImage) formData.append('image', selectedImage);
        if (selectedVideo) formData.append('video', selectedVideo);

        try {
            const response = await fetch(`/api/marketplace/community_create_post.php`, { method: 'POST', body: formData });
            const data = await response.json();
            if (data.status === 'success') {
                setNewPostContent(''); setSelectedImage(null); setImagePreview(null); setSelectedVideo(null); setVideoPreview(null); fetchPosts(user);
            } else alert(data.message);
        } catch (error) {
            console.error('Error creating post:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleLike = async (postId) => {
        try {
            const response = await fetch(`/api/marketplace/community_action.php`, {
                method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `post_id=${postId}&user_id=${user.id}&action=like`
            });
            const data = await response.json();
            if (data.status === 'success') {
                setPosts(posts.map(post => post.id === postId ? { ...post, likes_count: data.count, is_liked: data.is_liked } : post));
            }
        } catch (error) { console.error('Error liking post:', error); }
    };

    const handleShare = async (postId) => {
        try {
            const link = window.location.origin + '/occult/community?post=' + postId;
            await navigator.clipboard.writeText(link);
            const response = await fetch(`/api/marketplace/community_action.php`, {
                method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `post_id=${postId}&user_id=${user.id}&action=share`
            });
            const data = await response.json();
            if (data.status === 'success') {
                setPosts(posts.map(post => post.id === postId ? { ...post, shares_count: data.count } : post));
                alert('Link copied to clipboard!');
            }
        } catch (error) { console.error('Error sharing post:', error); }
    };

    const handleCommentToggle = async (postId) => {
        if (!showComments[postId]) {
            try {
                const response = await fetch(`/api/marketplace/community_get_comments.php?post_id=${postId}`);
                const data = await response.json();
                if (data.status === 'success') setPostComments({ ...postComments, [postId]: data.data });
            } catch (error) { console.error('Error fetching comments:', error); }
        }
        setShowComments({ ...showComments, [postId]: !showComments[postId] });
    };

    const handleAddComment = async (postId) => {
        const text = commentText[postId];
        if (!text || !text.trim()) return;
        try {
            const response = await fetch(`/api/marketplace/community_add_comment.php`, {
                method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `post_id=${postId}&user_id=${user.id}&comment=${encodeURIComponent(text)}`
            });
            const data = await response.json();
            if (data.status === 'success') {
                setCommentText({ ...commentText, [postId]: '' });
                const newComment = { ...data.data, user_name: user.name, user_image: user.profile_image };
                setPostComments({ ...postComments, [postId]: [...(postComments[postId] || []), newComment] });
                setPosts(posts.map(post => post.id === postId ? { ...post, comments_count: parseInt(post.comments_count) + 1 } : post));
            }
        } catch (error) { console.error('Error adding comment:', error); }
    };

    if (loading && posts.length === 0) return (
        <div className="community-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <div className="loader"></div>
        </div>
    );

    const JoinPage = ({ expert }) => (
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="join-page-overlay">
            <button className="close-join-btn" onClick={() => setJoiningExpert(null)}>
                <X size={24} />
            </button>
            
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
                <div className="zap-icon-container">
                    <Zap size={64} color="#f59e0b" />
                </div>
            </motion.div>

            <h2>Join <span>{expert.name}'s</span> Sanatan Circle</h2>
            
            <p className="join-description">
                Master-guided daily wisdom, exclusive வேதிக் insights, and direct community support.
            </p>

            <div className="subscription-grid">
                <div className="benefit-card">
                    <h3 style={{ fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: '#f59e0b' }}>
                        <ShieldCheck color="#f59e0b" /> Member Benefits
                    </h3>
                    <ul className="benefit-list">
                        {['Daily Spiritual Feed Access', 'Exclusive Master Insights', 'Comment & Engage Privileges', 'Priority Community Support'].map(item => (
                            <li key={item} className="benefit-item">
                                <CheckCircle2 size={18} color="#10b981" /> {item}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="price-card" style={{ color: 'white' }}>
                    <h3 style={{ fontWeight: 800, marginBottom: '16px', color: 'rgba(255,255,255,0.6)' }}>Membership Details</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span style={{ fontWeight: 600 }}>Access Tier</span>
                        <span style={{ fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>{expert.community_type}</span>
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '16px 0' }} />
                    <div className="price-box">
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, margin: '0 0 4px' }}>JOINING FEE</p>
                        <div>
                            <span className="price-value">{expert.community_type === 'free' ? '0' : expert.community_fee}</span>
                            <span className="price-unit"> CREDITS</span>
                        </div>
                    </div>
                    <button className="join-now-btn" onClick={() => handleJoinCommunity(expert.user_id || expert.id)}>
                        {expert.community_type === 'free' ? 'Join Now for Free' : 'Secure Access & Join'}
                    </button>
                </div>
            </div>
            
            <p style={{ color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                <Lock size={14} /> Transactions are encrypted and secured via Wallet
            </p>
        </motion.div>
    );

    return (
        <div className="community-container">
            <BlockingOverlay />
            <div className="mesh-bg" />
            <MarketplaceSidebar user={user} role={user?.role} />

            <main className="community-content">
                <header className="community-header">
                    <div>
                        <motion.h1 initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                            Sanatan <span>Feed</span>
                        </motion.h1>
                        <div className="header-subtitle">
                            <Sparkles size={18} color="#f59e0b" />
                            <span>Celestial wisdom and Master circle insights.</span>
                        </div>
                    </div>
                </header>

                <div className="community-tabs" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className={`tab-item ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')}>
                            <TrendingUp size={18} /> Explore Feed
                        </div>
                        {user?.role === 'expert' && (
                            <div className={`tab-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                                <SettingsIcon size={18} /> Feed Settings
                            </div>
                        )}
                    </div>
                    {/* NEW: Explicit Chat Button so they know where to find the Broadcast Group */}
                    <button 
                        className="premium-btn-primary" 
                        onClick={() => {
                            // Find the first broadcast conversation and open it directly
                            if (conversations && conversations.length > 0) {
                                const groupChat = conversations.find(c => c.type === 'broadcast');
                                if (groupChat) {
                                    setActiveConversation(groupChat);
                                }
                            }
                            setIsChatOpen(true);
                        }}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                    >
                        <MessageSquare size={16} />
                        Open Group Chat
                    </button>
                </div>

                {joiningExpert ? (
                    <JoinPage expert={joiningExpert} />
                ) : (
                    <>
                        {activeTab === 'feed' && (
                            <section>
                                {user?.role === 'user' && followedNotJoined.length > 0 && (
                                    <div className="join-suggestions">
                                        <h2 className="join-suggestions-title">
                                            <UserPlus size={22} color="#f59e0b" /> Join Your Expert Circles
                                        </h2>
                                        <div className="join-grid">
                                            {followedNotJoined.map(expert => (
                                                <div className="join-card" key={expert.user_id}>
                                                    <UserAvatar src={expert.profile_image} name={expert.name} size={48} className="user-avatar" />
                                                    <div className="join-card-info">
                                                        <p className="join-card-name">{expert.name}</p>
                                                        <div className="join-card-meta">
                                                            <Star size={12} fill="#f59e0b" color="#f59e0b" />
                                                            <span>{expert.rating || '4.8'}</span>
                                                            <span>•</span>
                                                            <span className={expert.community_type === 'free' ? 'badge-free' : 'badge-paid'}>
                                                                {expert.community_type}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button className="join-btn" onClick={() => setJoiningExpert(expert)}>Join</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {user?.role === 'expert' && (
                                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="create-post-card">
                                        <div className="create-post-header">
                                            <UserAvatar src={user.profile_image} name={user.name} size={48} className="user-avatar" />
                                            <div className="post-input-area">
                                                <textarea 
                                                    className="post-textarea" 
                                                    rows={3} 
                                                    placeholder="Compose your spiritual wisdom..." 
                                                    value={newPostContent} 
                                                    onChange={(e) => setNewPostContent(e.target.value)} 
                                                />
                                                {imagePreview && (
                                                    <div className="preview-container">
                                                        <img src={imagePreview} alt="Preview" className="preview-media" />
                                                        <button className="remove-media-btn" onClick={() => { setSelectedImage(null); setImagePreview(null); }}><X size={16} /></button>
                                                    </div>
                                                )}
                                                {videoPreview && (
                                                    <div className="preview-container" style={{ width: '100%' }}>
                                                        <video src={videoPreview} controls className="preview-media" style={{ width: '100%' }} />
                                                        <button className="remove-media-btn" onClick={() => { setSelectedVideo(null); setVideoPreview(null); }}><X size={16} /></button>
                                                    </div>
                                                )}
                                                <div className="create-post-footer">
                                                    <div className="media-actions">
                                                        <label className="media-btn">
                                                            <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleImageChange} />
                                                            <ImageIcon size={20} /> <span>Image</span>
                                                        </label>
                                                        <label className="media-btn">
                                                            <input type="file" accept="video/*" hidden ref={videoInputRef} onChange={handleVideoChange} />
                                                            <Video size={20} /> <span>Video</span>
                                                        </label>
                                                    </div>
                                                    <button 
                                                        className="share-insight-btn" 
                                                        disabled={isSubmitting || (!newPostContent.trim() && !selectedImage && !selectedVideo)} 
                                                        onClick={handleCreatePost}
                                                    >
                                                        {isSubmitting ? 'Sharing...' : 'Share Insight'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {posts.length === 0 ? (
                                    <div className="empty-state">
                                        <Users size={64} color="#cbd5e1" />
                                        <h3>Feed is Quiet</h3>
                                        <p>{user?.role === 'expert' ? "You haven't shared any insights yet." : "Join your followed experts' circles to see spiritual wisdom here."}</p>
                                        {user?.role === 'user' && followedNotJoined.length === 0 && (
                                            <button className="share-insight-btn" style={{ background: '#0f172a' }} onClick={() => navigate('/occult/following')}>Find Experts to Follow</button>
                                        )}
                                    </div>
                                ) : (
                                    posts.map((post, index) => (
                                        <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="post-card">
                                            <div className="post-header">
                                                <UserAvatar src={post.expert_image} name={post.expert_name} size={48} className="user-avatar" />
                                                <div className="post-info">
                                                    <h4>{post.expert_name}</h4>
                                                    <span>{new Date(post.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                            <div className="post-body">
                                                <p className="post-text">{post.content}</p>
                                                {post.image_url && (
                                                    <div className="post-media-container">
                                                        <img src={`/${post.image_url}`} alt="Post" />
                                                    </div>
                                                )}
                                                {post.video_url && (
                                                    <div className="post-media-container">
                                                        <video src={`/${post.video_url}`} controls />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="post-actions">
                                                <div className="action-group">
                                                    <button className={`action-btn ${post.is_liked ? 'liked' : ''}`} onClick={() => handleToggleLike(post.id)}>
                                                        <ThumbsUp size={20} fill={post.is_liked ? "currentColor" : "none"} />
                                                        <span>{post.likes_count}</span>
                                                    </button>
                                                    <button className="action-btn" onClick={() => handleCommentToggle(post.id)}>
                                                        <MessageSquare size={20} />
                                                        <span>{post.comments_count}</span>
                                                    </button>
                                                </div>
                                                <button className="action-btn" onClick={() => handleShare(post.id)}>
                                                    <Share2 size={20} />
                                                    <span>{post.shares_count || 'Share'}</span>
                                                </button>
                                            </div>
                                            <AnimatePresence>
                                                {showComments[post.id] && (
                                                    <motion.div 
                                                        initial={{ height: 0, opacity: 0 }} 
                                                        animate={{ height: 'auto', opacity: 1 }} 
                                                        exit={{ height: 0, opacity: 0 }} 
                                                        className="comments-section"
                                                    >
                                                        {postComments[post.id]?.map((comment) => (
                                                            <div key={comment.id} className="comment-item">
                                                                <UserAvatar src={comment.user_image} name={comment.user_name} size={32} className="user-avatar" />
                                                                <div className="comment-content">
                                                                    <span className="comment-user-name">{comment.user_name}</span>
                                                                    <p className="comment-text">{comment.comment}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <div className="add-comment-area">
                                                            <UserAvatar src={user.profile_image} name={user.name} size={32} className="user-avatar" />
                                                            <div className="comment-input-wrapper">
                                                                <input 
                                                                    className="comment-input" 
                                                                    placeholder="Add your perspective..." 
                                                                    value={commentText[post.id] || ''} 
                                                                    onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                                                                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                                                />
                                                                <button className="send-comment-btn" onClick={() => handleAddComment(post.id)}>
                                                                    <Send size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    ))
                                )}
                            </section>
                        )}

                        {activeTab === 'settings' && (
                            <section className="settings-container">
                                <div className="settings-card">
                                    <div className="settings-header">
                                        <div className="settings-icon-box"><SettingsIcon size={24} /></div>
                                        <h2 style={{ margin: 0, fontWeight: 800 }}>Community Settings</h2>
                                    </div>
                                    
                                    <div style={{ marginBottom: '32px' }}>
                                        <p style={{ fontWeight: 700, marginBottom: '16px' }}>Membership Model</p>
                                        <div className="model-selector">
                                            <div 
                                                className={`model-option ${expertSettings.community_type === 'free' ? 'selected' : ''}`}
                                                onClick={() => setExpertSettings({ ...expertSettings, community_type: 'free' })}
                                            >
                                                <Zap size={24} />
                                                <p className="model-label">Free</p>
                                            </div>
                                            <div 
                                                className={`model-option ${expertSettings.community_type === 'paid' ? 'selected' : ''}`}
                                                onClick={() => setExpertSettings({ ...expertSettings, community_type: 'paid' })}
                                            >
                                                <Lock size={24} />
                                                <p className="model-label">Paid</p>
                                            </div>
                                        </div>
                                    </div>

                                    {expertSettings.community_type === 'paid' && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="fee-input-group">
                                            <label style={{ color: '#0f172a' }}>Joining Fee (Credits)</label>
                                            <div className="input-with-icon">
                                                <Wallet size={18} color="#64748b" />
                                                <input 
                                                    type="number" 
                                                    value={expertSettings.community_fee} 
                                                    onChange={(e) => setExpertSettings({ ...expertSettings, community_fee: e.target.value })} 
                                                    placeholder="e.g. 500" 
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                    <button className="save-settings-btn" onClick={handleUpdateSettings}>Save Settings</button>
                                </div>
                            </section>
                        )}
                    </>
                )}

                {/* Crop Dialog */}
                <AnimatePresence>
                    {isCropDialogOpen && (
                        <div className="custom-dialog-overlay">
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="custom-dialog"
                            >
                                <div className="dialog-header">Perfectly Frame Insight</div>
                                <div className="dialog-content">
                                    {tempImageUrl && (
                                        <Cropper 
                                            image={tempImageUrl} 
                                            crop={crop} 
                                            zoom={zoom} 
                                            aspect={1 / 1} 
                                            onCropChange={setCrop} 
                                            onCropComplete={onCropComplete} 
                                            onZoomChange={setZoom} 
                                        />
                                    )}
                                </div>
                                <div className="dialog-footer">
                                    <div style={{ marginBottom: '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <Minimize size={20} color="#64748b" />
                                            <input 
                                                type="range" 
                                                min={1} 
                                                max={3} 
                                                step={0.1} 
                                                value={zoom} 
                                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                                style={{ flex: 1, accentColor: '#f59e0b' }}
                                            />
                                            <Maximize size={20} color="#64748b" />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                                        <button onClick={handleCancelCrop} style={{ border: 'none', background: 'transparent', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                        <button className="share-insight-btn" onClick={handleApplyCrop}>Apply Crop</button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
