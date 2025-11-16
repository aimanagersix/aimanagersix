

import React, { useState, useMemo, useEffect } from 'react';
import Modal from './common/Modal';
import { Equipment, Entidade, Collaborator, Assignment, CollaboratorStatus } from '../types';

interface AssignEquipmentModalProps {
    equipment: Equipment;
    brandMap: Map<string, string>;
    equipmentTypeMap: Map<string, string>;
    escolasDepartamentos: Entidade[];
    collaborators: Collaborator[];
    onClose: () => void;
    onAssign: (assignment: Omit<Assignment, 'id' | 'returnDate'>) => void;
}

const AssignEquipmentModal: React.FC<AssignEquipmentModalProps> = ({ equipment, brandMap, equipmentTypeMap, escolasDepartamentos: entidades, collaborators, onClose, onAssign }) => {
    const [selectedEntidadeId, setSelectedEntidadeId] = useState<string>(entidades[0]?.id || '');
    const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string>('');

    const filteredCollaborators = useMemo(() => {
        if (!selectedEntidadeId) return [];
        return collaborators.filter(c => c.entidadeId === selectedEntidadeId && c.status === CollaboratorStatus.Ativo);
    }, [selectedEntidadeId, collaborators]);
    
    // This effect resets collaborator selection if the current one is no longer valid for the selected school
    useEffect(() => {
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
        onAssign({
            equipmentId: equipment.id,
            entidadeId: selectedEntidadeId,
            collaboratorId: selectedCollaboratorId || undefined,
            assignedDate: new Date().toISOString().split('T')[0],
        });
    };
    const brandName = brandMap.get(equipment.brandId) || 'Marca Desconhecida';
    const equipmentTypeName = equipmentTypeMap.get(equipment.typeId) || 'Equipamento';

    return (
        <Modal title={`Atribuir ${brandName} ${equipmentTypeName}`} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <p className="text-on-surface-dark-secondary">Equipamento: <span className="font-semibold text-on-surface-dark">{equipment.serialNumber}</span></p>
                </div>
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
                        disabled={!selectedEntidadeId}
                    >
                        <option value="">-- Atribuir apenas à Localização --</option>
                        {filteredCollaborators.map(collaborator => (
                            <option key={collaborator.id} value={collaborator.id}>{collaborator.fullName}</option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">Atribuir</button>
                </div>
            </form>
        </Modal>
    );
};

export default AssignEquipmentModal;