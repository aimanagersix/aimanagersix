
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type LayoutMode = 'top' | 'side';

interface LayoutContextType {
    layoutMode: LayoutMode;
    setLayoutMode: (mode: LayoutMode) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
        const saved = localStorage.getItem('app_layout_mode');
        return (saved === 'top' || saved === 'side') ? saved : 'top';
    });

    useEffect(() => {
        localStorage.setItem('app_layout_mode', layoutMode);
    }, [layoutMode]);

    return (
        <LayoutContext.Provider value={{ layoutMode, setLayoutMode }}>
            {children}
        </LayoutContext.Provider>
    );
};

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (context === undefined) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};
