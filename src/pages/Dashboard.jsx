import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  Drawer,
  IconButton,
  CircularProgress,
  Stack,
  TextField,
  Chip,
  useTheme,
  useMediaQuery,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TablePagination,
  InputAdornment,
  InputLabel,
  Select,
  FormControl,
  Alert,
  AlertTitle,
  Collapse,
  Checkbox,
  FormControlLabel,
  Grid,
  Autocomplete
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import LogoutIcon from "@mui/icons-material/Logout";
import DiamondIcon from "@mui/icons-material/Diamond"; // For premium feel
import GridViewIcon from "@mui/icons-material/GridView";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MapIcon from "@mui/icons-material/Map";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DataUsageIcon from "@mui/icons-material/DataUsage";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import logo from "../assets/logo.png";
import DownloadIcon from "@mui/icons-material/Download";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import RateReviewIcon from "@mui/icons-material/RateReview";
import AssignmentIcon from "@mui/icons-material/Assignment";
import FolderIcon from "@mui/icons-material/Folder";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DriveFileMoveIcon from "@mui/icons-material/DriveFileMove";
import HomeIcon from "@mui/icons-material/Home";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../services/AuthService";
import { useToast } from "../services/ToastService";
import { useState, useEffect, useCallback } from "react";
import AccountDetails from "../components/AccountDetails";
import VastuToolScreen from "../components/VastuToolScreen";
import { motion, AnimatePresence } from "framer-motion";
import MyPlans from "../components/MyPlans";
import BuyPlans from "../components/BuyPlans";
import UserDetailsModal from "../components/UserDetailsModal";
import Tutorials from "./Tutorials";
import WelcomeReviewModal from "../components/WelcomeReviewModal";
import UserDevices from "../components/UserDevices";
import { debounce } from "lodash";

const API = "/api/user_profile.php";
const LIVE_API = "/api/projects.php";
const TOOL_KEY = "vastu_tool_active";

