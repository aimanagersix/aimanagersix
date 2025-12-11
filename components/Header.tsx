import React, { useState, useRef, useEffect } from 'react';
import { Collaborator, UserRole } from '../types';
import { FaClipboardList, FaBuilding, FaUsers, FaDoorOpen as LogoutIcon, FaKey, FaBell, FaFingerprint, FaUserShield, FaDatabase, FaUserCircle, FaCalendarAlt, FaBook, FaQuestionCircle } from './common/Icons';
import { FaShapes, FaTags, FaChartBar, FaTicketAlt, FaSitemap, FaSync, FaGlobe, FaNetworkWired, FaShieldAlt, FaDownload, FaBoxOpen, FaServer, FaLock, FaUnlock, FaColumns, FaRobot, FaTachometerAlt, FaAddressBook, FaCog, FaToolbox, FaChevronDown, FaBars, FaMapMarkedAlt, FaFileSignature, FaGraduationCap, FaShoppingCart, FaMobileAlt } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';
import { useLayout } from '../contexts/LayoutContext';
import MFASetupModal from './MFASetupModal';
import AuditLogModal from './AuditLogModal';
import { DatabaseSchemaModal } from './DatabaseSchemaModal';
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
}

const TabButton = ({ tab, label, icon, activeTab, setActiveTab, isDropdownItem = false, className = '', onClick }: { tab?: string, label: string, icon: React.ReactNode, activeTab?: string, setActiveTab?: (tab: string) => void, isDropdownItem?: boolean, className?: string, onClick?: () => void }) => {
    const handleClick = (e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) {
            return;
        }
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


const Header: React.FC<HeaderProps> = ({ currentUser, activeTab, setActiveTab, onLogout, onResetData, tabConfig, notificationCount, onNotificationClick, onOpenProfile, onOpenCalendar, onOpenManual }) => {
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
    const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
    const toolsMenuRef = useRef<HTMLDivElement>(null);

    // Security Modals
    const [showMFA, setShowMFA] = useState(false);
    const [showAudit, setShowAudit] = useState(false);
    const [showDbSchema, setShowDbSchema] = useState(false);

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
             if (nis2MenuRef.current && !nis2MenuRef.current.contains(event.target as Node)) {
                setIsNis2MenuOpen(false);
            }
             if (ticketsMenuRef.current && !ticketsMenuRef.current.contains(event.target as Node)) {
                setIsTicketsMenuOpen(false);
            }
            if (overviewMenuRef.current && !overviewMenuRef.current.contains(event.target as Node)) {
                setIsOverviewMenuOpen(false);
            }
            if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
                setIsToolsMenuOpen(false);
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
    }, [isMobileMenuOpen, isOrganizacaoMenuOpen, isInventarioMenuOpen, isNis2MenuOpen, isUserMenuOpen, isTicketsMenuOpen, isOverviewMenuOpen, isToolsMenuOpen]);

    const isOrganizationActive = activeTab.startsWith('organizacao') || activeTab === 'collaborators';
    const isInventoryActive = activeTab.startsWith('equipment') || activeTab === 'licensing';
    const isNis2Active = activeTab.startsWith('nis2');
    const isTicketsActive = activeTab.startsWith('tickets');
    const isOverviewActive = activeTab.startsWith('overview');
    const isToolsActive = activeTab.startsWith('tools');

    const hasOrganizacaoTabs = tabConfig['organizacao.instituicoes'] || tabConfig['organizacao.entidades'] || tabConfig['collaborators'] || tabConfig['organizacao.teams'] || tabConfig['organizacao.suppliers'];
    const hasInventarioTabs = tabConfig['licensing'] || tabConfig['equipment.inventory'] || tabConfig['equipment.procurement'];
    const hasNis2Tabs = tabConfig.nis2?.bia || tabConfig.nis2?.security || tabConfig.nis2?.backups || tabConfig.nis2?.resilience || tabConfig.nis2?.training || tabConfig.nis2?.policies;
    const hasTicketTabs = tabConfig['tickets'];
    const hasToolsTabs = tabConfig['tools'] || onOpenCalendar || onOpenManual;
    const hasReportsTabs = tabConfig['reports']; 
    
    const isAdmin = currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.SuperAdmin;
    const isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;

  return (
    <>
    <header className="bg-gray-800 shadow-lg relative z-30">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button 
                ref={mobileMenuButtonRef}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
                <FaBars className="h-6 w-6" />
            </button>

            <div className="flex items-center flex-shrink-0 cursor-pointer" onClick={() => setActiveTab('overview')}>
                <span className="font-bold text-2xl text-white">
                AI<span className="text-brand-secondary">Manager</span>
                </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-2">
              {/* Visão Geral */}
              {tabConfig['overview'] && (
                  tabConfig['overview.smart'] ? (
                    <div className="relative" ref={overviewMenuRef}>
                        <button
                            onClick={() => setIsOverviewMenuOpen(prev => !prev)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isOverviewActive ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}
                            aria-haspopup="true"
                            aria-expanded={isOverviewMenuOpen}
                        >
                            <FaChartBar />
                            {t('nav.overview')}
                            <svg className={`w-4 h-4 ml-1 transition-transform transform ${isOverviewMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {isOverviewMenuOpen && (
                            <div className="absolute z-20 mt-2 w-60 origin-top-left rounded-md bg-surface-dark shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <div className="py-1" role="menu" aria-orientation="vertical">
                                    <TabButton tab="overview" label={t('nav.dashboard')} icon={<FaChartBar />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab}/>
                                    <TabButton tab="overview.smart" label={t('nav.c_level')} icon={<FaTachometerAlt className="text-purple-400" />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab}/>
                                </div>
                            </div>
                        )}
                    </div>
                  ) : (
                    <TabButton tab="overview" label={t('nav.overview')} icon={<FaChartBar />} activeTab={activeTab} setActiveTab={setActiveTab}/>
                  )
              )}

              {/* Organização */}
              {hasOrganizacaoTabs && (
                  <div className="relative" ref={organizacaoMenuRef}>
                      <button
                          onClick={() => setOrganizacaoMenuOpen(prev => !prev)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isOrganizationActive ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}
                      >
                          <FaSitemap />
                          {t('nav.organization')}
                          <svg className={`w-4 h-4 ml-1 transition-transform transform ${isOrganizacaoMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                      </button>
                      {isOrganizacaoMenuOpen && (
                          <div className="absolute z-20 mt-2 w-60 origin-top-left rounded-md bg-surface-dark shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
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

              {/* Inventário */}
              {hasInventarioTabs && (
                  <div className="relative" ref={inventarioMenuRef}>
                      <button
                          onClick={() => setInventarioMenuOpen(prev => !prev)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isInventoryActive ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}
                      >
                          <FaBoxOpen />
                          {t('nav.inventory')}
                          <svg className={`w-4 h-4 ml-1 transition-transform transform ${isInventarioMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                      </button>
                      {isInventarioMenuOpen && (
                          <div className="absolute z-20 mt-2 w-60 origin-top-left rounded-md bg-surface-dark shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                              <div className="py-1">
                                  {tabConfig['equipment.inventory'] && <TabButton tab="equipment.inventory" label={t('nav.assets_inventory')} icon={<FaClipboardList />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                  {tabConfig['equipment.procurement'] && <TabButton tab="equipment.procurement" label={t('nav.procurement')} icon={<FaShoppingCart />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                  {tabConfig['licensing'] && <TabButton tab="licensing" label={t('nav.licensing')} icon={<FaKey />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                              </div>
                          </div>
                      )}
                  </div>
              )}

              {/* NIS2 */}
              {hasNis2Tabs && (
                  <div className="relative" ref={nis2MenuRef}>
                      <button
                          onClick={() => setIsNis2MenuOpen(prev => !prev)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isNis2Active ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}
                      >
                          <FaShieldAlt />
                          {tabConfig.nis2?.title || t('nav.compliance')}
                          <svg className={`w-4 h-4 ml-1 transition-transform transform ${isNis2MenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                      </button>
                      {isNis2MenuOpen && (
                          <div className="absolute z-20 mt-2 w-60 origin-top-left rounded-md bg-surface-dark shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
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

              {/* Tickets */}
              {hasTicketTabs && (
                  <TabButton tab="tickets.list" label={t('nav.tickets')} icon={<FaTicketAlt />} activeTab={activeTab} setActiveTab={setActiveTab}/>
              )}
              
              {/* Reports - NEW */}
              {hasReportsTabs && (
                  <TabButton tab="reports" label={t('nav.reports')} icon={<FaFileSignature />} activeTab={activeTab} setActiveTab={setActiveTab}/>
              )}

              {/* Tools */}
              {hasToolsTabs && (
                  <div className="relative" ref={toolsMenuRef}>
                      <button
                          onClick={() => setIsToolsMenuOpen(prev => !prev)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isToolsActive ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}
                      >
                          <FaToolbox />
                          {t('nav.tools')}
                          <svg className={`w-4 h-4 ml-1 transition-transform transform ${isToolsMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                      </button>
                      {isToolsMenuOpen && (
                          <div className="absolute z-20 mt-2 w-60 origin-top-left rounded-md bg-surface-dark shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                              <div className="py-1">
                                  {tabConfig['tools']?.agenda && <TabButton tab="tools.agenda" label={t('nav.agenda')} icon={<FaAddressBook />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                  {tabConfig['tools']?.map && <TabButton tab="tools.map" label={t('nav.map')} icon={<FaMapMarkedAlt className="text-red-400" />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                  {onOpenCalendar && <TabButton label={t('nav.calendar')} icon={<FaCalendarAlt className="text-blue-400" />} isDropdownItem onClick={() => { onOpenCalendar(); setIsMobileMenuOpen(false); }} />}
                                  {onOpenManual && <TabButton label={t('nav.manual')} icon={<FaBook className="text-green-400" />} isDropdownItem onClick={() => { onOpenManual(); setIsMobileMenuOpen(false); }} />}
                              </div>
                          </div>
                      )}
                  </div>
              )}
          </nav>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-4">
            <button onClick={onNotificationClick} className="relative p-2 text-gray-400 hover:text-white transition-colors">
                <FaBell className="w-6 h-6" />
                {notificationCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                        {notificationCount}
                    </span>
                )}
            </button>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
                <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-800 transition-colors"
                >
                    {currentUser ? (
                        <>
                            {currentUser.photoUrl ? (
                                <img src={currentUser.photoUrl} alt={currentUser.fullName} className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                                <div className="h-8 w-8 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-white text-xs">{currentUser.fullName.charAt(0)}</div>
                            )}
                            <FaChevronDown className="w-3 h-3 text-gray-500" />
                        </>
                    ) : (
                        <LogoutIcon className="w-6 h-6 text-gray-400" />
                    )}
                </button>

                {isUserMenuOpen && currentUser && (
                    <div className="absolute right-0 mt-2 w-56 rounded-md bg-surface-dark shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden z-50">
                        <div className="px-4 py-3 border-b border-gray-700">
                            <p className="text-sm text-white font-medium truncate">{currentUser.fullName}</p>
                            <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
                        </div>
                        <div className="py-1">
                            {onOpenProfile && (
                                <button onClick={() => { onOpenProfile(); setIsUserMenuOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                                    <FaUserCircle className="mr-3 text-brand-secondary" /> {t('common.profile')}
                                </button>
                            )}
                            <button onClick={() => setLayoutMode('side')} className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                                <FaColumns className="mr-3 text-gray-400" /> {t('common.side_menu')}
                            </button>
                            <button onClick={() => setShowMFA(true)} className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                                <FaFingerprint className="mr-3 text-brand-secondary" /> {t('common.setup_2fa')}
                            </button>
                            
                            {/* Install App Button for Desktop User Menu */}
                            <div className="px-4 py-2">
                                <InstallAppButton 
                                    className="flex w-full items-center justify-center gap-2 px-2 py-2 text-xs font-bold text-gray-900 bg-brand-secondary rounded-md hover:bg-brand-primary hover:text-white transition-colors"
                                    label="Instalar App"
                                    icon={<FaMobileAlt />}
                                />
                            </div>

                            {/* Language Switch */}
                            <div className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer" onClick={(e) => {e.stopPropagation()}}>
                                <FaGlobe className="mr-3 text-blue-400" />
                                <select 
                                    value={language} 
                                    onChange={(e) => setLanguage(e.target.value as 'pt' | 'en')}
                                    className="bg-transparent border-none text-white text-sm focus:ring-0 cursor-pointer p-0 w-full"
                                >
                                    <option value="pt">Português</option>
                                    <option value="en">English</option>
                                </select>
                            </div>

                            {isAdmin && (
                                <>
                                    <TabButton 
                                        tab="settings" 
                                        label={t('common.settings')}
                                        icon={<FaCog className="mr-3 text-brand-secondary"/>} 
                                        isDropdownItem 
                                        activeTab={activeTab} 
                                        setActiveTab={(tab) => { setActiveTab(tab); setIsUserMenuOpen(false); }}
                                        className="text-gray-300 hover:bg-gray-700 hover:text-white flex w-full items-center px-4 py-2 text-sm"
                                    />
                                    <button onClick={() => { setShowAudit(true); setIsUserMenuOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                                        <FaClipboardList className="mr-3 text-yellow-400" /> {t('common.audit')}
                                    </button>
                                    {isSuperAdmin && (
                                        <button onClick={() => { setShowDbSchema(true); setIsUserMenuOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                                            <FaDatabase className="mr-3 text-green-400" /> {t('common.database')}
                                        </button>
                                    )}
                                </>
                            )}
                            <div className="border-t border-gray-700 my-1"></div>
                            <button onClick={onLogout} className="flex w-full items-center px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300">
                                <LogoutIcon className="mr-3" /> {t('common.logout')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-700 absolute w-full left-0 top-20 shadow-2xl overflow-y-auto max-h-[80vh] z-40" ref={mobileMenuRef}>
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                 {/* Install App Button for Mobile Menu */}
                 <div className="px-4 py-2">
                    <InstallAppButton 
                        className="flex w-full items-center justify-center gap-2 px-2 py-3 text-sm font-bold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors shadow-lg"
                        label="Instalar no Telemóvel"
                        icon={<FaMobileAlt />}
                    />
                </div>
                
                {/* Overview */}
                <TabButton tab="overview" label={t('nav.overview')} icon={<FaChartBar />} activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileMenuOpen(false); }} isDropdownItem/>
                {tabConfig['overview.smart'] && <TabButton tab="overview.smart" label={t('nav.c_level')} icon={<FaTachometerAlt />} activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileMenuOpen(false); }} isDropdownItem/>}

                {/* Inventory */}
                <div className="border-t border-gray-700 my-2"></div>
                <p className="px-4 text-xs text-gray-500 uppercase mt-2">{t('nav.inventory')}</p>
                {tabConfig['equipment.inventory'] && <TabButton tab="equipment.inventory" label={t('nav.assets_inventory')} icon={<FaClipboardList />} activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileMenuOpen(false); }} isDropdownItem/>}
                {tabConfig['equipment.procurement'] && <TabButton tab="equipment.procurement" label={t('nav.procurement')} icon={<FaShoppingCart />} activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileMenuOpen(false); }} isDropdownItem/>}
                {tabConfig['licensing'] && <TabButton tab="licensing" label={t('nav.licensing')} icon={<FaKey />} activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileMenuOpen(false); }} isDropdownItem/>}

                {/* Organization */}
                <div className="border-t border-gray-700 my-2"></div>
                <p className="px-4 text-xs text-gray-500 uppercase mt-2">{t('nav.organization')}</p>
                {tabConfig['organizacao.instituicoes'] && <TabButton tab="organizacao.instituicoes" label={t('nav.institutions')} icon={<FaSitemap />} activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileMenuOpen(false); }} isDropdownItem/>}
                {tabConfig['organizacao.entidades'] && <TabButton tab="organizacao.entidades" label={t('nav.entities')} icon={<FaBuilding />} activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileMenuOpen(false); }} isDropdownItem/>}
                {tabConfig['collaborators'] && <TabButton tab="collaborators" label={t('nav.collaborators')} icon={<FaUsers />} activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileMenuOpen(false); }} isDropdownItem/>}
                {tabConfig['organizacao.teams'] && <TabButton tab="organizacao.teams" label={t('nav.teams')} icon={<FaUsers />} activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileMenuOpen(false); }} isDropdownItem/>}
                {tabConfig['organizacao.suppliers'] && <TabButton tab="organizacao.suppliers" label={t('nav.suppliers')} icon={<FaShieldAlt />} activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileMenuOpen(false); }} isDropdownItem/>}
                
                {/* Support & Compliance */}
                <div className="border-t border-gray-700 my-2"></div>
                <p className="px-4 text-xs text-gray-500 uppercase mt-2">{t('nav.support')} & {t('nav.compliance')}</p>
                {tabConfig['tickets'] && <TabButton tab="tickets.list" label={t('nav.tickets')} icon={<FaTicketAlt />} activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileMenuOpen(false); }} isDropdownItem/>}
                {tabConfig.nis2?.bia && <TabButton tab="nis2.bia" label={t('nav.bia')} icon={<FaNetworkWired />} activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileMenuOpen(false); }} isDropdownItem/>}
                {tabConfig.nis2?.security && <TabButton tab="nis2.security" label={t('nav.security')} icon={<FaShieldAlt />} activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileMenuOpen(false); }} isDropdownItem/>}
                {tabConfig.nis2?.backups && <TabButton tab="nis2.backups" label={t('nav.backups')} icon={<FaServer />} activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileMenuOpen(false); }} isDropdownItem/>}
                {tabConfig.nis2?.resilience && <TabButton tab="nis2.resilience" label={t('nav.resilience')} icon={<FaShieldAlt className="text-purple-400"/>} activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileMenuOpen(false); }} isDropdownItem/>}
                {tabConfig.nis2?.training && <TabButton tab="nis2.training" label={t('nav.training')} icon={<FaGraduationCap className="text-green-400"/>} activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileMenuOpen(false); }} isDropdownItem/>}
                {tabConfig.nis2?.policies && <TabButton tab="nis2.policies" label={t('nav.policies')} icon={<FaFileSignature className="text-yellow-400"/>} activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileMenuOpen(false); }} isDropdownItem/>}
                
                {/* Reports */}
                <div className="border-t border-gray-700 my-2"></div>
                {tabConfig['reports'] && (
                    <TabButton tab="reports" label={t('nav.reports')} icon={<FaFileSignature />} activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileMenuOpen(false); }} isDropdownItem/>
                )}

                {/* Tools */}
                {hasToolsTabs && (
                     <>
                        <div className="border-t border-gray-700 my-2"></div>
                        <p className="px-4 text-xs text-gray-500 uppercase mt-2">{t('nav.tools')}</p>
                        {tabConfig['tools']?.agenda && <TabButton tab="tools.agenda" label={t('nav.agenda')} icon={<FaAddressBook />} activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileMenuOpen(false); }} isDropdownItem/>}
                        {tabConfig['tools']?.map && <TabButton tab="tools.map" label={t('nav.map')} icon={<FaMapMarkedAlt className="text-red-400" />} activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileMenuOpen(false); }} isDropdownItem/>}
                        {onOpenCalendar && <TabButton label={t('nav.calendar')} icon={<FaCalendarAlt className="text-blue-400" />} isDropdownItem onClick={() => { onOpenCalendar(); setIsMobileMenuOpen(false); }} />}
                        {onOpenManual && <TabButton label={t('nav.manual')} icon={<FaBook className="text-green-400" />} isDropdownItem onClick={() => { onOpenManual(); setIsMobileMenuOpen(false); }} />}
                    </>
                )}

                {/* User Profile & Actions (Crucial for Mobile) */}
                <div className="border-t border-gray-700 my-2"></div>
                <p className="px-4 text-xs text-gray-500 uppercase mt-2">{currentUser?.fullName}</p>
                
                {onOpenProfile && (
                     <TabButton label={t('common.profile')} icon={<FaUserCircle className="text-brand-secondary" />} isDropdownItem onClick={() => { onOpenProfile(); setIsMobileMenuOpen(false); }} />
                )}
                {isAdmin && (
                     <TabButton label={t('common.settings')} icon={<FaCog className="text-brand-secondary" />} isDropdownItem activeTab={activeTab} setActiveTab={(t) => { setActiveTab('settings'); setIsMobileMenuOpen(false); }} />
                )}
                
                <button onClick={onLogout} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300">
                    <LogoutIcon className="w-5 h-5 mr-1" /> {t('common.logout')}
                </button>
            </div>
        </div>
      )}

        {showMFA && <MFASetupModal onClose={() => setShowMFA(false)} />}
        {showAudit && <AuditLogModal onClose={() => setShowAudit(false)} />}
        {showDbSchema && <DatabaseSchemaModal onClose={() => setShowDbSchema(false)} />}
    </header>
    </>
  );
};

export default Header;