import React, { useState, useEffect, useRef, useMemo } from 'react';
import Modal from './common/Modal';
import { ProcurementRequest, ProcurementItem, Collaborator, Supplier, ProcurementStatus, UserRole, EquipmentType, ConfigItem, Brand } from '../types';
// Added FaListUl to imports
import { FaSave, FaCheck, FaTimes, FaTruck, FaBoxOpen, FaShoppingCart, FaMicrochip, FaKey, FaPaperclip, FaTags, FaPlus, FaTrash, FaListUl } from 'react-icons/fa';
import { SpinnerIcon } from './common/Icons';
import * as dataService from '../services/dataService';

/**
 * ADD PROCUREMENT MODAL - V3.0 (Master-Detail Architecture)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - PEDIDO 3: SUPORTE A MÚLTIPLOS ITENS POR AQUISIÇÃO.
 * -----------------------------------------------------------------------------
 */

interface AddProcurementModalProps {
    onClose: () => void;
    onSave: (req: Omit<ProcurementRequest, 'id' | 'created_at' | 'updated_at'> | ProcurementRequest) => Promise<void>;
    procurementToEdit?: ProcurementRequest | null;
    currentUser: Collaborator | null;
    collaborators: Collaborator[];
    suppliers: Supplier[];
    equipmentTypes?: EquipmentType[];
    softwareCategories?: ConfigItem[];
    cpuOptions?: ConfigItem[];
    ramOptions?: ConfigItem[];
    storageOptions?: ConfigItem[];
}

const MAX_FILES = 5;

