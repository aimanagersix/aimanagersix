import React, { useState, useMemo } from 'react';
import Modal from './common/Modal';
import { Entidade, Instituicao, Collaborator, Assignment, Equipment, Brand, EquipmentType } from '../types';
import { FaBuilding, FaPhone, FaEnvelope, FaUserTag, FaMapMarkerAlt, FaPlus, FaUsers, FaLaptop, FaGlobe, FaExternalLinkAlt, FaIdCard } from './common/Icons';

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
    onOpenCollaborator, onOpenEquipment,
    equipment = []
}) => {
    const [activeTab, setActiveTab] = useState<'info' | 'collaborators' | 'equipment'>('info');
    
    const activeCollaborators = useMemo(() => {
        return collaborators.filter(c => c.entidade_id === entidade.id).sort((a,b) => a.full_name.localeCompare(b.full_name));
    }, [collaborators, entidade.id]);

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
        <Modal title={`Ficha de Unidade / Local: ${entidade.name}`} onClose={onClose} maxWidth="max-w-4xl">
            <div className="flex flex-col h-[75vh]">
                <div className="flex-shrink-0 flex items-start gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700 mb-4">
                    <div className="p-3 bg-brand-primary/20 rounded-full text-brand-secondary"><FaBuilding className="h-8 w-8" /></div>
                    <div className="flex-grow">
                        <h2 className="text-xl font-bold text-white">{entidade.name}</h2>
                        <p className="text-sm text-gray-400 font-mono tracking-widest uppercase">{entidade.codigo} {entidade.nif && `| NIF: ${entidade.nif}`}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <button onClick={() => { onClose(); onEdit(); }} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded font-bold shadow-lg transition-all">Editar</button>
                        <span className={`block text-[10px] font-black uppercase px-2 py-1 rounded-full border ${entidade.status === 'Ativo' ? 'bg-green-900/30 text-green-400 border-green-500/30' : 'bg-red-900/30 text-red-400 border-red-500/30'}`}>{entidade.status}</span>
                    </div>
                </div>

                <div className="flex border-b border-gray-700 mb-4 flex-shrink-0">
                    <button onClick={() => setActiveTab('info')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${activeTab === 'info' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Informação Geral</button>
                    <button onClick={() => setActiveTab('collaborators')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${activeTab === 'collaborators' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Colaboradores <span className="bg-gray-700 px-1.5 py-0.5 rounded text-[10px]">{activeCollaborators.length}</span></button>
                    <button onClick={() => setActiveTab('equipment')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${activeTab === 'equipment' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Equipamentos <span className="bg-gray-700 px-1.5 py-0.5 rounded text-[10px]">{associatedEquipment.length}</span></button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                    {activeTab === 'info' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-1 mb-2">Responsabilidade e Contactos</h4>
                                    <p className="text-sm text-gray-300 flex items-center gap-3"><FaUserTag className="text-gray-500"/> <span className="font-bold text-white">{entidade.responsavel || 'Não definido'}</span> (Responsável)</p>
                                    <p className="text-sm text-gray-300 flex items-center gap-3"><FaEnvelope className="text-gray-500"/> {entidade.email}</p>
                                    {(entidade.telefone || entidade.telemovel) && <p className="text-sm text-gray-300 flex items-center gap-3"><FaPhone className="text-gray-500"/> {entidade.telemovel || entidade.telefone}</p>}
                                    {entidade.website && <p className="text-sm text-brand-secondary flex items-center gap-3 hover:underline cursor-pointer"><FaGlobe className="text-gray-500"/> {entidade.website}</p>}
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-1 mb-2">Localização Física</h4>
                                    <p className="text-sm text-gray-300 flex items-start gap-3"><FaMapMarkerAlt className="mt-1 text-gray-500"/> {entidade.address_line || 'Sem morada registada'}</p>
                                    <p className="text-sm text-gray-300 ml-8">{entidade.postal_code} {entidade.locality}</p>
                                    <p className="text-sm text-gray-300 ml-8">{entidade.city}</p>
                                    {instituicao && <p className="text-xs text-gray-500 pt-2 border-t border-gray-800 mt-4 flex items-center gap-2"><FaIdCard/> Instituição Superior: <span className="font-bold text-gray-300">{instituicao.name}</span></p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'collaborators' && (
                        <div className="max-h-[450px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                            {activeCollaborators.length > 0 ? activeCollaborators.map(col => (
                                <div key={col.id} className="flex justify-between items-center bg-gray-800/50 p-3 rounded border border-gray-700 hover:bg-gray-700 transition-colors cursor-pointer group" onClick={() => onOpenCollaborator?.(col)}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-white text-xs">{col.full_name.charAt(0)}</div>
                                        <div><p className="font-bold text-white text-sm group-hover:text-brand-secondary">{col.full_name}</p><p className="text-xs text-gray-500">{col.email}</p></div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[9px] font-black uppercase text-gray-500 border border-gray-700 px-2 rounded-full">{col.role}</span>
                                        <FaExternalLinkAlt className="text-xs text-gray-600 opacity-0 group-hover:opacity-100" />
                                    </div>
                                </div>
                            )) : <p className="text-center py-10 text-gray-500 italic bg-gray-900/20 rounded border border-dashed border-gray-800">Sem colaboradores registados nesta unidade.</p>}
                        </div>
                    )}

                    {activeTab === 'equipment' && (
                        <div className="max-h-[450px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                            {associatedEquipment.length > 0 ? associatedEquipment.map(eq => (
                                <div key={eq.id} className="flex justify-between items-center bg-gray-800/50 p-3 rounded border border-gray-700 hover:bg-gray-700 transition-colors cursor-pointer group" onClick={() => onOpenEquipment?.(eq)}>
                                    <div className="flex items-center gap-3">
                                        <FaLaptop className="text-gray-400 group-hover:text-blue-400 transition-colors" />
                                        <div>
                                            <p className="font-bold text-white text-sm group-hover:text-brand-secondary">{eq.description}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">S/N: {eq.serial_number}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-brand-secondary font-bold">{eq.assignedToName}</p>
                                        <p className="text-[9px] text-gray-500 italic">Desde: {eq.assignmentDate}</p>
                                    </div>
                                </div>
                            )) : <p className="text-center py-10 text-gray-500 italic bg-gray-900/20 rounded border border-dashed border-gray-800">Nenhum equipamento operacional nesta localização.</p>}
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-700 mt-auto">
                    <button onClick={onClose} className="px-8 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-bold transition-all">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default EntidadeDetailModal;