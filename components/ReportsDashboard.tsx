
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Equipment, Assignment, Collaborator, Entidade, Brand, EquipmentType, SoftwareLicense, LicenseAssignment } from '../types';
import { FaFileSignature, FaPrint, FaChartLine, FaSearch, FaEuroSign, FaCalendarAlt, FaEraser, FaPen, FaBuilding } from 'react-icons/fa';
import Pagination from './common/Pagination';
import * as dataService from '../services/dataService';

interface ReportsDashboardProps {
    equipment: Equipment[];
    assignments: Assignment[];
    collaborators: Collaborator[];
    entidades: Entidade[];
    brands: Brand[];
    equipmentTypes: EquipmentType[];
    softwareLicenses?: SoftwareLicense[];
    licenseAssignments?: LicenseAssignment[];
}

interface ExtendedAssignment extends Assignment {
    equipment?: Equipment;
    collaborator?: Collaborator;
}

const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ equipment, assignments, collaborators, entidades, brands, equipmentTypes, softwareLicenses = [], licenseAssignments = [] }) => {
    const [activeTab, setActiveTab] = useState<'delivery' | 'finops' | 'chargeback'>('delivery');
    
    // --- DELIVERY REPORT STATE ---
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAssignment, setSelectedAssignment] = useState<ExtendedAssignment | null>(null);
    const [signatureData, setSignatureData] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Maps for lookup
    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c])), [collaborators]);
    const entidadeMap = useMemo(() => new Map(entidades.map(e => [e.id, e.name])), [entidades]);
    const equipmentMap = useMemo(() => new Map(equipment.map(e => [e.id, e])), [equipment]);
    const brandMap = useMemo(() => new Map(brands.map(b => [b.id, b.name])), [brands]);
    const typeMap = useMemo(() => new Map(equipmentTypes.map(t => [t.id, t.name])), [equipmentTypes]);

    // Filter active assignments for delivery report
    const activeAssignments = useMemo(() => {
        return assignments.filter(a => !a.returnDate && a.collaboratorId).map(a => {
            const eq = equipmentMap.get(a.equipmentId);
            const col = collaboratorMap.get(a.collaboratorId!);
            return {
                ...a,
                equipment: eq,
                collaborator: col
            };
        }).filter(item => item.equipment && item.collaborator);
    }, [assignments, equipmentMap, collaboratorMap]);

    const filteredAssignments = useMemo(() => {
        return activeAssignments.filter(item => 
            item.equipment?.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.collaborator?.fullName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [activeAssignments, searchQuery]);

    // --- FINOPS STATE ---
    const currentYear = new Date().getFullYear();
    
    const forecastData = useMemo(() => {
        const forecast: Record<number, { count: number, cost: number, items: Equipment[] }> = {};
        
        equipment.forEach(eq => {
            if (eq.status === 'Abate') return;
            const purchaseYear = eq.purchaseDate ? new Date(eq.purchaseDate).getFullYear() : currentYear;
            const lifespan = eq.expectedLifespanYears || 4;
            const endOfLifeYear = purchaseYear + lifespan;
            
            if (endOfLifeYear >= currentYear) {
                if (!forecast[endOfLifeYear]) {
                    forecast[endOfLifeYear] = { count: 0, cost: 0, items: [] };
                }
                forecast[endOfLifeYear].count++;
                forecast[endOfLifeYear].cost += (eq.acquisitionCost || 0);
                forecast[endOfLifeYear].items.push(eq);
            }
        });
        
        return Object.entries(forecast)
            .map(([year, data]) => ({ year: parseInt(year), ...data }))
            .sort((a, b) => a.year - b.year);
    }, [equipment, currentYear]);

    // --- CHARGEBACK DATA ---
    const chargebackData = useMemo(() => {
        const entityCosts = new Map<string, { name: string, hardwareCost: number, softwareCost: number, items: number }>();

        // Initialize with all entities
        entidades.forEach(e => {
            entityCosts.set(e.id, { name: e.name, hardwareCost: 0, softwareCost: 0, items: 0 });
        });

        // Calculate Hardware Costs
        // Logic: Find active assignment for equipment -> get entity (direct or via collaborator) -> add cost
        const activeEqAssignments = assignments.filter(a => !a.returnDate);
        const eqAssignmentMap = new Map(activeEqAssignments.map(a => [a.equipmentId, a]));

        equipment.forEach(eq => {
            const assignment = eqAssignmentMap.get(eq.id);
            if (assignment) {
                let entityId = assignment.entidadeId;
                if (!entityId && assignment.collaboratorId) {
                    const col = collaboratorMap.get(assignment.collaboratorId);
                    if (col && col.entidadeId) entityId = col.entidadeId;
                }

                if (entityId && entityCosts.has(entityId)) {
                    const entry = entityCosts.get(entityId)!;
                    entry.hardwareCost += (eq.acquisitionCost || 0);
                    entry.items += 1;
                    entityCosts.set(entityId, entry);
                }
            }
        });

        // Calculate Software Costs (Licenses assigned to equipment)
        licenseAssignments.filter(la => !la.returnDate).forEach(la => {
             const license = softwareLicenses.find(l => l.id === la.softwareLicenseId);
             const eqAssignment = eqAssignmentMap.get(la.equipmentId);
             
             if (license && eqAssignment) {
                let entityId = eqAssignment.entidadeId;
                if (!entityId && eqAssignment.collaboratorId) {
                    const col = collaboratorMap.get(eqAssignment.collaboratorId);
                    if (col && col.entidadeId) entityId = col.entidadeId;
                }
                
                if (entityId && entityCosts.has(entityId)) {
                     const entry = entityCosts.get(entityId)!;
                     entry.softwareCost += (license.unitCost || 0);
                     entityCosts.set(entityId, entry);
                }
             }
        });

        return Array.from(entityCosts.values()).sort((a, b) => (b.hardwareCost + b.softwareCost) - (a.hardwareCost + a.softwareCost));
    }, [entidades, equipment, assignments, collaboratorMap, licenseAssignments, softwareLicenses]);


    // --- SIGNATURE CANVAS LOGIC ---
    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        const { offsetX, offsetY } = getCoordinates(e, canvas);
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { offsetX, offsetY } = getCoordinates(e, canvas);
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            setSignatureData(canvas.toDataURL());
        }
    };

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }
        return {
            offsetX: clientX - rect.left,
            offsetY: clientY - rect.top
        };
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
            setSignatureData(null);
        }
    };
    
    // Initialize Canvas
    useEffect(() => {
        if (activeTab === 'delivery' && selectedAssignment && canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
            }
        }
    }, [activeTab, selectedAssignment]);


    const handlePrintDelivery = () => {
        if (!selectedAssignment || !selectedAssignment.equipment || !selectedAssignment.collaborator) return;
        
        const eq = selectedAssignment.equipment;
        const col = selectedAssignment.collaborator;
        
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const signatureImg = signatureData ? `<img src="${signatureData}" style="max-height: 60px; display: block; margin: 0 auto;" />` : '<br/><br/>';

        printWindow.document.write(`
            <html>
            <head>
                <title>Auto de Entrega - ${eq.serialNumber}</title>
                <style>
                    body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; line-height: 1.6; }
                    h1 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 30px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                    th { background-color: #f0f0f0; }
                    .terms { font-size: 12px; text-align: justify; margin-bottom: 40px; }
                    .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
                    .sig-box { width: 45%; text-align: center; border-top: 1px solid #000; padding-top: 10px; }
                    .logo { text-align: center; margin-bottom: 20px; font-size: 20px; font-weight: bold; color: #555; }
                </style>
            </head>
            <body>
                <div class="logo">AIManager - Gestão de Ativos</div>
                <h1>Auto de Entrega de Equipamento</h1>
                
                <p><strong>Data de Entrega:</strong> ${selectedAssignment.assignedDate}</p>
                <p><strong>Colaborador (Receptor):</strong> ${col.fullName} (Nº Mec: ${col.numeroMecanografico})</p>
                
                <h3>Equipamento</h3>
                <table>
                    <tr><th>Tipo</th><td>${typeMap.get(eq.typeId)}</td></tr>
                    <tr><th>Marca</th><td>${brandMap.get(eq.brandId)}</td></tr>
                    <tr><th>Modelo / Descrição</th><td>${eq.description}</td></tr>
                    <tr><th>Nº Série</th><td>${eq.serialNumber}</td></tr>
                    <tr><th>Nº Inventário</th><td>${eq.inventoryNumber || 'N/A'}</td></tr>
                    <tr><th>Nº Requisição</th><td>${eq.requisitionNumber || 'N/A'}</td></tr>
                    <tr><th>Nome na Rede</th><td>${eq.nomeNaRede || 'N/A'}</td></tr>
                </table>

                <div class="terms">
                    <p>Ao assinar este documento, o colaborador declara ter recebido o equipamento acima descrito em perfeitas condições de funcionamento.</p>
                    <p>Compromete-se a zelar pelo bom estado do equipamento e a utilizá-lo exclusivamente para fins profissionais, de acordo com a política de segurança da informação da empresa.</p>
                    <p>Em caso de perda, roubo ou dano, deve comunicar imediatamente ao departamento de TI.</p>
                </div>

                <div class="signatures">
                    <div class="sig-box">
                        O Departamento de TI<br/>
                        (Entregue por)
                    </div>
                    <div class="sig-box">
                        O Colaborador<br/>
                        (Recebido por)<br/>
                        ${signatureImg}
                        <span>${col.fullName}</span>
                    </div>
                </div>
                
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-xl h-[calc(100vh-120px)] flex flex-col">
            <div className="flex border-b border-gray-700 mb-6 flex-shrink-0 overflow-x-auto">
                <button onClick={() => setActiveTab('delivery')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'delivery' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>
                    <FaFileSignature /> Auto de Entrega
                </button>
                <button onClick={() => setActiveTab('finops')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'finops' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>
                    <FaChartLine /> Previsão Capex
                </button>
                <button onClick={() => setActiveTab('chargeback')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'chargeback' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>
                    <FaBuilding /> Custos por Entidade (Chargeback)
                </button>
            </div>

            <div className="flex-grow overflow-hidden">
                {/* DELIVERY TAB */}
                {activeTab === 'delivery' && (
                    <div className="h-full flex flex-col md:flex-row gap-6">
                        {/* List Selection */}
                        <div className="w-full md:w-1/3 bg-gray-900/30 border border-gray-700 rounded-lg flex flex-col">
                            <div className="p-4 border-b border-gray-700">
                                <h3 className="font-bold text-white mb-2">Selecionar Atribuição</h3>
                                <div className="relative">
                                    <FaSearch className="absolute left-3 top-3 text-gray-500" />
                                    <input 
                                        type="text" 
                                        placeholder="Procurar Colaborador ou Serial..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-600 text-white rounded-md pl-9 p-2 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex-grow overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                {filteredAssignments.map(a => (
                                    <div 
                                        key={a.id} 
                                        onClick={() => { setSelectedAssignment(a); clearSignature(); }}
                                        className={`p-3 rounded cursor-pointer border transition-colors ${selectedAssignment?.id === a.id ? 'bg-brand-primary/20 border-brand-primary' : 'bg-surface-dark border-gray-700 hover:bg-gray-800'}`}
                                    >
                                        <p className="text-white font-medium text-sm">{a.collaborator?.fullName}</p>
                                        <p className="text-xs text-gray-400">{a.equipment?.description}</p>
                                        <p className="text-[10px] text-gray-500 font-mono">{a.equipment?.serialNumber}</p>
                                    </div>
                                ))}
                                {filteredAssignments.length === 0 && <p className="text-center text-gray-500 p-4 text-sm">Nenhuma atribuição ativa encontrada.</p>}
                            </div>
                        </div>

                        {/* Document Preview */}
                        <div className="w-full md:w-2/3 bg-white text-gray-900 p-8 rounded-lg shadow-lg overflow-y-auto flex flex-col relative">
                            {selectedAssignment ? (
                                <>
                                    <div className="text-center border-b-2 border-black pb-4 mb-6">
                                        <h1 className="text-2xl font-bold uppercase">Auto de Entrega</h1>
                                        <p className="text-sm text-gray-600">Gestão de Ativos de TI</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                                        <div>
                                            <p className="font-bold">Colaborador:</p>
                                            <p>{selectedAssignment.collaborator?.fullName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">Data:</p>
                                            <p>{selectedAssignment.assignedDate}</p>
                                        </div>
                                    </div>
                                    <table className="w-full text-sm mb-6 border-collapse border border-gray-300">
                                        <tbody>
                                            <tr className="bg-gray-100"><th className="border p-2 text-left">Equipamento</th><td className="border p-2">{selectedAssignment.equipment?.description}</td></tr>
                                            <tr><th className="border p-2 text-left">S/N</th><td className="border p-2 font-mono">{selectedAssignment.equipment?.serialNumber}</td></tr>
                                            <tr className="bg-gray-100"><th className="border p-2 text-left">Inventário</th><td className="border p-2">{selectedAssignment.equipment?.inventoryNumber || '-'}</td></tr>
                                        </tbody>
                                    </table>
                                    <div className="mt-auto">
                                        <p className="font-bold text-sm mb-2">Assinatura:</p>
                                        <div className="border-2 border-dashed border-gray-400 rounded bg-gray-50 h-32 relative touch-none">
                                            <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
                                            <button onClick={clearSignature} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 bg-white rounded-full p-1 shadow"><FaEraser /></button>
                                            {!isDrawing && !signatureData && <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-300 text-sm"><FaPen className="mr-2"/> Assine aqui</div>}
                                        </div>
                                        <div className="flex justify-end mt-4">
                                            <button onClick={handlePrintDelivery} className="flex items-center gap-2 bg-brand-primary text-white px-6 py-2 rounded hover:bg-brand-secondary shadow-lg"><FaPrint /> Imprimir</button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <FaFileSignature className="text-4xl mb-2 opacity-50" />
                                    <p>Selecione uma atribuição para gerar o documento.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* FINOPS TAB */}
                {activeTab === 'finops' && (
                    <div className="h-full overflow-y-auto custom-scrollbar p-2">
                        <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg mb-6">
                            <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FaChartLine className="text-green-400"/> Previsão de Custos de Substituição</h3>
                            <p className="text-sm text-gray-400">Estimativa de investimento necessário com base na vida útil esperada.</p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {forecastData.map((yearData) => (
                                <div key={yearData.year} className="bg-surface-dark border border-gray-700 rounded-lg p-4 shadow-lg">
                                    <div className="flex justify-between items-start mb-4 border-b border-gray-700 pb-2">
                                        <h4 className="text-xl font-bold text-white flex items-center gap-2"><FaCalendarAlt className="text-brand-secondary"/> {yearData.year}</h4>
                                        <div className="text-right"><p className="text-xs text-gray-400 uppercase">Orçamento Estimado</p><p className="text-xl font-bold text-green-400">€ {yearData.cost.toLocaleString()}</p></div>
                                    </div>
                                    <div className="text-center text-xs text-gray-500">{yearData.count} equipamentos para substituir</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* CHARGEBACK TAB */}
                {activeTab === 'chargeback' && (
                    <div className="h-full overflow-y-auto custom-scrollbar p-2 animate-fade-in">
                         <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg mb-6">
                            <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FaEuroSign className="text-yellow-400"/> Custos por Entidade (Chargeback)</h3>
                            <p className="text-sm text-gray-400">Distribuição de custos de Hardware e Software por departamento/entidade.</p>
                        </div>
                        
                        <div className="overflow-x-auto border border-gray-700 rounded-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-800 text-xs uppercase text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3">Entidade</th>
                                        <th className="px-4 py-3 text-center">Nº Ativos</th>
                                        <th className="px-4 py-3 text-right">Hardware (€)</th>
                                        <th className="px-4 py-3 text-right">Software (€)</th>
                                        <th className="px-4 py-3 text-right">Total (€)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700 bg-surface-dark">
                                    {chargebackData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-700/50">
                                            <td className="px-4 py-3 font-medium text-white">{row.name}</td>
                                            <td className="px-4 py-3 text-center">{row.items}</td>
                                            <td className="px-4 py-3 text-right font-mono text-gray-300">{row.hardwareCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                            <td className="px-4 py-3 text-right font-mono text-gray-300">{row.softwareCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                            <td className="px-4 py-3 text-right font-bold text-green-400 font-mono">{(row.hardwareCost + row.softwareCost).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                        </tr>
                                    ))}
                                    {chargebackData.length === 0 && (
                                        <tr><td colSpan={5} className="p-8 text-center text-gray-500">Sem dados de custos para apresentar.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportsDashboard;
