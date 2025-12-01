import React, { useRef, useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { XIcon, FaFilePdf, SpinnerIcon, FaPrint } from './common/Icons';
import { getGlobalSetting } from '../services/dataService';

interface PrintPreviewModalProps {
    onClose: () => void;
    reportContentHtml: string;
}

const printStyles = `
    #printable-content-wrapper, #printable-content-wrapper * {
        color: #000 !important;
        background-color: transparent !important;
        border-color: #ccc !important;
    }
    #printable-content-wrapper table {
        width: 100%;
        border-collapse: collapse;
    }
    #printable-content-wrapper th, #printable-content-wrapper td {
        border: 1px solid #ccc !important;
        padding: 6px;
        font-size: 9pt;
    }
    #printable-content-wrapper thead {
        background-color: #eee !important;
    }
    #printable-content-wrapper h3 {
        font-size: 14pt;
        font-weight: bold;
        margin-bottom: 10px;
    }

    @media print {
        body * {
            visibility: hidden;
        }
        .fixed.inset-0 {
            position: static !important;
            overflow: visible !important;
            background: none !important;
        }
        #printable-content-wrapper, #printable-content-wrapper * {
            visibility: visible;
        }
        #printable-content-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0 !important;
            background-color: white !important;
            color: black !important;
            box-shadow: none !important;
        }
        .no-print {
            display: none !important;
        }
        @page {
            margin: 1cm;
            size: auto; 
        }
    }
`;

const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ onClose, reportContentHtml }) => {
    const printableAreaRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [logoBase64, setLogoBase64] = useState<string | null>(null);
    const [logoSize, setLogoSize] = useState(80);

    useEffect(() => {
        const fetchLogo = async () => {
            const [base64, sizeStr] = await Promise.all([
                getGlobalSetting('app_logo_base64'),
                getGlobalSetting('app_logo_size')
            ]);
            if (base64) setLogoBase64(base64);
            if (sizeStr) setLogoSize(parseInt(sizeStr));
        };
        fetchLogo();
    }, []);

    const handleNativePrint = () => {
        window.print();
    };

    const handleDownloadPdf = async () => {
        const element = printableAreaRef.current?.querySelector('#printable-content-wrapper');
        if (!element) return;

        setIsLoading(true);
        try {
            const clone = element.cloneNode(true) as HTMLElement;
            clone.style.width = '210mm';
            clone.style.height = 'auto';
            clone.style.overflow = 'visible';
            clone.style.position = 'absolute';
            clone.style.top = '-9999px';
            clone.style.left = '-9999px';
            clone.style.background = 'white';
            document.body.appendChild(clone);

            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                windowWidth: 1200
            });

            document.body.removeChild(clone);

            const imgData = canvas.toDataURL('image/png');
            
            const pageHeight = 297;
            const pageWidth = 210;
            const margin = 15;
            
            const pdfWidth = pageWidth - (margin * 2);
            const pdfHeight = pageHeight - (margin * 2);

            const canvasAspectRatio = canvas.height / canvas.width;
            const totalImageHeightInPdf = pdfWidth * canvasAspectRatio;

            const pdf = new jsPDF('p', 'mm', 'a4');

            let position = 0;
            let heightLeft = totalImageHeightInPdf;

            pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth, totalImageHeightInPdf);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position -= pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', margin, position, pdfWidth, totalImageHeightInPdf);
                heightLeft -= pdfHeight;
            }

            pdf.save('relatorio.pdf');

        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("An error occurred while generating the PDF. Please try using the 'Imprimir / Salvar PDF' button for a native browser experience.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center z-[60] p-4">
            <div className="w-full max-w-4xl bg-surface-dark rounded-t-lg p-4 flex justify-between items-center no-print">
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
            <div className="w-full max-w-4xl h-full overflow-y-auto bg-gray-500 p-8">
                 <div ref={printableAreaRef}>
                     <style>{printStyles}</style>
                     <div
                        id="printable-content-wrapper"
                        className="bg-white shadow-lg mx-auto flex flex-col"
                        style={{ width: '210mm', padding: '1.5cm', minHeight: '297mm' }}
                     >
                        {logoBase64 && (
                            <div className="mb-6 flex justify-center">
                                <img src={logoBase64} alt="Logótipo" style={{ maxHeight: `${logoSize}px`, objectFit: 'contain' }} crossOrigin="anonymous" />
                            </div>
                        )}
                        <div dangerouslySetInnerHTML={{ __html: reportContentHtml }} />
                     </div>
                 </div>
            </div>
        </div>
    );
};

export default PrintPreviewModal;