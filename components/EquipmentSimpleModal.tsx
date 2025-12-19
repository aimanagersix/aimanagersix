
import React, { useMemo } from 'react';
import Modal from './common/Modal';
import { Equipment, Assignment, Brand, EquipmentType } from '../types';
import { FaLaptop, FaMicrochip, FaMemory, FaNetworkWired, FaCalendarCheck, FaInfoCircle } from 'react-icons/fa';

interface EquipmentSimpleModalProps {
    equipment: Equipment;
    assignment?: Assignment;
    brand?: Brand;
    type?: EquipmentType;
    onClose: () => void;
}

const EquipmentSimpleModal: React.FC<EquipmentSimpleModalProps> = ({ equipment, assignment, brand, type, onClose }) => {
    return (
        <Modal title="Detalhes do Meu Equipamento" onClose={onClose} maxWidth="max-w-md">
            <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 py-4 bg-gray-900/30 rounded-xl border border-gray-700">
                    <div className="p-4 bg-brand-primary/20 rounded-full text-brand-secondary">
                        <FaLaptop size={48} />
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-white">{equipment.description}</h3>
                        <p className="text-sm text-gray-500 uppercase tracking-widest font-mono">S/N: {equipment.serialNumber}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 text-sm">
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex items-center gap-4">
                        <FaNetworkWired className="text-blue-400" size={20} />
                        <div>
                            <p className="text-gray-500 uppercase text-[10px] font-bold">Nome na Rede</p>
                            <p className="text-white font-mono">{equipment.nomeNaRede || 'Não configurado'}</p>
                        </div>
                    </div>

                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex items-center gap-4">
                        <FaInfoCircle className="text-indigo-400" size={20} />
                        <div>
                            <p className="text-gray-500 uppercase text-[10px] font-bold">Marca & Modelo</p>
                            <p className="text-white">{brand?.name || 'Genérico'} - {type?.name || 'Ativo'}</p>
                        </div>
                    </div>

                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex items-center gap-4">
                        <FaMicrochip className="text-purple-400" size={20} />
                        <div>
                            <p className="text-gray-500 uppercase text-[10px] font-bold">Processador</p>
                            <p className="text-white">{equipment.cpu_info || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex items-center gap-4">
                        <FaMemory className="text-green-400" size={20} />
                        <div>
                            <p className="text-gray-500 uppercase text-[10px] font-bold">Memória RAM</p>
                            <p className="text-white">{equipment.ram_size || 'N/A'}</p>
                        </div>
                    </div>

                    {assignment && (
                        <div className="bg-blue-900/10 p-4 rounded-lg border border-blue-500/20 flex items-center gap-4">
                            <FaCalendarCheck className="text-blue-400" size={20} />
                            <div>
                                <p className="text-blue-300 uppercase text-[10px] font-bold">Atribuído em</p>
                                <p className="text-white font-bold">{new Date(assignment.assignedDate).toLocaleDateString()}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-4 flex justify-end">
                    <button onClick={onClose} className="px-8 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-bold">
                        Fechar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default EquipmentSimpleModal;