const AddProcurementModal: React.FC<AddProcurementModalProps> = ({ 
    onClose, onSave, procurementToEdit, currentUser, collaborators, suppliers, 
    equipmentTypes = [], softwareCategories = [], cpuOptions = [], ramOptions = [], storageOptions = [] 
}) => {
    
    const [formData, setFormData] = useState<Partial<ProcurementRequest>>({
        title: '',
        description: '',
        requester_id: currentUser?.id || '',
        status: ProcurementStatus.Pending,
        request_date: new Date().toISOString().split('T')[0],
        priority: 'Normal',
        supplier_id: '',
        order_reference: '',
        invoice_number: '',
        attachments: []
    });

    const [items, setItems] = useState<Partial<ProcurementItem>[]>([
        { title: '', resource_type: 'Hardware', quantity: 1, unit_cost: 0, specifications: {} }
    ]);

    const [attachments, setAttachments] = useState<{ name: string; dataUrl: string }[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [canUserApprove, setCanUserApprove] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSaving, setIsSaving] = useState(false);

    const isAdmin = currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.SuperAdmin;

    useEffect(() => {
        const loadContext = async () => {
            const [data, approvalTeamId] = await Promise.all([
                dataService.fetchAllData(),
                dataService.getGlobalSetting('procurement_approval_team_id')
            ]);
            setBrands(data.brands);
            if (currentUser) {
                if (currentUser.role === UserRole.SuperAdmin) setCanUserApprove(true);
                else if (approvalTeamId) {
                    const isMember = data.teamMembers.some((tm: any) => tm.team_id === approvalTeamId && tm.collaborator_id === currentUser.id);
                    setCanUserApprove(isMember);
                } else setCanUserApprove(isAdmin);
            }
        };
        loadContext();
    }, [currentUser, isAdmin]);

    useEffect(() => {
        if (procurementToEdit) {
            setFormData({ ...procurementToEdit });
            setAttachments(procurementToEdit.attachments || []);
            if (procurementToEdit.items && procurementToEdit.items.length > 0) {
                setItems(procurementToEdit.items);
            }
        }
    }, [procurementToEdit]);

    const handleAddItem = () => {
        setItems([...items, { title: '', resource_type: 'Hardware', quantity: 1, unit_cost: 0, specifications: {} }]);
    };

    const handleRemoveItem = (idx: number) => {
        if (items.length === 1) return;
        setItems(items.filter((_, i) => i !== idx));
    };

    const handleItemChange = (idx: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[idx] = { ...newItems[idx], [field]: value };
        setItems(newItems);
    };

    const totalEstimatedCost = useMemo(() => {
        return items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_cost || 0)), 0);
    }, [items]);

    const totalQuantity = useMemo(() => {
        return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    }, [items]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || items.some(i => !i.title)) return alert("Preencha o título do pedido e de todos os itens.");

        setIsSaving(true);
        try {
            const dataToSave = {
                ...formData,
                quantity: totalQuantity,
                estimated_cost: totalEstimatedCost,
                items: items as ProcurementItem[],
                attachments: attachments
            };
            await onSave(dataToSave as any);
            onClose();
        } catch(e: any) {
            alert(`Erro: ${e.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal title={procurementToEdit ? "Gerir Compra" : "Novo Pedido de Compra"} onClose={onClose} maxWidth="max-w-6xl">
            <form onSubmit={handleSubmit} className="flex flex-col h-[85vh]">
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-6">
                    
                    {/* Header Info Card */}
                    <div className="bg-gray-800/40 p-6 rounded-xl border border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-lg">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 tracking-widest">Título do Pedido / Identificador de Compra</label>
                            <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-sm focus:border-brand-primary outline-none" placeholder="Ex: Upgrade Servidores Q4 ou Kit Onboarding Novos Colaboradores" required />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Data do Pedido</label>
                            <input type="date" value={formData.request_date} onChange={e => setFormData({...formData, request_date: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-sm" />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Justificação da Compra</label>
                            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={2} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-sm" placeholder="Breve nota sobre a necessidade desta aquisição..." />
                        </div>
                    </div>

                    {/* Master-Detail Items Grid */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                <FaListUl className="text-brand-secondary"/> Itens da Compra
                            </h3>
                            <button type="button" onClick={handleAddItem} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-1 rounded text-xs flex items-center gap-2 transition-all">
                                <FaPlus /> Adicionar Item
                            </button>
                        </div>

                        <div className="space-y-3">
                            {items.map((item, idx) => (
                                <div key={idx} className="bg-gray-800/30 p-4 rounded-lg border border-gray-700 flex flex-col gap-4 animate-fade-in relative group">
                                    <button type="button" onClick={() => handleRemoveItem(idx)} className="absolute -right-2 -top-2 bg-red-600 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><FaTrash size={10}/></button>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                        <div className="md:col-span-2">
                                            <select value={item.resource_type} onChange={e => handleItemChange(idx, 'resource_type', e.target.value)} className="w-full bg-gray-900 border border-gray-600 text-white rounded p-2 text-xs font-bold uppercase">
                                                <option value="Hardware">Hardware</option>
                                                <option value="Software">Software</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-4">
                                            <input type="text" value={item.title} onChange={e => handleItemChange(idx, 'title', e.target.value)} className="w-full bg-gray-900 border border-gray-600 text-white rounded p-2 text-xs" placeholder="Nome do item..." />
                                        </div>
                                        <div className="md:col-span-2">
                                            <input type="number" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value))} className="w-full bg-gray-900 border border-gray-600 text-white rounded p-2 text-xs text-center" placeholder="Qtd" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <input type="number" value={item.unit_cost} onChange={e => handleItemChange(idx, 'unit_cost', parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-600 text-white rounded p-2 text-xs text-right" placeholder="Preço Unit." />
                                        </div>
                                        <div className="md:col-span-2 flex items-center justify-end font-mono text-xs text-brand-secondary font-bold">
                                            € {((item.quantity || 0) * (item.unit_cost || 0)).toLocaleString()}
                                        </div>
                                    </div>

                                    {/* Item Specs - Conditional Rendering */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-gray-700/50">
                                        <div>
                                            <label className="block text-[9px] text-gray-500 uppercase font-black mb-1">Marca</label>
                                            <select value={item.brand_id || ''} onChange={e => handleItemChange(idx, 'brand_id', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-1.5 text-[11px]">
                                                <option value="">-- Selecione --</option>
                                                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                            </select>
                                        </div>
                                        {item.resource_type === 'Hardware' ? (
                                            <div>
                                                <label className="block text-[9px] text-gray-500 uppercase font-black mb-1">Tipo Equipamento</label>
                                                <select value={item.equipment_type_id || ''} onChange={e => handleItemChange(idx, 'equipment_type_id', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-1.5 text-[11px]">
                                                    <option value="">-- Selecione --</option>
                                                    {equipmentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                </select>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block text-[9px] text-gray-500 uppercase font-black mb-1">Categoria Software</label>
                                                <select value={item.software_category_id || ''} onChange={e => handleItemChange(idx, 'software_category_id', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-1.5 text-[11px]">
                                                    <option value="">-- Selecione --</option>
                                                    {softwareCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Section - Totals and Actions */}
                <div className="flex-shrink-0 mt-6 pt-4 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex gap-10">
                        <div className="text-center">
                            <p className="text-[10px] text-gray-500 uppercase font-black">Total Itens</p>
                            <p className="text-xl font-black text-white">{totalQuantity}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-gray-500 uppercase font-black">Estimativa Total</p>
                            <p className="text-xl font-black text-brand-secondary">€ {totalEstimatedCost.toLocaleString()}</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-700 text-white rounded font-bold hover:bg-gray-600 transition-all">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="px-10 py-2 bg-brand-primary text-white rounded font-black uppercase tracking-widest hover:bg-brand-secondary shadow-lg flex items-center gap-2">
                            {isSaving ? <SpinnerIcon className="h-4 w-4"/> : <FaSave />} Gravar Aquisição
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default AddProcurementModal;