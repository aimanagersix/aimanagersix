import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Modal from './common/Modal';
import { Equipment, EquipmentType, Brand } from '../types';
import { extractTextFromImage, getDeviceInfoFromText } from '../services/geminiService';
import { CameraIcon, SearchIcon, SpinnerIcon, PlusIcon, XIcon, CheckIcon, FaBoxes } from './common/Icons';
import { FaExclamationTriangle } from 'react-icons/fa';

interface AddEquipmentModalProps {
    onClose: () => void;
    onSave: (equipment: Omit<Equipment, 'id' | 'modifiedDate' | 'status' | 'creationDate'> | Equipment) => Promise<any>;
    brands: Brand[];
    equipmentTypes: EquipmentType[];
    equipmentToEdit?: Equipment | null;
    onSaveBrand: (brand: Omit<Brand, 'id'>) => Promise<Brand>;
    onSaveEquipmentType: (type: Omit<EquipmentType, 'id'>) => Promise<EquipmentType>;
    onOpenKitModal: (initialData: Partial<Equipment>) => void;
}

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

const AddEquipmentModal: React.FC<AddEquipmentModalProps> = ({ onClose, onSave, brands, equipmentTypes, equipmentToEdit, onSaveBrand, onSaveEquipmentType, onOpenKitModal }) => {
    const [formData, setFormData] = useState<Partial<Equipment>>({
        brandId: '', typeId: '', description: '', serialNumber: '', inventoryNumber: '', nomeNaRede: '', macAddressWIFI: '', macAddressCabo: '', purchaseDate: new Date().toISOString().split('T')[0], warrantyEndDate: '', invoiceNumber: '', vpnEnabled: false, ddnsAddress: '', ddnsUser: '', ddnsPassword: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isScanning, setIsScanning] = useState(false);
    const [isLoading, setIsLoading] = useState({ serial: false, info: false });
    const [isAddingBrand, setIsAddingBrand] = useState(false);
    const [newBrandName, setNewBrandName] = useState('');
    const [isAddingType, setIsAddingType] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');
    const [showKitButton, setShowKitButton] = useState(false);


    useEffect(() => {
        if (equipmentToEdit) {
            setFormData({
                brandId: equipmentToEdit.brandId,
                typeId: equipmentToEdit.typeId,
                description: equipmentToEdit.description,
                serialNumber: equipmentToEdit.serialNumber,
                inventoryNumber: equipmentToEdit.inventoryNumber || '',
                nomeNaRede: equipmentToEdit.nomeNaRede || '',
                macAddressWIFI: equipmentToEdit.macAddressWIFI || '',
                macAddressCabo: equipmentToEdit.macAddressCabo || '',
                purchaseDate: equipmentToEdit.purchaseDate,
                warrantyEndDate: equipmentToEdit.warrantyEndDate || '',
                invoiceNumber: equipmentToEdit.invoiceNumber || '',
                creationDate: equipmentToEdit.creationDate,
                vpnEnabled: equipmentToEdit.vpnEnabled || false,
                ddnsAddress: equipmentToEdit.ddnsAddress || '',
                ddnsUser: equipmentToEdit.ddnsUser || '',
                ddnsPassword: equipmentToEdit.ddnsPassword || '',
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
                vpnEnabled: false,
                ddnsAddress: '',
                ddnsUser: '',
                ddnsPassword: '',
            });
        }
    }, [equipmentToEdit, brands, equipmentTypes]);

    // Auto-fill description based on brand and type for new equipment
    useEffect(() => {
        if (equipmentToEdit) return; // Only for new equipment

        const brandName = brands.find(b => b.id === formData.brandId)?.name;
        const typeName = equipmentTypes.find(t => t.id === formData.typeId)?.name;
        
        const isDescriptionDefaultOrEmpty = () => {
            const currentDesc = (formData.description || '').trim();
            if (currentDesc === '') return true;
            // Check if it matches any possible combination of brand + type to allow re-triggering if user clears field
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
    // Listen to description changes to allow re-triggering if user clears the field.
    }, [formData.brandId, formData.typeId, brands, equipmentTypes, equipmentToEdit, formData.description]);

    const selectedType = useMemo(() => {
        return equipmentTypes.find(t => t.id === formData.typeId);
    }, [formData.typeId, equipmentTypes]);

     useEffect(() => {
        if (formData.typeId) {
            const type = equipmentTypes.find(t => t.id === formData.typeId);
            const typeName = type?.name.toLowerCase() || '';
            setShowKitButton(['desktop', 'laptop', 'portátil'].includes(typeName));
        } else {
            setShowKitButton(false);
        }
    }, [formData.typeId, equipmentTypes]);

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
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
            ddnsAddress: formData.ddnsAddress || undefined,
            ddnsUser: formData.ddnsUser || undefined,
            ddnsPassword: formData.ddnsPassword || undefined,
        };

        if (equipmentToEdit) {
            onSave({ ...equipmentToEdit, ...dataToSubmit });
        } else {
// FIX: The `dataToSubmit` object, derived from `Partial<Equipment>`, may not satisfy the stricter
// `Omit<Equipment, ...>` type because its required properties are considered optional.
// Since the `validate` function ensures these properties exist, we can safely cast the object
// to the expected type to resolve the TypeScript error.
            onSave(dataToSubmit as Omit<Equipment, 'id' | 'modifiedDate' | 'status' | 'creationDate'>);
        }
        onClose();
    };
    
    const modalTitle = equipmentToEdit ? "Editar Equipamento" : "Adicionar Novo Equipamento";
    const submitButtonText = equipmentToEdit ? "Salvar Alterações" : "Adicionar";

    return (
        <Modal title={modalTitle} onClose={onClose}>
            {isScanning && <CameraScanner onCapture={handleScanComplete} onClose={() => setIsScanning(false)} />}
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <label htmlFor="serialNumber" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Número de Série</label>
                        <div className="flex">
                            <input type="text" name="serialNumber" id="serialNumber" value={formData.serialNumber} onChange={handleChange} className={`flex-grow bg-gray-700 border text-white rounded-l-md p-2 focus:ring-brand-secondary focus:border-brand-secondary ${errors.serialNumber ? 'border-red-500' : 'border-gray-600'}`} />
                            <button type="button" onClick={() => setIsScanning(true)} className="p-2 bg-brand-primary text-white hover:bg-brand-secondary transition-colors">
                                {isLoading.serial ? <SpinnerIcon /> : <CameraIcon />}
                            </button>
                             <button type="button" onClick={() => handleFetchInfo(formData.serialNumber!)} disabled={!formData.serialNumber || isLoading.info} className="p-2 bg-gray-600 text-white rounded-r-md hover:bg-gray-500 transition-colors disabled:opacity-50">
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
                 {equipmentToEdit && (
                    <div>
                        <label htmlFor="creationDate" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Data de Criação</label>
                        <input 
                            type="date" 
                            id="creationDate" 
                            value={equipmentToEdit.creationDate} 
                            disabled 
                            className="w-full bg-gray-800 border border-gray-600 text-on-surface-dark-secondary rounded-md p-2 cursor-not-allowed" 
                        />
                    </div>
                )}
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

                {(selectedType?.requiresVPN || selectedType?.requiresDDNS) && (
                    <div className="border-t border-gray-600 pt-4 mt-4 space-y-4">
                        {selectedType?.requiresVPN && (
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="vpnEnabled"
                                    id="vpnEnabled"
                                    checked={formData.vpnEnabled}
                                    onChange={handleChange}
                                    className="h-4 w-4 rounded border-gray-300 bg-gray-700 text-brand-primary focus:ring-brand-secondary"
                                />
                                <label htmlFor="vpnEnabled" className="ml-3 block text-sm font-medium text-on-surface-dark-secondary">
                                    VPN Ativada
                                </label>
                            </div>
                        )}
                        {selectedType?.requiresDDNS && (
                            <>
                                <h3 className="text-md font-medium text-on-surface-dark">Configuração DDNS</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label htmlFor="ddnsAddress" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Endereço DDNS</label>
                                        <input type="text" name="ddnsAddress" id="ddnsAddress" value={formData.ddnsAddress} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                                    </div>
                                    <div>
                                        <label htmlFor="ddnsUser" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Utilizador DDNS</label>
                                        <input type="text" name="ddnsUser" id="ddnsUser" value={formData.ddnsUser} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                                    </div>
                                    <div>
                                        <label htmlFor="ddnsPassword" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Password DDNS</label>
                                        <input type="password" name="ddnsPassword" id="ddnsPassword" value={formData.ddnsPassword} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
                
                {showKitButton && (
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