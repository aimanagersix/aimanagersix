import React, { useState, useEffect, useCallback } from 'react';
import Modal from './common/Modal';
import { Equipment, EquipmentType, Brand } from '../types';
import { DeleteIcon, PlusIcon } from './common/Icons';

type KitItem = Partial<Omit<Equipment, 'id' | 'status' | 'modifiedDate' | 'creationDate'>> & { key: number; typeName: string };

interface AddEquipmentKitModalProps {
    onClose: () => void;
    onSaveKit: (items: Array<Omit<Equipment, 'id' | 'modifiedDate' | 'status' | 'creationDate'>>) => void;
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
        purchaseDate: initialData?.purchaseDate || new Date().toISOString().split('T')[0],
        invoiceNumber: initialData?.invoiceNumber || '',
        warrantyEndDate: '',
    });
    const [items, setItems] = useState<KitItem[]>([]);
    const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});
    const [equipmentTypes, setEquipmentTypes] = useState(initialEquipmentTypes);
    const [newItemTypeId, setNewItemTypeId] = useState('');

    const getTypeName = useCallback((typeId: string | undefined) => {
        return equipmentTypes.find(t => t.id === typeId)?.name || 'Desconhecido';
    }, [equipmentTypes]);
    
    const buildKit = useCallback(async (primaryItemData: Partial<Equipment>) => {
        if (!primaryItemData.typeId) return;

        const primaryTypeName = getTypeName(primaryItemData.typeId).toLowerCase();
        const requiredPeripherals = primaryTypeName.includes('desktop') 
            ? KIT_CONFIG.desktop 
            : (primaryTypeName.includes('laptop') || primaryTypeName.includes('portátil')) 
                ? KIT_CONFIG.laptop 
                : [];
        
        const updatedTypes = [...equipmentTypes];
        let typesWereAdded = false;
        for (const name of requiredPeripherals) {
            if (!updatedTypes.some(t => t.name.toLowerCase() === name.toLowerCase())) {
                const newType = await onSaveEquipmentType({ name });
                updatedTypes.push(newType);
                typesWereAdded = true;
            }
        }
        if (typesWereAdded) {
            setEquipmentTypes(updatedTypes);
        }
        
        const isPrimaryDesktopOrLaptop = primaryTypeName.includes('desktop') || primaryTypeName.includes('laptop') || primaryTypeName.includes('portátil');
        let suggestedName = primaryItemData.nomeNaRede || '';
        if (isPrimaryDesktopOrLaptop && !suggestedName) {
            const cmbRegex = /^CMB(\d{5})$/i;
            let maxNumber = 0;
            equipment.forEach(eq => {
                if (eq.nomeNaRede) {
                    const match = eq.nomeNaRede.match(cmbRegex);
                    if (match && match[1]) {
                        const num = parseInt(match[1], 10);
                        if (num > maxNumber) {
                            maxNumber = num;
                        }
                    }
                }
            });
            const nextNumber = maxNumber + 1;
            suggestedName = `CMB${String(nextNumber).padStart(5, '0')}`;
        }


        const primaryItem: KitItem = {
            ...primaryItemData,
            nomeNaRede: suggestedName,
            key: Date.now(),
            typeName: getTypeName(primaryItemData.typeId)
        };
        
        const peripheralItems: KitItem[] = requiredPeripherals.map((typeName, index) => ({
            key: Date.now() + index + 1,
            typeName: typeName,
            brandId: '',
            typeId: updatedTypes.find(t => t.name.toLowerCase() === typeName.toLowerCase())?.id,
            description: '',
            serialNumber: '',
            inventoryNumber: '',
            nomeNaRede: '',
            macAddressWIFI: '',
            macAddressCabo: '',
        }));

        setItems([primaryItem, ...peripheralItems]);

    }, [getTypeName, equipmentTypes, onSaveEquipmentType, equipment]);

    useEffect(() => {
        if (initialData) {
            const runBuildKit = async () => {
                await buildKit(initialData);
            };
            runBuildKit();
        }
    }, [initialData, buildKit]);
    
    const handleCreateKitFromType = async (typeName: 'desktop' | 'laptop') => {
        let type = equipmentTypes.find(t => t.name.toLowerCase() === typeName);
        
        // Fallback for "portátil" if "laptop" is used
        if (!type && typeName === 'laptop') {
             type = equipmentTypes.find(t => t.name.toLowerCase() === 'portátil');
        }

        if (type) {
            const blankInitialData: Partial<Equipment> = {
                brandId: '',
                typeId: type.id,
                description: '',
                serialNumber: '',
                inventoryNumber: '',
                nomeNaRede: '',
                macAddressWIFI: '',
                macAddressCabo: '',
            };
            await buildKit(blankInitialData);
        } else {
            // This case should be rare if types are standard
            alert(`Tipo de equipamento "${typeName}" não encontrado. Por favor, crie este tipo primeiro.`);
        }
    };


    const handleCommonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCommonData(prev => ({ ...prev, [name]: value }));
    };

    const handleSetWarranty = (years: number) => {
        if (!commonData.purchaseDate) return;
        const purchase = new Date(commonData.purchaseDate);
        purchase.setUTCFullYear(purchase.getUTCFullYear() + years);
        const warrantyEnd = purchase.toISOString().split('T')[0];
        setCommonData(prev => ({ ...prev, warrantyEndDate: warrantyEnd }));
    };

    const handleItemChange = (key: number, field: keyof KitItem, value: string) => {
        setItems(prev => prev.map(item => {
             if (item.key === key) {
                const updatedItem = { ...item, [field]: value };
                // Auto-fill description for peripherals if empty
                if (field === 'brandId' && item.key !== items[0].key && !(item.description || '').trim()) {
                    const brandName = brands.find(b => b.id === value)?.name || '';
                    if (brandName) {
                        updatedItem.description = `${brandName} ${item.typeName}`;
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
            typeName: selectedType.name,
            typeId: selectedType.id,
            brandId: '',
            description: '',
            serialNumber: '',
            inventoryNumber: '',
            nomeNaRede: '',
            macAddressWIFI: '',
            macAddressCabo: '',
        };
    
        setItems(prev => [...prev, newItem]);
        setNewItemTypeId(''); // Reset dropdown
    };

    const validate = () => {
        const newErrors: Record<number, Record<string, string>> = {};
        let isValid = true;
        const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

        items.forEach(item => {
            const itemErrors: Record<string, string> = {};
            const itemType = equipmentTypes.find(t => t.id === item.typeId);

            if (!item.brandId) itemErrors.brandId = "Obrigatório";
            if (!item.serialNumber?.trim()) itemErrors.serialNumber = "Obrigatório";
            if (!item.description?.trim()) itemErrors.description = "Obrigatório";
            if (itemType?.requiresInventoryNumber && !item.inventoryNumber?.trim()) {
                itemErrors.inventoryNumber = "Obrigatório";
            }
            if (item.macAddressWIFI && !macRegex.test(item.macAddressWIFI)) {
                itemErrors.macAddressWIFI = "Formato inválido.";
            }
            if (item.macAddressCabo && !macRegex.test(item.macAddressCabo)) {
                itemErrors.macAddressCabo = "Formato inválido.";
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
            brandId: item.brandId!,
            typeId: item.typeId!,
            description: item.description!,
            serialNumber: item.serialNumber!,
            inventoryNumber: item.inventoryNumber || undefined,
            purchaseDate: commonData.purchaseDate,
            invoiceNumber: commonData.invoiceNumber || undefined,
            nomeNaRede: item.nomeNaRede || undefined,
            macAddressWIFI: item.macAddressWIFI || undefined,
            macAddressCabo: item.macAddressCabo || undefined,
            warrantyEndDate: commonData.warrantyEndDate || undefined,
        }));
        
        onSaveKit(itemsToSave);
        onClose();
    };
    
    if (!initialData && items.length === 0) {
        return (
            <Modal title="Criar Novo Posto de Trabalho" onClose={onClose}>
                <div className="text-center p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Selecione o tipo de equipamento principal para o kit:</h3>
                    <div className="flex justify-center gap-4">
                        <button
                            type="button"
                            onClick={() => handleCreateKitFromType('desktop')}
                            className="px-6 py-3 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors"
                        >
                            Desktop
                        </button>
                        <button
                            type="button"
                            onClick={() => handleCreateKitFromType('laptop')}
                            className="px-6 py-3 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors"
                        >
                            Laptop
                        </button>
                    </div>
                </div>
            </Modal>
        );
    }


    return (
        <Modal title="Criar Novo Posto de Trabalho" onClose={onClose} maxWidth="max-w-screen-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-gray-900/50 p-4 rounded-lg space-y-4">
                    <h3 className="text-lg font-semibold text-white">Informação Comum</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="purchaseDate" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Data de Compra</label>
                            <input type="date" name="purchaseDate" id="purchaseDate" value={commonData.purchaseDate} onChange={handleCommonChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" required />
                        </div>
                        <div>
                            <label htmlFor="invoiceNumber" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Número da Fatura (Opcional)</label>
                            <input type="text" name="invoiceNumber" id="invoiceNumber" value={commonData.invoiceNumber} onChange={handleCommonChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                        </div>
                        <div>
                            <label htmlFor="warrantyEndDate" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Fim da Garantia (Opcional)</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    name="warrantyEndDate"
                                    id="warrantyEndDate"
                                    value={commonData.warrantyEndDate}
                                    onChange={handleCommonChange}
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                                />
                                <button type="button" onClick={() => handleSetWarranty(2)} className="px-3 py-2 text-sm bg-gray-600 rounded-md hover:bg-gray-500 whitespace-nowrap">2 Anos</button>
                                <button type="button" onClick={() => handleSetWarranty(3)} className="px-3 py-2 text-sm bg-gray-600 rounded-md hover:bg-gray-500 whitespace-nowrap">3 Anos</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-white">Equipamentos do Kit</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm" style={{minWidth: '1200px'}}>
                            <thead className="text-left text-on-surface-dark-secondary">
                                <tr>
                                    <th className="p-2">Tipo</th>
                                    <th className="p-2">Marca</th>
                                    <th className="p-2">Descrição</th>
                                    <th className="p-2">Nº Série</th>
                                    <th className="p-2">Nº Inventário</th>
                                    <th className="p-2">Nome na Rede</th>
                                    <th className="p-2">MAC WIFI</th>
                                    <th className="p-2">MAC Cabo</th>
                                    <th className="p-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => {
                                    const itemType = equipmentTypes.find(t => t.id === item.typeId);
                                    return (
                                        <tr key={item.key} className={index === 0 ? "bg-brand-primary/10" : ""}>
                                            <td className="p-2 font-semibold text-on-surface-dark align-top pt-4">
                                                {item.typeName}
                                                {index === 0 && <span className="text-xs font-normal block text-brand-secondary">(Principal)</span>}
                                            </td>
                                            <td className="p-2"><select value={item.brandId} onChange={(e) => handleItemChange(item.key, 'brandId', e.target.value)} className={`w-full bg-gray-700 border text-white rounded-md p-2 text-xs ${errors[item.key]?.brandId ? 'border-red-500' : 'border-gray-600'}`}><option value="" disabled>Selecione</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></td>
                                            <td className="p-2"><input type="text" value={item.description} onChange={(e) => handleItemChange(item.key, 'description', e.target.value)} placeholder="Ex: Latitude 7420" className={`w-full bg-gray-700 border text-white rounded-md p-2 text-xs ${errors[item.key]?.description ? 'border-red-500' : 'border-gray-600'}`} /></td>
                                            <td className="p-2"><input type="text" value={item.serialNumber} onChange={(e) => handleItemChange(item.key, 'serialNumber', e.target.value)} placeholder="Número de série" className={`w-full bg-gray-700 border text-white rounded-md p-2 text-xs ${errors[item.key]?.serialNumber ? 'border-red-500' : 'border-gray-600'}`} /></td>
                                            <td className="p-2">
                                                {itemType?.requiresInventoryNumber && (
                                                    <input type="text" value={item.inventoryNumber} onChange={(e) => handleItemChange(item.key, 'inventoryNumber', e.target.value)} placeholder="Nº de inventário" className={`w-full bg-gray-700 border text-white rounded-md p-2 text-xs ${errors[item.key]?.inventoryNumber ? 'border-red-500' : 'border-gray-600'}`} />
                                                )}
                                            </td>
                                            <td className="p-2">
                                                {itemType?.requiresNomeNaRede && (
                                                    <input type="text" value={item.nomeNaRede} onChange={(e) => handleItemChange(item.key, 'nomeNaRede', e.target.value)} placeholder="Opcional" className={`w-full bg-gray-700 border text-white rounded-md p-2 text-xs border-gray-600`} />
                                                )}
                                            </td>
                                            <td className="p-2">
                                                {itemType?.requiresMacWIFI && (
                                                    <input type="text" value={item.macAddressWIFI} onChange={(e) => handleItemChange(item.key, 'macAddressWIFI', e.target.value)} placeholder="Opcional" className={`w-full bg-gray-700 border text-white rounded-md p-2 text-xs ${errors[item.key]?.macAddressWIFI ? 'border-red-500' : 'border-gray-600'}`} />
                                                )}
                                            </td>
                                            <td className="p-2">
                                                {itemType?.requiresMacCabo && (
                                                    <input type="text" value={item.macAddressCabo} onChange={(e) => handleItemChange(item.key, 'macAddressCabo', e.target.value)} placeholder="Opcional" className={`w-full bg-gray-700 border text-white rounded-md p-2 text-xs ${errors[item.key]?.macAddressCabo ? 'border-red-500' : 'border-gray-600'}`} />
                                                )}
                                            </td>
                                            <td className="p-2 text-center align-middle">
                                                {index > 0 && (
                                                    <button type="button" onClick={() => handleRemoveItem(item.key)} className="text-red-400 hover:text-red-300" title="Remover item do kit">
                                                        <DeleteIcon className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="border-t border-gray-700 pt-4 mt-4">
                    <h3 className="text-lg font-semibold text-white mb-2">Adicionar Outro Equipamento</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-2">
                            <label htmlFor="newItemType" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Tipo de Equipamento</label>
                            <select
                                id="newItemType"
                                value={newItemTypeId}
                                onChange={(e) => setNewItemTypeId(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                            >
                                <option value="">Selecione para adicionar...</option>
                                {equipmentTypes.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                disabled={!newItemTypeId}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 disabled:opacity-50"
                            >
                                <PlusIcon className="h-5 w-5" />
                                Adicionar ao Kit
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">Adicionar Kit ({items.length} Itens)</button>
                </div>
            </form>
        </Modal>
    );
};

export default AddEquipmentKitModal;