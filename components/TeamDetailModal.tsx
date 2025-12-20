
import React from 'react';
import Modal from './common/Modal';
import { Team, Collaborator, TeamMember } from '../types';
import { FaUsers, FaUserTag, FaPrint } from './common/Icons';

interface TeamDetailModalProps {
    team: Team;
    teamMembers: TeamMember[];
    collaborators: Collaborator[];
    onClose: () => void;
    onEdit: () => void;
}

const TeamDetailModal: React.FC<TeamDetailModalProps> = ({ team, teamMembers, collaborators, onClose, onEdit }) => {
    
    const members = teamMembers
        .filter(tm => tm.team_id === team.id)
        .map(tm => collaborators.find(c => c.id === tm.collaborator_id))
        .filter(Boolean) as Collaborator[];

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const membersRows = members.map(m => `
            <tr>
                <td>${m.full_name}</td>
                <td>${m.email}</td>
                <td>${m.role}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
            <head>
                <title>Ficha da Equipa - ${team.name}</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; color: #333; }
                    h1 { border-bottom: 2px solid #0D47A1; padding-bottom: 10px; color: #0D47A1; }
                    .section { margin-bottom: 20px; }
                    .label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
                    .value { font-size: 16px; margin-bottom: 5px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <h1>${team.name}</h1>
                <div class="section">
                    <div class="label">Descrição</div>
                    <div class="value">${team.description || '-'}</div>
                    <div class="label">Estado</div>
                    <div class="value">${team.is_active !== false ? 'Ativo' : 'Inativo'}</div>
                </div>
                
                <div class="section">
                    <h3>Membros da Equipa (${members.length})</h3>
                    <table>
                        <thead>
                            <tr><th>Nome</th><th>Email</th><th>Função</th></tr>
                        </thead>
                        <tbody>
                            ${membersRows}
                        </tbody>
                    </table>
                </div>
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const isActive = team.is_active !== false;

    return (
        <Modal title={`Detalhes da Equipa: ${team.name}`} onClose={onClose} maxWidth="max-w-3xl">
            <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <div className="p-3 bg-brand-primary/20 rounded-full text-brand-secondary">
                        <FaUsers className="h-8 w-8" />
                    </div>
                    <div className="flex-grow">
                        <h2 className="text-xl font-bold text-white">{team.name}</h2>
                        <p className="text-sm text-gray-400 mt-1">{team.description || 'Sem descrição disponível.'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                            <button 
                                onClick={handlePrint}
                                className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors shadow-lg flex items-center gap-2"
                            >
                                <FaPrint /> Imprimir
                            </button>
                            <button 
                                onClick={() => { onClose(); onEdit(); }} 
                                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors shadow-lg"
                            >
                                Editar Dados
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <span className={`px-3 py-1 text-xs rounded font-bold ${isActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                {isActive ? 'Ativo' : 'Inativo'}
                            </span>
                            <span className="px-3 py-1 text-xs rounded bg-gray-700 text-white border border-gray-600">
                                {members.length} Membros
                            </span>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-gray-700 pb-2 mb-3">Membros da Equipa</h3>
                    
                    {members.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                            {members.map(member => (
                                <div key={member.id} className="flex items-center gap-3 bg-surface-dark p-3 rounded border border-gray-700">
                                    {member.photo_url ? (
                                        <img src={member.photo_url} alt={member.full_name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-white flex-shrink-0">
                                            {(member.full_name || '?').charAt(0)}
                                        </div>
                                    )}
                                    <div className="overflow-hidden">
                                        <p className="font-semibold text-white truncate" title={member.full_name}>{member.full_name}</p>
                                        <p className="text-xs text-gray-400 truncate">{member.email}</p>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1">
                                            <FaUserTag className="h-2.5 w-2.5"/> {member.role}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center py-8 text-gray-500 bg-gray-800/30 rounded-lg border border-dashed border-gray-700">
                            Esta equipa ainda não tem membros associados.
                        </p>
                    )}
                </div>

                <div className="flex justify-end pt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                        Fechar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default TeamDetailModal;
