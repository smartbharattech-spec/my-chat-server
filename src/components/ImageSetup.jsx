import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Slide,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import CropIcon from "@mui/icons-material/Crop";

// --- NEW LIBRARY: React Image Crop ---
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import getCroppedImg from "../utils/cropUtils";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Helper to center crop
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function ImageSetup({ handleImageUpload, onAutoNext, image }) {
  const fileInputRef = useRef(null);
  const imgRef = useRef(null); // Reference to the actual image DOM element

  // Cropper State
  const [activeImg, setActiveImg] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState(); // undefined initially
  const [completedCrop, setCompletedCrop] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [aspect, setAspect] = useState(undefined); // Start free-form

  const onFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 🛑 VALIDATE FILE TYPE
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Please select a JPG or PNG image.");
      e.target.value = null;
      return;
    }

    try {
      // 🚀 UPLOAD ORIGINAL FIRST (As requested)
      const serverUrl = await handleImageUpload(file);
      
      if (serverUrl) {
        // SUCCESS: Now open the cropper for refining
        const reader = new FileReader();
        reader.addEventListener("load", () => {
          setActiveImg(reader.result);
          setShowCropper(true);
        });
        reader.readAsDataURL(file);
      } else {
        // Upload failed - handled by handleImageUpload's own toast/error
      }
    } catch (err) {
      console.error("Selection/Upload Error:", err);
      alert("Failed to process image. Please try again.");
    } finally {
      e.target.value = null; // Reset input
    }
  };

  // NEW: Handler to re-crop existing image
  const handleRecrop = () => {
    setActiveImg(image);
    setShowCropper(true);
  };


  // Called when Image loads in the cropper
  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    // Default Crop: Centered, 90% width, Free Aspect
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1,
        width,
        height,
      ),
      width,
      height,
    );
    setCrop(initialCrop);
  }

  const saveCrop = async () => {
    if (!completedCrop || !imgRef.current) {
      alert("Please adjust the crop area.");
      return;
    }

    try {
      setProcessing(true);

      const croppedImageBlob = await getCroppedImg(
        imgRef.current,
        completedCrop,
        0
      );

      const file = new File([croppedImageBlob], "cropped_map.jpg", { type: "image/jpeg" });

      handleImageUpload(file);
      if (onAutoNext) onAutoNext();

      handleCloseCropper();
    } catch (e) {
      console.error(e);
      alert("Failed to crop image. Try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseCropper = () => {
    setShowCropper(false);
    setActiveImg(null);
    setCrop(undefined);
    setCompletedCrop(null);
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Box>
      <input
        type="file"
        hidden
        ref={fileInputRef}
        accept="image/*"
        onChange={onFileChange}
      />

      {/* --- CROPPER DIALOG --- */}
      <Dialog
        fullScreen
        open={showCropper}
        onClose={handleCloseCropper}
        TransitionComponent={Transition}
        sx={{ zIndex: 9999 }}
      >
        <AppBar sx={{ position: 'relative', bgcolor: '#431407' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleCloseCropper}
              aria-label="close"
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1, fontWeight: 700, color: 'white' }} variant="h6" component="div">
              Adjust Map (Paint Style)
            </Typography>
            <Button
              autoFocus
              color="inherit"
              onClick={saveCrop}
              disabled={processing}
              startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
              sx={{ fontWeight: 800, color: 'white' }}
            >
              {processing ? "Saving..." : "Save Image"}
            </Button>
          </Toolbar>
        </AppBar>

        <Box sx={{
          position: 'relative',
          flexGrow: 1,
          bgcolor: '#1a1a1a',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 4,
          overflow: 'auto'
        }}>
          {activeImg && (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              style={{ maxHeight: '80vh' }}
            >
              <img
                ref={imgRef}
                src={activeImg}
                alt="Crop me"
                crossOrigin="anonymous" // Important for re-cropping existing URL
                onLoad={onImageLoad}
                style={{ maxWidth: '100%', maxHeight: '80vh' }}
              />
            </ReactCrop>
          )}
        </Box>

        {/* Footer info or controls */}
        <Box sx={{ p: 2, bgcolor: '#000', color: 'white', textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#999' }}>
            Drag handles to resize. Drag box to move.
          </Typography>
        </Box>
      </Dialog>


      {!image ? (
        <Box sx={{ p: 4, textAlign: "center", background: "linear-gradient(135deg, #fffcf5 0%, #fff7ed 100%)", borderRadius: 4, border: "2px dashed #fb923c" }}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{
              width: 64,
              height: 64,
              bgcolor: "#fff7ed",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
              color: "#f97316"
            }}>
              <CloudUploadIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h6" fontWeight={800} color="#431407">
              Upload Architecture Map
            </Typography>
            <Typography variant="body2" color="#7c2d12" sx={{ opacity: 0.7, mb: 3 }}>
              JPG or PNG supported.
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={handleButtonClick}
            sx={{
              py: 1.5,
              px: 4,
              borderRadius: 3,
              bgcolor: "#f97316",
              fontWeight: 800,
              textTransform: "none",
              "&:hover": { bgcolor: "#ea580c" },
              boxShadow: "0 8px 20px rgba(249, 115, 22, 0.2)",
              color: "#fff"
            }}
          >
            Select Map Image
          </Button>
        </Box>
      ) : (
        <Box sx={{ p: 2, textAlign: "center", bgcolor: "#fff", borderRadius: 4, border: "1px solid #fed7aa" }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: "#9a3412", opacity: 0.6 }}>
            CURRENT ACTIVE MAP
          </Typography>
          <Box sx={{ position: "relative", mb: 2, borderRadius: 2, overflow: "hidden", border: "1px solid #ffedd5" }}>
            <img src={image} alt="Current Map" style={{ width: "100%", height: "auto", display: "block" }} />

            {/* Floating Re-Crop Button */}
            <Tooltip title="Re-Crop Image">
              <IconButton
                onClick={handleRecrop}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  color: '#f97316',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  '&:hover': {
                    bgcolor: '#fff',
                    color: '#ea580c',
                  }
                }}
                size="small"
              >
                <CropIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Button
            variant="outlined"
            fullWidth
            onClick={handleButtonClick}
            startIcon={<CloudUploadIcon />}
            sx={{
              borderRadius: 3,
              fontWeight: 800,
              textTransform: "none",
              borderColor: "#fb923c",
              color: "#f97316",
              mb: 1,
              "&:hover": { borderColor: "#ea580c", bgcolor: "#fff7ed" }
            }}
          >
            Upload New Map
          </Button>

          <Button
            variant="text"
            fullWidth
            onClick={onAutoNext}
            sx={{
              mt: 1,
              fontWeight: 700,
              textTransform: "none",
              color: "#f97316",
              textDecoration: "underline",
              "&:hover": {
                bgcolor: "transparent",
                color: "#ea580c",
                textDecoration: "none"
              }
            }}
          >
            Explore Tool
          </Button>
        </Box>
      )}
    </Box>
  );
}
