
import React, { useState, useMemo } from 'react';
import Modal from './common/Modal';
import { Equipment, Entidade, Collaborator, Assignment, Ticket, SoftwareLicense, LicenseAssignment, BusinessService, ServiceDependency, Instituicao, Brand, EquipmentType } from '../types';
import { FaPrint, FaDownload, FaFilePdf, FaFilter } from 'react-icons/fa';
import PrintPreviewModal from './PrintPreviewModal';

interface ReportModalProps {
    type: string;
    onClose: () => void;
    equipment?: Equipment[];
    brandMap?: Map<string, string>;
    equipmentTypeMap?: Map<string, string>;
    instituicoes?: Instituicao[];
    escolasDepartamentos?: Entidade[];
    collaborators?: Collaborator[];
    assignments?: Assignment[];
    tickets?: Ticket[];
    softwareLicenses?: SoftwareLicense[];
    licenseAssignments?: LicenseAssignment[];
    businessServices?: BusinessService[];
    serviceDependencies?: ServiceDependency[];
}

const ReportModal: React.FC<ReportModalProps> = ({ 
    type, onClose, 
    equipment = [], brandMap = new Map(), equipmentTypeMap = new Map(), 
    instituicoes = [], escolasDepartamentos: entidades = [], collaborators = [], 
    assignments = [], tickets = [], softwareLicenses = [], licenseAssignments = [], 
    businessServices = [], serviceDependencies = [] 
}) => {
    const [ticketDateFrom, setTicketDateFrom] = useState('');
    const [ticketDateTo, setTicketDateTo] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [previewContent, setPreviewContent] = useState('');

    const instituicaoMap = useMemo(() => new Map(instituicoes.map(i => [i.id, i])), [instituicoes]);
    const entidadeMap = useMemo(() => new Map(entidades.map(e => [e.id, e.name])), [entidades]);

    const ticketReportData = useMemo(() => {
        if (type !== 'ticket') return null;

        const filteredTickets = (tickets || []).filter(ticket => {
            // FIX: request_date
            const requestDate = new Date(ticket.request_date);
            const fromMatch = !ticketDateFrom || requestDate >= new Date(ticketDateFrom);
            const toMatch = !ticketDateTo || requestDate <= new Date(ticketDateTo);
            return fromMatch && toMatch;
        });

        // FIX: instituicao_id
        const entidadeInstituicaoMap = new Map(entidades.map(e => [e.id, e.instituicao_id]));

        const byEntidade = filteredTickets.reduce((acc, ticket) => {
            // FIX: entidade_id
            const entidadeName = entidadeMap.get(ticket.entidade_id || '') || 'Desconhecido';
            acc.set(entidadeName, (acc.get(entidadeName) || 0) + 1);
            return acc;
        }, new Map<string, number>());

        const byInstituicao = filteredTickets.reduce((acc, ticket) => {
            // FIX: entidade_id
            const instituicaoId = entidadeInstituicaoMap.get(ticket.entidade_id || '');
            if (instituicaoId) {
                const instituicaoName = instituicaoMap.get(instituicaoId)?.name || 'Desconhecido';
                acc.set(instituicaoName, (acc.get(instituicaoName) || 0) + 1);
            }
            return acc;
        }, new Map<string, number>());
        
        return {
            type: 'ticket' as const,
            byEntidade: Array.from(byEntidade.entries()).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value),
            byInstituicao: Array.from(byInstituicao.entries()).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value),
            rawTickets: filteredTickets // Added for AI context
        };
    }, [type, tickets, ticketDateFrom, ticketDateTo, entidades, instituicoes, entidadeMap, instituicaoMap]);

    const handleGeneratePreview = () => {
        if (!ticketReportData) return;
        
        let html = `<h1>Relatório de Tickets</h1>`;
        html += `<p>Período: ${ticketDateFrom || 'Início'} a ${ticketDateTo || 'Fim'}</p>`;
        
        html += `<h3>Por Instituição</h3><ul>`;
        ticketReportData.byInstituicao.forEach(item => {
            html += `<li>${item.name}: ${item.value} tickets</li>`;
        });
        html += `</ul>`;

        html += `<h3>Por Entidade</h3><ul>`;
        ticketReportData.byEntidade.forEach(item => {
            html += `<li>${item.name}: ${item.value} tickets</li>`;
        });
        html += `</ul>`;

        setPreviewContent(html);
        setShowPreview(true);
    };

    return (
        <Modal title={`Relatório: ${type.charAt(0).toUpperCase() + type.slice(1)}`} onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-4">
                {type === 'ticket' && (
                    <div className="bg-gray-800 p-4 rounded border border-gray-700">
                        <h3 className="text-white font-bold mb-3 flex items-center gap-2"><FaFilter /> Filtros de Data</h3>
                        <div className="flex gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">De</label>
                                <input type="date" value={ticketDateFrom} onChange={e => setTicketDateFrom(e.target.value)} className="bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Até</label>
                                <input type="date" value={ticketDateTo} onChange={e => setTicketDateTo(e.target.value)} className="bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm" />
                            </div>
                        </div>
                    </div>
                )}
                
                {ticketReportData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-900 p-4 rounded border border-gray-700">
                            <h4 className="text-white font-bold mb-2">Por Instituição</h4>
                            <ul className="space-y-1 text-sm text-gray-300">
                                {ticketReportData.byInstituicao.map((item, idx) => (
                                    <li key={idx} className="flex justify-between border-b border-gray-800 py-1">
                                        <span>{item.name}</span>
                                        <span className="font-mono text-white">{item.value}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                         <div className="bg-gray-900 p-4 rounded border border-gray-700">
                            <h4 className="text-white font-bold mb-2">Por Entidade</h4>
                            <ul className="space-y-1 text-sm text-gray-300">
                                {ticketReportData.byEntidade.slice(0, 10).map((item, idx) => (
                                    <li key={idx} className="flex justify-between border-b border-gray-800 py-1">
                                        <span>{item.name}</span>
                                        <span className="font-mono text-white">{item.value}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500">Fechar</button>
                    {type === 'ticket' && (
                        <button onClick={handleGeneratePreview} className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary flex items-center gap-2">
                            <FaPrint /> Pré-visualizar / Imprimir
                        </button>
                    )}
                </div>
            </div>
            
            {showPreview && (
                <PrintPreviewModal onClose={() => setShowPreview(false)} reportContentHtml={previewContent} />
            )}
        </Modal>
    );
};

export default ReportModal;
