
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Modal from './common/Modal';
import { Equipment, EquipmentType, Brand, CriticalityLevel, CIARating, Supplier, SoftwareLicense, Entidade, Collaborator, CollaboratorStatus, ConfigItem, EquipmentStatus, LicenseAssignment } from '../types';
import { extractTextFromImage, getDeviceInfoFromText, isAiConfigured } from '../services/geminiService';
import { CameraIcon, SearchIcon, SpinnerIcon, PlusIcon, XIcon, CheckIcon } from './common/Icons';
import { FaExclamationTriangle, FaEuroSign, FaUserTag, FaKey, FaHistory, FaUserCheck, FaMagic, FaHandHoldingHeart, FaTools, FaMicrochip, FaLandmark, FaNetworkWired, FaMemory, FaHdd, FaListAlt, FaBroom, FaLaptopCode, FaShieldAlt } from 'react-icons/fa';
import * as dataService from '../services/dataService';

// Basic Camera Scanner Component
const CameraScanner: React.FC<{ onCapture: (dataUrl: string) => void, onClose: () => void }> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        const startCamera = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                setStream(mediaStream);
                if (videoRef.current) videoRef.current.srcObject = mediaStream;
            } catch (err) {
                console.error("Error accessing camera:", err);
                alert("Erro ao aceder à câmara.");
                onClose();
            }
        };
        startCamera();
        return () => { if (stream) stream.getTracks().forEach(track => track.stop()); };
    }, []);

    const capture = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
                onCapture(canvasRef.current.toDataURL('image/jpeg'));
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
            <video ref={videoRef} autoPlay playsInline className="w-full max-w-md" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute bottom-10 flex gap-4">
                <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-full">Cancelar</button>
                <button onClick={capture} className="px-6 py-2 bg-white text-black rounded-full font-bold">Capturar</button>
            </div>
        </div>
    );
};

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
}

