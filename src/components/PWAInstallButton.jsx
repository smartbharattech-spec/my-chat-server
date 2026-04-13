import { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import DownloadIcon from '@mui/icons-material/Download';
import { useAuth } from '../services/AuthService';

const PWAInstallButton = () => {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const { isLoggedIn } = useAuth();

    useEffect(() => {
        const handler = (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setInstallPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsVisible(false);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!installPrompt) return;

        // Show the prompt
        installPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await installPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setInstallPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <Button
            variant="contained"
            color="secondary"
            startIcon={<DownloadIcon />}
            onClick={handleInstallClick}
            sx={{
                position: 'fixed',
                bottom: 20,
                right: 20,
                zIndex: 9999,
                borderRadius: '50px',
                padding: '10px 20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                textTransform: 'none',
                fontWeight: 'bold'
            }}
        >
            Install App
        </Button>
    );
};

export default PWAInstallButton;
