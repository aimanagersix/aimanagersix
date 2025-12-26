import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Modal from './common/Modal';
import { Equipment, EquipmentType, Brand, CriticalityLevel, CIARating, Supplier, SoftwareLicense, Entidade, Collaborator, CollaboratorStatus, ConfigItem, EquipmentStatus, LicenseAssignment } from '../types';
import { extractTextFromImage, getDeviceInfoFromText, isAiConfigured } from '../services/geminiService';
import { CameraIcon, SearchIcon, SpinnerIcon, PlusIcon, XIcon, CheckIcon, FaBoxes, FaShieldAlt, AssignIcon, UnassignIcon } from './common/Icons';
import { FaExclamationTriangle, FaEuroSign, FaUserTag, FaKey, FaHistory, FaUserCheck, FaMagic, FaHandHoldingHeart, FaTools, FaMicrochip, FaLandmark, FaNetworkWired, FaMemory, FaHdd, FaListAlt, FaBroom } from 'react-icons/fa';
import * as dataService from '../services/dataService';

const CameraScanner: React.FC<{ onCapture: (dataUrl: string) => void; onClose: () => void }> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                alert("Não foi possível aceder à câmara.");
                onClose();
            }
        };
        startCamera();
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
        };
    }, [onClose]);

    const capture = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                onCapture(canvasRef.current.toDataURL('image/jpeg'));
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4">
            <video ref={videoRef} autoPlay playsInline className="max-w-full max-h-[70vh] rounded-lg border-2 border-brand-primary shadow-2xl" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="mt-6 flex gap-4">
                <button onClick={onClose} className="px-6 py-3 bg-gray-700 text-white rounded-full font-bold transition-colors hover:bg-gray-600">Cancelar</button>
                <button onClick={capture} className="px-8 py-4 bg-brand-primary text-white rounded-full font-bold shadow-xl flex items-center gap-2 transition-transform hover:scale-105">
                    <CameraIcon /> Capturar
                </button>
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
    softwareLicenses?: SoftwareLicense[];
    entidades?: Entidade[];
    collaborators?: Collaborator[];
    statusOptions?: ConfigItem[];
    criticalityOptions?: ConfigItem[];
    ciaOptions?: ConfigItem[];
    initialData?: Partial<Equipment> | null;
    licenseAssignments?: LicenseAssignment[];
    onOpenHistory?: (equipment: Equipment) => void;
    onManageLicenses?: (equipment: Equipment) => void;
    onOpenAssign?: (equipment: Equipment) => void;
    accountingCategories?: ConfigItem[];
    conservationStates?: ConfigItem[];
    decommissionReasons?: ConfigItem[];
    cpuOptions?: ConfigItem[];
    ramOptions?: ConfigItem[];
    storageOptions?: ConfigItem[];
}

