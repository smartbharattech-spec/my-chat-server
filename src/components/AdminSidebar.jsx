import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Avatar,
    Button,
    IconButton,
    Collapse,
    TextField,
    Tooltip
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Divider from '@mui/material/Divider';
import LogoutIcon from "@mui/icons-material/Logout";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PeopleIcon from "@mui/icons-material/People";
import FolderIcon from "@mui/icons-material/Folder";
import PaymentIcon from "@mui/icons-material/Payment";
import MapIcon from "@mui/icons-material/Map";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import FoundationIcon from '@mui/icons-material/Foundation';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import RateReviewIcon from '@mui/icons-material/RateReview';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import NotificationImportantIcon from '@mui/icons-material/NotificationImportant';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import StoreIcon from '@mui/icons-material/Store';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../services/AuthService";
import { useToast } from "../services/ToastService";

import KitchenIcon from '@mui/icons-material/Kitchen';
import WcIcon from '@mui/icons-material/Wc';
import TempleHinduIcon from '@mui/icons-material/TempleHindu';

import logo from "../assets/logo.png";

const drawerWidth = 260;
const collapsedWidth = 80;

const AdminSidebar = ({ open, onClose, isDesktop }) => {
    const { logoutAdmin, adminUser } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
    const [basicVastuOpen, setBasicVastuOpen] = useState(false);
    const [trackerEnabled, setTrackerEnabled] = useState(true);
    const [remedyCategories, setRemedyCategories] = useState([]);
    const [addCategoryOpen, setAddCategoryOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    useEffect(() => {
        fetch("/api/get_setting.php?key=is_tracker_enabled")
            .then(res => res.json())
            .then(res => {
                if (res.status === "success") {
                    setTrackerEnabled(res.value === 'true');
                }
            })
            .catch(() => {});
        
        fetchCategories();
    }, []);

    const fetchCategories = () => {
        fetch("/api/remedy_categories.php")
            .then(res => res.json())
            .then(res => {
                if (res.status === "success") setRemedyCategories(res.data);
            });
    };

    const handleAddCategory = () => {
        if (!newCategoryName) return;
        fetch("/api/remedy_categories.php", {
            method: "POST",
            body: JSON.stringify({ name: newCategoryName })
        }).then(res => res.json())
        .then(res => {
            if (res.status === "success") {
                showToast("Category Added!", "success");
                setAddCategoryOpen(false);
                setNewCategoryName("");
                fetchCategories();
            } else {
                showToast(res.message, "error");
            }
        });
    };

    const adminEmail = adminUser?.email || "portal-admin@vastu.com";
    const adminInitials = adminUser?.username ? adminUser.username.substring(0, 2).toUpperCase() : "AD";
    const isSuperAdmin = adminUser?.role === 'super_admin';
    let permissions = adminUser?.permissions || [];
    if (typeof permissions === 'string') {
        try { permissions = JSON.parse(permissions); } catch (e) { permissions = []; }
    }

    const handleLogoutClick = () => {
        setLogoutDialogOpen(true);
    };

    const confirmLogout = () => {
        logoutAdmin();
        showToast("Logged out successfully", "info");
        setLogoutDialogOpen(false);
        navigate("/admin");
    };

    const allMenuItems = [
        { text: "Dashboard", icon: <DashboardIcon />, path: "/admin/dashboard", permission: 'stats' },
        { text: "Users", icon: <PeopleIcon />, path: "/admin/users", permission: 'users' },
        { text: "Projects", icon: <FolderIcon />, path: "/admin/projects", permission: 'projects' },
        { text: "Plans", icon: <FolderIcon />, path: "/admin/plans", permission: 'plans' },
        { text: "Payments", icon: <PaymentIcon />, path: "/admin/payments", permission: 'payments' },
        { text: "Map Requests", icon: <MapIcon />, path: "/admin/map-requests", permission: 'projects' },
        { text: "Reviews", icon: <RateReviewIcon />, path: "/admin/reviews", permission: 'staff' },
        { text: "Followups", icon: <NotificationImportantIcon />, path: "/admin/followups", permission: 'followups' },
        { text: "Follow-up Requests", icon: <AssignmentIndIcon />, path: "/admin/followup-requests", permission: 'followup_requests' },
        { text: "Analytics", icon: <AnalyticsIcon />, path: "/admin/analytics", permission: 'stats' },
        { text: "Role", icon: <PersonAddIcon />, path: "/admin/staff", permission: 'staff' },
        { text: "Marketplace Experts", icon: <AdminPanelSettingsIcon />, path: "/occult/admin?tab=expertsList", permission: 'staff' },
        { text: "Marketplace Users", icon: <StoreIcon />, path: "/occult/admin?tab=manageUsers", permission: 'staff' },
        { text: "Manage Store", icon: <StoreIcon />, path: "/occult/admin-store", permission: 'staff' },
        { text: "Marketplace Orders", icon: <FactCheckIcon />, path: "/occult/admin-orders", permission: 'staff' },
        ...(trackerEnabled ? [{ text: "Manage Tracker", icon: <FactCheckIcon />, path: "/admin/tracker", permission: 'staff' }] : []),
        { text: "Tutorials", icon: <VideoLibraryIcon />, path: "/admin/tutorials", permission: 'staff' },
    ];

    const menuItems = allMenuItems.filter(item => isSuperAdmin || permissions.includes(item.permission));
    const hasBasicVastuPermission = isSuperAdmin || permissions.includes('remedies');

    const drawerContent = (
        <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            position: 'relative',
            backgroundColor: '#ffffff', 
            color: '#333'
        }}>
            {isDesktop && (
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: -12,
                        top: 32,
                        backgroundColor: '#ffffff',
                        color: '#f97316',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        zIndex: 1201,
                        padding: '4px',
                        '&:hover': { backgroundColor: '#fff7ed' }
                    }}
                    size="small"
                >
                    {open ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                </IconButton>
            )}

            <Box sx={{ 
                p: open ? 4 : 2, 
                textAlign: 'center', 
                transition: 'all 0.3s ease',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <Box
                    component="img"
                    src={logo}
                    alt="Logo"
                    sx={{
                        width: open ? 160 : 40,
                        height: 'auto',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                />
            </Box>

            <List sx={{ 
                mt: 2, 
                flexGrow: 1, 
                px: 2, 
                overflowY: 'auto',
                '&::-webkit-scrollbar': { width: '4px' },
                '&::-webkit-scrollbar-thumb': { backgroundColor: '#e2e8f0', borderRadius: '4px' }
            }}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <ListItemButton
                            key={item.text}
                            onClick={() => { navigate(item.path); if (!isDesktop) onClose(); }}
                            sx={{
                                mb: 0.5,
                                borderRadius: '12px',
                                backgroundColor: isActive ? '#f97316' : 'transparent',
                                color: isActive ? '#ffffff' : '#475569',
                                px: open ? 2 : 1,
                                py: 1.2,
                                justifyContent: open ? 'initial' : 'center',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    backgroundColor: isActive ? '#ea580c' : '#fff7ed',
                                    color: isActive ? '#ffffff' : '#f97316'
                                }
                            }}
                        >
                            <ListItemIcon sx={{
                                color: 'inherit',
                                minWidth: open ? 40 : 0,
                                mr: open ? 1.5 : 0,
                                justifyContent: 'center'
                            }}>
                                {item.icon}
                            </ListItemIcon>
                            {open && <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isActive ? 700 : 500 }} />}
                        </ListItemButton>
                    );
                })}

                {hasBasicVastuPermission && (
                    <>
                        <ListItemButton
                            onClick={() => setBasicVastuOpen(!basicVastuOpen)}
                            sx={{
                                mb: 0.5,
                                borderRadius: '12px',
                                px: open ? 2 : 1,
                                py: 1.2,
                                color: '#475569',
                                justifyContent: open ? 'initial' : 'center',
                                '&:hover': { backgroundColor: '#fff7ed', color: '#f97316' }
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: open ? 40 : 0, mr: open ? 1.5 : 0, justifyContent: 'center', color: 'inherit' }}>
                                <FoundationIcon sx={{ fontSize: '1.4rem' }} />
                            </ListItemIcon>
                            {open && (
                                <>
                                    <ListItemText primary="Remedies Engine" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />
                                    <Tooltip title="Add New Category">
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAddCategoryOpen(true); }} sx={{ color: '#f97316' }}>
                                            <AddIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    {basicVastuOpen ? <ExpandLess sx={{ fontSize: '1.2rem' }} /> : <ExpandMore sx={{ fontSize: '1.2rem' }} />}
                                </>
                            )}
                        </ListItemButton>
                        <Collapse in={basicVastuOpen && open} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding sx={{ ml: 2, borderLeft: '1px solid #e2e8f0', mb: 1 }}>
                                {remedyCategories.map((sub) => {
                                    const categoryActive = location.search.includes(`category=${sub.name}`);
                                    const IconComponent = sub.icon === 'KitchenIcon' ? KitchenIcon : 
                                                  sub.icon === 'WcIcon' ? WcIcon : 
                                                  sub.icon === 'TempleHinduIcon' ? TempleHinduIcon : MeetingRoomIcon;
                                    
                                    return (
                                        <ListItemButton
                                            key={sub.id}
                                            onClick={() => navigate(`/admin/remedies?category=${sub.name}`)}
                                            sx={{ 
                                                borderRadius: '0 8px 8px 0', 
                                                color: categoryActive ? '#f97316' : '#64748b', 
                                                bgcolor: categoryActive ? '#fff7ed' : 'transparent',
                                                '&:hover': { color: '#f97316', bgcolor: '#fff7ed' } 
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                                                <IconComponent fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText primary={sub.name} primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: categoryActive ? 700 : 500 }} />
                                        </ListItemButton>
                                    );
                                })}
                            </List>
                        </Collapse>
                    </>
                )}
            </List>

            <Divider sx={{ borderColor: '#f1f5f9' }} />
            
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, justifyContent: open ? 'flex-start' : 'center' }}>
                    <Avatar sx={{ bgcolor: "#f97316", width: 40, height: 40, fontSize: '0.9rem', fontWeight: 700 }}>
                        {adminInitials}
                    </Avatar>
                    {open && (
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                Administrator
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {adminEmail}
                            </Typography>
                        </Box>
                    )}
                </Box>
                <Button
                    fullWidth
                    variant="text"
                    onClick={handleLogoutClick}
                    sx={{
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 600,
                        color: '#64748b',
                        justifyContent: open ? 'flex-start' : 'center',
                        px: open ? 2 : 1,
                        '&:hover': { backgroundColor: '#fdf2f2', color: '#ef4444' }
                    }}
                >
                    {open ? "Sign Out" : <LogoutIcon />}
                </Button>
            </Box>

            <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Confirm Logout</DialogTitle>
                <DialogContent>
                    <DialogContentText>Are you sure you want to end your administrative session?</DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setLogoutDialogOpen(false)} sx={{ color: '#64748b' }}>Cancel</Button>
                    <Button onClick={confirmLogout} variant="contained" sx={{ bgcolor: "#f97316", "&:hover": { bgcolor: "#ea580c" } }}>Logout</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={addCategoryOpen} onClose={() => setAddCategoryOpen(false)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 800 }}>Add New Category</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Category Name (e.g., Study Table)"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setAddCategoryOpen(false)} sx={{ color: '#64748b' }}>Cancel</Button>
                    <Button onClick={handleAddCategory} variant="contained" sx={{ bgcolor: "#f97316", fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: "#ea580c" } }}>Create Category</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );

    return (
        <Drawer
            variant={isDesktop ? "permanent" : "temporary"}
            open={open}
            onClose={onClose}
            sx={{
                width: open ? drawerWidth : (isDesktop ? collapsedWidth : 0),
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: open ? drawerWidth : (isDesktop ? collapsedWidth : 0),
                    boxSizing: 'border-box',
                    backgroundColor: '#ffffff',
                    borderRight: '1px solid #f1f5f9',
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflowX: 'hidden'
                },
            }}
        >
            {drawerContent}
        </Drawer>
    );
};

export default AdminSidebar;
