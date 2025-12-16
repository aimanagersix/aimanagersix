
import React, { useState, useMemo } from 'react';
import { AppData } from '../hooks/useAppData';
import { FaFilter, FaSync, FaEuroSign, FaBoxOpen, FaFileInvoiceDollar, FaLaptop, FaPrint } from 'react-icons/fa';
import * as dataService from '../services/dataService';

// Helper component for multi-select filters
const MultiSelectFilter: React.FC<{
    label: string;
    options: { id: string; name: string }[];
    selected: string[];
    onChange: (selected: string[]) => void;
}> = ({ label, options, selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (id: string) => {
        const newSelected = selected.includes(id)
            ? selected.filter(s => s !== id)
            : [...selected, id];
        onChange(newSelected);
    };

    return (
        <div className="relative">
            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-left text-sm text-white flex justify-between items-center"
            >
                <span className="truncate">
                    {selected.length === 0 ? 'Todos' : `${selected.length} selecionado(s)`}
                </span>
                <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {options.map(option => (
                        <label key={option.id} className="flex items-center gap-2 p-2 hover:bg-gray-700 cursor-pointer text-sm">
                            <input
                                type="checkbox"
                                checked={selected.includes(option.id)}
                                onChange={() => handleSelect(option.id)}
                                className="rounded bg-gray-700 border-gray-500 text-brand-secondary focus:ring-brand-primary"
                            />
                            <span className="text-gray-300">{option.name}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

// Reusable Chart Card Component
const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg shadow-lg h-full flex flex-col">
        <h3 className="text-md font-bold text-white mb-4">{title}</h3>
        <div className="flex-grow">{children}</div>
    </div>
);

const BIReportDashboard: React.FC<{ appData: AppData }> = ({ appData }) => {
    
    const [filters, setFilters] = useState({
        institutionIds: [] as string[],
        entityIds: [] as string[],
        status: [] as string[],
        typeIds: [] as string[],
        dateFrom: '',
        dateTo: '',
    });

    // Memoized maps for performance
    const entityMap = useMemo(() => new Map(appData.entidades.map(e => [e.id, e])), [appData.entidades]);
    const collabMap = useMemo(() => new Map(appData.collaborators.map(c => [c.id, c])), [appData.collaborators]);

    // Derived filter options
    const entityOptions = useMemo(() => {
        if (filters.institutionIds.length === 0) return appData.entidades;
        return appData.entidades.filter(e => filters.institutionIds.includes(e.instituicaoId));
    }, [appData.entidades, filters.institutionIds]);

    const statusOptions = useMemo(() => appData.configEquipmentStatuses.map(s => ({id: s.name, name: s.name})), [appData.configEquipmentStatuses]);

    // Main data filtering logic
    const filteredData = useMemo<{ filteredEquipment: any[], softwareCost: number }>(() => {
        let filteredEquipment = appData.equipment;

        // Date Filter - Add check for undefined purchaseDate
        if (filters.dateFrom) filteredEquipment = filteredEquipment.filter(e => e.purchaseDate && e.purchaseDate >= filters.dateFrom);
        if (filters.dateTo) filteredEquipment = filteredEquipment.filter(e => e.purchaseDate && e.purchaseDate <= filters.dateTo);
        
        // Status & Type Filter
        if (filters.status.length > 0) filteredEquipment = filteredEquipment.filter(e => filters.status.includes(e.status));
        if (filters.typeIds.length > 0) filteredEquipment = filteredEquipment.filter(e => filters.typeIds.includes(e.typeId));
        
        // Org Filter (most complex)
        if (filters.institutionIds.length > 0 || filters.entityIds.length > 0) {
            const allowedEntityIds = new Set(filters.entityIds);
            if(filters.institutionIds.length > 0) {
                appData.entidades.forEach(e => {
                    if(filters.institutionIds.includes(e.instituicaoId)) allowedEntityIds.add(e.id);
                });
            }

            const equipmentInEntities = new Set<string>();
            appData.assignments.forEach(a => {
                if (!a.returnDate) { // Only active assignments
                    let entityId = a.entidadeId;
                    if(!entityId && a.collaboratorId) {
                        const collab = collabMap.get(a.collaboratorId);
                        if (collab) entityId = collab.entidadeId;
                    }
                    if (entityId && allowedEntityIds.has(entityId)) {
                        equipmentInEntities.add(a.equipmentId);
                    }
                }
            });
            filteredEquipment = filteredEquipment.filter(e => equipmentInEntities.has(e.id));
        }

        // Calculate Software Cost based on filtered equipment
        let softwareCost = 0;
        const filteredEquipmentIds = new Set(filteredEquipment.map(e => e.id));
        appData.licenseAssignments.forEach(la => {
            if (!la.returnDate && filteredEquipmentIds.has(la.equipmentId)) {
                const license = appData.softwareLicenses.find(l => l.id === la.softwareLicenseId);
                if (license) softwareCost += (license.unitCost || 0);
            }
        });
        
        return { filteredEquipment, softwareCost };
    }, [appData, filters, collabMap]);

    // KPI Calculations
    const kpiData = useMemo(() => {
        const hardwareCost = filteredData.filteredEquipment.reduce((sum, eq) => sum + (eq.acquisitionCost || 0), 0);
        return {
            totalAssets: filteredData.filteredEquipment.length,
            hardwareCost,
            softwareCost: filteredData.softwareCost,
            totalCost: hardwareCost + filteredData.softwareCost,
        };
    }, [filteredData]);

    // Chart Data Aggregations
    const costByEntity = useMemo(() => {
        const costs = new Map<string, number>();
        filteredData.filteredEquipment.forEach(eq => {
            const assignment = appData.assignments.find(a => a.equipmentId === eq.id && !a.returnDate);
            if (assignment) {
                let entityId = assignment.entidadeId;
                if (!entityId && assignment.collaboratorId) {
                    entityId = collabMap.get(assignment.collaboratorId)?.entidadeId;
                }
                if(entityId) {
                    const name = entityMap.get(entityId)?.name || 'Desconhecido';
                    costs.set(name, (costs.get(name) || 0) + (eq.acquisitionCost || 0));
                }
            }
        });
        return Array.from(costs.entries()).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    }, [filteredData, appData.assignments, entityMap, collabMap]);

    const costByStatus = useMemo(() => {
        const costs = new Map<string, number>();
        filteredData.filteredEquipment.forEach(eq => {
            const status = String(eq.status);
            costs.set(status, (costs.get(status) || 0) + (eq.acquisitionCost || 0));
        });
        return Array.from(costs.entries()).map(([name, value]) => ({ name, value }));
    }, [filteredData]);
    
    const costByType = useMemo(() => {
        const typeMap = new Map(appData.equipmentTypes.map(t => [t.id, t.name]));
        const costs = new Map<string, number>();
        filteredData.filteredEquipment.forEach(eq => {
            const name = String(typeMap.get(eq.typeId) || 'Desconhecido');
            costs.set(name, (costs.get(name) || 0) + (eq.acquisitionCost || 0));
        });
        return Array.from(costs.entries()).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    }, [filteredData, appData.equipmentTypes]);

    const handleClearFilters = () => {
        setFilters({ institutionIds: [], entityIds: [], status: [], typeIds: [], dateFrom: '', dateTo: '' });
    };

    const handlePrintReport = async () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        // 1. Get Branding
        const [logoBase64, sizeStr, align, footerId] = await Promise.all([
            dataService.getGlobalSetting('app_logo_base64'),
            dataService.getGlobalSetting('app_logo_size'),
            dataService.getGlobalSetting('app_logo_alignment'),
            dataService.getGlobalSetting('report_footer_institution_id')
        ]);
        const logoSize = sizeStr ? parseInt(sizeStr) : 80;

        // 2. Prepare Footer
        let footerHtml = '';
        if (footerId) {
            const inst = appData.instituicoes.find((i: any) => i.id === footerId);
            if (inst) {
                footerHtml = `<div class="footer"><p><strong>${inst.name}</strong> | ${[inst.address_line, inst.postal_code, inst.city].filter(Boolean).join(', ')} | NIF: ${inst.nif}</p></div>`;
            }
        }

        // 3. Generate Table Rows
        const entityRows = costByEntity.map(item => `
            <tr>
                <td>${item.name}</td>
                <td style="text-align: right;">€ ${item.value.toLocaleString('pt-PT', {minimumFractionDigits: 2})}</td>
                <td style="text-align: right;">${kpiData.totalCost > 0 ? ((item.value / kpiData.totalCost) * 100).toFixed(1) : 0}%</td>
            </tr>
        `).join('');

        const typeRows = costByType.map(item => `
            <tr>
                <td>${item.name}</td>
                <td style="text-align: right;">€ ${item.value.toLocaleString('pt-PT', {minimumFractionDigits: 2})}</td>
            </tr>
        `).join('');

        const statusRows = costByStatus.map(item => `
            <tr>
                <td>${item.name}</td>
                <td style="text-align: right;">€ ${item.value.toLocaleString('pt-PT', {minimumFractionDigits: 2})}</td>
            </tr>
        `).join('');

        // 4. Construct HTML
        printWindow.document.write(`
            <html>
            <head>
                <title>Relatório Financeiro de Ativos</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; max-width: 210mm; margin: 0 auto; }
                    .header-container { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #0D47A1; padding-bottom: 20px; margin-bottom: 30px; }
                    .logo { max-height: ${logoSize}px; max-width: 250px; }
                    .report-title { text-align: right; }
                    h1 { margin: 0; color: #0D47A1; font-size: 24px; }
                    .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
                    
                    .summary-box { background-color: #f8f9fa; border: 1px solid #e9ecef; padding: 20px; border-radius: 5px; display: flex; justify-content: space-around; margin-bottom: 30px; }
                    .kpi { text-align: center; }
                    .kpi-val { font-size: 20px; font-weight: bold; color: #0D47A1; display: block; }
                    .kpi-lbl { font-size: 11px; text-transform: uppercase; color: #666; }
                    
                    .section { margin-bottom: 30px; page-break-inside: avoid; }
                    h3 { color: #333; font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 0; text-transform: uppercase; }
                    
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                    th, td { border-bottom: 1px solid #eee; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; color: #444; border-bottom: 2px solid #ddd; }
                    tr:nth-child(even) { background-color: #fbfbfb; }
                    
                    .footer { position: fixed; bottom: 10px; left: 0; width: 100%; text-align: center; font-size: 9pt; color: #999; border-top: 1px solid #eee; padding-top: 10px; background: white; }
                    @media print { body { padding: 0; } .footer { position: fixed; bottom: 0; } }
                </style>
            </head>
            <body>
                <div class="header-container">
                    <div>
                        ${logoBase64 ? `<img src="${logoBase64}" class="logo" />` : '<h2>AIManager</h2>'}
                    </div>
                    <div class="report-title">
                        <h1>Relatório Financeiro</h1>
                        <div class="subtitle">Análise de Custos e Inventário</div>
                    </div>
                </div>

                <div class="summary-box">
                    <div class="kpi">
                        <span class="kpi-val">${kpiData.totalAssets}</span>
                        <span class="kpi-lbl">Total Ativos</span>
                    </div>
                    <div class="kpi">
                        <span class="kpi-val">€ ${kpiData.hardwareCost.toLocaleString('pt-PT', {minimumFractionDigits: 2})}</span>
                        <span class="kpi-lbl">Custo Hardware</span>
                    </div>
                    <div class="kpi">
                        <span class="kpi-val">€ ${kpiData.softwareCost.toLocaleString('pt-PT', {minimumFractionDigits: 2})}</span>
                        <span class="kpi-lbl">Custo Software</span>
                    </div>
                    <div class="kpi">
                        <span class="kpi-val">€ ${kpiData.totalCost.toLocaleString('pt-PT', {minimumFractionDigits: 2})}</span>
                        <span class="kpi-lbl">Custo Total</span>
                    </div>
                </div>

                <div class="section">
                    <h3>Custos por Entidade (Top 50)</h3>
                    <table>
                        <thead>
                            <tr><th>Entidade</th><th style="text-align: right;">Custo Alocado</th><th style="text-align: right;">% do Total</th></tr>
                        </thead>
                        <tbody>${entityRows}</tbody>
                    </table>
                </div>

                <div style="display: flex; gap: 40px;">
                    <div class="section" style="flex: 1;">
                        <h3>Custos por Tipo de Equipamento</h3>
                        <table>
                            <thead><tr><th>Tipo</th><th style="text-align: right;">Custo</th></tr></thead>
                            <tbody>${typeRows}</tbody>
                        </table>
                    </div>
                    <div class="section" style="flex: 1;">
                        <h3>Custos por Estado</h3>
                        <table>
                            <thead><tr><th>Estado</th><th style="text-align: right;">Valor</th></tr></thead>
                            <tbody>${statusRows}</tbody>
                        </table>
                    </div>
                </div>

                ${footerHtml}
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full animate-fade-in">
            {/* Filters Panel */}
            <div className="w-full lg:w-1/4 xl:w-1/5 bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex-shrink-0">
                <div className="flex justify-between items-center mb-4 border-b border-gray-600 pb-2">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2"><FaFilter /> Filtros</h2>
                    <button onClick={handleClearFilters} className="text-xs text-gray-400 hover:text-white flex items-center gap-1"><FaSync /> Limpar</button>
                </div>
                <div className="space-y-4">
                    <MultiSelectFilter label="Instituições" options={appData.instituicoes} selected={filters.institutionIds} onChange={s => setFilters(f => ({ ...f, institutionIds: s, entityIds: [] }))} />
                    <MultiSelectFilter label="Entidades" options={entityOptions} selected={filters.entityIds} onChange={s => setFilters(f => ({ ...f, entityIds: s }))} />
                    <MultiSelectFilter label="Estado Equipamento" options={statusOptions} selected={filters.status} onChange={s => setFilters(f => ({ ...f, status: s }))} />
                    <MultiSelectFilter label="Tipo Equipamento" options={appData.equipmentTypes} selected={filters.typeIds} onChange={s => setFilters(f => ({ ...f, typeIds: s }))} />
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Período Aquisição</label>
                        <input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({...f, dateFrom: e.target.value}))} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-sm text-white mb-2"/>
                        <input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({...f, dateTo: e.target.value}))} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-sm text-white"/>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Relatório de Custos (BI)</h2>
                    <button
                        onClick={handlePrintReport}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors shadow-lg"
                    >
                        <FaPrint /> Imprimir Relatório
                    </button>
                </div>
                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-500/30 text-center">
                        <FaEuroSign className="text-3xl text-blue-400 mx-auto mb-2"/>
                        <p className="text-xs text-blue-200 uppercase">Custo Total Ativos</p>
                        <p className="text-2xl font-bold text-white">€{kpiData.totalCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    </div>
                     <div className="bg-green-900/30 p-4 rounded-lg border border-green-500/30 text-center">
                        <FaLaptop className="text-3xl text-green-400 mx-auto mb-2"/>
                        <p className="text-xs text-green-200 uppercase">Custo Hardware</p>
                        <p className="text-2xl font-bold text-white">€{kpiData.hardwareCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    </div>
                     <div className="bg-yellow-900/30 p-4 rounded-lg border border-yellow-500/30 text-center">
                        <FaFileInvoiceDollar className="text-3xl text-yellow-400 mx-auto mb-2"/>
                        <p className="text-xs text-yellow-200 uppercase">Custo Software</p>
                        <p className="text-2xl font-bold text-white">€{kpiData.softwareCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    </div>
                     <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 text-center">
                        <FaBoxOpen className="text-3xl text-gray-300 mx-auto mb-2"/>
                        <p className="text-xs text-gray-400 uppercase">Total de Ativos</p>
                        <p className="text-2xl font-bold text-white">{kpiData.totalAssets}</p>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Custo por Entidade (Top 10)">
                        <div className="space-y-2">
                            {costByEntity.slice(0, 10).map((item, idx) => (
                                <div key={idx} className="flex items-center text-sm">
                                    <div className="w-1/3 truncate text-gray-300">{item.name}</div>
                                    <div className="w-2/3 flex items-center">
                                        <div className="w-full bg-gray-700 rounded-full h-4"><div className="bg-blue-500 h-4 rounded-full" style={{ width: `${(item.value / (costByEntity[0]?.value || 1)) * 100}%`}}></div></div>
                                        <span className="ml-2 font-mono text-xs text-white">€{item.value.toFixed(0)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ChartCard>
                    <ChartCard title="Custo por Tipo de Ativo">
                        <div className="space-y-2">
                            {costByType.slice(0,10).map((item, idx) => (
                                <div key={idx} className="flex items-center text-sm">
                                    <div className="w-1/3 truncate text-gray-300">{item.name}</div>
                                    <div className="w-2/3 flex items-center">
                                        <div className="w-full bg-gray-700 rounded-full h-4"><div className="bg-green-500 h-4 rounded-full" style={{ width: `${(item.value / (costByType[0]?.value || 1)) * 100}%`}}></div></div>
                                        <span className="ml-2 font-mono text-xs text-white">€{item.value.toFixed(0)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ChartCard>
                     <ChartCard title="Distribuição de Custos por Estado">
                        <div className="flex flex-wrap items-center justify-center h-full gap-4">
                        {costByStatus.map((item, idx) => {
                            const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
                            return (
                                <div key={idx} className="text-center mx-4">
                                    <div className="text-2xl font-bold" style={{color: colors[idx % colors.length]}}>{item.value.toLocaleString(undefined, {style: 'currency', currency: 'EUR'})}</div>
                                    <div className="text-sm text-gray-400 mt-1">{item.name}</div>
                                </div>
                            )
                        })}
                        </div>
                    </ChartCard>
                </div>
            </div>
        </div>
    );
};

export default BIReportDashboard;
