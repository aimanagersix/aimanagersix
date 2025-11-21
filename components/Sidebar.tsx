
import React, { useState } from 'react';
import { Collaborator, UserRole } from '../types';
import { ClipboardListIcon, OfficeBuildingIcon, UserGroupIcon, LogoutIcon, UserIcon, FaKey, FaBell, FaUsers, FaFingerprint, FaClipboardList, FaUserShield, FaDatabase } from './common/Icons';
import { FaShapes, FaTags, FaChartBar, FaTicketAlt, FaSitemap, FaGlobe, FaNetworkWired, FaShieldAlt, FaDownload, FaBoxOpen, FaServer, FaLock, FaUnlock, FaColumns } from 'react-icons/fa';
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

const TabButton = ({ tab, label, icon, activeTab, setActiveTab, isDropdownItem = false, className = '' }: { tab: string, label: string, icon: React.ReactNode, activeTab: string, setActiveTab: (tab: string) => void, isDropdownItem?: boolean, className?: string }) => (
    <button
        onClick={(e) => { e.preventDefault(); setActiveTab(tab); }}
        className={`flex items-center gap-3 w-full text-left transition-colors duration-200 rounded-md ${
            isDropdownItem 
            ? `px-4 py-2 text-sm ${activeTab === tab ? 'bg-brand-secondary text-white' : 'text-on-surface-dark hover:bg-gray-700'}` 
            : `px-4 py-3 text-sm font-medium ${activeTab === tab ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`
        } ${className}`}
        role={isDropdownItem ? 'menuitem' : 'tab'}
        aria-current={activeTab === tab ? 'page' : undefined}
    >
        <span className="text-lg">{icon}</span>
        <span>{label}</span>
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ currentUser, activeTab, setActiveTab, onLogout, tabConfig, notificationCount, onNotificationClick }) => {
    const { t, language, setLanguage } = useLanguage();
    const { layoutMode, setLayoutMode } = useLayout();
    
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

    return (
        <>
        <aside className="fixed top-0 left-0 w-64 h-screen bg-gray-900 shadow-2xl z-40 flex flex-col overflow-y-auto custom-scrollbar border-r border-gray-800">
            {/* Brand Header */}
            <div className="flex items-center justify-center h-20 flex-shrink-0 bg-gray-900 border-b border-gray-800">
                <span className="font-bold text-2xl text-white">
                    AI<span className="text-brand-secondary">Manager</span>
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-grow py-4 px-2 space-y-1">
                {tabConfig['overview'] && <TabButton tab="overview" label={tabConfig['overview']} icon={<FaChartBar />} activeTab={activeTab} setActiveTab={setActiveTab}/>}

                {/* Organização */}
                {hasOrganizacaoTabs && (
                    <div className="space-y-1">
                        <button
                            onClick={() => setOrganizacaoOpen(!isOrganizacaoOpen)}
                            className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${isOrganizacaoOpen ? 'text-white' : 'text-on-surface-dark-secondary hover:bg-gray-800'}`}
                        >
                            <div className="flex items-center gap-3">
                                <FaSitemap className="text-lg" />
                                <span>{t('nav.organization')}</span>
                            </div>
                            <svg className={`w-4 h-4 transition-transform transform ${isOrganizacaoOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {isOrganizacaoOpen && (
                            <div className="pl-4 space-y-1 bg-gray-800/30 rounded-md py-1">
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
                        >
                            <div className="flex items-center gap-3">
                                <FaBoxOpen className="text-lg" />
                                <span>{t('nav.inventory')}</span>
                            </div>
                            <svg className={`w-4 h-4 transition-transform transform ${isInventarioOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {isInventarioOpen && (
                            <div className="pl-4 space-y-1 bg-gray-800/30 rounded-md py-1">
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
                        >
                            <div className="flex items-center gap-3">
                                <FaShieldAlt className="text-lg" />
                                <span>{tabConfig.nis2?.title || 'Compliance'}</span>
                            </div>
                            {isNis2Open ? <FaUnlock className="w-3 h-3 text-brand-secondary" /> : <FaLock className="w-3 h-3 text-gray-400" />}
                        </button>
                        {isNis2Open && (
                            <div className="pl-4 space-y-1 bg-gray-800/30 rounded-md py-1">
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
                        >
                            <div className="flex items-center gap-3">
                                <FaTicketAlt className="text-lg" />
                                <span>{tabConfig.tickets?.title || 'Tickets'}</span>
                            </div>
                            {(hasTicketCategories || hasIncidentTypes) && (
                                <svg className={`w-4 h-4 transition-transform transform ${isTicketsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            )}
                        </button>
                        {isTicketsOpen && (hasTicketCategories || hasIncidentTypes) && (
                            <div className="pl-4 space-y-1 bg-gray-800/30 rounded-md py-1">
                                <TabButton tab="tickets.list" label={tabConfig.tickets?.list || 'Tickets'} icon={<FaTicketAlt />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />
                                {hasTicketCategories && <TabButton tab="tickets.categories" label={tabConfig.tickets.categories} icon={<FaTags />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                                {hasIncidentTypes && <TabButton tab="tickets.incident_types" label={tabConfig.tickets.incident_types} icon={<FaShieldAlt />} isDropdownItem activeTab={activeTab} setActiveTab={setActiveTab} />}
                            </div>
                        )}
                    </div>
                )}
            </nav>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-800 space-y-4 bg-gray-900">
                
                {/* Utils Row */}
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-xs text-white transition-colors border border-gray-700"
                        title={language === 'pt' ? 'Switch to English' : 'Mudar para Português'}
                    >
                        <FaGlobe className="text-brand-secondary" />
                        <span className="font-bold">{language.toUpperCase()}</span>
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
                            className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-gray-800 text-left transition-colors"
                        >
                            {currentUser.photoUrl ? (
                                <img src={currentUser.photoUrl} alt={currentUser.fullName} className="h-9 w-9 rounded-full object-cover border border-gray-600" />
                            ) : (
                                <div className="h-9 w-9 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-white text-sm">
                                    {currentUser.fullName.charAt(0)}
                                </div>
                            )}
                            <div className="flex-grow overflow-hidden">
                                <p className="text-sm font-medium text-white truncate">{currentUser.fullName}</p>
                                <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                            </div>
                            <svg className={`w-4 h-4 text-gray-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        </button>

                        {isUserMenuOpen && (
                            <div className="absolute bottom-full left-0 w-full mb-2 bg-gray-800 rounded-md shadow-lg border border-gray-700 divide-y divide-gray-700 overflow-hidden">
                                <div className="py-1">
                                    <button onClick={() => setLayoutMode('top')} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-on-surface-dark hover:bg-gray-700">
                                        <FaColumns className="text-blue-400" />
                                        Menu Superior
                                    </button>
                                    <button onClick={() => setShowMFA(true)} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-on-surface-dark hover:bg-gray-700">
                                        <FaFingerprint className="text-brand-secondary" />
                                        Configurar 2FA
                                    </button>
                                    {isAdmin && (
                                        <>
                                            <button onClick={() => setShowAudit(true)} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-on-surface-dark hover:bg-gray-700">
                                                <FaClipboardList className="text-yellow-400" />
                                                Logs Auditoria
                                            </button>
                                            <button onClick={() => setShowDbSchema(true)} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-on-surface-dark hover:bg-gray-700">
                                                <FaDatabase className="text-green-400" />
                                                Configuração BD
                                            </button>
                                        </>
                                    )}
                                </div>
                                <div className="py-1">
                                    <button onClick={onLogout} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-700">
                                        <LogoutIcon className="h-4 w-4" />
                                        {t('common.logout')}
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
