import React, { useState, useEffect, useRef } from 'react';
import Modal from './common/Modal';
import { ProcurementRequest, Brand, EquipmentType, EquipmentStatus, CriticalityLevel, LicenseStatus } from '../types';
import { FaBoxOpen, FaCheck, FaKey, FaLaptop, FaListOl, FaTags, FaCalendarAlt, FaPaste, FaCamera, FaSpinner, FaTimes } from 'react-icons/fa';
import { extractTextFromImage, isAiConfigured } from '../services/geminiService';

/**
 * RECEIVE ASSETS MODAL - V3.0 (Bulk Input & Acquisition Placeholder Fix)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - PEDIDO 3: IMPLEMENTAÇÃO DE PASTE-SERIAL E SCAN-CONTÍNUO.
 * - FIX: PLACEHOLDER PARA "AQUISIÇÃO" PARA EVITAR ERRO DE DB.
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

    const [showBulkPaste, setShowBulkPaste] = useState(false);
    const [pastedSerials, setPastedSerials] = useState('');
    
    const [isScanning, setIsScanning] = useState(false);
    const [scanQueue, setScanQueue] = useState<string[]>([]);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

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

    // Lógica para aplicar números de série colados
    const applyPastedSerials = () => {
        const serials = pastedSerials.split('\n').map(s => s.trim()).filter(Boolean);
        setItems(prev => {
            const next = [...prev];
            serials.forEach((sn, idx) => {
                if (next[idx]) next[idx].serial_number = sn;
            });
            return next;
        });
        setShowBulkPaste(false);
        setPastedSerials('');
    };

    // Motor de Câmara para Scan Contínuo
    useEffect(() => {
        if (isScanning) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
                .catch(() => { alert("Erro ao aceder à câmara."); setIsScanning(false); });
        }
        return () => {
            if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            }
        };
    }, [isScanning]);

    const captureAndProcess = async () => {
        if (videoRef.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            ctx?.drawImage(videoRef.current, 0, 0);
            const dataUrl = canvasRef.current.toDataURL('image/jpeg');
            const base64 = dataUrl.split(',')[1];
            
            try {
                const sn = await extractTextFromImage(base64, 'image/jpeg');
                if (sn && !scanQueue.includes(sn)) {
                    setScanQueue(prev => [...prev, sn]);
                    // Feedback visual/sonoro (vibração se mobile)
                    if ('vibrate' in navigator) navigator.vibrate(100);
                }
            } catch (e) { console.error("OCR Error", e); }
        }
    };

    const applyScanQueue = () => {
        setItems(prev => {
            const next = [...prev];
            scanQueue.forEach((sn, idx) => {
                if (next[idx]) next[idx].serial_number = sn;
            });
            return next;
        });
        setIsScanning(false);
        setScanQueue([]);
    };

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
        const statusNormalized = commonStatus.toLowerCase();
        const isAcquisition = statusNormalized.includes('aquisiç') || statusNormalized.includes('encomenda');

        if (isSoftware) {
            if (items.some(i => !i.license_key || !i.product_name)) return alert("Preencha todos os dados da licença.");
        } else {
             if (!isAcquisition && items.some(i => !i.serial_number)) return alert("Preencha todos os Números de Série para entrada em Stock.");
             if (items.some(i => !i.brand_id || !i.type_id)) return alert("Preencha Marca e Tipo.");
        }

        setIsSaving(true);
        try {
            // FIX: GERAÇÃO DE PLACEHOLDERS PARA EVITAR ERRO DE DB EM "AQUISIÇÃO"
            const finalAssets = items.map((item, idx) => {
                const asset = {
                    ...item,
                    purchase_date: request.received_date || new Date().toISOString().split('T')[0],
                    supplier_id: request.supplier_id,
                    invoice_number: request.invoice_number,
                    requisition_number: request.order_reference,
                    acquisition_cost: request.estimated_cost ? (request.estimated_cost / request.quantity) : 0,
                    procurement_request_id: request.id,
                    criticality: CriticalityLevel.Low,
                };
                
                // Se não tem S/N e é aquisição, cria um ID temporário para a BD aceitar
                if (!asset.serial_number && isAcquisition) {
                    asset.serial_number = `ACQ-${request.id.substring(0,4)}-${idx + 1}`;
                }

                if (isSoftware) {
                    asset.total_seats = 1;
                    asset.is_oem = false;
                }
                return asset;
            });

            if (isSoftware) await onSave(finalAssets);
            else await onSave(finalAssets);
            
            onClose();
        } catch (e) {
            console.error(e);
            alert("Erro ao criar ativos na base de dados. Verifique a ligação.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal title={isSoftware ? "Receção de Software" : "Receção de Material"} onClose={onClose} maxWidth="max-w-6xl">
            <div className="space-y-6">
                
                {/* Scanner Contínuo UI Overlay */}
                {isScanning && (
                    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4">
                        <div className="relative w-full max-w-lg">
                            <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg border-2 border-brand-primary" />
                            <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-full text-white text-xs font-bold">
                                {scanQueue.length} / {request.quantity} Capturados
                            </div>
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                        
                        <div className="mt-6 flex flex-wrap justify-center gap-4">
                            <button onClick={() => setIsScanning(false)} className="px-6 py-3 bg-gray-700 text-white rounded-full font-bold">Cancelar</button>
                            <button onClick={captureAndProcess} className="px-8 py-3 bg-brand-primary text-white rounded-full font-bold flex items-center gap-2">
                                <FaCamera /> Capturar S/N
                            </button>
                            <button onClick={applyScanQueue} disabled={scanQueue.length === 0} className="px-8 py-3 bg-green-600 text-white rounded-full font-bold disabled:opacity-50">
                                Aplicar Capturas
                            </button>
                        </div>
                        <div className="mt-4 max-h-32 overflow-y-auto w-full max-w-lg space-y-1">
                            {scanQueue.map((s, i) => <div key={i} className="bg-gray-800 p-2 rounded text-xs text-green-400 font-mono flex justify-between"><span>#{i+1}: {s}</span> <button onClick={() => setScanQueue(prev => prev.filter(x => x !== s))}><FaTimes/></button></div>)}
                        </div>
                    </div>
                )}

                <div className="bg-blue-900/20 p-4 rounded border border-blue-500/30 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        {isSoftware ? <FaKey className="text-2xl text-yellow-400 mt-1" /> : <FaBoxOpen className="text-2xl text-blue-400 mt-1" />}
                        <div>
                            <h3 className="font-bold text-blue-200">Conversão de Pedido: {request.title}</h3>
                            <p className="text-sm text-gray-300">Quantidade a receber: <strong>{request.quantity}</strong> unidades.</p>
                        </div>
                    </div>
                    
                    {!isSoftware && (
                        <div className="flex gap-2">
                            <button onClick={() => setShowBulkPaste(!showBulkPaste)} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs flex items-center gap-2 transition-colors">
                                <FaPaste /> Colar em Massa
                            </button>
                            <button onClick={() => setIsScanning(true)} className="px-3 py-1.5 bg-brand-primary hover:bg-brand-secondary text-white rounded text-xs flex items-center gap-2 transition-colors">
                                <FaCamera /> Scan Contínuo
                            </button>
                        </div>
                    )}
                </div>

                {showBulkPaste && (
                    <div className="bg-gray-800 p-4 rounded border border-brand-primary/50 animate-fade-in">
                        <label className="block text-xs font-black text-gray-400 uppercase mb-2">Cole os Números de Série (um por linha)</label>
                        <textarea 
                            value={pastedSerials} 
                            onChange={e => setPastedSerials(e.target.value)} 
                            className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-sm text-white font-mono focus:border-brand-primary outline-none" 
                            rows={5} 
                            placeholder="SN123456&#10;SN789012..."
                        />
                        <div className="flex justify-end gap-2 mt-3">
                            <button onClick={() => setShowBulkPaste(false)} className="px-4 py-1 text-xs text-gray-400">Cancelar</button>
                            <button onClick={applyPastedSerials} className="px-4 py-1 bg-brand-primary text-white rounded text-xs font-bold">Distribuir pela Tabela</button>
                        </div>
                    </div>
                )}

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

                <div className="overflow-x-auto max-h-[50vh] custom-scrollbar border border-gray-700 rounded-lg shadow-inner">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-700 text-gray-300 uppercase text-[10px] font-black sticky top-0 z-10">
                            <tr>
                                <th className="p-3 w-10">#</th>
                                {isSoftware ? (
                                    <><th className="p-3">Produto</th><th className="p-3">Chave / Licença</th></>
                                ) : (
                                    <><th className="p-3">Nº Série</th><th className="p-3">Marca</th><th className="p-3">Tipo</th><th className="p-3">Descrição</th><th className="p-3">Garantia</th></>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {items.map((item, idx) => (
                                <tr key={idx} className="bg-surface-dark hover:bg-gray-800 transition-colors">
                                    <td className="p-3 text-gray-500 font-mono text-xs">{idx + 1}</td>
                                    {isSoftware ? (
                                        <>
                                            <td className="p-3"><input type="text" value={item.product_name} onChange={(e) => handleItemChange(idx, 'product_name', e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded p-1 w-full" /></td>
                                            <td className="p-3"><input type="text" value={item.license_key} onChange={(e) => handleItemChange(idx, 'license_key', e.target.value)} className="bg-gray-800 border border-gray-600 text-yellow-300 font-mono rounded p-1 w-full" /></td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="p-3"><input type="text" value={item.serial_number} onChange={(e) => handleItemChange(idx, 'serial_number', e.target.value)} className={`bg-gray-800 border border-gray-600 rounded p-1 w-full font-mono text-xs ${!item.serial_number ? 'text-gray-500' : 'text-white'}`} placeholder="Obrigatório para Stock" /></td>
                                            <td className="p-3"><select value={item.brand_id} onChange={(e) => handleItemChange(idx, 'brand_id', e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded p-1 w-full text-xs">{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></td>
                                            <td className="p-3"><select value={item.type_id} onChange={(e) => handleItemChange(idx, 'type_id', e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded p-1 w-full text-xs">{types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></td>
                                            <td className="p-3"><input type="text" value={item.description} onChange={(e) => handleItemChange(idx, 'description', e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded p-1 w-full text-xs" /></td>
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
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 font-bold">Cancelar</button>
                    <button onClick={handleSubmit} disabled={isSaving} className="px-8 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary flex items-center gap-2 font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50">
                        {isSaving ? <FaSpinner className="animate-spin" /> : <FaCheck />} 
                        {isSaving ? 'A Processar...' : 'Confirmar Entrada'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ReceiveAssetsModal;