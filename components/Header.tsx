import React, { useState, useRef, useEffect } from 'react';
import { Collaborator, UserRole } from '../types';
import { 
    FaClipboardList, FaBuilding, FaUsers, FaDoorOpen as LogoutIcon, FaKey, FaBell, FaFingerprint, 
    FaDatabase, FaUserCircle, FaCalendarAlt, FaBook, FaChartBar, FaTicketAlt, FaSitemap, FaGlobe,
    FaNetworkWired, FaShieldAlt, FaBoxOpen, FaServer, FaColumns, FaTachometerAlt, FaAddressBook,
    FaCog, FaToolbox, FaChevronDown, FaBars, FaMapMarkedAlt, FaFileSignature, FaGraduationCap,
    FaShoppingCart, FaMobileAlt 
} from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';
import { useLayout } from '../contexts/LayoutContext';
import MFASetupModal from './MFASetupModal';
import AuditLogModal from './AuditLogModal';
import DatabaseSchemaModal from './DatabaseSchemaModal';
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

const TabButton = ({
  tab, label, icon, activeTab, setActiveTab,
  isDropdownItem = false, className = '', onClick
}: {
  tab?: string;
  label: string;
  icon: React.ReactNode;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  isDropdownItem?: boolean;
  className?: string;
  onClick?: () => void;
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
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

const Header: React.FC<HeaderProps> = ({
  currentUser, activeTab, setActiveTab, onLogout, onResetData,
  tabConfig, notificationCount, onNotificationClick,
  onOpenProfile, onOpenCalendar, onOpenManual
}) => {
  const { t, setLanguage, language } = useLanguage();
  const { setLayoutMode } = useLayout();

  // Dropdown states
  const [isOrganizacaoMenuOpen, setOrganizacaoMenuOpen] = useState(false);
  const [isInventarioMenuOpen, setInventarioMenuOpen] = useState(false);
  const [isNis2MenuOpen, setIsNis2MenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isTicketsMenuOpen, setIsTicketsMenuOpen] = useState(false);
  const [isOverviewMenuOpen, setIsOverviewMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);

  const organizacaoMenuRef = useRef<HTMLDivElement>(null);
  const inventarioMenuRef = useRef<HTMLDivElement>(null);
  const nis2MenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const ticketsMenuRef = useRef<HTMLDivElement>(null);
  const overviewMenuRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  // Security modals
  const [showMFA, setShowMFA] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [showDbSchema, setShowDbSchema] = useState(false);

  // Mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const refs = [
        { ref: organizacaoMenuRef, setter: setOrganizacaoMenuOpen },
        { ref: inventarioMenuRef, setter: setInventarioMenuOpen },
        { ref: nis2MenuRef, setter: setIsNis2MenuOpen },
        { ref: ticketsMenuRef, setter: setIsTicketsMenuOpen },
        { ref: overviewMenuRef, setter: setIsOverviewMenuOpen },
        { ref: toolsMenuRef, setter: setIsToolsMenuOpen },
        { ref: userMenuRef, setter: setIsUserMenuOpen },
      ];

      refs.forEach(({ ref, setter }) => {
        if (ref.current && !ref.current.contains(event.target as Node)) setter(false);
      });

      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        mobileMenuButtonRef.current &&
        !mobileMenuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  const isAdmin = currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.SuperAdmin;
  const isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;

  // Menu render helper
  const renderMenu = (
    menuItems: { tab?: string; label: string; icon: React.ReactNode; onClick?: () => void }[],
    isDropdownItem = false
  ) => (
    <>
      {menuItems.map((item, idx) => (
        <TabButton
          key={idx}
          tab={item.tab}
          label={item.label}
          icon={item.icon}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isDropdownItem={isDropdownItem}
          onClick={item.onClick}
        />
      ))}
    </>
  );

  const desktopMenus = () => {
    const overviewMenu = tabConfig['overview']
      ? tabConfig['overview.smart']
        ? [
            { tab: 'overview', label: t('nav.dashboard'), icon: <FaChartBar /> },
            { tab: 'overview.smart', label: t('nav.c_level'), icon: <FaTachometerAlt className="text-purple-400" /> },
          ]
        : [{ tab: 'overview', label: t('nav.overview'), icon: <FaChartBar /> }]
      : [];

    const organizacaoMenu = [
      tabConfig['organizacao.instituicoes'] && { tab: 'organizacao.instituicoes', label: t('nav.institutions'), icon: <FaSitemap /> },
      tabConfig['organizacao.entidades'] && { tab: 'organizacao.entidades', label: t('nav.entities'), icon: <FaBuilding /> },
      tabConfig['collaborators'] && { tab: 'collaborators', label: t('nav.collaborators'), icon: <FaUsers /> },
      tabConfig['organizacao.teams'] && { tab: 'organizacao.teams', label: t('nav.teams'), icon: <FaUsers /> },
      tabConfig['organizacao.suppliers'] && { tab: 'organizacao.suppliers', label: t('nav.suppliers'), icon: <FaShieldAlt /> },
    ].filter(Boolean) as any[];

    const inventarioMenu = [
      tabConfig['equipment.inventory'] && { tab: 'equipment.inventory', label: t('nav.assets_inventory'), icon: <FaClipboardList /> },
      tabConfig['equipment.procurement'] && { tab: 'equipment.procurement', label: t('nav.procurement'), icon: <FaShoppingCart /> },
      tabConfig['licensing'] && { tab: 'licensing', label: t('nav.licensing'), icon: <FaKey /> },
    ].filter(Boolean) as any[];

    const nis2Menu = [
      tabConfig.nis2?.bia && { tab: 'nis2.bia', label: t('nav.bia'), icon: <FaNetworkWired /> },
      tabConfig.nis2?.security && { tab: 'nis2.security', label: t('nav.security'), icon: <FaShieldAlt /> },
      tabConfig.nis2?.backups && { tab: 'nis2.backups', label: t('nav.backups'), icon: <FaServer /> },
      tabConfig.nis2?.resilience && { tab: 'nis2.resilience', label: t('nav.resilience'), icon: <FaShieldAlt className="text-purple-400" /> },
      tabConfig.nis2?.training && { tab: 'nis2.training', label: t('nav.training'), icon: <FaGraduationCap className="text-green-400" /> },
      tabConfig.nis2?.policies && { tab: 'nis2.policies', label: t('nav.policies'), icon: <FaFileSignature className="text-yellow-400" /> },
    ].filter(Boolean) as any[];

    const toolsMenu = [
      tabConfig['tools']?.agenda && { tab: 'tools.agenda', label: t('nav.agenda'), icon: <FaAddressBook /> },
      tabConfig['tools']?.map && { tab: 'tools.map', label: t('nav.map'), icon: <FaMapMarkedAlt className="text-red-400" /> },
      onOpenCalendar && { label: t('nav.calendar'), icon: <FaCalendarAlt className="text-blue-400" />, onClick: onOpenCalendar },
      onOpenManual && { label: t('nav.manual'), icon: <FaBook className="text-green-400" />, onClick: onOpenManual },
    ].filter(Boolean) as any[];

    return { overviewMenu, organizacaoMenu, inventarioMenu, nis2Menu, toolsMenu };
  };

  const { overviewMenu, organizacaoMenu, inventarioMenu, nis2Menu, toolsMenu } = desktopMenus();

  return (
    <>
      <header className="bg-gray-800 shadow-lg relative z-30">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Logo + Mobile Button */}
            <div className="flex items-center gap-4">
              <button ref={mobileMenuButtonRef} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none">
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
              {overviewMenu.length > 0 && renderMenu(overviewMenu)}
              {organizacaoMenu.length > 0 && renderMenu(organizacaoMenu, true)}
              {inventarioMenu.length > 0 && renderMenu(inventarioMenu, true)}
              {nis2Menu.length > 0 && renderMenu(nis2Menu, true)}
              {toolsMenu.length > 0 && renderMenu(toolsMenu, true)}
              {tabConfig['tickets'] && <TabButton tab="tickets.list" label={t('nav.tickets')} icon={<FaTicketAlt />} activeTab={activeTab} setActiveTab={setActiveTab} />}
              {tabConfig['reports'] && <TabButton tab="reports" label={t('nav.reports')} icon={<FaFileSignature />} activeTab={activeTab} setActiveTab={setActiveTab} />}
            </nav>

            {/* Right Side */}
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
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-800 transition-colors">
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

                      <div className="px-4 py-2">
                        <InstallAppButton
                          className="flex w-full items-center justify-center gap-2 px-2 py-2 text-xs font-bold text-gray-900 bg-brand-secondary rounded-md hover:bg-brand-primary hover:text-white transition-colors"
                          label="Instalar App"
                          icon={<FaMobileAlt />}
                        />
                      </div>

                      {/* Language Switch */}
                      <div className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer">
                        <FaGlobe className="mr-3 text-blue-400" />
                        <select value={language} onChange={(e) => setLanguage(e.target.value as 'pt' | 'en')} className="bg-transparent border-none text-white text-sm focus:ring-0 cursor-pointer p-0 w-full">
                          <option value="pt">Português</option>
                          <option value="en">English</option>
                        </select>
                      </div>

                      {isAdmin && (
                        <>
                          <TabButton tab="settings" label={t('common.settings')} icon={<FaCog className="mr-3 text-brand-secondary"/>} isDropdownItem activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setIsUserMenuOpen(false); }} />
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
                      <button onClick={onLogout} className="flex w-full items-center px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-500">
                        <LogoutIcon className="mr-3" /> {t('common.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-gray-900 border-t border-gray-700 absolute w-full left-0 top-20 shadow-2xl overflow-y-auto max-h-[80vh] z-40" ref={mobileMenuRef}>
            {renderMenu([...overviewMenu, ...organizacaoMenu, ...inventarioMenu, ...nis2Menu, ...toolsMenu], true)}
          </div>
        )}

        {/* Modals */}
        {showMFA && <MFASetupModal onClose={() => setShowMFA(false)} />}
        {showAudit && <AuditLogModal onClose={() => setShowAudit(false)} />}
        {showDbSchema && <DatabaseSchemaModal onClose={() => setShowDbSchema(false)} />}
      </header>
    </>
  );
};

export default Header;

