import React, { useState, useEffect, useRef, useMemo } from 'react';
import Modal from './common/Modal';
import { ProcurementRequest, ProcurementItem, Collaborator, Supplier, ProcurementStatus, UserRole, EquipmentType, ConfigItem, Brand } from '../types';
import { FaSave, FaPlus, FaTrash, FaListUl, FaMicrochip, FaKey, FaCheckCircle } from 'react-icons/fa';
import { SpinnerIcon } from './common/Icons';
import * as dataService from '../services/dataService';

/**
 * ADD PROCUREMENT MODAL - V4.0 (Ergonomics & Auto-Gen)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - PEDIDO 3: REORDENAÇÃO DE CAMPOS (MARCA/TIPO PRIMEIRO).
 * - PEDIDO 3: AUTO-PREENCHIMENTO DE DESCRIÇÃO.
 * - PEDIDO 3: GRELHA DE ITENS COMPACTA.
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

const AddProcurementModal: React.FC<AddProcurementModalProps> = ({ 
    onClose, onSave, procurementToEdit, currentUser, collaborators, suppliers, 
    equipmentTypes = [], softwareCategories = []
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

    // Item sendo editado no momento (Entry Form)
    const [currentItem, setCurrentItem] = useState<Partial<ProcurementItem>>({
        resource_type: 'Hardware',
        title: '',
        quantity: 1,
        unit_cost: 0,
        brand_id: '',
        equipment_type_id: '',
        software_category_id: '',
        specifications: {}
    });

    // Lista de itens já confirmados
    const [items, setItems] = useState<Partial<ProcurementItem>[]>([]);

    const [brands, setBrands] = useState<Brand[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadContext = async () => {
            const data = await dataService.fetchAllData();
            setBrands(data.brands);
        };
        loadContext();
    }, []);

    useEffect(() => {
        if (procurementToEdit) {
            setFormData({ ...procurementToEdit });
            if (procurementToEdit.items && procurementToEdit.items.length > 0) {
                setItems(procurementToEdit.items);
            }
        }
    }, [procurementToEdit]);

    // Lógica de auto-preenchimento da descrição do item
    useEffect(() => {
        if (currentItem.brand_id || currentItem.equipment_type_id || currentItem.software_category_id) {
            const brandName = brands.find(b => b.id === currentItem.brand_id)?.name || '';
            let typeName = '';
            
            if (currentItem.resource_type === 'Hardware') {
                typeName = equipmentTypes.find(t => t.id === currentItem.equipment_type_id)?.name || '';
            } else {
                typeName = softwareCategories.find(c => c.id === currentItem.software_category_id)?.name || '';
            }

            // Apenas preenche se o título estiver vazio ou se for apenas a sugestão anterior
            const suggestion = `${brandName} ${typeName}`.trim();
            if (suggestion && (!currentItem.title || items.every(i => i.title !== currentItem.title))) {
                setCurrentItem(prev => ({ ...prev, title: suggestion + " " }));
            }
        }
    }, [currentItem.brand_id, currentItem.equipment_type_id, currentItem.software_category_id, currentItem.resource_type]);

    const handleAddItem = () => {
        if (!currentItem.title?.trim() || !currentItem.quantity) {
            alert("Preencha a descrição e quantidade do item.");
            return;
        }
        setItems([...items, { ...currentItem, id: crypto.randomUUID() }]);
        // Reset form mas mantém o tipo de recurso para rapidez
        setCurrentItem({
            resource_type: currentItem.resource_type,
            title: '',
            quantity: 1,
            unit_cost: 0,
            brand_id: '',
            equipment_type_id: '',
            software_category_id: '',
            specifications: {}
        });
    };

    const handleRemoveItem = (id: string | undefined) => {
        setItems(items.filter(i => i.id !== id));
    };

    const totalEstimatedCost = useMemo(() => {
        return items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_cost || 0)), 0);
    }, [items]);

    const totalQuantity = useMemo(() => {
        return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    }, [items]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Se houver algo no form atual mas não na lista, tentamos adicionar automaticamente
        let finalItems = [...items];
        if (currentItem.title?.trim() && finalItems.length === 0) {
            finalItems.push(currentItem);
        }

        if (!formData.title) return alert("Preencha o identificador/título do pedido.");
        if (finalItems.length === 0) return alert("Adicione pelo menos um item à compra.");

        setIsSaving(true);
        try {
            const dataToSave = {
                ...formData,
                quantity: totalQuantity,
                estimated_cost: totalEstimatedCost,
                items: finalItems as ProcurementItem[]
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
        <Modal title={procurementToEdit ? "Gerir Aquisição" : "Nova Requisição de Compra"} onClose={onClose} maxWidth="max-w-6xl">
            <form onSubmit={handleSubmit} className="flex flex-col h-[85vh]">
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-8">
                    
                    {/* SECÇÃO 1: Identificador Geral */}
                    <div className="bg-gray-800/40 p-6 rounded-xl border border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-lg">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 tracking-widest">Identificador da Compra / Fatura</label>
                            <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-sm focus:border-brand-primary outline-none" placeholder="Ex: Fatura 2024/001 ou Projeto Expansão" required />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Data do Pedido</label>
                            <input type="date" value={formData.request_date} onChange={e => setFormData({...formData, request_date: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-sm" />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Justificação Global da Aquisição</label>
                            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={2} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-sm" placeholder="Descreva o motivo desta compra..." />
                        </div>
                    </div>

                    {/* SECÇÃO 2: Formulário de Entrada de Item */}
                    <div className="bg-brand-primary/5 p-6 rounded-xl border border-brand-primary/20 space-y-4">
                        <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                            <FaPlus className="text-brand-secondary"/> Configurar Item
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            {/* Tipo de Recurso */}
                            <div className="md:col-span-2">
                                <label className="block text-[9px] text-gray-500 uppercase font-black mb-1">Tipo</label>
                                <select value={currentItem.resource_type} onChange={e => setCurrentItem({...currentItem, resource_type: e.target.value as any})} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-xs font-bold">
                                    <option value="Hardware">Hardware</option>
                                    <option value="Software">Software</option>
                                </select>
                            </div>

                            {/* Marca (PEDIDO 3: PRIORIDADE) */}
                            <div className="md:col-span-2">
                                <label className="block text-[9px] text-gray-500 uppercase font-black mb-1">Marca</label>
                                <select value={currentItem.brand_id || ''} onChange={e => setCurrentItem({...currentItem, brand_id: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-xs">
                                    <option value="">-- Marca --</option>
                                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>

                            {/* Tipo/Categoria (PEDIDO 3: PRIORIDADE) */}
                            <div className="md:col-span-3">
                                <label className="block text-[9px] text-gray-500 uppercase font-black mb-1">
                                    {currentItem.resource_type === 'Hardware' ? 'Tipo Equipamento' : 'Categoria Software'}
                                </label>
                                {currentItem.resource_type === 'Hardware' ? (
                                    <select value={currentItem.equipment_type_id || ''} onChange={e => setCurrentItem({...currentItem, equipment_type_id: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-xs">
                                        <option value="">-- Selecione --</option>
                                        {equipmentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                ) : (
                                    <select value={currentItem.software_category_id || ''} onChange={e => setCurrentItem({...currentItem, software_category_id: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-xs">
                                        <option value="">-- Selecione --</option>
                                        {softwareCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                )}
                            </div>

                            {/* Quantidade e Custo */}
                            <div className="md:col-span-2">
                                <label className="block text-[9px] text-gray-500 uppercase font-black mb-1">Qtd</label>
                                <input type="number" value={currentItem.quantity} onChange={e => setCurrentItem({...currentItem, quantity: parseInt(e.target.value)})} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-xs text-center" />
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-[9px] text-gray-500 uppercase font-black mb-1">Preço Unit. (€)</label>
                                <input type="number" value={currentItem.unit_cost} onChange={e => setCurrentItem({...currentItem, unit_cost: parseFloat(e.target.value)})} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-xs text-right" placeholder="0.00" />
                            </div>

                            {/* Descrição do Item */}
                            <div className="md:col-span-10">
                                <label className="block text-[9px] text-gray-500 uppercase font-black mb-1">Descrição do Item (Auto-Gerado)</label>
                                <input type="text" value={currentItem.title} onChange={e => setCurrentItem({...currentItem, title: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-xs font-semibold" placeholder="Ex: Portátil Latitude 5420 i7 16GB" />
                            </div>

                            {/* Botão de Confirmação */}
                            <div className="md:col-span-2 flex items-end">
                                <button type="button" onClick={handleAddItem} className="w-full bg-brand-secondary hover:bg-brand-primary text-white py-2 rounded text-xs font-black uppercase tracking-widest transition-all shadow-md">
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* SECÇÃO 3: Lista de Itens Adicionados (PEDIDO 3: UX IMPROVEMENT) */}
                    <div className="space-y-4">
                        <h3 className="text-white font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                            <FaListUl className="text-gray-500"/> Itens na Requisição ({items.length})
                        </h3>

                        {items.length > 0 ? (
                            <div className="overflow-hidden border border-gray-700 rounded-lg bg-gray-800/20">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-gray-800 text-gray-500 uppercase font-bold text-[10px]">
                                        <tr>
                                            <th className="p-3">Recurso</th>
                                            <th className="p-3">Descrição</th>
                                            <th className="p-3 text-center">Qtd</th>
                                            <th className="p-3 text-right">Unitário</th>
                                            <th className="p-3 text-right">Subtotal</th>
                                            <th className="p-3 text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-700/30 transition-colors group">
                                                <td className="p-3">
                                                    {item.resource_type === 'Hardware' ? <FaMicrochip className="text-blue-400 inline mr-2"/> : <FaKey className="text-yellow-400 inline mr-2"/>}
                                                    {item.resource_type}
                                                </td>
                                                <td className="p-3 font-semibold text-white">{item.title}</td>
                                                <td className="p-3 text-center font-mono">{item.quantity}</td>
                                                <td className="p-3 text-right font-mono">€ {item.unit_cost?.toLocaleString()}</td>
                                                <td className="p-3 text-right font-black text-brand-secondary">€ {((item.quantity || 0) * (item.unit_cost || 0)).toLocaleString()}</td>
                                                <td className="p-3 text-center">
                                                    <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><FaTrash/></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-10 border-2 border-dashed border-gray-700 rounded-xl bg-gray-900/10">
                                <p className="text-gray-500 text-sm italic">Nenhum item adicionado ainda. Configure acima.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* FOOTER: Totais e Submissão */}
                <div className="flex-shrink-0 mt-6 pt-6 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex gap-12">
                        <div className="text-center">
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Quantidade Total</p>
                            <p className="text-2xl font-black text-white">{totalQuantity}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Investimento Total</p>
                            <p className="text-2xl font-black text-brand-secondary">€ {totalEstimatedCost.toLocaleString()}</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-700 text-white rounded font-bold hover:bg-gray-600 transition-all uppercase text-xs tracking-widest">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="px-12 py-3 bg-brand-primary text-white rounded-xl font-black uppercase tracking-[0.2em] hover:bg-brand-secondary shadow-2xl flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50">
                            {isSaving ? <SpinnerIcon className="h-4 w-4"/> : <FaSave />} {isSaving ? 'A Processar...' : 'Gravar Aquisição'}
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default AddProcurementModal;