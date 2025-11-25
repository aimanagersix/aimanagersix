import React, { useMemo, useState } from 'react';
import { Instituicao, Entidade, Collaborator } from '../types';
import { EditIcon, DeleteIcon, PlusIcon, FaPrint, FaFileImport, SearchIcon } from './common/Icons';
import Pagination from './common/Pagination';
import InstituicaoDetailModal from './InstituicaoDetailModal';

interface InstituicaoDashboardProps {
  instituicoes: Instituicao[];
  escolasDepartamentos: Entidade[];
  collaborators: Collaborator[]; // Added prop
  onEdit?: (instituicao: Instituicao) => void;
  onDelete?: (id: string) => void;
  onCreate?: () => void;
  // Quick Action
  onAddEntity?: (instituicaoId: string) => void;
  onImport?: () => void;
}

const InstituicaoDashboard: React.FC<InstituicaoDashboardProps> = ({ instituicoes, escolasDepartamentos: entidades, collaborators, onEdit, onDelete, onCreate, onAddEntity, onImport }) => {
    
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [selectedInstituicao, setSelectedInstituicao] = useState<Instituicao | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
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
    
    const filteredInstituicoes = useMemo(() => {
        return instituicoes.filter(inst => 
            searchQuery === '' ||
            inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inst.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inst.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (inst.nif && inst.nif.includes(searchQuery))
        ).sort((a,b) => a.name.localeCompare(b.name));
    }, [instituicoes, searchQuery]);

    const totalPages = Math.ceil(filteredInstituicoes.length / itemsPerPage);
    const paginatedInstituicoes = useMemo(() => {
        return filteredInstituicoes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredInstituicoes, currentPage, itemsPerPage]);

    const handlePrintList = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const rows = filteredInstituicoes.map(inst => `
            <tr>
                <td>${inst.name}</td>
                <td>${inst.codigo}</td>
                <td>${inst.email}</td>
                <td>${inst.telefone}</td>
                <td>${entidadesCountByInstituicao[inst.id] || 0}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
            <head>
                <title>Listagem de Instituições</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    h1 { color: #333; }
                </style>
            </head>
            <body>
                <h1>Listagem de Instituições</h1>
                <p>Data: ${new Date().toLocaleDateString()}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Código</th>
                            <th>Email</th>
                            <th>Telefone</th>
                            <th>Entidades</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

  return (
    <div className="bg-surface-dark p-6 rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <h2 className="text-xl font-semibold text-white">Gerenciar Instituições</h2>
            <div className="flex gap-2">
                <button onClick={handlePrintList} className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors">
                    <FaPrint /> Imprimir Listagem
                </button>
                {onImport && (
                    <button onClick={onImport} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 transition-colors">
                        <FaFileImport /> Importar Excel
                    </button>
                )}
                {onCreate && (
                    <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors">
                        <PlusIcon /> Adicionar
                    </button>
                )}
            </div>
        </div>

        <div className="mb-6 relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Procurar por nome, código, email ou NIF..."
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md pl-9 p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary"
            />
        </div>
      
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
              <tr 
                key={instituicao.id} 
                className="bg-surface-dark border-b border-gray-700 hover:bg-gray-800/50 cursor-pointer"
                onClick={() => setSelectedInstituicao(instituicao)}
              >
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
                            <button onClick={(e) => { e.stopPropagation(); onEdit(instituicao); }} className="text-blue-400 hover:text-blue-300" aria-label={`Editar ${instituicao.name}`}>
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
            totalItems={filteredInstituicoes.length}
        />

        {selectedInstituicao && (
            <InstituicaoDetailModal
                instituicao={selectedInstituicao}
                entidades={entidades}
                collaborators={collaborators}
                onClose={() => setSelectedInstituicao(null)}
                onEdit={() => {
                    setSelectedInstituicao(null);
                    if (onEdit) onEdit(selectedInstituicao);
                }}
                onAddEntity={onAddEntity}
            />
        )}
    </div>
  );
};

export default InstituicaoDashboard;