
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Modal from './common/Modal';
import { Equipment, EquipmentType, Brand, CriticalityLevel, CIARating, Supplier, SoftwareLicense, Entidade, Collaborator, CollaboratorStatus, ConfigItem, EquipmentStatus, LicenseAssignment } from '../types';
import { extractTextFromImage, getDeviceInfoFromText, isAiConfigured } from '../services/geminiService';
import { CameraIcon, SearchIcon, SpinnerIcon, PlusIcon, XIcon, CheckIcon, FaBoxes, FaShieldAlt, AssignIcon, UnassignIcon } from './common/Icons';
import { FaExclamationTriangle, FaEuroSign, FaUserTag, FaKey, FaHistory, FaUserCheck, FaMagic, FaHandHoldingHeart, FaTools, FaMicrochip, FaLandmark, FaNetworkWired } from 'react-icons/fa';
import * as dataService from '../services/dataService';

interface CameraScannerProps {
    onCapture: (dataUrl: string) => void;
    onClose: () => void;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const guideRef = useRef<HTMLDivElement>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const videoStreamRef = useRef<MediaStream | null>(null);

    const startCamera = useCallback(async () => {
        if (videoStreamRef.current) {
            videoStreamRef.current.getTracks().forEach(track => track.stop());
        }

        setCameraError(null);
        try {
            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            videoStreamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
                setCameraError("O acesso à câmera foi negado. Por favor, habilite a permissão da câmera nas configurações do seu navegador para usar esta funcionalidade.");
            } else {
                setCameraError("Não foi possível acessar a câmera. Verifique se ela não está sendo usada por outro aplicativo e tente novamente.");
            }
        }
    }, []);

    useEffect(() => {
        startCamera();
        return () => {
            if (videoStreamRef.current) {
                videoStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [startCamera]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current && guideRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const guide = guideRef.current;
            const context = canvas.getContext('2d');

            if (!context) return;

            const videoRect = video.getBoundingClientRect();
            const guideRect = guide.getBoundingClientRect();

            const scaleX = video.videoWidth / videoRect.width;
            const scaleY = video.videoHeight / videoRect.height;
            
            const sx = (guideRect.left - videoRect.left) * scaleX;
            const sy = (guideRect.top - videoRect.top) * scaleY;
            const sWidth = guideRect.width * scaleX;
            const sHeight = guideRect.height * scaleY;

            canvas.width = sWidth;
            canvas.height = sHeight;

            context.drawImage(
                video,
                sx,
                sy,
                sWidth,
                sHeight,
                0,
                0,
                sWidth,
                sHeight
            );
            
            onCapture(canvas.toDataURL('image/jpeg', 0.95));
        }
    };
    
    if (cameraError) {
        return (
            <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-8 text-center">
                <FaExclamationTriangle className="h-16 w-16 text-yellow-400 mb-6" />
                <h2 className="text-2xl font-bold text-white mb-4">Erro na Câmera</h2>
                <p className="text-on-surface-dark-secondary max-w-lg mb-8">{cameraError}</p>
                <div className="flex gap-4">
                    <button onClick={onClose} className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors">Cancelar</button>
                    <button onClick={startCamera} className="px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors">Tentar Novamente</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pointer-events-none">
                <div className="w-full text-center mb-4">
                    <p className="text-white text-lg font-semibold bg-black/50 p-2 rounded-md">Posicione o número de série no retângulo</p>
                    <p className="text-white text-sm bg-black/50 p-1 rounded-md">Toque no ecrã para focar</p>
                </div>
                <div 
                    ref={guideRef} 
                    className="w-full max-w-lg h-24 border-4 border-dashed border-white rounded-lg"
                    style={{
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
                    }}
                ></div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/50 flex justify-around items-center">
                <button onClick={onClose} className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors">Cancelar</button>
                <button onClick={handleCapture} className="p-5 bg-brand-primary rounded-full text-white shadow-lg transform active:scale-95 transition-transform">
                    <CameraIcon className="h-8 w-8" />
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
}

const AddEquipmentModal: React.FC<AddEquipmentModalProps> = ({ 
    onClose, onSave, brands, equipmentTypes, equipmentToEdit, onSaveBrand, onSaveEquipmentType, onOpenKitModal, 
    suppliers = [], entidades = [], collaborators = [], 
    statusOptions, criticalityOptions, ciaOptions, initialData,
    onOpenHistory, onManageLicenses, onOpenAssign,
    accountingCategories = [], conservationStates = []
}) => {
    // Use dynamic options if available, else fallback to enum values
    const statuses = statusOptions && statusOptions.length > 0 ? statusOptions.map(o => o.name) : Object.values(EquipmentStatus);
    const criticalities = criticalityOptions && criticalityOptions.length > 0 ? criticalityOptions.map(o => o.name) : Object.values(CriticalityLevel);
    const ciaRatings = ciaOptions && ciaOptions.length > 0 ? ciaOptions.map(o => o.name) : Object.values(CIARating);

    const [formData, setFormData] = useState<Partial<Equipment>>({
        brandId: '', typeId: '', description: '', serialNumber: '', inventoryNumber: '', nomeNaRede: '', macAddressWIFI: '', macAddressCabo: '', purchaseDate: new Date().toISOString().split('T')[0], warrantyEndDate: '', invoiceNumber: '', requisitionNumber: '',
        status: EquipmentStatus.Stock,
        criticality: CriticalityLevel.Low,
        confidentiality: CIARating.Low,
        integrity: CIARating.Low,
        availability: CIARating.Low,
        supplier_id: '',
        acquisitionCost: 0,
        expectedLifespanYears: 4,
        embedded_license_key: '',
        installationLocation: '',
        isLoan: false,
        parent_equipment_id: '',
        os_version: '',
        last_security_update: '',
        firmware_version: '',
        wwan_address: '',
        bluetooth_address: '',
        usb_thunderbolt_address: '',
        ram_size: '',
        disk_info: '',
        cpu_info: '',
        monitor_info: '',
        manufacture_date: '',
        accounting_category_id: '',
        conservation_state_id: '',
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
    const [allEquipment, setAllEquipment] = useState<Equipment[]>([]); // To select parent
    
    // Assignment Logic
    const [assignToEntityId, setAssignToEntityId] = useState('');
    const [assignToCollaboratorId, setAssignToCollaboratorId] = useState('');
    
    const aiConfigured = isAiConfigured();

    // Fetch all equipment to populate parent dropdown
    useEffect(() => {
        const loadEq = async () => {
            try {
                const data = await dataService.fetchAllData();
                setAllEquipment(data.equipment.filter((e: Equipment) => !equipmentToEdit || e.id !== equipmentToEdit.id)); // exclude self
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
                purchaseDate: equipmentToEdit.purchaseDate || new Date().toISOString().split('T')[0],
                parent_equipment_id: equipmentToEdit.parent_equipment_id || '',
                accounting_category_id: equipmentToEdit.accounting_category_id || '',
                conservation_state_id: equipmentToEdit.conservation_state_id || '',
                residual_value: equipmentToEdit.residual_value || 0
            });
        } else if (initialData) {
             setFormData(prev => ({ ...prev, ...initialData }));
             if ((initialData as any)?.entidadeId) setAssignToEntityId((initialData as any).entidadeId);
        }
    }, [equipmentToEdit, initialData]);

    // Auto-fill description based on brand and type for new equipment
    useEffect(() => {
        if (equipmentToEdit?.id) return; 

        const brandName = brands.find(b => b.id === formData.brandId)?.name;
        const typeName = equipmentTypes.find(t => t.id === formData.typeId)?.name;
        
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
    }, [formData.brandId, formData.typeId, brands, equipmentTypes, equipmentToEdit, formData.description]);

    const selectedType = useMemo(() => {
        return equipmentTypes.find(t => t.id === formData.typeId);
    }, [formData.typeId, equipmentTypes]);
    
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
        return collaborators.filter(c => c.entidadeId === assignToEntityId && c.status === CollaboratorStatus.Ativo);
    }, [assignToEntityId, collaborators]);

    const validate = useCallback(() => {
        const newErrors: Record<string, string> = {};
        if (!formData.serialNumber?.trim()) newErrors.serialNumber = "O número de série é obrigatório.";
        if (!formData.brandId) newErrors.brandId = "A marca é obrigatória.";
        if (!formData.typeId) newErrors.typeId = "O tipo é obrigatório.";
        if (!formData.description?.trim()) newErrors.description = "A descrição é obrigatória.";
        if (!formData.purchaseDate) newErrors.purchaseDate = "A data de compra é obrigatória.";
        
        const type = equipmentTypes.find(t => t.id === formData.typeId);
        // Only validate location if strictly required by type
        if (type?.requiresLocation && !formData.installationLocation?.trim()) {
            newErrors.installationLocation = "O local de instalação é obrigatório para este tipo de equipamento.";
        }
        
        if (type?.is_maintenance && !formData.parent_equipment_id) {
            newErrors.parent_equipment_id = "É obrigatório associar o Equipamento Principal para itens de manutenção/consumíveis.";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, equipmentTypes]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value) 
        }));
    };
    
     const handleSetWarranty = (years: number) => {
        if (!formData.purchaseDate) return;
        const purchase = new Date(formData.purchaseDate);
        purchase.setUTCFullYear(purchase.getUTCFullYear() + years);
        const warrantyEnd = purchase.toISOString().split('T')[0];
        setFormData(prev => ({ ...prev, warrantyEndDate: warrantyEnd }));
    };
    
    const handleGenerateName = async () => {
        const prefix = await dataService.getGlobalSetting('equipment_naming_prefix') || 'PC-';
        const digitsStr = await dataService.getGlobalSetting('equipment_naming_digits') || '4';
        const digits = parseInt(digitsStr);
        
        const allEq = await dataService.fetchAllData();
        const equipmentList = allEq.equipment;
        
        let maxNum = 0;
        const regex = new RegExp(`^${prefix}(\\d{${digits}})$`);
        
        equipmentList.forEach((eq: Equipment) => {
            if (eq.nomeNaRede) {
                const match = eq.nomeNaRede.match(regex);
                if (match && match[1]) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNum) maxNum = num;
                }
            }
        });
        
        const nextNum = maxNum + 1;
        const nextName = `${prefix}${String(nextNum).padStart(digits, '0')}`;
        setFormData(prev => ({ ...prev, nomeNaRede: nextName }));
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
            setFormData(prev => ({
                ...prev,
                serialNumber: serial,
                brandId: matchedBrand ? matchedBrand.id : (prev.brandId || ''),
                typeId: matchedType ? matchedType.id : (prev.typeId || '')
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
        const newBrand = await onSaveBrand({ name: newBrandName.trim() });
        setFormData(prev => ({...prev, brandId: newBrand.id }));
        setNewBrandName('');
        setIsAddingBrand(false);
    };

    const handleAddNewType = async () => {
        if (newTypeName.trim() === '') return;
        const newType = await onSaveEquipmentType({ name: newTypeName.trim() });
        setFormData(prev => ({...prev, typeId: newType.id }));
        setNewTypeName('');
        setIsAddingType(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        setIsSaving(true);
        
        try {
            const dataToSubmit: Partial<Equipment> = { ...formData };
            
            // Clean up optional foreign keys
            if (!dataToSubmit.accounting_category_id) delete dataToSubmit.accounting_category_id;
            if (!dataToSubmit.conservation_state_id) delete dataToSubmit.conservation_state_id;

            let assignment = null;
            if (!equipmentToEdit && assignToEntityId) {
                assignment = {
                    entidadeId: assignToEntityId,
                    collaboratorId: assignToCollaboratorId || undefined,
                    assignedDate: new Date().toISOString().split('T')[0]
                };
            }

            await onSave(dataToSubmit, assignment, undefined); 
            onClose();
        } catch (error: any) {
            console.error("Error saving equipment:", error);
            alert(`Erro ao gravar equipamento: ${error.message || "Verifique os campos."}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const isEditMode = equipmentToEdit && equipmentToEdit.id;
    const modalTitle = isEditMode ? "Editar Equipamento" : "Adicionar Novo Equipamento";
    const submitButtonText = isEditMode ? "Guardar Alterações" : "Adicionar Equipamento";

    return (
        <Modal title={modalTitle} onClose={onClose} maxWidth="max-w-3xl">
            {isScanning && <CameraScanner onCapture={handleScanComplete} onClose={() => setIsScanning(false)} />}
            <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto max-h-[80vh] pr-2 custom-scrollbar">
                 
                 {/* --- ACTION BAR (Only in Edit Mode) --- */}
                 {isEditMode && equipmentToEdit && (
                    <div className="flex gap-3 mb-6 bg-gray-900/50 p-3 rounded border border-gray-700 overflow-x-auto">
                        {onOpenHistory && (
                            <button 
                                type="button" 
                                onClick={() => onOpenHistory(equipmentToEdit)} 
                                className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded whitespace-nowrap transition-colors"
                            >
                                <FaHistory /> Histórico & Impacto
                            </button>
                        )}
                        {onManageLicenses && (
                            <button 
                                type="button" 
                                onClick={() => onManageLicenses(equipmentToEdit)} 
                                className="flex items-center gap-2 px-3 py-2 bg-yellow-700 hover:bg-yellow-600 text-white text-xs rounded whitespace-nowrap transition-colors"
                            >
                                <FaKey /> Gerir Licenças
                            </button>
                        )}
                        {onOpenAssign && (
                            <button 
                                type="button" 
                                onClick={() => onOpenAssign(equipmentToEdit)} 
                                className="flex items-center gap-2 px-3 py-2 bg-green-700 hover:bg-green-600 text-white text-xs rounded whitespace-nowrap transition-colors"
                            >
                                <FaUserCheck /> Atribuir/Desassociar
                            </button>
                        )}
                    </div>
                 )}
                
                {/* Primary Info */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <label htmlFor="serialNumber" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Número de Série</label>
                        <div className="flex">
                            <input type="text" name="serialNumber" id="serialNumber" value={formData.serialNumber} onChange={handleChange} className={`flex-grow bg-gray-700 border text-white rounded-l-md p-2 focus:ring-brand-secondary focus:border-brand-secondary ${errors.serialNumber ? 'border-red-500' : 'border-gray-600'}`} />
                            <button type="button" onClick={() => setIsScanning(true)} disabled={!aiConfigured} className={`p-2 bg-brand-primary text-white hover:bg-brand-secondary transition-colors ${!aiConfigured ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {isLoading.serial ? <SpinnerIcon /> : <CameraIcon />}
                            </button>
                             <button type="button" onClick={() => handleFetchInfo(formData.serialNumber!)} disabled={!formData.serialNumber || isLoading.info || !aiConfigured} className={`p-2 bg-gray-600 text-white rounded-r-md hover:bg-gray-500 transition-colors disabled:opacity-50 ${!aiConfigured ? 'cursor-not-allowed' : ''}`}>
                                {isLoading.info ? <SpinnerIcon /> : <SearchIcon />}
                            </button>
                        </div>
                         {errors.serialNumber && <p className="text-red-400 text-xs italic mt-1">{errors.serialNumber}</p>}
                    </div>
                     <div>
                        <label htmlFor="brandId" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Marca</label>
                        {isAddingBrand ? (
                            <div className="flex gap-2">
                                <input type="text" value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} placeholder="Nome da nova marca" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewBrand(); }}} />
                                <button type="button" onClick={handleAddNewBrand} className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700"><CheckIcon/></button>
                                <button type="button" onClick={() => { setIsAddingBrand(false); setNewBrandName(''); }} className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700"><XIcon/></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <select name="brandId" id="brandId" value={formData.brandId} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.brandId ? 'border-red-500' : 'border-gray-600'}`}>
                                    <option value="" disabled>Selecione uma marca</option>
                                    {brands.map(brand => (<option key={brand.id} value={brand.id}>{brand.name}</option>))}
                                </select>
                                <button type="button" onClick={() => setIsAddingBrand(true)} className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"><PlusIcon className="h-5 w-5"/></button>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Type & Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="typeId" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Tipo</label>
                        {isAddingType ? (
                            <div className="flex gap-2">
                                <input type="text" value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} placeholder="Nome do novo tipo" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewType(); }}} />
                                <button type="button" onClick={handleAddNewType} className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700"><CheckIcon/></button>
                                <button type="button" onClick={() => { setIsAddingType(false); setNewTypeName(''); }} className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700"><XIcon/></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <select name="typeId" id="typeId" value={formData.typeId} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.typeId ? 'border-red-500' : 'border-gray-600'}`}>
                                    <option value="" disabled>Selecione um tipo</option>
                                    {equipmentTypes.map(type => (<option key={type.id} value={type.id}>{type.name}</option>))}
                                </select>
                                 <button type="button" onClick={() => setIsAddingType(true)} className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"><PlusIcon className="h-5 w-5"/></button>
                            </div>
                        )}
                    </div>
                    {selectedType?.requiresNomeNaRede && (
                        <div>
                            <label htmlFor="nomeNaRede" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nome na Rede (Opcional)</label>
                            <div className="flex">
                                <input type="text" name="nomeNaRede" id="nomeNaRede" value={formData.nomeNaRede} onChange={handleChange} className="flex-grow bg-gray-700 border border-gray-600 text-white rounded-l-md p-2" />
                                <button type="button" onClick={handleGenerateName} className="bg-gray-600 hover:bg-gray-500 px-3 rounded-r-md border border-gray-600 text-white flex items-center justify-center"><FaMagic /></button>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Maintenance / Component Logic */}
                {isMaintenanceType && (
                     <div className="bg-orange-900/20 p-4 rounded border border-orange-500/30 animate-fade-in">
                        <h3 className="text-sm font-bold text-orange-200 mb-2 flex items-center gap-2"><FaTools /> Componente de Manutenção</h3>
                        <p className="text-xs text-gray-400 mb-3">
                            Este item é identificado como um componente ou consumível. Deve ser associado a um equipamento principal para cálculo correto do Custo Total de Propriedade (TCO).
                        </p>
                        <label htmlFor="parent_equipment_id" className="block text-xs font-medium text-white mb-1">Equipamento Principal (Pai)</label>
                        <select 
                            name="parent_equipment_id" 
                            id="parent_equipment_id" 
                            value={formData.parent_equipment_id} 
                            onChange={handleChange} 
                            className={`w-full bg-gray-700 border text-white rounded-md p-2 text-sm ${errors.parent_equipment_id ? 'border-red-500' : 'border-gray-600'}`}
                        >
                            <option value="">-- Selecione o equipamento onde será instalado --</option>
                            {allEquipment.map(eq => (
                                <option key={eq.id} value={eq.id}>
                                    {eq.description} (S/N: {eq.serialNumber})
                                </option>
                            ))}
                        </select>
                        {errors.parent_equipment_id && <p className="text-red-400 text-xs italic mt-1">{errors.parent_equipment_id}</p>}
                    </div>
                )}
                
                {/* --- HARDWARE SPECIFICATIONS SECTION --- */}
                {(selectedType?.requires_cpu_info || selectedType?.requires_ram_size || selectedType?.requires_disk_info || selectedType?.requires_manufacture_date) && (
                    <div className="border-t border-gray-600 pt-4 mt-4 animate-fade-in">
                        <h3 className="text-lg font-medium text-on-surface-dark mb-2 flex items-center gap-2">
                            <FaMicrochip className="text-purple-400" />
                            Especificações de Hardware
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {selectedType?.requires_cpu_info && (
                                <div>
                                    <label htmlFor="cpu_info" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Processador (CPU)</label>
                                    <input type="text" name="cpu_info" id="cpu_info" value={formData.cpu_info || ''} onChange={handleChange} placeholder="Ex: Intel Core i7-1185G7" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                                </div>
                            )}
                            {selectedType?.requires_ram_size && (
                                <div>
                                    <label htmlFor="ram_size" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Memória RAM</label>
                                    <input type="text" name="ram_size" id="ram_size" value={formData.ram_size || ''} onChange={handleChange} placeholder="Ex: 16 GB" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                                </div>
                            )}
                            {selectedType?.requires_disk_info && (
                                <div>
                                    <label htmlFor="disk_info" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Disco / Armazenamento</label>
                                    <input type="text" name="disk_info" id="disk_info" value={formData.disk_info || ''} onChange={handleChange} placeholder="Ex: 512 GB SSD NVMe" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                                </div>
                            )}
                             {selectedType?.requires_manufacture_date && (
                                <div>
                                    <label htmlFor="manufacture_date" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Data de Fabrico (BIOS Date)</label>
                                    <input type="date" name="manufacture_date" id="manufacture_date" value={formData.manufacture_date || ''} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Only show Location field if the selected type requires it OR if it's already filled (legacy data) */}
                {(selectedType?.requiresLocation || formData.installationLocation) && (
                    <div>
                        <label htmlFor="installationLocation" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">
                            Local de Instalação (Físico) {selectedType?.requiresLocation && <span className="text-red-400">*</span>}
                        </label>
                        <input 
                            type="text" 
                            name="installationLocation" 
                            id="installationLocation" 
                            value={formData.installationLocation} 
                            onChange={handleChange} 
                            placeholder="Ex: Sala 204, Rack 3" 
                            className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.installationLocation ? 'border-red-500' : 'border-gray-600'}`} 
                        />
                         {errors.installationLocation && <p className="text-red-400 text-xs italic mt-1">{errors.installationLocation}</p>}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {selectedType?.requiresInventoryNumber && (
                        <div>
                            <label htmlFor="inventoryNumber" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Número de Inventário / Etiqueta</label>
                            <input type="text" name="inventoryNumber" id="inventoryNumber" value={formData.inventoryNumber} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" placeholder="Etiqueta física (se diferente de contabilidade)" />
                        </div>
                    )}
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Estado Operacional</label>
                        <select name="status" id="status" value={formData.status} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                {/* Loan Checkbox */}
                <div className="bg-purple-900/20 p-3 rounded border border-purple-500/30">
                     <label className="flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            name="isLoan" 
                            checked={formData.isLoan} 
                            onChange={handleChange} 
                            className="h-4 w-4 rounded border-gray-300 bg-gray-700 text-brand-primary focus:ring-brand-secondary" 
                        />
                        <span className="ml-2 text-sm font-bold text-purple-200 flex items-center gap-2">
                             <FaHandHoldingHeart /> Equipamento de Empréstimo / Pool
                        </span>
                    </label>
                    <p className="text-xs text-gray-400 ml-6 mt-1">
                        Se marcado, ao ser atribuído, o estado ficará "Empréstimo" em vez de "Operacional".
                    </p>
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Descrição</label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.description ? 'border-red-500' : 'border-gray-600'}`}></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {selectedType?.requiresMacWIFI && (
                        <div>
                            <label htmlFor="macAddressWIFI" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Endereço MAC WIFI (Opcional)</label>
                            <input type="text" name="macAddressWIFI" id="macAddressWIFI" value={formData.macAddressWIFI} onChange={handleChange} placeholder="00:1A:2B:3C:4D:5E" className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.macAddressWIFI ? 'border-red-500' : 'border-gray-600'}`} />
                        </div>
                     )}
                     {selectedType?.requiresMacCabo && (
                        <div>
                            <label htmlFor="macAddressCabo" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Endereço MAC Cabo (Opcional)</label>
                            <input type="text" name="macAddressCabo" id="macAddressCabo" value={formData.macAddressCabo} onChange={handleChange} placeholder="00:1A:2B:3C:4D:5F" className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.macAddressCabo ? 'border-red-500' : 'border-gray-600'}`} />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {selectedType?.requires_wwan_address && (
                        <div>
                            <label htmlFor="wwan_address" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Endereço WWAN (LTE/5G)</label>
                            <input type="text" name="wwan_address" id="wwan_address" value={formData.wwan_address} onChange={handleChange} placeholder="Ex: IMEI ou MAC" className={`w-full bg-gray-700 border text-white rounded-md p-2 ${(errors as any).wwan_address ? 'border-red-500' : 'border-gray-600'}`} />
                        </div>
                     )}
                     {selectedType?.requires_bluetooth_address && (
                        <div>
                            <label htmlFor="bluetooth_address" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Endereço Bluetooth</label>
                            <input type="text" name="bluetooth_address" id="bluetooth_address" value={formData.bluetooth_address} onChange={handleChange} placeholder="MAC Address" className={`w-full bg-gray-700 border text-white rounded-md p-2 ${(errors as any).bluetooth_address ? 'border-red-500' : 'border-gray-600'}`} />
                        </div>
                    )}
                     {selectedType?.requires_usb_thunderbolt_address && (
                        <div>
                            <label htmlFor="usb_thunderbolt_address" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Endereço USB/Thunderbolt</label>
                            <input type="text" name="usb_thunderbolt_address" id="usb_thunderbolt_address" value={formData.usb_thunderbolt_address} onChange={handleChange} placeholder="MAC Address (se aplicável)" className={`w-full bg-gray-700 border text-white rounded-md p-2 ${(errors as any).usb_thunderbolt_address ? 'border-red-500' : 'border-gray-600'}`} />
                        </div>
                    )}
                </div>


                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="purchaseDate" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Data de Compra</label>
                        <input type="date" name="purchaseDate" id="purchaseDate" value={formData.purchaseDate} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.purchaseDate ? 'border-red-500' : 'border-gray-600'}`} />
                    </div>
                     <div>
                        <label htmlFor="invoiceNumber" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Número da Fatura (Opcional)</label>
                        <input type="text" name="invoiceNumber" id="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="requisitionNumber" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Número da Requisição (Opcional)</label>
                        <input type="text" name="requisitionNumber" id="requisitionNumber" value={formData.requisitionNumber} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" placeholder="Nº Requisição Interna" />
                    </div>
                    <div>
                        <label htmlFor="warrantyEndDate" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Fim da Garantia (Opcional)</label>
                        <div className="flex items-center gap-2">
                            <input type="date" name="warrantyEndDate" id="warrantyEndDate" value={formData.warrantyEndDate} onChange={handleChange} className="w-full bg-gray-700 border text-white rounded-md p-2" />
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
                
                {/* --- NEW: Contabilidade & Património --- */}
                <div className="border-t border-gray-600 pt-4 mt-4 bg-gray-900/30 p-3 rounded">
                    <h3 className="text-lg font-medium text-on-surface-dark mb-2 flex items-center gap-2">
                        <FaLandmark className="text-yellow-500" />
                        Contabilidade & Património (Legal)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                    <option key={c.id} value={c.id}>{c.name}</option>
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
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="residual_value" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Valor Residual Estimado (€)</label>
                            <input type="number" name="residual_value" id="residual_value" value={formData.residual_value} onChange={handleChange} min="0" step="0.01" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                        </div>
                    </div>
                </div>

                {/* --- NEW: Detalhes de Sistema & Segurança --- */}
                <div className="border-t border-gray-600 pt-4 mt-4">
                    <h3 className="text-lg font-medium text-on-surface-dark mb-2 flex items-center gap-2">
                        <FaShieldAlt className="text-green-400" />
                        Detalhes de Sistema & Segurança
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="os_version" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Versão do SO</label>
                            <input type="text" name="os_version" id="os_version" value={formData.os_version} onChange={handleChange} placeholder="Ex: Windows 11 Pro 23H2" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                        </div>
                        <div>
                            <label htmlFor="last_security_update" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Último Patch de Segurança</label>
                            <input type="date" name="last_security_update" id="last_security_update" value={formData.last_security_update} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                        </div>
                        <div>
                            <label htmlFor="firmware_version" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Versão do Firmware</label>
                            <input type="text" name="firmware_version" id="firmware_version" value={formData.firmware_version} onChange={handleChange} placeholder="Ex: 1.2.3" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                        </div>
                    </div>
                </div>

                {/* --- NEW: INITIAL ASSIGNMENT SECTION --- */}
                {!isEditMode && isComputingDevice && !isMaintenanceType && (
                    <div className="border-t border-gray-600 pt-4 mt-4">
                        <h3 className="text-lg font-medium text-on-surface-dark mb-2 flex items-center gap-2">
                            <FaUserTag className="text-blue-400" />
                            Atribuição Inicial (Opcional)
                        </h3>
                        <div className="bg-gray-800/50 p-3 rounded border border-gray-600 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-on-surface-dark-secondary mb-1">Entidade</label>
                                <select value={assignToEntityId} onChange={(e) => { setAssignToEntityId(e.target.value); setAssignToCollaboratorId(''); }} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm">
                                    <option value="">-- Em Stock (Sem Atribuição) --</option>
                                    {entidades.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-on-surface-dark-secondary mb-1">Colaborador</label>
                                <select value={assignToCollaboratorId} onChange={(e) => setAssignToCollaboratorId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm disabled:bg-gray-800 disabled:cursor-not-allowed" disabled={!assignToEntityId}>
                                    <option value="">-- Atribuir apenas à Localização --</option>
                                    {filteredCollaborators.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* FinOps Section */}
                <div className="border-t border-gray-600 pt-4 mt-4">
                    <h3 className="text-lg font-medium text-on-surface-dark mb-2 flex items-center gap-2">
                        <FaEuroSign className="text-green-400" />
                        Gestão Financeira (FinOps)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="acquisitionCost" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Custo de Aquisição (€)</label>
                            <input type="number" name="acquisitionCost" id="acquisitionCost" value={formData.acquisitionCost} onChange={handleChange} placeholder="0.00" min="0" step="0.01" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                        </div>
                        <div>
                            <label htmlFor="expectedLifespanYears" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Vida Útil Esperada (Anos)</label>
                            <input type="number" name="expectedLifespanYears" id="expectedLifespanYears" value={formData.expectedLifespanYears} onChange={handleChange} min="1" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                        </div>
                    </div>
                </div>

                {/* NIS2 Compliance Section */}
                <div className="border-t border-gray-600 pt-4 mt-4">
                    <h3 className="text-lg font-medium text-on-surface-dark mb-2 flex items-center gap-2">
                        <FaShieldAlt className="text-yellow-400" />
                        Classificação de Risco & Conformidade (NIS2)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="criticality" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nível de Criticidade</label>
                            <select name="criticality" id="criticality" value={formData.criticality} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                {criticalities.map(level => (<option key={level} value={level}>{level}</option>))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="confidentiality" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Confidencialidade</label>
                            <select name="confidentiality" id="confidentiality" value={formData.confidentiality} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                {ciaRatings.map(rating => (<option key={rating} value={rating}>{rating}</option>))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="integrity" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Integridade</label>
                            <select name="integrity" id="integrity" value={formData.integrity} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                {ciaRatings.map(rating => (<option key={rating} value={rating}>{rating}</option>))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="availability" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Disponibilidade</label>
                            <select name="availability" id="availability" value={formData.availability} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                {ciaRatings.map(rating => (<option key={rating} value={rating}>{rating}</option>))}
                            </select>
                        </div>
                    </div>
                </div>
                
                {showKitButton && !isEditMode && (
                    <div className="pt-4 mt-4 border-t border-gray-600">
                        <button type="button" onClick={() => onOpenKitModal(formData)} className="w-full flex items-center justify-center gap-3 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors">
                            <FaBoxes />
                            Criar um Posto de Trabalho a partir deste item
                        </button>
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500" disabled={isSaving}>Cancelar</button>
                    <button 
                        type="submit" 
                        disabled={isSaving}
                        className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <SpinnerIcon className="h-4 w-4" /> : null}
                        {isSaving ? 'A Gravar...' : submitButtonText}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddEquipmentModal;
