
import React, { useState, useEffect, useMemo } from 'react';
import Modal from './common/Modal';
import { ProcurementRequest, Collaborator, Supplier, ProcurementStatus, UserRole } from '../types';
import { FaSave, FaCheck, FaTimes, FaTruck, FaBoxOpen, FaShoppingCart } from 'react-icons/fa';

interface AddProcurementModalProps {
    onClose: () => void;
    onSave: (req: Omit<ProcurementRequest, 'id' | 'created_at' | 'updated_at'> | ProcurementRequest) => Promise<void>;
    procurementToEdit?: ProcurementRequest | null;
    currentUser: Collaborator | null;
    collaborators: Collaborator[];
    suppliers: Supplier[];
}

const AddProcurementModal: React.FC<AddProcurementModalProps> = ({ onClose, onSave, procurementToEdit, currentUser, collaborators, suppliers }) => {
    
    const [formData, setFormData] = useState<Partial<ProcurementRequest>>({
        title: '',
        description: '',
        quantity: 1,
        estimated_cost: 0,
        requester_id: currentUser?.id || '',
        status: ProcurementStatus.Pending,
        request_date: new Date().toISOString().split('T')[0],
        priority: 'Normal' as 'Normal' | 'Urgente'
    });

    const isAdmin = currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.SuperAdmin;

    useEffect(() => {
        if (procurementToEdit) {
            setFormData(procurementToEdit);
        }
    }, [procurementToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
        
        // Logic to prevent changing status manually backwards without clearing dates if needed, 
        // but for simplicity we trust the form or the buttons above.

        const dataToSave = {
            ...formData,
            quantity: Number(formData.quantity),
            estimated_cost: Number(formData.estimated_cost)
        };

        // Cleanup empty strings for UUIDs
        if (!dataToSave.supplier_id) delete dataToSave.supplier_id;
        if (!dataToSave.approver_id) delete dataToSave.approver_id;

        await onSave(procurementToEdit ? { ...procurementToEdit, ...dataToSave } as ProcurementRequest : dataToSave as any);
        onClose();
    };
    
    // Status Steps Visualization
    const steps: ProcurementStatus[] = [ProcurementStatus.Pending, ProcurementStatus.Approved, ProcurementStatus.Ordered, ProcurementStatus.Received, ProcurementStatus.Completed];
    const currentStepIdx = steps.indexOf(formData.status || ProcurementStatus.Pending);
    const isRejected = formData.status === ProcurementStatus.Rejected;

    return (
        <Modal title={procurementToEdit ? "Gerir Pedido de Aquisição" : "Novo Pedido de Aquisição"} onClose={onClose} maxWidth="max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                
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
                        
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">O que é necessário? (Título)</label>
                            <input 
                                type="text" 
                                name="title" 
                                value={formData.title} 
                                onChange={handleChange} 
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2"
                                required
                            />
                        </div>
                        
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
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar</button>
                    <button type="submit" className="px-6 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary flex items-center gap-2">
                        <FaSave /> Guardar
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddProcurementModal;
