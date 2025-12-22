import React, { useState, useEffect, useRef } from 'react';
import Modal from './common/Modal';
import { Collaborator, Entidade, CollaboratorStatus, CustomRole, Instituicao, JobTitle } from '../types';
import { SpinnerIcon, FaSave } from './common/Icons';
import { FaCamera, FaKey, FaUserShield, FaUserTie, FaBuilding, FaMapMarkerAlt, FaCalendarAlt, FaBriefcase, FaIdCard, FaMagic } from 'react-icons/fa';
import * as dataService from '../services/dataService';

/**
 * ADD COLLABORATOR MODAL - V5.1 (Fixed Edit Permissions)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - PEDIDO 8: RESTAURADO COM TODOS OS CAMPOS (Morada, Datas, NIF, etc).
 * - PEDIDO 8: PASSWORD APENAS NA CRIAÇÃO (Sincronizado com Supabase Auth).
 * -----------------------------------------------------------------------------
 */

const compressProfileImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 400;
                let width = img.width, height = img.height;
                if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
                else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => resolve(blob ? new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' }) : file), 'image/jpeg', 0.7);
            };
        };
    });
};

interface AddCollaboratorModalProps {
    onClose: () => void;
    onSave: (collaborator: Omit<Collaborator, 'id'> | Collaborator, password?: string) => Promise<any>;
    collaboratorToEdit?: Collaborator | null;
    escolasDepartamentos: Entidade[];
    instituicoes: Instituicao[];
    currentUser: Collaborator | null;
}

