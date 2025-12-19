
import React, { useRef, useState } from 'react';
import Modal from './common/Modal';
import { Collaborator, Entidade, Instituicao } from '../types';
import { FaCamera, FaTrash, FaBuilding, FaUserTie, FaEnvelope, FaIdCard, FaSpinner } from 'react-icons/fa';
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
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    return (
        <Modal title="O Meu Perfil" onClose={onClose} maxWidth="max-w-md">
            <div className="flex flex-col items-center space-y-6">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full border-4 border-brand-primary overflow-hidden bg-gray-800 flex items-center justify-center">
                        {isUploading ? (
                            <FaSpinner className="animate-spin text-white text-2xl" />
                        ) : user.photoUrl ? (
                            <img src={user.photoUrl} alt={user.fullName} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-4xl font-bold text-gray-500">{user.fullName.charAt(0)}</span>
                        )}
                    </div>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 bg-brand-primary p-2.5 rounded-full text-white shadow-xl hover:bg-brand-secondary transition-all"
                        title="Mudar Foto"
                    >
                        <FaCamera size={16} />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
                </div>

                <div className="w-full space-y-4">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-white">{user.fullName}</h2>
                        <p className="text-brand-secondary font-medium">{user.role}</p>
                    </div>

                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700 space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                            <FaEnvelope className="text-gray-500 w-4" />
                            <span className="text-gray-300">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <FaIdCard className="text-gray-500 w-4" />
                            <span className="text-gray-400">Nº Mec:</span>
                            <span className="text-white font-mono">{user.numeroMecanografico || '—'}</span>
                        </div>
                    </div>

                    <div className="bg-blue-900/10 rounded-xl p-4 border border-blue-500/20 space-y-3">
                        <h4 className="text-xs font-bold text-blue-300 uppercase tracking-widest">Associação</h4>
                        <div className="flex items-center gap-3 text-sm">
                            <FaUserTie className="text-blue-400 w-4" />
                            <span className="text-gray-300">{instituicao?.name || 'Acesso Global'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <FaBuilding className="text-blue-400 w-4" />
                            <span className="text-gray-300">{entidade?.name || 'Sem departamento fixo'}</span>
                        </div>
                    </div>
                </div>

                <button onClick={onClose} className="w-full py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">Fechar</button>
            </div>
        </Modal>
    );
};

export default UserProfileModal;
