import React, { useState, useEffect, useMemo } from 'react';
import Modal from './common/Modal';
import { Team, Collaborator, TeamMember } from '../types';
import { SearchIcon, SpinnerIcon } from './common/Icons';
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa';

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

    useEffect(() => {
        // Initialize only once when the modal opens for this team
        const initialMemberIds = teamMembers
            .filter(tm => tm.team_id === team.id)
            .map(tm => tm.collaborator_id);
        setCurrentMemberIds(new Set(initialMemberIds));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [team.id]); // Removed teamMembers from deps to prevent reset on background updates

    const { teamMembersList, availableCollaborators } = useMemo(() => {
        const members: Collaborator[] = [];
        const available: Collaborator[] = [];

        allCollaborators.forEach(collaborator => {
            if (currentMemberIds.has(collaborator.id)) {
                members.push(collaborator);
            } else {
                if (searchQuery === '' || collaborator.fullName.toLowerCase().includes(searchQuery.toLowerCase())) {
                    available.push(collaborator);
                }
            }
        });
        
        members.sort((a,b) => a.fullName.localeCompare(b.fullName));
        available.sort((a,b) => a.fullName.localeCompare(b.fullName));

        return { teamMembersList: members, availableCollaborators: available };
    }, [allCollaborators, currentMemberIds, searchQuery]);
    
    const addMember = (collaboratorId: string) => {
        setCurrentMemberIds(prev => new Set(prev).add(collaboratorId));
    };

    const removeMember = (collaboratorId: string) => {
        setCurrentMemberIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(collaboratorId);
            return newSet;
        });
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            await onSave(team.id, Array.from(currentMemberIds));
            // Modal handling (closing) is usually done by parent after successful save
        } catch (error: any) {
            console.error("Failed to save team members:", error);
            alert(`Erro ao gravar membros da equipa: ${error.message}`);
            setIsSaving(false);
        }
    };

    return (
        <Modal title={`Gerir Membros da Equipa: ${team.name}`} onClose={onClose} maxWidth="max-w-4xl">
            <div className="flex flex-col md:flex-row gap-4 h-[60vh]">
                {/* Available Collaborators */}
                <div className="flex-1 flex flex-col border border-gray-700 rounded-lg p-4 bg-gray-900/50">
                    <h3 className="text-lg font-semibold text-white mb-2">Colaboradores Disponíveis</h3>
                    <div className="relative mb-2">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Procurar colaborador..."
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 pl-10 text-sm"
                        />
                    </div>
                    <ul className="flex-1 overflow-y-auto space-y-2 pr-2">
                        {availableCollaborators.map(col => (
                            <li key={col.id} className="flex items-center justify-between p-2 bg-surface-dark rounded-md">
                                <span>{col.fullName}</span>
                                <button onClick={() => addMember(col.id)} className="p-1.5 text-green-400 hover:bg-green-500/10 rounded-full">
                                    <FaChevronRight />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Team Members */}
                 <div className="flex-1 flex flex-col border border-gray-700 rounded-lg p-4 bg-gray-900/50">
                    <h3 className="text-lg font-semibold text-white mb-2">Membros da Equipa ({teamMembersList.length})</h3>
                    <ul className="flex-1 overflow-y-auto space-y-2 pr-2">
                        {teamMembersList.map(col => (
                            <li key={col.id} className="flex items-center justify-between p-2 bg-surface-dark rounded-md">
                                <button onClick={() => removeMember(col.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-full">
                                    <FaChevronLeft />
                                </button>
                                <span>{col.fullName}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-700">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar</button>
                <button 
                    type="button" 
                    onClick={handleSubmit} 
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50"
                >
                    {isSaving && <SpinnerIcon />}
                    {isSaving ? 'A Gravar...' : 'Salvar Alterações'}
                </button>
            </div>
        </Modal>
    );
};

export default ManageTeamMembersModal;