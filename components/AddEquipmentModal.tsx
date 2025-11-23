
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Modal from './common/Modal';
import { Equipment, EquipmentType, Brand, CriticalityLevel, CIARating, Supplier, SoftwareLicense, Entidade, Collaborator, CollaboratorStatus, ConfigItem, EquipmentStatus } from '../types';
import { extractTextFromImage, getDeviceInfoFromText, isAiConfigured } from '../services/geminiService';
import { CameraIcon, SearchIcon, SpinnerIcon, PlusIcon, XIcon, CheckIcon, FaBoxes, FaShieldAlt } from './common/Icons';
import { FaExclamationTriangle, FaEuroSign, FaWindows, FaUserTag, FaKey } from 'react-icons/fa';

interface AddEquipmentModalProps {
    onClose: () => void;
    onSave: (equipment: Omit<Equipment, 'id' | 'modifiedDate' | 'status' | 'creationDate'> | Equipment, assignment?: any, licenseIds?: string[]) => Promise<any>;
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
}

interface CameraScannerProps {
    onCapture: (dataUrl: string) => void;
    onClose: () => void;
}

const WINDOWS_VERSIONS = [
    "Windows 11 Pro",
    "Windows 11 Home",
    "Windows 11 Enterprise",
    "Windows 10 Pro",
    "Windows 10 Home",
    "Windows 10 Enterprise",
    "Windows Server 2022",
    "Windows Server 2019",
    "macOS Sequoia",
    "macOS Sonoma",
    "Linux (Ubuntu)",
    "Linux (Outro)"
];

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

