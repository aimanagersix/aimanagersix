
import React, { useState, useRef, useEffect } from 'react';
import { Collaborator, UserRole, ModuleKey, PermissionAction } from '../types';
import { FaClipboardList, FaBuilding, FaUsers, FaDoorOpen as LogoutIcon, FaKey, FaBell, FaFingerprint, FaUserShield, FaDatabase, FaUserCircle, FaCalendarAlt, FaBook, FaQuestionCircle } from './common/Icons';
import { FaShapes, FaTags, FaChartBar, FaTicketAlt, FaSitemap, FaSync, FaGlobe, FaNetworkWired, FaShieldAlt, FaBoxOpen, FaServer, FaLock, FaUnlock, FaColumns, FaRobot, FaTachometerAlt, FaAddressBook, FaCog, FaToolbox, FaChevronDown, FaBars, FaMapMarkedAlt, FaFileSignature, FaGraduationCap, FaShoppingCart, FaMobileAlt, FaUserTie } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';
import { useLayout } from '../contexts/LayoutContext';
import MFASetupModal from './MFASetupModal';
import AuditLogModal from './AuditLogModal';
import DatabaseSchemaModal from './DatabaseSchemaModal';
import InstallAppButton from './InstallAppButton';

interface HeaderProps {
  currentUser: Collaborator | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onResetData?: () => void;
  tabConfig: Record<string, any>;
  notificationCount: number;
  onNotificationClick: () => void;
  onOpenProfile?: () => void;
  onOpenCalendar?: () => void;
  onOpenManual?: () => void;
  checkPermission: (module: ModuleKey, action: PermissionAction) => boolean;
}

