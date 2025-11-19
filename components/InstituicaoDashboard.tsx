
import React, { useMemo, useState } from 'react';
import { Instituicao, Entidade } from '../types';
import { EditIcon, DeleteIcon } from './common/Icons';
import Pagination from './common/Pagination';

interface InstituicaoDashboardProps {
  instituicoes: Instituicao[];
  escolasDepartamentos: Entidade[];
  onEdit?: (instituicao: Instituicao) => void;
  onDelete?: (id: string) => void;
}

const InstituicaoDashboard: React.FC<InstituicaoDashboardProps> = ({ instituicoes, escolasDepartamentos: entidades, onEdit, onDelete }) => {
    
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    
    const entidadesCountByInstituicao = useMemo(() => {
        return entidades.reduce((acc, curr) => {
            acc[curr.instituicaoId] = (acc[curr.instituicaoId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [entidades]);

    const handleItemsPerPageChange = (size: number) => {
        setItemsPerPage(size);
        setCurrentPage(1);
    };
    
    const sortedInstituicoes = useMemo(() => {
        return [...instituicoes].sort((a,b) => a.name.localeCompare(b.name));
    }, [instituicoes]);

    const totalPages = Math.ceil(sortedInstituicoes.length / itemsPerPage);
    const paginatedInstituicoes = useMemo(() => {
        return sortedInstituicoes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [sortedInstituicoes, currentPage, itemsPerPage]);

  return (
    <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
        <h2 className="text-xl font-semibold text-white mb-4">Gerenciar Instituições</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-on-surface-dark-secondary">
          <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3">Nome da Instituição</th>
              <th scope="col" className="px-6 py-3">Código</th>
              <th scope="col" className="px-6 py-3">Contactos</th>
              <th scope="col" className="px-6 py-3 text-center">Nº de Entidades</th>
              <th scope="col" className="px-6 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedInstituicoes.length > 0 ? paginatedInstituicoes.map((instituicao) => {
                const isDeleteDisabled = (entidadesCountByInstituicao[instituicao.id] || 0) > 0;
                return (
              <tr key={instituicao.id} className="bg-surface-dark border-b border-gray-700 hover:bg-gray-800/50">
                <td className="px-6 py-4 font-medium text-on-surface-dark whitespace-nowrap">
                  {instituicao.name}
                </td>
                <td className="px-6 py-4">{instituicao.codigo}</td>
                <td className="px-6 py-4">
                    <div>{instituicao.email}</div>
                    <div className="text-xs">{instituicao.telefone}</div>
                </td>
                <td className="px-6 py-4 text-center">{entidadesCountByInstituicao[instituicao.id] || 0}</td>
                <td className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center gap-4">
                        {onEdit && (
                            <button onClick={() => onEdit(instituicao)} className="text-blue-400 hover:text-blue-300" aria-label={`Editar ${instituicao.name}`}>
                                <EditIcon />
                            </button>
                        )}
                        {onDelete && (
                             <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (!isDeleteDisabled) onDelete(instituicao.id); 
                                }} 
                                className={isDeleteDisabled ? "text-gray-600 opacity-30 cursor-not-allowed" : "text-red-400 hover:text-red-300"}
                                disabled={isDeleteDisabled}
                                title={isDeleteDisabled ? "Impossível excluir: Existem entidades associadas" : `Excluir ${instituicao.name}`}
                                aria-label={isDeleteDisabled ? "Exclusão desabilitada" : `Excluir ${instituicao.name}`}
                            >
                                <DeleteIcon />
                            </button>
                        )}
                    </div>
                </td>
              </tr>
            )}) : (
                <tr>
                    <td colSpan={5} className="text-center py-8 text-on-surface-dark-secondary">Nenhuma instituição encontrada.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            totalItems={sortedInstituicoes.length}
        />
    </div>
  );
};

export default InstituicaoDashboard;
