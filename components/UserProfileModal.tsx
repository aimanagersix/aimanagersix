
import React, { useRef, useState, useEffect, useMemo } from 'react';
import Modal from './common/Modal';
import { Collaborator, Entidade, Instituicao } from '../types';
import { FaCamera, FaTrash, FaBuilding, FaUserTie, FaEnvelope, FaIdCard, FaSpinner, FaMapMarkerAlt, FaCalendarAlt, FaBriefcase, FaSave } from 'react-icons/fa';
import * as dataService from '../services/dataService';

interface UserProfileModalProps {
    user: Collaborator;
    entidade?: Entidade;
    instituicao?: Instituicao;
    onClose: () => void;
    onUpdatePhoto: (url: string) => Promise<void>;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, entidade, instituicao, onClose, onUpdatePhoto }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [editData, setEditData] = useState({
        telemovel: user.telemovel || '',
        dateOfBirth: user.dateOfBirth || '',
        address_line: user.address_line || '',
        postal_code: user.postal_code || '',
        city: user.city || '',
        locality: user.locality || ''
    });

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) {
                alert("Imagem muito grande (Max 2MB)");
                return;
            }
            setIsUploading(true);
            try {
                const url = await dataService.uploadCollaboratorPhoto(user.id, file);
                await onUpdatePhoto(url);
            } catch (err: any) {
                alert("Erro ao carregar foto: " + err.message);
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            await dataService.updateCollaborator(user.id, editData);
            alert("Perfil atualizado com sucesso!");
            window.location.reload(); 
        } catch (e: any) {
            alert("Erro ao gravar perfil: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Lógica de resolução de nomes para a estrutura organizacional - Reforçada para o Pedido 1
    const displayInstituicao = useMemo(() => {
        if (instituicao?.name) return instituicao.name;
        if (user.role === 'SuperAdmin') return 'Acesso Global';
        return 'Não definida';
    }, [instituicao, user.role]);
    
    const displayEntidade = useMemo(() => {
        if (entidade?.name) return entidade.name;
        if (user.instituicaoId) return 'Diretamente à Instituição';
        if (user.role === 'SuperAdmin') return 'Acesso Global';
        return 'Sem departamento fixo';
    }, [entidade, user.instituicaoId, user.role]);

    return (
        <Modal title="O Meu Perfil" onClose={onClose} maxWidth="max-w-2xl">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Lado Esquerdo: Foto e Status RH */}
                <div className="flex flex-col items-center space-y-6 w-full md:w-1/3 border-r border-gray-700/50 pr-8">
                    <div className="relative group">
                        <div className="w-40 h-40 rounded-full border-4 border-brand-primary overflow-hidden bg-gray-800 flex items-center justify-center shadow-2xl">
                            {isUploading ? (
                                <FaSpinner className="animate-spin text-white text-2xl" />
                            ) : user.photoUrl ? (
                                <img src={user.photoUrl} alt={user.fullName} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-6xl font-bold text-gray-500">{user.fullName.charAt(0)}</span>
                            )}
                        </div>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-2 right-2 bg-brand-primary p-3 rounded-full text-white shadow-xl hover:bg-brand-secondary transition-all"
                            title="Mudar Foto"
                        >
                            <FaCamera size={20} />
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
                    </div>

                    <div className="text-center w-full">
                        <h2 className="text-xl font-bold text-white">{user.fullName}</h2>
                        <p className="text-brand-secondary font-medium">{user.role}</p>
                    </div>

                    <div className="w-full space-y-2 text-xs">
                        <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                            <span className="text-gray-500 uppercase font-bold block mb-1">Identificação RH</span>
                            <p className="flex justify-between"><span>Nº Mec:</span> <span className="text-white font-mono">{user.numeroMecanografico || '—'}</span></p>
                            <p className="flex justify-between mt-1"><span>Admissão:</span> <span className="text-white font-mono">{user.admissionDate ? new Date(user.admissionDate).toLocaleDateString() : '—'}</span></p>
                        </div>
                    </div>
                </div>

                {/* Lado Direito: Formulário Editável */}
                <div className="flex-1 space-y-4 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                    <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-4"><FaUserTie/> Dados Pessoais</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 uppercase mb-1">Email (Corporativo)</label>
                            <div className="flex items-center gap-2 bg-gray-900/50 p-2 rounded text-gray-400 text-sm border border-gray-700">
                                <FaEnvelope /> {user.email}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 uppercase mb-1">Telemóvel</label>
                            <input 
                                type="text" 
                                value={editData.telemovel} 
                                onChange={e => setEditData({...editData, telemovel: e.target.value})}
                                className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm text-white focus:border-brand-secondary"
                                placeholder="9xxxxxxxx"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 uppercase mb-1">Data Nascimento</label>
                            <input 
                                type="date" 
                                value={editData.dateOfBirth} 
                                onChange={e => setEditData({...editData, dateOfBirth: e.target.value})}
                                className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm text-white focus:border-brand-secondary"
                            />
                        </div>
                    </div>

                    <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2 mt-6 mb-4"><FaMapMarkerAlt/> Localização & Morada</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs text-gray-500 uppercase mb-1">Morada Residencial</label>
                            <input 
                                type="text" 
                                value={editData.address_line} 
                                onChange={e => setEditData({...editData, address_line: e.target.value})}
                                className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm text-white focus:border-brand-secondary"
                                placeholder="Rua, Número, Andar..."
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs text-gray-500 uppercase mb-1">Código Postal</label>
                                <input 
                                    type="text" 
                                    value={editData.postal_code} 
                                    onChange={e => setEditData({...editData, postal_code: e.target.value})}
                                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm text-white focus:border-brand-secondary"
                                    placeholder="0000-000"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs text-gray-500 uppercase mb-1">Cidade / Localidade</label>
                                <input 
                                    type="text" 
                                    value={editData.city} 
                                    onChange={e => setEditData({...editData, city: e.target.value})}
                                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm text-white focus:border-brand-secondary"
                                />
                            </div>
                        </div>
                    </div>

                    <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2 mt-6 mb-4"><FaBriefcase/> Estrutura Organizacional</h3>
                    <div className="bg-blue-900/10 rounded-xl p-4 border border-blue-500/20 space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                            <FaUserTie className="text-blue-400 w-4" />
                            <span className="text-gray-400">Instituição:</span>
                            <span className="text-white font-bold">{displayInstituicao}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <FaBuilding className="text-blue-400 w-4" />
                            <span className="text-gray-400">Entidade:</span>
                            <span className="text-white font-bold">{displayEntidade}</span>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button 
                            onClick={handleSaveProfile} 
                            disabled={isSaving}
                            className="w-full py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors flex items-center justify-center gap-2 font-bold shadow-xl disabled:opacity-50"
                        >
                            {isSaving ? <FaSpinner className="animate-spin" /> : <FaSave />} Gravar Alterações de Perfil
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default UserProfileModal;
