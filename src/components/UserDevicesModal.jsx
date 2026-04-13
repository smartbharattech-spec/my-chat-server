import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Typography,
    Box,
    CircularProgress,
    Tooltip,
} from "@mui/material";
import Divider from '@mui/material/Divider';
import DeleteIcon from "@mui/icons-material/Delete";
import DevicesIcon from "@mui/icons-material/Devices";
import ComputerIcon from "@mui/icons-material/Computer";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import { useState, useEffect } from "react";
import { useToast } from "../services/ToastService";

export default function UserDevicesModal({ open, onClose, user }) {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        if (open && user?.id) {
            fetchDevices();
        }
    }, [open, user]);

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/manage_devices.php?action=fetch&user_id=${user.id}`);
            const data = await response.json();
            if (data.status === "success") {
                setDevices(data.data);
            } else {
                showToast(data.message, "error");
            }
        } catch (error) {
            showToast("Failed to fetch devices", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async (deviceId) => {
        try {
            const response = await fetch("/api/manage_devices.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "logout",
                    user_id: user.id,
                    device_id: deviceId
                }),
            });
            const data = await response.json();
            if (data.status === "success") {
                showToast(data.message, "success");
                fetchDevices();
            } else {
                showToast(data.message, "error");
            }
        } catch (error) {
            showToast("Logout failed", "error");
        }
    };

    const handleLogoutAll = async () => {
        try {
            const response = await fetch("/api/manage_devices.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "logout_all",
                    user_id: user.id
                }),
            });
            const data = await response.json();
            if (data.status === "success") {
                showToast(data.message, "success");
                setDevices([]);
                onClose();
            } else {
                showToast(data.message, "error");
            }
        } catch (error) {
            showToast("Logout all failed", "error");
        }
    };

    const getDeviceIcon = (userAgent) => {
        const ua = userAgent.toLowerCase();
        if (ua.includes("mobi") || ua.includes("android") || ua.includes("iphone")) {
            return <PhoneIphoneIcon sx={{ color: "#f97316" }} />;
        }
        return <ComputerIcon sx={{ color: "#f97316" }} />;
    };

    const formatUA = (ua) => {
        if (!ua) return "Unknown Device";
        if (ua.includes("Chrome")) return "Chrome Browser";
        if (ua.includes("Firefox")) return "Firefox Browser";
        if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari Browser";
        if (ua.includes("Edge")) return "Edge Browser";
        return "Standard Browser";
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
            <DialogTitle sx={{ fontWeight: 900, color: '#431407', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <DevicesIcon sx={{ color: '#f97316' }} />
                Active Sessions: {user?.firstname}
            </DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={30} sx={{ color: '#f97316' }} />
                    </Box>
                ) : devices.length > 0 ? (
                    <List>
                        {devices.map((device, index) => (
                            <Box key={device.id}>
                                <ListItem sx={{ py: 2 }}>
                                    <Box sx={{ mr: 2 }}>
                                        {getDeviceIcon(device.user_agent)}
                                    </Box>
                                    <ListItemText
                                        primary={
                                            <Typography variant="body1" sx={{ fontWeight: 700, color: '#431407' }}>
                                                {formatUA(device.user_agent)}
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography variant="caption" sx={{ color: '#7c2d12', opacity: 0.8 }}>
                                                Last Active: {new Date(device.last_active).toLocaleString()}
                                                <br />
                                                ID: {device.device_id.substring(0, 15)}...
                                            </Typography>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <Tooltip title="Logout this device">
                                            <IconButton edge="end" onClick={() => handleLogout(device.device_id)} sx={{ color: '#ef4444' }}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                {index < devices.length - 1 && <Divider variant="inset" component="li" />}
                            </Box>
                        ))}
                    </List>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography sx={{ color: '#7c2d12', opacity: 0.6 }}>No active devices found.</Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
                <Button onClick={onClose} sx={{ color: '#7c2d12', fontWeight: 700 }}>Close</Button>
                {devices.length > 0 && (
                    <Button
                        onClick={handleLogoutAll}
                        variant="contained"
                        startIcon={<DeleteIcon />}
                        sx={{ bgcolor: '#ef4444', fontWeight: 800, borderRadius: 3, '&:hover': { bgcolor: '#b91c1c' } }}
                    >
                        Logout All Devices
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}
