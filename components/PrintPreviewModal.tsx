import React, { useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { XIcon, FaFilePdf, SpinnerIcon, FaPrint } from './common/Icons';

interface PrintPreviewModalProps {
    onClose: () => void;
    reportContentHtml: string;
}

// CSS para tornar o relatório amigável para impressão (texto preto em fundo branco)
// Inclui regras @media print para esconder a UI do modal e mostrar apenas o conteúdo
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
        /* Ensure the modal container is not restricting layout */
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

    const handleNativePrint = () => {
        window.print();
    };

    const handleDownloadPdf = async () => {
        const element = printableAreaRef.current?.querySelector('#printable-content-wrapper');
        if (!element) return;

        setIsLoading(true);
        try {
            // Create a clone of the element to render it fully expanded (ignoring scrollbars)
            // This solves the issue where html2canvas cuts off content in scrollable divs
            const clone = element.cloneNode(true) as HTMLElement;
            clone.style.width = '210mm'; // A4 width
            clone.style.height = 'auto';
            clone.style.overflow = 'visible';
            clone.style.position = 'absolute';
            clone.style.top = '-9999px';
            clone.style.left = '-9999px';
            clone.style.background = 'white';
            document.body.appendChild(clone);

            const canvas = await html2canvas(clone, {
                scale: 2, // Higher quality for better text rendering
                useCORS: true,
                backgroundColor: '#ffffff',
                windowWidth: 1200 // Force a desktop width
            });

            // Remove the clone
            document.body.removeChild(clone);

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
            alert("An error occurred while generating the PDF. Please try using the 'Imprimir / Salvar PDF' button for a native browser experience.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center z-[60] p-4" 
        >
            <div className="w-full max-w-4xl bg-surface-dark rounded-t-lg p-4 flex justify-between items-center no-print">
                <h2 className="text-xl font-semibold text-white">Pré-visualização do Relatório</h2>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleNativePrint} 
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        title="Usar a função de impressão do navegador (Ctrl+P). Permite 'Salvar como PDF' com alta qualidade."
                    >
                        <FaPrint />
                        Imprimir / Salvar PDF
                    </button>
                    <button 
                        onClick={handleDownloadPdf} 
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <SpinnerIcon />
                                A gerar...
                            </>
                        ) : (
                            <>
                                <FaFilePdf />
                                Gerar PDF (Imagem)
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
                        style={{ width: '210mm', padding: '1.5cm', minHeight: '297mm' }}
                        dangerouslySetInnerHTML={{ __html: reportContentHtml }}
                     />
                 </div>
            </div>
        </div>
    );
};

export default PrintPreviewModal;