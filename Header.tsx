import React, { useState, useRef, useEffect } from 'react';
import { Collaborator, ModuleKey, PermissionAction } from './types';
import { FaClipboardList, FaBuilding, FaUsers, FaTicketAlt, FaSitemap, FaShieldAlt, FaBoxOpen, FaToolbox, FaChevronDown, FaBars, FaChartBar, FaUserTie, FaTachometerAlt, FaKey, FaShoppingCart, FaNetworkWired, FaServer, FaShieldVirus, FaFileSignature, FaUserTie as FaGraduationCap, FaAddressBook, FaMapMarkedAlt, FaCalendarAlt, FaBook, FaBell, FaSync, FaTags } from './components/common/Icons';
import { useLanguage } from './contexts/LanguageContext';
import UserMenu from './components/UserMenu';

interface HeaderProps {
  currentUser: Collaborator | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  tabConfig: Record<string, any>;
  notificationCount: number;
  onNotificationClick: () => void;
  onOpenProfile: () => void;
  onOpenCalendar: () => void;
  onOpenManual: () => void;
  checkPermission: (module: ModuleKey, action: PermissionAction) => boolean;
}

const TabButton = ({ tab, label, icon, activeTab, setActiveTab, isDropdownItem = false, onClick }: { tab?: string, label: string, icon: React.ReactNode, activeTab?: string, setActiveTab?: (tab: string) => void, isDropdownItem?: boolean, onClick?: () => void }) => {
    const handleClick = (e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        if (onClick) onClick();
        else if (tab && setActiveTab) setActiveTab(tab);
    };

    return (
        <a href={tab ? `#${tab}` : '#'} onClick={handleClick} className={`flex items-center gap-2 w-full text-left rounded-md no-underline transition-all ${isDropdownItem ? `px-4 py-2 text-sm ${tab && activeTab === tab ? 'bg-brand-secondary text-white' : 'text-on-surface-dark hover:bg-gray-700'}` : `px-3 py-2 text-sm font-medium ${tab && activeTab === tab ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}`}>
            {icon} <span>{label}</span>
        </a>
    );
};

const Header: React.FC<HeaderProps> = ({ currentUser, activeTab, setActiveTab, onLogout, tabConfig, notificationCount, onNotificationClick, onOpenProfile, onOpenCalendar, onOpenManual, checkPermission }) => {
    const { t, setLanguage, language } = useLanguage();
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleMenu = (menu: string) => setOpenMenu(openMenu === menu ? null : menu);
    
    // Logic for active groups
    const isOverviewActive = activeTab.startsWith('overview') || activeTab === 'my_area';
    const isOrganizationActive = activeTab.startsWith('organizacao') || activeTab === 'collaborators';
    const isInventoryActive = activeTab.startsWith('equipment') || activeTab === 'licensing';
    const isNis2Active = activeTab.startsWith('nis2');

    const navigateMobile = (tab: string) => {
        setActiveTab(tab);
        setIsMobileMenuOpen(false);
    };

    return (
        <header className="bg-gray-800 shadow-lg relative z-30 flex-shrink-0" ref={menuRef}>
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20 gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"><FaBars className="h-6 w-6" /></button>
                        <div className="flex items-center flex-shrink-0 cursor-pointer" onClick={() => setActiveTab('overview')}>
                            <span className="font-bold text-2xl text-white">AI<span className="text-brand-secondary">Manager</span></span>
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center space-x-1">
                        {/* GRUPO: DASHBOARDS */}
                        <div className="relative">
                            <button onClick={() => toggleMenu('overview')} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isOverviewActive ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}>
                                <FaChartBar /> {t('nav.overview')} <FaChevronDown className="w-2 h-2 ml-1" />
                            </button>
                            {openMenu === 'overview' && (
                                <div className="absolute z-20 mt-2 w-60 rounded-md bg-surface-dark shadow-lg border border-gray-700 py-1">
                                    {checkPermission('widget_kpi_cards', 'view') && <TabButton tab="overview" label={t('nav.dashboard')} icon={<FaChartBar />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab}/>}
                                    {checkPermission('my_area', 'view') && <TabButton tab="my_area" label={t('nav.my_area')} icon={<FaUserTie className="text-brand-secondary" />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab}/>}
                                    {checkPermission('dashboard_smart', 'view') && <TabButton tab="overview.smart" label={t('nav.c_level')} icon={<FaTachometerAlt className="text-purple-400" />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab}/>}
                                </div>
                            )}
                        </div>

                        {/* GRUPO: ORGANIZAÇÃO */}
                        <div className="relative">
                            <button onClick={() => toggleMenu('org')} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isOrganizationActive ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}>
                                <FaSitemap /> {t('nav.organization')} <FaChevronDown className="w-2 h-2 ml-1" />
                            </button>
                            {openMenu === 'org' && (
                                <div className="absolute z-20 mt-2 w-60 rounded-md bg-surface-dark shadow-lg border border-gray-700 py-1">
                                    {checkPermission('org_institutions', 'view') && <TabButton tab="organizacao.instituicoes" label={t('nav.institutions')} icon={<FaSitemap />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                    {checkPermission('org_entities', 'view') && <TabButton tab="organizacao.entidades" label={t('nav.entities')} icon={<FaBuilding />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                    {checkPermission('org_collaborators', 'view') && <TabButton tab="collaborators" label={t('nav.collaborators')} icon={<FaUsers />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                    {checkPermission('org_suppliers', 'view') && <TabButton tab="organizacao.suppliers" label={t('nav.suppliers')} icon={<FaShieldAlt className="text-orange-400" />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                </div>
                            )}
                        </div>

                        {/* GRUPO: INVENTÁRIO */}
                        <div className="relative">
                            <button onClick={() => toggleMenu('inventory')} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isInventoryActive ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}>
                                <FaBoxOpen /> {t('nav.inventory')} <FaChevronDown className="w-2 h-2 ml-1" />
                            </button>
                            {openMenu === 'inventory' && (
                                <div className="absolute z-20 mt-2 w-60 rounded-md bg-surface-dark shadow-lg border border-gray-700 py-1">
                                    {checkPermission('equipment', 'view') && <TabButton tab="equipment.inventory" label={t('nav.assets_inventory')} icon={<FaClipboardList />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                    {checkPermission('licensing', 'view') && <TabButton tab="licensing" label={t('nav.licensing')} icon={<FaKey />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                    {checkPermission('procurement', 'view') && <TabButton tab="equipment.procurement" label={t('nav.procurement')} icon={<FaShoppingCart />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                </div>
                            )}
                        </div>

                        {/* GRUPO: COMPLIANCE NIS2 */}
                        <div className="relative">
                            <button onClick={() => toggleMenu('nis2')} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isNis2Active ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}>
                                <FaShieldAlt /> {t('nav.compliance')} <FaChevronDown className="w-2 h-2 ml-1" />
                            </button>
                            {openMenu === 'nis2' && (
                                <div className="absolute z-20 mt-2 w-60 rounded-md bg-surface-dark shadow-lg border border-gray-700 py-1">
                                    {checkPermission('compliance_bia', 'view') && <TabButton tab="nis2.bia" label={t('nav.bia')} icon={<FaNetworkWired />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                    {checkPermission('compliance_security', 'view') && <TabButton tab="nis2.security" label={t('nav.security')} icon={<FaShieldAlt className="text-red-400" />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                    {checkPermission('compliance_backups', 'view') && <TabButton tab="nis2.backups" label={t('nav.backups')} icon={<FaServer />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                    {checkPermission('compliance_resilience', 'view') && <TabButton tab="nis2.resilience" label={t('nav.resilience')} icon={<FaShieldVirus className="text-purple-400"/>} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                    {checkPermission('compliance_training', 'view') && <TabButton tab="nis2.training" label={t('nav.training')} icon={<FaGraduationCap className="text-green-400"/>} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                    {checkPermission('compliance_policies', 'view') && <TabButton tab="nis2.policies" label={t('nav.policies')} icon={<FaFileSignature className="text-yellow-400"/>} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                </div>
                            )}
                        </div>

                        {checkPermission('tickets', 'view') && <TabButton tab="tickets.list" label={t('nav.tickets')} icon={<FaTicketAlt />} activeTab={activeTab} setActiveTab={setActiveTab}/>}
                        
                        {/* GRUPO: FERRAMENTAS */}
                        <div className="relative">
                            <button onClick={() => toggleMenu('tools')} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab.startsWith('tools') ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}>
                                <FaToolbox /> {t('nav.tools')} <FaChevronDown className="w-2 h-2 ml-1" />
                            </button>
                            {openMenu === 'tools' && (
                                <div className="absolute z-20 mt-2 w-60 rounded-md bg-surface-dark shadow-lg border border-gray-700 py-1">
                                    {checkPermission('tools_agenda', 'view') && <TabButton tab="tools.agenda" label={t('nav.agenda')} icon={<FaAddressBook />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                    {checkPermission('tools_map', 'view') && <TabButton tab="tools.map" label={t('nav.map')} icon={<FaMapMarkedAlt className="text-red-400" />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                    {checkPermission('tools_calendar', 'view') && <TabButton label={t('nav.calendar')} icon={<FaCalendarAlt className="text-blue-400" />} isDropdownItem onClick={() => onOpenCalendar()} />}
                                    {checkPermission('tools_manual', 'view') && <TabButton label={t('nav.manual')} icon={<FaBook className="text-green-400" />} isDropdownItem onClick={() => onOpenManual()} />}
                                </div>
                            )}
                        </div>
                    </nav>

                    <div className="flex items-center space-x-4">
                        <button onClick={onNotificationClick} className="relative p-2 text-gray-400 hover:text-white">
                            <FaBell className="w-6 h-6" />
                            {notificationCount > 0 && <span className="absolute top-0 right-0 px-2 py-1 text-xs font-bold text-red-100 bg-red-600 rounded-full">{notificationCount}</span>}
                        </button>
                        {currentUser && <UserMenu currentUser={currentUser} onLogout={onLogout} onOpenProfile={onOpenProfile} setActiveTab={setActiveTab} checkPermission={checkPermission} />}
                    </div>
                </div>
            </div>

            {/* MOBILE MENU DRAWER */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-gray-900 border-t border-gray-700 absolute w-full left-0 top-20 shadow-2xl z-40 max-h-[85vh] overflow-y-auto animate-fade-in">
                    <div className="px-4 py-4 space-y-6">
                        {/* Dashboards Section */}
                        <section>
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-2">Dashboards</h3>
                            <div className="space-y-1">
                                {checkPermission('my_area', 'view') && <TabButton tab="my_area" label={t('nav.my_area')} icon={<FaUserTie className="text-brand-secondary"/>} activeTab={activeTab} setActiveTab={navigateMobile} isDropdownItem/>}
                                {checkPermission('widget_kpi_cards', 'view') && <TabButton tab="overview" label={t('nav.dashboard')} icon={<FaChartBar />} activeTab={activeTab} setActiveTab={navigateMobile} isDropdownItem/>}
                                {checkPermission('dashboard_smart', 'view') && <TabButton tab="overview.smart" label={t('nav.c_level')} icon={<FaTachometerAlt className="text-purple-400"/>} activeTab={activeTab} setActiveTab={navigateMobile} isDropdownItem/>}
                            </div>
                        </section>

                        {/* Org & Assets */}
                        <div className="grid grid-cols-2 gap-6">
                            <section>
                                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-2">{t('nav.organization')}</h3>
                                <div className="space-y-1">
                                    {checkPermission('org_institutions', 'view') && <TabButton tab="organizacao.instituicoes" label={t('nav.institutions')} icon={<FaSitemap />} activeTab={activeTab} setActiveTab={navigateMobile} isDropdownItem/>}
                                    {checkPermission('org_entities', 'view') && <TabButton tab="organizacao.entidades" label={t('nav.entities')} icon={<FaBuilding />} activeTab={activeTab} setActiveTab={navigateMobile} isDropdownItem/>}
                                    {checkPermission('org_collaborators', 'view') && <TabButton tab="collaborators" label={t('nav.collaborators')} icon={<FaUsers />} activeTab={activeTab} setActiveTab={navigateMobile} isDropdownItem/>}
                                    {checkPermission('org_suppliers', 'view') && <TabButton tab="organizacao.suppliers" label={t('nav.suppliers')} icon={<FaShieldAlt className="text-orange-400"/>} activeTab={activeTab} setActiveTab={navigateMobile} isDropdownItem/>}
                                </div>
                            </section>
                            <section>
                                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-2">{t('nav.inventory')}</h3>
                                <div className="space-y-1">
                                    {checkPermission('equipment', 'view') && <TabButton tab="equipment.inventory" label={t('nav.assets_inventory')} icon={<FaClipboardList />} activeTab={activeTab} setActiveTab={navigateMobile} isDropdownItem/>}
                                    {checkPermission('licensing', 'view') && <TabButton tab="licensing" label={t('nav.licensing')} icon={<FaKey />} activeTab={activeTab} setActiveTab={navigateMobile} isDropdownItem/>}
                                    {checkPermission('procurement', 'view') && <TabButton tab="equipment.procurement" label={t('nav.procurement')} icon={<FaShoppingCart />} activeTab={activeTab} setActiveTab={navigateMobile} isDropdownItem/>}
                                </div>
                            </section>
                        </div>

                        {/* Compliance Section */}
                        <section>
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-2">Compliance & NIS2</h3>
                            <div className="grid grid-cols-2 gap-1">
                                {checkPermission('compliance_bia', 'view') && <TabButton tab="nis2.bia" label={t('nav.bia')} icon={<FaNetworkWired />} activeTab={activeTab} setActiveTab={navigateMobile} isDropdownItem/>}
                                {checkPermission('compliance_security', 'view') && <TabButton tab="nis2.security" label={t('nav.security')} icon={<FaShieldAlt className="text-red-400"/>} activeTab={activeTab} setActiveTab={navigateMobile} isDropdownItem/>}
                                {checkPermission('compliance_backups', 'view') && <TabButton tab="nis2.backups" label={t('nav.backups')} icon={<FaServer />} activeTab={activeTab} setActiveTab={navigateMobile} isDropdownItem/>}
                                {checkPermission('compliance_resilience', 'view') && <TabButton tab="nis2.resilience" label={t('nav.resilience')} icon={<FaShieldVirus className="text-purple-400"/>} activeTab={activeTab} setActiveTab={navigateMobile} isDropdownItem/>}
                                {checkPermission('compliance_training', 'view') && <TabButton tab="nis2.training" label={t('nav.training')} icon={<FaGraduationCap className="text-green-400"/>} activeTab={activeTab} setActiveTab={navigateMobile} isDropdownItem/>}
                                {checkPermission('compliance_policies', 'view') && <TabButton tab="nis2.policies" label={t('nav.policies')} icon={<FaFileSignature className="text-yellow-400"/>} activeTab={activeTab} setActiveTab={navigateMobile} isDropdownItem/>}
                            </div>
                        </section>

                        {/* Support & Tools */}
                        <div className="grid grid-cols-2 gap-6">
                            <section>
                                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-2">Support</h3>
                                <div className="space-y-1">
                                    {checkPermission('tickets', 'view') && <TabButton tab="tickets.list" label={t('nav.tickets')} icon={<FaTicketAlt />} activeTab={activeTab} setActiveTab={navigateMobile} isDropdownItem/>}
                                </div>
                            </section>
                            <section>
                                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-2">{t('nav.tools')}</h3>
                                <div className="space-y-1">
                                    {checkPermission('tools_agenda', 'view') && <TabButton tab="tools.agenda" label={t('nav.agenda')} icon={<FaAddressBook />} activeTab={activeTab} setActiveTab={navigateMobile} isDropdownItem/>}
                                    {checkPermission('tools_map', 'view') && <TabButton tab="tools.map" label={t('nav.map')} icon={<FaMapMarkedAlt className="text-red-400"/>} activeTab={activeTab} setActiveTab={navigateMobile} isDropdownItem/>}
                                </div>
                            </section>
                        </div>

                        {/* Logout */}
                        <div className="pt-4 border-t border-gray-800">
                             <button onClick={onLogout} className="flex w-full items-center gap-3 px-4 py-4 text-red-400 hover:bg-red-900/10 transition-colors font-bold rounded-lg border border-red-900/30">
                                <FaSync /> {t('common.logout')}
                             </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;