const AddCollaboratorModal: React.FC<AddCollaboratorModalProps> = ({ onClose, onSave, collaboratorToEdit, escolasDepartamentos: entidades, instituicoes, currentUser }) => {
    const [formData, setFormData] = useState<Partial<Collaborator>>({
        numero_mecanografico: '', 
        title: '', 
        full_name: '', 
        entidade_id: '', 
        instituicao_id: '', 
        email: '', 
        nif: '',
        telefone_interno: '', 
        telemovel: '', 
        date_of_birth: '', 
        admission_date: '', 
        address_line: '', 
        postal_code: '',
        city: '', 
        locality: '', 
        can_login: false, 
        receives_notifications: true, 
        role: 'Utilizador', 
        status: CollaboratorStatus.Ativo,
        job_title_id: ''
    });
    
    const [password, setPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [availableRoles, setAvailableRoles] = useState<CustomRole[]>([]);
    const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const loadConfig = async () => {
            const [roles, data] = await Promise.all([dataService.getCustomRoles(), dataService.fetchAllData()]);
            setAvailableRoles(roles);
            setJobTitles(data.configJobTitles || []);
        };
        loadConfig();
    }, []);

    useEffect(() => {
        if (collaboratorToEdit) {
            setFormData({ 
                ...collaboratorToEdit,
                address_line: collaboratorToEdit.address_line || (collaboratorToEdit as any).address || ''
            });
            setPhotoPreview(collaboratorToEdit.photo_url || null);
        }
    }, [collaboratorToEdit]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.full_name?.trim() || !formData.email?.trim()) {
            setErrors({ full_name: 'Obrigatório', email: 'Obrigatório' });
            return;
        }
        setIsSaving(true);
        try {
            const payload = { ...formData };
            if (!payload.instituicao_id) delete payload.instituicao_id;
            if (!payload.entidade_id) delete payload.entidade_id;
            if (!payload.job_title_id) delete payload.job_title_id;

            const saved = await onSave(payload as any, (!collaboratorToEdit && password) ? password : undefined);
            if (photoFile && saved?.id) await dataService.uploadCollaboratorPhoto(saved.id, photoFile);
            onClose();
        } catch (err: any) { 
            alert("Erro ao gravar: " + err.message); 
        } finally { 
            setIsSaving(false); 
        }
    };

    const generatePassword = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let newPass = "";
        for (let i = 0; i < 12; i++) newPass += charset.charAt(Math.floor(Math.random() * charset.length));
        setPassword(newPass);
    };

    return (
        <Modal title={collaboratorToEdit ? "Editar Colaborador" : "Adicionar Colaborador"} onClose={onClose} maxWidth="max-w-4xl">
            <form onSubmit={handleSave} className="space-y-6 overflow-y-auto max-h-[80vh] p-1 pr-2 custom-scrollbar">
                
                {/* Cabeçalho: Foto e Nome */}
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start bg-gray-900/30 p-6 rounded-xl border border-gray-700">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full bg-gray-700 border-4 border-gray-600 flex items-center justify-center overflow-hidden shadow-2xl">
                            {isCompressing ? <SpinnerIcon className="h-8 w-8" /> : photoPreview ? <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" /> : <span className="text-4xl font-bold text-gray-500">{formData.full_name?.charAt(0) || '?'}</span>}
                        </div>
                        <label onClick={() => fileInputRef.current?.click()} className="absolute bottom-1 right-1 bg-brand-primary p-2 rounded-full text-white cursor-pointer hover:bg-brand-secondary shadow-lg transition-transform hover:scale-110"><FaCamera className="w-5 h-5" /></label>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={async (e) => { if (e.target.files?.[0]) { setIsCompressing(true); const f = await compressProfileImage(e.target.files[0]); setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); setIsCompressing(false); } }} />
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
                            <div className="relative">
                                <FaUserTie className="absolute left-3 top-3 text-gray-500" />
                                <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full bg-gray-800 border border-gray-700 text-white rounded p-2 pl-10 text-sm focus:border-brand-primary outline-none" placeholder="Nome Completo..." required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Corporativo</label>
                            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-800 border border-gray-700 text-white rounded p-2 text-sm focus:border-brand-primary outline-none" placeholder="email@empresa.pt" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nº Mecanográfico</label>
                            <div className="relative">
                                <FaIdCard className="absolute left-3 top-3 text-gray-500" />
                                <input type="text" value={formData.numero_mecanografico} onChange={e => setFormData({...formData, numero_mecanografico: e.target.value})} className="w-full bg-gray-800 border border-gray-700 text-white rounded p-2 pl-10 text-sm focus:border-brand-primary outline-none" placeholder="Ex: RH001" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Estrutura Organizacional */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-800/20 p-6 rounded-xl border border-gray-700">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-2"><FaBuilding/> Instituição</label>
                        <select value={formData.instituicao_id} onChange={e => setFormData({...formData, instituicao_id: e.target.value})} className="w-full bg-gray-800 border border-gray-700 text-white rounded p-2 text-sm">
                            <option value="">-- Selecione Instituição --</option>
                            {instituicoes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-2"><FaMapMarkerAlt/> Entidade / Local</label>
                        <select value={formData.entidade_id} onChange={e => setFormData({...formData, entidade_id: e.target.value})} className="w-full bg-gray-800 border border-gray-700 text-white rounded p-2 text-sm">
                            <option value="">-- Selecione Entidade --</option>
                            {entidades.filter(e => !formData.instituicao_id || e.instituicao_id === formData.instituicao_id).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-2"><FaBriefcase/> Cargo / Função</label>
                        <select value={formData.job_title_id} onChange={e => setFormData({...formData, job_title_id: e.target.value})} className="w-full bg-gray-800 border border-gray-700 text-white rounded p-2 text-sm">
                            <option value="">-- Selecione Cargo --</option>
                            {jobTitles.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Contactos e Morada */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-brand-secondary uppercase tracking-widest border-b border-gray-700 pb-2">Informação de Contacto</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Telemóvel</label>
                                <input type="text" value={formData.telemovel} onChange={e => setFormData({...formData, telemovel: e.target.value})} className="w-full bg-gray-800 border border-gray-700 text-white rounded p-2 text-sm" placeholder="9xxxxxxxx" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Extensão / Fixo</label>
                                <input type="text" value={formData.telefone_interno} onChange={e => setFormData({...formData, telefone_interno: e.target.value})} className="w-full bg-gray-800 border border-gray-700 text-white rounded p-2 text-sm" placeholder="Ext. 123" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Morada Completa</label>
                            <input type="text" value={formData.address_line} onChange={e => setFormData({...formData, address_line: e.target.value})} className="w-full bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm mb-2" placeholder="Rua, Número..." />
                            <div className="grid grid-cols-2 gap-2">
                                <input type="text" value={formData.postal_code} onChange={e => setFormData({...formData, postal_code: e.target.value})} className="w-full bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm" placeholder="CP 0000-000" />
                                <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm" placeholder="Cidade" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-brand-secondary uppercase tracking-widest border-b border-gray-700 pb-2">Datas e Compliance</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><FaCalendarAlt/> Nascimento</label>
                                <input type="date" value={formData.date_of_birth} onChange={e => setFormData({...formData, date_of_birth: e.target.value})} className="w-full bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><FaCalendarAlt/> Admissão</label>
                                <input type="date" value={formData.admission_date} onChange={e => setFormData({...formData, admission_date: e.target.value})} className="w-full bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">NIF</label>
                            <input type="text" value={formData.nif} onChange={e => setFormData({...formData, nif: e.target.value})} className="w-full bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm" placeholder="Contribuinte (9 dígitos)" maxLength={9} />
                        </div>
                    </div>
                </div>

                {/* Acesso ao Sistema - Apenas na Criação */}
                {!collaboratorToEdit && (
                    <div className="bg-blue-900/10 p-6 rounded-xl border border-blue-900/30">
                        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><FaUserShield className="text-brand-secondary"/> Configuração de Acesso</h4>
                        <div className="space-y-4">
                            <label className="flex items-center cursor-pointer group">
                                <input type="checkbox" checked={formData.can_login} onChange={e => setFormData({...formData, can_login: e.target.checked})} className="h-5 w-5 rounded bg-gray-700 text-brand-primary border-gray-600" />
                                <span className="ml-3 text-sm text-gray-300 font-bold group-hover:text-white transition-colors">Ativar Login</span>
                            </label>
                            
                            {formData.can_login && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in pt-4 border-t border-blue-900/20">
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase font-black mb-1">Perfil (Role)</label>
                                        <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-gray-800 border border-gray-700 text-white rounded p-2 text-sm">
                                            <option value="Utilizador">Utilizador</option>
                                            <option value="Técnico">Técnico</option>
                                            <option value="Admin">Administrador</option>
                                            {availableRoles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase font-black mb-1">Password Temporária</label>
                                        <div className="flex gap-2">
                                            <input type="text" value={password} onChange={e => setPassword(e.target.value)} className="flex-grow bg-gray-800 border border-gray-700 text-white rounded p-2 text-sm font-mono" placeholder="Senha inicial..." />
                                            <button type="button" onClick={generatePassword} className="bg-gray-700 px-4 rounded text-white hover:bg-gray-600"><FaMagic /></button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-md font-bold hover:bg-gray-700">Cancelar</button>
                    <button type="submit" disabled={isSaving} className="px-8 py-2 bg-brand-primary text-white rounded-md font-black uppercase tracking-widest hover:bg-brand-secondary flex items-center gap-2 shadow-xl">
                        {isSaving ? <SpinnerIcon className="h-4 w-4" /> : <FaSave />} {collaboratorToEdit ? "Guardar Alterações" : "Gravar Registo"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddCollaboratorModal;