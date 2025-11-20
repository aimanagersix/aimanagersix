import React, { useState, useRef, useEffect } from 'react';
import { Collaborator, UserRole } from '../types';
import { ClipboardListIcon, OfficeBuildingIcon, UserGroupIcon, LogoutIcon, UserIcon, MenuIcon, FaKey, FaBell, FaUsers, FaFingerprint, FaClipboardList, FaUserShield } from './common/Icons';
import { FaShapes, FaTags, FaChartBar, FaTicketAlt, FaSitemap, FaSync, FaGlobe } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';
import MFASetupModal from './MFASetupModal';
import AuditLogModal from './AuditLogModal';

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

const TabButton = ({ tab, label, icon, activeTab, setActiveTab, isDropdownItem = false }: { tab: string, label: string, icon: React.ReactNode, activeTab: string, setActiveTab: (tab: string) => void, isDropdownItem?: boolean }) => (
    <button
        onClick={(e) => { e.preventDefault(); setActiveTab(tab); }}
        className={`flex items-center gap-2 w-full text-left transition-colors duration-200 rounded-md ${
            isDropdownItem 
            ? `px-4 py-2 text-sm ${activeTab === tab ? 'bg-brand-secondary text-white' : 'text-on-surface-dark hover:bg-gray-700'}` 
            : `px-3 py-2 text-sm font-medium ${activeTab === tab ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`
        }`}
        role={isDropdownItem ? 'menuitem' : 'tab'}
        aria-current={activeTab === tab ? 'page' : undefined}
    >
        {icon}
        <span>{label}</span>
    </button>
);


const Header: React.FC<HeaderProps> = ({ currentUser, activeTab, setActiveTab, onLogout, onResetData, tabConfig, notificationCount, onNotificationClick }) => {
    const { t, language, setLanguage } = useLanguage();
    const [isOrganizacaoMenuOpen, setOrganizacaoMenuOpen] = useState(false);
    const organizacaoMenuRef = useRef<HTMLDivElement>(null);
    const [isInventarioMenuOpen, setInventarioMenuOpen] = useState(false);
    const inventarioMenuRef = useRef<HTMLDivElement>(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const [isTicketsMenuOpen, setIsTicketsMenuOpen] = useState(false);
    const ticketsMenuRef = useRef<HTMLDivElement>(null);

    // Security Modals
    const [showMFA, setShowMFA] = useState(false);
    const [showAudit, setShowAudit] = useState(false);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (organizacaoMenuRef.current && !organizacaoMenuRef.current.contains(event.target as Node)) {
                setOrganizacaoMenuOpen(false);
            }
             if (inventarioMenuRef.current && !inventarioMenuRef.current.contains(event.target as Node)) {
                setInventarioMenuOpen(false);
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
    }, [isMobileMenuOpen, isOrganizacaoMenuOpen, isInventarioMenuOpen, isUserMenuOpen, isTicketsMenuOpen]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setOrganizacaoMenuOpen(false);
        setInventarioMenuOpen(false);
        setIsTicketsMenuOpen(false);
        setIsMobileMenuOpen(false);
    }
    
    // Logic to keep mobile menus open if a child is active
    const isInventoryActive = activeTab.startsWith('equipment') || activeTab === 'licensing';
    const isOrganizationActive = activeTab.startsWith('organizacao') || activeTab === 'collaborators';
    const isTicketsActive = activeTab.startsWith('tickets');

    const [isMobileOrganizacaoOpen, setIsMobileOrganizacaoOpen] = useState(isOrganizationActive);
    const [isMobileInventarioOpen, setIsMobileInventarioOpen] = useState(isInventoryActive);
    const [isMobileTicketsOpen, setIsMobileTicketsOpen] = useState(isTicketsActive);

    useEffect(() => {
        if (isOrganizationActive) setIsMobileOrganizacaoOpen(true);
        if (isInventoryActive) setIsMobileInventarioOpen(true);
        if (isTicketsActive) setIsMobileTicketsOpen(true);
    }, [activeTab, isInventoryActive, isOrganizationActive, isTicketsActive]);

    // Define if the main menu item should be visible based on children availability
    const hasOrganizacaoTabs = tabConfig['organizacao.instituicoes'] || tabConfig['organizacao.entidades'] || tabConfig['collaborators'] || tabConfig['organizacao.teams'];
    const hasInventarioTabs = tabConfig['licensing'] || tabConfig['equipment.inventory'] || tabConfig['equipment.brands'] || tabConfig['equipment.types'];
    const hasTicketTabs = tabConfig['tickets'];
    const hasTicketCategories = tabConfig['tickets.categories'];
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
              
              {hasInventarioTabs && (
                 <div className="relative" ref={inventarioMenuRef}>
                    <button
                        onClick={() => setInventarioMenuOpen(prev => !prev)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isInventoryActive ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}
                        aria-haspopup="true"
                        aria-expanded={isInventarioMenuOpen}
                    >
                        <ClipboardListIcon className="h-5 w-5"/>
                        {t('nav.inventory')}
                        <svg className={`w-4 h-4 ml-1 transition-transform transform ${isInventarioMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {isInventarioMenuOpen && (
                        <div className="absolute z-20 mt-2 w-60 origin-top-left rounded-md shadow-lg bg-surface-dark ring-1 ring-black ring-opacity-5" role="menu" aria-orientation="vertical">
                            <div className="py-1">
                                {tabConfig['licensing'] && <TabButton tab="licensing" label={tabConfig['licensing']} icon={<FaKey className="h-5 w-5" />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />}
                                {tabConfig['equipment.inventory'] && <TabButton tab="equipment.inventory" label={tabConfig['equipment.inventory']} icon={<ClipboardListIcon className="h-5 w-5" />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />}
                                {tabConfig['equipment.brands'] && <TabButton tab="equipment.brands" label={tabConfig['equipment.brands']} icon={<FaTags />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />}
                                {tabConfig['equipment.types'] && <TabButton tab="equipment.types" label={tabConfig['equipment.types']} icon={<FaShapes />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />}
                            </div>
                        </div>
                    )}
                </div>
              )}

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
                                {tabConfig['collaborators'] && <TabButton tab="collaborators" label={tabConfig['collaborators']} icon={<UserGroupIcon className="h-5 w-5"/>} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />}
                                {tabConfig['organizacao.teams'] && <TabButton tab="organizacao.teams" label={tabConfig['organizacao.teams']} icon={<FaUsers className="h-5 w-5" />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />}
                            </div>
                        </div>
                    )}
                </div>
              )}

              {hasTicketTabs && (
                   <div className="relative" ref={ticketsMenuRef}>
                     <button
                        onClick={() => {
                            if (hasTicketCategories) {
                                setIsTicketsMenuOpen(prev => !prev);
                            } else {
                                handleTabChange('tickets.list');
                            }
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isTicketsActive ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}
                        aria-haspopup={hasTicketCategories ? "true" : "false"}
                        aria-expanded={isTicketsMenuOpen}
                     >
                        <FaTicketAlt />
                        {tabConfig['tickets'].title}
                        {hasTicketCategories && (
                            <svg className={`w-4 h-4 ml-1 transition-transform transform ${isTicketsMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        )}
                     </button>
                     {isTicketsMenuOpen && hasTicketCategories ? (
                        <div className="absolute z-20 mt-2 w-60 origin-top-left rounded-md shadow-lg bg-surface-dark ring-1 ring-black ring-opacity-5" role="menu" aria-orientation="vertical">
                             <div className="py-1">
                                <TabButton tab="tickets.list" label={tabConfig['tickets.list'] || 'Tickets'} icon={<FaTicketAlt />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />
                                <TabButton tab="tickets.categories" label={tabConfig['tickets.categories']} icon={<FaTags />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />
                             </div>
                        </div>
                     ) : null}
                   </div>
              )}
          </nav>

          <div className="flex-1 flex items-center justify-end gap-4">
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
                                <button onClick={() => setShowMFA(true)} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-on-surface-dark hover:bg-gray-700" role="menuitem">
                                    <FaFingerprint className="text-brand-secondary" />
                                    Configurar 2FA
                                </button>
                                {isAdmin && (
                                     <button onClick={() => setShowAudit(true)} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-on-surface-dark hover:bg-gray-700" role="menuitem">
                                        <FaClipboardList className="text-yellow-400" />
                                        Logs de Auditoria
                                    </button>
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
                    {tabConfig['overview'] && <TabButton tab="overview" label={tabConfig['overview']} icon={<FaChartBar />} activeTab={activeTab} setActiveTab={handleTabChange} isDropdownItem/>}
                    
                     {hasInventarioTabs && (
                        <div>
                            <button
                                onClick={() => setIsMobileInventarioOpen(prev => !prev)}
                                className={`flex items-center justify-between w-full text-left transition-colors duration-200 px-4 py-2 text-sm rounded-md ${isInventoryActive ? 'bg-brand-secondary text-white' : 'text-on-surface-dark hover:bg-gray-700'}`}
                                aria-expanded={isMobileInventarioOpen}
                            >
                                <div className="flex items-center gap-2">
                                    <ClipboardListIcon className="h-5 w-5"/>
                                    <span>{t('nav.inventory')}</span>
                                </div>
                                <svg className={`w-4 h-4 ml-1 transition-transform transform ${isMobileInventarioOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {isMobileInventarioOpen && (
                                <div className="pl-4 mt-1 space-y-1">
                                    {tabConfig['licensing'] && <TabButton tab="licensing" label={tabConfig['licensing']} icon={<FaKey />} activeTab={activeTab} setActiveTab={handleTabChange} isDropdownItem />}
                                    {tabConfig['equipment.inventory'] && <TabButton tab="equipment.inventory" label={tabConfig['equipment.inventory']} icon={<ClipboardListIcon className="h-5 w-5" />} isDropdownItem activeTab={activeTab} setActiveTab={handleTabChange} />}
                                    {tabConfig['equipment.brands'] && <TabButton tab="equipment.brands" label={tabConfig['equipment.brands']} icon={<FaTags />} isDropdownItem activeTab={activeTab} setActiveTab={handleTabChange} />}
                                    {tabConfig['equipment.types'] && <TabButton tab="equipment.types" label={tabConfig['equipment.types']} icon={<FaShapes />} isDropdownItem activeTab={activeTab} setActiveTab={handleTabChange} />}
                                </div>
                            )}
                        </div>
                    )}

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
                                    {tabConfig['collaborators'] && <TabButton tab="collaborators" label={tabConfig['collaborators']} icon={<UserGroupIcon className="h-5 w-5"/>} activeTab={activeTab} setActiveTab={handleTabChange} isDropdownItem/>}
                                    {tabConfig['organizacao.teams'] && <TabButton tab="organizacao.teams" label={tabConfig['organizacao.teams']} icon={<FaUsers className="h-5 w-5" />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />}
                                </div>
                            )}
                        </div>
                    )}

                    {hasTicketTabs && (
                        <div>
                            <button
                                onClick={() => {
                                    if (hasTicketCategories) {
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
                                    <span>{tabConfig['tickets'].title}</span>
                                </div>
                                {hasTicketCategories && (
                                     <svg className={`w-4 h-4 ml-1 transition-transform transform ${isMobileTicketsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                )}
                            </button>
                            {isMobileTicketsOpen && hasTicketCategories ? (
                                 <div className="pl-4 mt-1 space-y-1">
                                    <TabButton tab="tickets.list" label={tabConfig['tickets.list'] || 'Tickets'} icon={<FaTicketAlt />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />
                                    <TabButton tab="tickets.categories" label={tabConfig['tickets.categories']} icon={<FaTags />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />
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
    </>
  );
};

export default Header;