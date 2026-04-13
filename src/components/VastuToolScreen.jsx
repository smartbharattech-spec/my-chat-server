import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box,
  CircularProgress,
  IconButton,
  Button,
  Drawer,
  useMediaQuery,
  useTheme,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import ImageCanvas from "./ImageCanvas";
import SidePanel from "./SidePanel";
import TopBar from "./TopBar";
import TrackerDialog from "./TrackerDialog";
import GlobalDialogs from "./GlobalDialogs";
import UserDetailsModal from "./UserDetailsModal";
import { saveProjectProgress } from "../services/tool/persistentStateService";

const API = "/api/user_profile.php";
const IMAGE_KEY = "vastu_uploaded_image";
const DRAWER_WIDTH = 420; // Increased width to handle overflows better

/**
 * 🛠️ ROBUST TOGGLE BUTTON
 * Defined outside to be stable and avoid ReferenceErrors.
 */
function SidePanelToggleButton({ open, onClick, sx = {} }) {
  if (open) return null;
  return (
    <Button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      variant="contained"
      sx={{
        position: "absolute",
        top: "50%",
        left: 0,
        transform: "translateY(-50%)",
        bgcolor: "#f97316",
        color: "#fff",
        borderRadius: "0 50px 50px 0",
        width: 60,
        height: 80,
        minWidth: "auto",
        boxShadow: "10px 0 30px rgba(249, 115, 22, 0.4)",
        border: "2px solid rgba(255,255,255,0.3)",
        borderLeft: "none",
        "&:hover": {
          bgcolor: "#ea580c",
          transform: "translateY(-50%) scale(1.1)",
          boxShadow: "15px 0 40px rgba(249, 115, 22, 0.6)",
        },
        transition: "0.3s all cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        ...sx
      }}
    >
      <ChevronRightIcon />
    </Button>
  );
}

