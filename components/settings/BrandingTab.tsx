import React from 'react';
import { FaImage, FaSave } from 'react-icons/fa';

interface BrandingTabProps {
    settings: any;
    onSettingsChange: (key: string, value: any) => void;
    onSave: () => void;
    instituicoes: any[];
}

const BrandingTab: React.FC<BrandingTabProps> = ({ settings, onSettingsChange, onSave, instituicoes }) => {
    
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 500 * 1024) { // 500KB limit
                alert("O logótipo deve ter menos de 500KB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                onSettingsChange('app_logo_base64', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">
                Personalização (Branding)
            </h2>
            <div className="space-y-6 animate-fade-in">
                {/* Branding Section */}
                <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg">
                    <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FaImage className="text-blue-400"/> Configuração de Relatórios</h3>
                    <p className="text-sm text-gray-400 mb-4">
                        Personalize os relatórios com o logótipo e informações da sua organização.
                    </p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-500 uppercase mb-1">Carregar Logótipo</label>
                            <div className="flex items-center gap-4">
                                <input type="file" onChange={handleLogoUpload} accept="image/png, image/jpeg" className="text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-white hover:file:bg-brand-secondary"/>
                                {settings.app_logo_base64 && <img src={settings.app_logo_base64} alt="Preview" className="h-12 border border-gray-600 bg-white p-1 rounded" />}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 uppercase mb-1">Tamanho do Logótipo (px)</label>
                                <div className="flex items-center gap-3">
                                    <input type="range" min="30" max="200" value={settings.app_logo_size || 80} onChange={e => onSettingsChange('app_logo_size', parseInt(e.target.value))} className="w-full" />
                                    <span className="text-white font-mono text-sm">{settings.app_logo_size || 80}px</span>
                                </div>
                            </div>
                             <div>
                                <label className="block text-xs text-gray-500 uppercase mb-1">Alinhamento do Logótipo</label>
                                <select value={settings.app_logo_alignment || 'center'} onChange={e => onSettingsChange('app_logo_alignment', e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm">
                                    <option value="flex-start">Esquerda</option>
                                    <option value="center">Centro</option>
                                    <option value="flex-end">Direita</option>
                                </select>
                            </div>
                        </div>
                         <div>
                            <label className="block text-xs text-gray-500 uppercase mb-1">Rodapé dos Relatórios</label>
                            <select value={settings.report_footer_institution_id || ''} onChange={e => onSettingsChange('report_footer_institution_id', e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm">
                                <option value="">-- Nenhum --</option>
                                {instituicoes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Selecione uma instituição para que os seus dados (morada, NIF, contactos) apareçam no rodapé dos documentos impressos.</p>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="mt-6 flex justify-end">
                    <button onClick={onSave} className="bg-brand-primary text-white px-6 py-2 rounded-md hover:bg-brand-secondary transition-colors flex items-center gap-2 shadow-lg">
                        <FaSave /> Guardar Personalização
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BrandingTab;