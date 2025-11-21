
import React, { useState, useRef, useEffect } from 'react';
import { Collaborator, UserRole } from '../types';
import { ClipboardListIcon, OfficeBuildingIcon, UserGroupIcon, LogoutIcon, UserIcon, MenuIcon, FaKey, FaBell, FaUsers, FaFingerprint, FaClipboardList, FaUserShield, FaDatabase } from './common/Icons';
import { FaShapes, FaTags, FaChartBar, FaTicketAlt, FaSitemap, FaSync, FaGlobe, FaNetworkWired, FaShieldAlt, FaDownload, FaBoxOpen, FaServer, FaLock, FaUnlock, FaColumns } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';
import { useLayout } from '../contexts/LayoutContext';
import MFASetupModal from './MFASetupModal';
import AuditLogModal from './AuditLogModal';
import DatabaseSchemaModal from './DatabaseSchemaModal';

interface HeaderProps {
  currentUser: Collaborator | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onResetData?: () => void;
  tabConfig: Record<string, any>;
  notificationCount: number;
  onNotificationClick: () => void;
}

const TabButton = ({ tab, label, icon, activeTab, setActiveTab, isDropdownItem = false, className = '' }: { tab: string, label: string, icon: React.ReactNode, activeTab: string, setActiveTab: (tab: string) => void, isDropdownItem?: boolean, className?: string }) => (
    <button
        onClick={(e) => { e.preventDefault(); setActiveTab(tab); }}
        className={`flex items-center gap-2 w-full text-left transition-colors duration-200 rounded-md ${
            isDropdownItem 
            ? `px-4 py-2 text-sm ${activeTab === tab ? 'bg-brand-secondary text-white' : 'text-on-surface-dark hover:bg-gray-700'}` 
            : `px-3 py-2 text-sm font-medium ${activeTab === tab ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`
        } ${className}`}
        role={isDropdownItem ? 'menuitem' : 'tab'}
        aria-current={activeTab === tab ? 'page' : undefined}
    >
        {icon}
        <span>{label}</span>
    </button>
);


const Header: React.FC<HeaderProps> = ({ currentUser, activeTab, setActiveTab, onLogout, onResetData, tabConfig, notificationCount, onNotificationClick }) => {
    const { t, language, setLanguage } = useLanguage();
    const { layoutMode, setLayoutMode } = useLayout();
    const [isOrganizacaoMenuOpen, setOrganizacaoMenuOpen] = useState(false);
    const organizacaoMenuRef = useRef<HTMLDivElement>(null);
    const [isInventarioMenuOpen, setInventarioMenuOpen] = useState(false);
    const inventarioMenuRef = useRef<HTMLDivElement>(null);
    const [isNis2MenuOpen, setIsNis2MenuOpen] = useState(false);
    const nis2MenuRef = useRef<HTMLDivElement>(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const [isTicketsMenuOpen, setIsTicketsMenuOpen] = useState(false);
    const ticketsMenuRef = useRef<HTMLDivElement>(null);

    // Security Modals
    const [showMFA, setShowMFA] = useState(false);
    const [showAudit, setShowAudit] = useState(false);
    const [showDbSchema, setShowDbSchema] = useState(false);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    
    // PWA Install Prompt State
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault(); // Prevent the mini-infobar from appearing on mobile
            setDeferredPrompt(e); // Stash the event so it can be triggered later.
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallApp = () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }
            setDeferredPrompt(null);
        });
    };

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (organizacaoMenuRef.current && !organizacaoMenuRef.current.contains(event.target as Node)) {
                setOrganizacaoMenuOpen(false);
            }
             if (inventarioMenuRef.current && !inventarioMenuRef.current.contains(event.target as Node)) {
                setInventarioMenuOpen(false);
            }
             if (nis2MenuRef.current && !nis2MenuRef.current.contains(event.target as Node)) {
                setIsNis2MenuOpen(false);
            }
             if (ticketsMenuRef.current && !ticketsMenuRef.current.contains(event.target as Node)) {
                setIsTicketsMenuOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
            if (isMobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && mobileMenuButtonRef.current && !mobileMenuButtonRef.current.contains(event.target as Node)) {
                setIsMobileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMobileMenuOpen, isOrganizacaoMenuOpen, isInventarioMenuOpen, isNis2MenuOpen, isUserMenuOpen, isTicketsMenuOpen]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setOrganizacaoMenuOpen(false);
        setInventarioMenuOpen(false);
        setIsNis2MenuOpen(false);
        setIsTicketsMenuOpen(false);
        setIsMobileMenuOpen(false);
    }
    
    // Logic to keep mobile menus open if a child is active
    const isOrganizationActive = activeTab.startsWith('organizacao') || activeTab === 'collaborators';
    const isInventoryActive = activeTab.startsWith('equipment') || activeTab === 'licensing';
    const isNis2Active = activeTab.startsWith('nis2');
    const isTicketsActive = activeTab.startsWith('tickets');

    const [isMobileOrganizacaoOpen, setIsMobileOrganizacaoOpen] = useState(isOrganizationActive);
    const [isMobileInventarioOpen, setIsMobileInventarioOpen] = useState(isInventoryActive);
    const [isMobileNis2Open, setIsMobileNis2Open] = useState(isNis2Active);
    const [isMobileTicketsOpen, setIsMobileTicketsOpen] = useState(isTicketsActive);

    useEffect(() => {
        if (isOrganizationActive) setIsMobileOrganizacaoOpen(true);
        if (isInventoryActive) setIsMobileInventarioOpen(true);
        if (isNis2Active) setIsMobileNis2Open(true);
        if (isTicketsActive) setIsMobileTicketsOpen(true);
    }, [activeTab, isInventoryActive, isOrganizationActive, isNis2Active, isTicketsActive]);

    // Define if the main menu item should be visible based on children availability
    const hasOrganizacaoTabs = tabConfig['organizacao.instituicoes'] || tabConfig['organizacao.entidades'] || tabConfig['collaborators'] || tabConfig['organizacao.teams'] || tabConfig['organizacao.suppliers'];
    const hasInventarioTabs = tabConfig['licensing'] || tabConfig['equipment.inventory'] || tabConfig['equipment.brands'] || tabConfig['equipment.types'];
    // Access nested properties safely for NIS2 and Tickets
    const hasNis2Tabs = tabConfig.nis2?.bia || tabConfig.nis2?.security || tabConfig.nis2?.backups;
    const hasTicketTabs = tabConfig['tickets'];
    const hasTicketCategories = tabConfig.tickets?.categories;
    const hasIncidentTypes = tabConfig.tickets?.incident_types;
    
    const isAdmin = currentUser?.role === UserRole.Admin;

  return (
    <>
    <header className="bg-gray-800 shadow-lg relative z-30">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          <div className="flex items-center flex-shrink-0">
            <span className="font-bold text-2xl text-white">
              AI<span className="text-brand-secondary">Manager</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-2">
              {tabConfig['overview'] && <TabButton tab="overview" label={tabConfig['overview']} icon={<FaChartBar />} activeTab={activeTab} setActiveTab={handleTabChange}/>}
              
              {/* 1. Organização */}
              {hasOrganizacaoTabs && (
                <div className="relative" ref={organizacaoMenuRef}>
                    <button
                        onClick={() => setOrganizacaoMenuOpen(prev => !prev)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isOrganizationActive ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}
                        aria-haspopup="true"
                        aria-expanded={isOrganizacaoMenuOpen}
                    >
                        <FaSitemap />
                        {t('nav.organization')}
                        <svg className={`w-4 h-4 ml-1 transition-transform transform ${isOrganizacaoMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {isOrganizacaoMenuOpen && (
                        <div className="absolute z-20 mt-2 w-60 origin-top-left rounded-md shadow-lg bg-surface-dark ring-1 ring-black ring-opacity-5" role="menu" aria-orientation="vertical">
                            <div className="py-1">
                                {tabConfig['organizacao.instituicoes'] && <TabButton tab="organizacao.instituicoes" label={tabConfig['organizacao.instituicoes']} icon={<FaSitemap className="h-5 w-5" />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />}
                                {tabConfig['organizacao.entidades'] && <TabButton tab="organizacao.entidades" label={tabConfig['organizacao.entidades']} icon={<OfficeBuildingIcon className="h-5 w-5" />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />}
                                {tabConfig['collaborators'] && <TabButton tab="collaborators" label={tabConfig['collaborators']} icon={<UserGroupIcon className="h-5 w-5"/>} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} className="pl-8" />}
                                {tabConfig['organizacao.teams'] && <TabButton tab="organizacao.teams" label={tabConfig['organizacao.teams']} icon={<FaUsers className="h-5 w-5" />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} className="pl-8" />}
                                {tabConfig['organizacao.suppliers'] && <TabButton tab="organizacao.suppliers" label={tabConfig['organizacao.suppliers']} icon={<FaShieldAlt className="h-5 w-5" />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />}
                            </div>
                        </div>
                    )}
                </div>
              )}

              {/* 2. Inventário / Assets */}
              {hasInventarioTabs && (
                 <div className="relative" ref={inventarioMenuRef}>
                    <button
                        onClick={() => setInventarioMenuOpen(prev => !prev)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isInventoryActive ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}
                        aria-haspopup="true"
                        aria-expanded={isInventarioMenuOpen}
                    >
                        <FaBoxOpen className="h-5 w-5"/>
                        {t('nav.inventory')}
                        <svg className={`w-4 h-4 ml-1 transition-transform transform ${isInventarioMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {isInventarioMenuOpen && (
                        <div className="absolute z-20 mt-2 w-60 origin-top-left rounded-md shadow-lg bg-surface-dark ring-1 ring-black ring-opacity-5" role="menu" aria-orientation="vertical">
                            <div className="py-1">
                                {tabConfig['equipment.inventory'] && <TabButton tab="equipment.inventory" label={t('nav.assets_inventory')} icon={<ClipboardListIcon className="h-5 w-5" />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />}
                                {tabConfig['equipment.brands'] && <TabButton tab="equipment.brands" label={tabConfig['equipment.brands']} icon={<FaTags />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} className="pl-8"/>}
                                {tabConfig['equipment.types'] && <TabButton tab="equipment.types" label={tabConfig['equipment.types']} icon={<FaShapes />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} className="pl-8" />}
                                {tabConfig['licensing'] && <TabButton tab="licensing" label={tabConfig['licensing']} icon={<FaKey className="h-5 w-5" />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />}
                            </div>
                        </div>
                    )}
                </div>
              )}

              {/* 3. Norma (NIS2) / Compliance */}
              {hasNis2Tabs && (
                 <div className="relative" ref={nis2MenuRef}>
                    <button
                        onClick={() => setIsNis2MenuOpen(prev => !prev)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isNis2Active ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}
                        aria-haspopup="true"
                        aria-expanded={isNis2MenuOpen}
                    >
                        <FaShieldAlt className="h-5 w-5"/>
                        {tabConfig.nis2?.title || 'Compliance'}
                        {isNis2MenuOpen ? (
                            <FaUnlock className="w-4 h-4 ml-1 text-brand-secondary" />
                        ) : (
                            <FaLock className="w-4 h-4 ml-1 text-gray-400" />
                        )}
                    </button>
                    {isNis2MenuOpen && (
                        <div className="absolute z-20 mt-2 w-60 origin-top-left rounded-md shadow-lg bg-surface-dark ring-1 ring-black ring-opacity-5" role="menu" aria-orientation="vertical">
                            <div className="py-1">
                                {tabConfig.nis2?.bia && <TabButton tab="nis2.bia" label={tabConfig.nis2.bia} icon={<FaNetworkWired className="h-5 w-5" />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />}
                                {tabConfig.nis2?.security && <TabButton tab="nis2.security" label={tabConfig.nis2.security} icon={<FaShieldAlt className="h-5 w-5" />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />}
                                {tabConfig.nis2?.backups && <TabButton tab="nis2.backups" label={tabConfig.nis2.backups} icon={<FaServer className="h-5 w-5" />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />}
                            </div>
                        </div>
                    )}
                </div>
              )}
              
              {/* 4. Suporte */}
              {hasTicketTabs && (
                   <div className="relative" ref={ticketsMenuRef}>
                     <button
                        onClick={() => {
                            if (hasTicketCategories || hasIncidentTypes) {
                                setIsTicketsMenuOpen(prev => !prev);
                            } else {
                                handleTabChange('tickets.list');
                            }
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isTicketsActive ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}
                        aria-haspopup={hasTicketCategories || hasIncidentTypes ? "true" : "false"}
                        aria-expanded={isTicketsMenuOpen}
                     >
                        <FaTicketAlt />
                        {tabConfig.tickets?.title || 'Tickets'}
                        {(hasTicketCategories || hasIncidentTypes) && (
                            <svg className={`w-4 h-4 ml-1 transition-transform transform ${isTicketsMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        )}
                     </button>
                     {isTicketsMenuOpen && (hasTicketCategories || hasIncidentTypes) ? (
                        <div className="absolute z-20 mt-2 w-60 origin-top-left rounded-md shadow-lg bg-surface-dark ring-1 ring-black ring-opacity-5" role="menu" aria-orientation="vertical">
                             <div className="py-1">
                                <TabButton tab="tickets.list" label={tabConfig.tickets?.list || 'Tickets'} icon={<FaTicketAlt />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />
                                {hasTicketCategories && <TabButton tab="tickets.categories" label={tabConfig.tickets.categories} icon={<FaTags />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} className="pl-8" />}
                                {hasIncidentTypes && <TabButton tab="tickets.incident_types" label={tabConfig.tickets.incident_types} icon={<FaShieldAlt />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} className="pl-8" />}
                             </div>
                        </div>
                     ) : null}
                   </div>
              )}
          </nav>

          <div className="flex-1 flex items-center justify-end gap-4">
             {deferredPrompt && (
                <button
                    onClick={handleInstallApp}
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition-colors animate-bounce"
                    title="Instalar Aplicação"
                >
                    <FaDownload />
                    Instalar App
                </button>
             )}

             {/* Language Switcher */}
            <button
                onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-700 hover:bg-gray-600 text-xs text-white transition-colors border border-gray-600"
                title={language === 'pt' ? 'Switch to English' : 'Mudar para Português'}
            >
                <FaGlobe className="text-brand-secondary" />
                <span className="font-bold">{language.toUpperCase()}</span>
            </button>

            <button
                onClick={onNotificationClick}
                className="relative p-2 rounded-md text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white transition-colors"
                title={t('common.notifications')}
                aria-label={t('common.notifications')}
            >
                <FaBell className="h-5 w-5" />
                {notificationCount > 0 && (
                    <span className="absolute top-1 right-1 block h-3 w-3 rounded-full bg-red-500 border-2 border-gray-800" />
                )}
            </button>

             {currentUser && (
                <div className="relative" ref={userMenuRef}>
                    <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex items-center gap-2 text-sm text-on-surface-dark-secondary hover:text-white"
                    >
                        <div className="hidden sm:flex items-center gap-2">
                             {currentUser.photoUrl ? (
                                <img src={currentUser.photoUrl} alt={currentUser.fullName} className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                                 <UserIcon className="h-5 w-5 text-brand-secondary"/>
                            )}
                            <span>{t('common.welcome')}, {currentUser.fullName}</span>
                        </div>
                    </button>
                    
                    {isUserMenuOpen && (
                        <div className="absolute right-0 z-20 mt-2 w-56 origin-top-right rounded-md shadow-lg bg-surface-dark ring-1 ring-black ring-opacity-5 divide-y divide-gray-700" role="menu">
                             <div className="py-1">
                                <button onClick={() => setLayoutMode('side')} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-on-surface-dark hover:bg-gray-700" role="menuitem">
                                    <FaColumns className="text-blue-400" />
                                    Menu Lateral
                                </button>
                                <button onClick={() => setShowMFA(true)} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-on-surface-dark hover:bg-gray-700" role="menuitem">
                                    <FaFingerprint className="text-brand-secondary" />
                                    Configurar 2FA
                                </button>
                                {isAdmin && (
                                    <>
                                        <button onClick={() => setShowAudit(true)} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-on-surface-dark hover:bg-gray-700" role="menuitem">
                                            <FaClipboardList className="text-yellow-400" />
                                            Logs de Auditoria
                                        </button>
                                        <button onClick={() => setShowDbSchema(true)} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-on-surface-dark hover:bg-gray-700" role="menuitem">
                                            <FaDatabase className="text-green-400" />
                                            Configuração BD
                                        </button>
                                    </>
                                )}
                             </div>
                             <div className="py-1">
                                <button onClick={onLogout} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-700" role="menuitem">
                                    <LogoutIcon className="h-4 w-4" />
                                    {t('common.logout')}
                                </button>
                             </div>
                        </div>
                    )}
                </div>
             )}

             <div className="flex items-center md:hidden">
                <button
                    ref={mobileMenuButtonRef}
                    onClick={() => setIsMobileMenuOpen(prev => !prev)}
                    className="inline-flex items-center justify-center p-2 rounded-md text-on-surface-dark-secondary hover:text-white hover:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    aria-controls="mobile-menu"
                    aria-expanded={isMobileMenuOpen}
                >
                    <span className="sr-only">Abrir menu principal</span>
                    <MenuIcon className="h-6 w-6" />
                </button>
            </div>
          </div>
        </div>
      </div>

       {isMobileMenuOpen && (
            <div ref={mobileMenuRef} className="md:hidden" id="mobile-menu">
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    {deferredPrompt && (
                        <button
                            onClick={handleInstallApp}
                            className="w-full flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700 transition-colors mb-2"
                        >
                            <FaDownload />
                            Instalar Aplicação
                        </button>
                    )}

                    {tabConfig['overview'] && <TabButton tab="overview" label={tabConfig['overview']} icon={<FaChartBar />} activeTab={activeTab} setActiveTab={handleTabChange} isDropdownItem/>}
                    
                    {/* 1. Organização Mobile */}
                    {hasOrganizacaoTabs && (
                        <div>
                            <button
                                onClick={() => setIsMobileOrganizacaoOpen(prev => !prev)}
                                className={`flex items-center justify-between w-full text-left transition-colors duration-200 px-4 py-2 text-sm rounded-md ${isOrganizationActive ? 'bg-brand-secondary text-white' : 'text-on-surface-dark hover:bg-gray-700'}`}
                                aria-expanded={isMobileOrganizacaoOpen}
                            >
                                <div className="flex items-center gap-2">
                                    <FaSitemap />
                                    <span>{t('nav.organization')}</span>
                                </div>
                                <svg className={`w-4 h-4 ml-1 transition-transform transform ${isMobileOrganizacaoOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {isMobileOrganizacaoOpen && (
                                <div className="pl-4 mt-1 space-y-1">
                                    {tabConfig['organizacao.instituicoes'] && <TabButton tab="organizacao.instituicoes" label={tabConfig['organizacao.instituicoes']} icon={<FaSitemap className="h-5 w-5" />} isDropdownItem activeTab={activeTab} setActiveTab={handleTabChange} />}
                                    {tabConfig['organizacao.entidades'] && <TabButton tab="organizacao.entidades" label={tabConfig['organizacao.entidades']} icon={<OfficeBuildingIcon className="h-5 w-5" />} isDropdownItem activeTab={activeTab} setActiveTab={handleTabChange} />}
                                    {tabConfig['collaborators'] && <TabButton tab="collaborators" label={tabConfig['collaborators']} icon={<UserGroupIcon className="h-5 w-5"/>} activeTab={activeTab} setActiveTab={handleTabChange} isDropdownItem className="pl-4" />}
                                    {tabConfig['organizacao.teams'] && <TabButton tab="organizacao.teams" label={tabConfig['organizacao.teams']} icon={<FaUsers className="h-5 w-5" />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} className="pl-4" />}
                                    {tabConfig['organizacao.suppliers'] && <TabButton tab="organizacao.suppliers" label={tabConfig['organizacao.suppliers']} icon={<FaShieldAlt className="h-5 w-5" />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* 2. Inventário / Assets Mobile */}
                     {hasInventarioTabs && (
                        <div>
                            <button
                                onClick={() => setIsMobileInventarioOpen(prev => !prev)}
                                className={`flex items-center justify-between w-full text-left transition-colors duration-200 px-4 py-2 text-sm rounded-md ${isInventoryActive ? 'bg-brand-secondary text-white' : 'text-on-surface-dark hover:bg-gray-700'}`}
                                aria-expanded={isMobileInventarioOpen}
                            >
                                <div className="flex items-center gap-2">
                                    <FaBoxOpen className="h-5 w-5"/>
                                    <span>{t('nav.inventory')}</span>
                                </div>
                                <svg className={`w-4 h-4 ml-1 transition-transform transform ${isMobileInventarioOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {isMobileInventarioOpen && (
                                <div className="pl-4 mt-1 space-y-1">
                                    {tabConfig['equipment.inventory'] && <TabButton tab="equipment.inventory" label={t('nav.assets_inventory')} icon={<ClipboardListIcon className="h-5 w-5" />} isDropdownItem activeTab={activeTab} setActiveTab={handleTabChange} />}
                                    {tabConfig['equipment.brands'] && <TabButton tab="equipment.brands" label={tabConfig['equipment.brands']} icon={<FaTags />} isDropdownItem activeTab={activeTab} setActiveTab={handleTabChange} className="pl-4" />}
                                    {tabConfig['equipment.types'] && <TabButton tab="equipment.types" label={tabConfig['equipment.types']} icon={<FaShapes />} isDropdownItem activeTab={activeTab} setActiveTab={handleTabChange} className="pl-4" />}
                                    {tabConfig['licensing'] && <TabButton tab="licensing" label={tabConfig['licensing']} icon={<FaKey />} activeTab={activeTab} setActiveTab={handleTabChange} isDropdownItem />}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* 3. Norma (NIS2) / Compliance Mobile */}
                    {hasNis2Tabs && (
                        <div>
                            <button
                                onClick={() => setIsMobileNis2Open(prev => !prev)}
                                className={`flex items-center justify-between w-full text-left transition-colors duration-200 px-4 py-2 text-sm rounded-md ${isNis2Active ? 'bg-brand-secondary text-white' : 'text-on-surface-dark hover:bg-gray-700'}`}
                                aria-expanded={isMobileNis2Open}
                            >
                                <div className="flex items-center gap-2">
                                    <FaShieldAlt className="h-5 w-5"/>
                                    <span>{tabConfig.nis2?.title || 'Compliance'}</span>
                                </div>
                                {isMobileNis2Open ? (
                                    <FaUnlock className="w-4 h-4 ml-1 text-brand-secondary" />
                                ) : (
                                    <FaLock className="w-4 h-4 ml-1 text-gray-400" />
                                )}
                            </button>
                            {isMobileNis2Open && (
                                <div className="pl-4 mt-1 space-y-1">
                                    {tabConfig.nis2?.bia && <TabButton tab="nis2.bia" label={tabConfig.nis2.bia} icon={<FaNetworkWired />} activeTab={activeTab} setActiveTab={handleTabChange} isDropdownItem />}
                                    {tabConfig.nis2?.security && <TabButton tab="nis2.security" label={tabConfig.nis2.security} icon={<FaShieldAlt />} activeTab={activeTab} setActiveTab={handleTabChange} isDropdownItem />}
                                    {tabConfig.nis2?.backups && <TabButton tab="nis2.backups" label={tabConfig.nis2.backups} icon={<FaServer />} activeTab={activeTab} setActiveTab={handleTabChange} isDropdownItem />}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 4. Suporte Mobile */}
                    {hasTicketTabs && (
                        <div>
                            <button
                                onClick={() => {
                                    if (hasTicketCategories || hasIncidentTypes) {
                                        setIsMobileTicketsOpen(prev => !prev);
                                    } else {
                                        handleTabChange('tickets.list');
                                        setIsMobileMenuOpen(false);
                                    }
                                }}
                                className={`flex items-center justify-between w-full text-left transition-colors duration-200 px-4 py-2 text-sm rounded-md ${isTicketsActive ? 'bg-brand-secondary text-white' : 'text-on-surface-dark hover:bg-gray-700'}`}
                                aria-expanded={isMobileTicketsOpen}
                            >
                                <div className="flex items-center gap-2">
                                    <FaTicketAlt />
                                    <span>{tabConfig.tickets?.title || 'Tickets'}</span>
                                </div>
                                {(hasTicketCategories || hasIncidentTypes) && (
                                     <svg className={`w-4 h-4 ml-1 transition-transform transform ${isMobileTicketsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                )}
                            </button>
                            {isMobileTicketsOpen && (hasTicketCategories || hasIncidentTypes) ? (
                                 <div className="pl-4 mt-1 space-y-1">
                                    <TabButton tab="tickets.list" label={tabConfig.tickets?.list || 'Tickets'} icon={<FaTicketAlt />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />
                                    {hasTicketCategories && <TabButton tab="tickets.categories" label={tabConfig.tickets.categories} icon={<FaTags />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} className="pl-4" />}
                                    {hasIncidentTypes && <TabButton tab="tickets.incident_types" label={tabConfig.tickets.incident_types} icon={<FaShieldAlt />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} className="pl-4" />}
                                 </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>
        )}
    </header>
    
    {showMFA && <MFASetupModal onClose={() => setShowMFA(false)} />}
    {showAudit && <AuditLogModal onClose={() => setShowAudit(false)} />}
    {showDbSchema && <DatabaseSchemaModal onClose={() => setShowDbSchema(false)} />}
    </>
  );
};

export default Header;
