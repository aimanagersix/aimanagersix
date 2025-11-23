
import React, { useState } from 'react';
import { Collaborator, UserRole } from '../types';
import { ClipboardListIcon, OfficeBuildingIcon, UserGroupIcon, LogoutIcon, UserIcon, FaKey, FaBell, FaUsers, FaFingerprint, FaClipboardList, FaUserShield, FaDatabase, FaUserCircle, FaCalendarAlt, FaBook, FaQuestionCircle } from './common/Icons';
import { FaShapes, FaTags, FaChartBar, FaTicketAlt, FaSitemap, FaGlobe, FaNetworkWired, FaShieldAlt, FaDownload, FaBoxOpen, FaServer, FaLock, FaUnlock, FaColumns, FaChevronRight, FaChevronDown, FaRobot, FaTachometerAlt, FaAddressBook, FaCog } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';
import { useLayout } from '../contexts/LayoutContext';
import MFASetupModal from './MFASetupModal';
import AuditLogModal from './AuditLogModal';
import DatabaseSchemaModal from './DatabaseSchemaModal';

interface SidebarProps {
  currentUser: Collaborator | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  tabConfig: Record<string, any>;
  notificationCount: number;
  onNotificationClick: () => void;
  isExpanded: boolean;
  onHover: (state: boolean) => void;
  onOpenAutomation?: () => void;
  onOpenProfile?: () => void;
  onOpenCalendar?: () => void;
  onOpenManual?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentUser, activeTab, setActiveTab, onLogout, tabConfig, notificationCount, onNotificationClick, isExpanded, onHover, onOpenAutomation, onOpenProfile, onOpenCalendar, onOpenManual }) => {
    const { t, language, setLanguage } = useLanguage();
    const { layoutMode, setLayoutMode } = useLayout();
    
    // Sidebar toggle states for accordions
    const [isOrganizacaoOpen, setOrganizacaoOpen] = useState(activeTab.startsWith('organizacao') || activeTab === 'collaborators');
    const [isInventarioOpen, setInventarioOpen] = useState(activeTab.startsWith('equipment') || activeTab === 'licensing');
    const [isNis2Open, setIsNis2Open] = useState(activeTab.startsWith('nis2'));
    const [isTicketsOpen, setIsTicketsOpen] = useState(activeTab.startsWith('tickets'));
    const [isOverviewOpen, setIsOverviewOpen] = useState(activeTab.startsWith('overview'));
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    // Security Modals
    const [showMFA, setShowMFA] = useState(false);
    const [showAudit, setShowAudit] = useState(false);
    const [showDbSchema, setShowDbSchema] = useState(false);

    // Logic
    const hasOverviewTabs = tabConfig['overview'] || tabConfig['overview.smart'];
    const hasOrganizacaoTabs = tabConfig['organizacao.instituicoes'] || tabConfig['organizacao.entidades'] || tabConfig['collaborators'] || tabConfig['organizacao.teams'] || tabConfig['organizacao.suppliers'] || tabConfig['organizacao.agenda'];
    const hasInventarioTabs = tabConfig['licensing'] || tabConfig['equipment.inventory'];
    const hasNis2Tabs = tabConfig.nis2?.bia || tabConfig.nis2?.security || tabConfig.nis2?.backups || tabConfig.nis2?.resilience;
    const hasTicketTabs = tabConfig['tickets'];
    
    const isAdmin = currentUser?.role === UserRole.Admin;

    const handleTabClick = (tab: string) => {
        setActiveTab(tab);
    };

    // Using anchor tags allows middle-click / right-click -> open new tab natively
    const TabButton = ({ tab, label, icon, activeTab, setActiveTab, isDropdownItem = false, className = '' }: { tab: string, label: string, icon: React.ReactNode, activeTab: string, setActiveTab: (tab: string) => void, isDropdownItem?: boolean, className?: string }) => (
        <a
            href={`#${tab}`}
            onClick={(e) => { 
                // Allow normal link behavior for modifiers (ctrl+click, right click, etc.)
                if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) {
                    return;
                }
                e.preventDefault(); 
                handleTabClick(tab); 
            }}
            className={`flex items-center gap-3 w-full text-left transition-colors duration-200 rounded-md overflow-hidden whitespace-nowrap cursor-pointer no-underline ${
                isDropdownItem 
                ? `px-4 py-2 text-sm ${activeTab === tab ? 'bg-brand-secondary text-white' : 'text-on-surface-dark hover:bg-gray-700'}` 
                : `px-4 py-3 text-sm font-medium ${activeTab === tab ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`
            } ${className}`}
            role={isDropdownItem ? 'menuitem' : 'tab'}
            aria-current={activeTab === tab ? 'page' : undefined}
            title={!isExpanded ? label : undefined}
        >
            <span className="text-lg flex-shrink-0 w-6 flex justify-center">{icon}</span>
            <span className={`transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                {label}
            </span>
        </a>
    );

    return (
        <>
        <aside 
            className={`fixed top-0 left-0 h-screen bg-gray-900 shadow-2xl z-50 flex flex-col border-r border-gray-800 transition-all duration-300 ease-in-out ${isExpanded ? 'w-64' : 'w-20'}`}
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => {
                onHover(false);
                setIsUserMenuOpen(false); // Auto close menus on leave for cleaner UX
            }}
        >
            {/* Brand Header */}
            <div className="flex items-center justify-center h-20 flex-shrink-0 bg-gray-900 border-b border-gray-800 overflow-hidden whitespace-nowrap">
                <span className="font-bold text-2xl text-white transition-all duration-300">
                    {isExpanded ? (
                        <>AI<span className="text-brand-secondary">Manager</span></>
                    ) : (
                        <span className="text-brand-secondary">AI</span>
                    )}
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-grow py-4 px-2 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
                
                {/* Visão Geral (With Submenu for Admin) */}
                {hasOverviewTabs && (
                    <div className="space-y-1">
                        {/* Check if it needs a dropdown (if admin has access to Smart Dashboard) */}
                        {tabConfig['overview.smart'] ? (
                            <>
                                <button
                                    onClick={() => setIsOverviewOpen(!isOverviewOpen)}
                                    className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${isOverviewOpen ? 'text-white' : 'text-on-surface-dark-secondary hover:bg-gray-800'}`}
                                    title={!isExpanded ? t('nav.overview') : undefined}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
                                        <FaChartBar className="text-lg flex-shrink-0 w-6 flex justify-center" />
                                        <span className={`transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{t('nav.overview')}</span>
                                    </div>
                                    {isExpanded && (
                                        <span className={`transition-transform duration-200 ${isOverviewOpen ? 'rotate-90' : ''}`}>
                                            <FaChevronRight className="w-3 h-3" />
                                        </span>
                                    )}
                                </button>
                                {isOverviewOpen && isExpanded && (
                                    <div className="pl-4 space-y-1 bg-gray-800/30 rounded-md py-1 animate-fade-in">
                                        <TabButton tab="overview" label="Dashboard Geral" icon={<FaChartBar />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab}/>
                                        <TabButton tab="overview.smart" label={tabConfig['overview.smart']} icon={<FaTachometerAlt className="text-purple-400" />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab}/>
                                    </div>
                                )}
                            </>
                        ) : (
                            <TabButton tab="overview" label={tabConfig['overview']} icon={<FaChartBar />} activeTab={activeTab} setActiveTab={setActiveTab}/>
                        )}
                    </div>
                )}

                {/* Organização */}
                {hasOrganizacaoTabs && (
                    <div className="space-y-1">
                        <button
                            onClick={() => setOrganizacaoOpen(!isOrganizacaoOpen)}
                            className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${isOrganizacaoOpen ? 'text-white' : 'text-on-surface-dark-secondary hover:bg-gray-800'}`}
                            title={!isExpanded ? t('nav.organization') : undefined}
                        >
                            <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
                                <FaSitemap className="text-lg flex-shrink-0 w-6 flex justify-center" />
                                <span className={`transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{t('nav.organization')}</span>
                            </div>
                            {isExpanded && (
                                <span className={`transition-transform duration-200 ${isOrganizacaoOpen ? 'rotate-90' : ''}`}>
                                    <FaChevronRight className="w-3 h-3" />
                                </span>
                            )}
                        </button>
                        {isOrganizacaoOpen && isExpanded && (
                            <div className="pl-4 space-y-1 bg-gray-800/30 rounded-md py-1 animate-fade-in">
                                {tabConfig['organizacao.agenda'] && <TabButton tab="organizacao.agenda" label={tabConfig['organizacao.agenda']} icon={<FaAddressBook />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {tabConfig['organizacao.instituicoes'] && <TabButton tab="organizacao.instituicoes" label={tabConfig['organizacao.instituicoes']} icon={<FaSitemap />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {tabConfig['organizacao.entidades'] && <TabButton tab="organizacao.entidades" label={tabConfig['organizacao.entidades']} icon={<OfficeBuildingIcon />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {tabConfig['collaborators'] && <TabButton tab="collaborators" label={tabConfig['collaborators']} icon={<UserGroupIcon />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {tabConfig['organizacao.teams'] && <TabButton tab="organizacao.teams" label={tabConfig['organizacao.teams']} icon={<FaUsers />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {tabConfig['organizacao.suppliers'] && <TabButton tab="organizacao.suppliers" label={tabConfig['organizacao.suppliers']} icon={<FaShieldAlt />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                            </div>
                        )}
                    </div>
                )}

                {/* Inventário */}
                {hasInventarioTabs && (
                    <div className="space-y-1">
                        <button
                            onClick={() => setInventarioOpen(!isInventarioOpen)}
                            className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${isInventarioOpen ? 'text-white' : 'text-on-surface-dark-secondary hover:bg-gray-800'}`}
                            title={!isExpanded ? t('nav.inventory') : undefined}
                        >
                            <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
                                <FaBoxOpen className="text-lg flex-shrink-0 w-6 flex justify-center" />
                                <span className={`transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{t('nav.inventory')}</span>
                            </div>
                            {isExpanded && (
                                <span className={`transition-transform duration-200 ${isInventarioOpen ? 'rotate-90' : ''}`}>
                                    <FaChevronRight className="w-3 h-3" />
                                </span>
                            )}
                        </button>
                        {isInventarioOpen && isExpanded && (
                            <div className="pl-4 space-y-1 bg-gray-800/30 rounded-md py-1 animate-fade-in">
                                {tabConfig['equipment.inventory'] && <TabButton tab="equipment.inventory" label={t('nav.assets_inventory')} icon={<ClipboardListIcon />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {tabConfig['licensing'] && <TabButton tab="licensing" label={tabConfig['licensing']} icon={<FaKey />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                            </div>
                        )}
                    </div>
                )}

                {/* NIS2 */}
                {hasNis2Tabs && (
                    <div className="space-y-1">
                        <button
                            onClick={() => setIsNis2Open(!isNis2Open)}
                            className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${isNis2Open ? 'text-white' : 'text-on-surface-dark-secondary hover:bg-gray-800'}`}
                            title={!isExpanded ? (tabConfig.nis2?.title || 'Compliance') : undefined}
                        >
                            <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
                                <FaShieldAlt className="text-lg flex-shrink-0 w-6 flex justify-center" />
                                <span className={`transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{tabConfig.nis2?.title || 'Compliance'}</span>
                            </div>
                            {isExpanded && (
                                <span className={`transition-transform duration-200 ${isNis2Open ? 'rotate-90' : ''}`}>
                                    <FaChevronRight className="w-3 h-3" />
                                </span>
                            )}
                        </button>
                        {isNis2Open && isExpanded && (
                            <div className="pl-4 space-y-1 bg-gray-800/30 rounded-md py-1 animate-fade-in">
                                {tabConfig.nis2?.bia && <TabButton tab="nis2.bia" label={tabConfig.nis2.bia} icon={<FaNetworkWired />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {tabConfig.nis2?.security && <TabButton tab="nis2.security" label={tabConfig.nis2.security} icon={<FaShieldAlt />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {tabConfig.nis2?.backups && <TabButton tab="nis2.backups" label={tabConfig.nis2.backups} icon={<FaServer />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {tabConfig.nis2?.resilience && <TabButton tab="nis2.resilience" label={tabConfig.nis2.resilience} icon={<FaShieldAlt className="text-purple-400"/>} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                            </div>
                        )}
                    </div>
                )}

                {/* Tickets */}
                {hasTicketTabs && (
                    <div className="space-y-1">
                        <button
                            onClick={() => setActiveTab('tickets.list')}
                            className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${isTicketsOpen || activeTab === 'tickets.list' ? 'text-white' : 'text-on-surface-dark-secondary hover:bg-gray-800'}`}
                            title={!isExpanded ? (tabConfig.tickets?.title || 'Tickets') : undefined}
                        >
                            <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
                                <FaTicketAlt className="text-lg flex-shrink-0 w-6 flex justify-center" />
                                <span className={`transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{tabConfig.tickets?.title || 'Tickets'}</span>
                            </div>
                        </button>
                    </div>
                )}
            </nav>

            {/* Footer / User Section */}
            <div className="p-4 border-t border-gray-800 bg-gray-900 flex-shrink-0 relative">
                {currentUser ? (
                    <div className="relative">
                        <button 
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-gray-800 transition-colors"
                            title={!isExpanded ? currentUser.fullName : undefined}
                        >
                            {currentUser.photoUrl ? (
                                <img src={currentUser.photoUrl} alt={currentUser.fullName} className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
                            ) : (
                                <div className="h-8 w-8 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-white flex-shrink-0 text-xs">{currentUser.fullName.charAt(0)}</div>
                            )}
                            <div className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                                <p className="text-sm font-medium text-white truncate">{currentUser.fullName}</p>
                                <p className="text-xs text-gray-400 truncate">{currentUser.role}</p>
                            </div>
                            {isExpanded && <FaChevronDown className="w-3 h-3 ml-auto text-gray-500" />}
                        </button>

                        {/* User Menu Popup (Positioned to the right or top) */}
                        {isUserMenuOpen && (
                            <div className="absolute bottom-full left-0 w-full mb-2 bg-surface-dark border border-gray-700 rounded-md shadow-xl py-1 z-50 min-w-[200px]">
                                {onOpenProfile && (
                                    <button onClick={() => { onOpenProfile(); setIsUserMenuOpen(false); }} className="flex w-full items-center gap-3 px-4 py-2 text-sm text-on-surface-dark hover:bg-gray-700">
                                        <FaUserCircle className="text-brand-secondary w-4 h-4" />
                                        {isExpanded && "Meu Perfil"}
                                    </button>
                                )}
                                {onOpenCalendar && (
                                    <button onClick={() => { onOpenCalendar(); setIsUserMenuOpen(false); }} className="flex w-full items-center gap-3 px-4 py-2 text-sm text-on-surface-dark hover:bg-gray-700">
                                        <FaCalendarAlt className="text-blue-400 w-4 h-4" />
                                        {isExpanded && "Calendário"}
                                    </button>
                                )}
                                {onOpenManual && (
                                    <button onClick={() => { onOpenManual(); setIsUserMenuOpen(false); }} className="flex w-full items-center gap-3 px-4 py-2 text-sm text-on-surface-dark hover:bg-gray-700">
                                        <FaBook className="text-green-400 w-4 h-4" />
                                        {isExpanded && "Manual"}
                                    </button>
                                )}
                                <button onClick={() => setLayoutMode('top')} className="flex w-full items-center gap-3 px-4 py-2 text-sm text-on-surface-dark hover:bg-gray-700">
                                    <FaColumns className="text-gray-400 w-4 h-4" />
                                    {isExpanded && "Menu Topo"}
                                </button>
                                <button onClick={() => setShowMFA(true)} className="flex w-full items-center gap-3 px-4 py-2 text-sm text-on-surface-dark hover:bg-gray-700">
                                    <FaFingerprint className="text-brand-secondary w-4 h-4" />
                                    {isExpanded && "Configurar 2FA"}
                                </button>
                                {isAdmin && (
                                    <>
                                        <TabButton 
                                            tab="settings" 
                                            label="Configurações" 
                                            icon={<FaCog className="text-brand-secondary w-4 h-4"/>} 
                                            isDropdownItem 
                                            activeTab={activeTab} 
                                            setActiveTab={handleTabClick}
                                            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-on-surface-dark hover:bg-gray-700"
                                        />
                                        {onOpenAutomation && (
                                            <button onClick={onOpenAutomation} className="flex w-full items-center gap-3 px-4 py-2 text-sm text-on-surface-dark hover:bg-gray-700">
                                                <FaRobot className="text-purple-400 w-4 h-4" />
                                                {isExpanded && "Automação"}
                                            </button>
                                        )}
                                        <button onClick={() => setShowAudit(true)} className="flex w-full items-center gap-3 px-4 py-2 text-sm text-on-surface-dark hover:bg-gray-700">
                                            <FaClipboardList className="text-yellow-400 w-4 h-4" />
                                            {isExpanded && "Logs Auditoria"}
                                        </button>
                                        <button onClick={() => setShowDbSchema(true)} className="flex w-full items-center gap-3 px-4 py-2 text-sm text-on-surface-dark hover:bg-gray-700">
                                            <FaDatabase className="text-green-400 w-4 h-4" />
                                            {isExpanded && "Config BD"}
                                        </button>
                                    </>
                                )}
                                <div className="border-t border-gray-700 my-1"></div>
                                <button onClick={onLogout} className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-gray-700">
                                    <LogoutIcon className="w-4 h-4" />
                                    {isExpanded && t('common.logout')}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <button onClick={onLogout} className="flex items-center justify-center w-full p-2 text-gray-400 hover:text-white">
                        <LogoutIcon className="w-6 h-6" />
                    </button>
                )}
            </div>
        </aside>
        
        {showMFA && <MFASetupModal onClose={() => setShowMFA(false)} />}
        {showAudit && <AuditLogModal onClose={() => setShowAudit(false)} />}
        {showDbSchema && <DatabaseSchemaModal onClose={() => setShowDbSchema(false)} />}
        </>
    );
};

export default Sidebar;