function Dashboard() {
  const navigate = useNavigate();
  const { logout, user, refreshUser, isAdminLoggedIn } = useAuth();
  const { showToast } = useToast();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [openDrawer, setOpenDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState("Projects");
  const [loading, setLoading] = useState(!user);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedProjectConstructionType, setSelectedProjectConstructionType] = useState(null);
  const [isModalMandatory, setIsModalMandatory] = useState(false);

  // --- PROJECT MANAGEMENT STATE ---
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [constructionType, setConstructionType] = useState("Existing");
  const [propertyType, setPropertyType] = useState("Residential"); // New state
  const [projectIssue, setProjectIssue] = useState([]); // Changed to array for multi-select
  const [customIssues, setCustomIssues] = useState(['']); // Changed to array for multiple custom issues
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editProjectData, setEditProjectData] = useState({
    project_name: "",
    construction_type: "Existing",
    property_type: "Residential",
    project_issue: [],
    customIssues: ['']
  });
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [folders, setFolders] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [openCreateFolderDialog, setOpenCreateFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [movingProjectId, setMovingProjectId] = useState(null);
  const [openMoveDialog, setOpenMoveDialog] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [rootCount, setRootCount] = useState(0);
  const [openDuplicateDialog, setOpenDuplicateDialog] = useState(false);
  const [duplicatingProject, setDuplicatingProject] = useState(null);

  // --- EXPERT FOLLOWERS STATE ---
  const [followers, setFollowers] = useState([]);
  const [selectedFollowerId, setSelectedFollowerId] = useState("");
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [followerSearch, setFollowerSearch] = useState("");
  const [followedExperts, setFollowedExperts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // --- PAGINATION & FILTERS STATE ---
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalProjects, setTotalProjects] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all"); // New filter state
  const [filterFollowerId, setFilterFollowerId] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // --- AVATAR MENU STATE ---
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  // --- DELETE DIALOG STATE ---
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // --- CREATE DIALOG STATE ---
  const [openCreateDialog, setOpenCreateDialog] = useState(false);

  // --- MAP REQUEST DIALOG STATE ---
  const [openMapRequestDialog, setOpenMapRequestDialog] = useState(false);
  const [mapDialogStep, setMapDialogStep] = useState('selection'); // 'selection' | 'form'
  const [mapReqName, setMapReqName] = useState("");
  const [mapReqWhatsApp, setMapReqWhatsApp] = useState("");
  const [mapReqContact, setMapReqContact] = useState("");
  const [submittingMapReq, setSubmittingMapReq] = useState(false);
  const [openMapSuccessDialog, setOpenMapSuccessDialog] = useState(false);
  const [mapPrice, setMapPrice] = useState("1100");
  const [whatsappNumber, setWhatsappNumber] = useState("919999999999");

  // --- MY MAPS DIALOG STATE ---
  const [openMyMapsDialog, setOpenMyMapsDialog] = useState(false);
  const [userMaps, setUserMaps] = useState([]);
  const [teamMaps, setTeamMaps] = useState([]);
  const [loadingMaps, setLoadingMaps] = useState(false);
  const [hasCompletedMap, setHasCompletedMap] = useState(false);

  // --- QUOTA POPUP STATE ---
  const [openQuotaDialog, setOpenQuotaDialog] = useState(false);

  // --- FILTER DIALOG STATE ---
  const [openFilterDialog, setOpenFilterDialog] = useState(false);

  // --- PERSISTENT ALERT STATE ---
  const [persistentError, setPersistentError] = useState(null);

  // --- PROJECT SELECTION FOR PURCHASE ---
  const [purchaseProject, setPurchaseProject] = useState(null);

  // --- LOGOUT DIALOG STATE ---
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // --- MULTI-SELECT STATE ---
  const [selectedProjects, setSelectedProjects] = useState([]);

  // --- VASTU TOOL STATES ---
  const [showVastu, setShowVastu] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [quotaAlertDismissed, setQuotaAlertDismissed] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState("");

  const userEmail = localStorage.getItem("email");

  // Derived State for Quota
  const isQuotaFull = user?.plan_credits > 0 &&
    (user?.project_count_current_cycle >= user?.plan_credits);

  // --- FETCH PROJECTS ---
  const fetchProjects = async (email, query = searchQuery) => {
    try {
      const params = new URLSearchParams({
        email: email,
        page: page + 1,
        limit: rowsPerPage,
        search: query,
        status: paymentStatus,
        construction_type: typeFilter,
        start_date: startDate,
        end_date: endDate,
        folder_id: currentFolderId || 'root',
        follower_id: filterFollowerId === "all" ? "" : filterFollowerId
      });

      const res = await fetch(`${LIVE_API}?${params.toString()}`);
      const data = await res.json();
      console.log("Fetched projects:", data); // DEBUG LOG
      if (data.status === "success" && Array.isArray(data.data)) {
        console.log("Setting projects state:", data.data); // DEBUG LOG
        setProjects(data.data);
        setTotalProjects(data.total || 0);
      } else {
        console.error("Invalid project data:", data); // DEBUG LOG
        setProjects([]);
        setTotalProjects(0);
      }
    } catch (error) {
      console.error("Fetch projects error:", error);
    }
  };

  const fetchFolders = async () => {
    if (!user?.email) return;
    setLoadingFolders(true);
    try {
      const res = await fetch(`/api/folders.php?email=${user?.email}`);
      const data = await res.json();
      if (data.status === "success") {
        setFolders(data.data);
        if (data.root_count !== undefined) setRootCount(data.root_count);
      }
    } catch (error) {
      console.error("Fetch folders error:", error);
    } finally {
      setLoadingFolders(false);
    }
  };

  const fetchFollowers = async () => {
    if (user?.role !== 'expert' || !user?.id) return;
    setLoadingFollowers(true);
    try {
      const res = await fetch(`/api/marketplace/get_followers.php?expert_id=${user.id}`);
      const data = await res.json();
      if (data.status === "success") {
        setFollowers(data.data);
      }
    } catch (error) {
      console.error("Fetch followers error:", error);
    } finally {
      setLoadingFollowers(false);
    }
  };

  const fetchFollowedExperts = async () => {
    if (user?.role === 'expert' || !user?.id) return;
    try {
      const res = await fetch(`/api/marketplace/get_followed_experts.php?user_id=${user.id}`);
      const data = await res.json();
      if (data.status === "success") {
        setFollowedExperts(data.data);
      }
    } catch (error) {
      console.error("Fetch followed experts error:", error);
    }
  };

  const fetchAllUsersAdminList = async () => {
    if (!isAdminLoggedIn) return;
    try {
      const res = await fetch("/api/get_all_users.php");
      const data = await res.json();
      if (data.status === "success") {
        setAllUsers(data.data);
      }
    } catch (error) {
      console.error("Fetch all users error:", error);
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Use debounce for search query
  const debouncedFetch = useCallback(
    debounce((query) => {
      if (user?.email) fetchProjects(user?.email, query);
    }, 500),
    [user?.email, page, rowsPerPage, paymentStatus, typeFilter, startDate, endDate, currentFolderId, filterFollowerId]
  );

  useEffect(() => {
    debouncedFetch(searchQuery);
    return () => debouncedFetch.cancel();
  }, [searchQuery, debouncedFetch]);

  useEffect(() => {
    if (user?.email && activeTab === 'Projects') {
      fetchProjects(user?.email);
    }
  }, [page, rowsPerPage, paymentStatus, typeFilter, startDate, endDate, activeTab, currentFolderId, filterFollowerId]);

  useEffect(() => {
    if (user?.email) {
      if (user?.role === 'expert') {
        fetchFollowers();
        // Check billing status for expert
        fetch('/api/marketplace/expert_billing.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_bills', expert_id: user.id })
        })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            setIsBlocked(data.is_blocked);
            setBlockReason(data.block_reason);
          }
        })
        .catch(err => console.error("Billing check failed", err));
      } else {
        fetchFollowedExperts();
      }
      if (isAdminLoggedIn) fetchAllUsersAdminList();
      fetchFolders();
    }
  }, [user?.email, user?.role, user?.id, isAdminLoggedIn, page, rowsPerPage, paymentStatus, typeFilter, startDate, endDate, currentFolderId, filterFollowerId]);

  // Handle Tab and Status from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split("?")[1]);
    const tabParam = params.get("tab");
    const statusParam = params.get("status");

    if (tabParam) {
      setActiveTab(tabParam);
    }

    const createParam = params.get("create");
    if (createParam === "true") {
      setOpenCreateDialog(true);
      const preselectId = localStorage.getItem("preselect_follower_id");
      if (preselectId) {
        setSelectedFollowerId(Number(preselectId));
        localStorage.removeItem("preselect_follower_id");
      }
    }

    if (statusParam === "success") {
      showToast("Payment Successful!", "success");
      setIsModalMandatory(true);
      setShowDetailsModal(true);
    } else if (statusParam === "failed") {
      showToast("Payment Failed. Please try again.", "error");
    }
  }, []);

  // --- HANDLERS ---
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const res = await fetch(LIVE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email,
          expert_id: user?.role === 'expert' ? user?.id : (followedExperts.length > 0 ? selectedFollowerId : null),
          follower_id: user?.role === 'expert' ? (selectedFollowerId || null) : user?.id,
          project_name: newProjectName.trim(),
          construction_type: constructionType,
          property_type: propertyType,
          project_issue: (() => {
            let issues = [...projectIssue];
            if (issues.includes("Custom")) {
              issues = issues.filter(i => i !== "Custom");
              customIssues.forEach(ci => {
                if (ci.trim()) issues.push(ci.trim());
              });
            }
            return issues.join(", ");
          })(),
          folder_id: currentFolderId
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast("Project created successfully", "success");
        setNewProjectName("");
        setConstructionType("Existing"); // Reset
        setPropertyType("Residential"); // Reset
        setProjectIssue([]); // Reset
        setCustomIssues(['']); // Reset
        setSelectedFollowerId(""); // Reset
        setOpenCreateDialog(false); // Close dialog
        setIsModalMandatory(true);
        setSelectedProjectId(data.id); // Store newly created project ID
        setSelectedProjectConstructionType(constructionType); // Pass creation state
        setShowDetailsModal(true); // Open details modal automatically
        await fetchProjects(user?.email);
      } else {
        if (data.message && data.message.toLowerCase().includes("limit")) {
          setPersistentError(data.message);
          setOpenCreateDialog(false);
          setActiveTab("Buy Plans");
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          showToast(data.message, "error");
        }
      }
    } catch (error) {
      showToast("API error during creation", "error");
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const res = await fetch("/api/folders.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email, folder_name: newFolderName.trim() }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast("Folder created successfully", "success");
        setNewFolderName("");
        setOpenCreateFolderDialog(false);
        fetchFolders();
      } else {
        showToast(data.message, "error");
      }
    } catch (error) {
      showToast("API error during folder creation", "error");
    }
  };

  const handleRenameFolder = async (folderId, newName) => {
    try {
      const res = await fetch("/api/folders.php", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, id: folderId, folder_name: newName }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast("Folder renamed", "success");
        fetchFolders();
      } else {
        showToast(data.message, "error");
      }
    } catch (error) {
      showToast("API error during rename", "error");
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!window.confirm("Are you sure? Projects inside will be moved to home.")) return;
    try {
      const res = await fetch("/api/folders.php", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, id: folderId }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast("Folder deleted", "info");
        if (currentFolderId === folderId) setCurrentFolderId(null);
        fetchFolders();
        fetchProjects(user.email);
      } else {
        showToast(data.message, "error");
      }
    } catch (error) {
      showToast("API error during folder deletion", "error");
    }
  };

  const handleMoveProject = async (projectId, folderId) => {
    try {
      const res = await fetch(LIVE_API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId, email: user.email, folder_id: folderId }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast("Project moved successfully", "success");
        setOpenMoveDialog(false);
        setMovingProjectId(null);
        fetchProjects(user.email);
      } else {
        showToast(data.message, "error");
      }
    } catch (error) {
      showToast("API error during move", "error");
    }
  };

  const handleMapRequest = async () => {
    if (!mapReqName.trim() || !mapReqWhatsApp.trim() || !mapReqContact.trim()) {
      showToast("Please fill all fields", "warning");
      return;
    }
    setSubmittingMapReq(true);
    try {
      const res = await fetch("/api/map_requests.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: user.email,
          user_name: mapReqName.trim(),
          whatsapp_number: mapReqWhatsApp.trim(),
          contact_number: mapReqContact.trim(),
          status: 'pending_payment'
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast("Request submitted. Redirecting to payment...", "success");
        setOpenMapRequestDialog(false);
        setMapDialogStep('selection');
        setMapReqName("");
        setMapReqWhatsApp("");
        setMapReqContact("");
        const requestId = data.id;
        const orderId = `MAP_${requestId}_${Date.now()}`;
        // Redirect to Payment Page (Amount from dynamic setting)
        window.location.href = `#/phonepe-payment?amount=${mapPrice}&order_id=${orderId}&type=map`;
      } else {
        showToast(data.message || "Failed to submit request", "error");
      }
    } catch (error) {
      showToast("API error during request submission", "error");
    } finally {
      setSubmittingMapReq(false);
    }
  };

  const fetchMyMaps = async () => {
    setLoadingMaps(true);
    setOpenMyMapsDialog(true);
    try {
      // Fetch from map_requests (Team Created)
      const reqRes = await fetch(`/api/map_requests.php?email=${user.email}`);
      const reqData = await reqRes.json();
      if (reqData.status === "success") {
        const withCreatedMaps = reqData.data.filter(r => r.created_map);
        setTeamMaps(withCreatedMaps);
        setHasCompletedMap(withCreatedMaps.length > 0);
      }
    } catch (error) {
      showToast("Failed to fetch maps", "error");
    } finally {
      setLoadingMaps(false);
    }
  };

  const confirmDeleteProject = (proj) => {
    setProjectToDelete(proj);
    setDeleteDialogOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      const res = await fetch(LIVE_API, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectToDelete.id, email: user.email }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast("Project deleted", "info");
        await fetchProjects(user.email);
      } else {
        showToast(data.message || "Delete failed", "error");
      }
    } catch (error) {
      showToast("API error during deletion", "error");
    } finally {
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleDuplicateProject = (proj) => {
    setDuplicatingProject(proj);
    setOpenDuplicateDialog(true);
  };

  const executeDuplicateProject = async (projId, folderId) => {
    try {
      const res = await fetch("/api/duplicate_project.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projId,
          email: user?.email,
          folder_id: folderId
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast(data.message, "success");
        setOpenDuplicateDialog(false);
        setDuplicatingProject(null);
        await fetchProjects(user?.email);
      } else {
        showToast(data.message || "Duplicate failed", "error");
      }
    } catch (error) {
      showToast("API error during duplication", "error");
    }
  };

  const handleStartEdit = (proj) => {
    const issues = proj.project_issue ? proj.project_issue.split(',').map(i => i.trim()) : [];
    const knownIssues = ["Health", "Wealth", "Relationship"];
    const standardIssues = issues.filter(i => knownIssues.includes(i));
    const customIssues = issues.filter(i => !knownIssues.includes(i));

    setEditProjectData({
      id: proj.id,
      project_name: proj.project_name,
      property_type: proj.property_type || "Residential",
      construction_type: proj.construction_type || "Existing",
      project_issue: standardIssues.concat(customIssues.length > 0 ? ["Custom"] : []),
      customIssues: customIssues.length > 0 ? customIssues : [''],
      follower_id: proj.follower_id || "",
      folder_id: proj.folder_id || "root"
    });
    setOpenEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editProjectData.project_name.trim()) return;
    try {
      const res = await fetch(LIVE_API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editProjectData.id,
          project_name: editProjectData.project_name.trim(),
          property_type: editProjectData.property_type,
          construction_type: editProjectData.construction_type,
          follower_id: editProjectData.follower_id || null,
          folder_id: editProjectData.folder_id === 'root' ? null : editProjectData.folder_id,
          project_issue: (() => {
            let issues = [...editProjectData.project_issue];
            if (issues.includes("Custom")) {
              issues = issues.filter(i => i !== "Custom");
              editProjectData.customIssues.forEach(ci => {
                if (ci.trim()) issues.push(ci.trim());
              });
            }
            return issues.join(", ");
          })(),
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast("Project updated successfully", "success");
        setOpenEditDialog(false);
        fetchProjects(user.email);
      } else {
        showToast(data.message || "Update failed", "error");
      }
    } catch (error) {
      showToast("API error during update", "error");
    }
  };

  const handleSelectAllProjects = (e) => {
    if (e.target.checked) {
      setSelectedProjects(projects.map(p => p.id));
    } else {
      setSelectedProjects([]);
    }
  };

  const handleSelectOneProject = (id) => {
    setSelectedProjects(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteProjects = async () => {
    if (!selectedProjects.length) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedProjects.length} projects?`)) return;

    try {
      const res = await fetch(LIVE_API, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedProjects, email: user.email }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast(data.message, "info");
        setSelectedProjects([]);
        await fetchProjects(user.email);
      } else {
        showToast(data.message || "Bulk delete failed", "error");
      }
    } catch (error) {
      showToast("API error during bulk deletion", "error");
    }
  };

  // --- INITIAL LOAD & SYNC ---
  useEffect(() => {
    if (user && user.email) {
      setLoading(false);

      // Fetch Settings only once
      fetch(`/api/map_requests.php?email=${user.email}`)
        .then(r => r.json())
        .then(data => {
          if (data.status === "success" && Array.isArray(data.data)) {
            setHasCompletedMap(data.data.some(req => req.created_map));
          }
        });

      fetch("/api/get_setting.php?key=map_build_price")
        .then(r => r.json())
        .then(data => {
          if (data.status === "success" && data.value) {
            setMapPrice(data.value);
          }
        });

      fetch("/api/get_setting.php?key=whatsapp_number")
        .then(r => r.json())
        .then(data => {
          if (data.status === "success" && data.value) {
            setWhatsappNumber(data.value);
          }
        });
    }
  }, [user?.email]);

  useEffect(() => {
    const saved = localStorage.getItem(TOOL_KEY);
    if (saved === "true") {
      setShowSplash(true);
      setTimeout(() => {
        setShowSplash(false);
        setShowVastu(true);
      }, 1000);
    }
  }, []);

  const handleLogout = () => {
    setLogoutDialogOpen(true);
  };

  const confirmLogout = async () => {
    const deviceId = localStorage.getItem("device_id");
    await logout(user?.id, deviceId);
    showToast("Logged out successfully!", "info");
    setLogoutDialogOpen(false);
    navigate("/login");
  };

  // Avatar Menu Handlers
  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleMenuNavigate = (tab) => {
    setActiveTab(tab);
    handleMenuClose();
  };

  const handleLaunch = async (project) => {
    // 🚀 RESET SIDE PANEL STEP (Ensure every project starts fresh)
    localStorage.removeItem("sidePanelStep");

    // 🚀 AGGRESSIVE GLOBAL RESET
    if (typeof window !== 'undefined' && window.vastuResetAllStates) {
      console.log("Dashboard: Triggering pre-launch reset event");
      window.vastuResetAllStates();
    }

    // Launch tool
    localStorage.setItem(TOOL_KEY, "true"); // Replaced setToolActive(true) with this based on context
    // Assuming setDrawerOpen(true) is not needed here or is handled by TOOL_KEY
    localStorage.setItem("active_project_id", project.id);
    localStorage.setItem("active_project_name", project.project_name);
    localStorage.setItem("active_project_construction_type", project.construction_type || "Existing");
    localStorage.setItem("active_project_issue", project.project_issue || "");
    localStorage.setItem("active_project_folder_name", project.folder_name || "Home");
    setShowSplash(true);
    setTimeout(() => {
      setShowSplash(false);
      setShowVastu(true);
    }, 2000);
  };

  const handleToolBack = useCallback(() => {
    localStorage.removeItem(TOOL_KEY);
    setShowVastu(false);
  }, []);

  const handlePurchasePlan = (proj) => {
    setPurchaseProject(proj);
    setActiveTab("Buy Plans");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6, staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // --- RENDER ---
  if (loading) {
    return (
      <Box sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "radial-gradient(circle, #fff7ed 0%, #ffedd5 100%)"
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <AutoFixHighIcon sx={{ fontSize: 60, color: "#ea580c" }} />
        </motion.div>
        <Typography variant="body2" sx={{ mt: 2, fontWeight: 600, color: "#9a3412" }}>Loading Studio...</Typography>
      </Box>
    );
  }

  const SidebarContent = () => (
    <Box sx={{
      p: { xs: 2.5, md: 3 },
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(180deg, #ffffff 0%, #fffcf5 100%)",
    }}>
      {/* Brand Logo Area */}
      <Box sx={{ mb: { xs: 3, md: 5 }, px: 1, textAlign: 'center' }}>
        <Box
          component="img"
          src={logo}
          alt="MyVastuTool Logo"
          sx={{
            width: { xs: 120, md: 180 },
            height: 'auto',
            maxWidth: '100%',
            mx: 'auto'
          }}
        />
      </Box>

      {/* Navigation Links */}
      <Stack spacing={1.5} sx={{
        flexGrow: 1, overflowY: "auto", pr: 1,
        '&::-webkit-scrollbar': { width: '4px' },
        '&::-webkit-scrollbar-thumb': { backgroundColor: '#fed7aa', borderRadius: '4px' }
      }}>
        {[
          { label: "Projects", icon: <GridViewIcon /> },
          { label: "Account", icon: <PersonOutlineIcon /> },
          { label: "Manage Devices", icon: <SmartphoneIcon /> },
          { label: "Buy Plans", icon: <DiamondIcon /> },
          { label: "My Plans", icon: <ReceiptLongIcon /> },
          { label: "Reviews & Feedback", icon: <RateReviewIcon /> },
          { label: "Tutorials", icon: <VideoLibraryIcon /> },
        ].map((item) => {
          const isActive = activeTab === item.label;
          return (
            <Box
              key={item.label}
              onClick={() => {
                if (item.label === "Reviews & Feedback") {
                  setShowReviewModal(true);
                } else {
                  setActiveTab(item.label);
                }
                setOpenDrawer(false);
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                position: "relative",
                gap: 2,
                py: 1.8,
                px: 2.5,
                borderRadius: "16px",
                cursor: "pointer",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                background: isActive ? "linear-gradient(135deg, #ffedd5 0%, #fff7ed 100%)" : "transparent",
                color: isActive ? "#ea580c" : "#7c2d12",
                fontWeight: isActive ? 800 : 600,
                border: "1px solid",
                borderColor: isActive ? "rgba(249, 115, 22, 0.3)" : "transparent",
                boxShadow: isActive ? "0 4px 15px rgba(249, 115, 22, 0.1)" : "none",
                "&:hover": {
                  background: isActive ? "linear-gradient(135deg, #ffedd5 0%, #fff7ed 100%)" : "#fff7ed",
                  transform: isActive ? "none" : "translateY(-2px)",
                  boxShadow: isActive ? "0 4px 15px rgba(249, 115, 22, 0.1)" : "0 2px 8px rgba(124, 45, 18, 0.05)",
                },
                "&::before": {
                  content: '""',
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%) scaleY(0)",
                  height: "60%",
                  width: "4px",
                  borderTopRightRadius: "4px",
                  borderBottomRightRadius: "4px",
                  background: "#f97316",
                  transition: "transform 0.3s ease",
                  ...(isActive && { transform: "translateY(-50%) scaleY(1)" })
                }
              }}
            >
              <Box sx={{
                display: 'flex',
                opacity: isActive ? 1 : 0.7,
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
                transition: "all 0.3s ease",
              }}>
                {item.icon}
              </Box>
              <Typography sx={{
                fontWeight: isActive ? 800 : 600,
                fontSize: "0.95rem",
                letterSpacing: 0.2
              }}>
                {item.label}
              </Typography>
            </Box>
          );
        })}
      </Stack>

      {/* User Mini Profile & Logout */}
      <Box sx={{
        mt: 4,
        p: 2,
        borderRadius: "20px",
        background: "#fffaf5",
        border: "1px solid #ffedd5",
        boxShadow: "0 10px 30px rgba(124, 45, 18, 0.05)"
      }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Avatar sx={{
            bgcolor: "#ea580c",
            width: 40,
            height: 40,
            fontWeight: 800,
            boxShadow: "0 4px 10px rgba(234, 88, 12, 0.3)"
          }}>
            {user?.firstname ? user.firstname.charAt(0).toUpperCase() : "U"}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#431407" }}>
              {user?.firstname || "User"}
            </Typography>
            <Typography variant="caption" sx={{ color: "#9a3412", opacity: 0.8 }}>
              {user?.email}
            </Typography>
          </Box>
        </Stack>

        <Button
          fullWidth
          onClick={handleLogout}
          startIcon={<LogoutIcon fontSize="small" />}
          sx={{
            py: 1.2,
            borderRadius: "12px",
            color: "#ea580c",
            background: "#fff7ed",
            fontWeight: 700,
            fontSize: '0.85rem',
            border: "1px solid #fed7aa",
            transition: "all 0.3s ease",
            "&:hover": {
              background: "#fee2e2",
              color: "#dc2626",
              borderColor: "#fca5a5",
              transform: "translateY(-1px)",
              boxShadow: "0 4px 12px rgba(220, 38, 38, 0.15)"
            },
          }}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", position: 'relative' }}>
      <AnimatePresence>
        {isBlocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, width: '100%', height: '100%',
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(12px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              textAlign: 'center'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              style={{
                maxWidth: '500px',
                padding: '48px',
                backgroundColor: 'white',
                borderRadius: '32px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
              }}
            >
              <Box sx={{ width: 80, height: 80, bgcolor: '#fef2f2', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                <LockIcon sx={{ color: '#ef4444', fontSize: 40 }} />
              </Box>
              <Typography variant="h4" fontWeight="900" gutterBottom>Account Blocked</Typography>
              <Typography color="textSecondary" sx={{ mb: 4, fontWeight: 500, lineHeight: 1.6 }}>
                {blockReason || "Your account has been restricted due to unpaid billing dues. Please settle your outstanding bills to restore immediate access to your dashboard."}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={() => navigate('/occult/expert-bills')}
                  sx={{ 
                    bgcolor: '#ef4444', height: '56px', borderRadius: '16px', fontWeight: 800, fontSize: '1.1rem',
                    '&:hover': { bgcolor: '#dc2626' }
                  }}
                >
                  Review & Pay Bills
                </Button>
                <Button 
                  variant="text" 
                  fullWidth
                  onClick={confirmLogout}
                  sx={{ color: '#64748b', fontWeight: 700 }}
                >
                  Sign Out
                </Button>
              </Box>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* SIDEBAR (Desktop) */}
      {!showVastu && !showSplash && !isMobile && (
        <Box
          sx={{
            width: 280,
            position: "fixed",
            height: "100vh",
            borderRight: "1px solid #fed7aa",
            background: "#fff",
            zIndex: 1200,
          }}
        >
          <SidebarContent />
        </Box>
      )}

      {/* MOBILE DRAWER */}
      <Drawer
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        variant="temporary"
        sx={{
          zIndex: 3000,
          "& .MuiPaper-root": {
            width: 280,
            borderRadius: "0 20px 20px 0",
            boxShadow: "10px 0 25px rgba(0,0,0,0.1)",
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(255, 255, 255, 0.95)"
          }
        }}
      >
        <SidebarContent />
      </Drawer>

      {/* MAIN CONTENT Area */}
      <Box
        component={motion.div}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        sx={{
          flexGrow: 1,
          ml: (!showVastu && !showSplash && !isMobile) ? "280px" : 0,
          p: { xs: 2, md: 5 },
          position: "relative",
          overflowX: "hidden",
        }}
      >
        {/* MOBILE HEADER */}
        {isMobile && !showVastu && !showSplash && (
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: { xs: 2, md: 4 }, position: 'sticky', top: 0, zIndex: 1100, py: 1.5, px: 1, backdropFilter: 'blur(10px)', bgcolor: 'rgba(255, 247, 237, 0.8)' }}>
            <IconButton onClick={() => setOpenDrawer(true)} sx={{ background: "#fff", color: "#9a3412", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", border: "1px solid #fed7aa" }}>
              <MenuIcon />
            </IconButton>
            <Box component="img" src={logo} sx={{ height: 32, mx: 'auto' }} />
            <Avatar
              onClick={handleAvatarClick}
              sx={{
                width: 38,
                height: 38,
                background: "linear-gradient(135deg,#f97316,#ea580c)",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(234, 88, 12, 0.2)"
              }}
            >
              {user.firstname?.charAt(0).toUpperCase()}
            </Avatar>
          </Stack>
        )}

        <AnimatePresence mode="wait">
          {!showVastu && !showSplash && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              {/* PERSISTENT PROJECT LIMIT ALERT */}
              <Collapse in={!!persistentError}>
                <Alert
                  severity="error"
                  action={
                    <IconButton
                      aria-label="close"
                      color="inherit"
                      size="small"
                      onClick={() => setPersistentError(null)}
                    >
                      <CloseIcon fontSize="inherit" />
                    </IconButton>
                  }
                  sx={{
                    mb: 4,
                    borderRadius: "16px",
                    fontWeight: 600,
                    boxShadow: "0 4px 12px rgba(220, 38, 38, 0.1)",
                    border: "1px solid #fee2e2"
                  }}
                >
                  <AlertTitle sx={{ fontWeight: 800 }}>Action Required</AlertTitle>
                  {persistentError}
                </Alert>
              </Collapse>

              {/* QUOTA LIMIT ALERT */}
              <Collapse in={isQuotaFull && !quotaAlertDismissed}>
                <Alert
                  severity="warning"
                  icon={<WarningAmberIcon fontSize="inherit" />}
                  action={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button
                        color="inherit"
                        size="small"
                        variant="outlined"
                        onClick={() => setActiveTab("Buy Plans")}
                        sx={{ fontWeight: 700, border: '1px solid currentColor' }}
                      >
                        Upgrade
                      </Button>
                      <IconButton
                        aria-label="close"
                        color="inherit"
                        size="small"
                        onClick={() => setQuotaAlertDismissed(true)}
                      >
                        <CloseIcon fontSize="inherit" />
                      </IconButton>
                    </Box>
                  }
                  sx={{
                    mb: 4,
                    borderRadius: "16px",
                    fontWeight: 600,
                    boxShadow: "0 4px 12px rgba(234, 88, 12, 0.1)",
                    border: "1px solid #ffedd5",
                    bgcolor: "#fff7ed",
                    color: "#9a3412"
                  }}
                >
                  <AlertTitle sx={{ fontWeight: 800 }}>Plan Limit Reached</AlertTitle>
                  You have used {user.project_count_current_cycle} of {user.plan_credits} projects. Upgrade your plan to create more.
                </Alert>
              </Collapse>

              {/* HEADER SECTION */}
              <Box sx={{ mb: 6 }}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={4}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", md: "center" }}
                >
                  {/* Left: Branding/Welcome */}
                  <Stack direction="row" alignItems="center" spacing={3}>
                    {activeTab !== "Projects" && (
                      <IconButton
                        onClick={() => {
                          setActiveTab("Projects");
                          setEditingProjectId(null);
                        }}
                        sx={{
                          color: "#7c2d12",
                          bgcolor: "#fff",
                          border: "1px solid #fed7aa",
                          borderRadius: "14px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                          "&:hover": { bgcolor: "#fff7ed", transform: "translateX(-2px)" },
                          transition: "all 0.2s"
                        }}
                      >
                        <ArrowBackIcon />
                      </IconButton>
                    )}
                    <Box>
                      <Typography
                        variant="h3"
                        sx={{
                          fontWeight: 900,
                          color: "#431407",
                          letterSpacing: "-0.03em",
                          mb: 0.5,
                          fontSize: { xs: "1.4rem", sm: "1.75rem", md: "2.25rem" },
                          textAlign: { xs: "center", md: "left" },
                        }}
                      >
                        {activeTab === "Projects" ? `Welcome, ${user?.firstname}` : activeTab}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Right: Subscription Stats & Profile */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={4}
                    sx={{ width: { xs: "100%", md: "auto" } }}
                  >
                    {/* Quota Info Icon */}
                    {activeTab === "Projects" && (
                      <Tooltip title="View Quota Details">
                        <IconButton
                          onClick={() => setOpenQuotaDialog(true)}
                          sx={{
                            bgcolor: "#fff7ed",
                            border: "2px solid #fed7aa",
                            color: "#ea580c",
                            "&:hover": { bgcolor: "#ffedd5", transform: "scale(1.1)" },
                            transition: "all 0.2s ease"
                          }}
                        >
                          <DataUsageIcon />
                        </IconButton>
                      </Tooltip>
                    )}

                    {/* Upgrade Button */}
                    {isQuotaFull && activeTab === "Projects" && (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<DiamondIcon />}
                        onClick={() => {
                          setPurchaseProject(null); // Clear selected project context
                          setActiveTab("Buy Plans");
                        }}
                        sx={{
                          bgcolor: "#ea580c",
                          color: "#fff",
                          borderRadius: "12px",
                          textTransform: "none",
                          fontWeight: 800,
                          px: 2,
                          py: 0.8,
                          boxShadow: "0 4px 12px rgba(234, 88, 12, 0.4)",
                          "&:hover": { bgcolor: "#c2410c", transform: "translateY(-1px)" },
                          transition: "all 0.2s"
                        }}
                      >
                        Upgrade
                      </Button>
                    )}

                    {!isMobile && (
                      <Avatar
                        onClick={handleAvatarClick}
                        sx={{
                          width: 56,
                          height: 56,
                          background: "linear-gradient(135deg,#f97316,#ea580c)",
                          fontSize: "1.4rem",
                          fontWeight: 800,
                          boxShadow: "0 12px 28px rgba(234, 88, 12, 0.35)",
                          border: "3px solid #fff",
                          cursor: "pointer",
                          transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                          "&:hover": { transform: "scale(1.1) rotate(5deg)" }
                        }}
                      >
                        {user.firstname?.charAt(0).toUpperCase()}
                      </Avatar>
                    )}
                  </Stack>
                </Stack>
              </Box>

              {/* AVATAR MENU */}
              <Menu
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleMenuClose}
                onClick={handleMenuClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                    mt: 1.5,
                    borderRadius: 3,
                    minWidth: 180,
                    "& .MuiAvatar-root": {
                      width: 32,
                      height: 32,
                      ml: -0.5,
                      mr: 1,
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={() => handleMenuNavigate("Projects")}>
                  <ListItemIcon><GridViewIcon fontSize="small" /></ListItemIcon>
                  Projects
                </MenuItem>
                <MenuItem onClick={() => handleMenuNavigate("Account")}>
                  <ListItemIcon><PersonOutlineIcon fontSize="small" /></ListItemIcon>
                  Account
                </MenuItem>
                <MenuItem onClick={() => {
                  setPurchaseProject(null); // Clear selected project context
                  handleMenuNavigate("Buy Plans");
                }}>
                  <ListItemIcon><DiamondIcon fontSize="small" /></ListItemIcon>
                  Buy Plans
                </MenuItem>
                <MenuItem onClick={() => handleMenuNavigate("My Plans")}>
                  <ListItemIcon><ReceiptLongIcon fontSize="small" /></ListItemIcon>
                  My Plans
                </MenuItem>
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                  Sign Out
                </MenuItem>
              </Menu>

              {/* PROJECTS TAB */}
              {activeTab === "Projects" && (
                <Box>
                  {/* Top Action Row */}
                  <Box sx={{
                    display: "flex",
                    flexDirection: { xs: "row", sm: "row" },
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                    mb: 3,
                    gap: { xs: 1, sm: 2 },
                    width: "100%"
                  }}>
                    {hasCompletedMap && (
                      <Button
                        variant="outlined"
                        fullWidth={isMobile}
                        startIcon={<DownloadIcon />}
                        onClick={fetchMyMaps}
                        sx={{
                          borderRadius: "18px",
                          px: 4,
                          py: 1.8,
                          borderColor: "#92400e",
                          color: "#ffffff",
                          fontWeight: 800,
                          fontSize: "0.95rem",
                          letterSpacing: 0.5,
                          textTransform: "none",
                          "&:hover": {
                            borderColor: "#78350f",
                            bgcolor: "rgba(146, 64, 14, 0.05)",
                            transform: "translateY(-2px)",
                          },
                          transition: "all 0.3s"
                        }}
                      >
                        Download My Map
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      fullWidth={isMobile}
                      startIcon={<AutoFixHighIcon />}
                      onClick={() => {
                        setMapDialogStep('selection');
                        setOpenMapRequestDialog(true);
                      }}
                      sx={{
                        borderRadius: "18px",
                        px: 4,
                        py: 1.8,
                        borderColor: "#f97316",
                        color: "#000", // Reverted to black
                        fontWeight: 800,
                        fontSize: "0.95rem",
                        letterSpacing: 0.5,
                        textTransform: "none",
                        "&:hover": {
                          borderColor: "#ea580c",
                          bgcolor: "rgba(249, 115, 22, 0.05)",
                          transform: "translateY(-2px)",
                        },
                        transition: "all 0.3s"
                      }}
                    >
                      Build Your Map
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth={isMobile}
                      startIcon={<FolderIcon />}
                      onClick={() => setOpenCreateFolderDialog(true)}
                      sx={{
                        borderRadius: "18px",
                        px: 4,
                        py: 1.8,
                        borderColor: "#fed7aa",
                        color: "#9a3412",
                        fontWeight: 800,
                        fontSize: "0.95rem",
                        letterSpacing: 0.5,
                        textTransform: "none",
                        "&:hover": {
                          borderColor: "#f97316",
                          bgcolor: "rgba(249, 115, 22, 0.05)",
                          transform: "translateY(-2px)",
                        },
                        transition: "all 0.3s"
                      }}
                    >
                      New Folder
                    </Button>
                    <Button
                      variant="contained"
                      fullWidth={isMobile}
                      startIcon={<AddCircleOutlineIcon sx={{ color: "#fff" }} />}
                      onClick={() => setOpenCreateDialog(true)}
                      sx={{
                        borderRadius: "14px",
                        px: { xs: 2.5, sm: 4 },
                        py: { xs: 1.2, sm: 1.8 },
                        background: "linear-gradient(135deg,#f97316,#ea580c)",
                        color: "#fff",
                        fontWeight: 800,
                        fontSize: { xs: "0.8rem", sm: "0.95rem" },
                        letterSpacing: 0.5,
                        boxShadow: "0 8px 24px rgba(234, 88, 12, 0.4)",
                        textTransform: "none",
                        "&:hover": {
                          background: "linear-gradient(135deg,#ea580c,#c2410c)",
                          transform: "translateY(-2px)",
                          boxShadow: "0 12px 30px rgba(234, 88, 12, 0.5)",
                          color: "#fff"
                        },
                        transition: "all 0.3s"
                      }}
                    >
                      New Project
                    </Button>
                  </Box>

                  {/* Filter Icon Button */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button
                      onClick={() => setOpenFilterDialog(true)}
                      variant="outlined"
                      startIcon={<FilterListIcon />}
                      sx={{
                        borderRadius: "16px",
                        borderColor: "#fed7aa",
                        color: "#000", // Reverted to black
                        textTransform: "none",
                        fontWeight: 700,
                        px: 3,
                        '&:hover': {
                          borderColor: "#f97316",
                          bgcolor: "#fff7ed"
                        }
                      }}
                    >
                      Filters
                    </Button>
                  </Box>

                  {/* Filters Bar - Hidden, now in dialog */}
                  <Collapse in={false}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        mb: 5,
                        gap: 2,
                        p: { xs: 2, lg: 3 },
                        background: "rgba(255, 255, 255, 0.5)",
                        borderRadius: "24px",
                        border: "1px solid rgba(253, 186, 116, 0.2)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
                      }}
                    >
                      {/* Search Field */}
                      <TextField
                        size="medium"
                        placeholder="Search workspace..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon sx={{ color: "#f97316" }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          bgcolor: 'white',
                          borderRadius: "16px",
                          width: "100%",
                          '& .MuiOutlinedInput-root': {
                            borderRadius: "16px",
                            '& fieldset': { border: '1px solid #fed7aa' },
                            '&:hover fieldset': { borderColor: '#f97316' },
                          }
                        }}
                      />

                      {/* Status and Type Filters */}
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <FormControl size="medium" fullWidth>
                          <Select
                            value={paymentStatus}
                            onChange={(e) => { setPaymentStatus(e.target.value); setPage(0); }}
                            displayEmpty
                            sx={{
                              borderRadius: "16px",
                              bgcolor: "white",
                              '& fieldset': { border: '1px solid #fed7aa' }
                            }}
                          >
                            <MenuItem value="all">All Status</MenuItem>
                            <MenuItem value="paid">Paid</MenuItem>
                            <MenuItem value="unpaid">Unpaid</MenuItem>
                          </Select>
                        </FormControl>

                        <FormControl size="medium" fullWidth>
                          <Select
                            value={typeFilter}
                            onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
                            displayEmpty
                            sx={{
                              borderRadius: "16px",
                              bgcolor: "white",
                              '& fieldset': { border: '1px solid #fed7aa' }
                            }}
                          >
                            <MenuItem value="all">All Types</MenuItem>
                            <MenuItem value="Existing">Existing Home</MenuItem>
                            <MenuItem value="New">New Home</MenuItem>
                          </Select>
                        </FormControl>
                      </Stack>

                      {/* Date Filters */}
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <TextField
                          type="date"
                          size="medium"
                          label="Start Date"
                          value={startDate}
                          onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
                          InputLabelProps={{ shrink: true }}
                          fullWidth
                          sx={{
                            bgcolor: 'white',
                            borderRadius: "16px",
                            '& .MuiOutlinedInput-root': { borderRadius: "16px", '& fieldset': { border: '1px solid #fed7aa' } }
                          }}
                        />
                        <TextField
                          type="date"
                          size="medium"
                          label="End Date"
                          value={endDate}
                          onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
                          InputLabelProps={{ shrink: true }}
                          fullWidth
                          sx={{
                            bgcolor: 'white',
                            borderRadius: "16px",
                            '& .MuiOutlinedInput-root': { borderRadius: "16px", '& fieldset': { border: '1px solid #fed7aa' } }
                          }}
                        />
                      </Stack>
                    </Box>
                  </Collapse>

                  {/* Projects Title */}
                  <Stack direction={{ xs: "column", sm: "row" }} alignItems="center" spacing={2} sx={{ mb: 3 }} justifyContent="space-between" width="100%">
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 900,
                          color: "#431407",
                          letterSpacing: -0.5
                        }}
                      >
                        Workspace Projects
                      </Typography>
                      {currentFolderId && (
                        <Chip
                          icon={<HomeIcon sx={{ fontSize: '1rem !important' }} />}
                          label="Home"
                          onClick={() => setCurrentFolderId(null)}
                          sx={{
                            fontWeight: 700,
                            bgcolor: "#fff7ed",
                            color: "#9a3412",
                            borderRadius: "8px",
                            cursor: 'pointer',
                            '&:hover': { bgcolor: '#ffedd5' }
                          }}
                        />
                      )}
                      {currentFolderId && folders.find(f => f.id === currentFolderId) && (
                        <Typography sx={{ color: '#9a3412', fontWeight: 700 }}>
                          / {folders.find(f => f.id === currentFolderId).folder_name}
                        </Typography>
                      )}
                      <Chip
                        label={`${totalProjects} Total`}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          bgcolor: "#ffedd5",
                          color: "#9a3412",
                          borderRadius: "8px"
                        }}
                      />
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={2}>
                      {selectedProjects.length > 0 && (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<DeleteOutlineIcon />}
                          onClick={handleBulkDeleteProjects}
                          sx={{ borderRadius: "10px", fontWeight: 700, textTransform: "none" }}
                        >
                          Delete Selected ({selectedProjects.length})
                        </Button>
                      )}
                    </Stack>
                  </Stack>

                  {folders.length > 0 && !currentFolderId && (
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 800, color: "#9a3412", opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Folders
                      </Typography>
                      <Grid container spacing={2}>
                        {/* --- Root/Home Folder Card --- */}
                        <Grid item xs={6} sm={4} md={3}>
                          <Card
                            elevation={0}
                            onClick={() => setCurrentFolderId(null)}
                            sx={{
                              p: 2,
                              borderRadius: "16px",
                              border: currentFolderId === null ? "2px solid #f97316" : "1px solid #fed7aa",
                              bgcolor: currentFolderId === null ? "#fff7ed" : "white",
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              '&:hover': {
                                borderColor: '#f97316',
                                bgcolor: '#fff7ed',
                                transform: 'translateY(-2px)'
                              },
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 0.5
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <HomeIcon sx={{ color: '#f97316' }} />
                              <Box sx={{ overflow: 'hidden' }}>
                                <Typography noWrap sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#431407' }}>
                                  Home (Root)
                                </Typography>
                              </Box>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#9a3412', fontWeight: 600, ml: 4.5 }}>
                              {rootCount} Maps
                            </Typography>
                          </Card>
                        </Grid>

                        {folders.map((folder) => (
                          <Grid item xs={6} sm={4} md={3} key={folder.id}>
                            <Card
                              elevation={0}
                              onClick={() => setCurrentFolderId(folder.id)}
                              sx={{
                                p: 2,
                                borderRadius: "16px",
                                border: currentFolderId === folder.id ? "2px solid #f97316" : "1px solid #fed7aa",
                                bgcolor: currentFolderId === folder.id ? "#fff7ed" : "white",
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  borderColor: '#f97316',
                                  bgcolor: '#fff7ed',
                                  transform: 'translateY(-2px)'
                                },
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.5
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <FolderIcon sx={{ color: '#f97316' }} />
                                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                                  <Typography noWrap sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#431407' }}>
                                    {folder.folder_name}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex' }}>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const n = prompt("New name:", folder.folder_name);
                                      if (n && n !== folder.folder_name) handleRenameFolder(folder.id, n);
                                    }}
                                  >
                                    <EditIcon sx={{ fontSize: '0.9rem' }} />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteFolder(folder.id);
                                    }}
                                  >
                                    <DeleteOutlineIcon sx={{ fontSize: '0.9rem' }} />
                                  </IconButton>
                                </Box>
                              </Box>
                              <Typography variant="caption" sx={{ color: '#9a3412', fontWeight: 600, ml: 4.5 }}>
                                {folder.project_count || 0} Maps
                              </Typography>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {projects.length === 0 ? (
                    <Box sx={{
                      textAlign: "center", py: 10,
                      borderRadius: "24px",
                      border: "2px dashed #fed7aa",
                      bgcolor: "rgba(255,255,255,0.4)",
                      color: "#9a3412"
                    }}>
                      <AutoFixHighIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                      <Typography sx={{ fontWeight: 600 }}>No projects found matching your criteria.</Typography>
                    </Box>
                  ) : (
                    <>
                      <Stack spacing={2}>
                        {projects.map((proj) => (
                          <motion.div
                            key={proj.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            layout
                          >
                            <Card
                              elevation={0}
                              sx={{
                                p: 1,
                                borderRadius: "20px",
                                background: "#fff",
                                border: "1px solid #fed7aa",
                                position: "relative", // Added for top-right date
                                transition: "all 0.3s ease",
                                "&:hover": {
                                  transform: "translateY(-4px)",
                                  boxShadow: "0 20px 40px rgba(154, 52, 18, 0.1)",
                                  borderColor: "#f97316"
                                }
                              }}
                            >
                                {isMobile && (
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1.5, borderBottom: '1px solid #ffedd5', pb: 1 }}>
                                    <Chip 
                                      label={new Date(proj.created_at).toLocaleDateString()} 
                                      size="small" 
                                      sx={{ fontWeight: 800, fontSize: '0.65rem', background: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa' }}
                                    />
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                      <IconButton size="small" onClick={() => { setMovingProjectId(proj.id); setOpenMoveDialog(true); }} sx={{ p: 0.5, color: "#f97316" }}>
                                        <DriveFileMoveIcon sx={{ fontSize: '1.1rem' }} />
                                      </IconButton>
                                      <IconButton size="small" onClick={() => handleStartEdit(proj)} sx={{ p: 0.5, color: "#9a3412" }}>
                                        <EditIcon sx={{ fontSize: '1.1rem' }} />
                                      </IconButton>
                                    </Box>
                                  </Box>
                                )}
                              <CardContent sx={{ p: 2, display: "flex", alignItems: "center", gap: 3, flexDirection: { xs: "column", sm: "row" } }}>
                                <Checkbox
                                  checked={selectedProjects.includes(proj.id)}
                                  onChange={() => handleSelectOneProject(proj.id)}
                                  sx={{
                                    color: "#fed7aa",
                                    '&.Mui-checked': { color: "#f97316" },
                                    display: { xs: "none", sm: "block" }
                                  }}
                                />


                                {/* Icon / Avatar */}
                                <Box
                                  sx={{
                                    width: { xs: 48, sm: 60 },
                                    height: { xs: 48, sm: 60 },
                                    borderRadius: "14px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: (proj.plan_id || proj.plan_name) ? "linear-gradient(135deg, #10b981, #059669)" : "#fff7ed",
                                    color: (proj.plan_id || proj.plan_name) ? "#fff" : "#ea580c",
                                    border: (proj.plan_id || proj.plan_name) ? "none" : "1px solid #fed7aa",
                                    flexShrink: 0
                                  }}
                                >
                                  {(proj.plan_id || proj.plan_name) ? <LockOpenIcon sx={{ fontSize: { xs: 20, sm: 24 } }} /> : <LockIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                                </Box>

                                {/* Texts */}
                                <Box sx={{ flexGrow: 1, textAlign: { xs: "center", sm: "left" } }}>
                                  <Typography variant="h6" sx={{
                                    fontWeight: 900,
                                    color: "#431407",
                                    lineHeight: 1.2,
                                    mb: 0.5,
                                    fontSize: { xs: "1rem", sm: "1.25rem" }
                                  }}>
                                    {proj.project_name}
                                  </Typography>
                                  {user?.role === 'expert' && proj.follower_name && (
                                    <Typography variant="body2" sx={{ color: "#9a3412", fontWeight: 800, mb: 1, opacity: 0.8, fontSize: '0.85rem' }}>
                                      User: {proj.follower_name}
                                    </Typography>
                                  )}
                                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} justifyContent={{ xs: "center", sm: "flex-start" }}>
                                    {proj.plan_name && proj.plan_name !== '0' && (
                                      <Typography variant="caption" sx={{ display: 'block', width: '100%', mb: 0.5, color: "#9a3412", opacity: 0.8, fontWeight: 700, fontSize: '0.7rem' }}>
                                        Plan: {proj.plan_name}
                                      </Typography>
                                    )}
                                    <Chip
                                      label={proj.property_type || "Residential"}
                                      size="small"
                                      variant="filled"
                                      sx={{
                                        fontWeight: 700,
                                        fontSize: "0.65rem",
                                        borderRadius: "8px",
                                        bgcolor: (proj.property_type === 'Commercial') ? "#431407" : "#fef3c7",
                                        color: (proj.property_type === 'Commercial') ? "#fff" : "#92400e",
                                      }}
                                    />
                                    <Chip
                                      label={proj.construction_type ? proj.construction_type.replace(' Home', ' Property Work') : "Existing Property Work"}
                                      size="small"
                                      variant="outlined"
                                      sx={{
                                        fontWeight: 700,
                                        fontSize: "0.65rem",
                                        borderRadius: "8px",
                                        color: "#9a3412",
                                        borderColor: "#fed7aa"
                                      }}
                                    />
                                    {proj.project_issue && proj.project_issue.split(',').map((issue, idx) => (
                                      <Chip
                                        key={idx}
                                        label={issue.trim()}
                                        size="small"
                                        sx={{
                                          fontWeight: 700,
                                          fontSize: "0.65rem",
                                          borderRadius: "8px",
                                          bgcolor: issue.trim() === 'Health' ? "#fef3c7" : issue.trim() === 'Wealth' ? "#dcfce7" : issue.trim() === 'Relationship' ? "#fce7f3" : "#f3f4f6",
                                          color: issue.trim() === 'Health' ? "#92400e" : issue.trim() === 'Wealth' ? "#166534" : issue.trim() === 'Relationship' ? "#9d174d" : "#374151",
                                          border: "1px solid",
                                          borderColor: issue.trim() === 'Health' ? "#fde68a" : issue.trim() === 'Wealth' ? "#bbf7d0" : issue.trim() === 'Relationship' ? "#fbcfe8" : "#e5e7eb"
                                        }}
                                      />
                                    ))}
                                    {(() => {
                                      const hasLocalPlan = proj.plan_id || (proj.plan_name && proj.plan_name !== '0');
                                      const isGlobalSubActive = user?.plan_type === 'subscription' && (!user?.plan_expiry || new Date(user?.plan_expiry) > new Date());

                                      // Prioritize local project plan type over global subscription type for the badge label
                                      const planType = hasLocalPlan ? proj.project_plan_type : (isGlobalSubActive ? 'subscription' : null);
                                      const hasPlan = isGlobalSubActive || hasLocalPlan;

                                      if (!hasPlan) {
                                        return (
                                          <Chip
                                            label="Action Required"
                                            size="small"
                                            sx={{
                                              fontWeight: 700,
                                              fontSize: "0.7rem",
                                              borderRadius: "8px",
                                              bgcolor: "#fff7ed",
                                              color: "#c2410c",
                                              border: "1px solid #fed7aa"
                                            }}
                                          />
                                        );
                                      }

                                      return (
                                        <Chip
                                          label={planType === 'subscription' ? 'Subscription' : 'Single'}
                                          size="small"
                                          sx={{
                                            fontWeight: 700,
                                            fontSize: "0.7rem",
                                            borderRadius: "8px",
                                            bgcolor: planType === 'subscription' ? "#d1fae5" : "#dbeafe",
                                            color: planType === 'subscription' ? "#059669" : "#2563eb",
                                            border: "1px solid",
                                            borderColor: "transparent"
                                          }}
                                        />
                                      );
                                    })()}
                                    {!isMobile && (
                                      <Typography variant="caption" sx={{ color: "#9a3412", mt: 0.5, opacity: 0.8 }}>
                                        Created: {new Date(proj.created_at).toLocaleDateString()}
                                      </Typography>
                                    )}
                                  </Stack>
                                </Box>
                                {/* Actions */}
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  alignItems="center"
                                  sx={{
                                    width: { xs: "100%", sm: "auto" },
                                    justifyContent: { xs: "space-between", sm: "flex-end" },
                                    borderTop: { xs: "1px solid #ffedd5", sm: "none" },
                                    pt: { xs: 1.5, sm: 0 },
                                    mt: { xs: 1, sm: 0 }
                                  }}
                                >
                                  <Box sx={{ display: "flex", gap: 0.5 }}>
                                    <Tooltip title="Move to Folder">
                                      <IconButton size="small" onClick={() => { setMovingProjectId(proj.id); setOpenMoveDialog(true); }} sx={{ color: "#f97316" }}>
                                        <DriveFileMoveIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Duplicate">
                                      <IconButton size="small" onClick={() => handleDuplicateProject(proj)} sx={{ color: "#9a3412" }}>
                                        <ContentCopyIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Edit">
                                      <IconButton size="small" onClick={() => handleStartEdit(proj)} sx={{ color: "#9a3412" }}>
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Personal Details">
                                      <IconButton size="small" onClick={() => {
                                        setSelectedProjectId(proj.id);
                                        setSelectedProjectConstructionType(proj.construction_type);
                                        setIsModalMandatory(false);
                                        setShowDetailsModal(true);
                                      }} sx={{ color: "#9a3412" }}>
                                        <AssignmentIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                      <IconButton size="small" onClick={() => confirmDeleteProject(proj)} sx={{ color: "#dc2626" }}>
                                        <DeleteOutlineIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>

                                  {(() => {
                                    const hasIndividualPlan = (proj.plan_id && proj.plan_id !== '0' && proj.plan_id !== '');
                                    // Treat as active if payment is Active/Completed OR if the project has a plan assigned but the payment record is missing (orphaned)
                                    const isPaymentActive = proj.payment_status === 'Active' || proj.payment_status === 'Completed' || (hasIndividualPlan && !proj.payment_status);
                                    const isPaymentPending = proj.payment_status === 'Pending';

                                    const isGlobalSubActive = (user?.plan_type === 'subscription' || user?.plan) && (!user?.plan_expiry || new Date(user?.plan_expiry) > new Date());
                                    let isCoveredBySub = false;
                                    if (isGlobalSubActive && user?.plan) {
                                      // Corrected: Include projects that either have NO plan_id OR have the SAME plan_id as the user's subscription.
                                      // Also respect project_plan_type if returned by API.
                                      const activationDate = user?.plan_activated_at ? new Date(user?.plan_activated_at) : null;
                                      const uncoveredProjects = projects.filter(p => {
                                        // If it's explicitly a single plan, it's NOT covered by subscription
                                        if (p.project_plan_type === 'single') return false;

                                        // Only count projects created after (or exactly at) activation date
                                        if (activationDate && new Date(p.created_at) < activationDate) return false;

                                        // If it has NO plan_id, it's treated as subscription-based
                                        if (!p.plan_id || p.plan_id === '0' || p.plan_id === '') return true;

                                        // If it HAS a plan_id and it matches the user's current subscription, it's covered
                                        if (p.plan_id == user?.plan_id) return true;

                                        return false;
                                      }).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

                                      const uncoveredIndex = uncoveredProjects.findIndex(p => p.id === proj.id);
                                      const limit = user?.plan_credits || 1;
                                      // If total used projects in current cycle is within limit, all subscription-eligible projects are covered
                                      const isWithinTotalQuota = (user?.project_count_current_cycle || 0) <= limit;

                                      if (uncoveredIndex !== -1) {
                                        if (isWithinTotalQuota || (page === 0 && uncoveredIndex < limit)) {
                                          isCoveredBySub = true;
                                        }
                                      }
                                    }

                                    // If a plan is deleted from the 'plans' table, project_plan_type becomes NULL.
                                    // Subscription projects are those that aren't explicitly 'single'.
                                    const isSubscriptionProject = proj.project_plan_type !== 'single';
                                    const isPersistentOpen = isSubscriptionProject && isGlobalSubActive;

                                    if (isCoveredBySub || isPersistentOpen || (hasIndividualPlan && isPaymentActive)) {
                                      return (
                                        <Button
                                          variant="contained"
                                          size="small"
                                          onClick={() => handleLaunch(proj)}
                                          sx={{
                                            borderRadius: "10px",
                                            bgcolor: "#f97316",
                                            color: "#fff !important",
                                            fontWeight: 700,
                                            textTransform: "none",
                                            px: { xs: 2, sm: 3 },
                                            "&:hover": { bgcolor: "#ea580c" }
                                          }}
                                        >
                                          Open Tool
                                        </Button>
                                      );
                                    } else {
                                      return (
                                        <Button
                                          variant="contained"
                                          size="small"
                                          onClick={() => handlePurchasePlan(proj)}
                                          sx={{
                                            borderRadius: "10px",
                                            background: isPaymentPending ? "linear-gradient(135deg, #9a3412, #f97316)" : "linear-gradient(135deg, #431407, #292524)",
                                            fontWeight: 700,
                                            textTransform: "none",
                                            color: "#fff",
                                            px: { xs: 2, sm: 3 },
                                            flexGrow: { xs: 1, sm: 0 }
                                          }}
                                        >
                                          {isPaymentPending ? "Complete Payment" : "Purchase"}
                                        </Button>
                                      );
                                    }
                                  })()}
                                </Stack>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </Stack>
                      <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={totalProjects}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handlePageChange}
                        onRowsPerPageChange={handleRowsPerPageChange}
                        sx={{ mt: 2 }}
                      />
                    </>
                  )}
                </Box>
              )}

              {activeTab === "Account" && <AccountDetails user={user} onRefresh={() => refreshUser(user?.email)} />}
              {activeTab === "My Plans" && <MyPlans email={user?.email} onRefresh={refreshUser} />}
              {activeTab === "Buy Plans" && (
                <BuyPlans
                  email={user?.email}
                  projectId={purchaseProject?.id}
                  projectName={purchaseProject?.project_name}
                  onPurchase={() => {
                    refreshUser();
                    setActiveTab("My Plans");
                  }}
                />
              )}
              {activeTab === "Tutorials" && <Tutorials />}
              {activeTab === "Manage Devices" && <UserDevices userId={user?.id} userEmail={user?.email} />}
            </motion.div>
          )}

          {/* PREMIUM SPLASH SCREEN */}
          {showSplash && (
            <Box
              component={motion.div}
              key="premium-splash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              sx={{
                position: "fixed",
                top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 9999,
                background: "radial-gradient(circle at center, #ffffff 0%, #fff7ed 100%)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden"
              }}
            >
              {/* Background Glow */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.2, 0.1],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  background: "radial-gradient(circle at center, rgba(249, 115, 22, 0.15) 0%, transparent 70%)",
                }}
              />

              {/* Central Core */}
              <Box sx={{ position: "relative", mb: 8 }}>
                {/* Rotating Rings */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                    transition={{ duration: 10 + i * 5, repeat: Infinity, ease: "linear" }}
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      width: 140 + i * 40,
                      height: 140 + i * 40,
                      marginTop: -(70 + i * 20),
                      marginLeft: -(70 + i * 20),
                      borderRadius: "50%",
                      border: `1px solid rgba(249, 115, 22, ${0.05 + i * 0.05})`,
                      borderTopColor: "rgba(249, 115, 22, 0.3)",
                    }}
                  />
                ))}

                {/* Main Icon */}
                <motion.div
                  animate={{
                    scale: [0.9, 1.1, 0.9],
                    filter: ["drop-shadow(0 0 10px rgba(249, 115, 22, 0.2))", "drop-shadow(0 0 25px rgba(249, 115, 22, 0.4))", "drop-shadow(0 0 10px rgba(249, 115, 22, 0.2))"]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Box sx={{
                    width: 100,
                    height: 100,
                    borderRadius: "30px",
                    background: "linear-gradient(135deg, #f97316, #ea580c)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    boxShadow: "0 15px 40px rgba(234, 88, 12, 0.3)"
                  }}>
                    <AutoFixHighIcon sx={{ fontSize: 50 }} />
                  </Box>
                </motion.div>
              </Box>

              {/* Loading Status */}
              <Box sx={{ textAlign: "center", zIndex: 10 }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={Math.floor(Date.now() / 800) % 4} // Simple cycle for demo purposes, can be refined
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Typography variant="h5" sx={{
                      fontWeight: 900,
                      color: "#9a3412",
                      letterSpacing: 4,
                      textTransform: "uppercase",
                      mb: 2,
                    }}>
                      {Math.floor(Date.now() / 800) % 4 === 0 && "Scanning Map Architecture"}
                      {Math.floor(Date.now() / 800) % 4 === 1 && "Aligning Vastu Compass"}
                      {Math.floor(Date.now() / 800) % 4 === 2 && "Establishing Brahmasthan"}
                      {Math.floor(Date.now() / 800) % 4 === 3 && "Calibrating Shakti Chakra"}
                    </Typography>
                  </motion.div>
                </AnimatePresence>

                <Box sx={{ width: 300, height: 6, bgcolor: "#fed7aa", borderRadius: 3, mx: "auto", position: "relative", overflow: "hidden", border: "1px solid rgba(249, 115, 22, 0.1)" }}>
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3, ease: "easeInOut" }}
                    style={{
                      height: "100%",
                      background: "linear-gradient(90deg, #f97316, #ea580c)",
                      boxShadow: "0 0 10px rgba(249, 115, 22, 0.5)"
                    }}
                  />
                </Box>

                <Typography variant="caption" sx={{ color: "#c2410c", mt: 2, display: "block", fontWeight: 800, letterSpacing: 1, opacity: 0.6 }}>
                  ADVANCED PLOT INTELLIGENCE v2.0
                </Typography>
              </Box>

              {/* Decorative Particles */}
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={`p-${i}`}
                  animate={{
                    y: [-20, -100],
                    opacity: [0, 0.6, 0],
                    scale: [0, 1, 0]
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                    ease: "easeOut"
                  }}
                  style={{
                    position: "absolute",
                    bottom: "20%",
                    left: `${10 + Math.random() * 80}%`,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "rgba(249, 115, 22, 0.4)",
                  }}
                />
              ))}
            </Box>
          )}

          {/* FULL TOOL SCREEN */}
          {showVastu && (
            <motion.div
              key="vastu-tool"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              style={{
                position: "fixed",
                top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 2000,
                background: "#fff"
              }}
            >
              <VastuToolScreen onBack={handleToolBack} />
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* CREATE PROJECT DIALOG */}
      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        PaperProps={{ sx: { borderRadius: 4, p: 2, minWidth: { xs: 300, md: 450 } } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: "#431407", fontSize: "1.5rem", pb: 1 }}>
          Create New Project
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "#9a3412", opacity: 0.8, mb: 3, fontWeight: 500 }}>
            Fill in the details below to start your new Vastu analysis.
          </Typography>

          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            fullWidth
            variant="outlined"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": { borderRadius: 3 },
              "& .MuiInputLabel-root": { color: "#9a3412", fontWeight: 600 },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#fed7aa" }
            }}
          />

          {(user?.role === 'expert' || followedExperts.length > 0 || isAdminLoggedIn) && (
            <Autocomplete
              options={
                user?.role === 'expert' 
                  ? followers 
                  : (isAdminLoggedIn ? allUsers : followedExperts)
              }
              getOptionLabel={(option) => {
                if (!option) return "";
                const name = option.name || option.firstname || "";
                const contact = option.phone || option.mobile || option.email || "";
                return `${name} (${contact})`;
              }}
              value={
                (user?.role === 'expert' 
                  ? followers.find(f => f.user_id == selectedFollowerId)
                  : (isAdminLoggedIn 
                      ? allUsers.find(u => u.id == selectedFollowerId) 
                      : followedExperts.find(e => e.id == selectedFollowerId))) || null
              }
              onChange={(event, newValue) => {
                setSelectedFollowerId(newValue ? (newValue.user_id || newValue.id) : "");
              }}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5 }}>
                  <Avatar 
                    src={(option.profile_image || option.image) ? `/${option.profile_image || option.image}` : null} 
                    sx={{ width: 32, height: 32, border: '2px solid #fed7aa' }}
                  >
                    {(option.name || option.firstname)?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#431407" }}>
                      {option.name || option.firstname}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#9a3412", opacity: 0.8 }}>
                      {option.phone || option.mobile || option.email}
                    </Typography>
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={
                    user?.role === 'expert' 
                      ? "Link to Follower (Optional)" 
                      : (isAdminLoggedIn ? "Assign to User" : "Share with Expert")
                  }
                  placeholder={
                    user?.role === 'expert' 
                      ? "Select one of your followers..." 
                      : (isAdminLoggedIn ? "Select a user..." : "Select an expert you follow...")
                  }
                  sx={{
                    mb: 3,
                    "& .MuiOutlinedInput-root": { borderRadius: 3 },
                    "& .MuiInputLabel-root": { color: "#9a3412", fontWeight: 600 },
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#fed7aa" }
                  }}
                />
              )}
            />
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: "#9a3412", fontWeight: 600 }}>Property Class</InputLabel>
                <Select
                  value={propertyType}
                  label="Property Class"
                  onChange={(e) => setPropertyType(e.target.value)}
                  sx={{
                    borderRadius: 3,
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#fed7aa" }
                  }}
                >
                  <MenuItem value="Residential">🏠 Residential</MenuItem>
                  <MenuItem value="Commercial">🏢 Commercial</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: "#9a3412", fontWeight: 600 }}>Work Type</InputLabel>
                <Select
                  value={constructionType}
                  label="Work Type"
                  onChange={(e) => setConstructionType(e.target.value)}
                  sx={{
                    borderRadius: 3,
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#fed7aa" }
                  }}
                >
                  <MenuItem value="Existing">Existing Property Work</MenuItem>
                  <MenuItem value="New">New Property Work</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {constructionType !== 'New' && (
            <>
              <Box sx={{ mt: 1, mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#431407", mb: 0.5 }}>
                  Primary Objective
                </Typography>
                <Typography variant="caption" sx={{ color: "#9a3412", opacity: 0.7, display: "block", mb: 1.5 }}>
                  What is the main concern you want to address in this project?
                </Typography>
              </Box>

              {!projectIssue.includes("Custom") && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel sx={{ color: "#9a3412", fontWeight: 600 }}>Select Vastu Issue</InputLabel>
                  <Select
                    multiple
                    value={projectIssue}
                    label="Select Vastu Issue"
                    onChange={(e) => {
                      const {
                        target: { value },
                      } = e;
                      setProjectIssue(
                        // On autofill we get a stringified value.
                        typeof value === 'string' ? value.split(',') : value,
                      );
                    }}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" sx={{ bgcolor: "#fff7ed", color: "#9a3412", fontWeight: 700 }} />
                        ))}
                      </Box>
                    )}
                    sx={{
                      borderRadius: 3,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#fed7aa" }
                    }}
                  >
                    <MenuItem value="Health">⚕️ Health & Wellness</MenuItem>
                    <MenuItem value="Wealth">💰 Wealth & Prosperity</MenuItem>
                    <MenuItem value="Relationship">❤️ Love & Relationship</MenuItem>
                    <MenuItem value="Custom">📝 Custom Issue</MenuItem>
                  </Select>
                </FormControl>
              )}

              {projectIssue.includes("Custom") && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#431407", mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Describe Custom Issues
                    <Button
                      size="small"
                      onClick={() => setProjectIssue(prev => prev.filter(i => i !== "Custom"))}
                      sx={{ textTransform: 'none', color: '#9a3412', fontWeight: 700 }}
                    >
                      Back to List
                    </Button>
                  </Typography>
                  {customIssues.map((issue, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1.5, alignItems: 'center' }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. Career Growth..."
                        value={issue}
                        onChange={(e) => {
                          const newIssues = [...customIssues];
                          newIssues[index] = e.target.value;
                          setCustomIssues(newIssues);
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": { borderRadius: 3 },
                          "& .MuiOutlinedInput-notchedOutline": { borderColor: "#fed7aa" }
                        }}
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          if (customIssues.length > 1) {
                            setCustomIssues(customIssues.filter((_, i) => i !== index));
                          }
                        }}
                        disabled={customIssues.length === 1}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                      {index === customIssues.length - 1 && (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => setCustomIssues([...customIssues, ''])}
                          sx={{ color: '#ea580c' }}
                        >
                          <AddCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </>
          )}

          <FormControl fullWidth sx={{ mt: 3 }}>
            <InputLabel sx={{ color: "#9a3412", fontWeight: 600 }}>Destination Folder</InputLabel>
            <Select
              value={currentFolderId || 'root'}
              label="Destination Folder"
              onChange={(e) => setCurrentFolderId(e.target.value === 'root' ? null : e.target.value)}
              sx={{
                borderRadius: 3,
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#fed7aa" }
              }}
            >
              <MenuItem value="root">Home / Root ({rootCount})</MenuItem>
              {folders.map(f => (
                <MenuItem key={f.id} value={f.id}>
                  <FolderIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#f97316' }} />
                  {f.folder_name} ({f.project_count || 0})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button
            onClick={() => {
              setOpenCreateDialog(false);
              setSelectedFollowerId("");
            }}
            sx={{
              color: "#000000",
              fontWeight: 700,
              textTransform: "none",
              fontSize: "0.95rem"
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateProject}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg,#f97316,#ea580c)",
              color: "#fff",
              fontWeight: 800,
              px: 4,
              py: 1.2,
              borderRadius: "14px",
              textTransform: "none",
              boxShadow: "0 8px 20px rgba(234, 88, 12, 0.3)",
              fontSize: "0.95rem",
              "&:hover": {
                background: "linear-gradient(135deg,#ea580c,#c2410c)",
                boxShadow: "0 10px 25px rgba(234, 88, 12, 0.4)"
              }
            }}
          >
            Create Project
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT PROJECT DIALOG */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        PaperProps={{ sx: { borderRadius: 4, p: 2, minWidth: { xs: 300, md: 450 } } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: "#431407", fontSize: "1.5rem", pb: 1 }}>
          Edit Project Details
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "#9a3412", opacity: 0.8, mb: 3, fontWeight: 500 }}>
            Modify project name, construction type, or primary objectives.
          </Typography>

          <TextField
            margin="dense"
            label="Project Name"
            fullWidth
            variant="outlined"
            value={editProjectData.project_name}
            onChange={(e) => setEditProjectData({ ...editProjectData, project_name: e.target.value })}
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": { borderRadius: 3 },
              "& .MuiInputLabel-root": { color: "#9a3412", fontWeight: 600 },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#fed7aa" }
            }}
          />

          {user?.role === 'expert' && (
            <Autocomplete
              options={followers}
              getOptionLabel={(option) => `${option.name || ''} (${option.phone || option.email || ''})`}
              value={followers.find(f => f.user_id == editProjectData.follower_id) || null}
              onChange={(event, newValue) => {
                setEditProjectData({ ...editProjectData, follower_id: newValue ? newValue.user_id : "" });
              }}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5 }}>
                  <Avatar 
                    src={option.profile_image ? `/${option.profile_image}` : null} 
                    sx={{ width: 32, height: 32, border: '2px solid #fed7aa' }}
                  >
                    {option.name?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#431407" }}>
                      {option.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#9a3412", opacity: 0.8 }}>
                      {option.phone || option.email}
                    </Typography>
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Link to Follower (Optional)"
                  sx={{
                    mb: 3,
                    "& .MuiOutlinedInput-root": { borderRadius: 3 },
                    "& .MuiInputLabel-root": { color: "#9a3412", fontWeight: 600 },
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#fed7aa" }
                  }}
                />
              )}
            />
          )}

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: "#9a3412", fontWeight: 600 }}>Property Class</InputLabel>
                <Select
                  value={editProjectData.property_type}
                  label="Property Class"
                  onChange={(e) => setEditProjectData({ ...editProjectData, property_type: e.target.value })}
                  sx={{
                    borderRadius: 3,
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#fed7aa" }
                  }}
                >
                  <MenuItem value="Residential">🏠 Residential</MenuItem>
                  <MenuItem value="Commercial">🏢 Commercial</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: "#9a3412", fontWeight: 600 }}>Work Type</InputLabel>
                <Select
                  value={editProjectData.construction_type}
                  label="Work Type"
                  onChange={(e) => setEditProjectData({ ...editProjectData, construction_type: e.target.value })}
                  sx={{
                    borderRadius: 3,
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#fed7aa" }
                  }}
                >
                  <MenuItem value="Existing">Existing Property Work</MenuItem>
                  <MenuItem value="New">New Property Work</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {editProjectData.construction_type !== 'New' && (
            <>
              <Box sx={{ mt: 1, mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#431407", mb: 0.5 }}>
                  Primary Objective
                </Typography>
              </Box>

              {!editProjectData.project_issue.includes("Custom") && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel sx={{ color: "#9a3412", fontWeight: 600 }}>Select Vastu Issue</InputLabel>
                  <Select
                    multiple
                    value={editProjectData.project_issue}
                    label="Select Vastu Issue"
                    onChange={(e) => {
                      const {
                        target: { value },
                      } = e;
                      setEditProjectData({
                        ...editProjectData,
                        project_issue: typeof value === 'string' ? value.split(',') : value,
                      });
                    }}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" sx={{ bgcolor: "#fff7ed", color: "#9a3412", fontWeight: 700 }} />
                        ))}
                      </Box>
                    )}
                    sx={{
                      borderRadius: 3,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#fed7aa" }
                    }}
                  >
                    <MenuItem value="Health">⚕️ Health & Wellness</MenuItem>
                    <MenuItem value="Wealth">💰 Wealth & Prosperity</MenuItem>
                    <MenuItem value="Relationship">❤️ Love & Relationship</MenuItem>
                    <MenuItem value="Custom">📝 Custom Issue</MenuItem>
                  </Select>
                </FormControl>
              )}

              {editProjectData.project_issue.includes("Custom") && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#431407", mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Describe Custom Issues
                    <Button
                      size="small"
                      onClick={() => setEditProjectData(prev => ({ ...prev, project_issue: prev.project_issue.filter(i => i !== "Custom") }))}
                      sx={{ textTransform: 'none', color: '#9a3412', fontWeight: 700 }}
                    >
                      Back to List
                    </Button>
                  </Typography>
                  {editProjectData.customIssues.map((issue, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1.5, alignItems: 'center' }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. Career Growth..."
                        value={issue}
                        onChange={(e) => {
                          const newIssues = [...editProjectData.customIssues];
                          newIssues[index] = e.target.value;
                          setEditProjectData({ ...editProjectData, customIssues: newIssues });
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": { borderRadius: 3 },
                          "& .MuiOutlinedInput-notchedOutline": { borderColor: "#fed7aa" }
                        }}
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          if (editProjectData.customIssues.length > 1) {
                            setEditProjectData({ ...editProjectData, customIssues: editProjectData.customIssues.filter((_, i) => i !== index) });
                          }
                        }}
                        disabled={editProjectData.customIssues.length === 1}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                      {index === editProjectData.customIssues.length - 1 && (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => setEditProjectData({ ...editProjectData, customIssues: [...editProjectData.customIssues, ''] })}
                          sx={{ color: '#ea580c' }}
                        >
                          <AddCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </>
          )}

          <FormControl fullWidth sx={{ mt: 3 }}>
            <InputLabel sx={{ color: "#9a3412", fontWeight: 600 }}>Destination Folder</InputLabel>
            <Select
              value={editProjectData.folder_id || 'root'}
              label="Destination Folder"
              onChange={(e) => setEditProjectData({ ...editProjectData, folder_id: e.target.value })}
              sx={{
                borderRadius: 3,
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#fed7aa" }
              }}
            >
              <MenuItem value="root">Home / Root ({rootCount})</MenuItem>
              {folders.map(f => (
                <MenuItem key={f.id} value={f.id}>
                  <FolderIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#f97316' }} />
                  {f.folder_name} ({f.project_count || 0})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button
            onClick={() => setOpenEditDialog(false)}
            sx={{
              color: "#9a3412",
              fontWeight: 700,
              textTransform: "none",
              fontSize: "0.95rem"
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg,#f97316,#ea580c)",
              color: "#fff",
              fontWeight: 800,
              px: 4,
              py: 1.2,
              borderRadius: "14px",
              textTransform: "none",
              boxShadow: "0 8px 20px rgba(234, 88, 12, 0.3)",
              fontSize: "0.95rem",
              "&:hover": {
                background: "linear-gradient(135deg,#ea580c,#c2410c)",
                boxShadow: "0 10px 25px rgba(234, 88, 12, 0.4)"
              }
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: 4, p: 1, minWidth: 320 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1, color: "#dc2626" }}>
          <WarningAmberIcon />
          Delete Project?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#431407" }}>
            Are you sure you want to delete <strong>{projectToDelete?.project_name}</strong>?
            <br />
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: "#ffffff", fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteProject}
            variant="contained"
            color="error"
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* CREATE FOLDER DIALOG */}
      <Dialog
        open={openCreateFolderDialog}
        onClose={() => setOpenCreateFolderDialog(false)}
        PaperProps={{
          sx: { borderRadius: 4, p: 1, minWidth: 320 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#9a3412" }}>New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            fullWidth
            variant="outlined"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            sx={{
              mt: 1,
              "& .MuiOutlinedInput-root": { borderRadius: 3 },
              "& .MuiInputLabel-root": { color: "#9a3412", fontWeight: 600 },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#fed7aa" }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenCreateFolderDialog(false)}
            sx={{ color: "#9a3412", fontWeight: 700, textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateFolder}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg,#f97316,#ea580c)",
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 700,
              px: 3
            }}
          >
            Create Folder
          </Button>
        </DialogActions>
      </Dialog>

      {/* MOVE TO FOLDER DIALOG */}
      <Dialog
        open={openMoveDialog}
        onClose={() => setOpenMoveDialog(false)}
        PaperProps={{
          sx: { borderRadius: 4, p: 1, minWidth: 320 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#9a3412" }}>Move Project</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#431407", mb: 2 }}>
            Select destination folder:
          </DialogContentText>
          <Stack spacing={1}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={() => handleMoveProject(movingProjectId, null)}
              sx={{
                justifyContent: 'flex-start',
                borderRadius: "12px",
                borderColor: '#fed7aa',
                color: '#431407',
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5,
                '&:hover': { borderColor: '#f97316', bgcolor: '#fff7ed' }
              }}
            >
              Home / Root ({rootCount})
            </Button>
            {folders.map(f => (
              <Button
                key={f.id}
                fullWidth
                variant="outlined"
                startIcon={<FolderIcon />}
                onClick={() => handleMoveProject(movingProjectId, f.id)}
                sx={{
                  justifyContent: 'flex-start',
                  borderRadius: "12px",
                  borderColor: '#fed7aa',
                  color: '#431407',
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 1.5,
                  '&:hover': { borderColor: '#f97316', bgcolor: '#fff7ed' }
                }}
              >
                {f.folder_name} ({f.project_count || 0})
              </Button>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenMoveDialog(false)}
            sx={{ color: "#9a3412", fontWeight: 700, textTransform: "none" }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* DUPLICATE PROJECT DIALOG */}
      <Dialog
        open={openDuplicateDialog}
        onClose={() => setOpenDuplicateDialog(false)}
        PaperProps={{
          sx: { borderRadius: 4, p: 1, minWidth: 320 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#9a3412" }}>Duplicate Project</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#431407", mb: 2 }}>
            Where would you like to save the copy of <strong>{duplicatingProject?.project_name}</strong>?
          </DialogContentText>
          <Stack spacing={1}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={() => executeDuplicateProject(duplicatingProject.id, null)}
              sx={{
                justifyContent: 'flex-start',
                borderRadius: "12px",
                borderColor: '#fed7aa',
                color: '#431407',
                textTransform: 'none',
                fontWeight: 600,
                py: 1.5,
                '&:hover': { borderColor: '#f97316', bgcolor: '#fff7ed' }
              }}
            >
              Home / Root ({rootCount})
            </Button>
            {folders.map(f => (
              <Button
                key={f.id}
                fullWidth
                variant="outlined"
                startIcon={<FolderIcon />}
                onClick={() => executeDuplicateProject(duplicatingProject.id, f.id)}
                sx={{
                  justifyContent: 'flex-start',
                  borderRadius: "12px",
                  borderColor: '#fed7aa',
                  color: '#431407',
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 1.5,
                  '&:hover': { borderColor: '#f97316', bgcolor: '#fff7ed' }
                }}
              >
                {f.folder_name} ({f.project_count || 0})
              </Button>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setOpenDuplicateDialog(false);
              setDuplicatingProject(null);
            }}
            sx={{ color: "#9a3412", fontWeight: 700, textTransform: "none" }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* LOGOUT CONFIRMATION DIALOG */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: 4, p: 1, minWidth: 320 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1, color: "#9a3412" }}>
          <LogoutIcon />
          Sign Out?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#431407" }}>
            Are you sure you want to sign out from your account?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setLogoutDialogOpen(false)} sx={{ color: "#ffffff", fontWeight: 600 }}>
            Stay Logged In
          </Button>
          <Button
            onClick={confirmLogout}
            variant="contained"
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              background: "linear-gradient(135deg,#ef4444,#dc2626)",
              color: "#fff",
              "&:hover": { background: "linear-gradient(135deg,#dc2626,#b91c1c)" }
            }}
          >
            Sign Out
          </Button>
        </DialogActions>
      </Dialog>
      {/* MAP REQUEST DIALOG */}
      <Dialog
        open={openMapRequestDialog}
        onClose={() => !submittingMapReq && setOpenMapRequestDialog(false)}
        PaperProps={{ sx: { borderRadius: 4, p: 2, minWidth: { xs: 300, md: 500 } } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: "#431407", fontSize: "1.5rem", pb: 1, display: "flex", alignItems: "center", gap: 1 }}>
          {mapDialogStep === 'form' && (
            <IconButton onClick={() => setMapDialogStep('selection')} size="small" sx={{ color: "#9a3412", mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
          )}
          {mapDialogStep === 'selection' ? "Build Your Map" : "Submit Details"}
        </DialogTitle>
        <DialogContent>
          {mapDialogStep === 'selection' ? (
            <Stack spacing={2.5} sx={{ mt: 1.5 }}>
              {/* Option 1: Existing House Map */}
              <Card
                onClick={() => setMapDialogStep('form')}
                sx={{
                  border: "1px solid #fed7aa",
                  borderRadius: { xs: 4, sm: 5 },
                  cursor: "pointer",
                  overflow: "hidden",
                  background: "linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    borderColor: "#f97316",
                    transform: { xs: "none", sm: "translateY(-4px)" },
                    boxShadow: "0 12px 24px rgba(249, 115, 22, 0.1)"
                  },
                  position: "relative"
                }}
              >
                <CardContent sx={{
                  p: { xs: 2.5, sm: 3 },
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { xs: "center", sm: "center" },
                  gap: { xs: 2.5, sm: 3 },
                  textAlign: { xs: "center", sm: "left" }
                }}>
                  <Avatar sx={{
                    bgcolor: "rgba(249, 115, 22, 0.1)",
                    color: "#f97316",
                    width: { xs: 64, sm: 72 },
                    height: { xs: 64, sm: 72 },
                    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)"
                  }}>
                    <MapIcon sx={{ fontSize: { xs: 32, sm: 40 } }} />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 900,
                        color: "#c2410c",
                        mb: 1,
                        fontSize: { xs: "1.2rem", sm: "1.35rem" },
                        fontFamily: "'Playfair Display', serif" // Optional elegant feel if imported
                      }}
                    >
                      Existing House Map
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#7c2d12", opacity: 0.8, fontWeight: 500, lineHeight: 1.5 }}>
                      Professional Vastu map for your already built home. Connect with architectural experts.
                      <br />
                      <strong style={{ opacity: 1, color: "#c2410c", marginTop: "4px", display: "inline-block" }}>
                        Existing House Map/Layout is mandatory to check Vastu. To get one, Click here.
                      </strong>
                    </Typography>
                  </Box>
                  <Chip
                    label={`₹${mapPrice}`}
                    sx={{
                      fontWeight: 800,
                      bgcolor: "#f97316",
                      color: "#fff",
                      px: 2,
                      py: 2.5,
                      fontSize: "1rem",
                      borderRadius: "12px",
                      boxShadow: "0 4px 10px rgba(249, 115, 22, 0.2)",
                      alignSelf: { xs: "center", sm: "center" }
                    }}
                  />
                </CardContent>
              </Card>

              {/* Option 2: New House Planning */}
              <Card
                onClick={() => window.open(`https://wa.me/${(whatsappNumber || '').replace('+', '')}?text=Hi, I am interested in New House Planning.`, "_blank")}
                sx={{
                  border: "1px solid #bbf7d0",
                  borderRadius: { xs: 4, sm: 5 },
                  cursor: "pointer",
                  overflow: "hidden",
                  background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    borderColor: "#22c55e",
                    transform: { xs: "none", sm: "translateY(-4px)" },
                    boxShadow: "0 12px 24px rgba(34, 197, 94, 0.1)"
                  }
                }}
              >
                <CardContent sx={{
                  p: { xs: 2.5, sm: 3 },
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { xs: "center", sm: "center" },
                  gap: { xs: 2.5, sm: 3 },
                  textAlign: { xs: "center", sm: "left" }
                }}>
                  <Avatar sx={{
                    bgcolor: "rgba(34, 197, 94, 0.1)",
                    color: "#16a34a",
                    width: { xs: 64, sm: 72 },
                    height: { xs: 64, sm: 72 }
                  }}>
                    <AutoFixHighIcon sx={{ fontSize: { xs: 32, sm: 40 } }} />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 900,
                        color: "#166534",
                        mb: 1,
                        fontSize: { xs: "1.2rem", sm: "1.35rem" }
                      }}
                    >
                      New House Planning
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#14532d", opacity: 0.8, fontWeight: 500, lineHeight: 1.5 }}>
                      Designing a dream home from scratch? Chat with our specialist architects today.
                    </Typography>
                  </Box>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    bgcolor: '#25D366',
                    color: '#fff',
                    boxShadow: '0 4px 10px rgba(37, 211, 102, 0.3)'
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.32a8.188 8.188 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23M8.53 7.33c-.19-.43-.43-.43-.63-.43-.2 0-.42 0-.63.05-.21.05-.55.2-.84.52-.29.31-1.02 1-1.02 2.43s1.04 2.81 1.19 3c.15.2 2.05 3.13 4.96 4.39 2.91 1.26 2.91.84 3.43.79.53-.06 1.68-.69 1.92-1.35.24-.66.24-1.22.17-1.35-.07-.13-.26-.2-.55-.35-.28-.15-1.67-.82-1.92-.95-.25-.13-.43-.2-.62.1-.19.3-.73.95-.9.11-.16.17-.32.19-.61.04-.28-.15-1.19-.44-2.27-1.41-.84-.75-1.41-1.68-1.57-1.97-.16-.29-.02-.44.13-.58.13-.13.29-.34.43-.51.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.08-.15-.72-1.74-.99-2.38z" />
                    </svg>
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          ) : (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
              <Typography
                variant="body2"
                sx={{
                  color: "#9a3412",
                  mb: 3,
                  fontWeight: 600,
                  bgcolor: "#fff7ed",
                  p: 2.5,
                  borderRadius: 3,
                  border: "1px solid #fed7aa",
                  lineHeight: 1.6
                }}
              >
                Note: this Plan is not for New house planning. Our Architect will Connect with you and get the Measurements from you.
              </Typography>

              <Stack spacing={2.5}>
                <TextField
                  label="Name"
                  placeholder="Your Full Name"
                  fullWidth
                  variant="outlined"
                  value={mapReqName}
                  onChange={(e) => setMapReqName(e.target.value)}
                  disabled={submittingMapReq}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: 3.5, bgcolor: '#fff' },
                    "& .MuiInputLabel-root": { color: "#9a3412", fontWeight: 700 },
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#fed7aa" }
                  }}
                />

                <TextField
                  label="WhatsApp Number"
                  placeholder="WhatsApp Number"
                  fullWidth
                  variant="outlined"
                  value={mapReqWhatsApp}
                  onChange={(e) => setMapReqWhatsApp(e.target.value)}
                  disabled={submittingMapReq}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: 3.5, bgcolor: '#fff' },
                    "& .MuiInputLabel-root": { color: "#9a3412", fontWeight: 700 },
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#fed7aa" }
                  }}
                />

                <TextField
                  label="Phone Number"
                  placeholder="Phone Number"
                  fullWidth
                  variant="outlined"
                  value={mapReqContact}
                  onChange={(e) => setMapReqContact(e.target.value)}
                  disabled={submittingMapReq}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: 3.5, bgcolor: '#fff' },
                    "& .MuiInputLabel-root": { color: "#9a3412", fontWeight: 700 },
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#fed7aa" }
                  }}
                />

                <Typography variant="caption" sx={{ color: "#9a3412", opacity: 0.7, fontWeight: 600 }}>
                  ℹ️ Our team will contact you within 24-48 hours.
                </Typography>
              </Stack>
            </motion.div>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 4, pt: 1, justifyContent: "space-between" }}>
          <Button
            onClick={() => setOpenMapRequestDialog(false)}
            disabled={submittingMapReq}
            sx={{
              color: "#9a3412",
              fontWeight: 800,
              textTransform: "none",
              fontSize: "1rem",
              px: 3
            }}
          >
            Cancel
          </Button>
          {mapDialogStep === 'form' && (
            <Button
              onClick={handleMapRequest}
              variant="contained"
              disabled={submittingMapReq}
              sx={{
                background: "linear-gradient(135deg,#f97316,#ea580c)",
                color: "#fff",
                fontWeight: 800,
                px: 5,
                py: 1.5,
                borderRadius: "14px",
                textTransform: "none",
                boxShadow: "0 8px 24px rgba(234, 88, 12, 0.3)",
                fontSize: "1rem",
                "&.Mui-disabled": { background: "#ccc" },
                "&:hover": {
                  background: "linear-gradient(135deg,#ea580c,#c2410c)",
                  boxShadow: "0 12px 30px rgba(234, 88, 12, 0.4)"
                }
              }}
            >
              {submittingMapReq ? <CircularProgress size={24} color="inherit" /> : "Submit & Pay"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* MAP SUCCESS POPUP */}
      <Dialog
        open={openMapSuccessDialog}
        onClose={() => setOpenMapSuccessDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 6,
            p: 4,
            textAlign: "center",
            maxWidth: 400,
            background: "linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.1)"
          }
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 200 }}
        >
          <Box sx={{
            width: 80, height: 80, borderRadius: "50%",
            bgcolor: "#f0fdf4", color: "#16a34a",
            display: "flex", alignItems: "center", justifyContent: "center",
            mx: "auto", mb: 3, boxShadow: "0 10px 20px rgba(22, 163, 74, 0.15)"
          }}>
            <CheckCircleIcon sx={{ fontSize: 50 }} />
          </Box>
        </motion.div>

        <Typography variant="h5" sx={{ fontWeight: 900, color: "#431407", mb: 2 }}>
          Request Received!
        </Typography>
        <Typography variant="body1" sx={{ color: "#7c2d12", opacity: 0.8, mb: 4, fontWeight: 500 }}>
          Your map request has been successfully submitted. Our team will review your requirements and get back to you soon.
        </Typography>

        <Button
          fullWidth
          variant="contained"
          onClick={() => setOpenMapSuccessDialog(false)}
          sx={{
            py: 1.5, borderRadius: "14px",
            background: "linear-gradient(135deg, #16a34a, #15803d)",
            color: "#fff",
            fontWeight: 800, textTransform: "none",
            boxShadow: "0 8px 16px rgba(22, 163, 74, 0.2)",
            "&:hover": { background: "linear-gradient(135deg, #15803d, #166534)" }
          }}
        >
          Great, thanks!
        </Button>
      </Dialog>

      {/* MY MAPS / DOWNLOADS DIALOG */}
      <Dialog
        open={openMyMapsDialog}
        onClose={() => setOpenMyMapsDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 6, p: 2 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: "#431407" }}>My Maps</Typography>
            <Typography variant="body2" sx={{ color: "#9a3412", opacity: 0.7 }}>Download your uploaded or team-created maps</Typography>
          </Box>
          <IconButton onClick={() => setOpenMyMapsDialog(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ minHeight: 400 }}>
          {loadingMaps ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
              <CircularProgress color="warning" />
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              {teamMaps.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <MapIcon sx={{ fontSize: 60, color: '#fed7aa', mb: 2 }} />
                  <Typography sx={{ fontWeight: 600, color: '#9a3412' }}>No maps found yet.</Typography>
                  <Typography variant="body2" sx={{ color: '#c2410c' }}>Our team is working on your request!</Typography>
                </Box>
              ) : (
                <Stack spacing={3}>
                  {/* TEAM CREATED MAPS */}
                  <Box>
                    <Typography sx={{ fontWeight: 800, color: '#9a3412', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AutoFixHighIcon sx={{ fontSize: 20 }} /> Created by MyVastuTeam
                    </Typography>
                    <Stack spacing={2}>
                      {teamMaps.map(req => (
                        <Card key={req.id} sx={{ borderRadius: 4, border: '1px solid #fed7aa', boxShadow: 'none' }}>
                          <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: '16px !important' }}>
                            <Box>
                              <Typography sx={{ fontWeight: 700 }}>{req.project_name || "Professional Map"}</Typography>
                              <Typography variant="caption" color="text.secondary">Requirement: {req.requirements.substring(0, 50)}...</Typography>
                            </Box>
                            <Button
                              startIcon={<DownloadIcon />}
                              variant="contained"
                              size="small"
                              onClick={() => window.open(`/api/uploads/maps/${req.created_map}`, '_blank')}
                              sx={{ borderRadius: "10px", bgcolor: '#16a34a', "&:hover": { bgcolor: '#15803d' } }}
                            >
                              Download
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* FILTER DIALOG */}
      <Dialog
        open={openFilterDialog}
        onClose={() => setOpenFilterDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 2,
            background: "linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)"
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: "#431407", fontSize: "1.5rem", pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListIcon sx={{ color: '#f97316' }} />
            Filter Projects
          </Box>
          <IconButton onClick={() => setOpenFilterDialog(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Search Field */}
            <TextField
              size="medium"
              placeholder="Search workspace..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#f97316" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                bgcolor: 'white',
                borderRadius: "16px",
                '& .MuiOutlinedInput-root': {
                  borderRadius: "16px",
                  '& fieldset': { border: '1px solid #fed7aa' },
                  '&:hover fieldset': { borderColor: '#f97316' },
                }
              }}
            />

            {/* Status Filter */}
            <FormControl size="medium" fullWidth>
              <InputLabel sx={{ color: "#9a3412", fontWeight: 600 }}>Payment Status</InputLabel>
              <Select
                value={paymentStatus}
                label="Payment Status"
                onChange={(e) => { setPaymentStatus(e.target.value); setPage(0); }}
                sx={{
                  borderRadius: "16px",
                  bgcolor: "white",
                  '& fieldset': { border: '1px solid #fed7aa' }
                }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="unpaid">Unpaid</MenuItem>
              </Select>
            </FormControl>

            {/* Type Filter */}
            <FormControl size="medium" fullWidth>
              <InputLabel sx={{ color: "#9a3412", fontWeight: 600 }}>Construction Type</InputLabel>
              <Select
                value={typeFilter}
                label="Construction Type"
                onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
                sx={{
                  borderRadius: "16px",
                  bgcolor: "white",
                  '& fieldset': { border: '1px solid #fed7aa' }
                }}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="Existing">Existing Home</MenuItem>
                <MenuItem value="New">New Home</MenuItem>
              </Select>
            </FormControl>

            {/* Follower Filter (Only for Experts) */}
            {user?.role === 'expert' && followers.length > 0 && (
              <FormControl size="medium" fullWidth>
                <InputLabel sx={{ color: "#9a3412", fontWeight: 600 }}>Filter By User</InputLabel>
                <Select
                  value={filterFollowerId}
                  label="Filter By User"
                  onChange={(e) => { setFilterFollowerId(e.target.value); setPage(0); }}
                  sx={{
                    borderRadius: "16px",
                    bgcolor: "white",
                    '& fieldset': { border: '1px solid #fed7aa' }
                  }}
                >
                  <MenuItem value="all">All Users</MenuItem>
                  {followers.map((f) => (
                    <MenuItem key={f.user_id} value={f.user_id}>
                      {f.name} ({f.phone || f.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Date Filters */}
            <TextField
              type="date"
              size="medium"
              label="Start Date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{
                bgcolor: 'white',
                borderRadius: "16px",
                '& .MuiOutlinedInput-root': { borderRadius: "16px", '& fieldset': { border: '1px solid #fed7aa' } },
                '& .MuiInputLabel-root': { color: "#9a3412", fontWeight: 600 }
              }}
            />
            <TextField
              type="date"
              size="medium"
              label="End Date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{
                bgcolor: 'white',
                borderRadius: "16px",
                '& .MuiOutlinedInput-root': { borderRadius: "16px", '& fieldset': { border: '1px solid #fed7aa' } },
                '& .MuiInputLabel-root': { color: "#9a3412", fontWeight: 600 }
              }}
            />
          </Stack>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Folder</InputLabel>
            <Select
              value={currentFolderId || 'root'}
              onChange={(e) => setCurrentFolderId(e.target.value === 'root' ? null : e.target.value)}
              label="Folder"
              sx={{ borderRadius: 3 }}
            >
              <MenuItem value="root">Root / Home ({rootCount})</MenuItem>
              {folders.map(f => (
                <MenuItem key={f.id} value={f.id}>{f.folder_name} ({f.project_count || 0})</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button
            onClick={() => {
              setSearchQuery("");
              setPaymentStatus("all");
              setTypeFilter("all");
              setFilterFollowerId("all");
              setStartDate("");
              setEndDate("");
              setPage(0);
            }}
            sx={{
              color: "#ffffff",
              fontWeight: 700,
              textTransform: "none",
              fontSize: "0.95rem"
            }}
          >
            Clear All
          </Button>
          <Button
            onClick={() => setOpenFilterDialog(false)}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg,#f97316,#ea580c)",
              color: "#fff",
              fontWeight: 800,
              px: 4,
              py: 1.2,
              borderRadius: "14px",
              textTransform: "none",
              boxShadow: "0 8px 20px rgba(234, 88, 12, 0.3)",
              fontSize: "0.95rem",
              "&:hover": {
                background: "linear-gradient(135deg,#ea580c,#c2410c)",
                boxShadow: "0 10px 25px rgba(234, 88, 12, 0.4)"
              }
            }}
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quota Details Popup */}
      <Dialog
        open={openQuotaDialog}
        onClose={() => setOpenQuotaDialog(false)}
        maxWidth="xs" // Reduced width for a cleaner look
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "32px",
            background: "#ffffff",
            boxShadow: "0 40px 80px rgba(0,0,0,0.12)",
            overflow: "visible", // Allowed overflow for creative elements
            m: 2
          }
        }}
        BackdropProps={{
          sx: { backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.05)" }
        }}
      >
        <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: "32px", bgcolor: '#fff' }}>

          {/* Decorative Header Background */}
          <Box sx={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: "120px",
            background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
            zIndex: 0
          }} />

          <DialogTitle sx={{
            p: 3,
            pb: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: 'relative',
            zIndex: 1
          }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#431407", letterSpacing: -0.5 }}>
                My Wallet
              </Typography>
              <Typography variant="body2" sx={{ color: "#9a3412", opacity: 0.8, fontWeight: 500 }}>
                Manage your credits & usage
              </Typography>
            </Box>
            <IconButton
              onClick={() => setOpenQuotaDialog(false)}
              sx={{
                bgcolor: "white",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                "&:hover": { bgcolor: "#fff", transform: "rotate(90deg)" },
                transition: "all 0.3s"
              }}
            >
              <CloseIcon fontSize="small" sx={{ color: "#9a3412" }} />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 3, pt: 2, position: 'relative', zIndex: 1 }}>

            {/* Subscription Card (If Active) */}
            {(user?.plan || user?.plan_id) && user?.plan_credits > 0 && (
              <Box sx={{
                mb: 3,
                p: 2.5,
                borderRadius: "24px",
                bgcolor: "#ffffff",
                border: "1px solid #fed7aa",
                boxShadow: "0 10px 30px rgba(249, 115, 22, 0.08)",
                position: "relative",
                overflow: "hidden"
              }}>
                {/* Progress Ring or Bar could go here, simplified for elegance */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: "#fff7ed", color: "#ea580c" }}>
                      <AutorenewIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1e293b", lineHeight: 1.2 }}>
                        Subscription
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500 }}>
                        {user?.plan || "Monthly Plan"}
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip
                    label={`${(user?.plan_credits || 0) - (user?.project_count_current_cycle || 0)} Left`}
                    size="small"
                    sx={{ bg: "#ecfdf5", color: "#059669", fontWeight: 700, borderRadius: "8px", height: 24 }}
                  />
                </Stack>

                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#94a3b8" }}>Usage</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#475569" }}>{Math.round(((user?.project_count_current_cycle || 0) / (user?.plan_credits || 1)) * 100)}%</Typography>
                  </Box>
                  <Box sx={{ width: "100%", height: "6px", bgcolor: "#f1f5f9", borderRadius: "10px", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(((user?.project_count_current_cycle || 0) / (user?.plan_credits || 1)) * 100, 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      style={{ height: "100%", background: "linear-gradient(90deg, #f97316, #ea580c)", borderRadius: "10px" }}
                    />
                  </Box>
                </Box>
              </Box>
            )}

            {/* Free Plan Card — shown when user has a plan but 0 credits */}
            {(user?.plan || user?.plan_id) && !user?.plan_credits && (
              <Box sx={{
                mb: 3,
                p: 2.5,
                borderRadius: "24px",
                bgcolor: "#ffffff",
                border: "1px solid #fed7aa",
                boxShadow: "0 10px 30px rgba(249, 115, 22, 0.08)",
              }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: "#fff7ed", color: "#ea580c" }}>
                    <DiamondIcon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1e293b", lineHeight: 1.2 }}>
                      {user?.plan || "Free Plan"}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500 }}>
                      Active
                    </Typography>
                  </Box>
                </Stack>
                <Typography variant="caption" sx={{ color: "#9a3412", fontWeight: 500 }}>
                  Your current plan does not include project credits. Upgrade to unlock full Vastu Tool access.
                </Typography>
              </Box>
            )}

            {/* CTA */}
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setActiveTab("Buy Plans");
                setOpenQuotaDialog(false);
              }}
              startIcon={<DiamondIcon />}
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: "16px",
                borderStyle: "dashed",
                borderWidth: "2px",
                fontWeight: 700,
                textTransform: "none",
                fontSize: "0.95rem",
                color: "#9a3412",
                borderColor: "#fed7aa",
                "&:hover": {
                  borderColor: "#f97316",
                  bgcolor: "#fff7ed"
                }
              }}
            >
              Upgrade
            </Button>

          </DialogContent>
        </Box>
      </Dialog>
      <UserDetailsModal
        open={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedProjectId(null);
        }}
        email={user.email}
        projectId={selectedProjectId}
        constructionType={selectedProjectConstructionType}
        isMandatory={isModalMandatory}
      />
      <WelcomeReviewModal
        open={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        projectIssues={[]}
      />
    </Box>
  );
}

export default Dashboard;
