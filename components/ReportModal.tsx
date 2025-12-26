
import React, { useState, useMemo } from 'react';
import Modal from './common/Modal';
import { Equipment, Entidade, Collaborator, Assignment, Ticket, SoftwareLicense, LicenseAssignment, BusinessService, ServiceDependency, Instituicao, Brand, EquipmentType, Holiday } from '../types';
import { FaPrint, FaDownload, FaFilePdf, FaFilter, FaUmbrellaBeach, FaCalendarAlt } from 'react-icons/fa';
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
    holidays?: Holiday[]; 
}

const ReportModal: React.FC<ReportModalProps> = ({ 
    type, onClose, 
    equipment = [], brandMap = new Map(), equipmentTypeMap = new Map(), 
    instituicoes = [], escolasDepartamentos: entidades = [], collaborators = [], 
    assignments = [], tickets = [], softwareLicenses = [], licenseAssignments = [], 
    businessServices = [], serviceDependencies = [], holidays = []
}) => {
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [previewContent, setPreviewContent] = useState('');

    const instituicaoMap = useMemo(() => new Map(instituicoes.map(i => [i.id, i])), [instituicoes]);
    const entidadeMap = useMemo(() => new Map(entidades.map(e => [e.id, e.name])), [entidades]);
    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.full_name])), [collaborators]);

    const reportData = useMemo(() => {
        if (type === 'ticket') {
            const filteredTickets = (tickets || []).filter(ticket => {
                const requestDate = new Date(ticket.request_date);
                const fromMatch = !dateFrom || requestDate >= new Date(dateFrom);
                const toMatch = !dateTo || requestDate <= new Date(dateTo);
                return fromMatch && toMatch;
            });
            return { type: 'ticket', tickets: filteredTickets };
        }

        if (type === 'vacations') {
            const filteredHolidays = holidays.filter(h => {
                const hDate = new Date(h.start_date);
                const fromMatch = !dateFrom || hDate >= new Date(dateFrom);
                const toMatch = !dateTo || hDate <= new Date(dateTo);
                return fromMatch && toMatch && h.type === 'Vacation';
            }).sort((a,b) => a.start_date.localeCompare(b.start_date));
            return { type: 'vacations', items: filteredHolidays };
        }

        return null;
    }, [type, tickets, holidays, dateFrom, dateTo]);

    const handleGeneratePreview = () => {
        if (!reportData) return;
        
        let html = `<h1 style="color:#0D47A1; border-bottom:2px solid #0D47A1; padding-bottom:10px;">${type === 'ticket' ? 'Relatório de Suporte Técnico' : 'Mapa de Férias e Ausências'}</h1>`;
        html += `<p style="font-size:12px; color:#666;">Período: ${dateFrom || 'Início'} a ${dateTo || 'Hoje'}</p>`;
        
        if (reportData.type === 'ticket' && reportData.tickets) {
            html += `<table style="width:100%; border-collapse:collapse; margin-top:20px; font-size:11px;">
                <thead><tr style="background:#eee;">
                    <th style="border:1px solid #ddd; padding:8px;">Data</th>
                    <th style="border:1px solid #ddd; padding:8px;">Título</th>
                    <th style="border:1px solid #ddd; padding:8px;">Categoria</th>
                    <th style="border:1px solid #ddd; padding:8px;">Estado</th>
                </tr></thead>
                <tbody>`;
            reportData.tickets.forEach((t:any) => {
                html += `<tr>
                    <td style="border:1px solid #ddd; padding:8px;">${new Date(t.request_date).toLocaleDateString()}</td>
                    <td style="border:1px solid #ddd; padding:8px;">${t.title}</td>
                    <td style="border:1px solid #ddd; padding:8px;">${t.category}</td>
                    <td style="border:1px solid #ddd; padding:8px;">${t.status}</td>
                </tr>`;
            });
            html += `</tbody></table>`;
        }

        if (reportData.type === 'vacations' && reportData.items) {
            html += `<table style="width:100%; border-collapse:collapse; margin-top:20px; font-size:11px;">
                <thead><tr style="background:#eee;">
                    <th style="border:1px solid #ddd; padding:8px;">Período</th>
                    <th style="border:1px solid #ddd; padding:8px;">Colaborador</th>
                    <th style="border:1px solid #ddd; padding:8px;">Descrição / Motivo</th>
                </tr></thead>
                <tbody>`;
            reportData.items.forEach((h:any) => {
                const range = h.end_date && h.end_date !== h.start_date 
                    ? `${new Date(h.start_date).toLocaleDateString()} a ${new Date(h.end_date).toLocaleDateString()}`
                    : new Date(h.start_date).toLocaleDateString();

                html += `<tr>
                    <td style="border:1px solid #ddd; padding:8px; font-weight:bold;">${range}</td>
                    <td style="border:1px solid #ddd; padding:8px;">${collaboratorMap.get(h.collaborator_id) || 'Todos'}</td>
                    <td style="border:1px solid #ddd; padding:8px;">${h.name}</td>
                </tr>`;
            });
            html += `</tbody></table>`;
        }

        setPreviewContent(html);
        setShowPreview(true);
    };

    return (
        <Modal title={type === 'vacations' ? "Relatório de Ausências" : "Gerador de Relatórios"} onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-4">
                <div className="bg-gray-800 p-4 rounded border border-gray-700">
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2"><FaFilter /> Parâmetros de Tempo</h3>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-400 mb-1 uppercase font-bold">Data Início</label>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm focus:border-brand-primary" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs text-gray-400 mb-1 uppercase font-bold">Data Fim</label>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm focus:border-brand-primary" />
                        </div>
                    </div>
                </div>
                
                <div className="bg-gray-900/50 p-6 rounded border border-dashed border-gray-700 text-center space-y-4">
                    {type === 'vacations' ? (
                        <div className="flex flex-col items-center">
                            <FaUmbrellaBeach className="text-4xl text-pink-400 mb-2" />
                            <p className="text-gray-300">Este relatório consolidará todas as férias e ausências planeadas para o período selecionado.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <FaCalendarAlt className="text-4xl text-blue-400 mb-2" />
                            <p className="text-gray-300">A gerar relatório de atividade operacional (Tickets e SLAs).</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded font-bold hover:bg-gray-500">Cancelar</button>
                    <button onClick={handleGeneratePreview} className="px-6 py-2 bg-brand-primary text-white rounded font-bold hover:bg-brand-secondary flex items-center gap-2 shadow-lg">
                        <FaPrint /> Gerar PDF / Imprimir
                    </button>
                </div>
            </div>
            
            {showPreview && (
                <PrintPreviewModal onClose={() => setShowPreview(false)} reportContentHtml={previewContent} />
            )}
        </Modal>
    );
};

export default ReportModal;
