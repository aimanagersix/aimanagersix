import React, { useMemo } from 'react';
import Modal from './common/Modal';
import { ProcurementRequest, Collaborator, Supplier, ProcurementStatus, EquipmentType, ConfigItem, Brand } from '../types';
import { FaShoppingCart, FaPrint, FaEdit, FaBoxOpen, FaMicrochip, FaKey, FaClock, FaCheckCircle, FaFileContract, FaUserTie, FaTruck } from 'react-icons/fa';
import * as dataService from '../services/dataService';

/**
 * PROCUREMENT DETAIL MODAL - V1.0 (Consultation & Print)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - PEDIDO 2: FICHA DE CONSULTA COM RESUMO E IMPRESSÃO.
 * -----------------------------------------------------------------------------
 */

interface ProcurementDetailModalProps {
    procurement: ProcurementRequest;
    collaborators: Collaborator[];
    suppliers: Supplier[];
    onClose: () => void;
    onEdit: () => void;
    brandMap: Map<string, string>;
    equipmentTypeMap: Map<string, string>;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case ProcurementStatus.Pending: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
        case ProcurementStatus.Approved: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
        case ProcurementStatus.Ordered: return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
        case ProcurementStatus.Received: return 'text-teal-400 bg-teal-400/10 border-teal-400/20';
        case ProcurementStatus.Completed: return 'text-green-400 bg-green-400/10 border-green-400/20';
        case ProcurementStatus.Rejected: return 'text-red-400 bg-red-400/10 border-red-400/20';
        default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
};

const ProcurementDetailModal: React.FC<ProcurementDetailModalProps> = ({ 
    procurement, collaborators, suppliers, onClose, onEdit, brandMap, equipmentTypeMap 
}) => {
    
    const requester = collaborators.find(c => c.id === procurement.requester_id);
    const supplier = suppliers.find(s => s.id === procurement.supplier_id);
    const approver = collaborators.find(c => c.id === procurement.approver_id);

    const handlePrint = async () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const [logoBase64, sizeStr] = await Promise.all([
            dataService.getGlobalSetting('app_logo_base64'),
            dataService.getGlobalSetting('app_logo_size')
        ]);

        const itemsRows = (procurement.items || []).map((item, idx) => `
            <tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td><strong>${item.title}</strong><br/><small>${item.resource_type} | ${item.brand_id ? brandMap.get(item.brand_id) : '---'}</small></td>
                <td style="text-align:center;">${item.quantity}</td>
                <td style="text-align:right;">€ ${item.unit_cost.toLocaleString()}</td>
                <td style="text-align:right; font-weight:bold;">€ ${(item.quantity * item.unit_cost).toLocaleString()}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
            <head>
                <title>Pedido de Aquisição - ${procurement.title}</title>
                <style>
                    body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #333; line-height: 1.5; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0D47A1; padding-bottom: 20px; margin-bottom: 30px; }
                    .logo { max-height: ${sizeStr || '60'}px; }
                    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; background: #eee; font-size: 10px; font-weight: bold; text-transform: uppercase; border: 1px solid #ddd; }
                    .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
                    .info-block h4 { text-transform: uppercase; font-size: 10px; color: #666; margin: 0 0 5px 0; border-bottom: 1px solid #eee; }
                    .info-block p { margin: 0; font-size: 14px; font-weight: 500; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #f8f9fa; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #dee2e6; }
                    td { padding: 10px; border-bottom: 1px solid #eee; font-size: 12px; }
                    .totals { margin-top: 30px; text-align: right; }
                    .totals p { margin: 5px 0; }
                    .signatures { margin-top: 80px; display: grid; grid-template-cols: 1fr 1fr; gap: 100px; text-align: center; }
                    .sig-line { border-top: 1px solid #333; padding-top: 10px; font-size: 11px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        ${logoBase64 ? `<img src="${logoBase64}" class="logo" />` : '<h2 style="margin:0; color:#0D47A1;">AIManager</h2>'}
                        <p style="margin: 5px 0 0 0; font-size: 10px; color: #999;">Guia de Aquisição de Ativos</p>
                    </div>
                    <div style="text-align: right">
                        <h1 style="margin:0; font-size: 20px;">Pedido #${procurement.id.substring(0,8).toUpperCase()}</h1>
                        <div class="status-badge">${procurement.status}</div>
                    </div>
                </div>

                <div class="info-grid">
                    <div class="info-block">
                        <h4>Identificador do Pedido</h4>
                        <p>${procurement.title}</p>
                    </div>
                    <div class="info-block">
                        <h4>Data de Emissão</h4>
                        <p>${new Date(procurement.request_date).toLocaleDateString()}</p>
                    </div>
                    <div class="info-block">
                        <h4>Requerente</h4>
                        <p>${requester?.full_name || 'N/A'}</p>
                    </div>
                    <div class="info-block">
                        <h4>Fornecedor Previsto</h4>
                        <p>${supplier?.name || 'Pendente de Seleção'}</p>
                    </div>
                </div>

                <div style="margin-bottom: 30px;">
                    <h4 style="text-transform: uppercase; font-size: 10px; color: #666; margin-bottom: 10px;">Justificação do Investimento</h4>
                    <p style="font-size: 13px; font-style: italic; background: #fdfdfd; padding: 15px; border-left: 4px solid #eee;">"${procurement.description || 'Sem descrição adicional.'}"</p>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 40px; text-align:center;">Pos.</th>
                            <th>Descrição do Item</th>
                            <th style="width: 60px; text-align:center;">Qtd.</th>
                            <th style="width: 100px; text-align:right;">P. Unitário</th>
                            <th style="width: 120px; text-align:right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRows}
                    </tbody>
                </table>

                <div class="totals">
                    <p style="font-size: 12px; color: #666;">Total de Itens: <strong>${procurement.quantity}</strong></p>
                    <p style="font-size: 18px; color: #0D47A1;">Valor Global Estimado: <strong>€ ${procurement.estimated_cost.toLocaleString()}</strong></p>
                </div>

                <div class="signatures">
                    <div class="sig-block">
                        <div class="sig-line">Solicitado por: ${requester?.full_name || '______________________'}</div>
                    </div>
                    <div class="sig-block">
                        <div class="sig-line">Aprovado por: ${approver?.full_name || '______________________'}</div>
                    </div>
                </div>

                <div style="position: fixed; bottom: 20px; width: 100%; text-align: center; font-size: 9px; color: #aaa;">
                    Documento gerado automaticamente pelo AIManager v${process.env.APP_VERSION} - Conformidade NIS2/DORA
                </div>

                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <Modal title="Consulta de Aquisição" onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-6">
                
                {/* Header Context */}
                <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-primary/20 rounded-lg text-brand-secondary">
                            <FaShoppingCart size={24}/>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{procurement.title}</h2>
                            <div className="flex gap-3 text-[10px] uppercase font-black tracking-widest mt-1 text-gray-500">
                                <span className="flex items-center gap-1"><FaClock/> {new Date(procurement.request_date).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1"><FaUserTie/> {requester?.full_name}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-4 py-1 rounded-full text-xs font-black uppercase border ${getStatusColor(procurement.status)}`}>
                            {procurement.status}
                        </span>
                        <button onClick={handlePrint} className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded border border-gray-600 transition-colors" title="Imprimir Guia"><FaPrint/></button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Left: Items List */}
                    <div className="md:col-span-2 space-y-4">
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2">Composição do Pedido</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                            {(procurement.items || []).map((item, idx) => (
                                <div key={idx} className="bg-gray-800/40 p-3 rounded-lg border border-gray-700 flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        {item.resource_type === 'Hardware' ? <FaMicrochip className="text-blue-400"/> : <FaKey className="text-yellow-400"/>}
                                        <div>
                                            <p className="text-sm font-bold text-white">{item.title}</p>
                                            <p className="text-[10px] text-gray-500 uppercase">{item.brand_id ? brandMap.get(item.brand_id) : 'Marca genérica'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-white font-mono">{item.quantity} x € {item.unit_cost.toLocaleString()}</p>
                                        <p className="text-xs text-brand-secondary font-black">€ {(item.quantity * item.unit_cost).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 italic text-sm text-gray-400">
                            <span className="font-bold text-gray-500 block mb-1 uppercase text-[10px]">Justificação:</span>
                            "{procurement.description || 'Sem justificação adicional registada.'}"
                        </div>
                    </div>

                    {/* Right: Management Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-gray-800/20 p-4 rounded-xl border border-gray-800 space-y-4">
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2">Dados de Gestão</h4>
                            
                            <div className="space-y-3">
                                <div>
                                    <p className="text-[9px] text-gray-600 uppercase font-black">Fornecedor</p>
                                    <p className="text-sm text-white font-bold flex items-center gap-2 mt-0.5">
                                        <FaTruck size={12} className="text-gray-500"/> {supplier?.name || '---'}
                                    </p>
                                </div>
                                {procurement.order_reference && (
                                    <div>
                                        <p className="text-[9px] text-gray-600 uppercase font-black">Ref. Encomenda</p>
                                        <p className="text-xs text-white font-mono mt-0.5">{procurement.order_reference}</p>
                                    </div>
                                )}
                                {procurement.invoice_number && (
                                    <div>
                                        <p className="text-[9px] text-gray-600 uppercase font-black">Nº Fatura</p>
                                        <p className="text-xs text-white font-mono mt-0.5">{procurement.invoice_number}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {approver && (
                            <div className="bg-green-900/10 p-4 rounded-xl border border-green-500/20">
                                <h4 className="text-[10px] font-black text-green-400 uppercase tracking-widest flex items-center gap-2 mb-2"><FaCheckCircle/> Governança</h4>
                                <p className="text-xs text-gray-300">Aprovado por:</p>
                                <p className="text-sm text-white font-bold">{approver.full_name}</p>
                                <p className="text-[10px] text-gray-500 mt-1">{new Date(procurement.approval_date || '').toLocaleDateString()}</p>
                            </div>
                        )}

                        <div className="bg-brand-primary/10 p-4 rounded-xl border border-brand-primary/30 text-center">
                            <p className="text-[10px] text-gray-400 uppercase font-black mb-1">Total Estimado</p>
                            <p className="text-2xl font-black text-white">€ {procurement.estimated_cost.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-800">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-bold text-xs uppercase tracking-widest transition-all">Fechar</button>
                    <button onClick={onEdit} className="px-8 py-2 bg-brand-primary hover:bg-brand-secondary text-white rounded font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg"><FaEdit/> Editar Pedido</button>
                </div>
            </div>
        </Modal>
    );
};

export default ProcurementDetailModal;