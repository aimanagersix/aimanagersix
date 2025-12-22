import React, { useState, useEffect, useRef } from 'react';
import Modal from './common/Modal';
import { Collaborator, Entidade, UserRole, CollaboratorStatus, ConfigItem, ContactTitle, CustomRole, Instituicao, JobTitle } from '../types';
import { SpinnerIcon, FaSave } from './common/Icons';
import { FaGlobe, FaMagic, FaCamera, FaTrash, FaKey, FaBriefcase, FaPlus, FaBirthdayCake, FaUserShield, FaBell, FaCalendarAlt } from 'react-icons/fa';
import * as dataService from '../services/dataService';

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidMobile = (phone: string): boolean => {
    if (!phone || phone.trim() === '') return true;
    const regex = /^9[1236]\d{7}$/;
    return regex.test(phone.replace(/[\s-()]/g, '').replace(/^\+351/, ''));
};

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
        numero_mecanografico: '', title: '', full_name: '', entidade_id: '', instituicao_id: '', email: '', nif: '',
        telefone_interno: '', telemovel: '', date_of_birth: '', admission_date: '', address_line: '', postal_code: '',
        city: '', locality: '', can_login: false, receives_notifications: true, role: 'Utilizador', status: CollaboratorStatus.Ativo
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
    const [selectedInstituicao, setSelectedInstituicao] = useState<string>('');
    const isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;

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
            setSelectedInstituicao(collaboratorToEdit.instituicao_id || '');
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
            // Limpeza explícita para evitar o erro 'address' não existente no cache v4.0
            const payload = { ...formData };
            delete (payload as any).address;

            const saved = await onSave(payload as any, password || undefined);
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
        <Modal title={collaboratorToEdit ? "Editar Colaborador" : "Adicionar Colaborador"} onClose={onClose} maxWidth="max-w-2xl">
            <form onSubmit={handleSave} className="space-y-4 overflow-y-auto max-h-[80vh] p-1 pr-2 custom-scrollbar">
                <div className="flex flex-col items-center mb-6">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center overflow-hidden">
                            {isCompressing ? <SpinnerIcon className="h-8 w-8" /> : photoPreview ? <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" /> : <span className="text-2xl font-bold text-gray-500">{formData.full_name?.charAt(0) || '?'}</span>}
                        </div>
                        <label onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-brand-primary p-2 rounded-full text-white cursor-pointer hover:bg-brand-secondary shadow-lg"><FaCamera className="w-4 h-4" /></label>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={async (e) => { if (e.target.files?.[0]) { setIsCompressing(true); const f = await compressProfileImage(e.target.files[0]); setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); setIsCompressing(false); } }} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-xs font-medium text-gray-400 mb-1">Nome Completo</label><input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full bg-gray-700 border text-white rounded p-2 text-sm" required /></div>
                    <div><label className="block text-xs font-medium text-gray-400 mb-1">Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-700 border text-white rounded p-2 text-sm" required /></div>
                </div>

                <div className="bg-gray-900/50 p-4 rounded border border-gray-600">
                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><FaUserShield className="text-brand-secondary"/> Acesso ao Sistema</h4>
                    <div className="space-y-4">
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" checked={formData.can_login} onChange={e => setFormData({...formData, can_login: e.target.checked})} className="h-4 w-4 rounded bg-gray-700 text-brand-primary" />
                            <span className="ml-2 text-sm text-gray-300">Permitir Login</span>
                        </label>
                        
                        {formData.can_login && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in pt-3 border-t border-gray-700">
                                <div>
                                    <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Perfil de Acesso</label>
                                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm">
                                        <option value="Utilizador">Utilizador</option>
                                        <option value="Técnico">Técnico</option>
                                        <option value="Admin">Admin</option>
                                        {availableRoles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Password Temporária</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={password} 
                                            onChange={e => setPassword(e.target.value)} 
                                            className="flex-grow bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm font-mono" 
                                            placeholder="Definir senha..." 
                                        />
                                        <button 
                                            type="button" 
                                            onClick={generatePassword} 
                                            className="bg-gray-700 px-3 rounded text-white hover:bg-gray-600" 
                                            title="Auto Gerar"
                                        >
                                            <FaMagic size={12}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded text-sm">Cancelar</button>
                    <button type="submit" disabled={isSaving} className="px-6 py-2 bg-brand-primary text-white rounded font-bold hover:bg-brand-secondary flex items-center gap-2">
                        {isSaving ? <SpinnerIcon className="h-4 w-4" /> : <FaSave />} Salvar
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddCollaboratorModal;