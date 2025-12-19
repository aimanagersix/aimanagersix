
import React, { useState } from 'react';
import { Collaborator, UserRole, ModuleKey, PermissionAction } from './types';
import { FaClipboardList, FaBuilding, FaUsers, FaDoorOpen as LogoutIcon, FaKey, FaBell, FaFingerprint, FaUserShield, FaDatabase, FaUserCircle, FaCalendarAlt, FaBook, FaQuestionCircle } from './components/common/Icons';
import { FaShapes, FaTags, FaChartBar, FaTicketAlt, FaSitemap, FaNetworkWired, FaShieldAlt, FaBoxOpen, FaServer, FaColumns, FaChevronRight, FaChevronDown, FaRobot, FaTachometerAlt, FaAddressBook, FaCog, FaToolbox, FaGlobe, FaMapMarkedAlt, FaFileSignature, FaGraduationCap, FaShoppingCart, FaMobileAlt, FaTimes, FaUserTie } from 'react-icons/fa';
import { useLanguage } from './contexts/LanguageContext';
import { useLayout } from './contexts/LayoutContext';
import MFASetupModal from './components/MFASetupModal';
import AuditLogModal from './components/AuditLogModal';
import DatabaseSchemaModal from './components/DatabaseSchemaModal';
import InstallAppButton from './components/InstallAppButton';

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
  onOpenProfile?: () => void;
  onOpenCalendar?: () => void;
  onOpenManual?: () => void;
  checkPermission: (module: ModuleKey, action: PermissionAction) => boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentUser, activeTab, setActiveTab, onLogout, tabConfig, notificationCount, onNotificationClick, isExpanded, onHover, onOpenProfile, onOpenCalendar, onOpenManual, checkPermission }) => {
    const { t, setLanguage, language } = useLanguage();
    const { setLayoutMode } = useLayout();
    
    const [isOverviewOpen, setIsOverviewOpen] = useState(activeTab.startsWith('overview') || activeTab === 'my_area');
    const [isOrganizationOpen, setOrganizationOpen] = useState(activeTab.startsWith('organizacao') || activeTab === 'collaborators');
    const [isInventoryOpen, setInventoryOpen] = useState(activeTab.startsWith('equipment') || activeTab === 'licensing');
    const [isNis2Open, setIsNis2Open] = useState(activeTab.startsWith('nis2'));
    const [isToolsOpen, setIsToolsOpen] = useState(activeTab.startsWith('tools'));
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const [showMFA, setShowMFA] = useState(false);
    const [showAudit, setShowAudit] = useState(false);
    const [showDbSchema, setShowDbSchema] = useState(false);

    const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin' || currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.SuperAdmin;

    const TabButton = ({ tab, label, icon, activeTab, setActiveTab, isDropdownItem = false, className = '', onClick }: { tab?: string, label: string, icon: React.ReactNode, activeTab?: string, setActiveTab?: (tab: string) => void, isDropdownItem?: boolean, className?: string, onClick?: () => void }) => {
        const handleClick = (e: React.MouseEvent) => {
            if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            if (onClick) onClick();
            else if (tab && setActiveTab) setActiveTab(tab); 
        };
        return (
            <a href={tab ? `#${tab}` : '#'} onClick={handleClick} className={`flex items-center gap-3 w-full text-left transition-colors duration-200 rounded-md overflow-hidden whitespace-nowrap cursor-pointer no-underline ${
                isDropdownItem 
                ? `px-4 py-2 text-sm ${tab && activeTab === tab ? 'bg-brand-secondary text-white' : 'text-on-surface-dark hover:bg-gray-700'}` 
                : `px-4 py-3 text-sm font-medium ${tab && activeTab === tab ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`
            } ${className}`}>
                <span className="text-lg flex-shrink-0 w-6 flex justify-center">{icon}</span>
                <span className={`transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{label}</span>
            </a>
        );
    };

    return (
        <>
        <aside className={`fixed top-0 left-0 h-screen bg-gray-900 shadow-2xl z-50 flex flex-col border-r border-gray-800 transition-all duration-300 ${isExpanded ? 'w-64' : 'w-20'}`} onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)}>
            <div className="flex items-center justify-center h-20 bg-gray-900 border-b border-gray-800 overflow-hidden cursor-pointer" onClick={() => setActiveTab('overview')}>
                <span className="font-bold text-2xl text-white">{isExpanded ? <>AI<span className="text-brand-secondary">Manager</span></> : <span className="text-brand-secondary">AI</span>}</span>
            </div>

            <nav className="flex-grow py-4 px-2 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
                {tabConfig['overview'] && (
                    <div className="space-y-1">
                        <button onClick={() => setIsOverviewOpen(!isOverviewOpen)} className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-md transition-colors ${isOverviewOpen ? 'bg-gray-800 text-white' : 'text-on-surface-dark-secondary hover:bg-gray-800'}`}>
                            <div className="flex items-center gap-3 overflow-hidden">
                                <FaChartBar className="text-lg flex-shrink-0 w-6 flex justify-center" />
                                <span className={`transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{t('nav.overview')}</span>
                            </div>
                            {isExpanded && <FaChevronRight className={`w-3 h-3 transition-transform ${isOverviewOpen ? 'rotate-90' : ''}`} />}
                        </button>
                        {isOverviewOpen && isExpanded && (
                            <div className="pl-4 space-y-1 bg-gray-800/30 rounded-md py-1">
                                {checkPermission('widget_kpi_cards', 'view') && <TabButton tab="overview" label={t('nav.dashboard')} icon={<FaChartBar />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab}/>}
                                {checkPermission('my_area', 'view') && <TabButton tab="my_area" label={t('nav.my_area')} icon={<FaUserTie className="text-brand-secondary" />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab}/>}
                                {tabConfig['overview.smart'] && <TabButton tab="overview.smart" label={t('nav.c_level')} icon={<FaTachometerAlt className="text-purple-400" />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab}/>}
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-1">
                    <button onClick={() => setOrganizationOpen(!isOrganizationOpen)} className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-md transition-colors ${isOrganizationOpen ? 'bg-gray-800 text-white' : 'text-on-surface-dark-secondary hover:bg-gray-800'}`}>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <FaSitemap className="text-lg flex-shrink-0 w-6 flex justify-center" />
                            <span className={`transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{t('nav.organization')}</span>
                        </div>
                        {isExpanded && <FaChevronRight className={`w-3 h-3 transition-transform ${isOrganizationOpen ? 'rotate-90' : ''}`} />}
                    </button>
                    {isOrganizationOpen && isExpanded && (
                        <div className="pl-4 space-y-1 bg-gray-800/30 rounded-md py-1">
                            {tabConfig['organizacao.instituicoes'] && <TabButton tab="organizacao.instituicoes" label={t('nav.institutions')} icon={<FaSitemap />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                            {tabConfig['organizacao.entidades'] && <TabButton tab="organizacao.entidades" label={t('nav.entities')} icon={<FaBuilding />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                            {tabConfig['collaborators'] && <TabButton tab="collaborators" label={t('nav.collaborators')} icon={<FaUsers />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                            {tabConfig['organizacao.suppliers'] && <TabButton tab="organizacao.suppliers" label={t('nav.suppliers')} icon={<FaShieldAlt />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <button onClick={() => setInventoryOpen(!isInventoryOpen)} className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-md transition-colors ${isInventoryOpen ? 'bg-gray-800 text-white' : 'text-on-surface-dark-secondary hover:bg-gray-800'}`}>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <FaBoxOpen className="text-lg flex-shrink-0 w-6 flex justify-center" />
                            <span className={`transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{t('nav.inventory')}</span>
                        </div>
                        {isExpanded && <FaChevronRight className={`w-3 h-3 transition-transform ${isInventoryOpen ? 'rotate-90' : ''}`} />}
                    </button>
                    {isInventoryOpen && isExpanded && (
                        <div className="pl-4 space-y-1 bg-gray-800/30 rounded-md py-1">
                            {tabConfig['equipment.inventory'] && <TabButton tab="equipment.inventory" label={t('nav.assets_inventory')} icon={<FaClipboardList />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                            {tabConfig['licensing'] && <TabButton tab="licensing" label={t('nav.licensing')} icon={<FaKey />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                            {tabConfig['equipment.procurement'] && <TabButton tab="equipment.procurement" label={t('nav.procurement')} icon={<FaShoppingCart />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <button onClick={() => setIsNis2Open(!isNis2Open)} className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-md transition-colors ${isNis2Open ? 'bg-gray-800 text-white' : 'text-on-surface-dark-secondary hover:bg-gray-800'}`}>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <FaShieldAlt className="text-lg flex-shrink-0 w-6 flex justify-center" />
                            <span className={`transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{t('nav.compliance')}</span>
                        </div>
                        {isExpanded && <FaChevronRight className={`w-3 h-3 transition-transform ${isNis2Open ? 'rotate-90' : ''}`} />}
                    </button>
                    {isNis2Open && isExpanded && (
                        <div className="pl-4 space-y-1 bg-gray-800/30 rounded-md py-1">
                            {tabConfig.nis2?.bia && <TabButton tab="nis2.bia" label={t('nav.bia')} icon={<FaNetworkWired />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                            {tabConfig.nis2?.security && <TabButton tab="nis2.security" label={t('nav.security')} icon={<FaShieldAlt />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                            {tabConfig.nis2?.backups && <TabButton tab="nis2.backups" label={t('nav.backups')} icon={<FaServer />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                            {tabConfig.nis2?.resilience && <TabButton tab="nis2.resilience" label={t('nav.resilience')} icon={<FaShieldAlt className="text-purple-400"/>} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                            {tabConfig.nis2?.training && <TabButton tab="nis2.training" label={t('nav.training')} icon={<FaGraduationCap className="text-green-400"/>} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                            {tabConfig.nis2?.policies && <TabButton tab="nis2.policies" label={t('nav.policies')} icon={<FaFileSignature className="text-yellow-400"/>} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                        </div>
                    )}
                </div>

                {tabConfig['tickets'] && <TabButton tab="tickets.list" label={t('nav.tickets')} icon={<FaTicketAlt />} activeTab={activeTab} setActiveTab={setActiveTab} />}
                {tabConfig['reports'] && <TabButton tab="reports" label={t('nav.reports')} icon={<FaFileSignature />} activeTab={activeTab} setActiveTab={setActiveTab} />}

                {/* Tools Menu - Fixed visibility for Admin/SuperAdmin */}
                <div className="space-y-1">
                    <button onClick={() => setIsToolsOpen(!isToolsOpen)} className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-md transition-colors ${isToolsOpen ? 'bg-gray-800 text-white' : 'text-on-surface-dark-secondary hover:bg-gray-800'}`}>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <FaToolbox className="text-lg flex-shrink-0 w-6 flex justify-center" />
                            <span className={`transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{t('nav.tools')}</span>
                        </div>
                        {isExpanded && <FaChevronRight className={`w-3 h-3 transition-transform ${isToolsOpen ? 'rotate-90' : ''}`} />}
                    </button>
                    {isToolsOpen && isExpanded && (
                        <div className="pl-4 space-y-1 bg-gray-800/30 rounded-md py-1">
                            <TabButton tab="tools.agenda" label={t('nav.agenda')} icon={<FaAddressBook />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />
                            <TabButton tab="tools.map" label={t('nav.map')} icon={<FaMapMarkedAlt className="text-red-400" />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />
                            <TabButton label={t('nav.calendar')} icon={<FaCalendarAlt className="text-blue-400" />} isDropdownItem onClick={() => onOpenCalendar?.()} />
                            <TabButton label={t('nav.manual')} icon={<FaBook className="text-green-400" />} isDropdownItem onClick={() => onOpenManual?.()} />
                        </div>
                    )}
                </div>
            </nav>

            <div className="p-4 border-t border-gray-800 bg-gray-900 relative">
                <button onClick={(e) => { e.stopPropagation(); setIsUserMenuOpen(!isUserMenuOpen); }} className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-gray-800 transition-colors cursor-pointer">
                    {currentUser?.photoUrl ? <img src={currentUser.photoUrl} alt={currentUser.fullName} className="h-8 w-8 rounded-full object-cover" /> : <div className="h-8 w-8 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-white text-xs">{currentUser?.fullName.charAt(0)}</div>}
                    {isExpanded && (
                        <div className="overflow-hidden flex-grow text-left">
                            <p className="text-xs font-bold text-white truncate">{currentUser?.fullName}</p>
                            <p className="text-[10px] text-gray-500 truncate uppercase">{currentUser?.role}</p>
                        </div>
                    )}
                </button>
                {isUserMenuOpen && currentUser && (
                    <div className="absolute bottom-full left-2 w-64 mb-2 bg-surface-dark border border-gray-700 rounded-md shadow-2xl py-1 z-[100] overflow-hidden">
                        <div className="py-1">
                            <button onClick={() => { onOpenProfile?.(); setIsUserMenuOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"><FaUserCircle className="mr-3 text-brand-secondary" /> {t('common.profile')}</button>
                            <button onClick={() => { setLayoutMode('top'); setIsUserMenuOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"><FaColumns className="mr-3 text-gray-400" /> Menu Superior</button>
                            {isAdmin && (
                                <>
                                    <button onClick={() => { setActiveTab('settings'); setIsUserMenuOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"><FaCog className="mr-3 text-brand-secondary" /> {t('common.settings')}</button>
                                    <button onClick={() => { setShowAudit(true); setIsUserMenuOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"><FaClipboardList className="mr-3 text-yellow-400" /> {t('common.audit')}</button>
                                    {currentUser.role === 'SuperAdmin' && <button onClick={() => { setShowDbSchema(true); setIsUserMenuOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"><FaDatabase className="mr-3 text-green-400" /> {t('common.database')}</button>}
                                </>
                            )}
                            <div className="border-t border-gray-700 mt-1"><button onClick={onLogout} className="flex w-full items-center px-4 py-2 text-sm text-red-400 hover:bg-red-900/20"><LogoutIcon className="mr-3" /> {t('common.logout')}</button></div>
                        </div>
                    </div>
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
