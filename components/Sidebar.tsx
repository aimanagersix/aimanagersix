
import React, { useState } from 'react';
import { Collaborator, UserRole } from '../types';
import { FaClipboardList, FaBuilding, FaUsers, FaDoorOpen as LogoutIcon, FaKey, FaBell, FaFingerprint, FaUserShield, FaDatabase, FaUserCircle, FaCalendarAlt, FaBook, FaQuestionCircle } from './common/Icons';
import { FaShapes, FaTags, FaChartBar, FaTicketAlt, FaSitemap, FaNetworkWired, FaShieldAlt, FaBoxOpen, FaServer, FaColumns, FaChevronRight, FaChevronDown, FaRobot, FaTachometerAlt, FaAddressBook, FaCog, FaToolbox, FaGlobe, FaMapMarkedAlt, FaFileSignature, FaGraduationCap, FaShoppingCart, FaMobileAlt, FaTimes } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';
import { useLayout } from '../contexts/LayoutContext';
import MFASetupModal from './MFASetupModal';
import AuditLogModal from './AuditLogModal';
import DatabaseSchemaModal from './DatabaseSchemaModal';
import InstallAppButton from './InstallAppButton';

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
}

const Sidebar: React.FC<SidebarProps> = ({ currentUser, activeTab, setActiveTab, onLogout, tabConfig, notificationCount, onNotificationClick, isExpanded, onHover, onOpenProfile, onOpenCalendar, onOpenManual }) => {
    const { t, setLanguage, language } = useLanguage();
    const { layoutMode, setLayoutMode } = useLayout();
    
    // Auto-open menus based on active tab
    const [isOrganizacaoOpen, setOrganizacaoOpen] = useState(activeTab.startsWith('organizacao') || activeTab === 'collaborators');
    const [isInventarioOpen, setInventarioOpen] = useState(activeTab.startsWith('equipment') || activeTab === 'licensing');
    const [isNis2Open, setIsNis2Open] = useState(activeTab.startsWith('nis2'));
    const [isOverviewOpen, setIsOverviewOpen] = useState(activeTab.startsWith('overview'));
    const [isToolsOpen, setIsToolsOpen] = useState(activeTab.startsWith('tools'));
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    // Modals
    const [showMFA, setShowMFA] = useState(false);
    const [showAudit, setShowAudit] = useState(false);
    const [showDbSchema, setShowDbSchema] = useState(false);

    const hasOverviewTabs = tabConfig['overview'] || tabConfig['overview.smart'];
    const hasOrganizacaoTabs = tabConfig['organizacao.instituicoes'] || tabConfig['organizacao.entidades'] || tabConfig['collaborators'] || tabConfig['organizacao.teams'] || tabConfig['organizacao.suppliers'];
    const hasInventarioTabs = tabConfig['licensing'] || tabConfig['equipment.inventory'] || tabConfig['equipment.procurement'];
    const hasNis2Tabs = tabConfig.nis2?.bia || tabConfig.nis2?.security || tabConfig.nis2?.backups || tabConfig.nis2?.resilience || tabConfig.nis2?.training || tabConfig.nis2?.policies;
    const hasTicketTabs = tabConfig['tickets'];
    const hasToolsTabs = tabConfig['tools'] || onOpenCalendar || onOpenManual;
    const hasReportsTabs = tabConfig['reports'];
    
    const isAdmin = currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.SuperAdmin;
    const isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;

    // Helper for Menu Items
    const TabButton = ({ tab, label, icon, activeTab, setActiveTab, isDropdownItem = false, className = '', onClick }: { tab?: string, label: string, icon: React.ReactNode, activeTab?: string, setActiveTab?: (tab: string) => void, isDropdownItem?: boolean, className?: string, onClick?: () => void }) => {
        const handleClick = (e: React.MouseEvent) => {
            if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            if (onClick) onClick();
            else if (tab && setActiveTab) setActiveTab(tab); 
            
            // On mobile, close sidebar after click
            if (window.innerWidth < 768) {
                onHover(false); 
            }
        };

        return (
            <a
                href={tab ? `#${tab}` : '#'}
                onClick={handleClick}
                className={`flex items-center gap-3 w-full text-left transition-colors duration-200 rounded-md overflow-hidden whitespace-nowrap cursor-pointer no-underline ${
                    isDropdownItem 
                    ? `px-4 py-3 md:py-2 text-base md:text-sm ${tab && activeTab === tab ? 'bg-brand-secondary text-white' : 'text-on-surface-dark hover:bg-gray-700'}` 
                    : `px-4 py-3 text-base md:text-sm font-medium ${tab && activeTab === tab ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`
                } ${className}`}
                role={isDropdownItem ? 'menuitem' : 'tab'}
                aria-current={tab && activeTab === tab ? 'page' : undefined}
                title={!isExpanded ? label : undefined}
            >
                <span className="text-xl md:text-lg flex-shrink-0 w-6 flex justify-center">{icon}</span>
                <span className={`transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                    {label}
                </span>
            </a>
        );
    };

    return (
        <>
        {/* Mobile Overlay (Backdrop) */}
        <div 
            className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 md:hidden ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => onHover(false)}
        />

        <aside 
            className={`fixed top-0 left-0 h-screen bg-gray-900 shadow-2xl z-50 flex flex-col border-r border-gray-800 transition-transform duration-300 ease-in-out 
                md:translate-x-0 ${isExpanded ? 'translate-x-0 w-72 md:w-64' : '-translate-x-full md:w-20'}
            `}
            onMouseEnter={() => { if(window.innerWidth >= 768) onHover(true); }}
            onMouseLeave={() => {
                if(window.innerWidth >= 768) {
                    onHover(false);
                    setIsUserMenuOpen(false); 
                }
            }}
        >
            <div className="flex items-center justify-between h-20 flex-shrink-0 bg-gray-900 border-b border-gray-800 px-4">
                <div className="flex items-center overflow-hidden whitespace-nowrap cursor-pointer" onClick={() => setActiveTab('overview')}>
                    <span className="font-bold text-2xl text-white transition-all duration-300">
                        {isExpanded ? (
                            <>AI<span className="text-brand-secondary">Manager</span></>
                        ) : (
                            <span className="text-brand-secondary">AI</span>
                        )}
                    </span>
                </div>
                {/* Mobile Close Button */}
                <button className="md:hidden text-gray-400 p-2 rounded hover:bg-gray-800" onClick={() => onHover(false)}>
                    <FaTimes className="h-6 w-6" />
                </button>
            </div>

            <nav className="flex-grow py-4 px-2 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
                
                {hasOverviewTabs && (
                    <div className="space-y-1">
                        {tabConfig['overview.smart'] ? (
                            <>
                                <button
                                    onClick={() => setIsOverviewOpen(!isOverviewOpen)}
                                    className={`flex items-center justify-between w-full px-4 py-3 text-base md:text-sm font-medium rounded-md transition-colors duration-200 ${isOverviewOpen ? 'bg-gray-800 text-white' : 'text-on-surface-dark-secondary hover:bg-gray-800'}`}
                                    title={!isExpanded ? t('nav.overview') : undefined}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
                                        <FaChartBar className="text-xl md:text-lg flex-shrink-0 w-6 flex justify-center" />
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
                                        <TabButton tab="overview" label={t('nav.dashboard')} icon={<FaChartBar />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab}/>
                                        <TabButton tab="overview.smart" label={t('nav.c_level')} icon={<FaTachometerAlt className="text-purple-400" />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab}/>
                                    </div>
                                )}
                            </>
                        ) : (
                            <TabButton tab="overview" label={t('nav.overview')} icon={<FaChartBar />} activeTab={activeTab} setActiveTab={setActiveTab}/>
                        )}
                    </div>
                )}

                {hasOrganizacaoTabs && (
                    <div className="space-y-1">
                        <button
                            onClick={() => setOrganizacaoOpen(!isOrganizacaoOpen)}
                            className={`flex items-center justify-between w-full px-4 py-3 text-base md:text-sm font-medium rounded-md transition-colors duration-200 ${isOrganizacaoOpen ? 'bg-gray-800 text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}
                            title={!isExpanded ? t('nav.organization') : undefined}
                        >
                            <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
                                <FaSitemap className="text-xl md:text-lg flex-shrink-0 w-6 flex justify-center" />
                                <span className={`transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{t('nav.organization')}</span>
                            </div>
                            {isExpanded && (
                                <span className={`transition-transform duration-200 ${isOrganizacaoOpen ? 'rotate-90' : ''}`}>
                                    <FaChevronRight className="w-3 h-3" />
                                </span>
                            )}
                        </button>
                        {isOrganizacaoOpen && isExpanded && (
                            <div className="space-y-1 bg-gray-800/30 rounded-md py-1 animate-fade-in">
                                {tabConfig['organizacao.instituicoes'] && <TabButton tab="organizacao.instituicoes" label={t('nav.institutions')} icon={<FaSitemap />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {tabConfig['organizacao.entidades'] && <TabButton tab="organizacao.entidades" label={t('nav.entities')} icon={<FaBuilding />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {tabConfig['collaborators'] && <TabButton tab="collaborators" label={t('nav.collaborators')} icon={<FaUsers />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {tabConfig['organizacao.teams'] && <TabButton tab="organizacao.teams" label={t('nav.teams')} icon={<FaUsers />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {tabConfig['organizacao.suppliers'] && <TabButton tab="organizacao.suppliers" label={t('nav.suppliers')} icon={<FaShieldAlt />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                            </div>
                        )}
                    </div>
                )}

                {hasInventarioTabs && (
                    <div className="space-y-1">
                        <button
                            onClick={() => setInventarioOpen(!isInventarioOpen)}
                            className={`flex items-center justify-between w-full px-4 py-3 text-base md:text-sm font-medium rounded-md transition-colors duration-200 ${isInventarioOpen ? 'bg-gray-800 text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}
                            title={!isExpanded ? t('nav.inventory') : undefined}
                        >
                            <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
                                <FaBoxOpen className="text-xl md:text-lg flex-shrink-0 w-6 flex justify-center" />
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
                                {tabConfig['equipment.inventory'] && <TabButton tab="equipment.inventory" label={t('nav.assets_inventory')} icon={<FaClipboardList />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {tabConfig['equipment.procurement'] && <TabButton tab="equipment.procurement" label={t('nav.procurement')} icon={<FaShoppingCart />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {tabConfig['licensing'] && <TabButton tab="licensing" label={t('nav.licensing')} icon={<FaKey />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                            </div>
                        )}
                    </div>
                )}

                {hasNis2Tabs && (
                    <div className="space-y-1">
                        <button
                            onClick={() => setIsNis2Open(prev => !prev)}
                            className={`flex items-center justify-between w-full px-4 py-3 text-base md:text-sm font-medium rounded-md transition-colors duration-200 ${isNis2Open ? 'bg-gray-800 text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}
                            title={!isExpanded ? (tabConfig.nis2?.title || t('nav.compliance')) : undefined}
                        >
                            <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
                                <FaShieldAlt className="text-xl md:text-lg flex-shrink-0 w-6 flex justify-center" />
                                <span className={`transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{t('nav.compliance')}</span>
                            </div>
                            {isExpanded && (
                                <span className={`transition-transform duration-200 ${isNis2Open ? 'rotate-90' : ''}`}>
                                    <FaChevronRight className="w-3 h-3" />
                                </span>
                            )}
                        </button>
                        {isNis2Open && isExpanded && (
                            <div className="pl-4 space-y-1 bg-gray-800/30 rounded-md py-1 animate-fade-in">
                                {tabConfig.nis2?.bia && <TabButton tab="nis2.bia" label={t('nav.bia')} icon={<FaNetworkWired />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {tabConfig.nis2?.security && <TabButton tab="nis2.security" label={t('nav.security')} icon={<FaShieldAlt />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {tabConfig.nis2?.backups && <TabButton tab="nis2.backups" label={t('nav.backups')} icon={<FaServer />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {tabConfig.nis2?.resilience && <TabButton tab="nis2.resilience" label={t('nav.resilience')} icon={<FaShieldAlt className="text-purple-400"/>} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {tabConfig.nis2?.training && <TabButton tab="nis2.training" label={t('nav.training')} icon={<FaGraduationCap className="text-green-400"/>} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {tabConfig.nis2?.policies && <TabButton tab="nis2.policies" label={t('nav.policies')} icon={<FaFileSignature className="text-yellow-400"/>} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                            </div>
                        )}
                    </div>
                )}

                {hasTicketTabs && (
                    <TabButton tab="tickets.list" label={t('nav.tickets')} icon={<FaTicketAlt />} activeTab={activeTab} setActiveTab={setActiveTab}/>
                )}
                
                {hasReportsTabs && (
                    <TabButton tab="reports" label={t('nav.reports')} icon={<FaFileSignature />} activeTab={activeTab} setActiveTab={setActiveTab}/>
                )}

                {hasToolsTabs && (
                    <div className="space-y-1">
                        <button
                            onClick={() => setIsToolsOpen(!isToolsOpen)}
                            className={`flex items-center justify-between w-full px-4 py-3 text-base md:text-sm font-medium rounded-md transition-colors duration-200 ${isToolsOpen ? 'bg-gray-800 text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}
                            title={!isExpanded ? t('nav.tools') : undefined}
                        >
                            <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
                                <FaToolbox className="text-xl md:text-lg flex-shrink-0 w-6 flex justify-center" />
                                <span className={`transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>{t('nav.tools')}</span>
                            </div>
                            {isExpanded && (
                                <span className={`transition-transform duration-200 ${isToolsOpen ? 'rotate-90' : ''}`}>
                                    <FaChevronRight className="w-3 h-3" />
                                </span>
                            )}
                        </button>
                        {isToolsOpen && isExpanded && (
                            <div className="pl-4 space-y-1 bg-gray-800/30 rounded-md py-1 animate-fade-in">
                                {tabConfig['tools']?.agenda && <TabButton tab="tools.agenda" label={t('nav.agenda')} icon={<FaAddressBook />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {tabConfig['tools']?.map && <TabButton tab="tools.map" label={t('nav.map')} icon={<FaMapMarkedAlt className="text-red-400" />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {onOpenCalendar && <TabButton label={t('nav.calendar')} icon={<FaCalendarAlt className="text-blue-400" />} isDropdownItem onClick={() => { onOpenCalendar(); }} />}
                                {onOpenManual && <TabButton label={t('nav.manual')} icon={<FaBook className="text-green-400" />} isDropdownItem onClick={() => { onOpenManual(); }} />}
                            </div>
                        )}
                    </div>
                )}
            </nav>

            <div className="p-4 border-t border-gray-800 bg-gray-900 flex-shrink-0 relative">
                {isExpanded && (
                    <div className="mb-2">
                         <InstallAppButton 
                            className="flex w-full items-center justify-center gap-2 px-2 py-2 text-xs font-bold text-gray-900 bg-brand-secondary rounded-md hover:bg-brand-primary hover:text-white transition-colors"
                            label="Instalar App"
                            icon={<FaMobileAlt />}
                        />
                    </div>
                )}

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

                        {isUserMenuOpen && (
                            <div className="absolute bottom-full left-0 w-full mb-2 bg-surface-dark border border-gray-700 rounded-md shadow-xl py-1 z-50 min-w-[220px]">
                                {onOpenProfile && (
                                    <button onClick={() => { onOpenProfile(); setIsUserMenuOpen(false); }} className="flex w-full items-center gap-3 px-4 py-2 text-sm text-on-surface-dark hover:bg-gray-700">
                                        <FaUserCircle className="text-brand-secondary" /> {t('common.profile')}
                                    </button>
                                )}
                                <button onClick={() => setLayoutMode('top')} className="flex w-full items-center gap-3 px-4 py-2 text-sm text-on-surface-dark hover:bg-gray-700">
                                    <FaColumns className="text-gray-400" /> Menu Superior
                                </button>
                                <button onClick={() => setShowMFA(true)} className="flex w-full items-center gap-3 px-4 py-2 text-sm text-on-surface-dark hover:bg-gray-700">
                                    <FaFingerprint className="text-brand-secondary" /> Configurar 2FA
                                </button>
                                
                                <div className="flex items-center px-4 py-2 text-sm text-on-surface-dark hover:bg-gray-700 cursor-pointer" onClick={(e) => {e.stopPropagation()}}>
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
                        )}
                    </div>
                ) : (
                    <button onClick={onLogout} className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-gray-800 transition-colors">
                        <LogoutIcon className="w-6 h-6 text-gray-400" />
                        {isExpanded && <span className="text-sm font-medium text-gray-400">{t('common.logout')}</span>}
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