const AddEquipmentModal: React.FC<AddEquipmentModalProps> = ({ 
    onClose, onSave, brands, equipmentTypes, equipmentToEdit, onSaveBrand, onSaveEquipmentType, onOpenKitModal, 
    suppliers = [], entidades = [], collaborators = [], 
    statusOptions = [], accountingCategories = [], conservationStates = [], decommissionReasons = [],
    cpuOptions = [], ramOptions = [], storageOptions = [], initialData
}) => {
    
    const [activeTab, setActiveTab] = useState<'general' | 'hardware' | 'security' | 'financial' | 'legal'>('general');
    const [formData, setFormData] = useState<Partial<Equipment>>({
        brandId: '', typeId: '', description: '', serialNumber: '', inventoryNumber: '', nomeNaRede: '', macAddressWIFI: '', macAddressCabo: '', 
        purchaseDate: '', warrantyEndDate: '', invoiceNumber: '', requisitionNumber: '',
        status: EquipmentStatus.Stock,
        criticality: CriticalityLevel.Low,
        confidentiality: CIARating.Low,
        integrity: CIARating.Low,
        availability: CIARating.Low,
        supplier_id: '',
        acquisitionCost: 0,
        expectedLifespanYears: 4,
        os_version: '',
        cpu_info: '',
        ram_size: '',
        disk_info: '',
        ip_address: '',
        last_security_update: '',
        manufacture_date: '',
        accounting_category_id: '',
        conservation_state_id: '',
        decommission_reason_id: '',
        residual_value: 0
    });
    
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isScanning, setIsScanning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const isEditMode = !!(equipmentToEdit && equipmentToEdit.id);
    const aiConfigured = isAiConfigured();

    useEffect(() => {
        if (equipmentToEdit) {
            setFormData({
                ...equipmentToEdit,
                purchaseDate: equipmentToEdit.purchaseDate || '',
                warrantyEndDate: equipmentToEdit.warrantyEndDate || '',
                last_security_update: equipmentToEdit.last_security_update || '',
                manufacture_date: equipmentToEdit.manufacture_date || '',
                accounting_category_id: equipmentToEdit.accounting_category_id || '',
                conservation_state_id: equipmentToEdit.conservation_state_id || '',
                decommission_reason_id: equipmentToEdit.decommission_reason_id || '',
            });
        } else if (initialData) {
             setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [equipmentToEdit, initialData]);

    const validate = useCallback(() => {
        const newErrors: Record<string, string> = {};
        if (!formData.serialNumber?.trim()) newErrors.serialNumber = "Nº Série obrigatório.";
        if (!formData.brandId) newErrors.brandId = "Marca obrigatória.";
        if (!formData.typeId) newErrors.typeId = "Tipo obrigatório.";
        if (!formData.description?.trim()) newErrors.description = "Descrição obrigatória.";
        
        if ((formData.status === 'Abate' || formData.status === 'Retirado (Arquivo)') && !formData.decommission_reason_id) {
            newErrors.decommission_reason_id = "Motivo de saída obrigatório para este estado.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

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
            // Limpeza de strings vazias para o Postgres não dar erro de UUID
            ['brandId', 'typeId', 'supplier_id', 'accounting_category_id', 'conservation_state_id', 'decommission_reason_id', 'parent_equipment_id'].forEach(f => {
                if (dataToSubmit[f as keyof Equipment] === '') (dataToSubmit as any)[f] = null;
            });
            await onSave(dataToSubmit);
            onClose();
        } catch (error: any) {
            alert(`Erro: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const getTabClass = (tab: string) => `px-4 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === tab ? 'border-brand-secondary text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`;

    return (
        <Modal title={isEditMode ? "Editar Equipamento" : "Novo Equipamento"} onClose={onClose} maxWidth="max-w-5xl">
            <div className="flex border-b border-gray-700 mb-6 bg-gray-900/50 rounded-t-lg overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('general')} className={getTabClass('general')}>Identificação</button>
                <button onClick={() => setActiveTab('hardware')} className={getTabClass('hardware')}>Hardware / Técnica</button>
                <button onClick={() => setActiveTab('security')} className={getTabClass('security')}>Segurança & SO</button>
                <button onClick={() => setActiveTab('financial')} className={getTabClass('financial')}>Financeiro</button>
                <button onClick={() => setActiveTab('legal')} className={getTabClass('legal')}>Legal & Saída</button>
            </div>

            <form onSubmit={handleSaveLocal} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar pb-4">
                
                {activeTab === 'general' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Número de Série *</label>
                                <div className="flex">
                                    <input type="text" name="serialNumber" value={formData.serialNumber} onChange={handleChange} className={`flex-grow bg-gray-700 border text-white rounded-l-md p-2 focus:ring-brand-secondary ${errors.serialNumber ? 'border-red-500' : 'border-gray-600'}`} required />
                                    <button type="button" onClick={() => setIsScanning(true)} disabled={!aiConfigured} className="p-2 bg-brand-primary text-white rounded-r-md" title="Scan via Câmera"><CameraIcon /></button>
                                </div>
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
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome na Rede (Hostname)</label>
                                <input type="text" name="nomeNaRede" value={formData.nomeNaRede} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" placeholder="Ex: PC-DIR-01" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nº Inventário Organizacional</label>
                                <input type="text" name="inventoryNumber" value={formData.inventoryNumber} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'hardware' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><FaMicrochip/> Processador (CPU)</label>
                                <select name="cpu_info" value={formData.cpu_info} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm">
                                    <option value="">-- Selecione --</option>
                                    {cpuOptions.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><FaMemory/> Memória RAM</label>
                                <select name="ram_size" value={formData.ram_size} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm">
                                    <option value="">-- Selecione --</option>
                                    {ramOptions.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><FaHdd/> Armazenamento (Disco)</label>
                                <select name="disk_info" value={formData.disk_info} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm">
                                    <option value="">-- Selecione --</option>
                                    {storageOptions.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Endereço IP</label>
                                <input type="text" name="ip_address" value={formData.ip_address} onChange={handleChange} placeholder="0.0.0.0" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 font-mono text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">MAC Address (Cabo)</label>
                                <input type="text" name="macAddressCabo" value={formData.macAddressCabo} onChange={handleChange} placeholder="00:00:00..." className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 font-mono text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">MAC Address (WIFI)</label>
                                <input type="text" name="macAddressWIFI" value={formData.macAddressWIFI} onChange={handleChange} placeholder="00:00:00..." className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 font-mono text-sm" />
                            </div>
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
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nível de Criticidade (BIA)</label>
                                <select name="criticality" value={formData.criticality} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                    {Object.values(CriticalityLevel).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Data de Fabrico</label>
                                <input type="date" name="manufacture_date" value={formData.manufacture_date} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'financial' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Fornecedor de Aquisição</label>
                                <select name="supplier_id" value={formData.supplier_id} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                    <option value="">-- Selecione --</option>
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
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nº Fatura / Documento</label>
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
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1"><FaLandmark/> Classificador CIBE / SNC-AP</label>
                                <select name="accounting_category_id" value={formData.accounting_category_id} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                    <option value="">-- Selecione --</option>
                                    {accountingCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Estado de Conservação</label>
                                <select name="conservation_state_id" value={formData.conservation_state_id} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                    <option value="">-- Selecione --</option>
                                    {conservationStates.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="bg-red-900/10 p-4 rounded border border-red-500/20 mt-4">
                            <h4 className="text-red-400 font-bold text-sm mb-3 flex items-center gap-2"><FaBroom/> Secção de Abate</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Motivo da Saída / Abate</label>
                                    <select name="decommission_reason_id" value={formData.decommission_reason_id} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.decommission_reason_id ? 'border-red-500' : 'border-gray-600'}`}>
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
                        {isEditMode ? "Guardar Alterações" : "Adicionar Equipamento"}
                    </button>
                </div>
            </form>
            {isScanning && <CameraScanner onCapture={(d) => { setIsScanning(false); }} onClose={() => setIsScanning(false)} />}
        </Modal>
    );
};

export default AddEquipmentModal;
