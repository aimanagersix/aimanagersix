import React, { useState, useEffect, useRef, useMemo } from 'react';
import Modal from './common/Modal';
import { ProcurementRequest, ProcurementItem, Collaborator, Supplier, ProcurementStatus, UserRole, EquipmentType, ConfigItem, Brand } from '../types';
import { FaSave, FaCheck, FaTimes, FaTruck, FaBoxOpen, FaShoppingCart, FaMicrochip, FaKey, FaPaperclip, FaTags, FaPlus, FaTrash, FaListUl, FaInfoCircle, FaCalendarAlt, FaFileContract, FaShieldAlt } from 'react-icons/fa';
import { SpinnerIcon } from './common/Icons';
import * as dataService from '../services/dataService';

/**
 * ADD PROCUREMENT MODAL - V4.0 (Enterprise Workflow)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - PEDIDO 2: SUPORTE A TABS (GERAL, ITENS, FINANCEIRO, GOVERNANÇA).
 * - PEDIDO 2: REORDENAÇÃO DE CAMPOS (MARCA/CATEGORIA PRIMEIRO).
 * - PEDIDO 2: SISTEMA DE APROVAÇÃO INTEGRADO.
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
}

const MAX_FILES = 5;

const AddProcurementModal: React.FC<AddProcurementModalProps> = ({ 
    onClose, onSave, procurementToEdit, currentUser, collaborators, suppliers, 
    equipmentTypes = [], softwareCategories = []
}) => {
    
    const [activeTab, setActiveTab] = useState<'general' | 'items' | 'processing' | 'gov'>('general');
    
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
        
        // Auto-sugestão de descrição baseada em Marca/Tipo
        if (field === 'brand_id' || field === 'equipment_type_id' || field === 'software_category_id') {
            const brandName = brands.find(b => b.id === newItems[idx].brand_id)?.name || '';
            let typeName = '';
            if (newItems[idx].resource_type === 'Hardware') {
                typeName = equipmentTypes.find(t => t.id === newItems[idx].equipment_type_id)?.name || '';
            } else {
                typeName = softwareCategories.find(c => c.id === newItems[idx].software_category_id)?.name || '';
            }
            
            const currentTitle = newItems[idx].title || '';
            if (!currentTitle || currentTitle.trim() === '') {
                newItems[idx].title = `${brandName} ${typeName}`.trim() + " ";
            }
        }
        
        setItems(newItems);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        for (let i = 0; i < files.length; i++) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const dataUrl = loadEvent.target?.result as string;
                setAttachments(prev => [...prev, { name: files[i].name, dataUrl }]);
            };
            reader.readAsDataURL(files[i]);
        }
    };

    const totalEstimatedCost = useMemo(() => {
        return items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_cost || 0)), 0);
    }, [items]);

    const totalQuantity = useMemo(() => {
        return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    }, [items]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title) return alert("Preencha o título do pedido.");

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

    // Botões de transição de estado (Governança)
    const handleSetStatus = (newStatus: ProcurementStatus) => {
        setFormData(prev => ({ 
            ...prev, 
            status: newStatus,
            approval_date: newStatus === ProcurementStatus.Approved ? new Date().toISOString() : prev.approval_date,
            approver_id: newStatus === ProcurementStatus.Approved ? currentUser?.id : prev.approver_id
        }));
    };

    const getTabClass = (id: string) => `px-6 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === id ? 'border-brand-secondary text-white bg-gray-800' : 'border-transparent text-gray-500 hover:text-gray-300'}`;

    return (
        <Modal title={procurementToEdit ? "Gestão Estratégica de Aquisição" : "Nova Requisição de Compra"} onClose={onClose} maxWidth="max-w-6xl">
            <div className="flex flex-col h-[85vh]">
                
                {/* Fixed Tabs Navigation */}
                <div className="flex-shrink-0 flex border-b border-gray-700 bg-gray-900/50 rounded-t-xl overflow-x-auto whitespace-nowrap custom-scrollbar">
                    <button onClick={() => setActiveTab('general')} className={getTabClass('general')}>1. Dados Gerais</button>
                    <button onClick={() => setActiveTab('items')} className={getTabClass('items')}>2. Itens da Compra ({items.length})</button>
                    <button onClick={() => setActiveTab('processing')} className={getTabClass('processing')}>3. Fornecedor & Fatura</button>
                    <button onClick={() => setActiveTab('gov')} className={getTabClass('gov')}>4. Governança & Anexos</button>
                </div>

                <form onSubmit={handleSubmit} className="flex-grow flex flex-col min-h-0">
                    <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-8">
                        
                        {/* TAB 1: GERAL */}
                        {activeTab === 'general' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-gray-800/40 p-6 rounded-xl border border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-lg">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 tracking-widest">Identificador / Título do Pedido</label>
                                        <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-3 text-sm focus:border-brand-primary outline-none shadow-inner" placeholder="Ex: Upgrade Servidores Q4 ou Kit Onboarding" required />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Prioridade</label>
                                        <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-3 text-sm">
                                            <option value="Normal">Normal</option>
                                            <option value="Urgente">Urgente (!)</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Justificação e Notas</label>
                                        <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={4} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-3 text-sm custom-scrollbar" placeholder="Descreva o motivo desta aquisição para o conselho administrativo..." />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: ITENS (AQUI A ORDEM MUDOU - MARCA/TIPO PRIMEIRO) */}
                        {activeTab === 'items' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                        <FaListUl className="text-brand-secondary"/> Composição do Pedido
                                    </h3>
                                    <button type="button" onClick={handleAddItem} className="bg-brand-primary hover:bg-brand-secondary text-white px-4 py-2 rounded text-xs font-black uppercase flex items-center gap-2 shadow-lg transition-all">
                                        <FaPlus /> Adicionar Item
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="bg-gray-800/30 p-5 rounded-xl border border-gray-700 flex flex-col gap-6 animate-fade-in relative group shadow-md hover:border-gray-600 transition-all">
                                            <button type="button" onClick={() => handleRemoveItem(idx)} className="absolute -right-2 -top-2 bg-red-600 text-white p-2 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10"><FaTrash size={12}/></button>
                                            
                                            {/* PEDIDO 2: Categoria/Marca primeiro */}
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                                <div className="md:col-span-2">
                                                    <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">Tipo Recurso</label>
                                                    <select value={item.resource_type} onChange={e => handleItemChange(idx, 'resource_type', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-xs font-bold uppercase">
                                                        <option value="Hardware">Hardware</option>
                                                        <option value="Software">Software</option>
                                                    </select>
                                                </div>

                                                <div className="md:col-span-3">
                                                    <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">Marca / Fabricante</label>
                                                    <select value={item.brand_id || ''} onChange={e => handleItemChange(idx, 'brand_id', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-xs">
                                                        <option value="">-- Selecione --</option>
                                                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                                    </select>
                                                </div>

                                                <div className="md:col-span-3">
                                                    <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">
                                                        {item.resource_type === 'Hardware' ? 'Tipo Ativo' : 'Categoria Software'}
                                                    </label>
                                                    {item.resource_type === 'Hardware' ? (
                                                        <select value={item.equipment_type_id || ''} onChange={e => handleItemChange(idx, 'equipment_type_id', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-xs">
                                                            <option value="">-- Selecione --</option>
                                                            {equipmentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                        </select>
                                                    ) : (
                                                        <select value={item.software_category_id || ''} onChange={e => handleItemChange(idx, 'software_category_id', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-xs">
                                                            <option value="">-- Selecione --</option>
                                                            {softwareCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                        </select>
                                                    )}
                                                </div>

                                                <div className="md:col-span-4">
                                                    <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">Descrição do Produto (Sugestão IA)</label>
                                                    <input type="text" value={item.title} onChange={e => handleItemChange(idx, 'title', e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-xs font-bold" placeholder="Ex: Latitude 5420 i7 16GB..." />
                                                </div>

                                                <div className="md:col-span-2">
                                                    <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">Quantidade</label>
                                                    <input type="number" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value))} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-xs text-center font-mono" />
                                                </div>
                                                <div className="md:col-span-3">
                                                    <label className="block text-[9px] font-black text-gray-500 uppercase mb-1">Preço Unitário Estimado (€)</label>
                                                    <input type="number" value={item.unit_cost} onChange={e => handleItemChange(idx, 'unit_cost', parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-xs text-right font-mono" placeholder="0.00" />
                                                </div>
                                                <div className="md:col-span-7 flex items-end justify-end pb-2">
                                                    <p className="text-[10px] text-gray-500 uppercase font-black mr-4">Subtotal:</p>
                                                    <p className="text-lg font-black text-brand-secondary font-mono">€ {((item.quantity || 0) * (item.unit_cost || 0)).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TAB 3: PROCESSING (FORNECEDOR / FATURA) */}
                        {activeTab === 'processing' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-gray-800/40 p-8 rounded-xl border border-gray-700 shadow-lg space-y-6">
                                    <h4 className="text-[11px] font-black text-brand-secondary uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><FaFileContract/> Dados Comerciais & Encomenda</h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Fornecedor Selecionado</label>
                                            <select value={formData.supplier_id || ''} onChange={e => setFormData({...formData, supplier_id: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-3 text-sm outline-none focus:border-brand-primary">
                                                <option value="">-- Selecione Fornecedor --</option>
                                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Referência de Encomenda / PO</label>
                                            <input type="text" value={formData.order_reference || ''} onChange={e => setFormData({...formData, order_reference: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-3 text-sm" placeholder="Ex: PO-2024-001" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Número da Fatura</label>
                                            <input type="text" value={formData.invoice_number || ''} onChange={e => setFormData({...formData, invoice_number: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-3 text-sm" placeholder="Ex: FT/12345" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Data da Encomenda</label>
                                            <input type="date" value={formData.order_date || ''} onChange={e => setFormData({...formData, order_date: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-3 text-sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: GOVERNANÇA & ANEXOS */}
                        {activeTab === 'gov' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Workflow de Aprovação */}
                                    <div className="bg-blue-900/10 p-6 rounded-xl border border-blue-500/30 space-y-4">
                                        <h4 className="text-blue-300 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><FaShieldAlt/> Controlo de Aprovação NIS2/DORA</h4>
                                        <div className="flex flex-col gap-3">
                                            <div className="flex justify-between items-center bg-black/20 p-3 rounded">
                                                <span className="text-xs text-gray-400">Estado Atual:</span>
                                                <span className="text-xs font-black uppercase text-brand-secondary">{formData.status}</span>
                                            </div>
                                            
                                            {canUserApprove && formData.status === ProcurementStatus.Pending && (
                                                <div className="grid grid-cols-2 gap-2 pt-2">
                                                    <button type="button" onClick={() => handleSetStatus(ProcurementStatus.Approved)} className="bg-green-600 hover:bg-green-500 text-white py-3 rounded font-black text-[10px] uppercase tracking-tighter flex items-center justify-center gap-2 transition-all"><FaCheck/> Aprovar Pedido</button>
                                                    <button type="button" onClick={() => handleSetStatus(ProcurementStatus.Rejected)} className="bg-red-600 hover:bg-red-500 text-white py-3 rounded font-black text-[10px] uppercase tracking-tighter flex items-center justify-center gap-2 transition-all"><FaTimes/> Rejeitar</button>
                                                </div>
                                            )}
                                            
                                            {canUserApprove && formData.status === ProcurementStatus.Approved && (
                                                <button type="button" onClick={() => handleSetStatus(ProcurementStatus.Ordered)} className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"><FaShoppingCart/> Registar Encomenda</button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Anexos */}
                                    <div className="bg-gray-800/40 p-6 rounded-xl border border-gray-700 flex flex-col">
                                        <h4 className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2"><FaPaperclip/> Documentação de Suporte</h4>
                                        <div className="flex-grow space-y-2 mb-4 max-h-40 overflow-y-auto custom-scrollbar">
                                            {attachments.map((file, index) => (
                                                <div key={index} className="flex justify-between items-center p-2 bg-black/20 rounded border border-gray-700">
                                                    <span className="text-[10px] text-gray-300 truncate max-w-[180px]">{file.name}</span>
                                                    <button type="button" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))} className="text-red-500 hover:text-red-400 p-1"><FaTrash size={10}/></button>
                                                </div>
                                            ))}
                                            {attachments.length === 0 && <p className="text-center py-6 text-gray-600 italic text-xs border border-dashed border-gray-700 rounded">Nenhum documento (Orçamentos, Faturas, etc)</p>}
                                        </div>
                                        <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,application/pdf" />
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-2 bg-gray-700 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-gray-600 transition-all">+ Carregar Ficheiro</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer - Totals & Submit */}
                    <div className="flex-shrink-0 bg-gray-900 border-t border-gray-700 p-6 rounded-b-xl flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex gap-12">
                            <div className="text-center">
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Itens Totais</p>
                                <p className="text-2xl font-black text-white">{totalQuantity}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Investimento Est.</p>
                                <p className="text-2xl font-black text-brand-secondary">€ {totalEstimatedCost.toLocaleString()}</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-700 text-white rounded font-bold hover:bg-gray-600 transition-all uppercase text-xs tracking-widest">Cancelar</button>
                            <button type="submit" disabled={isSaving} className="px-10 py-2 bg-brand-primary text-white rounded font-black uppercase tracking-[0.2em] hover:bg-brand-secondary shadow-2xl flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                                {isSaving ? <SpinnerIcon className="h-4 w-4"/> : <FaSave />} {isSaving ? 'A Processar...' : 'Gravar Aquisição'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default AddProcurementModal;