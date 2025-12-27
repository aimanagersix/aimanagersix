import React, { useState, useEffect } from 'react';
import { FaRobot, FaKeyboard, FaSave, FaLock, FaSync, FaShoppingCart, FaUsers } from 'react-icons/fa';
import * as dataService from '../../services/dataService';
import { Team } from '../../types';

interface GeneralScansTabProps {
    settings: any;
    onSettingsChange: (key: string, value: any) => void;
    onSave: () => void;
    instituicoes: any[];
}

const GeneralScansTab: React.FC<GeneralScansTabProps> = ({ settings, onSettingsChange, onSave }) => {
    const [teams, setTeams] = useState<Team[]>([]);

    useEffect(() => {
        const loadTeams = async () => {
            const data = await dataService.fetchAllData();
            setTeams(data.teams);
        };
        loadTeams();
    }, []);

    const handleResetInfrastructure = () => {
        if (window.confirm("ATENÇÃO: Isto irá desligar a aplicação da base de dados atual. Terá de inserir as novas credenciais Supabase. Deseja continuar?")) {
            dataService.disconnectInfrastructure();
        }
    };

    return (
        <div className="space-y-6 animate-fade-in p-6">
            {/* Procurement Approval Section */}
            <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FaShoppingCart className="text-blue-400"/> Aprovações de Aquisição</h3>
                <p className="text-sm text-gray-400 mb-4">
                    Selecione a equipa que terá permissão para aprovar ou rejeitar pedidos de compra (DORA Workflow).
                </p>
                <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 tracking-widest flex items-center gap-2"><FaUsers/> Equipa Responsável</label>
                    <select 
                        value={settings.procurement_approval_team_id || ''} 
                        onChange={e => onSettingsChange('procurement_approval_team_id', e.target.value)} 
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm focus:border-brand-primary outline-none"
                    >
                        <option value="">-- Qualquer Administrador --</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Auto Scan Section */}
            <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FaRobot className="text-purple-400"/> Auto Scan de Vulnerabilidades (IA)</h3>
                <p className="text-sm text-gray-400 mb-4">
                    Configure o scanner automático para procurar vulnerabilidades conhecidas (CVEs) no seu inventário.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 tracking-widest">Frequência (Dias)</label>
                        <select value={settings.scan_frequency_days} onChange={e => onSettingsChange('scan_frequency_days', e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm">
                            <option value="0">Desativado</option>
                            <option value="1">Diário</option>
                            <option value="7">Semanal</option>
                            <option value="30">Mensal</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 tracking-widest">Hora de Execução</label>
                        <input type="time" value={settings.scan_start_time} onChange={e => onSettingsChange('scan_start_time', e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"/>
                    </div>
                </div>
            </div>

            {/* Security Policy Section */}
            <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FaLock className="text-red-400"/> Segurança de Acesso</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 tracking-widest">Validade da Password (Dias)</label>
                        <select value={settings.password_expiry_days || '0'} onChange={e => onSettingsChange('password_expiry_days', e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm">
                            <option value="0">Nunca Expira</option>
                            <option value="30">30 Dias</option>
                            <option value="90">90 Dias (Recomendado)</option>
                            <option value="180">180 Dias</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Naming Convention Section */}
            <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FaKeyboard className="text-green-400"/> Convenções de Nomenclatura</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 tracking-widest">Prefixo</label>
                        <input type="text" value={settings.equipment_naming_prefix} onChange={e => onSettingsChange('equipment_naming_prefix', e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" placeholder="Ex: PC-"/>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 tracking-widest">Nº de Dígitos</label>
                        <input type="number" min="1" max="8" value={settings.equipment_naming_digits} onChange={e => onSettingsChange('equipment_naming_digits', e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"/>
                    </div>
                </div>
            </div>

            <div className="bg-red-900/10 border border-red-500/30 p-4 rounded-lg mt-12">
                <h3 className="font-bold text-red-400 mb-2 flex items-center gap-2"><FaSync /> Migração de Infraestrutura</h3>
                <button type="button" onClick={handleResetInfrastructure} className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/50 px-4 py-2 rounded text-xs font-bold transition-all">Reiniciar Ligação ao Supabase</button>
            </div>

            <div className="mt-6 flex justify-end">
                <button onClick={onSave} className="bg-brand-primary text-white px-6 py-2 rounded-md hover:bg-brand-secondary transition-colors flex items-center gap-2 shadow-lg font-black uppercase text-xs tracking-widest">
                    <FaSave /> Guardar Configurações
                </button>
            </div>
        </div>
    );
};

export default GeneralScansTab;