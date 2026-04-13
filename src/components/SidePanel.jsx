import React, { useState, useRef } from "react";
import { Box, Tooltip, IconButton, Avatar, Typography, Button, Link } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import CloseIcon from "@mui/icons-material/Close";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import ImageSetup from "./ImageSetup";
import ToolModules from "./ToolModules";

export default function SidePanel({
  user,
  avatarLetter,
  handleImageUpload,
  onBack,
  setOpenDrawer,
  image,
  onShowReviews,
  isDetailsFilled,
  onShowDetails,
  trackerEnabled = true,
  activeProjectName,
  activeProjectId,
  onSwitchProject,
  onBulkExport
}) {
  const [step, setStep] = useState(() => {
    // If we already have a saved step of 2 OR if image exists, start at step 2
    const savedStep = Number(localStorage.getItem("sidePanelStep")) || 1;
    return savedStep;
  });

  // Track whether we've ever seen an image to prevent oscillation
  const hasEverHadImage = useRef(!!image);

  const goToStep = (num) => {
    localStorage.setItem("sidePanelStep", num);
    setStep(num);
  };

  // Auto-advance ONLY ONCE when image first arrives — never regress on null
  React.useEffect(() => {
    if (image) {
      hasEverHadImage.current = true;
      if (step === 1) {
        goToStep(2);
      }
    }
    // Intentionally NOT resetting to step 1 when image=null (project loading gap)
  }, [image]);

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#fffaf5", 
        px: { xs: 1.5, md: 2 }, // Reduced horizontal padding to prevent overflow
        py: { xs: 2, md: 3 },
        overflow: "hidden",
        borderRight: "1px solid #ffedd5",
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* USER HEADER WITH BACK */}
      <Box sx={{ 
        display: "flex", 
        alignItems: "center", 
        mb: 4, 
        p: 2, 
        bgcolor: "rgba(249, 115, 22, 0.05)", 
        borderRadius: "24px",
        border: "1px solid rgba(249, 115, 22, 0.1)"
      }}>
        <Tooltip title="Back to Dashboard">
          <IconButton
            onClick={() => setOpenDrawer(false)}
            sx={{ 
                color: "#f97316", 
                mr: 1,
                bgcolor: "white",
                boxShadow: "0 4px 12px rgba(249, 115, 22, 0.1)",
                "&:hover": { bgcolor: "#fff7ed" }
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
        </Tooltip>
 
        <Avatar sx={{ 
            width: 48, 
            height: 48, 
            bgcolor: "#f97316", 
            fontWeight: 800, 
            mr: 2,
            boxShadow: "0 8px 16px rgba(249, 115, 22, 0.2)",
            fontSize: "1.2rem"
        }}>
          {avatarLetter}
        </Avatar>
 
        <Box sx={{ flexGrow: 1 }}>
          <Typography fontWeight={900} color="#1e293b" sx={{ letterSpacing: "-0.01em" }}>{user?.firstname}</Typography>
          <Typography fontSize={11} color="text.secondary" fontWeight={600} sx={{ opacity: 0.8 }}>{user?.email}</Typography>
        </Box>
 
      </Box>

      {/* BODY */}
      <Box sx={{
        flexGrow: 1,
        overflowY: "auto",
        overflowX: "hidden", // [FIX] Prevent horizontal scroll
        minHeight: 0,
        "&::-webkit-scrollbar": { width: "4px" },
        "&::-webkit-scrollbar-thumb": { background: "#fed7aa", borderRadius: "10px" }
      }}>
        {/* STEP 1 */}
        {step === 1 && (
          <ImageSetup
            handleImageUpload={handleImageUpload}
            onAutoNext={() => goToStep(2)}
            image={image}
          />
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <ToolModules 
            onBack={() => goToStep(1)} 
            isDetailsFilled={isDetailsFilled}
            onShowDetails={onShowDetails}
            activeProjectName={activeProjectName}
            activeProjectId={activeProjectId}
            onSwitchProject={onSwitchProject}
            onBulkExport={onBulkExport}
          />
        )}
      </Box>


      {/* FOOTER - replaced buttons with subtle links */}
      <Box sx={{ 
        mt: 'auto', 
        pt: 2,
        borderTop: "1px solid rgba(249, 115, 22, 0.1)",
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        gap: 3, 
        overflow: 'hidden' 
      }}>
        {trackerEnabled && (
          <Tooltip title="Share your Tracker experience">
            <Link
              component="button"
              onClick={onShowReviews}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.8,
                fontWeight: 800,
                fontSize: 13,
                color: "#c2410c",
                textDecoration: "none",
                transition: "0.2s all",
                "&:hover": { 
                    color: "#f97316",
                    transform: "translateY(-1px)",
                    textDecoration: "underline"
                }
              }}
            >
              <FactCheckIcon sx={{ fontSize: 18 }} />
              Tracker
            </Link>
          </Tooltip>
        )}
        
        <Tooltip title="Close Vastu Tool and return to dashboard">
          <Link
            component="button"
            onClick={onBack}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.8,
              fontWeight: 800,
              fontSize: 13,
              color: "#f97316",
              textDecoration: "none",
              transition: "0.2s all",
              "&:hover": { 
                  color: "#ea580c",
                  transform: "translateY(-1px)",
                  textDecoration: "underline"
              }
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
            Close Tool
          </Link>
        </Tooltip>
      </Box>
    </Box>
  );
}
