import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { ProcurementRequest, Brand, EquipmentType, EquipmentStatus, CriticalityLevel, LicenseStatus } from '../types';
import { FaBoxOpen, FaCheck, FaKey, FaLaptop, FaListOl, FaTags, FaCalendarAlt } from 'react-icons/fa';

/**
 * RECEIVE ASSETS MODAL - V2.0 (snake_case sync)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - PEDIDO 3: CORREÇÃO DE MAPEAMENTO E RESTAURAÇÃO DE GARANTIA.
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
    const isSoftware = request.resource_type === 'Software';
    
    const [commonStatus, setCommonStatus] = useState<string>(EquipmentStatus.Stock);
    const [commonWarrantyDate, setCommonWarrantyDate] = useState('');

    const [items, setItems] = useState<any[]>([]);
    const [commonBrandId, setCommonBrandId] = useState('');
    const [commonTypeId, setCommonTypeId] = useState('');

    const [licenseMode, setLicenseMode] = useState<'individual' | 'single'>('individual');
    const [bulkData, setBulkData] = useState({
        product_name: request.title || '',
        license_key: '',
        description: '',
        is_oem: false
    });

    useEffect(() => {
        const initialItems = Array.from({ length: request.quantity }).map(() => {
            if (isSoftware) {
                return {
                    product_name: request.title || '',
                    license_key: '',
                    status: LicenseStatus.Ativo
                };
            } else {
                return {
                    serial_number: '',
                    brand_id: request.brand_id || '', 
                    type_id: request.equipment_type_id || '',
                    description: request.title || '',
                    status: commonStatus,
                    warranty_end_date: '',
                    ram_size: request.specifications?.ram_size || '',
                    cpu_info: request.specifications?.cpu_info || '',
                    disk_info: request.specifications?.disk_info || '',
                };
            }
        });
        setItems(initialItems);
        if (!isSoftware) {
            if (request.equipment_type_id) setCommonTypeId(request.equipment_type_id);
            if (request.brand_id) setCommonBrandId(request.brand_id);
        }
    }, [request, isSoftware]);
    
    useEffect(() => {
        if (!isSoftware) {
            setItems(prev => prev.map(item => ({...item, status: commonStatus})));
        }
    }, [commonStatus, isSoftware]);

    useEffect(() => {
        if (!isSoftware) {
            setItems(prev => prev.map(item => ({
                ...item,
                brand_id: commonBrandId || item.brand_id,
                type_id: commonTypeId || item.type_id,
                warranty_end_date: commonWarrantyDate || item.warranty_end_date
            })));
        }
    }, [commonBrandId, commonTypeId, commonWarrantyDate, isSoftware]);

    const handleItemChange = (index: number, field: string, value: string) => {
        setItems(prev => {
            const newItems = [...prev];
            newItems[index] = { ...newItems[index], [field]: value };
            return newItems;
        });
    };
    
    const handleSetCommonWarranty = (years: number) => {
        const baseDateStr = request.received_date || new Date().toISOString().split('T')[0];
        const date = new Date(baseDateStr);
        date.setFullYear(date.getFullYear() + years);
        setCommonWarrantyDate(date.toISOString().split('T')[0]);
    };

    const handleSubmit = async () => {
        if (isSoftware) {
            if (licenseMode === 'single') {
                if (!bulkData.product_name || !bulkData.license_key) return alert("Preencha os dados da licença.");
            } else {
                if (items.some(i => !i.license_key || !i.product_name)) return alert("Preencha todas as chaves.");
            }
        } else {
             const statusNormalized = commonStatus.toLowerCase();
             const isAcquisition = statusNormalized.includes('aquisiç') || statusNormalized.includes('encomenda');
             if (!isAcquisition && items.some(i => !i.serial_number)) return alert("Preencha os Nº Série.");
             if (items.some(i => !i.brand_id || !i.type_id)) return alert("Preencha Marca e Tipo.");
        }

        setIsSaving(true);
        try {
            let assetsToCreate;
            const baseSoftwareData = {
                purchase_date: request.received_date || new Date().toISOString().split('T')[0],
                supplier_id: request.supplier_id,
                invoice_number: request.invoice_number,
                category_id: request.software_category_id,
                criticality: CriticalityLevel.Low,
            };

            if (isSoftware) {
                if (licenseMode === 'single') {
                     assetsToCreate = [{
                        ...baseSoftwareData,
                        product_name: bulkData.product_name,
                        license_key: bulkData.license_key,
                        total_seats: request.quantity,
                        status: LicenseStatus.Ativo,
                        unit_cost: request.estimated_cost ? (request.estimated_cost / request.quantity) : 0,
                        is_oem: bulkData.is_oem
                     }];
                } else {
                     assetsToCreate = items.map(item => ({
                        ...baseSoftwareData,
                        product_name: item.product_name,
                        license_key: item.license_key,
                        total_seats: 1, 
                        status: LicenseStatus.Ativo,
                        unit_cost: request.estimated_cost ? (request.estimated_cost / request.quantity) : 0,
                        is_oem: false
                     }));
                }
            } else {
                assetsToCreate = items.map(item => ({
                    ...item,
                    purchase_date: request.received_date || new Date().toISOString().split('T')[0],
                    supplier_id: request.supplier_id,
                    invoice_number: request.invoice_number,
                    requisition_number: request.order_reference,
                    acquisition_cost: request.estimated_cost ? (request.estimated_cost / request.quantity) : 0,
                    procurement_request_id: request.id,
                    criticality: CriticalityLevel.Low,
                }));
            }
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
        <Modal title={isSoftware ? "Receção de Software" : "Receção de Material"} onClose={onClose} maxWidth="max-w-6xl">
            <div className="space-y-6">
                <div className="bg-blue-900/20 p-4 rounded border border-blue-500/30 flex items-start gap-3">
                    {isSoftware ? <FaKey className="text-2xl text-yellow-400 mt-1" /> : <FaBoxOpen className="text-2xl text-blue-400 mt-1" />}
                    <div>
                        <h3 className="font-bold text-blue-200">Conversão de Pedido: {request.title}</h3>
                        <p className="text-sm text-gray-300">Receber <strong>{request.quantity}</strong> unidades.</p>
                    </div>
                </div>

                {!isSoftware && (
                    <div className="bg-gray-800 p-4 rounded border border-gray-600 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                             <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase">Estado</label>
                             <select value={commonStatus} onChange={(e) => setCommonStatus(e.target.value)} className="w-full bg-gray-700 border border-gray-500 text-white rounded p-2 text-sm">
                                <option value={EquipmentStatus.Stock}>Stock</option>
                                <option value={EquipmentStatus.Acquisition}>Aquisição</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase">Marca</label>
                            <select value={commonBrandId} onChange={(e) => setCommonBrandId(e.target.value)} className="w-full bg-gray-700 border border-gray-500 text-white rounded p-2 text-sm">
                                <option value="">-- Selecione --</option>
                                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase">Tipo</label>
                            <select value={commonTypeId} onChange={(e) => setCommonTypeId(e.target.value)} className="w-full bg-gray-700 border border-gray-500 text-white rounded p-2 text-sm">
                                <option value="">-- Selecione --</option>
                                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase">Garantia</label>
                            <input type="date" value={commonWarrantyDate} onChange={(e) => setCommonWarrantyDate(e.target.value)} className="w-full bg-gray-700 border border-gray-500 text-white rounded p-2 text-sm mb-1"/>
                            <div className="flex gap-2"><button onClick={() => handleSetCommonWarranty(2)} className="text-[9px] bg-gray-600 p-1 rounded">+2A</button><button onClick={() => handleSetCommonWarranty(3)} className="text-[9px] bg-gray-600 p-1 rounded">+3A</button></div>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto max-h-[50vh] custom-scrollbar border border-gray-700 rounded-lg">
                    {isSoftware && licenseMode === 'single' ? (
                         <div className="bg-gray-800/50 p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="text" value={bulkData.product_name} onChange={(e) => setBulkData({...bulkData, product_name: e.target.value})} className="bg-gray-700 border border-gray-600 text-white rounded p-2" placeholder="Nome do Produto" />
                                <input type="text" value={bulkData.license_key} onChange={(e) => setBulkData({...bulkData, license_key: e.target.value})} className="bg-gray-700 border border-gray-600 text-yellow-300 font-mono rounded p-2" placeholder="Chave de Volume" />
                            </div>
                         </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-700 text-gray-300 uppercase text-[10px] font-black sticky top-0 z-10">
                                <tr>
                                    <th className="p-3 w-10">#</th>
                                    {isSoftware ? (
                                        <><th className="p-3">Produto</th><th className="p-3">Chave</th></>
                                    ) : (
                                        <><th className="p-3">Nº Série</th><th className="p-3">Marca</th><th className="p-3">Tipo</th><th className="p-3">Descrição</th><th className="p-3">Garantia</th></>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {items.map((item, idx) => (
                                    <tr key={idx} className="bg-surface-dark hover:bg-gray-800 transition-colors">
                                        <td className="p-3 text-gray-500">{idx + 1}</td>
                                        {isSoftware ? (
                                            <>
                                                <td className="p-3"><input type="text" value={item.product_name} onChange={(e) => handleItemChange(idx, 'product_name', e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded p-1 w-full" /></td>
                                                <td className="p-3"><input type="text" value={item.license_key} onChange={(e) => handleItemChange(idx, 'license_key', e.target.value)} className="bg-gray-800 border border-gray-600 text-yellow-300 font-mono rounded p-1 w-full" /></td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="p-3"><input type="text" value={item.serial_number} onChange={(e) => handleItemChange(idx, 'serial_number', e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded p-1 w-full font-mono" /></td>
                                                <td className="p-3"><select value={item.brand_id} onChange={(e) => handleItemChange(idx, 'brand_id', e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded p-1 w-full">{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></td>
                                                <td className="p-3"><select value={item.type_id} onChange={(e) => handleItemChange(idx, 'type_id', e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded p-1 w-full">{types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></td>
                                                <td className="p-3"><input type="text" value={item.description} onChange={(e) => handleItemChange(idx, 'description', e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded p-1 w-full" /></td>
                                                <td className="p-3">
                                                    <input 
                                                        type="date" 
                                                        value={item.warranty_end_date} 
                                                        onChange={(e) => handleItemChange(idx, 'warranty_end_date', e.target.value)}
                                                        className="bg-gray-800 border border-gray-600 text-white rounded p-1 w-full text-xs"
                                                    />
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 font-bold">Cancelar</button>
                    <button onClick={handleSubmit} disabled={isSaving} className="px-8 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary flex items-center gap-2 font-black uppercase tracking-widest shadow-lg">
                        <FaCheck /> Confirmar Entrada
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ReceiveAssetsModal;