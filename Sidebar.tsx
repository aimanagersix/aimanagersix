
import React, { useState } from 'react';
import { Collaborator, ModuleKey, PermissionAction } from './types';
import { FaChartBar, FaSitemap, FaBoxOpen, FaShieldAlt, FaTicketAlt, FaFileSignature, FaToolbox, FaChevronDown, FaChevronRight, FaTimes, FaUserTie, FaTachometerAlt, FaBuilding, FaUsers, FaClipboardList, FaKey, FaShoppingCart, FaNetworkWired, FaServer, FaShieldVirus, FaGraduationCap, FaAddressBook, FaMapMarkedAlt, FaCalendarAlt, FaBook, FaBell } from './components/common/Icons';
import { useLanguage } from './contexts/LanguageContext';
import UserMenu from './components/UserMenu';

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
  onOpenProfile: () => void;
  onOpenCalendar: () => void;
  onOpenManual: () => void;
  checkPermission: (module: ModuleKey, action: PermissionAction) => boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentUser, activeTab, setActiveTab, onLogout, tabConfig, notificationCount, onNotificationClick, isExpanded, onHover, onOpenProfile, onOpenCalendar, onOpenManual, checkPermission }) => {
    const { t } = useLanguage();
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
        overview: activeTab.startsWith('overview') || activeTab === 'my_area',
        org: activeTab.startsWith('organizacao') || activeTab === 'collaborators',
        inv: activeTab.startsWith('equipment') || activeTab === 'licensing',
        compliance: activeTab.startsWith('nis2'),
        tools: activeTab.startsWith('tools')
    });

    const toggleMenu = (menu: string) => setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));

    const TabButton = ({ tab, label, icon, isDropdownItem = false, onClick }: { tab?: string, label: string, icon: React.ReactNode, isDropdownItem?: boolean, onClick?: () => void }) => {
        const active = tab && activeTab === tab;
        return (
            <button onClick={() => onClick ? onClick() : (tab && setActiveTab(tab))} className={`flex items-center gap-3 w-full text-left transition-all duration-200 rounded-md overflow-hidden whitespace-nowrap ${isDropdownItem ? `px-4 py-2 text-sm ${active ? 'bg-brand-secondary text-white' : 'text-on-surface-dark hover:bg-gray-700'}` : `px-4 py-3 text-sm font-medium ${active ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-gray-800 hover:text-white'}`}`}>
                <span className="text-lg flex-shrink-0 w-6 flex justify-center">{icon}</span>
                <span className={`transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{label}</span>
            </button>
        );
    };

    return (
        <>
            <div className={`fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => onHover(false)} />
            <aside 
                className={`fixed top-0 left-0 h-screen bg-gray-900 shadow-2xl z-50 flex flex-col border-r border-gray-800 transition-all duration-300 ease-in-out ${isExpanded ? 'w-72' : 'w-20'} md:relative`} 
                onMouseEnter={() => { if(window.innerWidth >= 768) onHover(true); }} 
                onMouseLeave={() => { if(window.innerWidth >= 768) onHover(false); }}
            >
                <div className="flex items-center justify-between h-20 bg-gray-900 border-b border-gray-800 px-4">
                    <span className="font-bold text-2xl text-white truncate transition-all duration-300">
                        {isExpanded ? <>AI<span className="text-brand-secondary">Manager</span></> : <span className="text-brand-secondary">AI</span>}
                    </span>
                    <button className="md:hidden text-gray-400 p-2 hover:bg-gray-800 rounded" onClick={() => onHover(false)}>
                        <FaTimes size={20}/>
                    </button>
                </div>

                <nav className="flex-grow py-4 px-2 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
                    <div className="space-y-1">
                        <button onClick={() => toggleMenu('overview')} className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-md text-on-surface-dark-secondary hover:bg-gray-800 transition-colors ${openMenus.overview ? 'text-white bg-gray-800/50' : ''}`}>
                            <div className="flex items-center gap-3">
                                <FaChartBar className="text-lg" /> 
                                <span className={`transition-all duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{t('nav.overview')}</span>
                            </div>
                            {isExpanded && <FaChevronRight className={`w-3 h-3 transition-transform duration-200 ${openMenus.overview ? 'rotate-90' : ''}`} />}
                        </button>
                        {openMenus.overview && isExpanded && (
                            <div className="pl-4 space-y-1 bg-gray-800/30 rounded-md py-1 animate-fade-in">
                                <TabButton tab="overview" label={t('nav.dashboard')} icon={<FaChartBar />} isDropdownItem />
                                <TabButton tab="my_area" label={t('nav.my_area')} icon={<FaUserTie className="text-brand-secondary" />} isDropdownItem />
                                {checkPermission('dashboard_smart', 'view') && <TabButton tab="overview.smart" label={t('nav.c_level')} icon={<FaTachometerAlt className="text-purple-400" />} isDropdownItem />}
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <button onClick={() => toggleMenu('org')} className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-md text-on-surface-dark-secondary hover:bg-gray-800 transition-colors ${openMenus.org ? 'text-white bg-gray-800/50' : ''}`}>
                            <div className="flex items-center gap-3">
                                <FaSitemap className="text-lg" /> 
                                <span className={`transition-all duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{t('nav.organization')}</span>
                            </div>
                            {isExpanded && <FaChevronRight className={`w-3 h-3 transition-transform duration-200 ${openMenus.org ? 'rotate-90' : ''}`} />}
                        </button>
                        {openMenus.org && isExpanded && (
                            <div className="pl-4 space-y-1 bg-gray-800/30 rounded-md py-1 animate-fade-in">
                                {checkPermission('org_institutions', 'view') && <TabButton tab="organizacao.instituicoes" label={t('nav.institutions')} icon={<FaSitemap />} isDropdownItem />}
                                {checkPermission('org_entities', 'view') && <TabButton tab="organizacao.entidades" label={t('nav.entities')} icon={<FaBuilding />} isDropdownItem />}
                                {checkPermission('org_collaborators', 'view') && <TabButton tab="collaborators" label={t('nav.collaborators')} icon={<FaUsers />} isDropdownItem />}
                                {checkPermission('organization', 'view') && <TabButton tab="organizacao.teams" label={t('nav.teams')} icon={<FaUsers />} isDropdownItem />}
                                {checkPermission('org_suppliers', 'view') && <TabButton tab="organizacao.suppliers" label={t('nav.suppliers')} icon={<FaShieldAlt />} isDropdownItem />}
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <button onClick={() => toggleMenu('inv')} className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-md text-on-surface-dark-secondary hover:bg-gray-800 transition-colors ${openMenus.inv ? 'text-white bg-gray-800/50' : ''}`}>
                            <div className="flex items-center gap-3">
                                <FaBoxOpen className="text-lg" /> 
                                <span className={`transition-all duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{t('nav.inventory')}</span>
                            </div>
                            {isExpanded && <FaChevronRight className={`w-3 h-3 transition-transform duration-200 ${openMenus.inv ? 'rotate-90' : ''}`} />}
                        </button>
                        {openMenus.inv && isExpanded && (
                            <div className="pl-4 space-y-1 bg-gray-800/30 rounded-md py-1 animate-fade-in">
                                {checkPermission('equipment', 'view') && <TabButton tab="equipment.inventory" label={t('nav.assets_inventory')} icon={<FaClipboardList />} isDropdownItem />}
                                {checkPermission('licensing', 'view') && <TabButton tab="licensing" label={t('nav.licensing')} icon={<FaKey />} isDropdownItem />}
                                {checkPermission('procurement', 'view') && <TabButton tab="equipment.procurement" label={t('nav.procurement')} icon={<FaShoppingCart />} isDropdownItem />}
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <button onClick={() => toggleMenu('compliance')} className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-md text-on-surface-dark-secondary hover:bg-gray-800 transition-colors ${openMenus.compliance ? 'text-white bg-gray-800/50' : ''}`}>
                            <div className="flex items-center gap-3">
                                <FaShieldAlt className="text-lg" /> 
                                <span className={`transition-all duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{t('nav.compliance')}</span>
                            </div>
                            {isExpanded && <FaChevronRight className={`w-3 h-3 transition-transform duration-200 ${openMenus.compliance ? 'rotate-90' : ''}`} />}
                        </button>
                        {openMenus.compliance && isExpanded && (
                            <div className="pl-4 space-y-1 bg-gray-800/30 rounded-md py-1 animate-fade-in">
                                {checkPermission('compliance_bia', 'view') && <TabButton tab="nis2.bia" label={t('nav.bia')} icon={<FaNetworkWired />} isDropdownItem />}
                                {checkPermission('compliance_security', 'view') && <TabButton tab="nis2.security" label={t('nav.security')} icon={<FaShieldAlt />} isDropdownItem />}
                                {checkPermission('compliance_backups', 'view') && <TabButton tab="nis2.backups" label={t('nav.backups')} icon={<FaServer />} isDropdownItem />}
                                {checkPermission('compliance_resilience', 'view') && <TabButton tab="nis2.resilience" label={t('nav.resilience')} icon={<FaShieldVirus className="text-purple-400"/>} isDropdownItem />}
                                {checkPermission('compliance_training', 'view') && <TabButton tab="nis2.training" label={t('nav.training')} icon={<FaGraduationCap />} isDropdownItem />}
                                {checkPermission('compliance_policies', 'view') && <TabButton tab="nis2.policies" label={t('nav.policies')} icon={<FaFileSignature />} isDropdownItem />}
                            </div>
                        )}
                    </div>

                    {checkPermission('tickets', 'view') && <TabButton tab="tickets.list" label={t('nav.tickets')} icon={<FaTicketAlt />} />}
                    {checkPermission('reports', 'view') && <TabButton tab="reports" label={t('nav.reports')} icon={<FaFileSignature />} />}

                    <div className="space-y-1">
                        <button onClick={() => toggleMenu('tools')} className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-md text-on-surface-dark-secondary hover:bg-gray-800 transition-colors ${openMenus.tools ? 'text-white bg-gray-800/50' : ''}`}>
                            <div className="flex items-center gap-3">
                                <FaToolbox className="text-lg" /> 
                                <span className={`transition-all duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{t('nav.tools')}</span>
                            </div>
                            {isExpanded && <FaChevronRight className={`w-3 h-3 transition-transform duration-200 ${openMenus.tools ? 'rotate-90' : ''}`} />}
                        </button>
                        {openMenus.tools && isExpanded && (
                            <div className="pl-4 space-y-1 bg-gray-800/30 rounded-md py-1 animate-fade-in">
                                {checkPermission('tools_agenda', 'view') && <TabButton tab="tools.agenda" label={t('nav.agenda')} icon={<FaAddressBook />} isDropdownItem />}
                                {checkPermission('tools_map', 'view') && <TabButton tab="tools.map" label={t('nav.map')} icon={<FaMapMarkedAlt className="text-red-400" />} isDropdownItem />}
                                {checkPermission('tools_calendar', 'view') && <TabButton label={t('nav.calendar')} icon={<FaCalendarAlt className="text-blue-400" />} isDropdownItem onClick={() => onOpenCalendar()} />}
                                {checkPermission('tools_manual', 'view') && <TabButton label={t('nav.manual')} icon={<FaBook className="text-green-400" />} isDropdownItem onClick={() => onOpenManual()} />}
                            </div>
                        )}
                    </div>
                </nav>

                <div className="p-4 border-t border-gray-800 bg-gray-900 relative">
                    <button 
                        onClick={onNotificationClick} 
                        className="flex md:hidden items-center justify-between w-full p-3 mb-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <FaBell size={18} className="text-brand-secondary" />
                            {isExpanded && <span className="text-sm">Notificações</span>}
                        </div>
                        {notificationCount > 0 && (
                            <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{notificationCount}</span>
                        )}
                    </button>
                    {currentUser && <UserMenu currentUser={currentUser} onLogout={onLogout} onOpenProfile={onOpenProfile} setActiveTab={setActiveTab} checkPermission={checkPermission} align="up" />}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
