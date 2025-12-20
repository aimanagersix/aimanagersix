
import React, { useState, useMemo, useEffect } from 'react';
import Modal from './common/Modal';
import { Collaborator, EquipmentType, ConfigItem, Entidade, Instituicao, TicketStatus, CollaboratorStatus, JobTitle } from '../types';
import { FaUserPlus, FaLaptop, FaKey, FaShieldAlt, FaCheck, FaSpinner, FaPlaneArrival, FaBriefcase } from 'react-icons/fa';
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
    const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);

    useEffect(() => {
        const loadJobs = async () => {
             const data = await dataService.fetchAllData();
             if (data.configJobTitles) setJobTitles(data.configJobTitles);
        };
        loadJobs();
    }, []);

    // Form State NORMALIZED to snake_case
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        role: 'Utilizador',
        job_title_id: '',
        start_date: '',
        entidade_id: '',
        instituicao_id: '',
        
        selectedHardwareTypes: [] as string[],
        selectedSoftwareCategories: [] as string[],
        needsVpn: false,
        needsMobile: false,
        
        notes: ''
    });

    const handleEntityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const entId = e.target.value;
        const entity = entidades.find(ent => ent.id === entId);
        setFormData(prev => ({
            ...prev,
            entidade_id: entId,
            instituicao_id: entity ? entity.instituicao_id : prev.instituicao_id
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
        if (!formData.full_name || !formData.email) {
            alert("Nome e Email são obrigatórios.");
            return;
        }

        setIsSaving(true);
        try {
            const collabData = {
                full_name: formData.full_name,
                email: formData.email,
                role: formData.role,
                status: CollaboratorStatus.Onboarding, 
                entidade_id: formData.entidade_id || null,
                instituicao_id: formData.instituicao_id || null,
                can_login: false,
                receives_notifications: false,
                numero_mecanografico: 'N/A',
                job_title_id: formData.job_title_id || null
            };

            const newCollab = await dataService.addCollaborator(collabData);

            if (!newCollab || !newCollab.id) {
                throw new Error("Falha ao criar registo de colaborador.");
            }

            const hardwareNames = formData.selectedHardwareTypes.map(id => equipmentTypes.find(t => t.id === id)?.name).join(', ');
            const softwareNames = formData.selectedSoftwareCategories.map(id => softwareCategories.find(c => c.id === id)?.name).join(', ');
            const jobTitleName = jobTitles.find(j => j.id === formData.job_title_id)?.name || 'N/A';
            
            const description = `
**Novo Colaborador:** ${formData.full_name}
**Função:** ${jobTitleName}
**Email:** ${formData.email}
**Data de Início:** ${formData.start_date}
**Localização:** ${entidades.find(e => e.id === formData.entidade_id)?.name || 'N/A'}

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

            await dataService.addTicket({
                title: `Onboarding: ${formData.full_name}`,
                description: description.trim(),
                status: TicketStatus.Requested,
                category: 'Pedido de Acesso', 
                request_date: new Date().toISOString(),
                collaborator_id: newCollab.id,
                entidade_id: formData.entidade_id || currentUser?.entidade_id,
                impact_criticality: 'Média'
            });

            await dataService.logAction('ONBOARDING', 'Collaborator', `Onboarding request created for ${formData.full_name}`);
            
            onSave();
            onClose();
            alert("Pedido de Onboarding criado com sucesso!");

        } catch (e: any) {
            console.error(e);
            alert(`Erro: ${e.message || "Erro de rede."}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal title="Assistente de Onboarding" onClose={onClose} maxWidth="max-w-4xl">
            <div className="flex flex-col h-[70vh]">
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
                                    <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1 flex items-center gap-2"><FaBriefcase/> Função / Cargo</label>
                                    <select 
                                        value={formData.job_title_id} 
                                        onChange={e => setFormData({...formData, job_title_id: e.target.value})} 
                                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
                                    >
                                        <option value="">-- Selecione Cargo --</option>
                                        {jobTitles.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Email Pessoal / Proposto</label>
                                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Data de Início</label>
                                    <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm text-gray-400 mb-1">Entidade / Departamento</label>
                                    <select value={formData.entidade_id} onChange={handleEntityChange} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white">
                                        <option value="">Selecione...</option>
                                        {entidades.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><FaLaptop /> Requisitos</h3>
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
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 animate-fade-in">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><FaCheck /> Confirmação</h3>
                            <div className="bg-gray-800 p-4 rounded border border-gray-700 text-sm space-y-2">
                                <p><strong className="text-gray-400">Nome:</strong> {formData.full_name}</p>
                                <p><strong className="text-gray-400">Início:</strong> {formData.start_date}</p>
                            </div>
                            <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={3} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white" placeholder="Notas adicionais..." />
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
                             {isSaving ? <FaSpinner className="animate-spin" /> : <FaPlaneArrival />} Confirmar
                         </button>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default OnboardingModal;
