
import React, { useState, useMemo } from 'react';
import Modal from './common/Modal';
import { Collaborator, EquipmentType, ConfigItem, Entidade, Instituicao, TicketStatus, CollaboratorStatus } from '../types';
import { FaUserPlus, FaLaptop, FaKey, FaShieldAlt, FaCheck, FaSpinner, FaPlaneArrival } from 'react-icons/fa';
import * as dataService from '../services/dataService';

interface OnboardingModalProps {
    onClose: () => void;
    onSave: () => void;
    equipmentTypes: EquipmentType[];
    softwareCategories: ConfigItem[];
    entidades: Entidade[];
    instituicoes: Instituicao[];
    currentUser: Collaborator | null;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose, onSave, equipmentTypes, softwareCategories, entidades, instituicoes, currentUser }) => {
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        role: 'Utilizador', // Default system role
        jobTitle: '', // Functional role (e.g. Accountant)
        startDate: '',
        entidadeId: '',
        instituicaoId: '',
        
        // Resources
        selectedHardwareTypes: [] as string[],
        selectedSoftwareCategories: [] as string[],
        needsVpn: false,
        needsMobile: false,
        
        notes: ''
    });

    // Compute institution based on entity
    const handleEntityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const entId = e.target.value;
        const entity = entidades.find(ent => ent.id === entId);
        setFormData(prev => ({
            ...prev,
            entidadeId: entId,
            instituicaoId: entity ? entity.instituicaoId : prev.instituicaoId
        }));
    };

    const toggleHardware = (id: string) => {
        setFormData(prev => {
            const current = prev.selectedHardwareTypes;
            if (current.includes(id)) return { ...prev, selectedHardwareTypes: current.filter(x => x !== id) };
            return { ...prev, selectedHardwareTypes: [...current, id] };
        });
    };

    const toggleSoftware = (id: string) => {
        setFormData(prev => {
            const current = prev.selectedSoftwareCategories;
            if (current.includes(id)) return { ...prev, selectedSoftwareCategories: current.filter(x => x !== id) };
            return { ...prev, selectedSoftwareCategories: [...current, id] };
        });
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            // 1. Create Collaborator with 'Onboarding' status
            const newCollab = await dataService.addCollaborator({
                fullName: formData.fullName,
                email: formData.email,
                role: formData.role,
                status: CollaboratorStatus.Onboarding, 
                entidadeId: formData.entidadeId,
                instituicaoId: formData.instituicaoId,
                canLogin: false,
                receivesNotifications: false,
                // Assuming description/jobTitle field exists or using generic field
                // If not, we skip. Standard Collaborator type does not enforce job title
            });

            // 2. Create Ticket
            const hardwareNames = formData.selectedHardwareTypes.map(id => equipmentTypes.find(t => t.id === id)?.name).join(', ');
            const softwareNames = formData.selectedSoftwareCategories.map(id => softwareCategories.find(c => c.id === id)?.name).join(', ');
            
            const description = `
**Novo Colaborador:** ${formData.fullName} (${formData.jobTitle})
**Email:** ${formData.email}
**Data de Início:** ${formData.startDate}
**Localização:** ${entidades.find(e => e.id === formData.entidadeId)?.name || 'N/A'}

**Requisitos de Hardware:**
${hardwareNames || 'Nenhum'}

**Requisitos de Software:**
${softwareNames || 'Nenhum'}

**Acessos Adicionais:**
${formData.needsVpn ? '- VPN Remota' : ''}
${formData.needsMobile ? '- Telemóvel/Cartão SIM' : ''}

**Notas:**
${formData.notes}
            `;

            // Link ticket to new collaborator? Yes, as requester or just linked via text.
            // Using collaboratorId of the new user allows tracking history on their profile immediately.
            await dataService.addTicket({
                title: `Onboarding: ${formData.fullName}`,
                description: description.trim(),
                status: TicketStatus.Requested,
                category: 'Pedido de Acesso', 
                requestDate: new Date().toISOString(),
                collaboratorId: newCollab.id, // Linked to the new user directly!
                entidadeId: formData.entidadeId || currentUser?.entidadeId,
                impactCriticality: 'Média',
                technicianId: undefined // Not assigned yet
            });

            await dataService.logAction('ONBOARDING', 'Collaborator', `Onboarding request created for ${formData.fullName}`);
            
            onSave();
            onClose();
            alert("Pedido de Onboarding criado com sucesso! O colaborador foi registado como 'Onboarding' e gerado um ticket.");

        } catch (e) {
            console.error(e);
            alert("Erro ao criar pedido.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal title="Assistente de Onboarding (Entrada de Colaborador)" onClose={onClose} maxWidth="max-w-4xl">
            <div className="flex flex-col h-[70vh]">
                {/* Steps Indicator */}
                <div className="flex items-center justify-between mb-6 px-12 relative">
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-700 -z-10"></div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-brand-primary text-white' : 'bg-gray-800 text-gray-500'}`}>1</div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-brand-primary text-white' : 'bg-gray-800 text-gray-500'}`}>2</div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-brand-primary text-white' : 'bg-gray-800 text-gray-500'}`}>3</div>
                </div>

                <div className="flex-grow overflow-y-auto p-2">
                    {step === 1 && (
                        <div className="space-y-4 animate-fade-in">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><FaUserPlus /> Dados do Colaborador</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Nome Completo</label>
                                    <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Função / Cargo</label>
                                    <input type="text" value={formData.jobTitle} onChange={e => setFormData({...formData, jobTitle: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" placeholder="ex: Contabilista" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Email Pessoal / Proposto</label>
                                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Data de Início</label>
                                    <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm text-gray-400 mb-1">Entidade / Departamento</label>
                                    <select value={formData.entidadeId} onChange={handleEntityChange} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                                        <option value="">Selecione...</option>
                                        {entidades.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><FaLaptop /> Requisitos de Equipamento</h3>
                            
                            <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                                <h4 className="text-sm font-bold text-blue-300 mb-3">Hardware Necessário</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {equipmentTypes.map(type => (
                                        <label key={type.id} className={`flex items-center gap-2 p-2 rounded cursor-pointer border ${formData.selectedHardwareTypes.includes(type.id) ? 'bg-blue-900/30 border-blue-500' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>
                                            <input type="checkbox" checked={formData.selectedHardwareTypes.includes(type.id)} onChange={() => toggleHardware(type.id)} className="rounded bg-gray-800 border-gray-500 text-blue-500" />
                                            <span className="text-sm text-white">{type.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                                <h4 className="text-sm font-bold text-purple-300 mb-3">Software e Acessos</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {softwareCategories.map(cat => (
                                        <label key={cat.id} className={`flex items-center gap-2 p-2 rounded cursor-pointer border ${formData.selectedSoftwareCategories.includes(cat.id) ? 'bg-purple-900/30 border-purple-500' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>
                                            <input type="checkbox" checked={formData.selectedSoftwareCategories.includes(cat.id)} onChange={() => toggleSoftware(cat.id)} className="rounded bg-gray-800 border-gray-500 text-purple-500" />
                                            <span className="text-sm text-white">{cat.name}</span>
                                        </label>
                                    ))}
                                    <label className={`flex items-center gap-2 p-2 rounded cursor-pointer border ${formData.needsVpn ? 'bg-purple-900/30 border-purple-500' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>
                                        <input type="checkbox" checked={formData.needsVpn} onChange={e => setFormData({...formData, needsVpn: e.target.checked})} className="rounded bg-gray-800 border-gray-500 text-purple-500" />
                                        <span className="text-sm text-white">VPN / Acesso Remoto</span>
                                    </label>
                                     <label className={`flex items-center gap-2 p-2 rounded cursor-pointer border ${formData.needsMobile ? 'bg-purple-900/30 border-purple-500' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}>
                                        <input type="checkbox" checked={formData.needsMobile} onChange={e => setFormData({...formData, needsMobile: e.target.checked})} className="rounded bg-gray-800 border-gray-500 text-purple-500" />
                                        <span className="text-sm text-white">Telemóvel Corporativo</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 animate-fade-in">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><FaCheck /> Revisão e Confirmação</h3>
                            
                            <div className="bg-gray-800 p-4 rounded border border-gray-700 text-sm space-y-2">
                                <p><strong className="text-gray-400">Nome:</strong> {formData.fullName}</p>
                                <p><strong className="text-gray-400">Cargo:</strong> {formData.jobTitle}</p>
                                <p><strong className="text-gray-400">Início:</strong> {formData.startDate}</p>
                                <p><strong className="text-gray-400">Entidade:</strong> {entidades.find(e => e.id === formData.entidadeId)?.name || 'N/A'}</p>
                                <div className="border-t border-gray-700 pt-2 mt-2">
                                    <p><strong className="text-gray-400">Hardware:</strong> {formData.selectedHardwareTypes.length > 0 ? formData.selectedHardwareTypes.map(id => equipmentTypes.find(t => t.id === id)?.name).join(', ') : 'Nenhum'}</p>
                                    <p><strong className="text-gray-400">Software:</strong> {formData.selectedSoftwareCategories.length > 0 ? formData.selectedSoftwareCategories.map(id => softwareCategories.find(c => c.id === id)?.name).join(', ') : 'Nenhum'}</p>
                                </div>
                            </div>
                            
                            <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30 text-xs text-blue-200">
                                <p>
                                    Ao confirmar, será criado um registo de colaborador com estado <strong>"Onboarding"</strong> e um Ticket para a equipa de TI iniciar o provisionamento.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Notas Adicionais para TI</label>
                                <textarea 
                                    value={formData.notes} 
                                    onChange={e => setFormData({...formData, notes: e.target.value})} 
                                    rows={3} 
                                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
                                    placeholder="Ex: Precisa de monitor extra, teclado em francês..."
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-between pt-4 border-t border-gray-700 mt-auto">
                    {step > 1 ? (
                        <button onClick={() => setStep(step - 1)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500">Voltar</button>
                    ) : (
                         <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500">Cancelar</button>
                    )}

                    {step < 3 ? (
                         <button onClick={() => setStep(step + 1)} className="px-6 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary">Seguinte</button>
                    ) : (
                         <button onClick={handleSubmit} disabled={isSaving} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-500 flex items-center gap-2">
                             {isSaving ? <FaSpinner className="animate-spin" /> : <FaPlaneArrival />} Confirmar Onboarding
                         </button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default OnboardingModal;