export default function VastuToolScreen({ onBack }) {
  const theme = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [image, setImage] = useState(null);
  const [projectIssues, setProjectIssues] = useState(() => {
    const savedIssues = localStorage.getItem("active_project_issue");
    return savedIssues ? savedIssues.split(',').map(i => i.trim()).filter(Boolean) : [];
  });
  // 📱 RESPONSIVE BUT ZOOM-STABLE MOBILE DETECTION
  // We use screen.width for the threshold because CSS media queries (viewport width)
  // change during pinch-to-zoom on mobile, which causes layout "flickering".
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.screen.width < 900 : false));
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      // Re-evaluate on resize (e.g. orientation change), but still use screen.width
      // as the primary source of truth for "is it a phone/tablet".
      setIsMobile(window.screen.width < 900);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mobile Defaults to CLOSED, Desktop to OPEN
  const [openDrawer, setOpenDrawer] = useState(!isMobile);

  const [showTrackerDialog, setShowTrackerDialog] = useState(false); // Controls the new Tracker dialog
  const [trackerEnabled, setTrackerEnabled] = useState(true);
  const [showDetailsForm, setShowDetailsForm] = useState(false);
  const [isDetailsFilled, setIsDetailsFilled] = useState(false);
  const [constructionType, setConstructionType] = useState(() => localStorage.getItem("active_project_construction_type") || "Existing");
  const [ownerEmail, setOwnerEmail] = useState(null);

  const userEmail = useMemo(() => localStorage.getItem("email"), []);
  const [activeProjectId, setActiveProjectId] = useState(() => localStorage.getItem("active_project_id"));
  const [activeProjectName, setActiveProjectName] = useState(() => localStorage.getItem("active_project_name"));
  const [isSyncing, setIsSyncing] = useState(false); // Background sync flag

  // 🍞 TOASTER STATE
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
  const showToast = (message, severity = "success") => setToast({ open: true, message, severity });
  const handleCloseToast = () => setToast({ ...toast, open: false });
  
  // --- BATCH EXPORT STATE ---
  const [batchState, setBatchState] = useState(null); // { folderName, projects: [], index: 0, isRunning: false }
  const loadedProjectIdRef = useRef(null);

  useEffect(() => {
    if (!userEmail || !activeProjectId) return;
    
    // 🛑 PREVENT REDUNDANT FETCH ON STABLE RE-RENDERS
    if (activeProjectId === loadedProjectIdRef.current) {
        console.log("[VastuToolScreen] Stable re-render, skipping fetch.");
        return;
    }
    loadedProjectIdRef.current = activeProjectId;

    // 🧹 RESET STATE FOR NEW PROJECT MOUNT
    console.log(`[MOUNT] Launching Project ID: ${activeProjectId} for Email: ${userEmail}`);
    window.vastuProjectId = activeProjectId;
    window.vastuImageState = null;
    window.vastuShaktiState = null;
    window.vastuBoundaryState = null;
    window.vastuCenterState = null;
    window.vastuDevtaState = null;
    window.vastuOverlayState = true;
    window.vastuZoomState = 1;
    window.vastuRotateState = 0;
    window.vastuRestoreState = null;
    setImage(null);
    setLoading(true);
    // 🚀 SHOW WELCOME/REVIEW MODAL ON LOAD
    const hasSeenWelcome = sessionStorage.getItem(`welcome_seen_${activeProjectId}`);
    if (activeProjectId && !hasSeenWelcome) {
      setTimeout(() => {
        // Fetch setting might take a moment, but by 800ms it should be done or fallback to true
        // We use a functional update or a check against the ref/state if needed, 
        // but simple state check works if we assume fetch is fast
        setTrackerEnabled(prev => {
          if (prev) setShowTrackerDialog(true);
          return prev;
        });
      }, 1200); // Increased delay slightly to ensure setting fetch finishes
    }

    // Fetch User Profile
    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "fetch", email: userEmail }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status) {
          setUser({ firstname: res.data.firstname, email: res.data.email });
        } else {
          setUser({ firstname: "User", email: userEmail });
        }
      })
      .catch(() => setUser({ firstname: "User", email: userEmail }));

    // Fetch Global Settings
    fetch("/api/get_setting.php?key=is_tracker_enabled")
      .then(res => res.json())
      .then(res => {
        if (res.status === "success") {
          setTrackerEnabled(res.value === 'true');
        }
      })
      .catch(() => setTrackerEnabled(true));

    // Fetch Project Data using ID (guarantees no name collisions)
    console.log(`[RESTORE] Fetching data...`);
    fetch(`/api/projects.php?action=check&id=${activeProjectId}&email=${userEmail}&t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        console.log("[RESTORE] Data from server:", data);
        if (data.status === "success" && data.purchased) {
          if (data.email) setOwnerEmail(data.email);
          if (data.project_data) {
            try {
              const projectState = JSON.parse(data.project_data);
              window.vastuRestoreState = projectState;

              // 🖼️ ROBUST IMAGE RESTORATION (File System + Backward Compatibility)
              let finalImage = null;
              if (data.map_image) {
                finalImage = `/api/uploads/maps/${data.map_image}`;
                console.log(`[RESTORE] Source: File System (${finalImage})`);
              } else if (projectState.image) {
                finalImage = projectState.image;
                console.log("[RESTORE] Source: Legacy Base64");
              }

              console.log("[RESTORE] finalImage determined as:", finalImage);
              if (finalImage) {
                setImage(finalImage);
                window.vastuImageState = finalImage;
              }

              if (data.project_issue) {
                const issues = data.project_issue.split(',').map(i => i.trim()).filter(Boolean);
                setProjectIssues(issues);
              }

              if (data.construction_type) {
                setConstructionType(data.construction_type);
                localStorage.setItem("active_project_construction_type", data.construction_type);
                // 🚀 Immediate re-check with correct type
                setTimeout(checkUserDetailsStatus, 100);
              }

              if (data.folder_name) {
                localStorage.setItem("active_project_folder_name", data.folder_name);
              } else {
                localStorage.setItem("active_project_folder_name", "Home");
              }

              // Trigger restoration in all services
              window.dispatchEvent(new CustomEvent('vastu-restore-state', { detail: projectState }));
            } catch (e) {
              console.error("[RESTORE] Parse error:", e);
            }
          } else {
            console.log("[RESTORE] New project or empty data for ID:", activeProjectId);
            // If no project data, ensure services are reset to default
            window.dispatchEvent(new CustomEvent('vastu-restore-state', { detail: {} }));
          }
        } else {
          console.warn("[RESTORE] Project not found or not purchased for this email.");
          // If project not found/purchased, ensure services are reset to default
          window.dispatchEvent(new CustomEvent('vastu-restore-state', { detail: {} }));
        }
      })
      .catch(err => console.error("[RESTORE] Request failed:", err))
      .finally(() => setLoading(false));

    // CHECK IF FORM IS FILLED
    checkUserDetailsStatus();
  }, [userEmail, activeProjectId]);

  const checkUserDetailsStatus = async () => {
    if (!activeProjectId) return;
    try {
      const response = await fetch(`/api/get_user_details.php?project_id=${activeProjectId}`);
      const resData = await response.json();
      if (resData.status === "success" && resData.data.length > 0) {
        const details = resData.data[0];
        const isExisting = constructionType === 'Existing';
        
        let isValid = true;
        
        // 1. GLOBAL MANDATORY
        if (!details.location_coords?.trim()) isValid = false;
        if (!details.north_tilt?.trim()) isValid = false;
        if (!details.north_tilt_tool?.trim()) isValid = false;

        // 2. TYPE SPECIFIC MANDATORY
        if (isExisting) {
          if (!details.facing?.trim()) isValid = false;
          if (!details.time_living?.trim()) isValid = false;
          if (!details.house_type?.trim()) isValid = false;
        } else {
          // New Project
          if (!details.profession?.trim()) isValid = false;
        }

        setIsDetailsFilled(isValid);
      } else {
        setIsDetailsFilled(false);
      }
    } catch (error) {
      console.error("Failed to check user details", error);
    }
  };

  // 🔄 BACKGROUND SYNC MANAGER
  useEffect(() => {
    if (!activeProjectId || !userEmail || !image || isSyncing || uploading) return;

    // Check if image is base64 (local only)
    const isBase64 = String(image).startsWith('data:image');
    
    if (isBase64) {
      const syncTimer = setTimeout(async () => {
        console.log("🔄 [SYNC] Attempting to push local map to server...");
        setIsSyncing(true);
        try {
          // Convert base64 to blob
          const blobRes = await fetch(image);
          const blob = await blobRes.blob();
          
          const formData = new FormData();
          formData.append('map', blob, `map_${activeProjectId}_sync.webp`);
          formData.append('project_id', activeProjectId);
          formData.append('email', userEmail);

          const response = await fetch("/api/upload_map_image.php", {
            method: 'POST',
            body: formData
          });
          
          const res = await response.json();
          if (res.status === 'success') {
            console.log("✅ [SYNC] Background upload successful!");
            const serverUrl = "/" + res.url;
            setImage(serverUrl);
            window.vastuImageState = serverUrl;
            await saveProjectProgress(activeProjectId, userEmail);
          }
        } catch (err) {
          console.warn("⚠️ [SYNC] Background sync failed, will retry:", err);
        } finally {
          setIsSyncing(false);
        }
      }, 15000); // Try every 15 seconds

      return () => clearTimeout(syncTimer);
    }
  }, [image, activeProjectId, userEmail, isSyncing, uploading]);

  const avatarLetter = user?.firstname?.charAt(0)?.toUpperCase() || "U";

  // 🖼️ ROBUST IMAGE COMPRESSION
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Max dimensions (4K resolution for super-sharp floor plans)
          const MAX_SIDE = 4000;
          if (width > MAX_SIDE || height > MAX_SIDE) {
            if (width > height) {
              height *= MAX_SIDE / width;
              width = MAX_SIDE;
            } else {
              width *= MAX_SIDE / height;
              height = MAX_SIDE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // WebP at 0.9 quality for maximum detail preservation
          const compressedBase64 = canvas.toDataURL('image/webp', 0.9);
          resolve(compressedBase64);
        };
      };
    });
  };

  const handleImageUpload = async (fileOrBlob) => {
    if (!fileOrBlob || !activeProjectId || !userEmail) {
      console.warn("[UPLOAD] Missing required context (file, project or email)");
      return null;
    }

    try {
      setUploading(true);
      
      // 🧬 STEP 1: Perform Multipart Upload (MOST ROBUST)
      const formData = new FormData();
      formData.append('map', fileOrBlob, `map_${activeProjectId}_raw.webp`);
      formData.append('project_id', activeProjectId);
      formData.append('email', userEmail);

      console.log("[UPLOAD] Sending to server...");
      const response = await fetch("/api/upload_map_image.php", {
        method: 'POST',
        body: formData
      });
      
      const res = await response.json();

      if (res.status === 'success') {
        const serverUrl = "/" + res.url;
        setImage(serverUrl);
        window.vastuImageState = serverUrl;

        // 🧬 STEP 2: Final Sync to metadata
        await saveProjectProgress(activeProjectId, userEmail);
        
        showToast("Map uploaded successfully to server!", "success");
        return serverUrl;
      } else {
        throw new Error(res.message || "Server rejected the upload");
      }
    } catch (err) {
      console.error("❌ [UPLOAD] Failed:", err);
      showToast("Upload Failed: " + err.message, "error");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleCloseTool = async () => {
    if (activeProjectId && userEmail) {
      console.log("Final sync and save before closing...");

      // 🛡️ REINFORCEMENT: Sync global image state one last time from React state
      if (image && !window.vastuImageState) {
        window.vastuImageState = image;
      }

      await saveProjectProgress(activeProjectId, userEmail);
    }
    onBack();
  };

  const handleSwitchProject = async (newId, newName, newType, newIssues, newFolderName) => {
    if (newId === activeProjectId) return;

    // 1. Save current project
    if (activeProjectId && userEmail) {
      await saveProjectProgress(activeProjectId, userEmail);
    }

    // 2. Update localStorage
    localStorage.setItem("active_project_id", newId);
    localStorage.setItem("active_project_name", newName);
    localStorage.setItem("active_project_construction_type", newType || "Existing");
    localStorage.setItem("active_project_issue", newIssues || "");
    localStorage.setItem("active_project_folder_name", newFolderName || "Home");

    // 3. Update State (Triggers useEffect)
    setActiveProjectId(newId);
    setActiveProjectName(newName);
    setConstructionType(newType || "Existing");
    setProjectIssues(newIssues ? newIssues.split(',').map(i => i.trim()).filter(Boolean) : []);
    
    // 4. Force global states reset
    if (typeof window !== 'undefined' && window.vastuResetAllStates) {
        window.vastuResetAllStates();
    }
  };

  const handleBulkExport = (folderName, projects) => {
    if (!projects || projects.length === 0) return;
    localStorage.setItem("sidePanelStep", 2); // Ensure tool module logic is active
    
    setBatchState({
      folderName,
      projects,
      index: 0,
      isRunning: true
    });
  };

  // --- BATCH PROCESSING EFFECT ---
  useEffect(() => {
    if (!batchState || !batchState.isRunning) return;

    const { projects, index } = batchState;
    if (index >= projects.length) {
      setBatchState(null);
      return;
    }

    const currentProject = projects[index];
    
    // 🔍 STEP 1: Check if we need to switch project
    if (activeProjectId !== currentProject.id && !loading) {
      console.log(`[BATCH] Switching to project: ${currentProject.project_name}`);
      handleSwitchProject(
          currentProject.id, 
          currentProject.project_name, 
          currentProject.construction_type, 
          currentProject.project_issue, 
          currentProject.folder_name
      );
      return;
    }

    // 🔍 STEP 2: Wait for loading to finish + stabilization
    if (!loading && activeProjectId === currentProject.id) {
        console.log(`[BATCH] Project Ready, triggering report for: ${currentProject.project_name}`);
        // Small additional delay to ensure services responded to vastu-restore-state
        const timer = setTimeout(() => {
            // Trigger the report via event
            window.dispatchEvent(new CustomEvent('vastu-trigger-full-report', { 
                detail: { 
                    isBatch: true,
                    onComplete: () => {
                        console.log(`[BATCH] Report completed for: ${currentProject.project_name}`);
                        setBatchState(prev => ({ ...prev, index: prev.index + 1 }));
                    }
                } 
            }));
        }, 3500); // 3.5s for safety
        return () => clearTimeout(timer);
    }
  }, [batchState, loading, activeProjectId]);


  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: "100vh", 
      display: "flex", 
      bgcolor: "#fff0e5", 
      position: "relative",
      userSelect: "none",
      WebkitUserSelect: "none",
      MozUserSelect: "none",
      msUserSelect: "none"
    }}>
      {/* FLOATING OPEN BUTTON (Memoized for Stability) */}
      <SidePanelToggleButton 
        open={openDrawer} 
        onClick={() => setOpenDrawer(true)} 
        sx={{ zIndex: isMobile ? 3000 : 1300 }}
      />

      {/* 📱💻 UNIFIED RESPONSIVE DRAWER */}
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          zIndex: isMobile ? 3100 : 1200,
          '& .MuiPaper-root': {
            width: isMobile ? "min(350px, 85vw)" : DRAWER_WIDTH,
            height: "100%", // [FIX] Force full height
            display: "flex",
            flexDirection: "column",
            bgcolor: "#fff", // [FIX] Solid pure white for mobile reliability
            borderRight: "1px solid #ffedd5",
            boxShadow: isMobile ? "10px 0 30px rgba(0,0,0,0.15)" : "none",
            overflow: "hidden",
            visibility: "visible !important", // [FIX] Force visibility
            borderRadius: 0, // [FIX] No rounded corners on drawer for mobile
          },
          // [FIX] Ensure backdrop is beneath the drawer but above everything else
          '& .MuiBackdrop-root': {
            bgcolor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "none", // Avoid filters during transition for performance
          }
        }}
      >
        <SidePanel
          user={user}
          avatarLetter={avatarLetter}
          handleImageUpload={handleImageUpload}
          onBack={handleCloseTool}
          setOpenDrawer={setOpenDrawer}
          image={image}
          onShowReviews={() => setShowTrackerDialog(true)}
          isDetailsFilled={isDetailsFilled}
          onShowDetails={() => setShowDetailsForm(true)}
          trackerEnabled={trackerEnabled}
          activeProjectName={activeProjectName}
          activeProjectId={activeProjectId}
          onSwitchProject={handleSwitchProject}
          onBulkExport={handleBulkExport}
        />
      </Drawer>

      {/* MAIN CONTENT AREA (Simplified CSS Transition) */}
      <Box
        sx={{
          flexGrow: 1,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
          width: "100%",
          touchAction: "none", // [FIX] Prevent browser-level gestures (pull-to-refresh, etc) from interfering with canvas
          marginLeft: (!isMobile && openDrawer) ? `${DRAWER_WIDTH}px` : 0,
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Box sx={{ flexShrink: 0, zIndex: 1400 }}>
      {/* TOPBAR */}
      <TopBar onShowDetails={() => setShowDetailsForm(true)} image={image}/>
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            width: "100%",
            overflow: "hidden",
            position: "relative",
            zIndex: 0 // Explicitly lower than TopBar (1400)
          }}
        >
          <ImageCanvas image={image} />
        </Box>
      </Box>

      {/* GLOBAL DIALOGS (STAY MOUNTED ON MOBILE) */}
      <GlobalDialogs />

      {/* NEW TRACKER DIALOG */}
      <TrackerDialog
        open={showTrackerDialog}
        onClose={() => {
          setShowTrackerDialog(false);
          sessionStorage.setItem(`welcome_seen_${activeProjectId}`, "true");
        }}
        activeProjectId={activeProjectId}
        activeProjectName={localStorage.getItem("active_project_name")}
        ownerEmail={ownerEmail}
      />

      {/* PROPERTY DETAILS MODAL (MANUAL TRIGGER FROM TOPBAR) */}
      <UserDetailsModal
        open={showDetailsForm}
        onClose={() => setShowDetailsForm(false)}
        email={userEmail}
        projectId={activeProjectId}
        constructionType={constructionType}
        isMandatory={false}
        onSaveSuccess={() => {
          setIsDetailsFilled(true);
          checkUserDetailsStatus();
        }}
      />

      {/* 📦 UPLOADING OVERLAY */}
      <AnimatePresence>
        {uploading && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    zIndex: 99999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(4px)'
                }}
            >
                <CircularProgress size={60} sx={{ color: '#f97316', mb: 2 }} />
                <Typography variant="h6" fontWeight={800} color="#431407">
                    Uploading Map to Server...
                </Typography>
                <Typography variant="body2" color="#7c2d12" sx={{ opacity: 0.7 }}>
                    Please wait, saving your architecture plan.
                </Typography>
            </motion.div>
        )}
      </AnimatePresence>

      {/* 📦 BATCH PROCESSING OVERLAY */}
      <AnimatePresence>
        {batchState && batchState.isRunning && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    zIndex: 99999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    textAlign: 'center',
                    backdropFilter: 'blur(10px)'
                }}
            >
                <CircularProgress size={80} thickness={4} sx={{ color: '#f97316', mb: 4 }} />
                <Typography variant="h3" fontWeight={900} sx={{ mb: 1, color: '#f97316', letterSpacing: 2 }}>
                    BULK EXPORT ACTIVE
                </Typography>
                <Typography variant="h5" fontWeight={700} sx={{ mb: 4, opacity: 0.9 }}>
                    Processing Folder: <span style={{ color: '#fb923c' }}>{batchState.folderName}</span>
                </Typography>
                
                <Box sx={{ width: 'min(500px, 80%)', mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography fontWeight={800} fontSize={14}>
                            Project {batchState.index + 1} of {batchState.projects.length}
                        </Typography>
                        <Typography fontWeight={800} fontSize={14} color="#f97316">
                            {Math.round(((batchState.index) / batchState.projects.length) * 100)}%
                        </Typography>
                    </Box>
                    <Box sx={{ width: '100%', height: 12, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden' }}>
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${((batchState.index) / batchState.projects.length) * 100}%` }}
                            style={{ height: '100%', backgroundColor: '#f97316' }}
                        />
                    </Box>
                </Box>
                
                <Typography variant="body1" sx={{ mt: 2, fontStyle: 'italic', opacity: 0.7 }}>
                    Currently Generating: <b>{batchState.projects[batchState.index]?.project_name}</b>
                </Typography>
                <Typography variant="caption" sx={{ mt: 6, opacity: 0.5, maxWidth: 400 }}>
                    Please do not close or refresh this page. Reports are being generated and downloaded sequentially.
                </Typography>
            </motion.div>
        )}
      </AnimatePresence>

      <Snackbar 
        open={toast.open} 
        autoHideDuration={4000} 
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseToast} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}