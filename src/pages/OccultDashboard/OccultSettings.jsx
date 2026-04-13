import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, Typography, Button, TextField, Avatar, CircularProgress, 
    IconButton, Switch, LinearProgress, Chip, Container, useMediaQuery, useTheme,
    Grid, Paper, InputAdornment, Divider
} from '@mui/material';
import { 
    User, Camera, ExternalLink, Image as ImageIcon, Briefcase, Eye, IndianRupee
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MarketplaceSidebar from '../../components/MarketplaceSidebar';
import { useToast } from '../../services/ToastService';

export default function OccultSettings() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    const storedUser = JSON.parse(localStorage.getItem('occult_user') || '{}');
    const userRole = storedUser.role || 'user';
    const isExpert = userRole === 'expert';
    
    const fileInputRef = useRef(null);
    const bannerInputRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState(null);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        city: '',
        state: '',
        bio: '',
        experience: '',
        hourly_rate: '',
        language: '',
        skills: '',
        primary_skill: '',
        slug: '',
        profile_image: '',
        banner_image: '',
        is_live: 1,
        is_ecommerce_enabled: 0,
        per_message_charge: '',
        free_message_limit: '',
        message_type: 'free'
    });
    const [offerFreeMessages, setOfferFreeMessages] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('occult_user');
        if (!storedUser) {
            navigate('/occult/login');
        } else {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchExpertProfile(parsedUser.id);
        }
    }, [navigate]);

    const fetchExpertProfile = async (userId) => {
        try {
            const response = await fetch(`/api/marketplace/get_expert_profile.php?user_id=${userId}`);
            const data = await response.json();
            if (data.status === 'success') {
                const p = data.profile;
                setFormData({
                    name: p.name || '',
                    email: p.email || '',
                    phone: p.phone || '',
                    city: p.city || '',
                    state: p.state || '',
                    bio: p.bio || '',
                    experience: p.experience_years || '',
                    hourly_rate: p.hourly_rate || '',
                    language: p.languages || '',
                    skills: p.expertise_tags || '',
                    primary_skill: p.primary_skill || '',
                    slug: p.slug || '',
        profile_image: p.profile_image || '',
        banner_image: p.banner_image || '',
        is_live: p.is_live !== undefined ? parseInt(p.is_live) : 1,
        is_ecommerce_enabled: p.is_ecommerce_enabled !== undefined ? parseInt(p.is_ecommerce_enabled) : 0,
        per_message_charge: p.per_message_charge !== null ? p.per_message_charge : '',
        free_message_limit: p.free_message_limit !== null ? p.free_message_limit : '',
        message_type: (p.per_message_charge && parseInt(p.per_message_charge) > 0) ? 'paid' : 'free'
    });
    setOfferFreeMessages(p.free_message_limit && parseInt(p.free_message_limit) > 0);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            showToast("Failed to fetch profile data.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/marketplace/profile_update.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    user_id: user.id, 
                    role: userRole,
                    skill: formData.primary_skill, 
                    ...formData,
                    per_message_charge: formData.message_type === 'free' ? 0 : formData.per_message_charge,
                    free_message_limit: (formData.message_type === 'paid' && offerFreeMessages) ? formData.free_message_limit : 0
                })
            });
            const data = await response.json();
            if (data.status === 'success') {
                showToast("Profile updated successfully!", "success");
                const updatedUser = { ...user, ...formData };
                localStorage.setItem('occult_user', JSON.stringify(updatedUser));
                setUser(updatedUser);
            } else {
                showToast(data.message, "error");
            }
        } catch (error) {
            showToast("Connection failed.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (file, type) => {
        if (!file) return;
        const uploadData = new FormData();
        uploadData.append('image', file);
        uploadData.append('user_id', user.id);
        uploadData.append('type', type);

        try {
            const response = await fetch('/api/marketplace/upload_profile_image.php', {
                method: 'POST',
                body: uploadData
            });
            const data = await response.json();
            if (data.status === 'success') {
                setFormData(prev => ({ ...prev, [type === 'profile' ? 'profile_image' : 'banner_image']: data.path }));
                showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} updated.`, "success");
            }
        } catch (error) {
            showToast("Upload failed.", "error");
        }
    };

    const [activeTab, setActiveTab] = useState('profile');
    
    if (loading) return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#ffffff' }}>
            <CircularProgress color="primary" />
        </Box>
    );

    const tabs = [
        { id: 'profile', label: 'Profile Settings' }
    ];

    return (
        <Box sx={{ display: 'flex', bgcolor: '#ffffff', minHeight: '100vh' }}>
            <MarketplaceSidebar user={user} role={userRole} />

            <Box sx={{ 
                flex: 1, 
                p: { xs: 2, sm: 2, md: 4, lg: 6 }, // Increased xs padding from 0.5 to 2
                pt: { xs: 9, md: 4, lg: 6 }, 
                maxWidth: '1050px',
                mx: 'auto',
                width: '100%',
                overflowX: 'hidden'
            }}>
                {/* Header Section */}
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a1a', fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
                            Settings
                        </Typography>
                        {isExpert && (
                            <Button
                                variant="outlined"
                                onClick={() => window.open(`/@${formData.slug || ''}`, '_blank')}
                                sx={{ 
                                    borderRadius: '100px', 
                                    textTransform: 'none', 
                                    fontWeight: 700, 
                                    px: { xs: 2, md: 3 }, 
                                    py: 1, 
                                    fontSize: { xs: '0.8rem', md: '0.9rem' },
                                    borderColor: '#e2e8f0', 
                                    color: '#64748b',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {isMobile ? <ExternalLink size={18} /> : 'View Profile'}
                            </Button>
                        )}
                    </Box>
                    
                    {/* Minimal Tabs (Profile Only) */}
                    <Box sx={{ display: 'flex', gap: 4, borderBottom: '1px solid #eef2f6', mb: 4 }}>
                        <Box sx={{
                            pb: 1.5,
                            color: '#3b82f6',
                            fontWeight: 700,
                            fontSize: '1rem',
                            position: 'relative',
                            '&:after': {
                                content: '""',
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: 3,
                                bgcolor: '#3b82f6',
                                borderRadius: '3px 3px 0 0'
                            }
                        }}>
                            General Profile
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {/* Basic Information Section */}
                    <Box sx={{ 
                        border: { xs: 'none', sm: '1px solid #eef2f6' }, 
                        borderRadius: { xs: 0, sm: 4 }, 
                        p: { xs: 2, md: 4 },
                        bgcolor: '#ffffff'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: { xs: '1rem', md: '1.2rem' }, color: '#1a1a1a' }}>Basic Information</Typography>
                        </Box>

                        <Grid container spacing={{ xs: 2, md: 4 }}>
                            <Grid size={{ xs: 12 }}>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', mb: 1 }}>First name</Typography>
                                <TextField 
                                    fullWidth placeholder="First name"
                                    value={formData.name.split(' ')[0] || ''} 
                                    onChange={(e) => {
                                        const parts = formData.name.split(' ');
                                        parts[0] = e.target.value;
                                        setFormData({...formData, name: parts.join(' ')})
                                    }}
                                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fbfcfd' } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', mb: 1 }}>Last name</Typography>
                                <TextField 
                                    fullWidth placeholder="Last name"
                                    value={formData.name.split(' ').slice(1).join(' ') || ''} 
                                    onChange={(e) => {
                                        const parts = formData.name.split(' ');
                                        const first = parts[0] || '';
                                        setFormData({...formData, name: `${first} ${e.target.value}`.trim()})
                                    }}
                                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fbfcfd' } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', mb: 1 }}>Phone Number</Typography>
                                <TextField 
                                    fullWidth placeholder="Enter phone number"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fbfcfd' } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', mb: 1 }}>Registered Email</Typography>
                                <TextField 
                                    fullWidth disabled
                                    value={formData.email}
                                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f8fafc' } }}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* About me info Section */}
                    <Box sx={{ 
                        border: { xs: 'none', sm: '1px solid #eef2f6' }, 
                        borderRadius: { xs: 0, sm: 4 }, 
                        p: { xs: 2, md: 4 },
                        bgcolor: '#ffffff'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: { xs: '1rem', md: '1.2rem' }, color: '#1a1a1a' }}>Profile Details</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.85rem', color: '#64748b', mb: 4 }}>
                            Manage your public identity and how seekers find you.
                        </Typography>

                        <Box sx={{ mb: 4 }}>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', mb: 2 }}>Your image</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Avatar 
                                    src={formData.profile_image ? `/${formData.profile_image}` : ''} 
                                    sx={{ width: 80, height: 80, border: '1px solid #eef2f6', bgcolor: '#f8fafc' }}
                                >
                                    <ImageIcon size={30} color="#cbd5e1" />
                                </Avatar>
                                <Button 
                                    variant="outlined" 
                                    onClick={() => fileInputRef.current.click()}
                                    sx={{ 
                                        borderRadius: 2, textTransform: 'none', fontWeight: 600, color: '#1a1a1a', borderColor: '#e2e8f0',
                                        px: 3, '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' }
                                    }}
                                >
                                    Upload
                                </Button>
                                <input type="file" ref={fileInputRef} hidden onChange={(e) => handleImageUpload(e.target.files[0], 'profile')} />
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Box>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', mb: 1 }}>Name</Typography>
                                <TextField 
                                    fullWidth placeholder="Your full name"
                                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fbfcfd' } }}
                                />
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', mb: 1 }}>Headline</Typography>
                                <TextField 
                                    fullWidth placeholder="e.g. Senior Vedic Astrologer"
                                    value={formData.primary_skill} onChange={(e) => setFormData({...formData, primary_skill: e.target.value})}
                                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fbfcfd' } }}
                                />
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', mb: 1 }}>Bio</Typography>
                                <TextField 
                                    fullWidth multiline rows={4}
                                    placeholder="Describe yourself..."
                                    value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fbfcfd' } }}
                                />
                            </Box>
                        </Box>
                    </Box>

                    {/* Social Media Links Section */}
                    <Box sx={{ border: '1px solid #eef2f6', borderRadius: 4, p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontWeight: 600, fontSize: '1.1rem', color: '#1a1a1a' }}>Social Media Links (01)</Typography>
                                <Box sx={{ width: 16, height: 16, borderRadius: '50%', border: '1.5px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help' }}>
                                    <Typography sx={{ fontSize: '10px', color: '#64748b', fontWeight: 800 }}>i</Typography>
                                </Box>
                            </Box>
                            <Switch defaultChecked color="success" />
                        </Box>
                        
                        <Typography sx={{ fontSize: '0.9rem', color: '#64748b', fontStyle: 'italic' }}>
                            Add your social media profiles to help seekers connect with you across platforms.
                        </Typography>
                    </Box>

                    {isExpert && (
                        <>
                            {/* Expert Status & Pricing */}
                             <Box sx={{ 
                                 border: { xs: 'none', sm: '1px solid #eef2f6' }, 
                                 borderRadius: { xs: 0, sm: 4 }, 
                                 p: { xs: 2, md: 4 },
                                 bgcolor: '#ffffff'
                             }}>
                                 <Typography sx={{ fontWeight: 700, fontSize: { xs: '1rem', md: '1.2rem' }, color: '#1a1a1a', mb: 4 }}>Expert Configuration</Typography>
                                 
                                 <Grid container spacing={3}>
                                     <Grid size={{ xs: 12 }}>
                                         <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f1f5f9' }}>
                                             <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>Availability</Typography>
                                             <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                 <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: '#1a1a1a' }}>{formData.is_live ? 'Expert Live' : 'Expert Hidden'}</Typography>
                                                 <Switch 
                                                     checked={!!formData.is_live} 
                                                     onChange={(e) => setFormData({...formData, is_live: e.target.checked ? 1 : 0})}
                                                     color="success"
                                                 />
                                             </Box>
                                         </Box>
                                     </Grid>
                                    {/* Price per Hour Removed */}
                                    <Grid size={{ xs: 12 }}>
                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', mb: 1.5 }}>Message Setting</Typography>
                                        <Box sx={{ 
                                            display: 'flex', 
                                            p: 0.5, 
                                            bgcolor: '#f1f5f9', 
                                            borderRadius: 3, 
                                            width: '100%',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <Button 
                                                onClick={() => setFormData({...formData, message_type: 'free'})}
                                                sx={{ 
                                                    flex: 1,
                                                    borderRadius: 2.5, 
                                                    textTransform: 'none', 
                                                    px: 3,
                                                    py: 1,
                                                    fontSize: '0.85rem',
                                                    fontWeight: 600,
                                                    bgcolor: formData.message_type === 'free' ? '#ffffff' : 'transparent',
                                                    color: formData.message_type === 'free' ? '#0f172a' : '#64748b',
                                                    boxShadow: formData.message_type === 'free' ? '0 1px 3px 0 rgb(0 0 0 / 0.1)' : 'none',
                                                    '&:hover': { bgcolor: formData.message_type === 'free' ? '#ffffff' : '#e2e8f0' }
                                                }}
                                            >
                                                Free
                                            </Button>
                                            <Button 
                                                onClick={() => setFormData({...formData, message_type: 'paid', per_message_charge: formData.per_message_charge || 10})}
                                                sx={{ 
                                                    flex: 1,
                                                    borderRadius: 2.5, 
                                                    textTransform: 'none', 
                                                    px: 3,
                                                    py: 1,
                                                    fontSize: '0.85rem',
                                                    fontWeight: 600,
                                                    bgcolor: formData.message_type === 'paid' ? '#ffffff' : 'transparent',
                                                    color: formData.message_type === 'paid' ? '#0f172a' : '#64748b',
                                                    boxShadow: formData.message_type === 'paid' ? '0 1px 3px 0 rgb(0 0 0 / 0.1)' : 'none',
                                                    '&:hover': { bgcolor: formData.message_type === 'paid' ? '#ffffff' : '#e2e8f0' }
                                                }}
                                            >
                                                Paid
                                            </Button>
                                        </Box>
                                    </Grid>
                                    {formData.message_type === 'paid' && (
                                        <>
                                            <Grid size={{ xs: 12 }}>
                                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', mb: 1 }}>Per Message Charge (₹)</Typography>
                                                <TextField 
                                                    fullWidth type="number"
                                                    value={formData.per_message_charge} onChange={(e) => setFormData({...formData, per_message_charge: e.target.value})}
                                                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fbfcfd' } }}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12 }}>
                                                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #eef2f6', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Box>
                                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a1a1a' }}>Offer some messages for free?</Typography>
                                                        <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>User can send first few messages without credits</Typography>
                                                    </Box>
                                                    <Switch 
                                                        checked={offerFreeMessages} 
                                                        onChange={(e) => setOfferFreeMessages(e.target.checked)}
                                                        color="primary"
                                                    />
                                                </Box>
                                            </Grid>
                                            {offerFreeMessages && (
                                                <Grid size={{ xs: 12 }}>
                                                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', mb: 1 }}>Number of Free Messages</Typography>
                                                    <TextField 
                                                        fullWidth type="number"
                                                        value={formData.free_message_limit} onChange={(e) => setFormData({...formData, free_message_limit: e.target.value})}
                                                        placeholder="e.g. 5"
                                                        sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fbfcfd' } }}
                                                    />
                                                </Grid>
                                            )}
                                        </>
                                    )}
                                     <Grid size={{ xs: 12 }}>
                                         <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', mb: 1 }}>Portal Slug</Typography>
                                         <TextField 
                                             fullWidth placeholder="your-unique-slug"
                                             value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})}
                                             InputProps={{ startAdornment: <InputAdornment position="start" sx={{ fontWeight: 700 }}>@</InputAdornment> }}
                                             sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fbfcfd' } }}
                                         />
                                         <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1 }}>
                                             <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 700 }}>
                                                 Your Link: thesanatangurukul.com/@{formData.slug || '...'}
                                             </Typography>
                                             <Button 
                                                 size="small" 
                                                 variant="text" 
                                                 onClick={() => {
                                                     navigator.clipboard.writeText(`https://thesanatangurukul.com/@${formData.slug}`);
                                                     showToast("Link copied!", "success");
                                                 }}
                                                 sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700 }}
                                             >
                                                 Copy
                                             </Button>
                                         </Box>
                                     </Grid>
                                </Grid>
                            </Box>
                        </>
                    )}

                    {/* Action Bar */}
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column-reverse', sm: 'row' },
                        justifyContent: { xs: 'stretch', sm: 'flex-end' }, 
                        gap: 2, pt: 2, pb: 10 
                    }}>
                        <Button 
                            variant="text" 
                            fullWidth={isMobile}
                            onClick={() => navigate('/occult/dashboard')}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, color: '#64748b', px: 4, py: 1.2 }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="contained" 
                            onClick={handleSave}
                            disabled={saving}
                            fullWidth={isMobile}
                            sx={{ 
                                borderRadius: 2, bgcolor: '#3b82f6', color: 'white', fontWeight: 700, textTransform: 'none', px: 6, py: 1.2,
                                boxShadow: 'none', '&:hover': { bgcolor: '#2563eb', boxShadow: 'none' }
                            }}
                        >
                            {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
