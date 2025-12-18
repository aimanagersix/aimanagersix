
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
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [showMFA, setShowMFA] = useState(false);
    const [showAudit, setShowAudit] = useState(false);
    const [showDbSchema, setShowDbSchema] = useState(false);

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
                ? `px-4 py-3 text-sm ${tab && activeTab === tab ? 'bg-brand-secondary text-white' : 'text-on-surface-dark hover:bg-gray-700'}` 
                : `px-4 py-3 text-sm font-medium ${tab && activeTab === tab ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`
            }`}>
                <span className="text-lg flex-shrink-0 w-6 flex justify-center">{icon}</span>
                <span className={`transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{label}</span>
            </a>
        );
    };

    return (
        <>
        <aside className={`fixed top-0 left-0 h-screen bg-gray-900 shadow-2xl z-50 flex flex-col border-r border-gray-800 transition-all duration-300 ${isExpanded ? 'w-64' : 'w-20'}`} onMouseEnter={() => onHover(true)} onMouseLeave={() => { onHover(false); setIsUserMenuOpen(false); }}>
            <div className="flex items-center justify-center h-20 bg-gray-900 border-b border-gray-800 overflow-hidden cursor-pointer" onClick={() => setActiveTab('overview')}>
                <span className="font-bold text-2xl text-white">{isExpanded ? <>AI<span className="text-brand-secondary">Manager</span></> : <span className="text-brand-secondary">AI</span>}</span>
            </div>

            <nav className="flex-grow py-4 px-2 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
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
                        </div>
                    )}
                </div>
                {tabConfig['equipment.inventory'] && <TabButton tab="equipment.inventory" label={t('nav.inventory')} icon={<FaBoxOpen />} activeTab={activeTab} setActiveTab={setActiveTab} />}
                {tabConfig['tickets'] && <TabButton tab="tickets.list" label={t('nav.tickets')} icon={<FaTicketAlt />} activeTab={activeTab} setActiveTab={setActiveTab} />}
            </nav>

            <div className="p-4 border-t border-gray-800 bg-gray-900">
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-gray-800 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-white text-xs">{currentUser?.fullName.charAt(0)}</div>
                    {isExpanded && <span className="text-sm font-medium text-white truncate">{currentUser?.fullName}</span>}
                </button>
                {isUserMenuOpen && (
                    <div className="absolute bottom-full left-2 w-56 mb-2 bg-surface-dark border border-gray-700 rounded-md shadow-xl py-1 z-50">
                        <button onClick={onLogout} className="flex w-full items-center px-4 py-2 text-sm text-red-400 hover:bg-gray-700">
                            <LogoutIcon className="mr-3" /> {t('common.logout')}
                        </button>
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
