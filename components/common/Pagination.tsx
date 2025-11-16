import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemsPerPage: number;
    onItemsPerPageChange: (size: number) => void;
    totalItems: number;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange, totalItems }) => {
    if (totalPages <= 1 && totalItems <= itemsPerPage) {
        return null;
    }

    const handlePrevious = () => {
        onPageChange(Math.max(1, currentPage - 1));
    };

    const handleNext = () => {
        onPageChange(Math.min(totalPages, currentPage + 1));
    };

    return (
        <nav className="flex items-center justify-between mt-6 flex-wrap gap-4" aria-label="Pagination">
            <div className="flex items-center gap-x-6 gap-y-2 flex-wrap">
                <p className="text-sm text-on-surface-dark-secondary">
                    A mostrar <span className="font-medium text-white">{totalItems > 0 ? Math.min((currentPage - 1) * itemsPerPage + 1, totalItems) : 0}</span> a <span className="font-medium text-white">{Math.min(currentPage * itemsPerPage, totalItems)}</span> de <span className="font-medium text-white">{totalItems}</span> resultados
                </p>
                <div className="flex items-center gap-2">
                    <label htmlFor="itemsPerPageSelect" className="text-sm text-on-surface-dark-secondary whitespace-nowrap">Registos por página:</label>
                    <select
                        id="itemsPerPageSelect"
                        value={itemsPerPage}
                        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                        className="bg-gray-700 border border-gray-600 text-white rounded-md p-1.5 text-sm focus:ring-brand-secondary focus:border-brand-secondary"
                    >
                        <option value={20}>20</option>
                        <option value={30}>30</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>
            <div className="flex justify-end gap-3">
                <button
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-on-surface-dark-secondary bg-surface-dark hover:bg-gray-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Anterior
                </button>
                <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-on-surface-dark-secondary bg-surface-dark hover:bg-gray-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Próxima
                </button>
            </div>
        </nav>
    );
};

export default Pagination;
