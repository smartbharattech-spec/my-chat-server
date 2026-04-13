import { useState, useEffect, useRef } from "react";
import { Box, CircularProgress, Typography, Button, Paper, Alert } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { useToast } from "../services/ToastService";

const PhonePePayment = () => {
    const [searchParams] = useSearchParams();
    const { showToast } = useToast();
    const processedRef = useRef(false);
    const [status, setStatus] = useState("idle"); // idle, processing, cancelled

    const amount = searchParams.get("amount");
    const orderId = searchParams.get("order_id");
    const type = searchParams.get("type");

    useEffect(() => {
        if (amount && orderId && !processedRef.current) {
            // Check if we just tried this order (User pressed Back button)
            const lastAttempt = sessionStorage.getItem("last_payment_order");

            if (lastAttempt === orderId) {
                setStatus("cancelled"); // Show UI instead of auto-redirecting
            } else {
                processedRef.current = true;
                sessionStorage.setItem("last_payment_order", orderId);
                handlePayment(amount, orderId, type);
            }
        }
    }, [searchParams]);

    const handlePayment = async (amount, orderId, type) => {
        setStatus("processing");
        // Redirect to the Apache server where PHP is executed
        const host = window.location.origin;
        window.location.href = `${host}/api/initiate.php?order_id=${orderId}&amount=${amount}&type=${type || 'product'}`;
    };

    const handleRetry = () => {
        // Clear session check to allow retry
        sessionStorage.removeItem("last_payment_order");
        window.location.reload();
    };

    const handleCancel = () => {
        sessionStorage.removeItem("last_payment_order");
        window.location.href = "/dashboard";
    };

    if (status === "cancelled") {
        return (
            <Box sx={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", bgcolor: "#f5f5f5" }}>
                <Paper sx={{ p: 4, borderRadius: 4, width: 350, textAlign: "center" }}>
                    <Alert severity="warning" sx={{ mb: 2, justifyContent: 'center' }}>Payment Interrupted</Alert>
                    <Typography variant="h6" sx={{ mb: 3 }}>
                        Did you cancel the payment?
                    </Typography>
                    <Button variant="contained" fullWidth onClick={handleRetry} sx={{ mb: 1, bgcolor: "#673ab7" }}>
                        Retry Payment
                    </Button>
                    <Button variant="text" fullWidth onClick={handleCancel}>
                        Cancel & Return
                    </Button>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", bgcolor: "#fff" }}>
            <CircularProgress size={50} sx={{ color: "#673ab7" }} />
        </Box>
    );
};

export default PhonePePayment;
