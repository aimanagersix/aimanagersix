import React, { useMemo } from 'react';
import Modal from './common/Modal';
import { Collaborator, CollaboratorHistory, Entidade } from '../types';

interface CollaboratorHistoryModalProps {
    collaborator: Collaborator;
    history: CollaboratorHistory[];
    escolasDepartamentos: Entidade[];
    onClose: () => void;
}

const CollaboratorHistoryModal: React.FC<CollaboratorHistoryModalProps> = ({ collaborator, history, escolasDepartamentos: entidades, onClose }) => {
    const entidadeMap = useMemo(() => new Map(entidades.map(e => [e.id, e.name])), [entidades]);

    const collaboratorAssignments = useMemo(() => {
        // FIX: Updated property names to snake_case
        return history
            .filter(h => h.collaborator_id === collaborator.id)
            .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    }, [history, collaborator.id]);

    return (
        <Modal title={`Histórico de Entidades: ${collaborator.full_name}`} onClose={onClose}>
            <div className="space-y-4">
                {collaboratorAssignments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                            <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Entidade</th>
                                    <th scope="col" className="px-6 py-3">Data de Início</th>
                                    <th scope="col" className="px-6 py-3">Data de Fim</th>
                                </tr>
                            </thead>
                            <tbody>
                                {collaboratorAssignments.map(item => (
                                    <tr key={item.id} className="bg-surface-dark border-b border-gray-700">
                                        {/* FIX: Updated property names to snake_case */}
                                        <td className="px-6 py-4 font-medium text-on-surface-dark">{entidadeMap.get(item.entidade_id) || 'Entidade Desconhecida'}</td>
                                        <td className="px-6 py-4">{item.start_date}</td>
                                        <td className="px-6 py-4">
                                            {item.end_date ? item.end_date : (
                                                <span className="px-2 py-1 text-xs rounded-full bg-green-500/30 text-green-300">
                                                    Presente
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center py-4">Este colaborador não tem histórico de mudanças de entidade.</p>
                )}
                <div className="flex justify-end pt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default CollaboratorHistoryModal;