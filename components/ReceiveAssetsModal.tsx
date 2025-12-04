
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { ProcurementRequest, Brand, EquipmentType, Equipment, EquipmentStatus, CriticalityLevel } from '../types';
import { FaBoxOpen, FaCheck } from 'react-icons/fa';

interface ReceiveAssetsModalProps {
    onClose: () => void;
    request: ProcurementRequest;
    brands: Brand[];
    types: EquipmentType[];
    onSave: (assets: any[]) => Promise<void>;
}

const ReceiveAssetsModal: React.FC<ReceiveAssetsModalProps> = ({ onClose, request, brands, types, onSave }) => {
    const [items, setItems] = useState<any[]>([]);
    const [commonBrandId, setCommonBrandId] = useState('');
    const [commonTypeId, setCommonTypeId] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Initialize items based on quantity and prefill from request if possible
        const initialItems = Array.from({ length: request.quantity }).map((_, idx) => ({
            serialNumber: '',
            brandId: request.brand_id || '', // Prefill Brand
            typeId: request.equipment_type_id || '',
            description: request.title || '', // Default description from request title
            status: EquipmentStatus.Stock,
            // Prefill specs from request JSON
            ram_size: request.specifications?.ram_size || '',
            cpu_info: request.specifications?.cpu_info || '',
            disk_info: request.specifications?.disk_info || '',
        }));
        setItems(initialItems);
        
        // If type was in request, set it as common type
        if (request.equipment_type_id) setCommonTypeId(request.equipment_type_id);
        if (request.brand_id) setCommonBrandId(request.brand_id);

    }, [request]);

    // Apply common brand/type to all
    useEffect(() => {
        if (commonBrandId || commonTypeId) {
            setItems(prev => prev.map(item => ({
                ...item,
                brandId: commonBrandId || item.brandId,
                typeId: commonTypeId || item.typeId
            })));
        }
    }, [commonBrandId, commonTypeId]);

    const handleItemChange = (index: number, field: string, value: string) => {
        setItems(prev => {
            const newItems = [...prev];
            newItems[index] = { ...newItems[index], [field]: value };
            return newItems;
        });
    };

    const handleSubmit = async () => {
        // Validate
        if (items.some(i => !i.serialNumber || !i.brandId || !i.typeId)) {
            alert("Por favor preencha o Nº de Série, Marca e Tipo para todos os itens.");
            return;
        }

        setIsSaving(true);
        try {
            const assetsToCreate = items.map(item => ({
                serialNumber: item.serialNumber,
                brandId: item.brandId,
                typeId: item.typeId,
                description: item.description,
                status: EquipmentStatus.Stock,
                purchaseDate: request.received_date || new Date().toISOString().split('T')[0],
                supplier_id: request.supplier_id,
                invoiceNumber: request.invoice_number,
                requisitionNumber: request.order_reference,
                acquisitionCost: request.estimated_cost ? (request.estimated_cost / request.quantity) : 0,
                procurement_request_id: request.id,
                criticality: CriticalityLevel.Low, // Default
                creationDate: new Date().toISOString(),
                modifiedDate: new Date().toISOString(),
                // Map dynamic specs
                ram_size: item.ram_size,
                cpu_info: item.cpu_info,
                disk_info: item.disk_info
            }));

            await onSave(assetsToCreate);
            onClose();
        } catch (e) {
            console.error(e);
            alert("Erro ao criar ativos.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal title="Receção de Material - Entrada em Stock" onClose={onClose} maxWidth="max-w-5xl">
            <div className="space-y-6">
                <div className="bg-blue-900/20 p-4 rounded border border-blue-500/30 flex items-start gap-3">
                    <FaBoxOpen className="text-2xl text-blue-400 mt-1" />
                    <div>
                        <h3 className="font-bold text-blue-200">Conversão de Pedido em Ativos</h3>
                        <p className="text-sm text-gray-300">
                            Está a receber <strong>{request.quantity}</strong> itens do pedido "{request.title}". 
                            Preencha os detalhes abaixo para criar automaticamente os registos no inventário.
                            {request.specifications && <span className="block text-xs mt-1 text-green-300 font-bold">Especificações pré-carregadas do pedido.</span>}
                        </p>
                    </div>
                </div>

                {/* Bulk Actions */}
                <div className="bg-gray-800 p-3 rounded border border-gray-600 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Aplicar Marca a Todos</label>
                        <select 
                            value={commonBrandId} 
                            onChange={(e) => setCommonBrandId(e.target.value)} 
                            className="w-full bg-gray-700 border border-gray-500 text-white rounded p-1 text-sm"
                        >
                            <option value="">-- Selecione --</option>
                            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Aplicar Tipo a Todos</label>
                        <select 
                            value={commonTypeId} 
                            onChange={(e) => setCommonTypeId(e.target.value)} 
                            className="w-full bg-gray-700 border border-gray-500 text-white rounded p-1 text-sm"
                        >
                            <option value="">-- Selecione --</option>
                            {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-gray-700 text-gray-300">
                            <tr>
                                <th className="px-4 py-2 w-10">#</th>
                                <th className="px-4 py-2">Nº Série *</th>
                                <th className="px-4 py-2">Marca *</th>
                                <th className="px-4 py-2">Tipo *</th>
                                <th className="px-4 py-2">Descrição</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {items.map((item, idx) => (
                                <tr key={idx} className="bg-surface-dark">
                                    <td className="px-4 py-2 text-center text-gray-500">{idx + 1}</td>
                                    <td className="px-4 py-2">
                                        <input 
                                            type="text" 
                                            value={item.serialNumber} 
                                            onChange={(e) => handleItemChange(idx, 'serialNumber', e.target.value)}
                                            className="bg-gray-800 border border-gray-600 text-white rounded p-1 w-full"
                                            placeholder="S/N..."
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <select 
                                            value={item.brandId} 
                                            onChange={(e) => handleItemChange(idx, 'brandId', e.target.value)}
                                            className="bg-gray-800 border border-gray-600 text-white rounded p-1 w-full"
                                        >
                                            <option value="">Select...</option>
                                            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-4 py-2">
                                        <select 
                                            value={item.typeId} 
                                            onChange={(e) => handleItemChange(idx, 'typeId', e.target.value)}
                                            className="bg-gray-800 border border-gray-600 text-white rounded p-1 w-full"
                                        >
                                            <option value="">Select...</option>
                                            {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-4 py-2">
                                        <input 
                                            type="text" 
                                            value={item.description} 
                                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                            className="bg-gray-800 border border-gray-600 text-white rounded p-1 w-full"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500">Cancelar</button>
                    <button onClick={handleSubmit} disabled={isSaving} className="px-6 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary flex items-center gap-2">
                        <FaCheck /> Confirmar Receção e Criar Ativos
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ReceiveAssetsModal;
