import React, { useMemo } from 'react';
import Modal from './common/Modal';
import { Equipment, Assignment, Collaborator, Entidade } from '../types';

interface EquipmentHistoryModalProps {
    equipment: Equipment;
    assignments: Assignment[];
    collaborators: Collaborator[];
    escolasDepartamentos: Entidade[];
    onClose: () => void;
}

const EquipmentHistoryModal: React.FC<EquipmentHistoryModalProps> = ({ equipment, assignments, collaborators, escolasDepartamentos: entidades, onClose }) => {
    // Memoize maps for efficient lookups
    const entidadeMap = useMemo(() => new Map(entidades.map(e => [e.id, e.name])), [entidades]);
    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.fullName])), [collaborators]);

    // Filter and sort the assignments for the current equipment
    const equipmentAssignments = useMemo(() => {
        return assignments
            .filter(a => a.equipmentId === equipment.id)
            .sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());
    }, [assignments, equipment.id]);

    const getStatusText = (assignment: Assignment) => {
        return assignment.returnDate ? 'Concluída' : 'Ativa';
    };

    return (
        <Modal title={`Histórico do Equipamento: ${equipment.serialNumber}`} onClose={onClose}>
            <div className="space-y-4">
                 <div className="bg-gray-900/50 p-3 rounded-lg text-sm grid grid-cols-2 gap-x-4">
                    <p><span className="font-semibold text-on-surface-dark-secondary">Nº Inventário:</span> {equipment.inventoryNumber || 'N/A'}</p>
                    <p><span className="font-semibold text-on-surface-dark-secondary">Nº Fatura:</span> {equipment.invoiceNumber || 'N/A'}</p>
                </div>
                {equipmentAssignments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-on-surface-dark-secondary">
                            <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Colaborador</th>
                                    <th scope="col" className="px-6 py-3">Entidade</th>
                                    <th scope="col" className="px-6 py-3">Data de Atribuição</th>
                                    <th scope="col" className="px-6 py-3">Data de Fim</th>
                                    <th scope="col" className="px-6 py-3">Estado da Atribuição</th>
                                </tr>
                            </thead>
                            <tbody>
                                {equipmentAssignments.map(assignment => (
                                    <tr key={assignment.id} className="bg-surface-dark border-b border-gray-700">
                                        <td className="px-6 py-4 font-medium text-on-surface-dark">{assignment.collaboratorId ? collaboratorMap.get(assignment.collaboratorId) : 'Atribuído à Localização'}</td>
                                        <td className="px-6 py-4">{entidadeMap.get(assignment.entidadeId) || 'N/A'}</td>
                                        <td className="px-6 py-4">{assignment.assignedDate}</td>
                                        <td className="px-6 py-4">{assignment.returnDate || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                assignment.returnDate 
                                                ? 'bg-gray-500/30 text-gray-300' 
                                                : 'bg-green-500/30 text-green-300'
                                            }`}>
                                                {getStatusText(assignment)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center py-4">Este equipamento não tem histórico de atribuições.</p>
                )}
                <div className="flex justify-end pt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default EquipmentHistoryModal;
