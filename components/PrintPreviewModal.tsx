import React, { useRef, useState, useEffect } from 'react';
import { XIcon, FaFilePdf, SpinnerIcon, FaPrint } from './common/Icons';
import * as dataService from '../services/dataService';
import { Instituicao } from '../types';

interface PrintPreviewModalProps {
    onClose: () => void;
    reportContentHtml: string;
}

const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ onClose, reportContentHtml }) => {
    const printableAreaRef = useRef<HTMLDivElement>(null);
    const [logoBase64, setLogoBase64] = useState<string | null>(null);
    const [logoSize, setLogoSize] = useState(80);
    const [logoAlignment, setLogoAlignment] = useState('center');
    const [footerInstitution, setFooterInstitution] = useState<Instituicao | null>(null);

    useEffect(() => {
        const fetchBranding = async () => {
            const [base64, sizeStr, align, footerId] = await Promise.all([
                dataService.getGlobalSetting('app_logo_base64'),
                dataService.getGlobalSetting('app_logo_size'),
                dataService.getGlobalSetting('app_logo_alignment'),
                dataService.getGlobalSetting('report_footer_institution_id')
            ]);
            if (base64) setLogoBase64(base64);
            if (sizeStr) setLogoSize(parseInt(sizeStr));
            if (align) setLogoAlignment(align);
            if (footerId) {
                const allData = await dataService.fetchAllData();
                const inst = allData.instituicoes.find((i: any) => i.id === footerId);
                if (inst) setFooterInstitution(inst);
            }
        };
        fetchBranding();
    }, []);

    const printStyles = `
        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
        @page { size: A4; margin: 1.5cm; }
        #printable-content-wrapper, #printable-content-wrapper * {
            color: #000 !important; background: transparent !important; border-color: #ccc !important;
        }
        #printable-content-wrapper {
            background-color: white !important; font-family: 'Segoe UI', sans-serif;
            display: flex; flex-direction: column; min-height: calc(297mm - 3cm);
        }
        #printable-content-wrapper table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
        #printable-content-wrapper th, #printable-content-wrapper td { border: 1px solid #ccc !important; padding: 6px; font-size: 9pt; }
        #printable-content-wrapper thead { background-color: #eee !important; display: table-header-group; }
        #printable-content-wrapper tr { page-break-inside: avoid; page-break-after: auto; }
        #printable-content-wrapper h3 { font-size: 14pt; margin-bottom: 10px; }
        .print-header { display: flex; justify-content: ${logoAlignment}; margin-bottom: 20px; }
        .print-footer { margin-top: auto; padding-top: 15px; border-top: 1px solid #ccc; font-size: 8pt; color: #666; text-align: center; }
        .print-footer p { margin: 2px 0; }
        
        @media print {
            body * { visibility: hidden; }
            .print-area, .print-area * { visibility: visible; }
            .print-area { position: absolute; left: 0; top: 0; width: 100%; }
            .no-print { display: none !important; }
        }
    `;

    const handleNativePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const content = document.getElementById('printable-content-wrapper')?.outerHTML || '';
        
        printWindow.document.write(`
            <html>
            <head><title>Relatório</title><style>${printStyles}</style></head>
            <body>${content}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 500);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center z-[60] p-4 no-print">
            <div className="w-full max-w-4xl bg-surface-dark rounded-t-lg p-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Pré-visualização do Relatório</h2>
                <div className="flex items-center gap-4">
                    <button onClick={handleNativePrint} className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                        <FaPrint /> Imprimir / Salvar PDF
                    </button>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <XIcon />
                    </button>
                </div>
            </div>
            <div className="w-full max-w-4xl h-full overflow-y-auto bg-gray-500 p-8 print-area">
                 <div ref={printableAreaRef}>
                     <div
                        id="printable-content-wrapper"
                        className="bg-white shadow-lg mx-auto"
                        style={{ width: '210mm', padding: '1.5cm' }}
                     >
                        <div className="print-header">
                            {logoBase64 && <img src={logoBase64} alt="Logótipo" style={{ maxHeight: `${logoSize}px`, objectFit: 'contain' }} />}
                        </div>
                        
                        <div className="flex-grow" dangerouslySetInnerHTML={{ __html: reportContentHtml }} />
                        
                        {footerInstitution && (
                            <div className="print-footer">
                                <p><strong>{footerInstitution.name}</strong></p>
                                <p>{[footerInstitution.address_line, footerInstitution.postal_code, footerInstitution.city].filter(Boolean).join(', ')}</p>
                                <p>
                                    {footerInstitution.telefone && `Tel: ${footerInstitution.telefone}`}
                                    {footerInstitution.email && ` | Email: ${footerInstitution.email}`}
                                    {footerInstitution.website && ` | Web: ${footerInstitution.website}`}
                                </p>
                                {footerInstitution.nif && <p>NIF: {footerInstitution.nif}</p>}
                            </div>
                        )}
                     </div>
                 </div>
            </div>
        </div>
    );
};

export default PrintPreviewModal;