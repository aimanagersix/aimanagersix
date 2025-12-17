import React from 'react';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

interface SortableHeaderProps {
    label: string;
    sortKey: string;
    currentSort: { key: string; direction: 'ascending' | 'descending' };
    onSort: (key: string) => void;
    className?: string;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({ label, sortKey, currentSort, onSort, className = "" }) => (
    <th 
        scope="col" 
        className={`px-6 py-3 cursor-pointer hover:bg-gray-700/50 transition-colors group ${className}`}
        onClick={() => onSort(sortKey)}
    >
        <div className={`flex items-center gap-2 ${className.includes('text-right') ? 'justify-end' : className.includes('text-center') ? 'justify-center' : 'justify-start'}`}>
            {label}
            <span className="text-gray-500 group-hover:text-gray-300">
                {currentSort.key === sortKey ? (
                    currentSort.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />
                ) : (
                    <FaSort className="opacity-50" />
                )}
            </span>
        </div>
    </th>
);

export default SortableHeader;