const TabButton = ({ tab, label, icon, activeTab, setActiveTab, isDropdownItem = false, className = '', onClick }: { tab?: string, label: string, icon: React.ReactNode, activeTab?: string, setActiveTab?: (tab: string) => void, isDropdownItem?: boolean, className?: string, onClick?: () => void }) => {
    const handleClick = (e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        if (onClick) onClick();
        else if (tab && setActiveTab) setActiveTab(tab);
    };

    return (
        <a
            href={tab ? `#${tab}` : '#'}
            onClick={handleClick}
            className={`flex items-center gap-2 w-full text-left transition-colors duration-200 rounded-md no-underline ${
                isDropdownItem 
                ? `px-4 py-2 text-sm ${tab && activeTab === tab ? 'bg-brand-secondary text-white' : 'text-on-surface-dark hover:bg-gray-700'}` 
                : `px-3 py-2 text-sm font-medium ${tab && activeTab === tab ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`
            } ${className}`}
            role={isDropdownItem ? 'menuitem' : 'tab'}
            aria-current={tab && activeTab === tab ? 'page' : undefined}
        >
            {icon}
            <span>{label}</span>
        </a>
    );
};

const Header: React.FC<HeaderProps> = ({ currentUser, activeTab, setActiveTab, onLogout, onResetData, tabConfig, notificationCount, onNotificationClick, onOpenProfile, onOpenCalendar, onOpenManual, checkPermission }) => {
    const { t, setLanguage, language } = useLanguage();
    const { setLayoutMode } = useLayout();
    
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
    const [isOverviewMenuOpen, setIsOverviewMenuOpen] = useState(false);
    const overviewMenuRef = useRef<HTMLDivElement>(null);
    const [isToolsOpen, setIsToolsOpen] = useState(false);
    const toolsMenuRef = useRef<HTMLDivElement>(null);

    const [showMFA, setShowMFA] = useState(false);
    const [showAudit, setShowAudit] = useState(false);
    const [showDbSchema, setShowDbSchema] = useState(false);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    
     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (organizacaoMenuRef.current && !organizacaoMenuRef.current.contains(event.target as Node)) setOrganizacaoMenuOpen(false);
            if (inventarioMenuRef.current && !inventarioMenuRef.current.contains(event.target as Node)) setInventarioMenuOpen(false);
            if (nis2MenuRef.current && !nis2MenuRef.current.contains(event.target as Node)) setIsNis2MenuOpen(false);
            if (ticketsMenuRef.current && !ticketsMenuRef.current.contains(event.target as Node)) setIsTicketsMenuOpen(false);
            if (overviewMenuRef.current && !overviewMenuRef.current.contains(event.target as Node)) setIsOverviewMenuOpen(false);
            if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) setIsToolsOpen(false);
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setIsUserMenuOpen(false);
            if (isMobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && mobileMenuButtonRef.current && !mobileMenuButtonRef.current.contains(event.target as Node)) setIsMobileMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMobileMenuOpen, isOrganizacaoMenuOpen, isInventarioMenuOpen, isNis2MenuOpen, isUserMenuOpen, isTicketsMenuOpen, isOverviewMenuOpen, isToolsOpen]);

    const isOrganizationActive = activeTab.startsWith('organizacao') || activeTab === 'collaborators';
    const isInventoryActive = activeTab.startsWith('equipment') || activeTab === 'licensing';
    const isNis2Active = activeTab.startsWith('nis2');
    const isOverviewActive = activeTab.startsWith('overview') || activeTab === 'my_area';

    const hasOrganizacaoTabs = tabConfig['organizacao.instituicoes'] || tabConfig['organizacao.entidades'] || tabConfig['collaborators'] || tabConfig['organizacao.teams'] || tabConfig['organizacao.suppliers'];
    const hasInventarioTabs = tabConfig['licensing'] || tabConfig['equipment.inventory'] || tabConfig['equipment.procurement'];
    const hasNis2Tabs = tabConfig.nis2?.bia || tabConfig.nis2?.security || tabConfig.nis2?.backups || tabConfig.nis2?.resilience || tabConfig.nis2?.training || tabConfig.nis2?.policies;
    
    const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin' || currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.SuperAdmin;
    const isSuperAdmin = currentUser?.role === 'SuperAdmin' || currentUser?.role === UserRole.SuperAdmin;

    const navigateMobile = (tab: string) => {
        setActiveTab(tab);
        setIsMobileMenuOpen(false);
    };

  return (
    <>
    <header className="bg-gray-800 shadow-lg relative z-30 flex-shrink-0">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          <div className="flex items-center gap-4">
            <button ref={mobileMenuButtonRef} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700">
                <FaBars className="h-6 w-6" />
            </button>
            <div className="flex items-center flex-shrink-0 cursor-pointer" onClick={() => setActiveTab('overview')}>
                <span className="font-bold text-2xl text-white">AI<span className="text-brand-secondary">Manager</span></span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-2">
              {tabConfig['overview'] && (
                    <div className="relative" ref={overviewMenuRef}>
                        <button onClick={() => setIsOverviewMenuOpen(prev => !prev)} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isOverviewActive ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}>
                            <FaChartBar /> {t('nav.overview')}
                            <FaChevronDown className={`w-3 h-3 ml-1 transition-transform ${isOverviewMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOverviewMenuOpen && (
                            <div className="absolute z-20 mt-2 w-60 rounded-md bg-surface-dark shadow-lg ring-1 ring-black ring-opacity-5">
                                <div className="py-1">
                                    {checkPermission('widget_kpi_cards', 'view') && (
                                        <TabButton tab="overview" label={t('nav.dashboard')} icon={<FaChartBar />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab}/>
                                    )}
                                    {checkPermission('my_area', 'view') && (
                                        <TabButton tab="my_area" label={t('nav.my_area')} icon={<FaUserTie className="text-brand-secondary" />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab}/>
                                    )}
                                    {tabConfig['overview.smart'] && (
                                        <TabButton tab="overview.smart" label={t('nav.c_level')} icon={<FaTachometerAlt className="text-purple-400" />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab}/>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
              )}

              {hasOrganizacaoTabs && (
                  <div className="relative" ref={organizacaoMenuRef}>
                      <button onClick={() => setOrganizacaoMenuOpen(prev => !prev)} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isOrganizationActive ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}>
                          <FaSitemap /> {t('nav.organization')}
                          <FaChevronDown className={`w-3 h-3 ml-1 transition-transform ${isOrganizacaoMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOrganizacaoMenuOpen && (
                          <div className="absolute z-20 mt-2 w-60 rounded-md bg-surface-dark shadow-lg ring-1 ring-black ring-opacity-5">
                              <div className="py-1">
                                  {tabConfig['organizacao.instituicoes'] && <TabButton tab="organizacao.instituicoes" label={t('nav.institutions')} icon={<FaSitemap />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                  {tabConfig['organizacao.entidades'] && <TabButton tab="organizacao.entidades" label={t('nav.entities')} icon={<FaBuilding />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                  {tabConfig['collaborators'] && <TabButton tab="collaborators" label={t('nav.collaborators')} icon={<FaUsers />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                  {tabConfig['organizacao.teams'] && <TabButton tab="organizacao.teams" label={t('nav.teams')} icon={<FaUsers />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                  {tabConfig['organizacao.suppliers'] && <TabButton tab="organizacao.suppliers" label={t('nav.suppliers')} icon={<FaShieldAlt />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                              </div>
                          </div>
                      )}
                  </div>
              )}

              {hasInventarioTabs && (
                  <div className="relative" ref={inventarioMenuRef}>
                      <button onClick={() => setInventarioMenuOpen(prev => !prev)} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isInventoryActive ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}>
                          <FaBoxOpen /> {t('nav.inventory')}
                          <FaChevronDown className={`w-3 h-3 ml-1 transition-transform ${isInventarioMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isInventarioMenuOpen && (
                          <div className="absolute z-20 mt-2 w-60 rounded-md bg-surface-dark shadow-lg ring-1 ring-black ring-opacity-5">
                              <div className="py-1">
                                  {tabConfig['equipment.inventory'] && <TabButton tab="equipment.inventory" label={t('nav.assets_inventory')} icon={<FaClipboardList />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                  {tabConfig['licensing'] && <TabButton tab="licensing" label={t('nav.licensing')} icon={<FaKey />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                  {tabConfig['equipment.procurement'] && <TabButton tab="equipment.procurement" label={t('nav.procurement')} icon={<FaShoppingCart />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                              </div>
                          </div>
                      )}
                  </div>
              )}

              {hasNis2Tabs && (
                  <div className="relative" ref={nis2MenuRef}>
                      {/* Fix: use setIsNis2MenuOpen instead of undefined setIsNis2Open */}
                      <button onClick={() => setIsNis2MenuOpen(prev => !prev)} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isNis2Active ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}>
                          <FaShieldAlt /> {t('nav.compliance')}
                          <FaChevronDown className={`w-3 h-3 ml-1 transition-transform ${isNis2MenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isNis2MenuOpen && (
                          <div className="absolute z-20 mt-2 w-60 rounded-md bg-surface-dark shadow-lg ring-1 ring-black ring-opacity-5">
                              <div className="py-1">
                                  {tabConfig.nis2?.bia && <TabButton tab="nis2.bia" label={t('nav.bia')} icon={<FaNetworkWired />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                  {tabConfig.nis2?.security && <TabButton tab="nis2.security" label={t('nav.security')} icon={<FaShieldAlt />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                  {tabConfig.nis2?.backups && <TabButton tab="nis2.backups" label={t('nav.backups')} icon={<FaServer />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                  {tabConfig.nis2?.resilience && <TabButton tab="nis2.resilience" label={t('nav.resilience')} icon={<FaShieldAlt className="text-purple-400"/>} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                  {tabConfig.nis2?.training && <TabButton tab="nis2.training" label={t('nav.training')} icon={<FaGraduationCap className="text-green-400"/>} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                  {tabConfig.nis2?.policies && <TabButton tab="nis2.policies" label={t('nav.policies')} icon={<FaFileSignature className="text-yellow-400"/>} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                              </div>
                          </div>
                      )}
                  </div>
              )}

              {tabConfig['tickets'] && <TabButton tab="tickets.list" label={t('nav.tickets')} icon={<FaTicketAlt />} activeTab={activeTab} setActiveTab={setActiveTab}/>}
              {tabConfig['reports'] && <TabButton tab="reports" label={t('nav.reports')} icon={<FaFileSignature />} activeTab={activeTab} setActiveTab={setActiveTab}/>}

              {/* Tools Menu for Desktop */}
              <div className="relative" ref={toolsMenuRef}>
                  <button onClick={() => setIsToolsOpen(prev => !prev)} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab.startsWith('tools') ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}>
                      <FaToolbox /> {t('nav.tools')}
                      <FaChevronDown className={`w-3 h-3 ml-1 transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isToolsOpen && (
                      <div className="absolute z-20 mt-2 w-60 rounded-md bg-surface-dark shadow-lg ring-1 ring-black ring-opacity-5">
                          <div className="py-1">
                              <TabButton tab="tools.agenda" label={t('nav.agenda')} icon={<FaAddressBook />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />
                              <TabButton tab="tools.map" label={t('nav.map')} icon={<FaMapMarkedAlt className="text-red-400" />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />
                              <TabButton label={t('nav.calendar')} icon={<FaCalendarAlt className="text-blue-400" />} isDropdownItem onClick={() => { onOpenCalendar?.(); setIsToolsOpen(false); }} />
                              <TabButton label={t('nav.manual')} icon={<FaBook className="text-green-400" />} isDropdownItem onClick={() => { onOpenManual?.(); setIsToolsOpen(false); }} />
                          </div>
                      </div>
                  )}
              </div>
          </nav>

          <div className="flex items-center space-x-4">
            <button onClick={onNotificationClick} className="relative p-2 text-gray-400 hover:text-white">
                <FaBell className="w-6 h-6" />
                {notificationCount > 0 && (
                    <span className="absolute top-0 right-0 px-2 py-1 text-xs font-bold text-red-100 bg-red-600 rounded-full">{notificationCount}</span>
                )}
            </button>

            <div className="relative" ref={userMenuRef}>
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-800 transition-colors">
                    {/* FIX: photo_url and full_name */}
                    {currentUser?.photo_url ? (
                        <img src={currentUser.photo_url} alt={currentUser.full_name} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                        <div className="h-8 w-8 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-white text-xs">{currentUser?.full_name.charAt(0)}</div>
                    )}
                    <FaChevronDown className="w-3 h-3 text-gray-500" />
                </button>

                {isUserMenuOpen && currentUser && (
                    <div className="absolute right-0 mt-2 w-56 rounded-md bg-surface-dark shadow-lg ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-700">
                            {/* FIX: full_name */}
                            <p className="text-sm text-white font-medium truncate">{currentUser.full_name}</p>
                            <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
                        </div>
                        <div className="py-1">
                            <button onClick={() => { onOpenProfile?.(); setIsUserMenuOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                                <FaUserCircle className="mr-3 text-brand-secondary" /> {t('common.profile')}
                            </button>
                            <button onClick={() => { setLayoutMode('side'); setIsUserMenuOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                                <FaColumns className="mr-3 text-gray-400" /> {t('common.side_menu')}
                            </button>
                            <button onClick={() => { setShowMFA(true); setIsUserMenuOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
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
                                    <button onClick={() => { setActiveTab('settings'); setIsUserMenuOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                                        <FaCog className="mr-3 text-brand-secondary" /> {t('common.settings')}
                                    </button>
                                    <button onClick={() => { setShowAudit(true); setIsUserMenuOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                                        <FaClipboardList className="mr-3 text-yellow-400" /> {t('common.audit')}
                                    </button>
                                    {isSuperAdmin && (
                                        <button onClick={() => { setShowDbSchema(true); setIsUserMenuOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                                            <FaDatabase className="mr-3 text-green-400" /> {t('common.database')}
                                        </button>
                                    )}
                                </>
                            )}
                            <button onClick={onLogout} className="flex w-full items-center px-4 py-2 text-sm text-red-400 hover:bg-gray-700 border-t border-gray-700 mt-1">
                                <LogoutIcon className="mr-3" /> {t('common.logout')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
      </div> 
    </header>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-700 absolute w-full left-0 top-20 shadow-2xl z-40 max-h-[80vh] overflow-y-auto" ref={mobileMenuRef}>
            <div className="px-2 pt-2 pb-3 space-y-1">
                {checkPermission('my_area', 'view') && <TabButton tab="my_area" label={t('nav.my_area')} icon={<FaUserTie />} activeTab={activeTab} setActiveTab={navigateMobile} isDropdownItem/>}
                <TabButton tab="overview" label={t('nav.dashboard')} icon={<FaChartBar />} activeTab={activeTab} setActiveTab={navigateMobile} isDropdownItem/>
                
                {hasOrganizacaoTabs && (
                    <div className="border-t border-gray-800 pt-2 mt-2">
                        <div className="px-4 py-1 text-[10px] font-bold text-gray-500 uppercase">{t('nav.organization')}</div>
                        {tabConfig['organizacao.instituicoes'] && <TabButton tab="organizacao.instituicoes" label={t('nav.institutions')} icon={<FaSitemap />} isDropdownItem activeTab={activeTab} setActiveTab={navigateMobile} />}
                        {tabConfig['organizacao.entidades'] && <TabButton tab="organizacao.entidades" label={t('nav.entities')} icon={<FaBuilding />} isDropdownItem activeTab={activeTab} setActiveTab={navigateMobile} />}
                        {tabConfig['collaborators'] && <TabButton tab="collaborators" label={t('nav.collaborators')} icon={<FaUsers />} isDropdownItem activeTab={activeTab} setActiveTab={navigateMobile} />}
                    </div>
                )}

                {hasInventarioTabs && (
                    <div className="border-t border-gray-800 pt-2 mt-2">
                        <div className="px-4 py-1 text-[10px] font-bold text-gray-500 uppercase">{t('nav.inventory')}</div>
                        {tabConfig['equipment.inventory'] && <TabButton tab="equipment.inventory" label={t('nav.assets_inventory')} icon={<FaClipboardList />} isDropdownItem activeTab={activeTab} setActiveTab={navigateMobile} />}
                        {tabConfig['licensing'] && <TabButton tab="licensing" label={t('nav.licensing')} icon={<FaKey />} isDropdownItem activeTab={activeTab} setActiveTab={navigateMobile} />}
                    </div>
                )}

                {hasNis2Tabs && (
                    <div className="border-t border-gray-800 pt-2 mt-2">
                        <div className="px-4 py-1 text-[10px] font-bold text-gray-500 uppercase">{t('nav.compliance')}</div>
                        {tabConfig.nis2?.security && <TabButton tab="nis2.security" label={t('nav.security')} icon={<FaShieldAlt />} isDropdownItem activeTab={activeTab} setActiveTab={navigateMobile} />}
                        {tabConfig.nis2?.bia && <TabButton tab="nis2.bia" label={t('nav.bia')} icon={<FaNetworkWired />} isDropdownItem activeTab={activeTab} setActiveTab={navigateMobile} />}
                    </div>
                )}

                <div className="border-t border-gray-800 pt-2 mt-2">
                    {tabConfig['tickets'] && <TabButton tab="tickets.list" label={t('nav.tickets')} icon={<FaTicketAlt />} activeTab={activeTab} setActiveTab={navigateMobile} isDropdownItem/>}
                    {tabConfig['reports'] && <TabButton tab="reports" label={t('nav.reports')} icon={<FaFileSignature />} activeTab={activeTab} setActiveTab={navigateMobile} isDropdownItem/>}
                    
                    {/* Tools for Mobile */}
                    <TabButton tab="tools.agenda" label={t('nav.agenda')} icon={<FaAddressBook />} isDropdownItem activeTab={activeTab} setActiveTab={navigateMobile} />
                    <TabButton tab="tools.map" label={t('nav.map')} icon={<FaMapMarkedAlt />} isDropdownItem activeTab={activeTab} setActiveTab={navigateMobile} />
                </div>

                <button onClick={onLogout} className="flex w-full items-center gap-2 px-4 py-3 text-red-400 hover:bg-gray-800 border-t border-gray-800 mt-2"><LogoutIcon className="w-5 h-5" /> {t('common.logout')}</button>
            </div>
        </div>
      )}

        {showMFA && <MFASetupModal onClose={() => setShowMFA(false)} />}
        {showAudit && <AuditLogModal onClose={() => setShowAudit(false)} />}
        {showDbSchema && <DatabaseSchemaModal onClose={() => setShowDbSchema(false)} />}
    </>
  );
};

export default Header;
