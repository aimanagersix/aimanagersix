
import React, { useState, useMemo } from 'react';
import Modal from './common/Modal';
import { Entidade, Instituicao, Collaborator, Assignment, Equipment, Brand, EquipmentType } from '../types';
import { FaBuilding as OfficeBuildingIcon, FaPhone, FaEnvelope, FaUserTag, FaMapMarkerAlt, FaPlus, FaUsers, FaLaptop, FaPrint, FaGlobe, FaExternalLinkAlt } from './common/Icons';

interface EntidadeDetailModalProps {
    entidade: Entidade;
    instituicao?: Instituicao;
    collaborators: Collaborator[];
    assignments?: Assignment[];
    onClose: () => void;
    onEdit: () => void;
    onAddCollaborator?: (entidadeId: string) => void;
    onAssignEquipment?: (entidadeId: string) => void;
    onOpenInstitution?: (instituicao: Instituicao) => void;
    onOpenCollaborator?: (collaborator: Collaborator) => void;
    onOpenEquipment?: (equipment: Equipment) => void;
    equipment?: Equipment[];
    brands?: Brand[];
    equipmentTypes?: EquipmentType[];
}

const EntidadeDetailModal: React.FC<EntidadeDetailModalProps> = ({ 
    entidade, instituicao, collaborators, assignments = [], onClose, onEdit, 
    onAddCollaborator, onAssignEquipment, onOpenInstitution, onOpenCollaborator, onOpenEquipment,
    equipment = [], brands = [], equipmentTypes = [] 
}) => {
    const [activeTab, setActiveTab] = useState<'info' | 'collaborators' | 'equipment'>('info');
    
    const activeCollaborators = collaborators.filter(c => c.entidade_id === entidade.id);
    const brandMap = useMemo(() => new Map(brands.map(b => [b.id, b.name])), [brands]);
    const typeMap = useMemo(() => new Map(equipmentTypes.map(t => [t.id, t.name])), [equipmentTypes]);
    const collabMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.full_name])), [collaborators]);

    const associatedEquipment = useMemo(() => {
        return assignments
            .filter(a => a.entidade_id === entidade.id && !a.return_date)
            .map(a => {
                const eq = equipment.find(e => e.id === a.equipment_id);
                if (!eq) return null;
                return {
                    ...eq,
                    assignmentDate: a.assigned_date,
                    assignedToName: a.collaborator_id ? collabMap.get(a.collaborator_id) : 'Localização'
                };
            })
            .filter(Boolean) as any[];
    }, [assignments, entidade.id, equipment, collabMap]);

    return (
        <Modal title={`Consulta: ${entidade.name}`} onClose={onClose} maxWidth="max-w-4xl">
            <div className="flex flex-col h-[75vh]">
                <div className="flex-shrink-0 flex items-start gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700 mb-4">
                    <div className="p-3 bg-brand-primary/20 rounded-full text-brand-secondary"><OfficeBuildingIcon className="h-8 w-8" /></div>
                    <div className="flex-grow">
                        <h2 className="text-xl font-bold text-white">{entidade.name}</h2>
                        <p className="text-sm text-gray-400 font-mono">{entidade.codigo}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <button onClick={() => { onClose(); onEdit(); }} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-md">Editar</button>
                        <span className={`block text-xs font-bold px-2 py-1 rounded ${entidade.status === 'Ativo' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>{entidade.status}</span>
                    </div>
                </div>

                <div className="flex border-b border-gray-700 mb-4 flex-shrink-0">
                    <button onClick={() => setActiveTab('info')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'info' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400'}`}>Informação</button>
                    <button onClick={() => setActiveTab('collaborators')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'collaborators' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400'}`}>Colaboradores ({activeCollaborators.length})</button>
                    <button onClick={() => setActiveTab('equipment')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'equipment' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400'}`}>Equipamentos ({associatedEquipment.length})</button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                    {activeTab === 'info' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3 text-sm">
                                <h3 className="font-bold text-white uppercase text-xs text-gray-500">Contactos</h3>
                                <p className="text-gray-300 flex items-center gap-2"><FaEnvelope className="text-gray-500"/> {entidade.email}</p>
                                <p className="text-gray-300 flex items-center gap-2"><FaPhone className="text-gray-500"/> {entidade.telefone || '—'}</p>
                                <p className="text-gray-300 flex items-center gap-2"><FaUserTag className="text-gray-500"/> {entidade.responsavel || '—'}</p>
                            </div>
                            <div className="space-y-3 text-sm">
                                <h3 className="font-bold text-white uppercase text-xs text-gray-500">Localização</h3>
                                <p className="text-gray-300 flex items-start gap-2"><FaMapMarkerAlt className="mt-1 text-gray-500"/> {entidade.address_line || 'Sem endereço'}</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'collaborators' && (
                        <div className="space-y-2">
                            {activeCollaborators.map(col => (
                                <div key={col.id} className="flex justify-between items-center bg-gray-800/50 p-3 rounded border border-gray-700 hover:bg-gray-700 cursor-pointer" onClick={() => onOpenCollaborator?.(col)}>
                                    <div className="flex items-center gap-3">
                                        <FaUsers className="text-gray-400" />
                                        <div><p className="font-bold text-white text-sm">{col.full_name}</p><p className="text-xs text-gray-400">{col.email}</p></div>
                                    </div>
                                    <FaExternalLinkAlt className="text-xs text-gray-600" />
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'equipment' && (
                        <div className="space-y-2">
                            {associatedEquipment.map(eq => (
                                <div key={eq.id} className="flex justify-between items-center bg-gray-800/50 p-3 rounded border border-gray-700 hover:bg-gray-700 cursor-pointer" onClick={() => onOpenEquipment?.(eq)}>
                                    <div className="flex items-center gap-3">
                                        <FaLaptop className="text-gray-400" />
                                        <div><p className="font-bold text-white text-sm">{eq.description}</p><p className="text-[10px] text-gray-500">S/N: {eq.serial_number} | Detentor: {eq.assignedToName}</p></div>
                                    </div>
                                    <FaExternalLinkAlt className="text-xs text-gray-600" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default EntidadeDetailModal;
