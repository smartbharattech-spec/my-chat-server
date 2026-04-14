import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  Tooltip,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Backdrop,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LockIcon from "@mui/icons-material/Lock";
import DownloadIcon from "@mui/icons-material/Download";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import html2canvas from "html2canvas";

// Services Hooks
import { useShaktiChakra } from "../services/tool/shaktiChakraService";
import { useDevta } from "../services/tool/devtaService";
import { useMarma } from "../services/tool/marmaService";
import { useEntrance } from "../services/tool/entranceService";
import { useCanvasView } from "../services/tool/canvasViewService";
import { exportAsImage, captureElementAsImage } from "../services/tool/ExportService";
import { drawingService } from "../services/tool/drawingService";

const accordionStyle = {
  mb: 1.5,
  width: "100% !important",
  boxSizing: "border-box",
  borderRadius: "16px !important",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
  border: "1px solid rgba(0,0,0,0.03)",
  overflow: "hidden",
  "&:before": { display: "none" },
  "& .MuiAccordionSummary-root": { px: 2 },
  "& .MuiAccordionDetails-root": { px: 2 },
  "&.Mui-expanded": { margin: "0 0 24px 0 !important" }
};

const summaryHeaderStyle = { 
  display: "flex", 
  alignItems: "center", 
  gap: 1.5,
  minWidth: 0,
  flexGrow: 1,
  overflow: "hidden"
};

const stepCircleStyle = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  bgcolor: "#f97316",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  fontSize: 13,
};

const dialogButtonStyle = {
  bgcolor: "#1e293b",
  color: "#fff",
  px: 4,
  borderRadius: 2,
  fontWeight: 700,
  "&:hover": { bgcolor: "#0f172a" },
  textTransform: "none",
};

