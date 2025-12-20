import React, { useState, useMemo, useEffect } from 'react';
import Modal from './common/Modal';
import { Equipment, Entidade, Collaborator } from '../types';

interface AssignMultipleEquipmentModalProps {
    equipmentList: Equipment[];
    brandMap: Map<string, string>;
    equipmentTypeMap: Map<string, string>;
    escolasDepartamentos: Entidade[];
    collaborators: Collaborator[];
    onClose: () => void;
    // FIX: entidade_id, collaborator_id, assigned_date
    onAssign: (assignment: { entidade_id: string, collaborator_id?: string, assigned_date: string }) => void;
}

const AssignMultipleEquipmentModal: React.FC<AssignMultipleEquipmentModalProps> = ({ equipmentList, brandMap, equipmentTypeMap, escolasDepartamentos: entidades, collaborators, onClose, onAssign }) => {
    const [selectedEntidadeId, setSelectedEntidadeId] = useState<string>(entidades[0]?.id || '');
    const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string>('');

    const filteredCollaborators = useMemo(() => {
        if (!selectedEntidadeId) return [];
        // FIX: entidade_id
        return collaborators.filter(c => c.entidade_id === selectedEntidadeId);
    }, [selectedEntidadeId, collaborators]);

    useEffect(() => {
        // This effect resets collaborator selection if the current one is no longer valid for the selected school
        if (selectedCollaboratorId && !filteredCollaborators.some(c => c.id === selectedCollaboratorId)) {
            setSelectedCollaboratorId('');
        }
    }, [filteredCollaborators, selectedCollaboratorId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEntidadeId) {
            alert("Por favor, selecione uma entidade.");
            return;
        }
        // FIX: entidade_id, collaborator_id, assigned_date
        onAssign({
            entidade_id: selectedEntidadeId,
            collaborator_id: selectedCollaboratorId || undefined,
            assigned_date: new Date().toISOString().split('T')[0],
        });
    };

    return (
        <Modal title={`Atribuir ${equipmentList.length} Equipamentos`} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <h3 className="text-on-surface-dark font-semibold mb-2">Equipamentos a serem atribuídos:</h3>
                    <ul className="max-h-32 overflow-y-auto bg-gray-900/50 p-3 rounded-lg text-sm space-y-1 border border-gray-700">
                        {equipmentList.map(equipment => (
                            <li key={equipment.id} className="text-on-surface-dark-secondary">
                                <span className="font-semibold text-on-surface-dark">
                                    {/* FIX: brand_id, type_id, serial_number */}
                                    {brandMap.get(equipment.brand_id) || 'N/A'} {equipmentTypeMap.get(equipment.type_id) || 'N/A'}
                                </span>
                                ({equipment.serial_number})
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="entidade" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Entidade</label>
                        <select
                            id="entidade"
                            value={selectedEntidadeId}
                            onChange={(e) => setSelectedEntidadeId(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                        >
                             {entidades.length === 0 && <option value="" disabled>Nenhuma entidade disponível</option>}
                            {entidades.map(entidade => (
                                <option key={entidade.id} value={entidade.id}>{entidade.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="collaborator" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Colaborador (Opcional)</label>
                        <select
                            id="collaborator"
                            value={selectedCollaboratorId}
                            onChange={(e) => setSelectedCollaboratorId(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                            disabled={!selectedEntidadeId || filteredCollaborators.length === 0}
                        >
                             <option value="">-- Atribuir apenas à Localização --</option>
                             {filteredCollaborators.length > 0 ? (
                                filteredCollaborators.map(collaborator => (
                                    // FIX: full_name
                                    <option key={collaborator.id} value={collaborator.id}>{collaborator.full_name}</option>
                                ))
                            ) : (
                                <option value="" disabled>Nenhum colaborador nesta entidade</option>
                            )}
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">Atribuir Equipamentos</button>
                </div>
            </form>
        </Modal>
    );
};

export default AssignMultipleEquipmentModal;