import React, { useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { XIcon, FaFilePdf, SpinnerIcon } from './common/Icons';

interface PrintPreviewModalProps {
    onClose: () => void;
    reportContentHtml: string;
}

// CSS para tornar o relatório amigável para impressão (texto preto em fundo branco)
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
    }
`;

const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ onClose, reportContentHtml }) => {
    const printableAreaRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleDownloadPdf = async () => {
        const element = printableAreaRef.current?.querySelector('#printable-content-wrapper');
        if (!element) return;

        setIsLoading(true);
        try {
            const canvas = await html2canvas(element as HTMLElement, {
                scale: 2, // Higher quality for better text rendering
                useCORS: true,
                backgroundColor: '#ffffff',
            });

            const imgData = canvas.toDataURL('image/png');
            
            // A4 page dimensions in mm
            const pageHeight = 297;
            const pageWidth = 210;
            const margin = 15; // 1.5cm margin
            
            // Dimensions for the image inside the PDF
            const pdfWidth = pageWidth - (margin * 2);
            const pdfHeight = pageHeight - (margin * 2);

            const canvasAspectRatio = canvas.height / canvas.width;
            const totalImageHeightInPdf = pdfWidth * canvasAspectRatio;

            const pdf = new jsPDF('p', 'mm', 'a4');

            let position = 0;
            let heightLeft = totalImageHeightInPdf;

            // Add the first page
            pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth, totalImageHeightInPdf);
            heightLeft -= pdfHeight;

            // Add subsequent pages if the content is taller than one page
            while (heightLeft > 0) {
                position -= pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', margin, position, pdfWidth, totalImageHeightInPdf);
                heightLeft -= pdfHeight;
            }

            pdf.save('relatorio.pdf');

        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("An error occurred while generating the PDF. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center z-[60] p-4" 
        >
            <div className="w-full max-w-4xl bg-surface-dark rounded-t-lg p-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Pré-visualização do Relatório</h2>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleDownloadPdf} 
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 px-4 py-2 w-48 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <SpinnerIcon />
                                A gerar...
                            </>
                        ) : (
                            <>
                                <FaFilePdf />
                                Descarregar PDF
                            </>
                        )}
                    </button>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <XIcon />
                    </button>
                </div>
            </div>
            <div className="w-full max-w-4xl h-full overflow-y-auto bg-gray-500 p-8">
                 <div ref={printableAreaRef}>
                     <style>{printStyles}</style>
                     <div
                        id="printable-content-wrapper"
                        className="bg-white shadow-lg mx-auto"
                        style={{ width: '210mm', padding: '1.5cm' }} // Removed min-height to allow natural content flow
                        dangerouslySetInnerHTML={{ __html: reportContentHtml }}
                     />
                 </div>
            </div>
        </div>
    );
};

export default PrintPreviewModal;
