
import React, { useState, useRef, useEffect } from 'react';
import { Collaborator, UserRole, ModuleKey, PermissionAction } from '../types';
import { FaUserCircle, FaColumns, FaFingerprint, FaMobileAlt, FaCog, FaClipboardList, FaDatabase, FaDoorOpen as LogoutIcon, FaChevronDown } from './common/Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useLayout } from '../contexts/LayoutContext';
import MFASetupModal from './MFASetupModal';
import AuditLogModal from './AuditLogModal';
import DatabaseSchemaModal from './DatabaseSchemaModal';
import InstallAppButton from './InstallAppButton';

interface UserMenuProps {
    currentUser: Collaborator;
    onLogout: () => void;
    onOpenProfile: () => void;
    setActiveTab: (tab: string) => void;
    checkPermission: (module: ModuleKey, action: PermissionAction) => boolean;
    align?: 'up' | 'down';
}

const UserMenu: React.FC<UserMenuProps> = ({ currentUser, onLogout, onOpenProfile, setActiveTab, checkPermission, align = 'down' }) => {
    const { t, setLanguage, language } = useLanguage();
    const { layoutMode, setLayoutMode } = useLayout();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const [showMFA, setShowMFA] = useState(false);
    const [showAudit, setShowAudit] = useState(false);
    const [showDbSchema, setShowDbSchema] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isAdmin = currentUser.role === 'Admin' || currentUser.role === 'SuperAdmin' || currentUser.role === UserRole.Admin || currentUser.role === UserRole.SuperAdmin;
    const isSuperAdmin = currentUser.role === 'SuperAdmin' || currentUser.role === UserRole.SuperAdmin;

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-800 transition-colors w-full">
                {/* FIX: photo_url */}
                {currentUser.photo_url ? (
                    <img src={currentUser.photo_url} alt={currentUser.full_name} className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                    // FIX: full_name
                    <div className="h-8 w-8 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-white text-xs flex-shrink-0">{currentUser.full_name.charAt(0)}</div>
                )}
                <div className="hidden md:block text-left overflow-hidden flex-grow">
                    {/* FIX: full_name */}
                    <p className="text-xs font-bold text-white truncate">{currentUser.full_name}</p>
                    <p className="text-[10px] text-gray-500 uppercase">{currentUser.role}</p>
                </div>
                <FaChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className={`absolute right-0 ${align === 'up' ? 'bottom-full mb-2' : 'mt-2'} w-64 rounded-md bg-surface-dark shadow-2xl ring-1 ring-black ring-opacity-5 z-[100] overflow-hidden border border-gray-700`}>
                    <div className="px-4 py-3 border-b border-gray-700 bg-gray-900/50">
                        {/* FIX: full_name */}
                        <p className="text-sm text-white font-medium truncate">{currentUser.full_name}</p>
                        <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
                    </div>
                    <div className="py-1">
                        <button onClick={() => { onOpenProfile(); setIsOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                            <FaUserCircle className="mr-3 text-brand-secondary" /> {t('common.profile')}
                        </button>
                        <button onClick={() => { setLayoutMode(layoutMode === 'side' ? 'top' : 'side'); setIsOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                            <FaColumns className="mr-3 text-gray-400" /> {layoutMode === 'side' ? 'Menu Superior' : 'Menu Lateral'}
                        </button>
                        <button onClick={() => { setShowMFA(true); setIsOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                            <FaFingerprint className="mr-3 text-brand-secondary" /> {t('common.setup_2fa')}
                        </button>
                        
                        <div className="px-4 py-2 border-b border-gray-700/50 mb-1 flex justify-between items-center bg-gray-900/30">
                            <div className="flex gap-2">
                                <button onClick={() => setLanguage('pt')} className={`w-8 h-6 flex items-center justify-center rounded text-[10px] font-bold ${language === 'pt' ? 'bg-brand-primary text-white border border-brand-secondary' : 'bg-gray-700 text-gray-400 border border-transparent'}`}>PT</button>
                                <button onClick={() => setLanguage('en')} className={`w-8 h-6 flex items-center justify-center rounded text-[10px] font-bold ${language === 'en' ? 'bg-brand-primary text-white border border-brand-secondary' : 'bg-gray-700 text-gray-400 border border-transparent'}`}>EN</button>
                            </div>
                            <span className="text-[10px] text-gray-500 uppercase font-bold">Língua</span>
                        </div>

                        <div className="px-4 py-2"><InstallAppButton className="w-full py-2 text-xs font-bold text-gray-900 bg-brand-secondary rounded-md" label="Instalar App" icon={<FaMobileAlt />} /></div>
                        
                        {isAdmin && (
                            <>
                                <button onClick={() => { setActiveTab('settings'); setIsOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                                    <FaCog className="mr-3 text-brand-secondary" /> {t('common.settings')}
                                </button>
                                <button onClick={() => { setShowAudit(true); setIsOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                                    <FaClipboardList className="mr-3 text-yellow-400" /> {t('common.audit')}
                                </button>
                                {isSuperAdmin && (
                                    <button onClick={() => { setShowDbSchema(true); setIsOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                                        <FaDatabase className="mr-3 text-green-400" /> {t('common.database')}
                                    </button>
                                )}
                            </>
                        )}
                        <button onClick={onLogout} className="flex w-full items-center px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 border-t border-gray-700 mt-1">
                            <LogoutIcon className="mr-3" /> {t('common.logout')}
                        </button>
                    </div>
                </div>
            )}

            {showMFA && <MFASetupModal onClose={() => setShowMFA(false)} />}
            {showAudit && <AuditLogModal onClose={() => setShowAudit(false)} />}
            {showDbSchema && <DatabaseSchemaModal onClose={() => setShowDbSchema(false)} />}
        </div>
    );
};

export default UserMenu;