export default function ReportOptions({ 
    isDetailsFilled, 
    onShowDetails, 
    hasAccess = () => true,
    handleLockedClick = () => {},
    showStepNumber = true,
    stepColor = "#f97316",
    stepText = "6",
    externalIsExporting,
    externalSetIsExporting,
    externalIsExportingFull,
    externalSetIsExportingFull,
    showAccordion = true,
    title = "Reports & Exports",
    projectId: propProjectId
}) {
  const [localIsExporting, setLocalIsExporting] = useState(false);
  const [localIsExportingFull, setLocalIsExportingFull] = useState(false);

  const isExporting = externalIsExporting !== undefined ? externalIsExporting : localIsExporting;
  const isExportingFull = externalIsExportingFull !== undefined ? externalIsExportingFull : localIsExportingFull;

  const setIsExporting = externalSetIsExporting || setLocalIsExporting;
  const setIsExportingFull = externalSetIsExportingFull || setLocalIsExportingFull;
  const [includeRemedies, setIncludeRemedies] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [previewDialog, setPreviewDialog] = useState({
    open: false,
    title: "",
    description: "",
    type: "",
    isShakti: false,
    item: null,
    previewImage: null,
    isPreparing: false
  });

  const { isActive, setActive } = useShaktiChakra();
  const devta = useDevta();
  const { isActive: isMarmaActive, toggleMarma } = useMarma();
  const { entrances, customZoneRemedies, remedies } = useEntrance();
  const { resetView } = useCanvasView();

  const showAlert = (message, severity = "warning") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // --- BATCH EXPORT LISTENER ---
  React.useEffect(() => {
    const handleBatchTrigger = (e) => {
        const { isBatch, onComplete } = e.detail;
        if (isBatch) {
            startDownloadFullReport({ onComplete });
        }
    };
    window.addEventListener('vastu-trigger-full-report', handleBatchTrigger);
    return () => window.removeEventListener('vastu-trigger-full-report', handleBatchTrigger);
  }, [isActive, isMarmaActive]); // Needs some deps to ensure current state refs are correct if closure issues occur

  const validateStep = (type) => {
    const activeProjectId = propProjectId || localStorage.getItem("active_project_id");
    if (!activeProjectId) {
      showAlert("No active project selected.", "error");
      return false;
    }

    if (type === 'export' && !isDetailsFilled) {
      showAlert("Please fill in Property & Personal Details first to download reports.", "error");
      if (onShowDetails) {
        setTimeout(() => onShowDetails(), 1500);
      }
      return false;
    }
    return true;
  };

  const handleDownloadFullReport = async () => {
    if (!validateStep('export')) return;
    
    setPreviewDialog({
      open: true,
      title: "Complete Vastu Report (PDF)",
      description: "This premium report combines all analysis layers (Shakti, Devta, Marma, Area Analysis) into a single high-quality PDF document. Perfect for final presentations and records.",
      type: "full",
      item: null,
      previewImage: null,
      isPreparing: false
    });
  };

  const startDownloadFullReport = async (batchOptions = null) => {
    const isBatch = !!batchOptions;
    if (!isBatch) setPreviewDialog({ ...previewDialog, open: false });
    
    if (!isBatch) setIsExportingFull(true);

    const wasShaktiOn = isActive;
    const wasDevtaOn = devta.isActive;
    const wasMarmaOn = isMarmaActive;
    const wasOverlayOn = drawingService.getOverlay();

    const currentScale = useCanvasView.getState().scale;
    const currentOffset = useCanvasView.getState().offset;

    const reportPages = [];
    resetView();
    drawingService.setOverlay(true);

    try {
      // 1. Plot Boundary & Center
      if (wasShaktiOn) setActive(false);
      if (wasDevtaOn) devta.setActive(false);
      if (typeof toggleMarma === 'function') toggleMarma(false);
      await new Promise(r => setTimeout(r, 800));
      const boundaryImg = await captureElementAsImage("vastu-canvas");
      reportPages.push({ title: "Plot Boundary & Center", imgData: boundaryImg });

      // 2. Shakti Chakra Analysis
      setActive(true);
      await new Promise(r => setTimeout(r, 800));
      const shaktiImg = await captureElementAsImage("vastu-canvas");
      reportPages.push({ title: "Shakti Chakra Analysis", imgData: shaktiImg });
      setActive(false);

      // 3. Devta Mandala Analysis
      devta.setActive(true);
      await new Promise(r => setTimeout(r, 800));
      const devtaImg = await captureElementAsImage("vastu-canvas");
      reportPages.push({ title: "Devta Mandala Analysis", imgData: devtaImg });
      devta.setActive(false);

      // 4. Marma Energy Map
      if (typeof toggleMarma === 'function') {
        toggleMarma(true);
        await new Promise(r => setTimeout(r, 800));
        const marmaImg = await captureElementAsImage("vastu-canvas");
        reportPages.push({ title: "Marma Energy Map", imgData: marmaImg });
        toggleMarma(false);
      }

      // 5. Zone Area Analysis (Map)
      setActive(true);
      await new Promise(r => setTimeout(r, 800));
      const areaImg = await captureElementAsImage("vastu-canvas");
      reportPages.push({ title: "Zone Area Analysis", imgData: areaImg });

      // 6. Zone Area Analysis Table (Text)
      const areaTableImg = await captureElementAsImage("vastu-area-report");
      if (areaTableImg) {
        reportPages.push({ title: "Area Distribution Table", imgData: areaTableImg });
      }

      // 7. Marked Components & Remedies (Text)
      const remediesImg = await captureElementAsImage("vastu-analysis-list");
      if (remediesImg) {
        reportPages.push({ title: "Marked Components & Remedies", imgData: remediesImg });
      }

      // 8. Custom Zone Remedies (Text)
      const zoneRemediesImg = await captureElementAsImage("vastu-zone-remedies-list");
      if (zoneRemediesImg) {
        reportPages.push({ title: "Additional Zone Remedies", imgData: zoneRemediesImg });
      }

      const { exportCompleteReportPDF } = await import('../services/tool/ExportService');
      await exportCompleteReportPDF({
          filename: `Vastu-Complete-Report-${Date.now()}.pdf`,
          pages: reportPages
      });

      // Restore states
      setActive(wasShaktiOn);
      devta.setActive(wasDevtaOn);
      if (typeof toggleMarma === 'function') toggleMarma(wasMarmaOn);
      drawingService.setOverlay(wasOverlayOn);
      useCanvasView.getState().setTransform(currentScale, currentOffset);
      useCanvasView.getState().setTransform(currentScale, currentOffset);
      if (!isBatch) setIsExportingFull(false);
      
      // ✅ CALBACK FOR BATCH ENGINE
      if (isBatch && batchOptions.onComplete) {
          batchOptions.onComplete();
      }
    } catch (err) {
      console.error("Batch/Single Export failed:", err);
      if (!isBatch) {
          setIsExportingFull(false);
          showAlert("Report generation failed.", "error");
      }
      
      // ✅ CALBACK FOR BATCH ENGINE (Even on Error to avoid hanging)
      if (isBatch && batchOptions.onComplete) {
          batchOptions.onComplete();
      }
    }
  };

  const handleSmartExport = async (item, isShaktiVariant = false) => {
    if (!validateStep('export')) return;

    setPreviewDialog(prev => ({ ...prev, isPreparing: true }));

    const wasShaktiOn = isActive;
    const wasDevtaOn = devta.isActive;
    const wasMarmaOn = isMarmaActive;
    const wasOverlayOn = drawingService.getOverlay();
    const currentScale = useCanvasView.getState().scale;
    const currentOffset = useCanvasView.getState().offset;

    const reportType = item.type;
    const withShakti = isShaktiVariant || reportType === 'shakti' || reportType === 'zone';

    window.vastuExportSettings = { reportType, withShakti, active: true };
    window.dispatchEvent(new CustomEvent('vastu-export-update', { detail: window.vastuExportSettings }));

    const targetDevta = reportType === 'devta';
    const targetMarma = reportType === 'marma';
    const targetShakti = withShakti;

    if (wasDevtaOn !== targetDevta) devta.setActive(targetDevta);
    if (wasMarmaOn !== targetMarma && typeof toggleMarma === 'function') toggleMarma(targetMarma);
    if (wasShaktiOn !== targetShakti) setActive(targetShakti);
    drawingService.setOverlay(true);
    resetView();

    try {
      await new Promise(r => setTimeout(r, 800));
      const canvasElement = document.getElementById("vastu-canvas");
      if (canvasElement) {
        const canvas = await html2canvas(canvasElement, {
          useCORS: true,
          scale: 1,
          backgroundColor: "#ffffff"
        });
        const previewUrl = canvas.toDataURL("image/jpeg", 0.7);

        setPreviewDialog({
          open: true,
          title: `${item.name}${isShaktiVariant ? ' (With Shakti)' : ''}`,
          description: item.desc,
          type: "smart",
          item: item,
          isShakti: isShaktiVariant,
          previewImage: previewUrl,
          isPreparing: false
        });
      }
    } catch (err) {
      console.error("Preview capture failed:", err);
      showAlert("Could not generate preview, but you can still download.", "info");
      setPreviewDialog({
        open: true,
        title: item.name,
        description: item.desc,
        type: "smart",
        item: item,
        isShakti: isShaktiVariant,
        previewImage: null,
        isPreparing: false
      });
    } finally {
      window.vastuExportSettings = { active: false };
      window.dispatchEvent(new CustomEvent('vastu-export-update', { detail: window.vastuExportSettings }));
      if (wasDevtaOn !== targetDevta) devta.setActive(wasDevtaOn);
      if (wasMarmaOn !== targetMarma && typeof toggleMarma === 'function') toggleMarma(wasMarmaOn);
      if (wasShaktiOn !== targetShakti) setActive(wasShaktiOn);
      drawingService.setOverlay(wasOverlayOn);
      useCanvasView.getState().setTransform(currentScale, currentOffset);
    }
  };

  const startSmartExport = (item, isShaktiVariant = false) => {
    setPreviewDialog({ ...previewDialog, open: false });
    const currentScale = useCanvasView.getState().scale;
    const currentOffset = useCanvasView.getState().offset;

    const wasShaktiOn = isActive;
    const wasDevtaOn = devta.isActive;
    const wasMarmaOn = isMarmaActive;
    const wasOverlayOn = drawingService.getOverlay();

    resetView();
    setIsExporting(true);

    const reportType = item.type;
    const withShakti = isShaktiVariant || reportType === 'shakti' || reportType === 'zone';

    window.vastuExportSettings = { reportType, withShakti, active: true };
    window.dispatchEvent(new CustomEvent('vastu-export-update', { detail: window.vastuExportSettings }));

    const targetDevta = reportType === 'devta';
    const targetMarma = reportType === 'marma';
    const targetShakti = withShakti;

    if (wasDevtaOn !== targetDevta) devta.setActive(targetDevta);
    if (wasMarmaOn !== targetMarma) {
      if (typeof toggleMarma === 'function') toggleMarma(targetMarma);
    }
    if (wasShaktiOn !== targetShakti) setActive(targetShakti);

    drawingService.setOverlay(true);

    setTimeout(() => {
      const timestamp = Date.now();
      const shaktiSuffix = withShakti ? '-SHAKTI' : '';
      const filename = `VASTU-${reportType.toUpperCase()}${shaktiSuffix}-${timestamp}.png`;

      const exportOptions = {
        reportType: reportType,
        withShakti: withShakti,
        entrances: entrances,
        customZoneRemedies: customZoneRemedies,
        remedies: remedies,
        includeRemedies: reportType === 'basic' && includeRemedies,
      };

      exportAsImage("vastu-canvas", filename, exportOptions).finally(() => {
        window.vastuExportSettings = { active: false };
        window.dispatchEvent(new CustomEvent('vastu-export-update', { detail: window.vastuExportSettings }));

        if (wasDevtaOn !== targetDevta) devta.setActive(wasDevtaOn);
        if (wasMarmaOn !== targetMarma) {
          if (typeof toggleMarma === 'function') toggleMarma(wasMarmaOn);
        }
        if (wasShaktiOn !== targetShakti) setActive(wasShaktiOn);

        useCanvasView.getState().setTransform(currentScale, currentOffset);
        setIsExporting(false);
      });
    }, 1000);
  };

  const content = (
    <Box sx={{ 
      p: showAccordion ? 1.5 : 0, 
      bgcolor: showAccordion ? '#f8fafc' : 'transparent', 
      borderRadius: 2, 
      mb: showAccordion ? 2 : 0 
    }}>
      {showAccordion && (
        <Typography fontSize={11} color="#64748b" sx={{ mb: 1, fontWeight: 600 }}>
          Select Report Type
        </Typography>
      )}

      {/* PREMIUM COMPLETE REPORT BUTTON */}
      <Box sx={{ mb: 3 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleDownloadFullReport}
          disabled={isExportingFull}
          startIcon={isExportingFull ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
          sx={{
            py: { xs: 1.2, sm: 1.5 },
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            boxShadow: '0 4px 14px 0 rgba(249, 115, 22, 0.39)',
            fontWeight: 800,
            fontSize: { xs: '0.75rem', sm: '0.85rem' },
            textTransform: 'none',
            '&:hover': {
              background: 'linear-gradient(135deg, #ea580c, #c2410c)',
              boxShadow: '0 6px 20px rgba(249, 115, 22, 0.45)',
            }
          }}
        >
          {isExportingFull ? "Generating..." : "Download Complete Report PDF"}
        </Button>
        <Typography fontSize={10} color="#94a3b8" textAlign="center" sx={{ mt: 1, px: 2 }}>
          Combines all analysis layers (Shakti, Devta, Marma, Area) into one PDF.
        </Typography>
      </Box>

      <Divider sx={{ mb: 2, opacity: 0.5 }} />

      <List disablePadding>
        {[
          { name: "Remedies Marking", type: "basic", color: "#3b82f6", desc: "Main layout with entrances and components." },
          { name: "Shakti Chakra", type: "shakti", color: "#8b5cf6", desc: "Clean Shakti Chakra map with 16/32 zones." },
          { name: "Marma Energy Map", type: "marma", color: "#ef4444", desc: "Detailed Marma points and energy lines." },
          { name: "Zone Area Analysis", type: "zone", color: "#10b981", desc: "Zone-wise area distribution and chart." },
          { name: "Devta Mandala", type: "devta", color: "#f59e0b", desc: "The complete 45 Devta Mandala map." },
        ].map((item, idx) => (
          <Box key={item.type} sx={{
            mb: idx === 4 ? 0 : 2.5,
            p: 1.5,
            borderRadius: 3,
            border: '1px solid #f1f5f9',
            transition: 'all 0.2s',
            '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.04)', borderColor: '#e2e8f0' }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
              <Box sx={{
                width: 32, height: 32, borderRadius: 2, bgcolor: `${item.color}10`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1.5, flexShrink: 0
              }}>
                <DownloadIcon sx={{ fontSize: 18, color: item.color }} />
              </Box>
              <Box>
                <Typography fontSize={13} fontWeight={800} color="#1e293b">{item.name}</Typography>
                <Typography fontSize={10} color="#64748b" sx={{ mt: 0.2 }}>{item.desc}</Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {item.type === 'shakti' ? (
                <Tooltip title="Download Shakti Chakra Image">
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleSmartExport(item)}
                    sx={{
                      textTransform: 'none', fontWeight: 800, fontSize: 10, borderRadius: 2, py: 1,
                      bgcolor: item.color, '&:hover': { bgcolor: item.color, opacity: 0.9 }
                    }}
                  >
                    Download Shakti Chakra
                  </Button>
                </Tooltip>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%' }}>
                  {item.type === 'basic' && (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={includeRemedies}
                          onChange={(e) => setIncludeRemedies(e.target.checked)}
                          size="small"
                          sx={{ p: 0.5, color: '#f97316', '&.Mui-checked': { color: '#f97316' } }}
                        />
                      }
                      label={<Typography fontSize={11} fontWeight={600} color="#64748b">Include Remedies Section</Typography>}
                      sx={{ m: 0, mb: 0.5 }}
                    />
                  )}
                  {item.type === 'zone' ? (
                    <Tooltip title="Download Analysis Report PDF">
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<AutoFixHighIcon sx={{ fontSize: 14 }} />}
                        onClick={() => handleSmartExport(item, true)}
                        sx={{
                          textTransform: 'none', fontWeight: 800, fontSize: 10, borderRadius: 2, py: 1,
                          bgcolor: item.color, '&:hover': { bgcolor: item.color, opacity: 0.9 }
                        }}
                      >
                        Download Analysis Report
                      </Button>
                    </Tooltip>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Download Standard Report">
                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={() => handleSmartExport(item, false)}
                          sx={{
                            textTransform: 'none', fontWeight: 700, fontSize: 10, borderRadius: 2, py: 1,
                            borderColor: '#e2e8f0', color: '#475569', '&:hover': { borderColor: item.color, color: item.color, bgcolor: `${item.color}05` }
                          }}
                        >
                          Standard
                        </Button>
                      </Tooltip>
                      <Tooltip title="Download Report with Shakti Chakra Overlay">
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<AutoFixHighIcon sx={{ fontSize: 14 }} />}
                          onClick={() => handleSmartExport(item, true)}
                          sx={{
                            textTransform: 'none', fontWeight: 800, fontSize: 10, borderRadius: 2, py: 1,
                            bgcolor: item.color, '&:hover': { bgcolor: item.color, opacity: 0.9 }
                          }}
                        >
                          With Shakti
                        </Button>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        ))}
      </List>

      {/* SNACKBAR ALERTS */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} variant="filled" sx={{ width: '100%', fontWeight: 700 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* EXPORT PRELOADER */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => 99999,
          flexDirection: 'column',
          gap: 3,
          backdropFilter: 'blur(10px)',
          background: 'rgba(15, 23, 42, 0.75)',
          textAlign: 'center',
          px: 3
        }}
        open={isExporting || isExportingFull}
      >
        <CircularProgress color="inherit" size={70} thickness={5} />
        <Box sx={{ maxWidth: 500 }}>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 2, letterSpacing: '1px', color: '#f97316', fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
            GENERATING PREMIUM REPORT
          </Typography>
          <Typography sx={{ opacity: 0.95, fontSize: { xs: '0.9rem', sm: '1.2rem' }, fontWeight: 600, color: '#fff' }}>
            Please wait while we prepare your high-quality Vastu documentation.
          </Typography>
          <Typography sx={{ opacity: 0.8, mt: 1, fontSize: { xs: '0.8rem', sm: '1.0rem' }, fontStyle: 'italic' }}>
            Your download will commence automatically in a few moments.
          </Typography>
        </Box>
      </Backdrop>

      {/* PREPARING PREVIEW LOADER */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => 9999999,
          flexDirection: 'column',
          gap: 3,
          backdropFilter: 'blur(5px)',
          background: 'rgba(15, 23, 42, 0.6)',
          textAlign: 'center',
        }}
        open={previewDialog.isPreparing}
      >
        <CircularProgress color="warning" size={50} />
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff' }}>
          Preparing Real Preview...
        </Typography>
      </Backdrop>

      {/* REPORT PREVIEW DIALOG */}
      <Dialog
        open={previewDialog.open}
        onClose={() => setPreviewDialog({ ...previewDialog, open: false })}
        sx={{ zIndex: 999999 }}
        PaperProps={{
          sx: {
            borderRadius: 4,
            padding: 1,
            maxWidth: '700px',
            width: '90%',
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        <DialogTitle sx={{ p: 3, pb: 1 }}>
          <Typography variant="h5" fontWeight={900} color="#0f172a">
            {previewDialog.title}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
            {previewDialog.description}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {previewDialog.previewImage ? (
            <Box sx={{ 
              width: '100%', 
              borderRadius: 3, 
              overflow: 'hidden', 
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
              bgcolor: '#000'
            }}>
              <img 
                src={previewDialog.previewImage} 
                alt="Report Preview" 
                style={{ width: '100%', display: 'block' }} 
              />
            </Box>
          ) : (
            <Box sx={{ 
              height: 300, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: '#f1f5f9',
              borderRadius: 3,
              border: '1px dashed #cbd5e1'
            }}>
              <Box sx={{ textAlign: 'center', p: 3 }}>
                <AutoFixHighIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 2 }} />
                <Typography color="textSecondary" fontWeight={600}>
                  {previewDialog.type === 'full' ? 'Preparing premium PDF document...' : 'Preparing high-resolution preview...'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0, gap: 2 }}>
          <Button 
            onClick={() => setPreviewDialog({ ...previewDialog, open: false })}
            sx={{ 
                textTransform: 'none', 
                fontWeight: 700, 
                color: '#64748b',
                px: 3
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              if (previewDialog.type === 'full') startDownloadFullReport();
              else startSmartExport(previewDialog.item, previewDialog.isShakti);
            }}
            sx={dialogButtonStyle}
          >
            Start Download
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  if (!showAccordion) {
    return (
      <Box sx={{ width: '100%' }}>
        {content}
      </Box>
    );
  }

  return (
    <Box onClickCapture={!hasAccess(8) ? handleLockedClick : undefined} sx={{ cursor: !hasAccess(8) ? 'pointer' : 'default' }}>
      <Accordion sx={accordionStyle} disabled={!hasAccess(8)}>
        <AccordionSummary expandIcon={hasAccess(8) ? <ExpandMoreIcon sx={{ color: "#f97316" }} /> : <LockIcon sx={{ color: "#94a3b8", fontSize: 20 }} />}>
          <Box sx={summaryHeaderStyle}>
            {showStepNumber && <Box sx={{ ...stepCircleStyle, bgcolor: hasAccess(8) ? stepColor : "#cbd5e1" }}>{stepText}</Box>}
            <Typography fontWeight={700} color={hasAccess(8) ? "#334155" : "#94a3b8"} sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: "0 !important" }}>
          {content}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
