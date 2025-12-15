
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { ProcurementRequest, Brand, EquipmentType, EquipmentStatus, CriticalityLevel, LicenseStatus } from '../types';
import { FaBoxOpen, FaCheck, FaKey, FaLaptop, FaListOl, FaTags, FaCalendarAlt } from 'react-icons/fa';

interface ReceiveAssetsModalProps {
    onClose: () => void;
    request: ProcurementRequest;
    brands: Brand[];
    types: EquipmentType[];
    onSave: (assets: any[]) => Promise<void>;
}

const ReceiveAssetsModal: React.FC<ReceiveAssetsModalProps> = ({ onClose, request, brands, types, onSave }) => {
    // General State
    const [isSaving, setIsSaving] = useState(false);
    const isSoftware = request.resource_type === 'Software';
    
    // New: Common Status for Hardware
    const [commonStatus, setCommonStatus] = useState<string>(EquipmentStatus.Stock);
    const [commonWarrantyDate, setCommonWarrantyDate] = useState('');

    // Hardware State
    const [items, setItems] = useState<any[]>([]);
    const [commonBrandId, setCommonBrandId] = useState('');
    const [commonTypeId, setCommonTypeId] = useState('');

    // Software Specific State
    const [licenseMode, setLicenseMode] = useState<'individual' | 'single'>('individual');
    const [bulkData, setBulkData] = useState({
        productName: request.title || '',
        licenseKey: '',
        description: '',
        isOem: false
    });

    useEffect(() => {
        // Initialize items based on quantity and prefill from request if possible
        const initialItems = Array.from({ length: request.quantity }).map((_, idx) => {
            if (isSoftware) {
                return {
                    productName: request.title || '',
                    licenseKey: '',
                    description: '', // Optional notes for license
                    status: LicenseStatus.Ativo
                };
            } else {
                return {
                    serialNumber: '',
                    brandId: request.brand_id || '', // Prefill Brand
                    typeId: request.equipment_type_id || '',
                    description: request.title || '', // Default description from request title
                    status: commonStatus, // Use the selected status
                    warrantyEndDate: '', // Initialize empty
                    // Prefill specs from request JSON
                    ram_size: request.specifications?.ram_size || '',
                    cpu_info: request.specifications?.cpu_info || '',
                    disk_info: request.specifications?.disk_info || '',
                };
            }
        });
        setItems(initialItems);
        
        if (!isSoftware) {
            // If type was in request, set it as common type
            if (request.equipment_type_id) setCommonTypeId(request.equipment_type_id);
            if (request.brand_id) setCommonBrandId(request.brand_id);
        }

    }, [request, isSoftware]);
    
    // Update items when common status changes
    useEffect(() => {
        if (!isSoftware) {
            setItems(prev => prev.map(item => ({...item, status: commonStatus})));
        }
    }, [commonStatus, isSoftware]);

    // Apply common brand/type/warranty to all (Hardware Only)
    useEffect(() => {
        if (!isSoftware) {
            setItems(prev => prev.map(item => ({
                ...item,
                brandId: commonBrandId || item.brandId,
                typeId: commonTypeId || item.typeId,
                warrantyEndDate: commonWarrantyDate || item.warrantyEndDate
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
        // Use received_date or today as purchase date base
        const baseDateStr = request.received_date || new Date().toISOString().split('T')[0];
        const date = new Date(baseDateStr);
        date.setFullYear(date.getFullYear() + years);
        setCommonWarrantyDate(date.toISOString().split('T')[0]);
    };

    const handleSubmit = async () => {
        // Validate
        if (isSoftware) {
            if (licenseMode === 'single') {
                if (!bulkData.productName || !bulkData.licenseKey) {
                    alert("Por favor preencha o Nome do Produto e a Chave de Licença.");
                    return;
                }
            } else {
                if (items.some(i => !i.licenseKey || !i.productName)) {
                    alert("Por favor preencha o Nome do Produto e a Chave de Licença para todos os itens.");
                    return;
                }
            }
        } else {
             const statusNormalized = commonStatus.toLowerCase();
             // Allow empty serial if status is 'Aquisição' (loosely checked)
             const isAcquisition = statusNormalized.includes('aquisiç') || statusNormalized.includes('encomenda');
             
             if (!isAcquisition && items.some(i => !i.serialNumber)) {
                alert("Por favor preencha o Nº de Série para todos os itens (ou mude o estado para 'Aquisição').");
                return;
             }
             if (items.some(i => !i.brandId || !i.typeId)) {
                alert("Por favor preencha a Marca e o Tipo para todos os itens.");
                return;
             }
        }

        setIsSaving(true);
        try {
            let assetsToCreate;
            
            if (isSoftware) {
                // Common fields for software
                const baseSoftwareData = {
                    purchaseDate: request.received_date || new Date().toISOString().split('T')[0],
                    supplier_id: request.supplier_id,
                    invoiceNumber: request.invoice_number,
                    category_id: request.software_category_id,
                    criticality: CriticalityLevel.Low,
                    confidentiality: 'Baixo',
                    integrity: 'Baixo',
                    availability: 'Baixo',
                };

                if (licenseMode === 'single') {
                     // Create 1 License Record with Total Seats = Quantity
                     assetsToCreate = [{
                        ...baseSoftwareData,
                        productName: bulkData.productName,
                        licenseKey: bulkData.licenseKey,
                        totalSeats: request.quantity, // ALL seats in one record
                        status: LicenseStatus.Ativo,
                        unitCost: request.estimated_cost ? (request.estimated_cost / request.quantity) : 0,
                        is_oem: bulkData.isOem
                     }];
                } else {
                     // Create N License Records with Total Seats = 1
                     assetsToCreate = items.map(item => ({
                        ...baseSoftwareData,
                        productName: item.productName,
                        licenseKey: item.licenseKey,
                        totalSeats: 1, 
                        status: LicenseStatus.Ativo,
                        unitCost: request.estimated_cost ? (request.estimated_cost / request.quantity) : 0,
                        is_oem: false // Individual usually implies retail keys, but could be editable later
                     }));
                }
            } else {
                // Hardware Logic (Unchanged)
                assetsToCreate = items.map(item => ({
                    serialNumber: item.serialNumber,
                    brandId: item.brandId,
                    typeId: item.typeId,
                    description: item.description,
                    status: commonStatus, // Use selected status (Stock or Acquisition)
                    purchaseDate: request.received_date || new Date().toISOString().split('T')[0],
                    warrantyEndDate: item.warrantyEndDate || undefined,
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
            }

            await onSave(assetsToCreate);
            onClose();
        } catch (e) {
            console.error(e);
            alert(`Erro ao criar ${isSoftware ? 'licenças' : 'ativos'}.`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal title={isSoftware ? "Receção de Software (Licenças)" : "Receção de Material - Entrada em Stock"} onClose={onClose} maxWidth="max-w-6xl">
            <div className="space-y-6">
                <div className="bg-blue-900/20 p-4 rounded border border-blue-500/30 flex items-start gap-3">
                    {isSoftware ? <FaKey className="text-2xl text-yellow-400 mt-1" /> : <FaBoxOpen className="text-2xl text-blue-400 mt-1" />}
                    <div>
                        <h3 className="font-bold text-blue-200">Conversão de Pedido em Ativos</h3>
                        <p className="text-sm text-gray-300">
                            Está a receber <strong>{request.quantity}</strong> itens do pedido "{request.title}". 
                            {isSoftware 
                                ? " Escolha como deseja registar as chaves de licença." 
                                : " Preencha os detalhes abaixo para criar automaticamente os registos no inventário."
                            }
                            {request.specifications && !isSoftware && <span className="block text-xs mt-1 text-green-300 font-bold">Especificações pré-carregadas do pedido.</span>}
                        </p>
                    </div>
                </div>

                {/* Software License Mode Switcher */}
                {isSoftware && (
                     <div className="flex gap-4 border-b border-gray-700 pb-4 mb-4">
                        <label className={`flex-1 cursor-pointer border p-3 rounded flex flex-col items-center gap-2 transition-colors ${licenseMode === 'individual' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>
                            <input 
                                type="radio" 
                                name="licenseMode" 
                                checked={licenseMode === 'individual'} 
                                onChange={() => setLicenseMode('individual')} 
                                className="hidden"
                            />
                            <FaListOl className="text-xl" />
                            <div className="text-center">
                                <span className="font-bold block text-sm">Chaves Individuais</span>
                                <span className="text-xs opacity-80">Uma chave diferente para cada licença (Cria {request.quantity} registos)</span>
                            </div>
                        </label>
                        <label className={`flex-1 cursor-pointer border p-3 rounded flex flex-col items-center gap-2 transition-colors ${licenseMode === 'single' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>
                            <input 
                                type="radio" 
                                name="licenseMode" 
                                checked={licenseMode === 'single'} 
                                onChange={() => setLicenseMode('single')} 
                                className="hidden"
                            />
                            <FaTags className="text-xl" />
                            <div className="text-center">
                                <span className="font-bold block text-sm">Chave Única / Volume (OEM)</span>
                                <span className="text-xs opacity-80">A mesma chave para todas as {request.quantity} licenças (Cria 1 registo com {request.quantity} ativações)</span>
                            </div>
                        </label>
                    </div>
                )}

                {/* Bulk Actions (Hardware Only) */}
                {!isSoftware && (
                    <div className="bg-gray-800 p-3 rounded border border-gray-600 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                             <label className="block text-xs text-gray-400 mb-1">Estado Inicial</label>
                             <select 
                                value={commonStatus} 
                                onChange={(e) => setCommonStatus(e.target.value)} 
                                className="w-full bg-gray-700 border border-gray-500 text-white rounded p-1 text-sm"
                            >
                                <option value={EquipmentStatus.Stock}>Stock (Padrão)</option>
                                <option value={EquipmentStatus.Acquisition}>Aquisição (S/N Pendente)</option>
                            </select>
                            <p className="text-[10px] text-gray-500 mt-1">Se escolher 'Aquisição', o Nº de Série é opcional.</p>
                        </div>
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
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Fim da Garantia (Opcional)</label>
                            <div className="flex gap-2">
                                <input 
                                    type="date" 
                                    value={commonWarrantyDate} 
                                    onChange={(e) => setCommonWarrantyDate(e.target.value)} 
                                    className="w-full bg-gray-700 border border-gray-500 text-white rounded p-1 text-sm"
                                />
                            </div>
                             <div className="flex gap-2 mt-1">
                                <button type="button" onClick={() => handleSetCommonWarranty(2)} className="px-2 py-1 text-[10px] bg-gray-600 rounded hover:bg-gray-500 flex items-center gap-1">+2 Anos</button>
                                <button type="button" onClick={() => handleSetCommonWarranty(3)} className="px-2 py-1 text-[10px] bg-gray-600 rounded hover:bg-gray-500 flex items-center gap-1">+3 Anos</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Items Input Area */}
                <div className="overflow-x-auto max-h-[50vh] custom-scrollbar">
                    {isSoftware && licenseMode === 'single' ? (
                         <div className="bg-gray-800/50 p-6 rounded border border-gray-700 space-y-4 animate-fade-in">
                            <h4 className="text-white font-bold mb-2">Dados da Licença de Volume</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Nome do Produto</label>
                                    <input 
                                        type="text" 
                                        value={bulkData.productName} 
                                        onChange={(e) => setBulkData({...bulkData, productName: e.target.value})}
                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2"
                                        placeholder="Ex: Windows 11 Pro Volume License"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Chave de Licença (Comum)</label>
                                    <input 
                                        type="text" 
                                        value={bulkData.licenseKey} 
                                        onChange={(e) => setBulkData({...bulkData, licenseKey: e.target.value})}
                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 font-mono text-yellow-300"
                                        placeholder="XXXX-XXXX-XXXX-XXXX"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="flex items-center cursor-pointer mt-2">
                                    <input 
                                        type="checkbox" 
                                        checked={bulkData.isOem} 
                                        onChange={(e) => setBulkData({...bulkData, isOem: e.target.checked})}
                                        className="rounded bg-gray-700 border-gray-500 text-brand-primary"
                                    />
                                    <span className="ml-2 text-sm text-gray-300">Marcar como OEM / Vitalícia (Sem contagem estrita de ativações)</span>
                                </label>
                            </div>
                         </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-gray-700 text-gray-300 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-2 w-10">#</th>
                                    {isSoftware ? (
                                        <>
                                            <th className="px-4 py-2">Nome do Produto *</th>
                                            <th className="px-4 py-2">Chave de Licença *</th>
                                            <th className="px-4 py-2">Notas</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-4 py-2">Nº Série {commonStatus === EquipmentStatus.Acquisition ? '(Op.)' : '*'}</th>
                                            <th className="px-4 py-2">Marca *</th>
                                            <th className="px-4 py-2">Tipo *</th>
                                            <th className="px-4 py-2">Descrição</th>
                                            <th className="px-4 py-2">Fim Garantia</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {items.map((item, idx) => (
                                    <tr key={idx} className="bg-surface-dark hover:bg-gray-800 transition-colors">
                                        <td className="px-4 py-2 text-center text-gray-500">{idx + 1}</td>
                                        
                                        {isSoftware ? (
                                            <>
                                                <td className="px-4 py-2">
                                                    <input 
                                                        type="text" 
                                                        value={item.productName} 
                                                        onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                                                        className="bg-gray-800 border border-gray-600 text-white rounded p-1 w-full"
                                                        placeholder="Nome do Software..."
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input 
                                                        type="text" 
                                                        value={item.licenseKey} 
                                                        onChange={(e) => handleItemChange(idx, 'licenseKey', e.target.value)}
                                                        className="bg-gray-800 border border-gray-600 text-white rounded p-1 w-full font-mono text-yellow-300"
                                                        placeholder="XXXX-XXXX-XXXX-XXXX"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input 
                                                        type="text" 
                                                        value={item.description} 
                                                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                                        className="bg-gray-800 border border-gray-600 text-white rounded p-1 w-full"
                                                        placeholder="Notas..."
                                                    />
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-4 py-2">
                                                    <input 
                                                        type="text" 
                                                        value={item.serialNumber} 
                                                        onChange={(e) => handleItemChange(idx, 'serialNumber', e.target.value)}
                                                        className="bg-gray-800 border border-gray-600 text-white rounded p-1 w-full"
                                                        placeholder={commonStatus === EquipmentStatus.Acquisition ? "Pendente" : "S/N..."}
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
                                                <td className="px-4 py-2">
                                                    <input 
                                                        type="date" 
                                                        value={item.warrantyEndDate || ''} 
                                                        onChange={(e) => handleItemChange(idx, 'warrantyEndDate', e.target.value)}
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
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500">Cancelar</button>
                    <button onClick={handleSubmit} disabled={isSaving} className="px-6 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary flex items-center gap-2">
                        <FaCheck /> {isSoftware ? 'Registar Licenças' : 'Criar Ativos'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ReceiveAssetsModal;
