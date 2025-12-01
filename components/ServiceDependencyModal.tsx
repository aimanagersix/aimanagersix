
import React, { useState, useMemo } from 'react';
import Modal from './common/Modal';
import { BusinessService, Equipment, SoftwareLicense, ServiceDependency } from '../types';
// FIX: Replaced non-existent DeleteIcon with an alias for FaTrash
import { FaTrash as DeleteIcon, PlusIcon, FaLaptop, FaKey } from './common/Icons';

interface ServiceDependencyModalProps {
    onClose: () => void;
    service: BusinessService;
    dependencies: ServiceDependency[];
    allEquipment: Equipment[];
    allLicenses: SoftwareLicense[];
    onAddDependency: (dep: Omit<ServiceDependency, 'id'>) => void;
    onRemoveDependency: (id: string) => void;
}

const ServiceDependencyModal: React.FC<ServiceDependencyModalProps> = ({ onClose, service, dependencies, allEquipment, allLicenses, onAddDependency, onRemoveDependency }) => {
    
    const [type, setType] = useState<'equipment' | 'license'>('equipment');
    const [selectedItemId, setSelectedItemId] = useState('');
    const [dependencyType, setDependencyType] = useState('');
    const [notes, setNotes] = useState('');

    // Calculate available items (exclude those already linked)
    const linkedEquipmentIds = new Set(dependencies.filter(d => d.equipment_id).map(d => d.equipment_id));
    const linkedLicenseIds = new Set(dependencies.filter(d => d.software_license_id).map(d => d.software_license_id));

    const availableItems = useMemo(() => {
        if (type === 'equipment') {
            return allEquipment
                .filter(e => !linkedEquipmentIds.has(e.id))
                .sort((a,b) => a.description.localeCompare(b.description));
        } else {
            return allLicenses
                .filter(l => !linkedLicenseIds.has(l.id))
                .sort((a,b) => a.productName.localeCompare(b.productName));
        }
    }, [type, allEquipment, allLicenses, linkedEquipmentIds, linkedLicenseIds]);

    const handleAdd = () => {
        if (!selectedItemId) return;

        const newDep: Omit<ServiceDependency, 'id'> = {
            service_id: service.id,
            dependency_type: dependencyType || undefined,
            notes: notes || undefined,
            equipment_id: type === 'equipment' ? selectedItemId : undefined,
            software_license_id: type === 'license' ? selectedItemId : undefined
        };

        onAddDependency(newDep);
        // Reset form
        setSelectedItemId('');
        setDependencyType('');
        setNotes('');
    };

    return (
        <Modal title={`Mapeamento de Ativos: ${service.name}`} onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-6">
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 text-sm text-gray-300">
                    <p>Associe os ativos (Equipamentos ou Licenças) que suportam este serviço de negócio. Isto permite calcular o impacto em caso de falha.</p>
                </div>

                <div className="border-b border-gray-700 pb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Adicionar Dependência</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                             <label className="block text-sm text-gray-400 mb-1">Tipo de Ativo</label>
                             <select value={type} onChange={(e) => { setType(e.target.value as any); setSelectedItemId(''); }} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                 <option value="equipment">Equipamento Físico</option>
                                 <option value="license">Licença de Software</option>
                             </select>
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-sm text-gray-400 mb-1">Selecionar Ativo</label>
                             <select value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                 <option value="">Selecione...</option>
                                 {availableItems.map(item => (
                                     <option key={item.id} value={item.id}>
                                         {type === 'equipment' 
                                            ? `${(item as Equipment).description} (S/N: ${(item as Equipment).serialNumber})` 
                                            : `${(item as SoftwareLicense).productName} (${(item as SoftwareLicense).licenseKey})`
                                         }
                                     </option>
                                 ))}
                             </select>
                        </div>
                         <div>
                             <label className="block text-sm text-gray-400 mb-1">Função (Ex: BD)</label>
                             <input type="text" value={dependencyType} onChange={(e) => setDependencyType(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" placeholder="Opcional"/>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button onClick={handleAdd} disabled={!selectedItemId} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed">
                            <PlusIcon /> Adicionar
                        </button>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Dependências Atuais</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                        {dependencies.length > 0 ? dependencies.map(dep => {
                            const eq = dep.equipment_id ? allEquipment.find(e => e.id === dep.equipment_id) : null;
                            const lic = dep.software_license_id ? allLicenses.find(l => l.id === dep.software_license_id) : null;

                            if (!eq && !lic) return null;

                            return (
                                <div key={dep.id} className="flex items-center justify-between p-3 bg-surface-dark rounded-lg border border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-800 rounded-full text-brand-secondary">
                                            {eq ? <FaLaptop /> : <FaKey />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">
                                                {eq ? eq.description : lic?.productName}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {eq ? `S/N: ${eq.serialNumber}` : `Key: ${lic?.licenseKey}`}
                                                {dep.dependency_type && <span className="ml-2 px-2 py-0.5 bg-gray-600 rounded-full text-white">{dep.dependency_type}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => onRemoveDependency(dep.id)} className="text-red-400 hover:text-red-300 p-2">
                                        <DeleteIcon />
                                    </button>
                                </div>
                            );
                        }) : (
                            <p className="text-center text-gray-500 py-4">Este serviço não tem dependências registadas.</p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default ServiceDependencyModal;
