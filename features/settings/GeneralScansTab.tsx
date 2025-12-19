
import React from 'react';
import { FaRobot, FaKeyboard, FaSave, FaLock } from 'react-icons/fa';

interface GeneralScansTabProps {
    settings: any;
    onSettingsChange: (key: string, value: any) => void;
    onSave: () => void;
    instituicoes: any[];
}

const GeneralScansTab: React.FC<GeneralScansTabProps> = ({ settings, onSettingsChange, onSave }) => {
    
    return (
        <div className="space-y-6 animate-fade-in p-6">
            {/* Auto Scan Section */}
            <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FaRobot className="text-purple-400"/> Auto Scan de Vulnerabilidades (IA)</h3>
                <p className="text-sm text-gray-400 mb-4">
                    Configure o scanner automático para procurar vulnerabilidades conhecidas (CVEs) no seu inventário de software e hardware.
                    Última execução: <span className="font-mono text-purple-300">{settings.last_auto_scan}</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-500 uppercase mb-1">Frequência (Dias)</label>
                        <select value={settings.scan_frequency_days} onChange={e => onSettingsChange('scan_frequency_days', e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm">
                            <option value="0">Desativado</option>
                            <option value="1">Diário</option>
                            <option value="7">Semanal</option>
                            <option value="30">Mensal</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 uppercase mb-1">Hora de Execução</label>
                        <input type="time" value={settings.scan_start_time} onChange={e => onSettingsChange('scan_start_time', e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"/>
                    </div>
                </div>
            </div>

            {/* Security Policy Section */}
            <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FaLock className="text-red-400"/> Políticas de Segurança de Acesso</h3>
                <p className="text-sm text-gray-400 mb-4">
                    Controle de validade e expiração de acessos.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-500 uppercase mb-1">Validade da Password (Dias)</label>
                        <select value={settings.password_expiry_days || '0'} onChange={e => onSettingsChange('password_expiry_days', e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm">
                            <option value="0">Nunca Expira (Não Recomendado)</option>
                            <option value="30">30 Dias</option>
                            <option value="60">60 Dias</option>
                            <option value="90">90 Dias (Standard)</option>
                            <option value="180">180 Dias</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Naming Convention Section */}
            <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FaKeyboard className="text-green-400"/> Convenções de Nomenclatura</h3>
                <p className="text-sm text-gray-400 mb-4">
                    Defina o padrão para a geração automática de nomes de equipamentos (ex: Nome na Rede).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-500 uppercase mb-1">Prefixo</label>
                        <input type="text" value={settings.equipment_naming_prefix} onChange={e => onSettingsChange('equipment_naming_prefix', e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" placeholder="Ex: PC-"/>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 uppercase mb-1">Nº de Dígitos</label>
                        <input type="number" min="1" max="8" value={settings.equipment_naming_digits} onChange={e => onSettingsChange('equipment_naming_digits', e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"/>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 flex justify-end">
                <button onClick={onSave} className="bg-brand-primary text-white px-6 py-2 rounded-md hover:bg-brand-secondary transition-colors flex items-center gap-2 shadow-lg">
                    <FaSave /> Guardar Configuração Geral
                </button>
            </div>
        </div>
    );
};

export default GeneralScansTab;
