import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Paper, TextField, MenuItem, 
    Button, CircularProgress, Alert, Snackbar, IconButton, Divider
} from '@mui/material';
import { Settings, Save, RefreshCw, ShoppingBag, MessageSquare, Users } from 'lucide-react';
import MarketplaceSidebar from '../../components/MarketplaceSidebar';

export default function AdminBillingSettings() {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        const storedUser = localStorage.getItem('occult_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/marketplace/admin_billing_settings.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_settings' })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setSettings(data.settings);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id, charge_type, charge_value) => {
        setSaving(true);
        try {
            const res = await fetch('/api/marketplace/admin_billing_settings.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_setting', id, charge_type, charge_value })
            });
            const data = await res.json();
            setSnackbar({ open: true, message: data.message, severity: data.status === 'success' ? 'success' : 'error' });
            if (data.status === 'success') fetchSettings();
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to update setting', severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (id, field, value) => {
        setSettings(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const icons = {
        product_sale: <ShoppingBag size={24} color="#f59e0b" />,
        chat_message: <MessageSquare size={24} color="#3b82f6" />,
        community_join: <Users size={24} color="#10b981" />,
        creator_commission: <Zap size={24} color="#ec4899" />,
        recommender_commission: <RefreshCw size={24} color="#8b5cf6" />
    };

    const labels = {
        product_sale: 'Product Sale Commission',
        chat_message: 'Chat Message Charge',
        community_join: 'Community Join Commission',
        creator_commission: 'Creator Royalty Commission',
        recommender_commission: 'Expert Recommendation Commission'
    };

    if (loading && settings.length === 0) return (
        <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress color="warning" />
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <MarketplaceSidebar user={user} role="admin" />
            
            <Box sx={{ flex: 1, p: { xs: 2, md: 5 } }}>
                <Typography variant="h4" fontWeight="900" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Settings size={32} /> Billing & Commission Settings
                </Typography>
                <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
                    Define how much experts are charged for transactions on the platform.
                </Typography>

                <Grid container spacing={3}>
                    {settings.map((setting) => (
                        <Grid item xs={12} md={6} key={setting.id}>
                            <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Box sx={{ p: 1.5, bgcolor: '#f1f5f9', borderRadius: 3 }}>
                                        {icons[setting.activity_type]}
                                    </Box>
                                    <Typography variant="h6" fontWeight="800">
                                        {labels[setting.activity_type]}
                                    </Typography>
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Charge Type"
                                            value={setting.charge_type}
                                            onChange={(e) => handleChange(setting.id, 'charge_type', e.target.value)}
                                            size="small"
                                        >
                                            <MenuItem value="percentage">Percentage (%)</MenuItem>
                                            <MenuItem value="fixed">Fixed Amount (₹)</MenuItem>
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            label="Value"
                                            type="number"
                                            value={setting.charge_value}
                                            onChange={(e) => handleChange(setting.id, 'charge_value', e.target.value)}
                                            size="small"
                                        />
                                    </Grid>
                                </Grid>

                                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        variant="contained"
                                        startIcon={saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                                        disabled={saving}
                                        onClick={() => handleUpdate(setting.id, setting.charge_type, setting.charge_value)}
                                        sx={{ 
                                            textTransform: 'none', 
                                            fontWeight: 700, 
                                            borderRadius: 2,
                                            bgcolor: '#0f172a',
                                            '&:hover': { bgcolor: '#1e293b' }
                                        }}
                                    >
                                        Save Changes
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                <Alert severity="info" sx={{ mt: 4, borderRadius: 3 }}>
                    Commission is automatically calculated and billed to experts when a transaction (Order Paid, Message Sent, or Community Joined) is completed. 
                    Experts with unpaid bills will be automatically blocked from their panel.
                </Alert>
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                message={snackbar.message}
            />
        </Box>
    );
}
