import React, { useEffect, useState } from 'react';
import { FaDownload, FaMobileAlt } from 'react-icons/fa';

interface InstallAppButtonProps {
    className?: string;
    label?: string;
    icon?: React.ReactNode;
}

const InstallAppButton: React.FC<InstallAppButtonProps> = ({ 
    className = "flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors shadow-lg", 
    label = "Instalar App",
    icon
}) => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstallable(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            setIsInstallable(false);
        }
        
        setDeferredPrompt(null);
    };

    if (!isInstallable) return null;

    return (
        <button onClick={handleInstall} className={className}>
            {icon || <FaDownload />}
            <span>{label}</span>
        </button>
    );
};

export default InstallAppButton;