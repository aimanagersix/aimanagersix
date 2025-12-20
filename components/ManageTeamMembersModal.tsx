import React, { useState, useEffect, useMemo } from 'react';
import Modal from './common/Modal';
import { Team, Collaborator, TeamMember } from '../types';
import { SearchIcon, SpinnerIcon } from './common/Icons';
import { FaChevronRight, FaChevronLeft, FaUsers, FaExclamationTriangle } from 'react-icons/fa';

interface ManageTeamMembersModalProps {
    onClose: () => void;
    onSave: (teamId: string, memberIds: string[]) => Promise<void>;
    team: Team;
    allCollaborators: Collaborator[];
    teamMembers: TeamMember[];
}

const ManageTeamMembersModal: React.FC<ManageTeamMembersModalProps> = ({ onClose, onSave, team, allCollaborators, teamMembers }) => {
    const [currentMemberIds, setCurrentMemberIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSqlHelp, setShowSqlHelp] = useState(false);
    const [initialized, setInitialized] = useState(false);

    // Initialize state only once to prevent overwrites during background updates
    useEffect(() => {
        if (!initialized && team && teamMembers) {
            const initialMemberIds = teamMembers
                .filter(tm => tm.team_id === team.id)
                .map(tm => tm.collaborator_id);
            setCurrentMemberIds(new Set(initialMemberIds));
            setInitialized(true);
        }
    }, [team, teamMembers, initialized]);

    const { teamMembersList, availableCollaborators } = useMemo(() => {
        const members: Collaborator[] = [];
        const available: Collaborator[] = [];

        allCollaborators.forEach(collaborator => {
            if (currentMemberIds.has(collaborator.id)) {
                members.push(collaborator);
            } else {
                // FIX: Updated property names to snake_case
                if (searchQuery === '' || collaborator.full_name.toLowerCase().includes(searchQuery.toLowerCase())) {
                    available.push(collaborator);
                }
            }
        });
        
        // FIX: Updated property names to snake_case
        members.sort((a,b) => a.full_name.localeCompare(b.full_name));
        available.sort((a,b) => a.full_name.localeCompare(b.full_name));

        return { teamMembersList: members, availableCollaborators: available };
    }, [allCollaborators, currentMemberIds, searchQuery]);
    
    const addMember = (collaboratorId: string) => {
        setCurrentMemberIds(prev => {
            const next = new Set(prev);
            next.add(collaboratorId);
            return next;
        });
    };

    const removeMember = (collaboratorId: string) => {
        setCurrentMemberIds(prev => {
            const next = new Set(prev);
            next.delete(collaboratorId);
            return next;
        });
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        setError(null);
        setShowSqlHelp(false);
        try {
            await onSave(team.id, Array.from(currentMemberIds));
            // If successful, the parent usually refreshes data or closes modal.
        } catch (err: any) {
            console.error("Failed to save team members:", err);
            
            let friendlyMsg = err.message || "Erro desconhecido ao gravar.";
            let isDbIssue = false;

            // Check for Supabase/Postgres specific error codes
            if (
                err.code === '42P01' || // undefined_table
                err.code === '42501' || // insufficient_privilege
                err.code === '23503' || // foreign_key_violation
                (err.message && (err.message.includes('does not exist') || err.message.includes('policy') || err.message.includes('violates foreign key')))
            ) {
                isDbIssue = true;
                if (err.code === '42P01' || err.message.includes('does not exist')) {
                     friendlyMsg = "A tabela 'team_members' não existe na base de dados.";
                } else if (err.code === '23503' || err.message.includes('violates foreign key constraint')) {
                    friendlyMsg = "Erro de integridade (Foreign Key). A tabela 'team_members' precisa de ser recriada.";
                } else {
                     friendlyMsg = "Erro de permissões (RLS). O sistema não tem autorização para gravar nesta tabela.";
                }
            }

            setError(friendlyMsg);
            if (isDbIssue) setShowSqlHelp(true);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal title={`Gerir Membros da Equipa: ${team.name}`} onClose={onClose} maxWidth="max-w-5xl">
            <div className="flex flex-col h-[70vh]">
                <div className="flex items-center gap-2 mb-4 text-sm text-on-surface-dark-secondary bg-blue-900/20 p-3 rounded-md border border-blue-900/50">
                    <FaUsers className="text-brand-secondary" />
                    <span>
                        Adicione ou remova colaboradores desta equipa. As alterações só serão aplicadas ao clicar em "Salvar".
                    </span>
                </div>

                <div className="flex flex-col md:flex-row gap-4 flex-1 overflow-hidden">
                    {/* Available Collaborators */}
                    <div className="flex-1 flex flex-col border border-gray-700 rounded-lg p-4 bg-gray-900/50">
                        <h3 className="text-lg font-semibold text-white mb-2">Disponíveis</h3>
                        <div className="relative mb-3">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Procurar colaborador..."
                                className="w-full bg-gray-800 border border-gray-600 text-white rounded-md p-2 pl-9 text-sm focus:ring-brand-secondary focus:border-brand-secondary"
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-1 pr-2">
                            {availableCollaborators.length > 0 ? (
                                availableCollaborators.map(col => (
                                    <div key={col.id} className="flex items-center justify-between p-2 bg-surface-dark rounded-md border border-gray-700 hover:bg-gray-700 transition-colors">
                                        {/* FIX: Updated property names to snake_case */}
                                        <span className="text-sm truncate mr-2" title={col.full_name}>{col.full_name}</span>
                                        <button 
                                            onClick={() => addMember(col.id)} 
                                            className="p-1.5 text-green-400 hover:bg-green-500/20 rounded-full transition-colors"
                                            title="Adicionar à equipa"
                                        >
                                            <FaChevronRight />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 text-sm mt-4">Nenhum colaborador encontrado.</p>
                            )}
                        </div>
                    </div>

                    {/* Team Members */}
                    <div className="flex-1 flex flex-col border border-gray-700 rounded-lg p-4 bg-gray-900/50 border-l-4 border-l-brand-secondary">
                        <h3 className="text-lg font-semibold text-white mb-2 flex justify-between">
                            <span>Membros da Equipa</span>
                            <span className="text-brand-secondary text-sm bg-brand-secondary/10 px-2 py-0.5 rounded-full">{teamMembersList.length}</span>
                        </h3>
                        <div className="flex-1 overflow-y-auto space-y-1 pr-2 mt-12 md:mt-0">
                            {teamMembersList.length > 0 ? (
                                teamMembersList.map(col => (
                                    <div key={col.id} className="flex items-center justify-between p-2 bg-surface-dark rounded-md border border-gray-700 hover:bg-gray-700 transition-colors">
                                        <button 
                                            onClick={() => removeMember(col.id)} 
                                            className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-full transition-colors"
                                            title="Remover da equipa"
                                        >
                                            <FaChevronLeft />
                                        </button>
                                        {/* FIX: Updated property names to snake_case */}
                                        <span className="text-sm truncate ml-2" title={col.full_name}>{col.full_name}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 text-sm mt-4">Nenhum membro nesta equipa.</p>
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-md text-red-200 text-sm animate-pulse">
                        <div className="flex items-center gap-2 font-bold mb-1">
                             <FaExclamationTriangle className="flex-shrink-0" />
                             <span>{error}</span>
                        </div>
                        {showSqlHelp && (
                            <div className="mt-2 bg-black/50 p-3 rounded border border-red-500/30">
                                <p className="text-xs text-gray-300 mb-2">
                                    <strong>Ação Necessária:</strong> O erro indica que a tabela de membros está desincronizada ou mal configurada.
                                    <br/>
                                    1. Aceda ao menu <strong>Configuração BD</strong> (no topo da app).
                                    <br/>
                                    2. Copie o script SQL fornecido e execute-o no <strong>SQL Editor</strong> do Supabase.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-700">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                        disabled={isSaving}
                    >
                        Cancelar
                    </button>
                    <button 
                        type="button" 
                        onClick={handleSubmit} 
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                    >
                        {isSaving && <SpinnerIcon className="h-4 w-4" />}
                        {isSaving ? 'A Gravar...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ManageTeamMembersModal;