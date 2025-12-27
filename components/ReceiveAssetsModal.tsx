import React, { useState, useEffect, useRef, useMemo } from 'react';
import Modal from './common/Modal';
import { ProcurementRequest, ProcurementItem, Brand, EquipmentType, EquipmentStatus, CriticalityLevel, LicenseStatus } from '../types';
import { FaBoxOpen, FaCheck, FaKey, FaLaptop, FaListOl, FaTags, FaCalendarAlt, FaPaste, FaCamera, FaSpinner, FaTimes } from 'react-icons/fa';
import { extractTextFromImage, isAiConfigured } from '../services/geminiService';

/**
 * RECEIVE ASSETS MODAL - V7.0 (Master-Detail Support)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - PEDIDO 3: PROCESSAMENTO DE MÚLTIPLOS ITENS POR AQUISIÇÃO.
 * -----------------------------------------------------------------------------
 */

interface ReceiveAssetsModalProps {
    onClose: () => void;
    request: ProcurementRequest;
    brands: Brand[];
    types: EquipmentType[];
    onSave: (assets: any[]) => Promise<void>;
}

const ReceiveAssetsModal: React.FC<ReceiveAssetsModalProps> = ({ onClose, request, brands, types, onSave }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [activeItemIdx, setActiveItemIdx] = useState(0);
    const [processedAssets, setProcessedAssets] = useState<any[]>([]);
    
    // Itens a processar (Se não houver itens, criamos um do cabeçalho para legado)
    const itemsToProcess = useMemo(() => {
        if (request.items && request.items.length > 0) return request.items;
        return [{
            title: request.title,
            resource_type: request.resource_type,
            quantity: request.quantity,
            unit_cost: request.estimated_cost / (request.quantity || 1),
            brand_id: request.brand_id,
            equipment_type_id: request.equipment_type_id,
            software_category_id: request.software_category_id,
            specifications: request.specifications
        } as ProcurementItem];
    }, [request]);

    const currentItem = itemsToProcess[activeItemIdx];
    const isSoftware = currentItem.resource_type === 'Software';

    // State for the CURRENT item being edited
    const [itemSerials, setItemSerials] = useState<string[]>([]);
    const [commonBrandId, setCommonBrandId] = useState(currentItem.brand_id || '');
    const [commonTypeId, setCommonTypeId] = useState(currentItem.equipment_type_id || '');
    const [commonCategoryId, setCommonCategoryId] = useState(currentItem.software_category_id || '');

    useEffect(() => {
        // Reset local state for new item
        setItemSerials(Array(currentItem.quantity).fill(''));
        setCommonBrandId(currentItem.brand_id || '');
        setCommonTypeId(currentItem.equipment_type_id || '');
        setCommonCategoryId(currentItem.software_category_id || '');
    }, [activeItemIdx, currentItem]);

    const handleSerialChange = (idx: number, val: string) => {
        const next = [...itemSerials];
        next[idx] = val;
        setItemSerials(next);
    };

    const handleNextItem = () => {
        // Build current item assets
        const itemAssets = itemSerials.map((sn, idx) => {
            const base: any = {
                purchase_date: request.received_date || new Date().toISOString().split('T')[0],
                supplier_id: request.supplier_id,
                invoice_number: request.invoice_number,
                procurement_request_id: request.id,
                criticality: CriticalityLevel.Low,
            };

            if (isSoftware) {
                return {
                    ...base,
                    product_name: currentItem.title,
                    license_key: sn || `AQÇ-${request.id.substring(0,4)}-SW-${idx+1}`,
                    status: LicenseStatus.Ativo,
                    unit_cost: currentItem.unit_cost,
                    category_id: commonCategoryId,
                    total_seats: 1,
                    is_oem: false
                };
            } else {
                return {
                    ...base,
                    description: currentItem.title,
                    serial_number: sn || `AQÇ-${request.id.substring(0,4)}-HW-${idx+1}`,
                    status: sn ? EquipmentStatus.Stock : EquipmentStatus.Acquisition,
                    acquisition_cost: currentItem.unit_cost,
                    brand_id: commonBrandId,
                    type_id: commonTypeId,
                    ram_size: currentItem.specifications?.ram_size || '',
                    cpu_info: currentItem.specifications?.cpu_info || '',
                    disk_info: currentItem.specifications?.disk_info || '',
                };
            }
        });

        const allCurrentAssets = [...processedAssets, ...itemAssets];
        
        if (activeItemIdx < itemsToProcess.length - 1) {
            setProcessedAssets(allCurrentAssets);
            setActiveItemIdx(prev => prev + 1);
        } else {
            finalize(allCurrentAssets);
        }
    };

    const finalize = async (finalAssets: any[]) => {
        setIsSaving(true);
        try {
            await onSave(finalAssets);
            onClose();
        } catch (e: any) {
            alert(`Erro na gravação em massa: ${e.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal title={`Receção Multiproduto: Item ${activeItemIdx + 1} de ${itemsToProcess.length}`} onClose={onClose} maxWidth="max-w-5xl">
            <div className="space-y-6">
                
                <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-full ${isSoftware ? 'bg-purple-900/30 text-purple-400' : 'bg-blue-900/30 text-blue-400'}`}>
                            {isSoftware ? <FaKey size={32}/> : <FaLaptop size={32}/>}
                        </div>
                        <div>
                            <h3 className="text-white font-black text-lg">{currentItem.title}</h3>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">{currentItem.resource_type} • {currentItem.quantity} UNIDADES</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase font-black">Custo Unitário</p>
                        <p className="text-xl font-mono text-white">€ {currentItem.unit_cost.toLocaleString()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-800/20 p-6 rounded-xl border border-gray-700">
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Marca / Fabricante</label>
                        <select value={commonBrandId} onChange={e => setCommonBrandId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm">
                            <option value="">-- Selecione --</option>
                            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    {!isSoftware ? (
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Tipo de Equipamento</label>
                            <select value={commonTypeId} onChange={e => setCommonTypeId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm">
                                <option value="">-- Selecione --</option>
                                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Categoria de Software</label>
                            <select value={commonCategoryId} onChange={e => setCommonCategoryId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm">
                                <option value="">-- Selecione --</option>
                                {/* Nota: Em produção aqui deveríamos passar softwareCategories do appData */}
                                <option value={currentItem.software_category_id}>Manter Categoria do Pedido</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className="overflow-y-auto max-h-[35vh] border border-gray-700 rounded-xl bg-black/20 p-4 space-y-3 custom-scrollbar shadow-inner">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Números de Série / Chaves de Licença</p>
                    {itemSerials.map((sn, idx) => (
                        <div key={idx} className="flex items-center gap-4 bg-gray-800 p-2 rounded border border-gray-700 group hover:border-brand-secondary transition-all">
                            <span className="w-8 font-mono text-xs text-gray-600 font-bold">#{idx + 1}</span>
                            <input 
                                type="text" 
                                value={sn} 
                                onChange={e => handleSerialChange(idx, e.target.value)} 
                                className="flex-grow bg-transparent border-none text-white text-sm focus:ring-0 font-mono" 
                                placeholder={isSoftware ? "Insira Chave de Licença..." : "Insira S/N Físico..."}
                            />
                            {!sn && <span className="text-[9px] text-orange-400 font-black uppercase opacity-50">Auto AQÇ</span>}
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-700">
                    <button onClick={onClose} className="px-8 py-2 bg-gray-700 text-white rounded font-bold hover:bg-gray-600">Cancelar Receção</button>
                    <button onClick={handleNextItem} disabled={isSaving} className="px-10 py-2 bg-brand-primary text-white rounded font-black uppercase tracking-widest hover:bg-brand-secondary shadow-xl flex items-center gap-3 active:scale-95 transition-all">
                        {isSaving ? <FaSpinner className="animate-spin" /> : <FaCheck />} 
                        {activeItemIdx < itemsToProcess.length - 1 ? 'Próximo Item' : 'Finalizar Receção e Gerar Ativos'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ReceiveAssetsModal;