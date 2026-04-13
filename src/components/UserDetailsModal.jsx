import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Stack,
    MenuItem,
    Typography,
    Grid,
    Box,
    CircularProgress
} from "@mui/material";
import { useToast } from "../services/ToastService";

const UserDetailsModal = ({ open, onClose, email, projectId, constructionType, isMandatory = false, onSaveSuccess }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        location_coords: "",
        north_tilt: "",
        north_tilt_tool: "",
        facing: "",
        time_living: "",
        profession: "",
        main_gate: "",
        kitchen: "",
        mandir: "",
        toilet: "",
        septic_tank: "",
        house_type: "Own"
    });

    useEffect(() => {
        if (open && (email || projectId)) {
            fetchExistingDetails();
        }
    }, [open, email, projectId]);

    const fetchExistingDetails = async () => {
        try {
            const url = projectId 
                ? `/api/get_user_details.php?project_id=${projectId}`
                : `/api/get_user_details.php?email=${encodeURIComponent(email)}`;
            const response = await fetch(url);
            const resData = await response.json();

            if (resData.status === "success" && resData.data.length > 0) {
                const details = resData.data[0];
                setFormData({
                    name: details.name || "",
                    location_coords: details.location_coords || "",
                    north_tilt: details.north_tilt || "",
                    north_tilt_tool: details.north_tilt_tool || "",
                    facing: details.facing || "",
                    time_living: details.time_living || "",
                    profession: details.profession || "",
                    main_gate: details.main_gate || "",
                    kitchen: details.kitchen || "",
                    mandir: details.mandir || "",
                    toilet: details.toilet || "",
                    septic_tank: details.septic_tank || "",
                    house_type: details.house_type || "Own"
                });
            } else {
                // IMPORTANT: RESET FORM IF NO DATA FOUND FOR THIS PROJECT
                setFormData({
                    name: "",
                    location_coords: "",
                    north_tilt: "",
                    north_tilt_tool: "",
                    facing: "",
                    time_living: "",
                    profession: "",
                    main_gate: "",
                    kitchen: "",
                    mandir: "",
                    toilet: "",
                    septic_tank: "",
                    house_type: "Own"
                });
            }
        } catch (error) {
            console.error("Failed to fetch existing details", error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        const isExisting = constructionType === 'Existing';
        
        // GLOBAL MANDATORY FIELDS
        if (!formData.location_coords.trim()) { showToast("Location Coordinates is mandatory", "error"); return; }
        if (!formData.north_tilt.trim()) { showToast("North Tilt is mandatory", "error"); return; }
        if (!formData.north_tilt_tool.trim()) { showToast("North Tilt in Tool is mandatory", "error"); return; }

        if (isExisting) {
            // EXISTING SPECIFIC MANDATORY
            if (!formData.facing.trim()) { showToast("Property Facing is mandatory", "error"); return; }
            if (!formData.time_living.trim()) { showToast("Time Living in property is mandatory", "error"); return; }
            if (!formData.house_type) { showToast("House Type is mandatory", "error"); return; }
        } else {
            // NEW SPECIFIC MANDATORY
            if (!formData.profession.trim()) { showToast("Profession is mandatory", "error"); return; }
        }

        setLoading(true);
        try {
            const response = await fetch("/api/save_user_details.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, email, project_id: projectId })
            });
            const data = await response.json();
            if (data.status === "success") {
                showToast("Details saved successfully!", "success");
                if (onSaveSuccess) onSaveSuccess();
                onClose();
            } else {
                showToast(data.message || "Failed to save details", "error");
            }
        } catch (error) {
            showToast("Error connecting to server", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog 
            open={open} 
            maxWidth="md" 
            fullWidth 
            PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
            sx={{ zIndex: 3000 }}
            disableEscapeKeyDown={isMandatory}
            onClose={(event, reason) => {
                if (isMandatory && reason === "backdropClick") {
                    return;
                }
                onClose();
            }}
        >
            <DialogTitle sx={{ fontWeight: 800, color: "#9a3412" }}>
                Property & Personal Details
                <Typography variant="body2" sx={{ color: "#7c2d12", opacity: 0.7, fontWeight: 500 }}>
                    Please fill in the details below to help us analyze your Vastu better.
                </Typography>
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    {/* MANDATORY FIELDS (GLOBAL) */}
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Profession *" name="profession" value={formData.profession} onChange={handleChange} size="small" required={!constructionType === 'Existing'} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Location Coordinates *" name="location_coords" value={formData.location_coords} onChange={handleChange} size="small" placeholder="Enter Coordinates" required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="North Tilt *" name="north_tilt" value={formData.north_tilt} onChange={handleChange} size="small" placeholder="e.g. 5.5° East" required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="North Tilt in Tool *" name="north_tilt_tool" value={formData.north_tilt_tool} onChange={handleChange} size="small" placeholder="e.g. 5.5°" required />
                    </Grid>

                    {/* EXISTING SPECIFIC FIELDS */}
                    {constructionType === 'Existing' && (
                        <>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Property Facing *" name="facing" value={formData.facing} onChange={handleChange} size="small" placeholder="e.g. North-East" required />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Time Living in this Property *" name="time_living" value={formData.time_living} onChange={handleChange} size="small" placeholder="e.g. 5 Years" required />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth select label="House Type *" name="house_type" value={formData.house_type} onChange={handleChange} size="small" required>
                                    <MenuItem value="Own">Own House</MenuItem>
                                    <MenuItem value="Rented">Rented</MenuItem>
                                </TextField>
                            </Grid>

                            {/* COMPASS TALLY DETAILS */}
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="Main Gate" name="main_gate" value={formData.main_gate} onChange={handleChange} size="small" />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="Kitchen" name="kitchen" value={formData.kitchen} onChange={handleChange} size="small" />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="Mandir" name="mandir" value={formData.mandir} onChange={handleChange} size="small" />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="Toilet" name="toilet" value={formData.toilet} onChange={handleChange} size="small" />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="Septic Tank" name="septic_tank" value={formData.septic_tank} onChange={handleChange} size="small" />
                            </Grid>
                        </>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                {!isMandatory && (
                    <Button onClick={onClose} disabled={loading} sx={{ color: "#000000", fontWeight: 700 }}>
                        Close
                    </Button>
                )}
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    sx={{
                        borderRadius: "10px",
                        bgcolor: "#f97316",
                        "&:hover": { bgcolor: "#ea580c" },
                        fontWeight: 800,
                        px: 4
                    }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : "Save Details"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UserDetailsModal;