const AddEquipmentModal: React.FC<AddEquipmentModalProps> = ({ 
    onClose, onSave, brands, equipmentTypes, equipmentToEdit, onSaveBrand, onSaveEquipmentType, onOpenKitModal, 
    suppliers = [], entidades = [], collaborators = [], 
    statusOptions = [], criticalityOptions = [], ciaOptions = [], initialData,
    onOpenHistory, onManageLicenses, onOpenAssign,
    accountingCategories = [], conservationStates = [],
    decommissionReasons = [],
    cpuOptions = [], ramOptions = [], storageOptions = []
}) => {
    
    const [activeTab, setActiveTab] = useState<'general' | 'hardware' | 'security' | 'financial' | 'compliance'>('general');

    const statuses = statusOptions && statusOptions.length > 0 ? statusOptions.map(o => o.name) : Object.values(EquipmentStatus);
    const criticalities = criticalityOptions && criticalityOptions.length > 0 ? criticalityOptions.map(o => o.name) : Object.values(CriticalityLevel);
    const ciaRatings = ciaOptions && ciaOptions.length > 0 ? ciaOptions.map(o => o.name) : Object.values(CIARating);

    // FIX: Map properties to match Equipment interface in types.ts (snake_case)
    const [formData, setFormData] = useState<Partial<Equipment>>({
        brand_id: '', type_id: '', description: '', serial_number: '', inventory_number: '', nome_na_rede: '', mac_address_wifi: '', mac_address_cabo: '', 
        purchase_date: '',
        warranty_end_date: '', invoice_number: '', requisition_number: '',
        status: EquipmentStatus.Stock,
        criticality: CriticalityLevel.Low,
        confidentiality: CIARating.Low,
        integrity: CIARating.Low,
        availability: CIARating.Low,
        supplier_id: '',
        acquisition_cost: 0,
        expected_lifespan_years: 4,
        embedded_license_key: '',
        installation_location: '',
        is_loan: false,
        parent_equipment_id: '',
        os_version: '',
        last_security_update: '',
        firmware_version: '',
        wwan_address: '',
        bluetooth_address: '',
        usb_thunderbolt_address: '',
        ip_address: '',
        ram_size: '',
        disk_info: '',
        cpu_info: '',
        monitor_info: '',
        manufacture_date: '',
        accounting_category_id: '',
        conservation_state_id: '',
        decommission_reason_id: '',
        residual_value: 0
    });
    
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isScanning, setIsScanning] = useState(false);
    const [isLoading, setIsLoading] = useState({ serial: false, info: false });
    const [isSaving, setIsSaving] = useState(false);
    const [isAddingBrand, setIsAddingBrand] = useState(false);
    const [newBrandName, setNewBrandName] = useState('');
    const [isAddingType, setIsAddingType] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');
    const [showKitButton, setShowKitButton] = useState(false);
    const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);
    
    const [assignToEntityId, setAssignToEntityId] = useState('');
    const [assignToCollaboratorId, setAssignToCollaboratorId] = useState('');
    
    const aiConfigured = isAiConfigured();
    const isEditMode = !!(equipmentToEdit && equipmentToEdit.id);

    useEffect(() => {
        const loadEq = async () => {
            try {
                const data = await dataService.fetchAllData();
                setAllEquipment(data.equipment.filter((e: Equipment) => !equipmentToEdit || e.id !== equipmentToEdit.id)); 
            } catch (e) {
                console.error("Failed to load equipment for dropdown", e);
            }
        };
        loadEq();
    }, [equipmentToEdit]);

    useEffect(() => {
        if (equipmentToEdit) {
            setFormData({
                ...equipmentToEdit,
                purchase_date: equipmentToEdit.purchase_date || '',
                parent_equipment_id: equipmentToEdit.parent_equipment_id || '',
                accounting_category_id: equipmentToEdit.accounting_category_id || '',
                conservation_state_id: equipmentToEdit.conservation_state_id || '',
                decommission_reason_id: equipmentToEdit.decommission_reason_id || '',
                residual_value: equipmentToEdit.residual_value || 0,
                warranty_end_date: equipmentToEdit.warranty_end_date || '',
                last_security_update: equipmentToEdit.last_security_update || '',
                manufacture_date: equipmentToEdit.manufacture_date || '',
                cpu_info: equipmentToEdit.cpu_info || '',
                ram_size: equipmentToEdit.ram_size || '',
                disk_info: equipmentToEdit.disk_info || '',
                monitor_info: equipmentToEdit.monitor_info || '',
                ip_address: equipmentToEdit.ip_address || '',
            });
        } else if (initialData) {
             setFormData(prev => ({ ...prev, ...initialData }));
             // FIX: entidade_id
             if ((initialData as any)?.entidade_id) setAssignToEntityId((initialData as any).entidade_id);
        }
    }, [equipmentToEdit, initialData]);

    useEffect(() => {
        if (equipmentToEdit?.id) return; 

        // FIX: brand_id and type_id
        const brandName = brands.find(b => b.id === formData.brand_id)?.name;
        const typeName = equipmentTypes.find(t => t.id === formData.type_id)?.name;
        
        const isDescriptionDefaultOrEmpty = () => {
            const currentDesc = (formData.description || '').trim();
            if (currentDesc === '') return true;
            for (const b of brands) {
                for (const t of equipmentTypes) {
                    if (currentDesc === `${b.name} ${t.name}`) return true;
                }
            }
            return false;
        };

        if (brandName && typeName && isDescriptionDefaultOrEmpty()) {
            setFormData(prev => ({ ...prev, description: `${brandName} ${typeName} ` }));
        }
    }, [formData.brand_id, formData.type_id, brands, equipmentTypes, equipmentToEdit, formData.description]);

    const selectedType = useMemo(() => {
        // FIX: type_id
        return equipmentTypes.find(t => t.id === formData.type_id);
    }, [formData.type_id, equipmentTypes]);
    
    const isMaintenanceType = useMemo(() => {
        return selectedType?.is_maintenance === true;
    }, [selectedType]);

    const isComputingDevice = useMemo(() => {
        const name = selectedType?.name.toLowerCase() || '';
        return name.includes('desktop') || name.includes('laptop') || name.includes('portátil') || name.includes('servidor');
    }, [selectedType]);

     useEffect(() => {
        if (isComputingDevice) {
            setShowKitButton(true);
        } else {
            setShowKitButton(false);
        }
    }, [isComputingDevice]);

    const filteredCollaborators = useMemo(() => {
        if (!assignToEntityId) return [];
        // FIX: entidade_id
        return collaborators.filter(c => c.entidade_id === assignToEntityId && c.status === CollaboratorStatus.Ativo);
    }, [assignToEntityId, collaborators]);

    const validate = useCallback(() => {
        const newErrors: Record<string, string> = {};
        
        const statusNormalized = formData.status?.toLowerCase() || '';
        const isAcquisition = statusNormalized.includes('aquisiç') || statusNormalized.includes('encomenda') || statusNormalized.includes('compra');
        const isDecommissioned = formData.status === 'Abate' || formData.status === 'Retirado (Arquivo)';
        
        // FIX: serial_number
        if (!formData.serial_number?.trim()) {
            if (isEditMode) {
                newErrors.serial_number = "O número de série é obrigatório ao editar.";
            } else if (!isAcquisition) {
                newErrors.serial_number = "O número de série é obrigatório (exceto se estado 'Aquisição').";
            }
        }

        // FIX: brand_id and type_id
        if (!formData.brand_id) newErrors.brand_id = "A marca é obrigatória.";
        if (!formData.type_id) newErrors.type_id = "O tipo é obrigatória.";
        if (!formData.description?.trim()) newErrors.description = "A descrição é obrigatória.";
        
        if (isDecommissioned && !formData.decommission_reason_id) {
            newErrors.decommission_reason_id = "É obrigatório indicar o motivo da saída.";
        }

        // FIX: type_id, requires_location, and installation_location
        const type = equipmentTypes.find(t => t.id === formData.type_id);
        if (type?.requires_location && !formData.installation_location?.trim()) {
            newErrors.installation_location = "O local de instalação é obrigatório para este tipo de equipamento.";
        }
        
        if (type?.is_maintenance && !formData.parent_equipment_id) {
            newErrors.parent_equipment_id = "É obrigatório associar o Equipamento Principal para itens de manutenção/consumíveis.";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, equipmentTypes, isEditMode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value) 
        }));
    };

    const handleEntityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setAssignToEntityId(e.target.value);
        setAssignToCollaboratorId('');
    };
    
     const handleSetWarranty = (years: number) => {
        // FIX: purchase_date and warranty_end_date
        if (!formData.purchase_date) return;
        const purchase = new Date(formData.purchase_date);
        purchase.setUTCFullYear(purchase.getUTCFullYear() + years);
        const warrantyEnd = purchase.toISOString().split('T')[0];
        setFormData(prev => ({ ...prev, warranty_end_date: warrantyEnd }));
    };
    
    const handleGenerateName = async () => {
        const prefix = await dataService.getGlobalSetting('equipment_naming_prefix') || 'PC-';
        const digitsStr = await dataService.getGlobalSetting('equipment_naming_digits') || '4';
        const digits = parseInt(digitsStr);
        
        const allEq = await dataService.fetchAllData();
        const equipmentList = allEq.equipment;
        
        let maxNum = 0;
        // FIX: nome_na_rede
        const regex = new RegExp(`^${prefix}(\\d{${digits}})$`);
        
        equipmentList.forEach((eq: Equipment) => {
            if (eq.nome_na_rede) {
                const match = eq.nome_na_rede.match(regex);
                if (match && match[1]) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNum) maxNum = num;
                }
            }
        });
        
        const nextNum = maxNum + 1;
        const nextName = `${prefix}${String(nextNum).padStart(digits, '0')}`;
        // FIX: nome_na_rede
        setFormData(prev => ({ ...prev, nome_na_rede: nextName }));
    };
    
    const handleFetchInfo = useCallback(async (serial: string) => {
        if (!serial) {
            alert("Por favor, forneça um número de série.");
            return;
        }
        setIsLoading(prev => ({ ...prev, info: true }));
        try {
            const info = await getDeviceInfoFromText(serial);
            const matchedBrand = brands.find(b => b.name.toLowerCase() === info.brand.toLowerCase());
            const matchedType = equipmentTypes.find(et => et.name.toLowerCase() === info.type.toLowerCase());
            // FIX: serial_number, brand_id, type_id
            setFormData(prev => ({
                ...prev,
                serial_number: serial,
                brand_id: matchedBrand ? matchedBrand.id : (prev.brand_id || ''),
                type_id: matchedType ? matchedType.id : (prev.type_id || '')
            }));
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(prev => ({ ...prev, info: false }));
        }
    }, [brands, equipmentTypes]);

    const handleScanComplete = useCallback(async (dataUrl: string) => {
        setIsScanning(false);
        setIsLoading(prev => ({ ...prev, serial: true }));
        try {
            const base64Image = dataUrl.split(',')[1];
            const serial = await extractTextFromImage(base64Image, 'image/jpeg');
            if (serial) {
                await handleFetchInfo(serial);
            } else {
                alert("Nenhum número de série encontrado.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(prev => ({ ...prev, serial: false }));
        }
    }, [handleFetchInfo]);

     const handleAddNewBrand = async () => {
        if (newBrandName.trim() === '') return;
        const newBrand = await onSaveBrand({ name: newBrandName.trim(), risk_level: CriticalityLevel.Low, is_iso27001_certified: false });
        // FIX: brand_id
        setFormData(prev => ({...prev, brand_id: newBrand.id }));
        setNewBrandName('');
        setIsAddingBrand(false);
    };

    const handleAddNewType = async () => {
        if (newTypeName.trim() === '') return;
        // FIX: requirements in snake_case
        const newType = await onSaveEquipmentType({ 
            name: newTypeName.trim(),
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
        // FIX: type_id
        setFormData(prev => ({...prev, type_id: newType.id }));
        setNewTypeName('');
        setIsAddingType(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        setIsSaving(true);
        
        try {
            const dataToSubmit: any = { ...formData };
            
            // Requisito 4: Aquisição -> Stock se tiver S/N
            // FIX: serial_number
            if (dataToSubmit.status === EquipmentStatus.Acquisition && dataToSubmit.serial_number) {
                dataToSubmit.status = EquipmentStatus.Stock;
            }

            // Requisito 5: Stock -> Operacional se houver atribuição
            const hasInitialAssignment = !isEditMode && assignToEntityId;
            // FIX: is_loan
            if (dataToSubmit.status === EquipmentStatus.Stock && hasInitialAssignment) {
                dataToSubmit.status = dataToSubmit.is_loan ? EquipmentStatus.Empréstimo : EquipmentStatus.Operacional;
            }

            // FIX: date fields in snake_case
            const dateFields = ['purchase_date', 'warranty_end_date', 'last_security_update', 'manufacture_date'];
            dateFields.forEach(field => {
                if (dataToSubmit[field] === '') {
                    dataToSubmit[field] = null;
                }
            });
            
            const uuidFields = ['accounting_category_id', 'conservation_state_id', 'parent_equipment_id', 'supplier_id', 'decommission_reason_id'];
            uuidFields.forEach(field => {
                if (dataToSubmit[field] === '') {
                    dataToSubmit[field] = null;
                }
            });

            if (!equipmentToEdit) {
                // FIX: snake_case
                delete dataToSubmit.creation_date;
                delete dataToSubmit.modified_date;
            }

            let assignment = null;
            if (!equipmentToEdit && assignToEntityId) {
                // FIX: assigned_date, entidade_id, collaborator_id
                assignment = {
                    entidade_id: assignToEntityId,
                    collaborator_id: assignToCollaboratorId || undefined,
                    assigned_date: new Date().toISOString().split('T')[0]
                };
            }

            await onSave(dataToSubmit, assignment, undefined); 
            onClose();
        } catch (error: any) {
            console.error("Error saving equipment:", error);
            alert(`Erro ao gravar equipamento: ${error.message || "Verifique os campos (datas ou referências)."}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const statusNormalizedValue = formData.status || '';
    const isAcquisitionStatus = statusNormalizedValue.toLowerCase().includes('aquisiç') || statusNormalizedValue.toLowerCase().includes('encomenda');
    const isDecommissionedStatus = statusNormalizedValue === 'Abate' || statusNormalizedValue === 'Retirado (Arquivo)';

    const modalTitleText = isEditMode ? "Editar Equipamento" : "Adicionar Novo Equipamento";
    const submitButtonTextValue = isEditMode ? "Guardar Alterações" : "Adicionar Equipamento";
    const getTabClassValue = (tab: string) => `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`;

    return (
        <Modal title={modalTitleText} onClose={onClose} maxWidth="max-w-4xl">
            {isScanning && <CameraScanner onCapture={handleScanComplete} onClose={() => setIsScanning(false)} />}
            
            <div className="flex border-b border-gray-700 mb-4 flex-wrap">
                <button type="button" onClick={() => setActiveTab('general')} className={getTabClassValue('general')}>Geral</button>
                <button type="button" onClick={() => setActiveTab('hardware')} className={getTabClassValue('hardware')}>Hardware & Rede</button>
                <button type="button" onClick={() => setActiveTab('security')} className={getTabClassValue('security')}>Sistema & Segurança</button>
                <button type="button" onClick={() => setActiveTab('financial')} className={getTabClassValue('financial')}>Financeiro (FinOps)</button>
                <button type="button" onClick={() => setActiveTab('compliance')} className={getTabClassValue('compliance')}>Legal & Compliance</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto max-h-[75vh] pr-2 custom-scrollbar">
                {isEditMode && equipmentToEdit && (
                    <div className="flex gap-3 mb-4 bg-gray-900/50 p-3 rounded border border-gray-700 overflow-x-auto">
                        {onOpenHistory && (
                            <button type="button" onClick={() => onOpenHistory(equipmentToEdit)} className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded whitespace-nowrap transition-colors"><FaHistory /> Histórico & Impacto</button>
                        )}
                        {onManageLicenses && (
                            <button type="button" onClick={() => onManageLicenses(equipmentToEdit)} className="flex items-center gap-2 px-3 py-2 bg-yellow-700 hover:bg-yellow-600 text-white text-xs rounded whitespace-nowrap transition-colors"><FaKey /> Gerir Licenças</button>
                        )}
                        {onOpenAssign && (
                            <button type="button" onClick={() => onOpenAssign(equipmentToEdit)} className="flex items-center gap-2 px-3 py-2 bg-green-700 hover:bg-green-600 text-white text-xs rounded whitespace-nowrap transition-colors"><FaUserCheck /> Atribuir/Desassociar</button>
                        )}
                    </div>
                 )}
                
                {activeTab === 'general' && (
                    <div className="space-y-4 animate-fade-in">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                {/* FIX: serial_number */}
                                <label htmlFor="serial_number" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">
                                    Número de Série {isAcquisitionStatus ? '(Opcional em Aquisição)' : ''}
                                </label>
                                <div className="flex">
                                    <input type="text" name="serial_number" id="serial_number" value={formData.serial_number} onChange={handleChange} className={`flex-grow bg-gray-700 border text-white rounded-l-md p-2 focus:ring-brand-secondary focus:border-brand-secondary ${errors.serial_number ? 'border-red-500' : 'border-gray-600'}`} placeholder={isAcquisitionStatus ? "Pendente (Opcional)" : "S/N"} />
                                    <button type="button" onClick={() => setIsScanning(true)} disabled={!aiConfigured} className={`p-2 bg-brand-primary text-white hover:bg-brand-secondary transition-colors ${!aiConfigured ? 'opacity-50 cursor-not-allowed' : ''}`}>{isLoading.serial ? <SpinnerIcon /> : <CameraIcon />}</button>
                                    <button type="button" onClick={() => handleFetchInfo(formData.serial_number!)} disabled={!formData.serial_number || isLoading.info || !aiConfigured} className={`p-2 bg-gray-600 text-white rounded-r-md hover:bg-gray-500 transition-colors disabled:opacity-50 ${!aiConfigured ? 'cursor-not-allowed' : ''}`}>{isLoading.info ? <SpinnerIcon /> : <SearchIcon />}</button>
                                </div>
                                {errors.serial_number && <p className="text-red-400 text-xs italic mt-1">{errors.serial_number}</p>}
                            </div>
                            <div>
                                {/* FIX: brand_id */}
                                <label htmlFor="brand_id" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Marca</label>
                                {isAddingBrand ? (
                                    <div className="flex gap-2">
                                        <input type="text" value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} placeholder="Nome da nova marca" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewBrand(); }}} />
                                        <button type="button" onClick={handleAddNewBrand} className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700"><CheckIcon/></button>
                                        <button type="button" onClick={() => { setIsAddingBrand(false); setNewBrandName(''); }} className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700"><XIcon/></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <select name="brand_id" id="brand_id" value={formData.brand_id} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.brand_id ? 'border-red-500' : 'border-gray-600'}`}>
                                            <option value="" disabled>Selecione uma marca</option>
                                            {brands.map(brand => (<option key={brand.id as string} value={brand.id as string}>{brand.name as string}</option>))}
                                        </select>
                                        <button type="button" onClick={() => setIsAddingBrand(true)} className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"><PlusIcon className="h-5 w-5"/></button>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                {/* FIX: type_id */}
                                <label htmlFor="type_id" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Tipo</label>
                                {isAddingType ? (
                                    <div className="flex gap-2">
                                        <input type="text" value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} placeholder="Nome do novo tipo" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewType(); }}} />
                                        <button type="button" onClick={handleAddNewType} className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700"><CheckIcon/></button>
                                        <button type="button" onClick={() => { setIsAddingType(false); setNewTypeName(''); }} className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700"><XIcon/></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <select name="type_id" id="type_id" value={formData.type_id} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.type_id ? 'border-red-500' : 'border-gray-600'}`}>
                                            <option value="" disabled>Selecione um tipo</option>
                                            {equipmentTypes.map(type => (<option key={type.id} value={type.id}>{type.name}</option>))}
                                        </select>
                                        <button type="button" onClick={() => setIsAddingType(true)} className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"><PlusIcon className="h-5 w-5"/></button>
                                    </div>
                                )}
                            </div>
                            {/* FIX: requires_nome_na_rede */}
                            {selectedType?.requires_nome_na_rede && (
                                <div>
                                    {/* FIX: nome_na_rede */}
                                    <label htmlFor="nome_na_rede" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nome na Rede (Opcional)</label>
                                    <div className="flex">
                                        <input type="text" name="nome_na_rede" id="nome_na_rede" value={formData.nome_na_rede} onChange={handleChange} className="flex-grow bg-gray-700 border border-gray-600 text-white rounded-l-md p-2" />
                                        <button type="button" onClick={handleGenerateName} className="bg-gray-600 hover:bg-gray-500 px-3 rounded-r-md border border-gray-600 text-white flex items-center justify-center"><FaMagic /></button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* FIX: requires_inventory_number */}
                            {selectedType?.requires_inventory_number && (
                                <div>
                                    {/* FIX: inventory_number */}
                                    <label htmlFor="inventory_number" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Número de Inventário / Etiqueta</label>
                                    <input type="text" name="inventory_number" id="inventory_number" value={formData.inventory_number} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" placeholder="Etiqueta física" />
                                </div>
                            )}
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Estado Operacional</label>
                                <select name="status" id="status" value={formData.status} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                    {statuses.map(s => <option key={s as string} value={s as string}>{s as string}</option>)}
                                </select>
                            </div>
                        </div>

                        {isDecommissionedStatus && (
                            <div className="bg-red-900/20 p-4 rounded border border-red-500/30 animate-fade-in">
                                <label className="block text-sm font-bold text-red-200 mb-1 flex items-center gap-2">
                                    <FaBroom /> Motivo do Abate / Retirada
                                </label>
                                <select 
                                    name="decommission_reason_id" 
                                    value={formData.decommission_reason_id || ''} 
                                    onChange={handleChange} 
                                    className={`w-full bg-gray-700 border text-white rounded-md p-2 text-sm ${errors.decommission_reason_id ? 'border-red-500' : 'border-gray-600'}`}
                                    required
                                >
                                    <option value="">-- Selecione o Motivo --</option>
                                    {decommissionReasons.map(r => <option key={r.id as string} value={r.id as string}>{r.name as string}</option>)}
                                </select>
                                {errors.decommission_reason_id && <p className="text-red-400 text-xs italic mt-1">{errors.decommission_reason_id}</p>}
                            </div>
                        )}

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Descrição Comercial</label>
                            <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.description ? 'border-red-500' : 'border-gray-600'}`}></textarea>
                        </div>
                        
                        <div className="bg-purple-900/20 p-3 rounded border border-purple-500/30">
                            <label className="flex items-center cursor-pointer">
                                {/* FIX: is_loan */}
                                <input type="checkbox" name="is_loan" checked={formData.is_loan} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 bg-gray-700 text-brand-primary focus:ring-brand-secondary" />
                                <span className="ml-2 text-sm font-bold text-purple-200 flex items-center gap-2"><FaHandHoldingHeart /> Equipamento de Empréstimo / Pool</span>
                            </label>
                        </div>

                        {!isEditMode && isComputingDevice && !isMaintenanceType && (
                            <div className="border-t border-gray-600 pt-4 mt-4">
                                <h3 className="text-lg font-medium text-on-surface-dark mb-2 flex items-center gap-2"><FaUserTag className="text-blue-400" /> Atribuição Inicial (Opcional)</h3>
                                <div className="bg-gray-800/50 p-3 rounded border border-gray-600 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-on-surface-dark-secondary mb-1">Entidade</label>
                                        <select value={assignToEntityId} onChange={handleEntityChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm">
                                            <option value="">-- Em Stock (Sem Atribuição) --</option>
                                            {entidades.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-on-surface-dark-secondary mb-1">Colaborador</label>
                                        <select value={assignToCollaboratorId} onChange={(e) => setAssignToCollaboratorId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm disabled:bg-gray-800 disabled:cursor-not-allowed" disabled={!assignToEntityId}>
                                            <option value="">-- Atribuir apenas à Localização --</option>
                                            {/* FIX: full_name */}
                                            {filteredCollaborators.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {isMaintenanceType && (
                            <div className="bg-orange-900/20 p-4 rounded border border-orange-500/30 animate-fade-in">
                                <h3 className="text-sm font-bold text-orange-200 mb-2 flex items-center gap-2"><FaTools /> Componente de Manutenção</h3>
                                <p className="text-xs text-gray-400 mb-3">Este item é identificado como um componente ou consumível. Deve ser associado a um equipamento principal.</p>
                                <label htmlFor="parent_equipment_id" className="block text-xs font-medium text-white mb-1">Equipamento Principal (Pai)</label>
                                <select name="parent_equipment_id" id="parent_equipment_id" value={formData.parent_equipment_id} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 text-sm ${errors.parent_equipment_id ? 'border-red-500' : 'border-gray-600'}`}>
                                    <option value="">-- Selecione o equipamento onde será instalado --</option>
                                    {/* FIX: serial_number */}
                                    {allEquipment.map(eq => (<option key={eq.id} value={eq.id}>{eq.description} (S/N: {eq.serial_number})</option>))}
                                </select>
                                {errors.parent_equipment_id && <p className="text-red-400 text-xs italic mt-1">{errors.parent_equipment_id}</p>}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'hardware' && (
                    <div className="space-y-6 animate-fade-in">
                         {(selectedType?.requires_cpu_info || selectedType?.requires_ram_size || selectedType?.requires_disk_info || selectedType?.requires_manufacture_date) && (
                            <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                                <h3 className="text-lg font-medium text-on-surface-dark mb-4 flex items-center gap-2"><FaMicrochip className="text-purple-400" /> Especificações de Hardware</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {selectedType?.requires_cpu_info && (
                                        <div>
                                            <label htmlFor="cpu_info" className="block text-sm font-medium text-on-surface-dark-secondary mb-1 flex items-center gap-1"><FaMicrochip/> Processador (CPU)</label>
                                            {cpuOptions.length > 0 ? (
                                                <select name="cpu_info" id="cpu_info" value={formData.cpu_info || ''} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm">
                                                    <option value="">-- Selecione CPU --</option>
                                                    {cpuOptions.map(opt => (<option key={opt.id as string} value={opt.name as string}>{opt.name as string}</option>))}
                                                    {formData.cpu_info && !cpuOptions.some(o => o.name === formData.cpu_info) && <option value={formData.cpu_info}>{formData.cpu_info}</option>}
                                                </select>
                                            ) : (
                                                <input type="text" name="cpu_info" value={formData.cpu_info || ''} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm" placeholder="Ex: Intel i5-12400" />
                                            )}
                                        </div>
                                    )}
                                    {selectedType?.requires_ram_size && (
                                        <div>
                                            <label htmlFor="ram_size" className="block text-sm font-medium text-on-surface-dark-secondary mb-1 flex items-center gap-1"><FaMemory/> Memória RAM</label>
                                            {ramOptions.length > 0 ? (
                                                <select name="ram_size" id="ram_size" value={formData.ram_size || ''} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm">
                                                    <option value="">-- Selecione RAM --</option>
                                                    {ramOptions.map(opt => (<option key={opt.id as string} value={opt.name as string}>{opt.name as string}</option>))}
                                                    {formData.ram_size && !ramOptions.some(o => o.name === formData.ram_size) && <option value={formData.ram_size}>{formData.ram_size}</option>}
                                                </select>
                                            ) : (
                                                <input type="text" name="ram_size" value={formData.ram_size || ''} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm" placeholder="Ex: 16GB" />
                                            )}
                                        </div>
                                    )}
                                    {selectedType?.requires_disk_info && (
                                        <div>
                                            <label htmlFor="disk_info" className="block text-sm font-medium text-on-surface-dark-secondary mb-1 flex items-center gap-1"><FaHdd/> Disco / Armazenamento</label>
                                            {storageOptions.length > 0 ? (
                                                <select name="disk_info" id="disk_info" value={formData.disk_info || ''} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm">
                                                    <option value="">-- Selecione Disco --</option>
                                                    {storageOptions.map(opt => (<option key={opt.id as string} value={opt.name as string}>{opt.name as string}</option>))}
                                                    {formData.disk_info && !storageOptions.some(o => o.name === formData.disk_info) && <option value={formData.disk_info}>{formData.disk_info}</option>}
                                                </select>
                                            ) : (
                                                <input type="text" name="disk_info" value={formData.disk_info || ''} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm" placeholder="Ex: 512GB NVMe" />
                                            )}
                                        </div>
                                    )}
                                     {selectedType?.requires_manufacture_date && (
                                        <div>
                                            <label htmlFor="manufacture_date" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Data de Fabrico</label>
                                            <input type="date" name="manufacture_date" id="manufacture_date" value={formData.manufacture_date || ''} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                            <h3 className="text-lg font-medium text-on-surface-dark mb-4 flex items-center gap-2"><FaNetworkWired className="text-blue-400"/> Rede & Conectividade</h3>
                            
                            {selectedType?.requires_ip && (
                                <div className="mb-4">
                                     <label htmlFor="ip_address" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Endereço IP</label>
                                     <input type="text" name="ip_address" id="ip_address" value={formData.ip_address || ''} onChange={handleChange} placeholder="Ex: 192.168.1.100" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 {/* FIX: requires_mac_wifi and mac_address_wifi */}
                                 {selectedType?.requires_mac_wifi && (
                                    <div>
                                        <label htmlFor="mac_address_wifi" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Endereço MAC WIFI</label>
                                        <input type="text" name="mac_address_wifi" id="mac_address_wifi" value={formData.mac_address_wifi} onChange={handleChange} placeholder="00:1A:2B:3C:4D:5E" className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.mac_address_wifi ? 'border-red-500' : 'border-gray-600'}`} />
                                    </div>
                                 )}
                                 {/* FIX: requires_mac_cabo and mac_address_cabo */}
                                 {selectedType?.requires_mac_cabo && (
                                    <div>
                                        <label htmlFor="mac_address_cabo" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Endereço MAC Cabo</label>
                                        <input type="text" name="mac_address_cabo" id="mac_address_cabo" value={formData.mac_address_cabo} onChange={handleChange} placeholder="00:1A:2B:3C:4D:5F" className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.mac_address_cabo ? 'border-red-500' : 'border-gray-600'}`} />
                                    </div>
                                )}
                            </div>

                            {/* Pedido 4: Inclusão de campos adicionais de Hardware se requeridos pelo tipo */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                {selectedType?.requires_wwan_address && (
                                    <div>
                                        <label htmlFor="wwan_address" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">IMEI / WWAN (SIM)</label>
                                        <input type="text" name="wwan_address" id="wwan_address" value={formData.wwan_address || ''} onChange={handleChange} placeholder="ID do modem 4G/5G" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm" />
                                    </div>
                                )}
                                {selectedType?.requires_bluetooth_address && (
                                    <div>
                                        <label htmlFor="bluetooth_address" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Endereço Bluetooth</label>
                                        <input type="text" name="bluetooth_address" id="bluetooth_address" value={formData.bluetooth_address || ''} onChange={handleChange} placeholder="XX:XX:XX:XX:XX:XX" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm" />
                                    </div>
                                )}
                                {selectedType?.requires_usb_thunderbolt_address && (
                                    <div>
                                        <label htmlFor="usb_thunderbolt_address" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">USB / Thunderbolt ID</label>
                                        <input type="text" name="usb_thunderbolt_address" id="usb_thunderbolt_address" value={formData.usb_thunderbolt_address || ''} onChange={handleChange} placeholder="ID da controladora" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm" />
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* FIX: requires_location and installation_location */}
                        {(selectedType?.requires_location || formData.installation_location) && (
                            <div>
                                <label htmlFor="installation_location" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">
                                    Local de Instalação (Físico) {selectedType?.requires_location && <span className="text-red-400">*</span>}
                                </label>
                                <input type="text" name="installation_location" id="installation_location" value={formData.installation_location} onChange={handleChange} placeholder="Ex: Sala 204, Rack 3" className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.installation_location ? 'border-red-500' : 'border-gray-600'}`} />
                                 {errors.installation_location && <p className="text-red-400 text-xs italic mt-1">{errors.installation_location}</p>}
                            </div>
                        )}
                    </div>
                )}
                
                {activeTab === 'security' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                            <h3 className="text-lg font-medium text-on-surface-dark mb-4 flex items-center gap-2">
                                <FaShieldAlt className="text-green-400" />
                                Sistema Operativo & Segurança
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="os_version" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Versão do SO</label>
                                    <input type="text" name="os_version" id="os_version" value={formData.os_version} onChange={handleChange} placeholder="Ex: Windows 11 Pro" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                                </div>
                                <div>
                                    <label htmlFor="last_security_update" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Último Patch de Segurança</label>
                                    <input type="date" name="last_security_update" id="last_security_update" value={formData.last_security_update || ''} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                                </div>
                                <div>
                                    <label htmlFor="firmware_version" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Versão do Firmware</label>
                                    <input type="text" name="firmware_version" id="firmware_version" value={formData.firmware_version} onChange={handleChange} placeholder="Ex: 1.2.3" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                                </div>
                            </div>
                             <div className="mt-4">
                                <label htmlFor="embedded_license_key" className="block text-sm font-medium text-on-surface-dark-secondary mb-1 flex items-center gap-2"><FaKey className="text-yellow-500"/> Chave de Licença OEM (BIOS)</label>
                                <input type="text" name="embedded_license_key" id="embedded_license_key" value={formData.embedded_license_key} onChange={handleChange} placeholder="Chave original do hardware" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 font-mono" />
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'financial' && (
                    <div className="space-y-6 animate-fade-in">
                         <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                            <h3 className="text-lg font-medium text-on-surface-dark mb-4 flex items-center gap-2">
                                <FaEuroSign className="text-green-400" />
                                Gestão Financeira (FinOps)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    {/* FIX: acquisition_cost */}
                                    <label htmlFor="acquisition_cost" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Custo de Aquisição (€)</label>
                                    <input type="number" name="acquisition_cost" id="acquisition_cost" value={formData.acquisition_cost} onChange={handleChange} placeholder="0.00" min="0" step="0.01" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                                </div>
                                <div>
                                    {/* FIX: expected_lifespan_years */}
                                    <label htmlFor="expected_lifespan_years" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Vida Útil Esperada (Anos)</label>
                                    <input type="number" name="expected_lifespan_years" id="expected_lifespan_years" value={formData.expected_lifespan_years} onChange={handleChange} min="1" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                                </div>
                                <div>
                                    <label htmlFor="residual_value" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Valor Residual Estimado (€)</label>
                                    <input type="number" name="residual_value" id="residual_value" value={formData.residual_value} onChange={handleChange} min="0" step="0.01" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-700">
                                <div>
                                    {/* FIX: purchase_date */}
                                    <label htmlFor="purchase_date" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Data de Compra</label>
                                    <input type="date" name="purchase_date" id="purchase_date" value={formData.purchase_date || ''} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.purchase_date ? 'border-red-500' : 'border-gray-600'}`} />
                                </div>
                                <div>
                                    {/* FIX: invoice_number */}
                                    <label htmlFor="invoice_number" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Número da Fatura</label>
                                    <input type="text" name="invoice_number" id="invoice_number" value={formData.invoice_number} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                                </div>
                                <div>
                                    {/* FIX: requisition_number */}
                                    <label htmlFor="requisition_number" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Número da Requisição</label>
                                    <input type="text" name="requisition_number" id="requisition_number" value={formData.requisition_number} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                                </div>
                                <div>
                                    {/* FIX: warranty_end_date */}
                                    <label htmlFor="warranty_end_date" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Fim da Garantia</label>
                                    <div className="flex items-center gap-2">
                                        <input type="date" name="warranty_end_date" id="warranty_end_date" value={formData.warranty_end_date || ''} onChange={handleChange} className="w-full bg-gray-700 border text-white rounded-md p-2" />
                                        <button type="button" onClick={() => handleSetWarranty(2)} className="px-3 py-2 text-sm bg-gray-600 rounded-md hover:bg-gray-500 whitespace-nowrap">2 Anos</button>
                                        <button type="button" onClick={() => handleSetWarranty(3)} className="px-3 py-2 text-sm bg-gray-600 rounded-md hover:bg-gray-500 whitespace-nowrap">3 Anos</button>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="supplier_id" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Fornecedor</label>
                                    <select name="supplier_id" id="supplier_id" value={formData.supplier_id} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                        <option value="">-- Selecione Fornecedor --</option>
                                        {suppliers.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'compliance' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                            <h3 className="text-lg font-medium text-on-surface-dark mb-4 flex items-center gap-2">
                                <FaShieldAlt className="text-yellow-400" />
                                Classificação de Risco & Conformidade (NIS2)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label htmlFor="criticality" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nível de Criticidade</label>
                                    <select name="criticality" id="criticality" value={formData.criticality} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                        {criticalities.map(level => (<option key={level as string} value={level as string}>{level as string}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="confidentiality" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Confidencialidade</label>
                                    <select name="confidentiality" id="confidentiality" value={formData.confidentiality} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                        {ciaRatings.map(rating => (<option key={rating as string} value={rating as string}>{rating as string}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="integrity" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Integridade</label>
                                    <select name="integrity" id="integrity" value={formData.integrity} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                        {ciaRatings.map(rating => (<option key={rating as string} value={rating as string}>{rating as string}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="availability" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Disponibilidade</label>
                                    <select name="availability" id="availability" value={formData.availability} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                        {ciaRatings.map(rating => (<option key={rating as string} value={rating as string}>{rating as string}</option>))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                            <h3 className="text-lg font-medium text-on-surface-dark mb-4 flex items-center gap-2">
                                <FaLandmark className="text-orange-500" />
                                Contabilidade & Património (Legal)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="accounting_category_id" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Classificador CIBE / SNC-AP</label>
                                    <select 
                                        name="accounting_category_id" 
                                        id="accounting_category_id" 
                                        value={formData.accounting_category_id} 
                                        onChange={handleChange} 
                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                                    >
                                        <option value="">-- Selecione Classificador --</option>
                                        {accountingCategories.map(c => (
                                            <option key={c.id as string} value={c.id as string}>{c.name as string}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="conservation_state_id" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Estado de Conservação</label>
                                    <select 
                                        name="conservation_state_id" 
                                        id="conservation_state_id" 
                                        value={formData.conservation_state_id} 
                                        onChange={handleChange} 
                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                                    >
                                        <option value="">-- Selecione Estado --</option>
                                        {conservationStates.map(s => (
                                            <option key={s.id as string} value={s.id as string}>{s.name as string}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showKitButton && !isEditMode && (
                    <div className="pt-4 mt-4 border-t border-gray-600">
                        <button type="button" onClick={() => onOpenKitModal(formData)} className="w-full flex items-center justify-center gap-3 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors">
                            <FaBoxes />
                            Criar um Posto de Trabalho a partir deste item
                        </button>
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700 mt-auto">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500" disabled={isSaving}>Cancelar</button>
                    <button 
                        type="submit" 
                        disabled={isSaving}
                        className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <SpinnerIcon className="h-4 w-4" /> : null}
                        {isSaving ? 'A Gravar...' : submitButtonTextValue}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddEquipmentModal;