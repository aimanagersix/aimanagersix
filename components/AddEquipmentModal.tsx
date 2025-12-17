import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Modal from './common/Modal';
import { Equipment, EquipmentType, Brand, CriticalityLevel, CIARating, Supplier, Entidade, Collaborator, ConfigItem, EquipmentStatus, SoftwareLicense, LicenseAssignment } from '../types';
import { isAiConfigured } from '../services/geminiService';
import { CameraIcon, SpinnerIcon } from './common/Icons';
import { FaSave, FaMicrochip, FaMemory, FaHdd, FaShieldAlt, FaEuroSign, FaLandmark, FaBroom, FaLaptopCode, FaMapMarkerAlt } from 'react-icons/fa';

interface AddEquipmentModalProps {
    onClose: () => void;
    onSave: (equipment: Partial<Equipment>, assignment?: any, licenseIds?: string[]) => Promise<any>;
    brands: Brand[];
    equipmentTypes: EquipmentType[];
    equipmentToEdit?: Equipment | null;
    onSaveBrand: (brand: Omit<Brand, 'id'>) => Promise<Brand>;
    onSaveEquipmentType: (type: Omit<EquipmentType, 'id'>) => Promise<EquipmentType>;
    onOpenKitModal: (initialData: Partial<Equipment>) => void;
    suppliers?: Supplier[];
    entidades?: Entidade[];
    collaborators?: Collaborator[];
    statusOptions?: ConfigItem[];
    accountingCategories?: ConfigItem[];
    conservationStates?: ConfigItem[];
    decommissionReasons?: ConfigItem[];
    cpuOptions?: ConfigItem[];
    ramOptions?: ConfigItem[];
    storageOptions?: ConfigItem[];
    initialData?: Partial<Equipment> | null;
    softwareLicenses?: SoftwareLicense[];
    licenseAssignments?: LicenseAssignment[];
    onOpenHistory?: (equipment: Equipment) => void;
    onManageLicenses?: (equipment: Equipment) => void;
    onOpenAssign?: (equipment: Equipment) => void;
}

const AddEquipmentModal: React.FC<AddEquipmentModalProps> = ({ 
    onClose, onSave, brands, equipmentTypes, equipmentToEdit, suppliers = [], statusOptions = [], 
    accountingCategories = [], conservationStates = [], decommissionReasons = [],
    cpuOptions = [], ramOptions = [], storageOptions = [], initialData
}) => {
    
    const [activeTab, setActiveTab] = useState<'general' | 'hardware' | 'security' | 'financial' | 'legal'>('general');
    const [formData, setFormData] = useState<Partial<Equipment>>({
        brandId: '', typeId: '', description: '', serialNumber: '', inventoryNumber: '', nomeNaRede: '', 
        macAddressWIFI: '', macAddressCabo: '', purchaseDate: '', warrantyEndDate: '', 
        invoiceNumber: '', requisitionNumber: '', status: EquipmentStatus.Stock,
        criticality: CriticalityLevel.Low, confidentiality: CIARating.Low, integrity: CIARating.Low, availability: CIARating.Low,
        supplier_id: '', acquisitionCost: 0, os_version: '', cpu_info: '', ram_size: '', disk_info: '',
        ip_address: '', last_security_update: '', manufacture_date: '', accounting_category_id: '',
        conservation_state_id: '', decommission_reason_id: '', residual_value: 0,
        installationLocation: '', wwan_address: '', bluetooth_address: '', usb_thunderbolt_address: ''
    });
    
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    
    const isEditMode = !!(equipmentToEdit && equipmentToEdit.id);

    const selectedType = useMemo(() => {
        return equipmentTypes.find(t => t.id === formData.typeId);
    }, [formData.typeId, equipmentTypes]);

    useEffect(() => {
        if (equipmentToEdit) {
            setFormData({
                ...equipmentToEdit,
                purchaseDate: equipmentToEdit.purchaseDate || '',
                warrantyEndDate: equipmentToEdit.warrantyEndDate || '',
                last_security_update: equipmentToEdit.last_security_update || '',
                manufacture_date: equipmentToEdit.manufacture_date || '',
            });
        } else if (initialData) {
             setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [equipmentToEdit, initialData]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.serialNumber?.trim()) newErrors.serialNumber = "Nº Série obrigatório.";
        if (!formData.brandId) newErrors.brandId = "Marca obrigatória.";
        if (!formData.typeId) newErrors.typeId = "Tipo obrigatório.";
        if (!formData.description?.trim()) newErrors.description = "Descrição obrigatória.";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
    };

    const handleSaveLocal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSaving(true);
        try {
            const dataToSubmit = { ...formData };
            const uuidFields = ['brandId', 'typeId', 'supplier_id', 'accounting_category_id', 'conservation_state_id', 'decommission_reason_id'];
            uuidFields.forEach(f => {
                if (dataToSubmit[f as keyof Equipment] === '') (dataToSubmit as any)[f] = null;
            });
            
            await onSave(dataToSubmit);
            onClose();
        } catch (error: any) {
            alert(`Erro ao gravar: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const getTabClass = (tab: string) => `px-4 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === tab ? 'border-brand-secondary text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`;

    return (
        <Modal title={isEditMode ? "Editar Equipamento" : "Novo Equipamento"} onClose={onClose} maxWidth="max-w-5xl">
            <div className="flex border-b border-gray-700 mb-6 bg-gray-900/50 rounded-t-lg overflow-x-auto no-scrollbar">
                <button type="button" onClick={() => setActiveTab('general')} className={getTabClass('general')}>Geral</button>
                <button type="button" onClick={() => setActiveTab('hardware')} className={getTabClass('hardware')}>Hardware</button>
                <button type="button" onClick={() => setActiveTab('security')} className={getTabClass('security')}>Segurança & SO</button>
                <button type="button" onClick={() => setActiveTab('financial')} className={getTabClass('financial')}>Financeiro</button>
                <button type="button" onClick={() => setActiveTab('legal')} className={getTabClass('legal')}>Legal & Saída</button>
            </div>

            <form onSubmit={handleSaveLocal} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar pb-4">
                
                {activeTab === 'general' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Número de Série *</label>
                                <input type="text" name="serialNumber" value={formData.serialNumber} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 focus:ring-brand-secondary ${errors.serialNumber ? 'border-red-500' : 'border-gray-600'}`} required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Descrição Comercial *</label>
                                <input type="text" name="description" value={formData.description} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.description ? 'border-red-500' : 'border-gray-600'}`} placeholder="Ex: Dell Latitude 5420 i7 16GB" required />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Marca *</label>
                                <select name="brandId" value={formData.brandId} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                    <option value="">-- Selecione --</option>
                                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tipo de Ativo *</label>
                                <select name="typeId" value={formData.typeId} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                    <option value="">-- Selecione --</option>
                                    {equipmentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Estado</label>
                                <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                    {statusOptions.length > 0 ? statusOptions.map(o => <option key={o.id} value={o.name}>{o.name}</option>) : Object.values(EquipmentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedType?.requiresNomeNaRede && <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome na Rede (Hostname)</label><input type="text" name="nomeNaRede" value={formData.nomeNaRede} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" placeholder="Ex: PC-DIR-01" /></div>}
                            {selectedType?.requiresInventoryNumber && <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nº Inventário Organizacional</label><input type="text" name="inventoryNumber" value={formData.inventoryNumber} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" /></div>}
                        </div>
                         {selectedType?.requiresLocation && <div className="mt-4"><label className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><FaMapMarkerAlt/> Localização da Instalação</label><input type="text" name="installationLocation" value={formData.installationLocation} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" placeholder="Ex: Sala 101, Piso 2..." /></div>}
                    </div>
                )}

                {activeTab === 'hardware' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {selectedType?.requires_cpu_info && <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><FaMicrochip/> Processador (CPU)</label><select name="cpu_info" value={formData.cpu_info} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"><option value="">-- Selecione --</option>{cpuOptions.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}</select></div>}
                            {selectedType?.requires_ram_size && <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><FaMemory/> Memória RAM</label><select name="ram_size" value={formData.ram_size} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"><option value="">-- Selecione --</option>{ramOptions.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}</select></div>}
                            {selectedType?.requires_disk_info && <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><FaHdd/> Disco / Armazenamento</label><select name="disk_info" value={formData.disk_info} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"><option value="">-- Selecione --</option>{storageOptions.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}</select></div>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {selectedType?.requires_ip && <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Endereço IP</label><input type="text" name="ip_address" value={formData.ip_address} onChange={handleChange} placeholder="0.0.0.0" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 font-mono text-sm" /></div>}
                            {selectedType?.requiresMacWIFI && <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">MAC WIFI</label><input type="text" name="macAddressWIFI" value={formData.macAddressWIFI} onChange={handleChange} placeholder="00:00:00:00:00:00" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 font-mono text-sm" /></div>}
                            {selectedType?.requiresMacCabo && <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">MAC Cabo (Ethernet)</label><input type="text" name="macAddressCabo" value={formData.macAddressCabo} onChange={handleChange} placeholder="00:00:00:00:00:00" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 font-mono text-sm" /></div>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-gray-700/50">
                            {selectedType?.requires_wwan_address && <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Endereço WWAN</label><input type="text" name="wwan_address" value={formData.wwan_address} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 font-mono text-sm" /></div>}
                            {selectedType?.requires_bluetooth_address && <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Endereço Bluetooth</label><input type="text" name="bluetooth_address" value={formData.bluetooth_address} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 font-mono text-sm" /></div>}
                            {selectedType?.requires_usb_thunderbolt_address && <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Endereço USB/Thunderbolt</label><input type="text" name="usb_thunderbolt_address" value={formData.usb_thunderbolt_address} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 font-mono text-sm" /></div>}
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><FaLaptopCode/> Sistema Operativo</label>
                                <input type="text" name="os_version" value={formData.os_version} onChange={handleChange} placeholder="Windows 11 Pro 23H2..." className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><FaShieldAlt/> Último Patch de Segurança</label>
                                <input type="date" name="last_security_update" value={formData.last_security_update} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Criticidade (BIA organizativo)</label>
                                <select name="criticality" value={formData.criticality} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                    {Object.values(CriticalityLevel).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            {selectedType?.requires_manufacture_date && <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Data de Fabrico</label><input type="date" name="manufacture_date" value={formData.manufacture_date} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" /></div>}
                        </div>
                    </div>
                )}

                {activeTab === 'financial' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Fornecedor</label>
                                <select name="supplier_id" value={formData.supplier_id} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                    <option value="">-- Selecione Fornecedor --</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><FaEuroSign/> Custo de Aquisição (€)</label>
                                <input type="number" name="acquisitionCost" value={formData.acquisitionCost} onChange={handleChange} step="0.01" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nº Fatura</label>
                                <input type="text" name="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nº Requisição / Encomenda</label>
                                <input type="text" name="requisitionNumber" value={formData.requisitionNumber} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Data de Aquisição</label>
                                <input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Fim da Garantia</label>
                                <input type="date" name="warrantyEndDate" value={formData.warrantyEndDate} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'legal' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><FaLandmark/> Classificador CIBE</label>
                                <select name="accounting_category_id" value={formData.accounting_category_id} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                    <option value="">-- Selecione Categoria --</option>
                                    {accountingCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Estado de Conservação</label>
                                <select name="conservation_state_id" value={formData.conservation_state_id} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                    <option value="">-- Selecione Estado --</option>
                                    {conservationStates.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="bg-red-900/10 p-4 rounded border border-red-500/20 mt-4">
                            <h4 className="text-red-400 font-bold text-sm mb-3 flex items-center gap-2"><FaBroom/> Abate / Fim de Vida</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Motivo do Abate</label>
                                    <select name="decommission_reason_id" value={formData.decommission_reason_id} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                        <option value="">-- Selecione Motivo --</option>
                                        {decommissionReasons.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Valor Residual (€)</label>
                                    <input type="number" name="residual_value" value={formData.residual_value} onChange={handleChange} step="0.01" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors" disabled={isSaving}>Cancelar</button>
                    <button type="submit" disabled={isSaving} className="px-8 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary flex items-center gap-2 font-bold shadow-lg transition-all">
                        {isSaving ? <SpinnerIcon className="h-5 w-5" /> : <FaSave />} 
                        {isEditMode ? "Atualizar Ficha" : "Gravar Equipamento"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddEquipmentModal;