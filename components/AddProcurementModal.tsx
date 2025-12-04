
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Modal from './common/Modal';
import { ProcurementRequest, Collaborator, Supplier, ProcurementStatus, UserRole, EquipmentType, ConfigItem, Brand } from '../types';
import { FaSave, FaCheck, FaTimes, FaTruck, FaBoxOpen, FaShoppingCart, FaMicrochip, FaKey, FaPaperclip, FaTags } from 'react-icons/fa';
import { SpinnerIcon, FaTrash as DeleteIcon } from './common/Icons';
import * as dataService from '../services/dataService';

interface AddProcurementModalProps {
    onClose: () => void;
    onSave: (req: Omit<ProcurementRequest, 'id' | 'created_at' | 'updated_at'> | ProcurementRequest) => Promise<void>;
    procurementToEdit?: ProcurementRequest | null;
    currentUser: Collaborator | null;
    collaborators: Collaborator[];
    suppliers: Supplier[];
    equipmentTypes?: EquipmentType[];
    softwareCategories?: ConfigItem[];
}

const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const AddProcurementModal: React.FC<AddProcurementModalProps> = ({ onClose, onSave, procurementToEdit, currentUser, collaborators, suppliers, equipmentTypes = [], softwareCategories = [] }) => {
    
    const [formData, setFormData] = useState<Partial<ProcurementRequest>>({
        title: '',
        description: '',
        quantity: 1,
        estimated_cost: 0,
        requester_id: currentUser?.id || '',
        status: ProcurementStatus.Pending,
        request_date: new Date().toISOString().split('T')[0],
        priority: 'Normal' as 'Normal' | 'Urgente',
        resource_type: 'Hardware', // Default
        specifications: {},
        attachments: [],
        brand_id: ''
    });

    const [attachments, setAttachments] = useState<{ name: string; dataUrl: string; size: number }[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]); // State to load brands
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSaving, setIsSaving] = useState(false);

    const isAdmin = currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.SuperAdmin;

    // Load brands
    useEffect(() => {
        const loadBrands = async () => {
            const data = await dataService.fetchAllData();
            setBrands(data.brands);
        };
        loadBrands();
    }, []);

    useEffect(() => {
        if (procurementToEdit) {
            setFormData({
                ...procurementToEdit,
                specifications: procurementToEdit.specifications || {},
                software_category_id: procurementToEdit.software_category_id || '',
                brand_id: procurementToEdit.brand_id || ''
            });
            if (procurementToEdit.attachments) {
                setAttachments(procurementToEdit.attachments.map(a => ({ ...a, size: 0 })));
            }
        }
    }, [procurementToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSpecChange = (key: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            specifications: {
                ...(prev.specifications || {}),
                [key]: value
            }
        }));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        if (attachments.length + files.length > MAX_FILES) {
            alert(`Não pode anexar mais de ${MAX_FILES} ficheiros.`);
            return;
        }
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.size > MAX_FILE_SIZE) {
                alert(`O ficheiro "${file.name}" é demasiado grande. O limite é de 5MB.`);
                continue;
            }

            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const dataUrl = loadEvent.target?.result as string;
                setAttachments(prev => [...prev, { name: file.name, dataUrl, size: file.size }]);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const handleRemoveAttachment = (indexToRemove: number) => {
        setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    // State Transition Handlers
    const handleApprove = () => {
        setFormData(prev => ({ 
            ...prev, 
            status: ProcurementStatus.Approved, 
            approval_date: new Date().toISOString().split('T')[0],
            approver_id: currentUser?.id
        }));
    };

    const handleReject = () => {
        if (confirm("Tem a certeza que deseja rejeitar este pedido?")) {
            setFormData(prev => ({ ...prev, status: ProcurementStatus.Rejected }));
        }
    };

    const handleOrder = () => {
        if (!formData.supplier_id) {
            alert("Por favor, selecione um fornecedor antes de marcar como Encomendado.");
            return;
        }
        setFormData(prev => ({ 
            ...prev, 
            status: ProcurementStatus.Ordered, 
            order_date: new Date().toISOString().split('T')[0] 
        }));
    };

    const handleReceive = () => {
         setFormData(prev => ({ 
            ...prev, 
            status: ProcurementStatus.Received, 
            received_date: new Date().toISOString().split('T')[0] 
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.quantity) return;

        setIsSaving(true);
        
        const dataToSave = {
            ...formData,
            quantity: Number(formData.quantity),
            estimated_cost: Number(formData.estimated_cost),
            attachments: attachments.map(({ name, dataUrl }) => ({ name, dataUrl }))
        };

        // Cleanup empty strings for UUIDs
        if (!dataToSave.supplier_id) delete dataToSave.supplier_id;
        if (!dataToSave.approver_id) delete dataToSave.approver_id;
        if (!dataToSave.equipment_type_id) delete dataToSave.equipment_type_id;
        if (!dataToSave.software_category_id) delete dataToSave.software_category_id;
        if (!dataToSave.brand_id) delete dataToSave.brand_id;

        try {
            await onSave(procurementToEdit ? { ...procurementToEdit, ...dataToSave } as ProcurementRequest : dataToSave as any);
            onClose();
        } catch(e) {
            console.error(e);
            alert("Erro ao gravar pedido.");
        } finally {
            setIsSaving(false);
        }
    };
    
    // Status Steps Visualization
    const steps: ProcurementStatus[] = [ProcurementStatus.Pending, ProcurementStatus.Approved, ProcurementStatus.Ordered, ProcurementStatus.Received, ProcurementStatus.Completed];
    const currentStepIdx = steps.indexOf(formData.status || ProcurementStatus.Pending);
    const isRejected = formData.status === ProcurementStatus.Rejected;

    const selectedType = equipmentTypes.find(t => t.id === formData.equipment_type_id);

    return (
        <Modal title={procurementToEdit ? "Gerir Pedido de Aquisição" : "Novo Pedido de Aquisição"} onClose={onClose} maxWidth="max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar pr-2">
                
                {/* Progress Bar */}
                {!isRejected && (
                    <div className="flex items-center justify-between mb-6 relative">
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-700 -z-10"></div>
                        {steps.map((step, idx) => (
                            <div key={step} className={`flex flex-col items-center gap-1 ${idx <= currentStepIdx ? 'text-brand-secondary' : 'text-gray-500'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${idx <= currentStepIdx ? 'bg-brand-primary text-white' : 'bg-gray-800 border border-gray-600'}`}>
                                    {idx + 1}
                                </div>
                                <span className="text-xs font-medium">{step}</span>
                            </div>
                        ))}
                    </div>
                )}
                
                {isRejected && (
                    <div className="bg-red-900/20 p-4 rounded border border-red-500/50 text-center text-red-400 font-bold mb-4">
                        PEDIDO REJEITADO
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="text-white font-bold border-b border-gray-700 pb-2">Detalhes do Pedido</h3>
                        
                        <div className="bg-gray-800 p-3 rounded border border-gray-600 mb-4">
                             <label className="block text-xs text-gray-400 mb-2 uppercase">Tipo de Recurso</label>
                             <div className="flex gap-4">
                                <label className={`flex-1 cursor-pointer border p-2 rounded text-center text-sm ${formData.resource_type === 'Hardware' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300'}`}>
                                    <input 
                                        type="radio" 
                                        name="resource_type" 
                                        value="Hardware" 
                                        checked={formData.resource_type === 'Hardware'} 
                                        onChange={handleChange} 
                                        className="hidden"
                                        disabled={!!procurementToEdit} // Lock type on edit
                                    />
                                    <FaMicrochip className="inline mr-2"/> Hardware
                                </label>
                                <label className={`flex-1 cursor-pointer border p-2 rounded text-center text-sm ${formData.resource_type === 'Software' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300'}`}>
                                    <input 
                                        type="radio" 
                                        name="resource_type" 
                                        value="Software" 
                                        checked={formData.resource_type === 'Software'} 
                                        onChange={handleChange} 
                                        className="hidden"
                                        disabled={!!procurementToEdit}
                                    />
                                    <FaKey className="inline mr-2"/> Software / Licenças
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">O que é necessário? (Título)</label>
                            <input 
                                type="text" 
                                name="title" 
                                value={formData.title} 
                                onChange={handleChange} 
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2"
                                required
                                placeholder={formData.resource_type === 'Hardware' ? "Ex: Portátil Dell Latitude 5420" : "Ex: Licença Adobe Creative Cloud"}
                            />
                        </div>
                        
                        {/* Dynamic Fields for Hardware */}
                        {formData.resource_type === 'Hardware' && (
                            <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30 animate-fade-in space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-blue-200 mb-1 flex items-center gap-1"><FaMicrochip/> Tipo de Equipamento</label>
                                        <select 
                                            name="equipment_type_id" 
                                            value={formData.equipment_type_id || ''} 
                                            onChange={handleChange} 
                                            className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"
                                        >
                                            <option value="">-- Selecione Tipo --</option>
                                            {equipmentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-blue-200 mb-1">Marca Preferencial</label>
                                        <select 
                                            name="brand_id" 
                                            value={formData.brand_id || ''} 
                                            onChange={handleChange} 
                                            className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"
                                        >
                                            <option value="">-- Selecione Marca --</option>
                                            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {selectedType && (
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-500/20">
                                        {selectedType.requires_ram_size && (
                                            <div>
                                                <label className="block text-[10px] text-gray-400 uppercase">RAM</label>
                                                <input 
                                                    type="text" 
                                                    value={formData.specifications?.ram_size || ''} 
                                                    onChange={(e) => handleSpecChange('ram_size', e.target.value)}
                                                    placeholder="Ex: 16GB"
                                                    className="w-full bg-gray-800 border border-gray-600 text-white rounded p-1 text-xs"
                                                />
                                            </div>
                                        )}
                                        {selectedType.requires_cpu_info && (
                                            <div>
                                                <label className="block text-[10px] text-gray-400 uppercase">Processador</label>
                                                <input 
                                                    type="text" 
                                                    value={formData.specifications?.cpu_info || ''} 
                                                    onChange={(e) => handleSpecChange('cpu_info', e.target.value)}
                                                    placeholder="Ex: i7-1185G7"
                                                    className="w-full bg-gray-800 border border-gray-600 text-white rounded p-1 text-xs"
                                                />
                                            </div>
                                        )}
                                        {selectedType.requires_disk_info && (
                                            <div className="col-span-2">
                                                <label className="block text-[10px] text-gray-400 uppercase">Disco</label>
                                                <input 
                                                    type="text" 
                                                    value={formData.specifications?.disk_info || ''} 
                                                    onChange={(e) => handleSpecChange('disk_info', e.target.value)}
                                                    placeholder="Ex: 512GB SSD"
                                                    className="w-full bg-gray-800 border border-gray-600 text-white rounded p-1 text-xs"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Dynamic Fields for Software */}
                        {formData.resource_type === 'Software' && (
                            <div className="bg-purple-900/20 p-3 rounded border border-purple-500/30 animate-fade-in">
                                <div>
                                    <label className="block text-xs text-purple-200 mb-1 flex items-center gap-1"><FaTags/> Categoria de Software</label>
                                    <select 
                                        name="software_category_id" 
                                        value={formData.software_category_id || ''} 
                                        onChange={handleChange} 
                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"
                                    >
                                        <option value="">-- Selecione Categoria --</option>
                                        {softwareCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Quantidade</label>
                                <input 
                                    type="number" 
                                    name="quantity" 
                                    value={formData.quantity} 
                                    onChange={handleChange} 
                                    min="1"
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Estimativa Custo (€)</label>
                                <input 
                                    type="number" 
                                    name="estimated_cost" 
                                    value={formData.estimated_cost} 
                                    onChange={handleChange} 
                                    min="0" step="0.01"
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Justificação / Descrição</label>
                            <textarea 
                                name="description" 
                                value={formData.description} 
                                onChange={handleChange} 
                                rows={3}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm text-gray-400 mb-1">Prioridade</label>
                                <select name="priority" value={formData.priority} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2">
                                    <option value="Normal">Normal</option>
                                    <option value="Urgente">Urgente</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm text-gray-400 mb-1">Data Pedido</label>
                                <input type="date" name="request_date" value={formData.request_date} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2" />
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm text-gray-400 mb-1">Requerente</label>
                            <select name="requester_id" value={formData.requester_id} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2">
                                {collaborators.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-white font-bold border-b border-gray-700 pb-2">Processamento (Admin)</h3>
                        
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Fornecedor Selecionado</label>
                            <select 
                                name="supplier_id" 
                                value={formData.supplier_id || ''} 
                                onChange={handleChange} 
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2"
                                disabled={!isAdmin}
                            >
                                <option value="">-- Selecione --</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Ref. Encomenda</label>
                                <input 
                                    type="text" 
                                    name="order_reference" 
                                    value={formData.order_reference || ''} 
                                    onChange={handleChange} 
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2"
                                    disabled={!isAdmin}
                                />
                            </div>
                             <div>
                                <label className="block text-sm text-gray-400 mb-1">Fatura</label>
                                <input 
                                    type="text" 
                                    name="invoice_number" 
                                    value={formData.invoice_number || ''} 
                                    onChange={handleChange} 
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2"
                                    disabled={!isAdmin}
                                />
                            </div>
                        </div>

                        {/* Attachments Section */}
                        <div>
                            <label className="block text-sm font-medium text-on-surface-dark-secondary mb-2 flex items-center gap-2">
                                <FaPaperclip /> Anexos (Fatura / Cotação)
                            </label>
                            <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                                {attachments.length > 0 && (
                                    <ul className="space-y-2 mb-3">
                                        {attachments.map((file, index) => (
                                            <li key={index} className="flex justify-between items-center text-sm p-2 bg-surface-dark rounded-md">
                                                <span className="truncate text-on-surface-dark-secondary max-w-[80%]">
                                                    {file.name}
                                                </span>
                                                <button type="button" onClick={() => handleRemoveAttachment(index)} className="text-red-400 hover:text-red-300 ml-2">
                                                    <DeleteIcon className="h-4 w-4" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <input
                                    type="file"
                                    multiple
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    accept="image/*,application/pdf"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={attachments.length >= MAX_FILES}
                                    className="w-full px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-dashed border-gray-500"
                                >
                                    + Adicionar Fatura/Documento
                                </button>
                            </div>
                        </div>

                        {/* Workflow Actions */}
                        {isAdmin && !isRejected && (
                            <div className="pt-4 mt-4 border-t border-gray-700 grid grid-cols-2 gap-3">
                                {formData.status === ProcurementStatus.Pending && (
                                    <>
                                        <button type="button" onClick={handleApprove} className="bg-green-600 text-white py-2 rounded hover:bg-green-500 flex items-center justify-center gap-2"><FaCheck/> Aprovar</button>
                                        <button type="button" onClick={handleReject} className="bg-red-600 text-white py-2 rounded hover:bg-red-500 flex items-center justify-center gap-2"><FaTimes/> Rejeitar</button>
                                    </>
                                )}
                                {formData.status === ProcurementStatus.Approved && (
                                    <button type="button" onClick={handleOrder} className="col-span-2 bg-purple-600 text-white py-2 rounded hover:bg-purple-500 flex items-center justify-center gap-2"><FaShoppingCart/> Registar Encomenda</button>
                                )}
                                {formData.status === ProcurementStatus.Ordered && (
                                    <button type="button" onClick={handleReceive} className="col-span-2 bg-teal-600 text-white py-2 rounded hover:bg-teal-500 flex items-center justify-center gap-2"><FaTruck/> Marcar como Recebido</button>
                                )}
                                {(formData.status === ProcurementStatus.Received || formData.status === ProcurementStatus.Completed) && (
                                    <div className="col-span-2 text-center p-2 bg-gray-800 rounded text-green-400 text-sm">
                                        {formData.status === ProcurementStatus.Completed ? "Processo Concluído (Ativos Criados)" : "Material Recebido. Pronto para entrada em stock."}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500" disabled={isSaving}>Cancelar</button>
                    <button type="submit" disabled={isSaving} className="px-6 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary flex items-center gap-2 disabled:opacity-50">
                        {isSaving ? <SpinnerIcon className="h-4 w-4"/> : <FaSave />} Guardar
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddProcurementModal;