const AddEquipmentModal: React.FC<AddEquipmentModalProps> = ({ 
    onClose, onSave, brands, equipmentTypes, equipmentToEdit, onSaveBrand, onSaveEquipmentType, onOpenKitModal, 
    suppliers = [], softwareLicenses = [], entidades = [], collaborators = [], 
    statusOptions, criticalityOptions, ciaOptions 
}) => {
    // Use dynamic options if available, else fallback to enum values
    const statuses = statusOptions && statusOptions.length > 0 ? statusOptions.map(o => o.name) : Object.values(EquipmentStatus);
    const criticalities = criticalityOptions && criticalityOptions.length > 0 ? criticalityOptions.map(o => o.name) : Object.values(CriticalityLevel);
    const ciaRatings = ciaOptions && ciaOptions.length > 0 ? ciaOptions.map(o => o.name) : Object.values(CIARating);

    const [formData, setFormData] = useState<Partial<Equipment>>({
        brandId: '', typeId: '', description: '', serialNumber: '', inventoryNumber: '', nomeNaRede: '', macAddressWIFI: '', macAddressCabo: '', purchaseDate: new Date().toISOString().split('T')[0], warrantyEndDate: '', invoiceNumber: '',
        status: EquipmentStatus.Stock,
        criticality: CriticalityLevel.Low,
        confidentiality: CIARating.Low,
        integrity: CIARating.Low,
        availability: CIARating.Low,
        os_version: '',
        last_security_update: '',
        supplier_id: '',
        acquisitionCost: 0,
        expectedLifespanYears: 4,
        embedded_license_key: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isScanning, setIsScanning] = useState(false);
    const [isLoading, setIsLoading] = useState({ serial: false, info: false });
    const [isAddingBrand, setIsAddingBrand] = useState(false);
    const [newBrandName, setNewBrandName] = useState('');
    const [isAddingType, setIsAddingType] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');
    const [showKitButton, setShowKitButton] = useState(false);
    
    // --- New Assignment Logic ---
    const [assignToEntityId, setAssignToEntityId] = useState('');
    const [assignToCollaboratorId, setAssignToCollaboratorId] = useState('');
    
    // --- New License Logic ---
    const [selectedLicenseIds, setSelectedLicenseIds] = useState<Set<string>>(new Set());
    const [selectedOemLicenseId, setSelectedOemLicenseId] = useState('');

    const aiConfigured = isAiConfigured();

    useEffect(() => {
        if (equipmentToEdit) {
            setFormData({
                brandId: equipmentToEdit.brandId || '',
                typeId: equipmentToEdit.typeId || '',
                description: equipmentToEdit.description || '',
                serialNumber: equipmentToEdit.serialNumber || '',
                inventoryNumber: equipmentToEdit.inventoryNumber || '',
                nomeNaRede: equipmentToEdit.nomeNaRede || '',
                macAddressWIFI: equipmentToEdit.macAddressWIFI || '',
                macAddressCabo: equipmentToEdit.macAddressCabo || '',
                purchaseDate: equipmentToEdit.purchaseDate || new Date().toISOString().split('T')[0],
                warrantyEndDate: equipmentToEdit.warrantyEndDate || '',
                invoiceNumber: equipmentToEdit.invoiceNumber || '',
                creationDate: equipmentToEdit.creationDate,
                status: equipmentToEdit.status || EquipmentStatus.Stock,
                criticality: equipmentToEdit.criticality || CriticalityLevel.Low,
                confidentiality: equipmentToEdit.confidentiality || CIARating.Low,
                integrity: equipmentToEdit.integrity || CIARating.Low,
                availability: equipmentToEdit.availability || CIARating.Low,
                os_version: equipmentToEdit.os_version || '',
                last_security_update: equipmentToEdit.last_security_update || '',
                supplier_id: equipmentToEdit.supplier_id || '',
                acquisitionCost: equipmentToEdit.acquisitionCost || 0,
                expectedLifespanYears: equipmentToEdit.expectedLifespanYears || 4,
                embedded_license_key: equipmentToEdit.embedded_license_key || ''
            });
        } else {
            setFormData({
                brandId: brands[0]?.id || '',
                typeId: equipmentTypes[0]?.id || '',
                description: '',
                serialNumber: '',
                inventoryNumber: '',
                nomeNaRede: '',
                macAddressWIFI: '',
                macAddressCabo: '',
                purchaseDate: new Date().toISOString().split('T')[0],
                warrantyEndDate: '',
                invoiceNumber: '',
                status: EquipmentStatus.Stock,
                criticality: CriticalityLevel.Low,
                confidentiality: CIARating.Low,
                integrity: CIARating.Low,
                availability: CIARating.Low,
                os_version: '',
                last_security_update: '',
                supplier_id: '',
                acquisitionCost: 0,
                expectedLifespanYears: 4,
                embedded_license_key: ''
            });
        }
    }, [equipmentToEdit, brands, equipmentTypes]);

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

    // Determine if computing device (for enhanced UI options)
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

    // Filtered Collaborators for Assignment
    const filteredCollaborators = useMemo(() => {
        if (!assignToEntityId) return [];
        return collaborators.filter(c => c.entidadeId === assignToEntityId && c.status === CollaboratorStatus.Ativo);
    }, [assignToEntityId, collaborators]);

    // Filter OEM Licenses
    const oemLicenses = useMemo(() => {
        return softwareLicenses.filter(l => l.is_oem);
    }, [softwareLicenses]);

    // Filter Other Licenses
    const availableVolumeLicenses = useMemo(() => {
        return softwareLicenses.filter(l => !l.is_oem && !selectedLicenseIds.has(l.id));
    }, [softwareLicenses, selectedLicenseIds]);

    const validate = useCallback(() => {
        const newErrors: Record<string, string> = {};
        if (!formData.serialNumber?.trim()) newErrors.serialNumber = "O número de série é obrigatório.";
        if (!formData.brandId) newErrors.brandId = "A marca é obrigatória.";
        if (!formData.typeId) newErrors.typeId = "O tipo é obrigatório.";
        if (!formData.description?.trim()) newErrors.description = "A descrição é obrigatória.";
        if (!formData.purchaseDate) newErrors.purchaseDate = "A data de compra é obrigatória.";
        const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
        if (formData.macAddressWIFI && !macRegex.test(formData.macAddressWIFI)) {
            newErrors.macAddressWIFI = "Formato de endereço MAC inválido.";
        }
        if (formData.macAddressCabo && !macRegex.test(formData.macAddressCabo)) {
            newErrors.macAddressCabo = "Formato de endereço MAC inválido.";
        }
        if (formData.warrantyEndDate && formData.purchaseDate && new Date(formData.warrantyEndDate) < new Date(formData.purchaseDate)) {
            newErrors.warrantyEndDate = "A data de fim da garantia não pode ser anterior à data de compra.";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

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
            alert("Falha ao buscar informações do dispositivo.");
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
            alert("Falha ao analisar a imagem.");
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

    const handleToggleLicense = (licenseId: string) => {
        setSelectedLicenseIds(prev => {
            const next = new Set(prev);
            if (next.has(licenseId)) next.delete(licenseId);
            else next.add(licenseId);
            return next;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        const dataToSubmit = {
            ...formData,
            inventoryNumber: formData.inventoryNumber || undefined,
            invoiceNumber: formData.invoiceNumber || undefined,
            nomeNaRede: formData.nomeNaRede || undefined,
            macAddressWIFI: formData.macAddressWIFI || undefined,
            macAddressCabo: formData.macAddressCabo || undefined,
            warrantyEndDate: formData.warrantyEndDate || undefined,
            os_version: formData.os_version || undefined,
            last_security_update: formData.last_security_update || undefined,
            supplier_id: formData.supplier_id || undefined,
            acquisitionCost: formData.acquisitionCost || 0,
            expectedLifespanYears: formData.expectedLifespanYears || 4,
            embedded_license_key: formData.embedded_license_key || undefined
        };

        // Prepare auxiliary data
        let assignment = null;
        if (assignToEntityId) {
            assignment = {
                entidadeId: assignToEntityId,
                collaboratorId: assignToCollaboratorId || undefined,
                assignedDate: new Date().toISOString().split('T')[0]
            };
        }

        const licenses = Array.from(selectedLicenseIds);
        if (selectedOemLicenseId) licenses.push(selectedOemLicenseId);

        if (equipmentToEdit && equipmentToEdit.id) {
            // Edit mode might need different handling for assignments/licenses if simplified here
            // For now, just update main equipment data
            onSave({ ...equipmentToEdit, ...dataToSubmit }, assignment, licenses);
        } else {
            onSave(dataToSubmit as Omit<Equipment, 'id' | 'modifiedDate' | 'status' | 'creationDate'>, assignment, licenses);
        }
        onClose();
    };
    
    const isEditMode = equipmentToEdit && equipmentToEdit.id;
    const modalTitle = isEditMode ? "Editar Equipamento" : "Adicionar Novo Equipamento";
    const submitButtonText = isEditMode ? "Salvar Alterações" : "Adicionar";

    return (
        <Modal title={modalTitle} onClose={onClose} maxWidth="max-w-3xl">
            {isScanning && <CameraScanner onCapture={handleScanComplete} onClose={() => setIsScanning(false)} />}
            <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto max-h-[80vh] pr-2 custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <label htmlFor="serialNumber" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Número de Série</label>
                        <div className="flex">
                            <input type="text" name="serialNumber" id="serialNumber" value={formData.serialNumber} onChange={handleChange} className={`flex-grow bg-gray-700 border text-white rounded-l-md p-2 focus:ring-brand-secondary focus:border-brand-secondary ${errors.serialNumber ? 'border-red-500' : 'border-gray-600'}`} />
                            <button type="button" onClick={() => setIsScanning(true)} disabled={!aiConfigured} className={`p-2 bg-brand-primary text-white hover:bg-brand-secondary transition-colors ${!aiConfigured ? 'opacity-50 cursor-not-allowed' : ''}`} title={!aiConfigured ? "Scanner IA indisponível (API Key)" : "Scan"}>
                                {isLoading.serial ? <SpinnerIcon /> : <CameraIcon />}
                            </button>
                             <button type="button" onClick={() => handleFetchInfo(formData.serialNumber!)} disabled={!formData.serialNumber || isLoading.info || !aiConfigured} className={`p-2 bg-gray-600 text-white rounded-r-md hover:bg-gray-500 transition-colors disabled:opacity-50 ${!aiConfigured ? 'cursor-not-allowed' : ''}`} title={!aiConfigured ? "Lookup IA indisponível (API Key)" : "Lookup"}>
                                {isLoading.info ? <SpinnerIcon /> : <SearchIcon />}
                            </button>
                        </div>
                         {errors.serialNumber && <p className="text-red-400 text-xs italic mt-1">{errors.serialNumber}</p>}
                    </div>
                     <div>
                        <label htmlFor="brandId" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Marca</label>
                        {isAddingBrand ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newBrandName}
                                    onChange={(e) => setNewBrandName(e.target.value)}
                                    placeholder="Nome da nova marca"
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                                    autoFocus
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewBrand(); }}}
                                />
                                <button type="button" onClick={handleAddNewBrand} className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700" title="Salvar"><CheckIcon/></button>
                                <button type="button" onClick={() => { setIsAddingBrand(false); setNewBrandName(''); }} className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700" title="Cancelar"><XIcon/></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <select name="brandId" id="brandId" value={formData.brandId} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.brandId ? 'border-red-500' : 'border-gray-600'}`}>
                                    <option value="" disabled>Selecione uma marca</option>
                                    {brands.map(brand => (
                                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                                    ))}
                                </select>
                                <button type="button" onClick={() => setIsAddingBrand(true)} className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-500" title="Adicionar nova marca">
                                    <PlusIcon className="h-5 w-5"/>
                                </button>
                            </div>
                        )}
                        {errors.brandId && <p className="text-red-400 text-xs italic mt-1">{errors.brandId}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="typeId" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Tipo</label>
                        {isAddingType ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newTypeName}
                                    onChange={(e) => setNewTypeName(e.target.value)}
                                    placeholder="Nome do novo tipo"
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                                    autoFocus
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewType(); }}}
                                />
                                <button type="button" onClick={handleAddNewType} className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700" title="Salvar"><CheckIcon/></button>
                                <button type="button" onClick={() => { setIsAddingType(false); setNewTypeName(''); }} className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700" title="Cancelar"><XIcon/></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <select name="typeId" id="typeId" value={formData.typeId} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.typeId ? 'border-red-500' : 'border-gray-600'}`}>
                                    <option value="" disabled>Selecione um tipo</option>
                                    {equipmentTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                                 <button type="button" onClick={() => setIsAddingType(true)} className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-500" title="Adicionar novo tipo">
                                    <PlusIcon className="h-5 w-5"/>
                                </button>
                            </div>
                        )}
                        {errors.typeId && <p className="text-red-400 text-xs italic mt-1">{errors.typeId}</p>}
                    </div>
                    {selectedType?.requiresNomeNaRede && (
                        <div>
                            <label htmlFor="nomeNaRede" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nome na Rede (Opcional)</label>
                            <input type="text" name="nomeNaRede" id="nomeNaRede" value={formData.nomeNaRede} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedType?.requiresInventoryNumber && (
                        <div>
                            <label htmlFor="inventoryNumber" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Número de Inventário</label>
                            <input type="text" name="inventoryNumber" id="inventoryNumber" value={formData.inventoryNumber} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                        </div>
                    )}
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Estado</label>
                        <select name="status" id="status" value={formData.status} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Descrição</label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.description ? 'border-red-500' : 'border-gray-600'}`}></textarea>
                    {errors.description && <p className="text-red-400 text-xs italic mt-1">{errors.description}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {selectedType?.requiresMacWIFI && (
                        <div>
                            <label htmlFor="macAddressWIFI" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Endereço MAC WIFI (Opcional)</label>
                            <input type="text" name="macAddressWIFI" id="macAddressWIFI" value={formData.macAddressWIFI} onChange={handleChange} placeholder="00:1A:2B:3C:4D:5E" className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.macAddressWIFI ? 'border-red-500' : 'border-gray-600'}`} />
                            {errors.macAddressWIFI && <p className="text-red-400 text-xs italic mt-1">{errors.macAddressWIFI}</p>}
                        </div>
                     )}
                     {selectedType?.requiresMacCabo && (
                        <div>
                            <label htmlFor="macAddressCabo" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Endereço MAC Cabo (Opcional)</label>
                            <input type="text" name="macAddressCabo" id="macAddressCabo" value={formData.macAddressCabo} onChange={handleChange} placeholder="00:1A:2B:3C:4D:5F" className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.macAddressCabo ? 'border-red-500' : 'border-gray-600'}`} />
                            {errors.macAddressCabo && <p className="text-red-400 text-xs italic mt-1">{errors.macAddressCabo}</p>}
                        </div>
                    )}
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="purchaseDate" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Data de Compra</label>
                        <input type="date" name="purchaseDate" id="purchaseDate" value={formData.purchaseDate} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.purchaseDate ? 'border-red-500' : 'border-gray-600'}`} />
                        {errors.purchaseDate && <p className="text-red-400 text-xs italic mt-1">{errors.purchaseDate}</p>}
                    </div>
                     <div>
                        <label htmlFor="invoiceNumber" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Número da Fatura (Opcional)</label>
                        <input type="text" name="invoiceNumber" id="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="warrantyEndDate" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Fim da Garantia (Opcional)</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                name="warrantyEndDate"
                                id="warrantyEndDate"
                                value={formData.warrantyEndDate}
                                onChange={handleChange}
                                className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.warrantyEndDate ? 'border-red-500' : 'border-gray-600'}`}
                            />
                            <button type="button" onClick={() => handleSetWarranty(2)} className="px-3 py-2 text-sm bg-gray-600 rounded-md hover:bg-gray-500 whitespace-nowrap">2 Anos</button>
                            <button type="button" onClick={() => handleSetWarranty(3)} className="px-3 py-2 text-sm bg-gray-600 rounded-md hover:bg-gray-500 whitespace-nowrap">3 Anos</button>
                        </div>
                        {errors.warrantyEndDate && <p className="text-red-400 text-xs italic mt-1">{errors.warrantyEndDate}</p>}
                    </div>
                    <div>
                        <label htmlFor="supplier_id" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Fornecedor</label>
                        <select 
                            name="supplier_id" 
                            id="supplier_id" 
                            value={formData.supplier_id} 
                            onChange={handleChange} 
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                        >
                            <option value="">-- Selecione Fornecedor --</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* --- NEW: INITIAL ASSIGNMENT SECTION --- */}
                {!isEditMode && isComputingDevice && (
                    <div className="border-t border-gray-600 pt-4 mt-4">
                        <h3 className="text-lg font-medium text-on-surface-dark mb-2 flex items-center gap-2">
                            <FaUserTag className="text-blue-400" />
                            Atribuição Inicial (Opcional)
                        </h3>
                        <div className="bg-gray-800/50 p-3 rounded border border-gray-600 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-on-surface-dark-secondary mb-1">Entidade</label>
                                <select 
                                    value={assignToEntityId} 
                                    onChange={(e) => {
                                        setAssignToEntityId(e.target.value);
                                        setAssignToCollaboratorId('');
                                    }} 
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"
                                >
                                    <option value="">-- Em Stock (Sem Atribuição) --</option>
                                    {entidades.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-on-surface-dark-secondary mb-1">Colaborador</label>
                                <select 
                                    value={assignToCollaboratorId} 
                                    onChange={(e) => setAssignToCollaboratorId(e.target.value)} 
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm disabled:bg-gray-800 disabled:cursor-not-allowed"
                                    disabled={!assignToEntityId}
                                >
                                    <option value="">-- Atribuir à Localização --</option>
                                    {filteredCollaborators.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- NEW: SOFTWARE & OS SECTION --- */}
                {isComputingDevice && (
                    <div className="border-t border-gray-600 pt-4 mt-4">
                        <h3 className="text-lg font-medium text-on-surface-dark mb-2 flex items-center gap-2">
                            <FaWindows className="text-blue-400" />
                            Software & Sistema Operativo
                        </h3>
                        
                        <div className="bg-gray-800/50 p-3 rounded border border-gray-600 space-y-4">
                            {/* OEM License Selection */}
                            <div>
                                <label className="block text-xs font-medium text-on-surface-dark-secondary mb-1">Sistema Operativo (Licença OEM/Volume)</label>
                                <div className="flex gap-2 items-center">
                                    <select 
                                        value={selectedOemLicenseId} 
                                        onChange={(e) => setSelectedOemLicenseId(e.target.value)} 
                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"
                                    >
                                        <option value="">-- Selecione Sistema Operativo --</option>
                                        {oemLicenses.map(l => (
                                            <option key={l.id} value={l.id}>{l.productName} ({l.licenseKey})</option>
                                        ))}
                                    </select>
                                    {selectedOemLicenseId && (
                                        <button type="button" onClick={() => setSelectedOemLicenseId('')} className="text-red-400 hover:text-red-300 p-2" title="Limpar seleção">
                                            <XIcon className="h-4 w-4"/>
                                        </button>
                                    )}
                                </div>
                                {selectedOemLicenseId && (
                                    <div className="mt-2">
                                        <label htmlFor="embedded_license_key" className="block text-[10px] font-medium text-gray-400 mb-1">Chave Específica deste PC (BIOS/Autocolante) - Opcional</label>
                                        <input 
                                            type="text" 
                                            name="embedded_license_key" 
                                            value={formData.embedded_license_key} 
                                            onChange={handleChange} 
                                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-1.5 text-xs font-mono" 
                                            placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Additional Licenses */}
                            <div>
                                <label className="block text-xs font-medium text-on-surface-dark-secondary mb-1">Software Adicional (Office, Adobe, etc.)</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {Array.from(selectedLicenseIds).map(id => {
                                        const lic = softwareLicenses.find(l => l.id === id);
                                        return lic ? (
                                            <span key={id} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-900/30 text-blue-200 border border-blue-500/30">
                                                <FaKey className="h-3 w-3"/> {lic.productName}
                                                <button type="button" onClick={() => handleToggleLicense(id)} className="ml-1 hover:text-white"><XIcon className="h-3 w-3"/></button>
                                            </span>
                                        ) : null;
                                    })}
                                </div>
                                <select 
                                    onChange={(e) => { if (e.target.value) handleToggleLicense(e.target.value); e.target.value = ''; }} 
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"
                                >
                                    <option value="">+ Adicionar Licença...</option>
                                    {availableVolumeLicenses.map(l => (
                                        <option key={l.id} value={l.id}>{l.productName} ({l.totalSeats} vagas)</option>
                                    ))}
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
                            <input 
                                type="number" 
                                name="acquisitionCost" 
                                id="acquisitionCost" 
                                value={formData.acquisitionCost} 
                                onChange={handleChange} 
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" 
                            />
                        </div>
                        <div>
                            <label htmlFor="expectedLifespanYears" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Vida Útil Esperada (Anos)</label>
                            <input 
                                type="number" 
                                name="expectedLifespanYears" 
                                id="expectedLifespanYears" 
                                value={formData.expectedLifespanYears} 
                                onChange={handleChange} 
                                min="1"
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" 
                            />
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
                            <select 
                                name="criticality" 
                                id="criticality" 
                                value={formData.criticality} 
                                onChange={handleChange} 
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                            >
                                {criticalities.map(level => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="confidentiality" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Confidencialidade</label>
                            <select 
                                name="confidentiality" 
                                id="confidentiality" 
                                value={formData.confidentiality} 
                                onChange={handleChange} 
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                            >
                                {ciaRatings.map(rating => (
                                    <option key={rating} value={rating}>{rating}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="integrity" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Integridade</label>
                            <select 
                                name="integrity" 
                                id="integrity" 
                                value={formData.integrity} 
                                onChange={handleChange} 
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                            >
                                {ciaRatings.map(rating => (
                                    <option key={rating} value={rating}>{rating}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="availability" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Disponibilidade</label>
                            <select 
                                name="availability" 
                                id="availability" 
                                value={formData.availability} 
                                onChange={handleChange} 
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                            >
                                {ciaRatings.map(rating => (
                                    <option key={rating} value={rating}>{rating}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                
                {showKitButton && !isEditMode && (
                    <div className="pt-4 mt-4 border-t border-gray-600">
                        <button
                            type="button"
                            onClick={() => onOpenKitModal(formData)}
                            className="w-full flex items-center justify-center gap-3 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors"
                        >
                            <FaBoxes />
                            Criar um Posto de Trabalho a partir deste item
                        </button>
                    </div>
                )}


                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">{submitButtonText}</button>
                </div>
            </form>
        </Modal>
    );
};

export default AddEquipmentModal;
