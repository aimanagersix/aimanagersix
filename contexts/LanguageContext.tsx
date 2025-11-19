
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { translations } from '../i18n/translations';

type Language = 'pt' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(() => {
        const saved = localStorage.getItem('app_language');
        return (saved === 'pt' || saved === 'en') ? saved : 'pt';
    });

    useEffect(() => {
        localStorage.setItem('app_language', language);
    }, [language]);

    const t = (key: string): string => {
        const keys = key.split('.');
        let current: any = translations[language];
        
        // Try to find the key directly first
        if (current[key]) return current[key];

        // If not found, try basic traversal (though flat structure is used in translations.ts)
        for (const k of keys) {
            if (current[k] === undefined) {
                console.warn(`Translation missing for key: ${key} in language: ${language}`);
                return key;
            }
            current = current[k];
        }
        
        return typeof current === 'string' ? current : key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
