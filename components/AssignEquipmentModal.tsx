
import React, { useState, useMemo, useEffect } from 'react';
import Modal from './common/Modal';
import { Equipment, Entidade, Collaborator, Assignment, CollaboratorStatus, EquipmentStatus, Instituicao } from '../types';
import { SpinnerIcon, FaUserTie, FaBuilding } from './common/Icons';
import * as dataService from '../services/dataService';

interface AssignEquipmentModalProps {
    equipment: Equipment;
    brandMap: Map<string, string>;
    equipmentTypeMap: Map<string, string>;
    escolasDepartamentos: Entidade[];
    instituicoes?: Instituicao[]; // NEW prop needed for direct assignment
    collaborators: Collaborator[];
    onClose: () => void;
    onAssign: (assignment: Omit<Assignment, 'id' | 'returnDate'>) => Promise<any>;
}

const AssignEquipmentModal: React.FC<AssignEquipmentModalProps> = ({ equipment, brandMap, equipmentTypeMap, escolasDepartamentos: entidades, instituicoes = [], collaborators, onClose, onAssign }) => {
    const [assignType, setAssignType] = useState<'entidade' | 'instituicao'>('entidade');
    
    const [selectedEntidadeId, setSelectedEntidadeId] = useState<string>('');
    const [selectedInstituicaoId, setSelectedInstituicaoId] = useState<string>('');
    const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Default selection
        if (entidades.length > 0) setSelectedEntidadeId(entidades[0].id);
        if (instituicoes.length > 0) setSelectedInstituicaoId(instituicoes[0].id);
    }, [entidades, instituicoes]);

    const filteredCollaborators = useMemo(() => {
        if (assignType === 'entidade') {
            if (!selectedEntidadeId) return [];
            return collaborators.filter(c => c.entidadeId === selectedEntidadeId && c.status === CollaboratorStatus.Ativo);
        } else {
            if (!selectedInstituicaoId) return [];
            // Collaborators directly assigned to institution OR to any entity within it
            return collaborators.filter(c => c.instituicaoId === selectedInstituicaoId && c.status === CollaboratorStatus.Ativo);
        }
    }, [selectedEntidadeId, selectedInstituicaoId, collaborators, assignType]);
    
    // Reset collaborator selection if context changes
    useEffect(() => {
        setSelectedCollaboratorId('');
    }, [selectedEntidadeId, selectedInstituicaoId, assignType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // --- VALIDATION: Prevent assignment if serial number is missing ---
        if (!equipment.serialNumber || equipment.serialNumber.trim() === '') {
            alert("Não é possível atribuir um equipamento sem Número de Série.\n\nPor favor, edite o equipamento e adicione o S/N antes de prosseguir (Estado atual: Aquisição).");
            return;
        }

        if (assignType === 'entidade' && !selectedEntidadeId) {
            alert("Por favor, selecione uma entidade.");
            return;
        }
        if (assignType === 'instituicao' && !selectedInstituicaoId) {
            alert("Por favor, selecione uma instituição.");
            return;
        }
        
        setIsSaving(true);
        try {
            // Determine target status based on Loan flag
            const targetStatus = equipment.isLoan ? EquipmentStatus.Emprestimo : EquipmentStatus.Operacional;
            await dataService.updateEquipment(equipment.id, { status: targetStatus });

            const payload: any = {
                equipmentId: equipment.id,
                collaboratorId: selectedCollaboratorId || undefined,
                assignedDate: new Date().toISOString().split('T')[0],
            };

            if (assignType === 'entidade') {
                payload.entidadeId = selectedEntidadeId;
            } else {
                payload.instituicaoId = selectedInstituicaoId;
            }

            await onAssign(payload);
            onClose();
        } catch (error) {
            console.error("Failed to assign", error);
            alert("Erro ao atribuir equipamento. Tente novamente.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const brandName = brandMap.get(equipment.brandId) || 'Marca Desconhecida';
    const equipmentTypeName = equipmentTypeMap.get(equipment.typeId) || 'Equipamento';

    return (
        <Modal title={`Atribuir ${brandName} ${equipmentTypeName}`} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <p className="text-on-surface-dark-secondary">Equipamento: <span className="font-semibold text-on-surface-dark">{equipment.serialNumber || '(Sem Nº Série)'}</span></p>
                    
                    {!equipment.serialNumber && (
                        <p className="text-sm text-red-400 font-bold mt-2 bg-red-900/20 p-2 rounded border border-red-500/50">
                            Atenção: Este equipamento não tem número de série. A atribuição será bloqueada.
                        </p>
                    )}

                    <p className="text-xs text-green-400 mt-1">
                        Nota: O equipamento passará para o estado <strong>{equipment.isLoan ? 'Empréstimo' : 'Operacional'}</strong>.
                    </p>
                </div>

                {/* Toggle Type */}
                <div className="flex gap-4 border-b border-gray-700 pb-2 mb-4">
                    <button
                        type="button"
                        onClick={() => setAssignType('entidade')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${assignType === 'entidade' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        <FaBuilding /> Entidade / Departamento
                    </button>
                    <button
                        type="button"
                        onClick={() => setAssignType('instituicao')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${assignType === 'instituicao' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        <FaUserTie /> Instituição (Direto)
                    </button>
                </div>

                {assignType === 'entidade' ? (
                    <div>
                        <label htmlFor="entidade" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Entidade</label>
                        <select
                            id="entidade"
                            value={selectedEntidadeId}
                            onChange={(e) => setSelectedEntidadeId(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                            disabled={isSaving}
                        >
                             {entidades.length === 0 && <option value="" disabled>Nenhuma entidade disponível</option>}
                            {entidades.map(entidade => (
                                <option key={entidade.id} value={entidade.id}>{entidade.name}</option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div>
                        <label htmlFor="instituicao" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Instituição</label>
                        <select
                            id="instituicao"
                            value={selectedInstituicaoId}
                            onChange={(e) => setSelectedInstituicaoId(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                            disabled={isSaving}
                        >
                             {instituicoes.length === 0 && <option value="" disabled>Nenhuma instituição disponível</option>}
                            {instituicoes.map(i => (
                                <option key={i.id} value={i.id}>{i.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label htmlFor="collaborator" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Colaborador (Opcional)</label>
                    <select
                        id="collaborator"
                        value={selectedCollaboratorId}
                        onChange={(e) => setSelectedCollaboratorId(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                        disabled={(!selectedEntidadeId && !selectedInstituicaoId) || isSaving}
                    >
                        <option value="">-- Atribuir apenas à Localização --</option>
                        {filteredCollaborators.map(collaborator => (
                            <option key={collaborator.id} value={collaborator.id}>{collaborator.fullName}</option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500" disabled={isSaving}>Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary flex items-center gap-2" disabled={isSaving}>
                        {isSaving && <SpinnerIcon className="h-4 w-4"/>}
                        {isSaving ? 'A atribuir...' : 'Atribuir'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AssignEquipmentModal;
