
import React, { useState } from 'react';
import { Collaborator, UserRole } from '../types';
import { ClipboardListIcon, OfficeBuildingIcon, UserGroupIcon, LogoutIcon, UserIcon, FaKey, FaBell, FaUsers, FaFingerprint, FaClipboardList, FaUserShield, FaDatabase } from './common/Icons';
import { FaShapes, FaTags, FaChartBar, FaTicketAlt, FaSitemap, FaGlobe, FaNetworkWired, FaShieldAlt, FaDownload, FaBoxOpen, FaServer, FaLock, FaUnlock, FaColumns, FaChevronRight, FaChevronDown } from 'react-icons/fa';
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
}

const Sidebar: React.FC<SidebarProps> = ({ currentUser, activeTab, setActiveTab, onLogout, tabConfig, notificationCount, onNotificationClick }) => {
    const { t, language, setLanguage } = useLanguage();
    const { layoutMode, setLayoutMode } = useLayout();
    
    // Sidebar hover state for auto-expand
    const [isHovered, setIsHovered] = useState(false);

    // Sidebar toggle states for accordions
    const [isOrganizacaoOpen, setOrganizacaoOpen] = useState(activeTab.startsWith('organizacao') || activeTab === 'collaborators');
    const [isInventarioOpen, setInventarioOpen] = useState(activeTab.startsWith('equipment') || activeTab === 'licensing');
    const [isNis2Open, setIsNis2Open] = useState(activeTab.startsWith('nis2'));
    const [isTicketsOpen, setIsTicketsOpen] = useState(activeTab.startsWith('tickets'));
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    // Security Modals
    const [showMFA, setShowMFA] = useState(false);
    const [showAudit, setShowAudit] = useState(false);
    const [showDbSchema, setShowDbSchema] = useState(false);

    // Logic
    const hasOrganizacaoTabs = tabConfig['organizacao.instituicoes'] || tabConfig['organizacao.entidades'] || tabConfig['collaborators'] || tabConfig['organizacao.teams'] || tabConfig['organizacao.suppliers'];
    const hasInventarioTabs = tabConfig['licensing'] || tabConfig['equipment.inventory'] || tabConfig['equipment.brands'] || tabConfig['equipment.types'];
    const hasNis2Tabs = tabConfig.nis2?.bia || tabConfig.nis2?.security || tabConfig.nis2?.backups;
    const hasTicketTabs = tabConfig['tickets'];
    const hasTicketCategories = tabConfig.tickets?.categories;
    const hasIncidentTypes = tabConfig.tickets?.incident_types;
    const isAdmin = currentUser?.role === UserRole.Admin;

    const handleTabClick = (tab: string) => {
        setActiveTab(tab);
    };

    const TabButton = ({ tab, label, icon, activeTab, setActiveTab, isDropdownItem = false, className = '' }: { tab: string, label: string, icon: React.ReactNode, activeTab: string, setActiveTab: (tab: string) => void, isDropdownItem?: boolean, className?: string }) => (
        <button
            onClick={(e) => { e.preventDefault(); handleTabClick(tab); }}
            className={`flex items-center gap-3 w-full text-left transition-colors duration-200 rounded-md overflow-hidden whitespace-nowrap ${
                isDropdownItem 
                ? `px-4 py-2 text-sm ${activeTab === tab ? 'bg-brand-secondary text-white' : 'text-on-surface-dark hover:bg-gray-700'}` 
                : `px-4 py-3 text-sm font-medium ${activeTab === tab ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`
            } ${className}`}
            role={isDropdownItem ? 'menuitem' : 'tab'}
            aria-current={activeTab === tab ? 'page' : undefined}
            title={!isHovered ? label : undefined}
        >
            <span className="text-lg flex-shrink-0 w-6 flex justify-center">{icon}</span>
            <span className={`transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0 w-0'}`}>
                {label}
            </span>
        </button>
    );

    return (
        <>
        <aside 
            className={`fixed top-0 left-0 h-screen bg-gray-900 shadow-2xl z-50 flex flex-col border-r border-gray-800 transition-all duration-300 ease-in-out ${isHovered ? 'w-64' : 'w-20'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Brand Header */}
            <div className="flex items-center justify-center h-20 flex-shrink-0 bg-gray-900 border-b border-gray-800 overflow-hidden whitespace-nowrap">
                <span className="font-bold text-2xl text-white transition-all duration-300">
                    {isHovered ? (
                        <>AI<span className="text-brand-secondary">Manager</span></>
                    ) : (
                        <span className="text-brand-secondary">AI</span>
                    )}
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-grow py-4 px-2 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
                {tabConfig['overview'] && <TabButton tab="overview" label={tabConfig['overview']} icon={<FaChartBar />} activeTab={activeTab} setActiveTab={setActiveTab}/>}

                {/* Organização */}
                {hasOrganizacaoTabs && (
                    <div className="space-y-1">
                        <button
                            onClick={() => setOrganizacaoOpen(!isOrganizacaoOpen)}
                            className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${isOrganizacaoOpen ? 'text-white' : 'text-on-surface-dark-secondary hover:bg-gray-800'}`}
                            title={!isHovered ? t('nav.organization') : undefined}
                        >
                            <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
                                <FaSitemap className="text-lg flex-shrink-0 w-6 flex justify-center" />
                                <span className={`transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0 w-0'}`}>{t('nav.organization')}</span>
                            </div>
                            {isHovered && (
                                <span className={`transition-transform duration-200 ${isOrganizacaoOpen ? 'rotate-90' : ''}`}>
                                    <FaChevronRight className="w-3 h-3" />
                                </span>
                            )}
                        </button>
                        {isOrganizacaoOpen && isHovered && (
                            <div className="pl-4 space-y-1 bg-gray-800/30 rounded-md py-1 animate-fade-in">
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
                            title={!isHovered ? t('nav.inventory') : undefined}
                        >
                            <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
                                <FaBoxOpen className="text-lg flex-shrink-0 w-6 flex justify-center" />
                                <span className={`transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0 w-0'}`}>{t('nav.inventory')}</span>
                            </div>
                            {isHovered && (
                                <span className={`transition-transform duration-200 ${isInventarioOpen ? 'rotate-90' : ''}`}>
                                    <FaChevronRight className="w-3 h-3" />
                                </span>
                            )}
                        </button>
                        {isInventarioOpen && isHovered && (
                            <div className="pl-4 space-y-1 bg-gray-800/30 rounded-md py-1 animate-fade-in">
                                {tabConfig['equipment.inventory'] && <TabButton tab="equipment.inventory" label={t('nav.assets_inventory')} icon={<ClipboardListIcon />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {tabConfig['equipment.brands'] && <TabButton tab="equipment.brands" label={tabConfig['equipment.brands']} icon={<FaTags />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {tabConfig['equipment.types'] && <TabButton tab="equipment.types" label={tabConfig['equipment.types']} icon={<FaShapes />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
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
                            title={!isHovered ? (tabConfig.nis2?.title || 'Compliance') : undefined}
                        >
                            <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
                                <FaShieldAlt className="text-lg flex-shrink-0 w-6 flex justify-center" />
                                <span className={`transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0 w-0'}`}>{tabConfig.nis2?.title || 'Compliance'}</span>
                            </div>
                            {isHovered && (
                                <span className={`transition-transform duration-200 ${isNis2Open ? 'rotate-90' : ''}`}>
                                    <FaChevronRight className="w-3 h-3" />
                                </span>
                            )}
                        </button>
                        {isNis2Open && isHovered && (
                            <div className="pl-4 space-y-1 bg-gray-800/30 rounded-md py-1 animate-fade-in">
                                {tabConfig.nis2?.bia && <TabButton tab="nis2.bia" label={tabConfig.nis2.bia} icon={<FaNetworkWired />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {tabConfig.nis2?.security && <TabButton tab="nis2.security" label={tabConfig.nis2.security} icon={<FaShieldAlt />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {tabConfig.nis2?.backups && <TabButton tab="nis2.backups" label={tabConfig.nis2.backups} icon={<FaServer />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                            </div>
                        )}
                    </div>
                )}

                {/* Tickets */}
                {hasTicketTabs && (
                    <div className="space-y-1">
                        <button
                            onClick={() => {
                                if (hasTicketCategories || hasIncidentTypes) setIsTicketsOpen(!isTicketsOpen);
                                else setActiveTab('tickets.list');
                            }}
                            className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${isTicketsOpen || activeTab === 'tickets.list' ? 'text-white' : 'text-on-surface-dark-secondary hover:bg-gray-800'}`}
                            title={!isHovered ? (tabConfig.tickets?.title || 'Tickets') : undefined}
                        >
                            <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
                                <FaTicketAlt className="text-lg flex-shrink-0 w-6 flex justify-center" />
                                <span className={`transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0 w-0'}`}>{tabConfig.tickets?.title || 'Tickets'}</span>
                            </div>
                            {isHovered && (hasTicketCategories || hasIncidentTypes) && (
                                <span className={`transition-transform duration-200 ${isTicketsOpen ? 'rotate-90' : ''}`}>
                                    <FaChevronRight className="w-3 h-3" />
                                </span>
                            )}
                        </button>
                        {isTicketsOpen && isHovered && (hasTicketCategories || hasIncidentTypes) && (
                            <div className="pl-4 space-y-1 bg-gray-800/30 rounded-md py-1 animate-fade-in">
                                <TabButton tab="tickets.list" label={tabConfig.tickets?.list || 'Tickets'} icon={<FaTicketAlt />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />
                                {hasTicketCategories && <TabButton tab="tickets.categories" label={tabConfig.tickets.categories} icon={<FaTags />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {hasIncidentTypes && <TabButton tab="tickets.incident_types" label={tabConfig.tickets.incident_types} icon={<FaShieldAlt />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                            </div>
                        )}
                    </div>
                )}
            </nav>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-800 space-y-4 bg-gray-900 overflow-hidden">
                
                {/* Utils Row */}
                <div className={`flex items-center transition-all duration-300 ${isHovered ? 'justify-between' : 'flex-col gap-4 justify-center'}`}>
                    <button
                        onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
                        className="flex items-center justify-center gap-1 px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-xs text-white transition-colors border border-gray-700"
                        title={language === 'pt' ? 'Switch to English' : 'Mudar para Português'}
                    >
                        <FaGlobe className="text-brand-secondary" />
                        {isHovered && <span className="font-bold">{language.toUpperCase()}</span>}
                    </button>

                    <button
                        onClick={onNotificationClick}
                        className="relative p-2 rounded-md text-on-surface-dark-secondary hover:bg-gray-800 hover:text-white transition-colors"
                        title={t('common.notifications')}
                    >
                        <FaBell className="h-5 w-5" />
                        {notificationCount > 0 && (
                            <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-gray-900" />
                        )}
                    </button>
                </div>

                {/* User Menu */}
                {currentUser && (
                    <div className="relative">
                        <button
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className={`flex items-center gap-3 w-full p-2 rounded-md hover:bg-gray-800 text-left transition-colors ${!isHovered ? 'justify-center' : ''}`}
                            title={!isHovered ? currentUser.fullName : undefined}
                        >
                            {currentUser.photoUrl ? (
                                <img src={currentUser.photoUrl} alt={currentUser.fullName} className="h-9 w-9 rounded-full object-cover border border-gray-600 flex-shrink-0" />
                            ) : (
                                <div className="h-9 w-9 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                                    {currentUser.fullName.charAt(0)}
                                </div>
                            )}
                            <div className={`flex-grow overflow-hidden transition-opacity duration-200 ${isHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
                                <p className="text-sm font-medium text-white truncate">{currentUser.fullName}</p>
                                <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                            </div>
                            {isHovered && (
                                <FaChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                            )}
                        </button>

                        {isUserMenuOpen && (
                            <div 
                                className={`absolute bottom-full mb-2 bg-gray-800 rounded-md shadow-lg border border-gray-700 divide-y divide-gray-700 overflow-hidden z-50 ${isHovered ? 'left-0 w-full' : 'left-10 w-56'}`}
                            >
                                <div className="py-1">
                                    <button onClick={() => setLayoutMode('top')} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-on-surface-dark hover:bg-gray-700">
                                        <FaColumns className="text-blue-400" />
                                        <span>Menu Superior</span>
                                    </button>
                                    <button onClick={() => setShowMFA(true)} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-on-surface-dark hover:bg-gray-700">
                                        <FaFingerprint className="text-brand-secondary" />
                                        <span>Configurar 2FA</span>
                                    </button>
                                    {isAdmin && (
                                        <>
                                            <button onClick={() => setShowAudit(true)} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-on-surface-dark hover:bg-gray-700">
                                                <FaClipboardList className="text-yellow-400" />
                                                <span>Logs Auditoria</span>
                                            </button>
                                            <button onClick={() => setShowDbSchema(true)} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-on-surface-dark hover:bg-gray-700">
                                                <FaDatabase className="text-green-400" />
                                                <span>Configuração BD</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                                <div className="py-1">
                                    <button onClick={onLogout} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-700">
                                        <LogoutIcon className="h-4 w-4" />
                                        <span>{t('common.logout')}</span>
                                    </button>
                                </div>
                            </div>
                        )}
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
