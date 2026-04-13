import {
    Box,
    Typography,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Tooltip,
    Button,
    Paper,
} from "@mui/material";
import Divider from '@mui/material/Divider';
import DeleteIcon from "@mui/icons-material/Delete";
import ComputerIcon from "@mui/icons-material/Computer";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import { useState, useEffect } from "react";
import { useToast } from "../services/ToastService";

export default function UserDevices({ userEmail, userId }) {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        if (userId) {
            fetchDevices();
        }
    }, [userId]);

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/manage_devices.php?action=fetch&user_id=${userId}`);
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

    const handleDeviceLogout = async (deviceId) => {
        try {
            const response = await fetch("/api/manage_devices.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "logout",
                    user_id: userId,
                    device_id: deviceId
                }),
            });
            const data = await response.json();
            if (data.status === "success") {
                showToast("Logged out from device", "success");
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
                    user_id: userId
                }),
            });
            const data = await response.json();
            if (data.status === "success") {
                showToast("Logged out from all other devices", "success");
                fetchDevices();
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
        <Box sx={{ width: "100%" }}>
            <Paper
                elevation={0}
                sx={{
                    p: 4,
                    borderRadius: 4,
                    border: "1px solid #fed7aa",
                    background: "#fff"
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight={800} color="#431407">
                        📱 My Active Devices
                    </Typography>
                    {devices.length > 1 && (
                        <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={handleLogoutAll}
                            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                        >
                            Logout All Others
                        </Button>
                    )}
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={30} sx={{ color: "#f97316" }} />
                    </Box>
                ) : devices.length > 0 ? (
                    <List>
                        {devices.map((device, index) => (
                            <Box key={device.id}>
                                <ListItem sx={{ px: 0, py: 2 }}>
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
                                            </Typography>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <Tooltip title="Logout this device">
                                            <IconButton edge="end" onClick={() => handleDeviceLogout(device.device_id)} sx={{ color: '#ef4444' }}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                {index < devices.length - 1 && <Divider component="li" />}
                            </Box>
                        ))}
                    </List>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" sx={{ color: '#7c2d12', opacity: 0.6 }}>
                            No active devices found.
                        </Typography>
                    </Box>
                )}
            </Paper>

            <Box sx={{ mt: 3, p: 2, bgcolor: "#fff7ed", borderRadius: 3, border: "1px solid #ffedd5" }}>
                <Typography variant="caption" sx={{ color: "#9a3412", fontWeight: 600 }}>
                    💡 Tip: If you have reached your device limit, logout from an old device to login from a new one.
                </Typography>
            </Box>
        </Box>
    );
}
