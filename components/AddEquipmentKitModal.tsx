
import React, { useState, useEffect, useCallback } from 'react';
import Modal from './common/Modal';
import { Equipment, EquipmentType, Brand } from '../types';
import { FaTrash as DeleteIcon, PlusIcon } from './common/Icons';

// Tipagem normalizada para snake_case
type KitItem = Partial<Omit<Equipment, 'id' | 'status' | 'modified_date' | 'creation_date'>> & { key: number; type_name: string };

interface AddEquipmentKitModalProps {
    onClose: () => void;
    onSaveKit: (items: Array<Omit<Equipment, 'id' | 'modified_date' | 'status' | 'creation_date'>>) => void;
    brands: Brand[];
    equipmentTypes: EquipmentType[];
    initialData?: Partial<Equipment> | null;
    onSaveEquipmentType: (type: Omit<EquipmentType, 'id'>) => Promise<EquipmentType>;
    equipment: Equipment[];
}

const KIT_CONFIG = {
    desktop: ['Monitor', 'Teclado', 'Rato'],
    laptop: ['Monitor', 'Docking Station', 'Teclado', 'Rato'],
};

const AddEquipmentKitModal: React.FC<AddEquipmentKitModalProps> = ({ onClose, onSaveKit, brands, equipmentTypes: initialEquipmentTypes, initialData, onSaveEquipmentType, equipment }) => {
    
    const [commonData, setCommonData] = useState({
        purchase_date: initialData?.purchase_date || new Date().toISOString().split('T')[0],
        invoice_number: initialData?.invoice_number || '',
        warranty_end_date: '',
    });
    
    const [items, setItems] = useState<KitItem[]>([]);
    const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});
    const [equipmentTypes, setEquipmentTypes] = useState(initialEquipmentTypes);
    const [newItemTypeId, setNewItemTypeId] = useState('');

    const getTypeName = useCallback((typeId: string | undefined) => {
        return equipmentTypes.find(t => t.id === typeId)?.name || 'Desconhecido';
    }, [equipmentTypes]);
    
    const buildKit = useCallback(async (primaryItemData: Partial<Equipment>) => {
        if (!primaryItemData.type_id) return;

        const primaryTypeName = getTypeName(primaryItemData.type_id).toLowerCase();
        const requiredPeripherals = primaryTypeName.includes('desktop') 
            ? KIT_CONFIG.desktop 
            : (primaryTypeName.includes('laptop') || primaryTypeName.includes('portátil')) 
                ? KIT_CONFIG.laptop 
                : [];
        
        const updatedTypes = [...equipmentTypes];
        let typesWereAdded = false;
        for (const name of requiredPeripherals) {
            if (!updatedTypes.some(t => t.name.toLowerCase() === name.toLowerCase())) {
                const newType = await onSaveEquipmentType({ 
                    name,
                    requires_nome_na_rede: false,
                    requires_mac_wifi: false,
                    requires_mac_cabo: false,
                    requires_inventory_number: false,
                    requires_backup_test: false,
                    requires_location: false,
                    is_maintenance: false,
                    requires_wwan_address: false,
                    requires_bluetooth_address: false,
                    requires_usb_thunderbolt_address: false,
                    requires_ram_size: false,
                    requires_disk_info: false,
                    requires_cpu_info: false,
                    requires_manufacture_date: false,
                    requires_ip: false
                });
                updatedTypes.push(newType);
                typesWereAdded = true;
            }
        }
        if (typesWereAdded) {
            setEquipmentTypes(updatedTypes);
        }
        
        const isPrimaryDesktopOrLaptop = primaryTypeName.includes('desktop') || primaryTypeName.includes('laptop') || primaryTypeName.includes('portátil');
        let suggestedName = primaryItemData.nome_na_rede || '';
        
        if (isPrimaryDesktopOrLaptop && !suggestedName) {
            const cmbRegex = /^CMB(\d{5})$/i;
            let maxNumber = 0;
            equipment.forEach(eq => {
                if (eq.nome_na_rede) {
                    const match = eq.nome_na_rede.match(cmbRegex);
                    if (match && match[1]) {
                        const num = parseInt(match[1], 10);
                        if (num > maxNumber) maxNumber = num;
                    }
                }
            });
            suggestedName = `CMB${String(maxNumber + 1).padStart(5, '0')}`;
        }

        const primaryItem: KitItem = {
            ...primaryItemData,
            nome_na_rede: suggestedName,
            key: Date.now(),
            type_name: getTypeName(primaryItemData.type_id)
        };
        
        const peripheralItems: KitItem[] = requiredPeripherals.map((typeName, index) => ({
            key: Date.now() + index + 1,
            type_name: typeName,
            brand_id: '',
            type_id: updatedTypes.find(t => t.name.toLowerCase() === typeName.toLowerCase())?.id,
            description: '',
            serial_number: '',
            inventory_number: '',
            nome_na_rede: '',
            mac_address_wifi: '',
            mac_address_cabo: '',
        }));

        setItems([primaryItem, ...peripheralItems]);

    }, [getTypeName, equipmentTypes, onSaveEquipmentType, equipment]);

    useEffect(() => {
        if (initialData) {
            buildKit(initialData);
        }
    }, [initialData, buildKit]);
    
    const handleItemChange = (key: number, field: keyof KitItem, value: string) => {
        setItems(prev => prev.map(item => {
             if (item.key === key) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'brand_id' && item.key !== items[0].key && !(item.description || '').trim()) {
                    const brandName = brands.find(b => b.id === value)?.name || '';
                    if (brandName) {
                        updatedItem.description = `${brandName} ${item.type_name}`;
                    }
                }
                return updatedItem;
            }
            return item;
        }));
    };
    
    const handleRemoveItem = (key: number) => {
        setItems(prev => prev.filter(item => item.key !== key));
    };

    const handleAddItem = () => {
        if (!newItemTypeId) return;
        const selectedType = equipmentTypes.find(t => t.id === newItemTypeId);
        if (!selectedType) return;
    
        const newItem: KitItem = {
            key: Date.now(),
            type_name: selectedType.name,
            type_id: selectedType.id,
            brand_id: '',
            description: '',
            serial_number: '',
            inventory_number: '',
            nome_na_rede: '',
            mac_address_wifi: '',
            mac_address_cabo: '',
        };
        setItems(prev => [...prev, newItem]);
        setNewItemTypeId(''); 
    };

    const validate = () => {
        const newErrors: Record<number, Record<string, string>> = {};
        let isValid = true;
        const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

        items.forEach(item => {
            const itemErrors: Record<string, string> = {};
            const itemType = equipmentTypes.find(t => t.id === item.type_id);

            if (!item.brand_id) itemErrors.brand_id = "Obrigatório";
            if (!item.serial_number?.trim()) itemErrors.serial_number = "Obrigatório";
            if (!item.description?.trim()) itemErrors.description = "Obrigatório";
            if (itemType?.requires_inventory_number && !item.inventory_number?.trim()) {
                itemErrors.inventory_number = "Obrigatório";
            }
            if (item.mac_address_wifi && !macRegex.test(item.mac_address_wifi)) {
                itemErrors.mac_address_wifi = "Formato inválido.";
            }

            if (Object.keys(itemErrors).length > 0) {
                newErrors[item.key] = itemErrors;
                isValid = false;
            }
        });
        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const itemsToSave = items.map(item => ({
            brand_id: item.brand_id!,
            type_id: item.type_id!,
            description: item.description!,
            serial_number: item.serial_number!,
            inventory_number: item.inventory_number || undefined,
            purchase_date: commonData.purchase_date,
            invoice_number: commonData.invoice_number || undefined,
            nome_na_rede: item.nome_na_rede || undefined,
            mac_address_wifi: item.mac_address_wifi || undefined,
            mac_address_cabo: item.mac_address_cabo || undefined,
            warranty_end_date: commonData.warranty_end_date || undefined,
            is_loan: item.is_loan || false,
        }));
        
        onSaveKit(itemsToSave);
        onClose();
    };

    return (
        <Modal title="Configurador de Posto de Trabalho (Kit)" onClose={onClose} maxWidth="max-w-screen-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-gray-900/50 p-4 rounded-lg space-y-4 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white">Dados da Compra (Comum)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1 uppercase text-[10px] font-bold">Data de Compra</label>
                            <input type="date" value={commonData.purchase_date} onChange={e => setCommonData({...commonData, purchase_date: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" required />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1 uppercase text-[10px] font-bold">Nº Fatura</label>
                            <input type="text" value={commonData.invoice_number} onChange={e => setCommonData({...commonData, invoice_number: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1 uppercase text-[10px] font-bold">Fim Garantia</label>
                            <input type="date" value={commonData.warranty_end_date} onChange={e => setCommonData({...commonData, warranty_end_date: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                        </div>
                    </div>
                </div>

                <div className="space-y-2 overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm min-w-[1000px]">
                        <thead className="text-left text-gray-500 uppercase text-[10px] font-bold">
                            <tr>
                                <th className="p-2">Tipo</th>
                                <th className="p-2">Marca *</th>
                                <th className="p-2">Descrição *</th>
                                <th className="p-2">Nº Série *</th>
                                <th className="p-2">Inventário</th>
                                <th className="p-2">Rede</th>
                                <th className="p-2">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {items.map((item, idx) => (
                                <tr key={item.key} className={idx === 0 ? "bg-brand-primary/5" : ""}>
                                    <td className="p-2 text-white font-bold">{item.type_name}</td>
                                    <td className="p-2">
                                        <select value={item.brand_id} onChange={e => handleItemChange(item.key, 'brand_id', e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-1 text-xs">
                                            <option value="">--</option>
                                            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-2"><input type="text" value={item.description} onChange={e => handleItemChange(item.key, 'description', e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-1 text-xs" /></td>
                                    <td className="p-2"><input type="text" value={item.serial_number} onChange={e => handleItemChange(item.key, 'serial_number', e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-1 text-xs font-mono" /></td>
                                    <td className="p-2"><input type="text" value={item.inventory_number} onChange={e => handleItemChange(item.key, 'inventory_number', e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-1 text-xs" /></td>
                                    <td className="p-2"><input type="text" value={item.nome_na_rede} onChange={e => handleItemChange(item.key, 'nome_na_rede', e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-1 text-xs font-mono" /></td>
                                    <td className="p-2 text-center">
                                        {idx > 0 && <button type="button" onClick={() => handleRemoveItem(item.key)} className="text-red-400 hover:text-red-300"><DeleteIcon /></button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                    <div className="flex gap-2 items-center">
                         <select value={newItemTypeId} onChange={e => setNewItemTypeId(e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm">
                            <option value="">+ Adicionar outro...</option>
                            {equipmentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <button type="button" onClick={handleAddItem} disabled={!newItemTypeId} className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50"><PlusIcon /></button>
                    </div>
                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500">Cancelar</button>
                        <button type="submit" className="px-6 py-2 bg-brand-primary text-white rounded font-bold hover:bg-brand-secondary shadow-lg">Gravar Kit ({items.length} itens)</button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default AddEquipmentKitModal;
