import React, { useState, useMemo } from 'react';
import { Holiday, Collaborator, Instituicao } from '../types';
import * as dataService from '../services/dataService';
import { FaPlus, FaTrash, FaCalendarAlt, FaUmbrellaBeach, FaGlassCheers, FaGlobe, FaUserTie, FaSync } from 'react-icons/fa';

interface HolidaysConfigDashboardProps {
    holidays: Holiday[];
    collaborators: Collaborator[];
    instituicoes: Instituicao[];
    onRefresh: () => void;
}

const HolidaysConfigDashboard: React.FC<HolidaysConfigDashboardProps> = ({ holidays = [], collaborators, instituicoes, onRefresh }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<Partial<Holiday>>({
        name: '',
        date: new Date().toISOString().split('T')[0],
        type: 'Holiday',
        is_recurring: true,
        collaborator_id: '',
        instituicao_id: ''
    });

    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.full_name])), [collaborators]);
    const institutionMap = useMemo(() => new Map(instituicoes.map(i => [i.id, i.name])), [instituicoes]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.date) return;
        
        setIsSaving(true);
        try {
            const payload = { ...formData };
            if (payload.type === 'Holiday') payload.collaborator_id = undefined;
            if (payload.type === 'Vacation') payload.instituicao_id = undefined;
            if (!payload.collaborator_id) delete payload.collaborator_id;
            if (!payload.instituicao_id) delete payload.instituicao_id;

            await dataService.addConfigItem('holidays', payload);
            setFormData({
                name: '',
                date: new Date().toISOString().split('T')[0],
                type: 'Holiday',
                is_recurring: true,
                collaborator_id: '',
                instituicao_id: ''
            });
            onRefresh();
        } catch (e: any) {
            alert("Erro ao gravar: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Remover este registo de calendário?")) return;
        try {
            await dataService.deleteConfigItem('holidays', id);
            onRefresh();
        } catch (e: any) {
            alert("Erro ao remover: " + e.message);
        }
    };

    const sortedHolidays = useMemo(() => [...holidays].sort((a,b) => b.date.localeCompare(a.date)), [holidays]);

    return (
        <div className="p-6 flex flex-col h-full space-y-6">
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><FaCalendarAlt className="text-pink-400"/> Feriados & Ausências</h2>
                <button onClick={onRefresh} className="text-xs text-brand-secondary hover:text-white flex items-center gap-1 uppercase font-bold"><FaSync/> Atualizar</button>
            </div>

            <form onSubmit={handleSave} className="bg-gray-800 p-4 rounded-lg border border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 tracking-widest">Descrição do Evento</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm text-white" placeholder="Ex: Feriado Municipal, Férias João..." required />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Data</label>
                    <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm text-white" required />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Tipo de Ausência</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm text-white">
                        <option value="Holiday">Feriado (Global/Nacional)</option>
                        <option value="Vacation">Férias (Pessoal)</option>
                        <option value="Bridge">Ponte / Tolerância</option>
                        <option value="Other">Outro</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Recorrência</label>
                    <select value={formData.is_recurring ? 'yes' : 'no'} onChange={e => setFormData({...formData, is_recurring: e.target.value === 'yes'})} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm text-white">
                        <option value="yes">Todos os anos</option>
                        <option value="no">Apenas nesta data</option>
                    </select>
                </div>

                {formData.type === 'Vacation' && (
                    <div className="md:col-span-3 animate-fade-in">
                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Atribuir a Colaborador</label>
                        <select value={formData.collaborator_id} onChange={e => setFormData({...formData, collaborator_id: e.target.value})} className="w-full bg-gray-700 border border-brand-primary/50 rounded p-2 text-sm text-white">
                            <option value="">-- Selecione o Colaborador --</option>
                            {collaborators.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                        </select>
                    </div>
                )}

                <div className="md:col-span-3 flex justify-end pt-2">
                    <button type="submit" disabled={isSaving} className="bg-brand-primary hover:bg-brand-secondary text-white px-6 py-2 rounded font-bold transition-all shadow-lg flex items-center gap-2">
                        {isSaving ? <FaSync className="animate-spin"/> : <FaPlus/>} Registar no Calendário
                    </button>
                </div>
            </form>

            <div className="overflow-x-auto border border-gray-700 rounded-lg">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-800 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                        <tr>
                            <th className="p-3">Data</th>
                            <th className="p-3">Descrição</th>
                            <th className="p-3">Tipo</th>
                            <th className="p-3">Associação</th>
                            <th className="p-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {sortedHolidays.map(h => (
                            <tr key={h.id} className="hover:bg-gray-800/50 transition-colors">
                                <td className="p-3 font-mono text-white">{new Date(h.date).toLocaleDateString()}</td>
                                <td className="p-3 font-bold text-white">{h.name}</td>
                                <td className="p-3">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${h.type === 'Vacation' ? 'bg-pink-900/30 text-pink-400 border-pink-500/30' : 'bg-blue-900/30 text-blue-400 border-blue-500/30'}`}>
                                        {h.type === 'Vacation' ? <FaUmbrellaBeach/> : <FaGlassCheers/>} {h.type}
                                    </span>
                                </td>
                                <td className="p-3 text-gray-400 text-xs italic">
                                    {h.collaborator_id ? (
                                        <span className="flex items-center gap-1"><FaUserTie/> {collaboratorMap.get(h.collaborator_id)}</span>
                                    ) : h.instituicao_id ? (
                                        <span className="flex items-center gap-1"><FaGlobe/> {institutionMap.get(h.instituicao_id)}</span>
                                    ) : 'Global / Nacional'}
                                </td>
                                <td className="p-3 text-right">
                                    <button onClick={() => handleDelete(h.id)} className="text-red-400 hover:text-red-300 transition-colors p-2"><FaTrash/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HolidaysConfigDashboard;
