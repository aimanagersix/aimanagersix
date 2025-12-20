
import React, { useState, useRef, useEffect } from 'react';
import { Collaborator, ModuleKey, PermissionAction } from './types';
// Added FaBell to imports to resolve line 145 error
import { FaClipboardList, FaBuilding, FaUsers, FaTicketAlt, FaSitemap, FaShieldAlt, FaBoxOpen, FaToolbox, FaChevronDown, FaBars, FaChartBar, FaUserTie, FaTachometerAlt, FaKey, FaShoppingCart, FaNetworkWired, FaServer, FaShieldVirus, FaFileSignature, FaUserTie as FaGraduationCap, FaAddressBook, FaMapMarkedAlt, FaCalendarAlt, FaBook, FaBell } from './components/common/Icons';
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
    const { t } = useLanguage();
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleMenu = (menu: string) => setOpenMenu(openMenu === menu ? null : menu);
    const isOrganizationActive = activeTab.startsWith('organizacao') || activeTab === 'collaborators';
    const isInventoryActive = activeTab.startsWith('equipment') || activeTab === 'licensing';
    const isNis2Active = activeTab.startsWith('nis2');
    const isOverviewActive = activeTab.startsWith('overview') || activeTab === 'my_area';

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

                    <nav className="hidden md:flex items-center space-x-2">
                        {tabConfig['overview'] && (
                            <div className="relative">
                                <button onClick={() => toggleMenu('overview')} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isOverviewActive ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}>
                                    <FaChartBar /> {t('nav.overview')} <FaChevronDown className="w-3 h-3 ml-1" />
                                </button>
                                {openMenu === 'overview' && (
                                    <div className="absolute z-20 mt-2 w-60 rounded-md bg-surface-dark shadow-lg ring-1 ring-black ring-opacity-5 py-1">
                                        {checkPermission('widget_kpi_cards', 'view') && <TabButton tab="overview" label={t('nav.dashboard')} icon={<FaChartBar />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab}/>}
                                        {checkPermission('my_area', 'view') && <TabButton tab="my_area" label={t('nav.my_area')} icon={<FaUserTie className="text-brand-secondary" />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab}/>}
                                        {tabConfig['overview.smart'] && <TabButton tab="overview.smart" label={t('nav.c_level')} icon={<FaTachometerAlt className="text-purple-400" />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab}/>}
                                    </div>
                                )}
                            </div>
                        )}

                        {(tabConfig['organizacao.instituicoes'] || tabConfig['organizacao.entidades'] || tabConfig['collaborators']) && (
                            <div className="relative">
                                <button onClick={() => toggleMenu('org')} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isOrganizationActive ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}>
                                    <FaSitemap /> {t('nav.organization')} <FaChevronDown className="w-3 h-3 ml-1" />
                                </button>
                                {openMenu === 'org' && (
                                    <div className="absolute z-20 mt-2 w-60 rounded-md bg-surface-dark shadow-lg py-1">
                                        {tabConfig['organizacao.instituicoes'] && <TabButton tab="organizacao.instituicoes" label={t('nav.institutions')} icon={<FaSitemap />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                        {tabConfig['organizacao.entidades'] && <TabButton tab="organizacao.entidades" label={t('nav.entities')} icon={<FaBuilding />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                        {tabConfig['collaborators'] && <TabButton tab="collaborators" label={t('nav.collaborators')} icon={<FaUsers />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="relative">
                            <button onClick={() => toggleMenu('inventory')} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isInventoryActive ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}>
                                <FaBoxOpen /> {t('nav.inventory')} <FaChevronDown className="w-3 h-3 ml-1" />
                            </button>
                            {openMenu === 'inventory' && (
                                <div className="absolute z-20 mt-2 w-60 rounded-md bg-surface-dark shadow-lg py-1">
                                    {tabConfig['equipment.inventory'] && <TabButton tab="equipment.inventory" label={t('nav.assets_inventory')} icon={<FaClipboardList />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                    {tabConfig['licensing'] && <TabButton tab="licensing" label={t('nav.licensing')} icon={<FaKey />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                    {tabConfig['equipment.procurement'] && <TabButton tab="equipment.procurement" label={t('nav.procurement')} icon={<FaShoppingCart />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <button onClick={() => toggleMenu('nis2')} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isNis2Active ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}>
                                <FaShieldAlt /> {t('nav.compliance')} <FaChevronDown className="w-3 h-3 ml-1" />
                                </button>
                            {openMenu === 'nis2' && (
                                <div className="absolute z-20 mt-2 w-60 rounded-md bg-surface-dark shadow-lg py-1">
                                    {tabConfig.nis2?.bia && <TabButton tab="nis2.bia" label={t('nav.bia')} icon={<FaNetworkWired />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                    {tabConfig.nis2?.security && <TabButton tab="nis2.security" label={t('nav.security')} icon={<FaShieldAlt />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                    {tabConfig.nis2?.backups && <TabButton tab="nis2.backups" label={t('nav.backups')} icon={<FaServer />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                    {tabConfig.nis2?.resilience && <TabButton tab="nis2.resilience" label={t('nav.resilience')} icon={<FaShieldVirus className="text-purple-400"/>} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                    {tabConfig.nis2?.training && <TabButton tab="nis2.training" label={t('nav.training')} icon={<FaGraduationCap className="text-green-400"/>} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                    {tabConfig.nis2?.policies && <TabButton tab="nis2.policies" label={t('nav.policies')} icon={<FaFileSignature className="text-yellow-400"/>} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                </div>
                            )}
                        </div>

                        {tabConfig['tickets'] && <TabButton tab="tickets.list" label={t('nav.tickets')} icon={<FaTicketAlt />} activeTab={activeTab} setActiveTab={setActiveTab}/>}
                        
                        <div className="relative">
                            <button onClick={() => toggleMenu('tools')} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab.startsWith('tools') ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}>
                                <FaToolbox /> {t('nav.tools')} <FaChevronDown className="w-3 h-3 ml-1" />
                            </button>
                            {openMenu === 'tools' && (
                                <div className="absolute z-20 mt-2 w-60 rounded-md bg-surface-dark shadow-lg py-1">
                                    <TabButton tab="tools.agenda" label={t('nav.agenda')} icon={<FaAddressBook />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />
                                    <TabButton tab="tools.map" label={t('nav.map')} icon={<FaMapMarkedAlt className="text-red-400" />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />
                                    <TabButton label={t('nav.calendar')} icon={<FaCalendarAlt className="text-blue-400" />} isDropdownItem onClick={() => onOpenCalendar()} />
                                    <TabButton label={t('nav.manual')} icon={<FaBook className="text-green-400" />} isDropdownItem onClick={() => onOpenManual()} />
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
        </header>
    );
};

export default Header;
