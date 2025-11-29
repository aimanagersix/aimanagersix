
import React, { useState, useMemo, useRef, useEffect } from 'react';
import Modal from './common/Modal';
import { Equipment, Instituicao, Entidade, Collaborator, Assignment, Ticket, SoftwareLicense, LicenseAssignment, CriticalityLevel, BusinessService, ServiceDependency } from '../types';
import { MailIcon, FaEye, FaMagic } from './common/Icons';
import { FaFileCsv, FaRobot, FaSpinner } from 'react-icons/fa';
import PrintPreviewModal from './PrintPreviewModal';
import { generateExecutiveReport, isAiConfigured } from '../services/geminiService';

interface ReportModalProps {
    type: 'equipment' | 'collaborator' | 'ticket' | 'licensing' | 'compliance' | 'bia';
    onClose: () => void;
    equipment: Equipment[];
    brandMap: Map<string, string>;
    equipmentTypeMap: Map<string, string>;
    instituicoes: Instituicao[];
    escolasDepartamentos: Entidade[];
    collaborators: Collaborator[];
    assignments: Assignment[];
    tickets: Ticket[];
    softwareLicenses: SoftwareLicense[];
    licenseAssignments: LicenseAssignment[];
    businessServices?: BusinessService[];
    serviceDependencies?: ServiceDependency[];
}

const BarChart: React.FC<{ title: string; data: { name: string; value: number }[] }> = ({ title, data }) => {
    const maxValue = useMemo(() => Math.max(...data.map(item => item.value), 0), [data]);

    return (
        <div className="bg-gray-900/50 p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
            <div className="space-y-3">
                {data.length > 0 ? data.map((item, index) => (
                    <div key={index} className="flex items-center">
                        <div className="w-1/3 text-sm text-on-surface-dark-secondary truncate pr-2">{item.name}</div>
                        <div className="w-2/3 flex items-center">
                            <div className="w-full bg-gray-700 rounded-full h-4">
                                <div
                                    className="bg-brand-secondary h-4 rounded-full"
                                    style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
                                ></div>
                            </div>
                            <span className="ml-3 font-semibold text-white text-sm">{item.value}</span>
                        </div>
                    </div>
                )) : <p className="text-on-surface-dark-secondary text-sm">Nenhum dado disponível para os filtros selecionados.</p>}
            </div>
        </div>
    );
};

const getLevelColor = (level?: string) => {
    switch (level) {
        case 'Crítica': return 'text-red-500 font-bold';
        case 'Alta': case 'Alto': return 'text-orange-400 font-semibold';
        case 'Média': case 'Médio': return 'text-yellow-400';
        default: return 'text-gray-300';
    }
};

const ReportModal: React.FC<ReportModalProps> = ({ type, onClose, equipment, brandMap, equipmentTypeMap, instituicoes, escolasDepartamentos: entidades, collaborators, assignments, tickets, softwareLicenses, licenseAssignments, businessServices = [], serviceDependencies = [] }) => {
    // Equipment Report State
    const [reportLevel, setReportLevel] = useState<'entidade' | 'instituicao'>('entidade');
    const [selectedInstituicaoId, setSelectedInstituicaoId] = useState<string>(instituicoes[0]?.id || '');
    const [selectedEntidadeId, setSelectedEntidadeId] = useState<string>(entidades[0]?.id || '');
    const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string>(''); // '' for All
    
    // Collaborator Report State
    const [collabFilterEntidadeId, setCollabFilterEntidadeId] = useState<string>(''); // '' for All

    // Ticket Report State
    const [ticketDateFrom, setTicketDateFrom] = useState('');
    const [ticketDateTo, setTicketDateTo] = useState('');
    
    // Compliance & BIA Report State
    const [complianceFilterLevel, setComplianceFilterLevel] = useState<string>('');
    const [biaFilterCriticality, setBiaFilterCriticality] = useState<string>('');

    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const reportContentRef = useRef<HTMLDivElement>(null);
    const [showEmailInstructions, setShowEmailInstructions] = useState(false);
    
    // AI Analysis State
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const aiConfigured = isAiConfigured();
    
    const instituicaoMap = useMemo(() => new Map(instituicoes.map(e => [e.id, e])), [instituicoes]);
    const entidadeMap = useMemo(() => new Map(entidades.map(e => [e.id, e.name])), [entidades]);
    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.fullName])), [collaborators]);

    const availableCollaborators = useMemo(() => {
        if (!selectedEntidadeId) return [];
        return collaborators.filter(c => c.entidadeId === selectedEntidadeId);
    }, [selectedEntidadeId, collaborators]);

    useEffect(() => {
        setSelectedCollaboratorId('');
        setAiAnalysis(null); // Reset AI analysis on filter change
    }, [selectedEntidadeId, reportLevel, selectedInstituicaoId]);

     const licenseReportData = useMemo(() => {
        if (type !== 'licensing') return null;

        const usedSeatsMap = licenseAssignments.reduce((acc, assignment) => {
            acc.set(assignment.softwareLicenseId, (acc.get(assignment.softwareLicenseId) || 0) + 1);
            return acc;
        }, new Map<string, number>());

        const items = softwareLicenses.map(license => {
            const usedSeats = usedSeatsMap.get(license.id) || 0;
            const availableSeats = license.totalSeats - usedSeats;
            return { ...license, usedSeats, availableSeats };
        }).sort((a,b) => a.productName.localeCompare(b.productName));

        return {
            type: 'licensing' as const,
            items,
        };

    }, [type, softwareLicenses, licenseAssignments]);
    
    const ticketReportData = useMemo(() => {
        if (type !== 'ticket') return null;

        const filteredTickets = tickets.filter(ticket => {
            const requestDate = new Date(ticket.requestDate);
            const fromMatch = !ticketDateFrom || requestDate >= new Date(ticketDateFrom);
            const toMatch = !ticketDateTo || requestDate <= new Date(ticketDateTo);
            return fromMatch && toMatch;
        });

        const entidadeInstituicaoMap = new Map(entidades.map(e => [e.id, e.instituicaoId]));

        const byEntidade = filteredTickets.reduce((acc, ticket) => {
            const entidadeName = entidadeMap.get(ticket.entidadeId) || 'Desconhecido';
            acc.set(entidadeName, (acc.get(entidadeName) || 0) + 1);
            return acc;
        }, new Map<string, number>());

        const byInstituicao = filteredTickets.reduce((acc, ticket) => {
            const instituicaoId = entidadeInstituicaoMap.get(ticket.entidadeId);
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

    const collaboratorReportData = useMemo(() => {
        if (type !== 'collaborator') return null;

        const equipmentDetailsByCollaborator = assignments.reduce((acc, assignment) => {
            if (!assignment.returnDate && assignment.collaboratorId) {
                const eq = equipment.find(e => e.id === assignment.equipmentId);
                if (eq) {
                    if (!acc.has(assignment.collaboratorId)) {
                        acc.set(assignment.collaboratorId, []);
                    }
                    acc.get(assignment.collaboratorId)!.push(eq);
                }
            }
            return acc;
        }, new Map<string, Equipment[]>());
        
        const filteredCollaborators = collabFilterEntidadeId
            ? collaborators.filter(c => c.entidadeId === collabFilterEntidadeId)
            : collaborators;

        const items = filteredCollaborators.map(c => ({
            collaborator: c,
            equipmentList: equipmentDetailsByCollaborator.get(c.id) || [],
            equipmentCount: (equipmentDetailsByCollaborator.get(c.id) || []).length
        })).sort((a, b) => a.collaborator.fullName.localeCompare(b.collaborator.fullName));

        const entidade = collabFilterEntidadeId ? entidades.find(e => e.id === collabFilterEntidadeId) : null;
        
        return {
            type: 'collaborator' as const,
            entidade,
            items
        };

    }, [type, collabFilterEntidadeId, collaborators, entidades, assignments, equipment]);

    const complianceReportData = useMemo(() => {
        if (type !== 'compliance') return null;
        
        const items = equipment.filter(eq => {
            if (!complianceFilterLevel) return true;
            return eq.criticality === complianceFilterLevel;
        }).sort((a,b) => {
            const levels: Record<string, number> = { [CriticalityLevel.Critical]: 3, [CriticalityLevel.High]: 2, [CriticalityLevel.Medium]: 1, [CriticalityLevel.Low]: 0 };
            const levelA = levels[a.criticality || CriticalityLevel.Low] || 0;
            const levelB = levels[b.criticality || CriticalityLevel.Low] || 0;
            return levelB - levelA; // Descending order
        });
        
        return {
            type: 'compliance' as const,
            items
        };
    }, [type, equipment, complianceFilterLevel]);
    
    const biaReportData = useMemo(() => {
        if (type !== 'bia') return null;

        const filteredServices = businessServices.filter(s => {
            if (!biaFilterCriticality) return true;
            return s.criticality === biaFilterCriticality;
        }).sort((a,b) => {
             const priority: Record<string, number> = { [CriticalityLevel.Critical]: 3, [CriticalityLevel.High]: 2, [CriticalityLevel.Medium]: 1, [CriticalityLevel.Low]: 0 };
             return (priority[b.criticality] || 0) - (priority[a.criticality] || 0);
        });

        const items = filteredServices.map(service => {
            const serviceDeps = serviceDependencies.filter(d => d.service_id === service.id);
            
            // Direct Dependencies
            const directDependencies = serviceDeps.map(d => {
                let name = 'Desconhecido';
                let type = 'Outro';
                let id = '';
                if (d.equipment_id) {
                    const eq = equipment.find(e => e.id === d.equipment_id);
                    if (eq) {
                        name = `${eq.description} (S/N: ${eq.serialNumber})`;
                        type = 'Equipamento';
                        id = eq.id;
                    }
                } else if (d.software_license_id) {
                    const lic = softwareLicenses.find(l => l.id === d.software_license_id);
                    if (lic) {
                        name = lic.productName;
                        type = 'Software';
                        id = lic.id;
                    }
                }
                return { name, type, notes: d.notes, depType: d.dependency_type, id, isDirect: true };
            });

            // Infer Indirect Dependencies (Licenses attached to Dependent Equipment)
            const indirectDependencies: any[] = [];
            serviceDeps.forEach(d => {
                if (d.equipment_id) {
                    const equipmentName = equipment.find(e => e.id === d.equipment_id)?.description || 'Equipamento';
                    const linkedLicenses = licenseAssignments.filter(la => la.equipmentId === d.equipment_id);
                    linkedLicenses.forEach(la => {
                        const lic = softwareLicenses.find(l => l.id === la.softwareLicenseId);
                        if (lic) {
                             // Add if not already present as direct dependency
                             if (!directDependencies.some(dd => dd.id === lic.id && dd.type === 'Software')) {
                                 indirectDependencies.push({
                                     name: lic.productName,
                                     type: 'Software (via Equipamento)',
                                     notes: `Instalado em: ${equipmentName}`,
                                     depType: 'Software Base',
                                     id: lic.id,
                                     isDirect: false
                                 });
                             }
                        }
                    });
                }
            });

            return {
                service,
                ownerName: service.owner_id ? collaboratorMap.get(service.owner_id) : 'Não atribuído',
                dependencies: [...directDependencies, ...indirectDependencies]
            };
        });

        return {
            type: 'bia' as const,
            items
        };
    }, [type, businessServices, serviceDependencies, equipment, softwareLicenses, biaFilterCriticality, collaboratorMap, licenseAssignments]);


    const equipmentReportData = useMemo(() => {
        if (type !== 'equipment') return null;
        if (reportLevel === 'entidade') {
            if (!selectedEntidadeId) return null;

            const entidade = entidades.find(e => e.id === selectedEntidadeId);
            if (!entidade) return null;

            const instituicao = instituicaoMap.get(entidade.instituicaoId);

            let entidadeAssignments = assignments.filter(a => a.entidadeId === selectedEntidadeId);

            if (selectedCollaboratorId) {
                entidadeAssignments = entidadeAssignments.filter(a => a.collaboratorId === selectedCollaboratorId);
            }

            const items = entidadeAssignments.map(assignment => {
                const eq = equipment.find(e => e.id === assignment.equipmentId);
                const col = assignment.collaboratorId ? collaborators.find(c => c.id === assignment.collaboratorId) : null;
                return {
                    equipment: eq,
                    collaborator: col,
                    assignedDate: assignment.assignedDate,
                    returnDate: assignment.returnDate,
                };
            }).filter(item => item.equipment);

            const collaborator = selectedCollaboratorId ? collaborators.find(c => c.id === selectedCollaboratorId) : null;

            return {
                type: 'entidade' as const,
                instituicao,
                entidade,
                collaborator,
                items
            };
        } else { // 'instituicao'
            if (!selectedInstituicaoId) return null;
            const instituicao = instituicoes.find(e => e.id === selectedInstituicaoId);
            if (!instituicao) return null;
            
            const entidadesInInstituicao = entidades.filter(e => e.instituicaoId === selectedInstituicaoId);
            const entidadesInInstituicaoIds = new Set(entidadesInInstituicao.map(e => e.id));

            const instituicaoAssignments = assignments.filter(a => a.entidadeId && entidadesInInstituicaoIds.has(a.entidadeId));
            
            const items = instituicaoAssignments.map(assignment => {
                const eq = equipment.find(e => e.id === assignment.equipmentId);
                const col = assignment.collaboratorId ? collaborators.find(c => c.id === assignment.collaboratorId) : null;
                const ent = entidades.find(e => e.id === assignment.entidadeId);
                return { equipment: eq, collaborator: col, entidade: ent, assignment };
            }).filter(item => item.equipment && item.entidade);

            return {
                type: 'instituicao' as const,
                instituicao,
                items,
            };
        }
    }, [type, reportLevel, selectedInstituicaoId, selectedEntidadeId, selectedCollaboratorId, assignments, collaborators, instituicoes, equipment, entidades, instituicaoMap]);

    const reportData = type === 'equipment' ? equipmentReportData : 
                       (type === 'collaborator' ? collaboratorReportData : 
                       type === 'licensing' ? licenseReportData : 
                       type === 'compliance' ? complianceReportData : 
                       type === 'bia' ? biaReportData :
                       ticketReportData);

    const handlePreview = () => {
        if (reportContentRef.current) {
            setIsPreviewOpen(true);
        }
    };
    
    const handleEmail = () => {
        setShowEmailInstructions(true);
    };
    
    const handleGenerateAI = async () => {
        if (!reportData || !aiConfigured) return;
        setIsGeneratingAI(true);
        setAiAnalysis(null);
        
        // Prepare simplified data context for Gemini (avoid circular structures and huge payloads)
        let dataContext = {};
        
        if (type === 'equipment') {
            // Cast to any to bypass union type access issue, knowing it is equipment data here
            const rData = reportData as any;
            dataContext = {
                report: 'Inventory Status',
                totalItems: rData.items.length,
                items: rData.items.slice(0, 50).map((i: any) => {
                    const brandKey = i.equipment?.brandId ? String(i.equipment.brandId) : '';
                    const typeKey = i.equipment?.typeId ? String(i.equipment.typeId) : '';
                    return {
                        description: i.equipment?.description || '',
                        brand: brandMap.get(brandKey) || 'N/A',
                        type: equipmentTypeMap.get(typeKey) || 'N/A',
                        age: i.equipment?.purchaseDate || '',
                        status: i.equipment?.status || ''
                    };
                })
            };
        } else if (type === 'ticket') {
            dataContext = {
                report: 'Support Tickets',
                summary: {
                    byEntity: ticketReportData?.byEntidade,
                    byInstitution: ticketReportData?.byInstituicao
                },
                recentTickets: ticketReportData?.rawTickets.slice(0, 20).map((t: Ticket) => ({
                    category: t.category || '',
                    status: t.status,
                    description: t.description,
                    date: t.requestDate
                }))
            };
        } else if (type === 'compliance') {
             dataContext = {
                report: 'NIS2 Compliance',
                items: complianceReportData?.items.map(i => ({
                    asset: i.description,
                    criticality: i.criticality,
                    confidentiality: i.confidentiality,
                    integrity: i.integrity,
                    availability: i.availability,
                    last_patch: i.last_security_update
                }))
            };
        } else if (type === 'bia') {
             dataContext = {
                report: 'Business Impact Analysis',
                services: biaReportData?.items.map(i => ({
                    name: i.service.name,
                    criticality: i.service.criticality,
                    rto: i.service.rto_goal,
                    dependencyCount: i.dependencies.length
                }))
            };
        }

        const analysis = await generateExecutiveReport(type, dataContext);
        setAiAnalysis(analysis);
        setIsGeneratingAI(false);
    };

    const openMailClient = () => {
        // ... (existing code)
        if (!reportData) return;
        
        let subject = 'Relatório do Sistema de Gestão';
        let body = 'Segue em anexo o relatório gerado a partir do sistema AIManager.\n\nPor favor, anexe o ficheiro PDF que guardou.\n\nAtenciosamente,';
        let emailTo = 'geral@exemplo.com';

        if(reportData.type === 'entidade') {
            subject = `Relatório de Equipamentos - ${reportData.entidade.name}`;
            emailTo = reportData.collaborator?.email || reportData.entidade.email;
        } else if (reportData.type === 'instituicao') {
            subject = `Relatório Consolidado de Equipamentos - ${reportData.instituicao.name}`;
            emailTo = reportData.instituicao.email;
        }
        // ... (rest of existing code)
        
        window.location.href = `mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setShowEmailInstructions(false);
    };

    const escapeCsv = (value: string | undefined | null) => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (/[",\n\r]/.test(str)) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const handleExportCSV = () => {
        if (!reportData) return;

        let headers: string[] = [];
        let rows: string[] = [];
        let fileName = '';

        if (reportData.type === 'entidade') {
            headers = ["Instituição", "Entidade", "Marca", "Tipo", "Nº Série", "Nº Inventário", "Nº Fatura", "Descrição", "Nome na Rede", "MAC WIFI", "MAC Cabo", "Colaborador", "Email Colaborador", "Data de Associação", "Data de Fim (Devolução/Abate)"];
            rows = reportData.items.map(item => {
                 const brandName = brandMap.get(item.equipment?.brandId ?? '') ?? '';
                 const typeName = equipmentTypeMap.get(item.equipment?.typeId ?? '') ?? '';
                 return [
                    escapeCsv(reportData.instituicao?.name ?? ''), escapeCsv(reportData.entidade?.name ?? ''), 
                    escapeCsv(brandName), 
                    escapeCsv(typeName), 
                    escapeCsv(item.equipment?.serialNumber ?? ''), escapeCsv(item.equipment?.inventoryNumber ?? ''), escapeCsv(item.equipment?.invoiceNumber ?? ''), escapeCsv(item.equipment?.description ?? ''),
                    escapeCsv(item.equipment?.nomeNaRede ?? ''), escapeCsv(item.equipment?.macAddressWIFI ?? ''), escapeCsv(item.equipment?.macAddressCabo ?? ''),
                    escapeCsv(item.collaborator?.fullName || 'Atribuído à Localização'), escapeCsv(item.collaborator?.email ?? ''), escapeCsv(item.assignedDate), escapeCsv(item.returnDate ?? ''),
                ].join(',')
            });
            fileName = `relatorio_equip_${reportData.entidade.name.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`;
        } else if (reportData.type === 'instituicao') {
             headers = ["Instituição", "Entidade", "Marca", "Tipo", "Nº Série", "Nº Inventário", "Nº Fatura", "Descrição", "Nome na Rede", "MAC WIFI", "MAC Cabo", "Colaborador", "Email Colaborador", "Data de Associação", "Data de Fim (Devolução/Abate)"];
            rows = reportData.items.map(item => {
                const brandName = brandMap.get(item.equipment?.brandId ?? '') ?? '';
                const typeName = equipmentTypeMap.get(item.equipment?.typeId ?? '') ?? '';
                return [
                    escapeCsv(reportData.instituicao.name), 
                    escapeCsv(item.entidade?.name ?? ''), 
                    escapeCsv(brandName), 
                    escapeCsv(typeName), 
                    escapeCsv(item.equipment?.serialNumber ?? ''), 
                    escapeCsv(item.equipment?.inventoryNumber ?? ''),
                    escapeCsv(item.equipment?.invoiceNumber ?? ''), 
                    escapeCsv(item.equipment?.description ?? ''),
                    escapeCsv(item.equipment?.nomeNaRede ?? ''), escapeCsv(item.equipment?.macAddressWIFI ?? ''), escapeCsv(item.equipment?.macAddressCabo ?? ''),
                    escapeCsv(item.collaborator?.fullName || 'Atribuído à Localização'), 
                    escapeCsv(item.collaborator?.email ?? ''), 
                    escapeCsv(item.assignment.assignedDate), 
                    escapeCsv(item.assignment.returnDate ?? ''),
                ].join(',')
            });
             fileName = `relatorio_equip_${reportData.instituicao.name.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`;
        }
        else if (reportData.type === 'collaborator') {
             headers = ["Nome", "Email", "Nº Mecanográfico", "Função", "Entidade", "Total Equipamentos"];
             rows = reportData.items.map(item => [
                escapeCsv(item.collaborator.fullName),
                escapeCsv(item.collaborator.email),
                escapeCsv(item.collaborator.numeroMecanografico ?? ''),
                escapeCsv(item.collaborator.role),
                escapeCsv(entidadeMap.get(item.collaborator.entidadeId || '') || ''),
                escapeCsv(item.equipmentCount.toString())
             ].join(','));
             fileName = `relatorio_colaboradores_${new Date().toISOString().split('T')[0]}.csv`;
        }
        else if (reportData.type === 'ticket') {
             headers = ["ID", "Assunto", "Categoria", "Prioridade", "Estado", "Solicitante", "Data"];
             rows = reportData.rawTickets.map(t => [
                escapeCsv(t.id),
                escapeCsv(t.title),
                escapeCsv(t.category ?? ''),
                escapeCsv(t.impactCriticality ?? ''),
                escapeCsv(t.status),
                escapeCsv(collaboratorMap.get(t.collaboratorId) || ''),
                escapeCsv(t.requestDate)
             ].join(','));
             fileName = `relatorio_tickets_${new Date().toISOString().split('T')[0]}.csv`;
        }
        else if (reportData.type === 'licensing') {
             headers = ["Produto", "Chave", "Total", "Em Uso", "Disponível", "Status"];
             rows = reportData.items.map(item => [
                escapeCsv(item.productName),
                escapeCsv(item.licenseKey),
                escapeCsv(item.totalSeats.toString()),
                escapeCsv(item.usedSeats.toString()),
                escapeCsv(item.availableSeats.toString()),
                escapeCsv(item.status)
             ].join(','));
             fileName = `relatorio_licencas_${new Date().toISOString().split('T')[0]}.csv`;
        }
        else if (reportData.type === 'compliance') {
            headers = ["Equipamento", "Marca/Tipo", "Nº Série", "Criticidade", "Confidencialidade", "Integridade", "Disponibilidade"];
            rows = reportData.items.map(item => {
                const brandName = brandMap.get(item.brandId) ?? '';
                const typeName = equipmentTypeMap.get(item.typeId) ?? '';
                return [
                    escapeCsv(item.description),
                    escapeCsv(`${brandName} ${typeName}`),
                    escapeCsv(item.serialNumber),
                    escapeCsv(item.criticality ?? ''),
                    escapeCsv(item.confidentiality ?? ''),
                    escapeCsv(item.integrity ?? ''),
                    escapeCsv(item.availability ?? ''),
                ].join(',')
            });
            fileName = `relatorio_compliance_nis2_${new Date().toISOString().split('T')[0]}.csv`;
        } else if (reportData.type === 'bia') {
            headers = ["Serviço", "Descrição", "Criticidade", "RTO Alvo", "Responsável", "Status", "Dependências (Nome)", "Dependências (Tipo)", "Dependências (Notas)"];
            rows = reportData.items.map(item => [
                escapeCsv(item.service.name),
                escapeCsv(item.service.description ?? ''),
                escapeCsv(item.service.criticality),
                escapeCsv(item.service.rto_goal ?? ''),
                escapeCsv(item.ownerName),
                escapeCsv(item.service.status),
                escapeCsv(item.dependencies.map(d => `${d.name}`).join('; ')),
                escapeCsv(item.dependencies.map(d => `${d.type} [${d.isDirect ? 'Direta' : 'Indireta'}]`).join('; ')),
                escapeCsv(item.dependencies.map(d => `${d.notes ?? ''}`).join('; '))
            ].join(','));
            fileName = `relatorio_bia_servicos_${new Date().toISOString().split('T')[0]}.csv`;
        }
        
        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    
    const renderEquipmentFilters = () => (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
            <div>
                <label htmlFor="reportLevelSelect" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Tipo de Relatório</label>
                <select
                    id="reportLevelSelect"
                    value={reportLevel}
                    onChange={(e) => setReportLevel(e.target.value as 'entidade' | 'instituicao')}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                >
                    <option value="entidade">Por Entidade</option>
                    <option value="instituicao">Por Instituição</option>
                </select>
            </div>
            {reportLevel === 'entidade' ? (
                <>
                    <div>
                        <label htmlFor="entidadeSelect" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Selecione a Entidade:</label>
                        <select id="entidadeSelect" value={selectedEntidadeId} onChange={(e) => setSelectedEntidadeId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                            {entidades.map(entidade => <option key={entidade.id} value={entidade.id}>{entidade.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="collaboratorSelect" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Colaborador (Opcional):</label>
                        <select id="collaboratorSelect" value={selectedCollaboratorId} onChange={(e) => setSelectedCollaboratorId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" disabled={!selectedEntidadeId || availableCollaborators.length === 0}>
                            <option value="">Todos os Colaboradores</option>
                            {availableCollaborators.map(collaborator => <option key={collaborator.id} value={collaborator.id}>{collaborator.fullName}</option>)}
                        </select>
                    </div>
                </>
            ) : (
                <div>
                    <label htmlFor="instituicaoSelect" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Selecione a Instituição:</label>
                    <select id="instituicaoSelect" value={selectedInstituicaoId} onChange={(e) => setSelectedInstituicaoId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                        {instituicoes.map(ent => <option key={ent.id} value={ent.id}>{ent.name}</option>)}
                    </select>
                </div>
            )}
        </div>
    );
    
    const renderCollaboratorFilters = () => (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
             <div>
                <label htmlFor="collabEntidadeSelect" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Filtrar por Entidade:</label>
                <select id="collabEntidadeSelect" value={collabFilterEntidadeId} onChange={(e) => setCollabFilterEntidadeId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                    <option value="">Todas as Entidades</option>
                    {entidades.map(entidade => <option key={entidade.id} value={entidade.id}>{entidade.name}</option>)}
                </select>
            </div>
         </div>
    );

    const renderTicketFilters = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
            <div>
                <label htmlFor="ticketDateFrom" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Período - De:</label>
                <input type="date" id="ticketDateFrom" value={ticketDateFrom} onChange={e => setTicketDateFrom(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"/>
            </div>
            <div>
                <label htmlFor="ticketDateTo" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Até:</label>
                <input type="date" id="ticketDateTo" value={ticketDateTo} onChange={e => setTicketDateTo(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"/>
            </div>
        </div>
    );

    const renderComplianceFilters = () => (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
             <div>
                <label htmlFor="complianceLevelSelect" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Filtrar por Criticidade:</label>
                <select id="complianceLevelSelect" value={complianceFilterLevel} onChange={(e) => setComplianceFilterLevel(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                    <option value="">Todas</option>
                    {Object.values(CriticalityLevel).map(level => (
                        <option key={level} value={level}>{level}</option>
                    ))}
                </select>
            </div>
         </div>
    );

    const renderBiaFilters = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
            <div>
               <label htmlFor="biaLevelSelect" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Filtrar por Criticidade:</label>
               <select id="biaLevelSelect" value={biaFilterCriticality} onChange={(e) => setBiaFilterCriticality(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                   <option value="">Todas</option>
                   {Object.values(CriticalityLevel).map(level => (
                       <option key={level} value={level}>{level}</option>
                   ))}
               </select>
           </div>
        </div>
   );

    const renderReportPreview = () => (
         <div ref={reportContentRef} className="bg-gray-800 p-6 rounded-lg text-on-surface-dark-secondary">
            {!reportData && <p>Selecione os filtros para gerar o relatório.</p>}
            
            {aiAnalysis && (
                <div className="mb-8 bg-purple-900/20 border border-purple-500/30 p-6 rounded-lg animate-fade-in">
                    <div className="flex items-center gap-2 text-purple-300 mb-4 border-b border-purple-500/30 pb-2">
                        <FaRobot className="h-5 w-5" />
                        <h3 className="text-lg font-bold">Análise Executiva & Insights (IA)</h3>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: aiAnalysis }} />
                </div>
            )}

            {/* Equipment Report: Entidade Level */}
            {reportData?.type === 'entidade' && (
                 <>
                    <h3 className="text-xl font-bold text-white mb-2">Relatório de Equipamentos</h3>
                    <p className="mb-1"><span className="font-semibold">Instituição:</span> {reportData.instituicao?.name}</p>
                    <p className="mb-1"><span className="font-semibold">Entidade:</span> {reportData.entidade.name}</p>
                    {reportData.collaborator && (<p className="mb-4"><span className="font-semibold">Colaborador:</span> {reportData.collaborator.fullName}</p>)}
                    
                    <table className="w-full text-sm text-left mt-4">
                        <thead className="text-xs uppercase bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-2">Descrição</th>
                                <th className="px-4 py-2">Nº Série</th>
                                <th className="px-4 py-2">Nome na Rede</th>
                                <th className="px-4 py-2">Nº Inventário</th>
                                <th className="px-4 py-2">Colaborador</th>
                                <th className="px-4 py-2">Data de Associação</th>
                                <th className="px-4 py-2">Data de Fim</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.items.map((item, index) => (
                                <tr key={index} className="border-b border-gray-700">
                                    <td className="px-4 py-2 text-on-surface-dark">{brandMap.get(item.equipment?.brandId ?? '') ?? ''} {equipmentTypeMap.get(item.equipment?.typeId ?? '') ?? ''}</td>
                                    <td className="px-4 py-2">{item.equipment?.serialNumber}</td>
                                    <td className="px-4 py-2">{item.equipment?.nomeNaRede || '—'}</td>
                                    <td className="px-4 py-2">{item.equipment?.inventoryNumber || '—'}</td>
                                    <td className="px-4 py-2">{item.collaborator?.fullName || 'Atribuído à Localização'}</td>
                                    <td className="px-4 py-2">{item.assignedDate}</td>
                                    <td className="px-4 py-2">{item.returnDate || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {reportData.items.length === 0 && <p className="text-center py-4">Nenhum equipamento encontrado com os filtros selecionados.</p>}
                    {reportData.collaborator && (
                        <div className="mt-16 text-center text-sm">
                            <div className="inline-block">
                                <p className="border-t border-gray-500 px-16 pt-2">
                                    A Assinatura
                                </p>
                                <p className="text-xs text-on-surface-dark-secondary">
                                    ({reportData.collaborator.fullName})
                                </p>
                            </div>
                        </div>
                    )}
                </>
            )}

             {/* Equipment Report: Instituicao Level */}
            {reportData?.type === 'instituicao' && (
                 <>
                    <h3 className="text-xl font-bold text-white mb-2">Relatório Consolidado de Equipamentos</h3>
                    <p className="mb-4"><span className="font-semibold">Instituição:</span> {reportData.instituicao?.name}</p>
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-2">Descrição</th>
                                <th className="px-4 py-2">Nº Série</th>
                                <th className="px-4 py-2">Nome na Rede</th>
                                <th className="px-4 py-2">Nº Inventário</th>
                                <th className="px-4 py-2">Entidade</th>
                                <th className="px-4 py-2">Colaborador</th>
                                <th className="px-4 py-2">Data de Associação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.items.map((item, index) => (
                                <tr key={index} className="border-b border-gray-700">
                                    <td className="px-4 py-2 text-on-surface-dark">{brandMap.get(item.equipment?.brandId ?? '') ?? ''} {equipmentTypeMap.get(item.equipment?.typeId ?? '') ?? ''}</td>
                                    <td className="px-4 py-2">{item.equipment?.serialNumber}</td>
                                    <td className="px-4 py-2">{item.equipment?.nomeNaRede || '—'}</td>
                                    <td className="px-4 py-2">{item.equipment?.inventoryNumber || '—'}</td>
                                    <td className="px-4 py-2">{item.entidade?.name}</td>
                                    <td className="px-4 py-2">{item.collaborator?.fullName || 'Atribuído à Localização'}</td>
                                    <td className="px-4 py-2">{item.assignment.assignedDate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {reportData.items.length === 0 && <p className="text-center py-4">Nenhum equipamento encontrado para esta instituição.</p>}
                </>
            )}

            {/* Collaborator Report */}
            {reportData?.type === 'collaborator' && (
                <>
                    <h3 className="text-xl font-bold text-white mb-2">Relatório de Colaboradores e Equipamentos</h3>
                    {reportData.entidade && <p className="mb-4"><span className="font-semibold">Entidade:</span> {reportData.entidade.name}</p>}

                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-2">Nome</th>
                                <th className="px-4 py-2">Email</th>
                                <th className="px-4 py-2">Entidade</th>
                                <th className="px-4 py-2 text-center">Nº Equip.</th>
                            </tr>
                        </thead>
                        <tbody>
                             {reportData.items.map((item, index) => (
                                <React.Fragment key={index}>
                                    <tr className="border-b border-gray-600 bg-gray-800/50">
                                        <td className="px-4 py-3 text-on-surface-dark font-semibold">{item.collaborator.fullName}</td>
                                        <td className="px-4 py-3">{item.collaborator.email}</td>
                                        <td className="px-4 py-3">{entidadeMap.get(item.collaborator.entidadeId || '') || 'N/A'}</td>
                                        <td className="px-4 py-3 text-center font-bold text-white">{item.equipmentCount}</td>
                                    </tr>
                                    {item.equipmentList.length > 0 && (
                                        <tr className="border-b border-gray-700">
                                            <td colSpan={4} className="px-4 py-3 pl-12 bg-surface-dark/50">
                                                <h4 className="text-xs font-semibold text-on-surface-dark-secondary mb-2">Equipamentos Atribuídos:</h4>
                                                <ul className="list-disc list-inside text-xs space-y-1">
                                                {item.equipmentList.map(eq => (
                                                    <li key={eq.id}>
                                                        <span className="font-semibold text-on-surface-dark">{brandMap.get(eq.brandId)} {equipmentTypeMap.get(eq.typeId)}</span>
                                                        <span className="text-on-surface-dark-secondary"> (S/N: {eq.serialNumber}, Inv: {eq.inventoryNumber || 'N/A'})</span>
                                                    </li>
                                                ))}
                                                </ul>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                     {reportData.items.length === 0 && <p className="text-center py-4">Nenhum colaborador encontrado com os filtros selecionados.</p>}
                </>
            )}

             {/* Ticket Report */}
            {reportData?.type === 'ticket' && (
                <div className="space-y-8">
                    <h3 className="text-xl font-bold text-white mb-2">Relatório Gráfico de Tickets</h3>
                    <BarChart title="Tickets por Instituição" data={reportData.byInstituicao} />
                    <BarChart title="Tickets por Entidade" data={reportData.byEntidade} />
                </div>
            )}

            {/* License Report */}
            {reportData?.type === 'licensing' && (
                <>
                    <h3 className="text-xl font-bold text-white mb-2">Relatório de Licenciamento de Software</h3>
                    <p className="mb-4"><span className="font-semibold">Data do Relatório:</span> {new Date().toLocaleDateString()}</p>
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-2">Produto</th>
                                <th className="px-4 py-2">Chave</th>
                                <th className="px-4 py-2 text-center">Total</th>
                                <th className="px-4 py-2 text-center">Em Uso</th>
                                <th className="px-4 py-2 text-center">Disponível</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.items.map((item) => (
                                <tr key={item.id} className="border-b border-gray-700">
                                    <td className="px-4 py-2 text-on-surface-dark font-medium">{item.productName}</td>
                                    <td className="px-4 py-2 font-mono">{item.licenseKey}</td>
                                    <td className="px-4 py-2 text-center">{item.totalSeats}</td>
                                    <td className="px-4 py-2 text-center">{item.usedSeats}</td>
                                    <td className={`px-4 py-2 text-center font-bold ${item.availableSeats > 0 ? 'text-green-400' : 'text-red-400'}`}>{item.availableSeats}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {reportData.items.length === 0 && <p className="text-center py-4">Nenhuma licença encontrada.</p>}
                </>
            )}

            {/* Compliance Report */}
            {reportData?.type === 'compliance' && (
                <>
                    <h3 className="text-xl font-bold text-white mb-2">Relatório de Conformidade NIS2 (C-I-A)</h3>
                    <p className="mb-4 text-sm">Este relatório lista os ativos e a sua classificação de risco quanto à confidencialidade, integridade e disponibilidade.</p>
                    
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-2">Ativo</th>
                                <th className="px-4 py-2">S/N</th>
                                <th className="px-4 py-2 text-center">Criticidade</th>
                                <th className="px-4 py-2 text-center">Confidencialidade</th>
                                <th className="px-4 py-2 text-center">Integridade</th>
                                <th className="px-4 py-2 text-center">Disponibilidade</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.items.map((item) => (
                                <tr key={item.id} className="border-b border-gray-700">
                                    <td className="px-4 py-2">
                                        <div className="text-on-surface-dark font-medium">{item.description}</div>
                                        <div className="text-xs text-on-surface-dark-secondary">{brandMap.get(item.brandId)} {equipmentTypeMap.get(item.typeId)}</div>
                                    </td>
                                    <td className="px-4 py-2 font-mono text-xs">{item.serialNumber}</td>
                                    <td className={`px-4 py-2 text-center ${getLevelColor(item.criticality)}`}>{item.criticality || 'N/A'}</td>
                                    <td className={`px-4 py-2 text-center ${getLevelColor(item.confidentiality)}`}>{item.confidentiality || 'N/A'}</td>
                                    <td className={`px-4 py-2 text-center ${getLevelColor(item.integrity)}`}>{item.integrity || 'N/A'}</td>
                                    <td className={`px-4 py-2 text-center ${getLevelColor(item.availability)}`}>{item.availability || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {reportData.items.length === 0 && <p className="text-center py-4">Nenhum equipamento encontrado com os filtros selecionados.</p>}
                </>
            )}

             {/* BIA Report */}
             {reportData?.type === 'bia' && (
                <>
                    <h3 className="text-xl font-bold text-white mb-2">Análise de Impacto no Negócio (BIA)</h3>
                    <p className="mb-4 text-sm">Inventário de Serviços Críticos e suas dependências (Diretas e Indiretas) para recuperação de desastres.</p>
                    
                    {reportData.items.map((item, index) => (
                        <div key={index} className="mb-6 p-4 bg-surface-dark rounded-lg border border-gray-700 break-inside-avoid">
                            <div className="flex justify-between items-start mb-3 border-b border-gray-600 pb-2">
                                <div>
                                    <h4 className="text-lg font-bold text-white">{item.service.name}</h4>
                                    {item.service.description && (
                                        <p className="text-sm text-gray-300 mb-2">
                                            <span className="font-semibold text-gray-400">Descrição: </span>
                                            {item.service.description}
                                        </p>
                                    )}
                                    <p className="text-xs text-on-surface-dark-secondary">Responsável: {item.ownerName}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`block text-sm font-bold ${getLevelColor(item.service.criticality)}`}>{item.service.criticality}</span>
                                    <span className="block text-xs text-gray-400">RTO: {item.service.rto_goal || 'N/A'}</span> 
                                </div>
                            </div>
                            
                            {item.dependencies.length > 0 ? (
                                <div className="mt-2">
                                    <p className="text-xs font-semibold text-gray-400 mb-1">Dependências Mapeadas:</p>
                                    <ul className="list-none text-xs space-y-1 pl-2">
                                        {item.dependencies.map((dep, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-gray-500 font-mono">•</span>
                                                <div>
                                                    <span className="font-medium text-white">{dep.name}</span> 
                                                    <span className="text-gray-500"> ({dep.type})</span>
                                                    {dep.depType && <span className="text-brand-secondary ml-1">[{dep.depType}]</span>}
                                                    {!dep.isDirect && (
                                                        <span className="text-yellow-500 ml-1 text-[10px] uppercase tracking-wider border border-yellow-500/30 px-1 rounded">
                                                            Indireta
                                                        </span>
                                                    )}
                                                    {dep.notes && <div className="text-gray-500 italic ml-1">- {dep.notes}</div>}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 italic">Sem dependências mapeadas.</p>
                            )}
                        </div>
                    ))}

                    {reportData.items.length === 0 && <p className="text-center py-4">Nenhum serviço encontrado.</p>}
                </>
            )}
         </div>
    );


    return (
        <Modal 
            title={type === 'equipment' ? 'Relatórios de Equipamentos' : type === 'collaborator' ? 'Relatórios de Colaboradores' : type === 'licensing' ? 'Relatório de Licenciamento' : type === 'compliance' ? 'Relatório de Conformidade NIS2' : type === 'bia' ? 'Relatório BIA' : 'Relatório de Tickets'} 
            onClose={onClose}
        >
            {showEmailInstructions && (
                <div className="absolute inset-0 bg-black bg-opacity-80 flex justify-center items-center z-10 p-4 rounded-lg">
                    <div className="bg-surface-dark p-6 rounded-xl shadow-2xl max-w-md w-full border border-gray-700">
                        <h3 className="text-lg font-bold text-white mb-4">Enviar Relatório por Email</h3>
                        <div className="text-on-surface-dark-secondary space-y-3 text-sm">
                            <p><strong>Passo 1:</strong> Primeiro, precisa de guardar o relatório como PDF.</p>
                            <p>Use o botão <strong className="text-brand-secondary">'Pré-visualizar'</strong> e, na janela de impressão, escolha a opção "Guardar como PDF".</p>
                            <p><strong>Passo 2:</strong> Depois de guardar o ficheiro, clique em "Abrir Email" para redigir a sua mensagem e anexe o PDF.</p>
                        </div>
                        <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-700">
                            <button onClick={() => setShowEmailInstructions(false)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                                Cancelar
                            </button>
                            <button onClick={openMailClient} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">
                                Abrir Email
                            </button>
                        </div>
                    </div>
                </div>
            )}
             <div className="space-y-4">
                
                {type === 'equipment' ? renderEquipmentFilters() : type === 'collaborator' ? renderCollaboratorFilters() : type === 'ticket' ? renderTicketFilters() : type === 'compliance' ? renderComplianceFilters() : type === 'bia' ? renderBiaFilters() : null}

                <div className="border-t border-gray-700 my-4 no-print"></div>

                {renderReportPreview()}
                
                <div className="flex flex-wrap justify-end gap-4 pt-4 no-print">
                    <button 
                        onClick={handleGenerateAI} 
                        disabled={!reportData || isGeneratingAI || !aiConfigured}
                        className={`flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 shadow-lg ${!aiConfigured ? 'cursor-not-allowed grayscale opacity-50' : ''}`}
                        title={!aiConfigured ? "Funcionalidade indisponível: Chave API não configurada" : "Gerar Análise IA"}
                    >
                        {isGeneratingAI ? <FaSpinner className="animate-spin" /> : <FaMagic />} 
                        Gerar Análise IA
                    </button>
                    <button onClick={handleExportCSV} disabled={!reportData} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">
                        <FaFileCsv /> Exportar CSV
                    </button>
                    <button onClick={handleEmail} disabled={!reportData} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 disabled:opacity-50">
                        <MailIcon /> Enviar por Email
                    </button>
                    <button onClick={handlePreview} disabled={!reportData} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50">
                        <FaEye /> Pré-visualizar
                    </button>
                </div>
            </div>
            {isPreviewOpen && reportContentRef.current && (
                <PrintPreviewModal 
                    onClose={() => setIsPreviewOpen(false)}
                    reportContentHtml={reportContentRef.current.innerHTML}
                />
            )}
        </Modal>
    );
};

export default ReportModal;
