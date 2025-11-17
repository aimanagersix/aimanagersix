import React, { useState, useRef, useEffect } from 'react';
import { Collaborator } from '../types';
import { ClipboardListIcon, OfficeBuildingIcon, UserGroupIcon, LogoutIcon, UserIcon, MenuIcon, FaKey, FaBell, FaUsers } from './common/Icons';
import { FaShapes, FaTags, FaChartBar, FaTicketAlt, FaSitemap, FaSync } from 'react-icons/fa';

interface HeaderProps {
  currentUser: Collaborator | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onResetData?: () => void;
  tabConfig: Record<string, any>;
  notificationCount: number;
  onNotificationClick: () => void;
}

const TabButton = ({ tab, label, icon, activeTab, setActiveTab, isDropdownItem = false }: { tab: string, label: string, icon: React.ReactNode, activeTab: string, setActiveTab: (tab: string) => void, isDropdownItem?: boolean }) => (
    <button
        onClick={(e) => { e.preventDefault(); setActiveTab(tab); }}
        className={`flex items-center gap-2 w-full text-left transition-colors duration-200 rounded-md ${
            isDropdownItem 
            ? `px-4 py-2 text-sm ${activeTab === tab ? 'bg-brand-secondary text-white' : 'text-on-surface-dark hover:bg-gray-700'}` 
            : `px-3 py-2 text-sm font-medium ${activeTab === tab ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`
        }`}
        role={isDropdownItem ? 'menuitem' : 'tab'}
        aria-current={activeTab === tab ? 'page' : undefined}
    >
        {icon}
        <span>{label}</span>
    </button>
);


const Header: React.FC<HeaderProps> = ({ currentUser, activeTab, setActiveTab, onLogout, onResetData, tabConfig, notificationCount, onNotificationClick }) => {
    const [isOrganizacaoMenuOpen, setOrganizacaoMenuOpen] = useState(false);
    const organizacaoMenuRef = useRef<HTMLDivElement>(null);
    const [isInventarioMenuOpen, setInventarioMenuOpen] = useState(false);
    const inventarioMenuRef = useRef<HTMLDivElement>(null);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (organizacaoMenuRef.current && !organizacaoMenuRef.current.contains(event.target as Node)) {
                setOrganizacaoMenuOpen(false);
            }
             if (inventarioMenuRef.current && !inventarioMenuRef.current.contains(event.target as Node)) {
                setInventarioMenuOpen(false);
            }
            if (isMobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && mobileMenuButtonRef.current && !mobileMenuButtonRef.current.contains(event.target as Node)) {
                setIsMobileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMobileMenuOpen, isOrganizacaoMenuOpen, isInventarioMenuOpen]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setOrganizacaoMenuOpen(false);
        setInventarioMenuOpen(false);
        setIsMobileMenuOpen(false);
    }
    
    const [isMobileOrganizacaoOpen, setIsMobileOrganizacaoOpen] = useState(activeTab.startsWith('organizacao'));
    const [isMobileInventarioOpen, setIsMobileInventarioOpen] = useState(activeTab.startsWith('equipment'));

    useEffect(() => {
        if (activeTab.startsWith('organizacao')) {
            setIsMobileOrganizacaoOpen(true);
        }
        if (activeTab.startsWith('equipment')) {
            setIsMobileInventarioOpen(true);
        }
    }, [activeTab]);

    const hasOrganizacaoTabs = tabConfig['organizacao.instituicoes'] || tabConfig['organizacao.entidades'] || tabConfig['organizacao.teams'];
    const hasInventarioTabs = tabConfig['equipment.inventory'] || tabConfig['equipment.brands'] || tabConfig['equipment.types'];


  return (
    <header className="bg-gray-800 shadow-lg">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          <div className="flex items-center flex-shrink-0">
            <span className="font-bold text-2xl text-white">
              AI<span className="text-brand-secondary">Manager</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-2">
              {tabConfig['overview'] && <TabButton tab="overview" label="Visão Geral" icon={<FaChartBar />} activeTab={activeTab} setActiveTab={handleTabChange}/>}
              
              {hasInventarioTabs && (
                 <div className="relative" ref={inventarioMenuRef}>
                    <button
                        onClick={() => setInventarioMenuOpen(prev => !prev)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${activeTab.startsWith('equipment') ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}
                        aria-haspopup="true"
                        aria-expanded={isInventarioMenuOpen}
                    >
                        <ClipboardListIcon className="h-5 w-5"/>
                        Inventário
                        <svg className={`w-4 h-4 ml-1 transition-transform transform ${isInventarioMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {isInventarioMenuOpen && (
                        <div className="absolute z-20 mt-2 w-60 origin-top-left rounded-md shadow-lg bg-surface-dark ring-1 ring-black ring-opacity-5" role="menu" aria-orientation="vertical">
                            <div className="py-1">
                                {tabConfig['equipment.inventory'] && <TabButton tab="equipment.inventory" label="Lista de Equipamentos" icon={<ClipboardListIcon className="h-5 w-5" />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />}
                                {tabConfig['equipment.brands'] && <TabButton tab="equipment.brands" label="Marcas" icon={<FaTags />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />}
                                {tabConfig['equipment.types'] && <TabButton tab="equipment.types" label="Tipos de Equipamento" icon={<FaShapes />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />}
                            </div>
                        </div>
                    )}
                </div>
              )}

              {hasOrganizacaoTabs && (
                <div className="relative" ref={organizacaoMenuRef}>
                    <button
                        onClick={() => setOrganizacaoMenuOpen(prev => !prev)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${activeTab.startsWith('organizacao') ? 'bg-brand-primary text-white' : 'text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white'}`}
                        aria-haspopup="true"
                        aria-expanded={isOrganizacaoMenuOpen}
                    >
                        <FaSitemap />
                        Organização
                        <svg className={`w-4 h-4 ml-1 transition-transform transform ${isOrganizacaoMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {isOrganizacaoMenuOpen && (
                        <div className="absolute z-20 mt-2 w-60 origin-top-left rounded-md shadow-lg bg-surface-dark ring-1 ring-black ring-opacity-5" role="menu" aria-orientation="vertical">
                            <div className="py-1">
                                {tabConfig['organizacao.instituicoes'] && <TabButton tab="organizacao.instituicoes" label="Instituições" icon={<FaSitemap className="h-5 w-5" />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />}
                                {tabConfig['organizacao.entidades'] && <TabButton tab="organizacao.entidades" label="Entidades" icon={<OfficeBuildingIcon className="h-5 w-5" />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />}
                                {tabConfig['organizacao.teams'] && <TabButton tab="organizacao.teams" label="Equipas" icon={<FaUsers className="h-5 w-5" />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />}
                            </div>
                        </div>
                    )}
                </div>
              )}

              {tabConfig['collaborators'] && <TabButton tab="collaborators" label="Colaboradores" icon={<UserGroupIcon className="h-5 w-5"/>} activeTab={activeTab} setActiveTab={handleTabChange} />}
              {tabConfig['licensing'] && <TabButton tab="licensing" label="Licenciamento" icon={<FaKey />} activeTab={activeTab} setActiveTab={handleTabChange} />}
              {tabConfig['tickets'] && <TabButton tab="tickets" label={tabConfig['tickets'].title} icon={<FaTicketAlt />} activeTab={activeTab} setActiveTab={handleTabChange} />}
          </nav>

          <div className="flex-1 flex items-center justify-end gap-4">
            <button
                onClick={onNotificationClick}
                className="relative p-2 rounded-md text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white transition-colors"
                title="Notificações"
                aria-label="Ver notificações"
            >
                <FaBell className="h-5 w-5" />
                {notificationCount > 0 && (
                    <span className="absolute top-1 right-1 block h-3 w-3 rounded-full bg-red-500 border-2 border-gray-800" />
                )}
            </button>
             {onResetData && (
                <button
                    onClick={onResetData}
                    className="p-2 rounded-md text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white transition-colors"
                    title="Repor Dados"
                    aria-label="Repor Dados"
                >
                    <FaSync className="h-5 w-5" />
                </button>
             )}
             <div className="flex items-center gap-3">
                {currentUser && (
                    <div className="hidden sm:flex items-center gap-2 text-sm text-on-surface-dark-secondary">
                         {currentUser.photoUrl ? (
                            <img src={currentUser.photoUrl} alt={currentUser.fullName} className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                             <UserIcon className="h-5 w-5 text-brand-secondary"/>
                        )}
                        <span>Olá, {currentUser.fullName}</span>
                    </div>
                )}
                 <button
                    onClick={onLogout}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-on-surface-dark-secondary hover:bg-surface-dark hover:text-white transition-colors"
                    title="Sair"
                    aria-label="Sair"
                >
                    <LogoutIcon className="h-5 w-5" />
                    <span className="hidden sm:inline">Sair</span>
                </button>
             </div>
             <div className="flex items-center md:hidden">
                <button
                    ref={mobileMenuButtonRef}
                    onClick={() => setIsMobileMenuOpen(prev => !prev)}
                    className="inline-flex items-center justify-center p-2 rounded-md text-on-surface-dark-secondary hover:text-white hover:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    aria-controls="mobile-menu"
                    aria-expanded={isMobileMenuOpen}
                >
                    <span className="sr-only">Abrir menu principal</span>
                    <MenuIcon className="h-6 w-6" />
                </button>
            </div>
          </div>
        </div>
      </div>

       {isMobileMenuOpen && (
            <div ref={mobileMenuRef} className="md:hidden" id="mobile-menu">
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    {tabConfig['overview'] && <TabButton tab="overview" label="Visão Geral" icon={<FaChartBar />} activeTab={activeTab} setActiveTab={handleTabChange} isDropdownItem/>}
                    
                     {hasInventarioTabs && (
                        <div>
                            <button
                                onClick={() => setIsMobileInventarioOpen(prev => !prev)}
                                className={`flex items-center justify-between w-full text-left transition-colors duration-200 px-4 py-2 text-sm rounded-md ${activeTab.startsWith('equipment') ? 'bg-brand-secondary text-white' : 'text-on-surface-dark hover:bg-gray-700'}`}
                                aria-expanded={isMobileInventarioOpen}
                            >
                                <div className="flex items-center gap-2">
                                    <ClipboardListIcon className="h-5 w-5"/>
                                    <span>Inventário</span>
                                </div>
                                <svg className={`w-4 h-4 ml-1 transition-transform transform ${isMobileInventarioOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {isMobileInventarioOpen && (
                                <div className="pl-4 mt-1 space-y-1">
                                    {tabConfig['equipment.inventory'] && <TabButton tab="equipment.inventory" label="Lista de Equipamentos" icon={<ClipboardListIcon className="h-5 w-5" />} isDropdownItem activeTab={activeTab} setActiveTab={handleTabChange} />}
                                    {tabConfig['equipment.brands'] && <TabButton tab="equipment.brands" label="Marcas" icon={<FaTags />} isDropdownItem activeTab={activeTab} setActiveTab={handleTabChange} />}
                                    {tabConfig['equipment.types'] && <TabButton tab="equipment.types" label="Tipos de Equipamento" icon={<FaShapes />} isDropdownItem activeTab={activeTab} setActiveTab={handleTabChange} />}
                                </div>
                            )}
                        </div>
                    )}

                    {hasOrganizacaoTabs && (
                        <div>
                            <button
                                onClick={() => setIsMobileOrganizacaoOpen(prev => !prev)}
                                className={`flex items-center justify-between w-full text-left transition-colors duration-200 px-4 py-2 text-sm rounded-md ${activeTab.startsWith('organizacao') ? 'bg-brand-secondary text-white' : 'text-on-surface-dark hover:bg-gray-700'}`}
                                aria-expanded={isMobileOrganizacaoOpen}
                            >
                                <div className="flex items-center gap-2">
                                    <FaSitemap />
                                    <span>Organização</span>
                                </div>
                                <svg className={`w-4 h-4 ml-1 transition-transform transform ${isMobileOrganizacaoOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {isMobileOrganizacaoOpen && (
                                <div className="pl-4 mt-1 space-y-1">
                                    {tabConfig['organizacao.instituicoes'] && <TabButton tab="organizacao.instituicoes" label="Instituições" icon={<FaSitemap className="h-5 w-5" />} isDropdownItem activeTab={activeTab} setActiveTab={handleTabChange} />}
                                    {tabConfig['organizacao.entidades'] && <TabButton tab="organizacao.entidades" label="Entidades" icon={<OfficeBuildingIcon className="h-5 w-5" />} isDropdownItem activeTab={activeTab} setActiveTab={handleTabChange} />}
                                    {tabConfig['organizacao.teams'] && <TabButton tab="organizacao.teams" label="Equipas" icon={<FaUsers className="h-5 w-5" />} isDropdownItem={true} activeTab={activeTab} setActiveTab={handleTabChange} />}
                                </div>
                            )}
                        </div>
                    )}

                    {tabConfig['collaborators'] && <TabButton tab="collaborators" label="Colaboradores" icon={<UserGroupIcon className="h-5 w-5"/>} activeTab={activeTab} setActiveTab={handleTabChange} isDropdownItem/>}
                    {tabConfig['licensing'] && <TabButton tab="licensing" label="Licenciamento" icon={<FaKey />} activeTab={activeTab} setActiveTab={handleTabChange} isDropdownItem />}
                    {tabConfig['tickets'] && <TabButton tab="tickets" label={tabConfig['tickets'].title} icon={<FaTicketAlt />} activeTab={activeTab} setActiveTab={handleTabChange} isDropdownItem/>}
                </div>
            </div>
        )}
    </header>
  );
};

export default Header;