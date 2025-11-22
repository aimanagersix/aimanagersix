
import React from 'react';
import Modal from './common/Modal';
import { Entidade, Instituicao, Collaborator } from '../types';
import { OfficeBuildingIcon, FaPhone, FaEnvelope, FaUserTag, FaMapMarkerAlt } from './common/Icons';

interface EntidadeDetailModalProps {
    entidade: Entidade;
    instituicao?: Instituicao;
    collaborators: Collaborator[];
    onClose: () => void;
    onEdit: () => void;
}

const EntidadeDetailModal: React.FC<EntidadeDetailModalProps> = ({ entidade, instituicao, collaborators, onClose, onEdit }) => {
    const activeCollaborators = collaborators.filter(c => c.entidadeId === entidade.id);

    return (
        <Modal title={`Detalhes: ${entidade.name}`} onClose={onClose} maxWidth="max-w-3xl">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <div className="p-3 bg-brand-primary/20 rounded-full text-brand-secondary">
                        <OfficeBuildingIcon className="h-8 w-8" />
                    </div>
                    <div className="flex-grow">
                        <h2 className="text-xl font-bold text-white">{entidade.name}</h2>
                        <p className="text-sm text-on-surface-dark-secondary">Código: <span className="font-mono text-white">{entidade.codigo}</span></p>
                        <p className="text-sm text-brand-secondary mt-1">{instituicao?.name || 'Instituição não definida'}</p>
                    </div>
                    <button 
                        onClick={() => { onClose(); onEdit(); }} 
                        className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors"
                    >
                        Editar Dados
                    </button>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-gray-700 pb-2">Contactos</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-300">
                                <FaUserTag className="text-gray-500" />
                                <span className="text-gray-500 w-24">Responsável:</span>
                                <span>{entidade.responsavel || '—'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                                <FaEnvelope className="text-gray-500" />
                                <span className="text-gray-500 w-24">Email:</span>
                                <a href={`mailto:${entidade.email}`} className="hover:text-brand-secondary transition-colors">{entidade.email}</a>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                                <FaPhone className="text-gray-500" />
                                <span className="text-gray-500 w-24">Telefone:</span>
                                <span>{entidade.telefone || '—'}</span>
                            </div>
                             <div className="flex items-center gap-2 text-gray-300">
                                <span className="text-gray-500 w-8"></span>
                                <span className="text-gray-500 w-24">Telemóvel:</span>
                                <span>{entidade.telemovel || '—'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-gray-700 pb-2">Localização</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2 text-gray-300">
                                <FaMapMarkerAlt className="text-gray-500 mt-1" />
                                <div>
                                    <p>{entidade.address_line || 'Endereço não definido'}</p>
                                    <p>{entidade.postal_code} {entidade.locality}</p>
                                    <p>{entidade.city}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-surface-dark p-4 rounded border border-gray-700 text-center">
                        <span className="block text-2xl font-bold text-white">{activeCollaborators.length}</span>
                        <span className="text-xs text-gray-500 uppercase">Colaboradores Ativos</span>
                    </div>
                    <div className="bg-surface-dark p-4 rounded border border-gray-700 text-center">
                        <span className={`block text-sm font-bold mt-2 ${entidade.status === 'Ativo' ? 'text-green-400' : 'text-red-400'}`}>
                            {entidade.status}
                        </span>
                        <span className="text-xs text-gray-500 uppercase">Estado</span>
                    </div>
                </div>

                {/* Description */}
                {entidade.description && (
                    <div className="bg-gray-900/30 p-4 rounded border border-gray-700">
                        <h3 className="text-xs font-bold text-gray-500 mb-1">OBSERVAÇÕES</h3>
                        <p className="text-sm text-gray-300">{entidade.description}</p>
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                        Fechar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default EntidadeDetailModal;
