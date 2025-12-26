
import React, { useState, useMemo } from 'react';
import { Holiday, Collaborator, Instituicao } from '../types';
import * as dataService from '../services/dataService';
import { FaPlus, FaTrash, FaCalendarAlt, FaUmbrellaBeach, FaGlassCheers, FaGlobe, FaUserTie, FaSync, FaArrowRight } from 'react-icons/fa';

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
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        type: 'Holiday',
        is_recurring: true,
        collaborator_id: '',
        instituicao_id: ''
    });

    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.full_name])), [collaborators]);
    const institutionMap = useMemo(() => new Map(instituicoes.map(i => [i.id, i.name])), [instituicoes]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.start_date) return;
        
        setIsSaving(true);
        try {
            const payload = { 
                ...formData,
                // Se não houver end_date, é igual ao start_date
                end_date: formData.end_date || formData.start_date
            };
            
            if (payload.type === 'Holiday') payload.collaborator_id = undefined;
            if (payload.type === 'Vacation') payload.instituicao_id = undefined;
            if (!payload.collaborator_id) delete payload.collaborator_id;
            if (!payload.instituicao_id) delete payload.instituicao_id;

            await dataService.addConfigItem('holidays', payload);
            setFormData({
                name: '',
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
                type: 'Holiday',
                is_recurring: true,
                collaborator_id: '',
                instituicao_id: ''
            });
            onRefresh();
        } catch (e: any) {
            alert("Erro ao gravar: " + (e.message || "Violação de segurança. Execute o Patch v30.0 na consola BD."));
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

    const sortedHolidays = useMemo(() => [...holidays].sort((a,b) => b.start_date.localeCompare(a.start_date)), [holidays]);

    return (
        <div className="p-6 flex flex-col h-full space-y-6">
            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                <h2 className="text-xl font-bold text-white flex items-center gap-2"><FaCalendarAlt className="text-pink-400"/> Gestão de Calendário (Feriados & Férias)</h2>
                <button onClick={onRefresh} className="text-xs text-brand-secondary hover:text-white flex items-center gap-1 uppercase font-bold"><FaSync/> Atualizar</button>
            </div>

            <form onSubmit={handleSave} className="bg-gray-800 p-5 rounded-xl border border-gray-700 grid grid-cols-1 md:grid-cols-4 gap-4 shadow-2xl">
                <div className="md:col-span-4">
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 tracking-widest">Descrição / Motivo</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm text-white focus:border-brand-primary outline-none" placeholder="Ex: Feriado Municipal, Férias de Verão - João Silva..." required />
                </div>
                
                <div className="md:col-span-2 bg-gray-900/40 p-3 rounded-lg border border-gray-700 flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Data Início</label>
                        <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm text-white" required />
                    </div>
                    <div className="hidden sm:block pb-3 text-gray-600"><FaArrowRight/></div>
                    <div className="flex-1 w-full">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Data Fim (Opcional)</label>
                        <input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm text-white" />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Tipo</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm text-white outline-none">
                        <option value="Holiday">Feriado (Global)</option>
                        <option value="Vacation">Férias (Pessoal)</option>
                        <option value="Bridge">Ponte / Tolerância</option>
                        <option value="Other">Outro</option>
                    </select>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Recorrência</label>
                    <select value={formData.is_recurring ? 'yes' : 'no'} onChange={e => setFormData({...formData, is_recurring: e.target.value === 'yes'})} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm text-white outline-none">
                        <option value="yes">Anual (Recorrente)</option>
                        <option value="no">Apenas nestas datas</option>
                    </select>
                </div>

                {formData.type === 'Vacation' && (
                    <div className="md:col-span-4 animate-fade-in bg-pink-900/10 p-3 rounded-lg border border-pink-500/20">
                        <label className="block text-[10px] font-black text-pink-400 uppercase mb-1">Atribuir Ausência a Colaborador</label>
                        <select value={formData.collaborator_id} onChange={e => setFormData({...formData, collaborator_id: e.target.value})} className="w-full bg-gray-700 border border-pink-500/30 rounded p-2 text-sm text-white outline-none focus:border-pink-500">
                            <option value="">-- Selecione o Colaborador --</option>
                            {collaborators.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                        </select>
                    </div>
                )}

                <div className="md:col-span-4 flex justify-end pt-2">
                    <button type="submit" disabled={isSaving} className="bg-brand-primary hover:bg-brand-secondary text-white px-8 py-3 rounded-lg font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-3">
                        {isSaving ? <FaSync className="animate-spin"/> : <FaPlus/>} 
                        {isSaving ? 'A Gravar...' : 'Registar Ausência'}
                    </button>
                </div>
            </form>

            <div className="overflow-x-auto border border-gray-700 rounded-xl shadow-inner bg-gray-900/20">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-800 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                        <tr>
                            <th className="p-4">Período</th>
                            <th className="p-4">Descrição</th>
                            <th className="p-4">Tipo</th>
                            <th className="p-4">Abrangência</th>
                            <th className="p-4 text-right">Gestão</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {sortedHolidays.map(h => {
                            const rangeText = h.end_date && h.end_date !== h.start_date 
                                ? `${new Date(h.start_date).toLocaleDateString()} a ${new Date(h.end_date).toLocaleDateString()}`
                                : new Date(h.start_date).toLocaleDateString();

                            return (
                                <tr key={h.id} className="hover:bg-gray-800/50 transition-colors">
                                    <td className="p-4 font-mono text-white text-xs">{rangeText}</td>
                                    <td className="p-4 font-bold text-white">{h.name}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase border ${h.type === 'Vacation' ? 'bg-pink-900/30 text-pink-400 border-pink-500/30' : 'bg-blue-900/30 text-blue-400 border-blue-500/30'}`}>
                                            {h.type === 'Vacation' ? <FaUmbrellaBeach/> : <FaGlassCheers/>} {h.type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-400 text-xs italic">
                                        {h.collaborator_id ? (
                                            <span className="flex items-center gap-2 text-white font-semibold"><FaUserTie className="text-pink-400"/> {collaboratorMap.get(h.collaborator_id)}</span>
                                        ) : h.instituicao_id ? (
                                            <span className="flex items-center gap-2"><FaGlobe/> {institutionMap.get(h.instituicao_id)}</span>
                                        ) : 'Global / Empresa'}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleDelete(h.id)} className="text-red-400 hover:text-red-100 bg-red-900/10 hover:bg-red-600 p-2 rounded-full transition-all"><FaTrash size={12}/></button>
                                    </td>
                                </tr>
                            );
                        })}
                        {sortedHolidays.length === 0 && (
                            <tr><td colSpan={5} className="p-10 text-center text-gray-500 italic">Nenhum evento registado no calendário.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HolidaysConfigDashboard;
