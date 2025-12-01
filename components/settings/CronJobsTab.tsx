
import React from 'react';
// FIX: Imported the missing FaCog icon to resolve 'Cannot find name' error.
import { FaClock, FaEnvelope, FaDatabase, FaPlay, FaSpinner, FaSave, FaCopy, FaCheck, FaCog } from 'react-icons/fa';

interface CronJobsTabProps {
    settings: any;
    onSettingsChange: (key: string, value: any) => void;
    onSave: () => void;
    onTest: () => void;
    onCopy: (text: string, type: 'cron_fn' | 'cron_sql') => void;
}

const CronJobsTab: React.FC<CronJobsTabProps> = ({ settings, onSettingsChange, onSave, onTest, onCopy }) => {

    const {
        reportRecipients,
        cronFunctionUrl,
        isTestingCron,
        cronFunctionCode,
        cronSqlCode,
        copiedCode
    } = settings;

    return (
        <div className="flex flex-col h-full space-y-4 overflow-y-auto pr-2 custom-scrollbar animate-fade-in">
            <div className="bg-gray-900 border border-gray-700 p-4 rounded-lg space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><FaClock className="text-yellow-400"/> Guia de Configuração: Relatórios Automáticos</h3>
                
                <div className="space-y-4">
                    <div className="bg-black/30 p-4 rounded border border-gray-700 relative">
                        <h4 className="text-white font-bold mb-2 text-sm flex items-center gap-2"><FaEnvelope className="text-yellow-400"/> Passo 1: Criar a Edge Function (`weekly-report`)</h4>
                        <p className="text-xs text-gray-400 mb-2">
                            Crie uma nova função <code>weekly-report</code> e cole o seguinte código no ficheiro <code>index.ts</code> da função.
                        </p>
                        <div className="relative">
                            <pre className="text-xs font-mono text-green-300 bg-gray-900 p-3 rounded overflow-x-auto max-h-64 custom-scrollbar">
                                {cronFunctionCode}
                            </pre>
                            <button onClick={() => onCopy(cronFunctionCode, 'cron_fn')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600 text-white">
                                {copiedCode === 'cron_fn' ? <FaCheck className="text-green-400"/> : <FaCopy />}
                            </button>
                        </div>
                    </div>

                    <div className="bg-black/30 p-4 rounded border border-gray-700 relative">
                        <h4 className="text-white font-bold mb-2 text-sm flex items-center gap-2"><FaDatabase className="text-blue-400"/> Passo 2: Agendar a Tarefa (SQL)</h4>
                        <p className="text-xs text-gray-400 mb-2">
                            Execute este comando no SQL Editor do seu projeto Supabase para agendar a tarefa. Substitua <code>[PROJECT-REF]</code> e <code>[SERVICE_ROLE_KEY]</code> pelos seus valores.
                        </p>
                        <div className="relative">
                            <pre className="text-xs font-mono text-orange-300 bg-gray-900 p-3 rounded overflow-x-auto max-h-40 custom-scrollbar">
                                {cronSqlCode}
                            </pre>
                            <button onClick={() => onCopy(cronSqlCode, 'cron_sql')} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded hover:bg-gray-600 text-white">
                                     {copiedCode === 'cron_sql' ? <FaCheck className="text-green-400"/> : <FaCopy />}
                            </button>
                        </div>
                    </div>

                    <div className="bg-black/30 p-4 rounded border border-gray-700 relative">
                        <h4 className="text-white font-bold mb-2 text-sm flex items-center gap-2"><FaCog className="text-gray-400"/> Passo 3: Configuração & Teste</h4>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-gray-500 uppercase mb-1">Emails Destinatários (separados por vírgula)</label>
                                <div className="flex gap-2">
                                    <input type="text" value={reportRecipients} onChange={(e) => onSettingsChange('reportRecipients', e.target.value)} className="flex-grow bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm" placeholder="admin@empresa.com, gestor@empresa.com" />
                                    <button onClick={onSave} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm flex items-center gap-2"><FaSave /> Guardar</button>
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-700 pt-3">
                                     <label className="block text-xs text-gray-500 uppercase mb-1">URL da Função (Para Teste)</label>
                                     <div className="flex gap-2 items-center">
                                     <input type="text" value={cronFunctionUrl} onChange={(e) => onSettingsChange('cronFunctionUrl', e.target.value)} className="flex-grow bg-gray-800 border border-gray-600 text-white rounded-md p-2 text-sm font-mono" placeholder="https://[PROJECT].supabase.co/functions/v1/weekly-report"/>
                                     <button onClick={onTest} disabled={isTestingCron || !cronFunctionUrl} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm flex items-center gap-2 disabled:opacity-50">
                                         {isTestingCron ? <FaSpinner className="animate-spin"/> : <FaPlay />} Testar Envio Agora
                                     </button>
                                     </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CronJobsTab;
