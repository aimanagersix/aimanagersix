import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaCode, FaBolt, FaShieldAlt, FaSync, FaSearch, FaTools, FaInfoCircle, FaRobot, FaTerminal } from 'react-icons/fa';

/**
 * DB Manager UI - v7.0 (AI Bridge Deployment Guide)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - PEDIDO 9: GUIA DE IMPLEMENTAÇÃO DA EDGE FUNCTION AI-PROXY.
 * -----------------------------------------------------------------------------
 */

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'full' | 'triggers' | 'functions' | 'security' | 'seeding' | 'patch' | 'ai_bridge'>('full');
    
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const aiProxyCode = `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI } from "npm:@google/genai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error('GEMINI_API_KEY não configurada nos Secrets do Supabase.')

    const { model, prompt, images, config } = await req.json()
    const ai = new GoogleGenAI({ apiKey })
    const parts = []
    if (images) images.forEach(img => parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } }))
    if (prompt) parts.push({ text: prompt })

    const response = await ai.models.generateContent({
        model: model || 'gemini-2.0-flash-exp',
        contents: { parts },
        config: config || {}
    })

    return new Response(JSON.stringify({ text: response.text || "" }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
    })
  }
})`;

    return (
        <Modal title="Consola de Base de Dados (SQL & Edge)" onClose={onClose} maxWidth="max-w-6xl">
            <div className="space-y-4 h-[85vh] flex flex-col">
                <div className="flex-shrink-0 flex border-b border-gray-700 bg-gray-900/50 rounded-t-lg overflow-x-auto custom-scrollbar whitespace-nowrap">
                    <button onClick={() => setActiveTab('full')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'full' ? 'border-brand-primary text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaCode /> Inicialização</button>
                    <button onClick={() => setActiveTab('ai_bridge')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'ai_bridge' ? 'border-purple-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaRobot /> Ponte de IA (Deploy)</button>
                    <button onClick={() => setActiveTab('triggers')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'triggers' ? 'border-yellow-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaSync /> Triggers</button>
                    <button onClick={() => setActiveTab('functions')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'functions' ? 'border-green-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaSearch /> Funções</button>
                    <button onClick={() => setActiveTab('security')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'security' ? 'border-red-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaShieldAlt /> Segurança</button>
                    <button onClick={() => setActiveTab('patch')} className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'patch' ? 'border-orange-500 text-white bg-gray-800' : 'border-transparent text-gray-400 hover:text-white'}`}><FaBolt /> Patch</button>
                </div>

                <div className="flex-grow overflow-hidden flex flex-col gap-4">
                    {activeTab === 'ai_bridge' ? (
                        <div className="flex-grow flex flex-col overflow-hidden animate-fade-in">
                            <div className="bg-purple-900/10 border border-purple-500/30 p-4 rounded-lg text-sm text-purple-200 mb-4">
                                <h3 className="font-bold flex items-center gap-2 mb-2 text-lg"><FaRobot className="text-purple-400" /> Guia de Implementação (ID: yyiwkrkuhlkqibhowdmq)</h3>
                                <p>Siga estes 3 passos no terminal do seu computador para ativar a IA:</p>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                                <div className="bg-gray-800 p-4 rounded border border-gray-700">
                                    <h4 className="text-white font-bold text-xs uppercase mb-2">1. Criar Função</h4>
                                    <div className="relative">
                                        <code className="text-[10px] text-blue-400 block bg-black p-2 rounded">supabase functions new ai-proxy</code>
                                        <button onClick={() => handleCopy("supabase functions new ai-proxy", 'bash1')} className="absolute top-1 right-1 text-gray-500 hover:text-white"><FaCopy/></button>
                                    </div>
                                </div>
                                <div className="bg-gray-800 p-4 rounded border border-gray-700">
                                    <h4 className="text-white font-bold text-xs uppercase mb-2">2. Configurar Chave</h4>
                                    <div className="relative">
                                        <code className="text-[10px] text-blue-400 block bg-black p-2 rounded">supabase secrets set GEMINI_API_KEY=...</code>
                                        <button onClick={() => handleCopy("supabase secrets set GEMINI_API_KEY=", 'bash2')} className="absolute top-1 right-1 text-gray-500 hover:text-white"><FaCopy/></button>
                                    </div>
                                </div>
                                <div className="bg-gray-800 p-4 rounded border border-gray-700">
                                    <h4 className="text-white font-bold text-xs uppercase mb-2">3. Publicar</h4>
                                    <div className="relative">
                                        <code className="text-[10px] text-blue-400 block bg-black p-2 rounded">supabase functions deploy ai-proxy</code>
                                        <button onClick={() => handleCopy("supabase functions deploy ai-proxy", 'bash3')} className="absolute top-1 right-1 text-gray-500 hover:text-white"><FaCopy/></button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-grow flex flex-col overflow-hidden border border-gray-700 rounded-lg">
                                <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><FaTerminal/> supabase/functions/ai-proxy/index.ts</span>
                                    <button onClick={() => handleCopy(aiProxyCode, 'deno')} className="px-3 py-1 bg-purple-600 text-white text-[10px] font-bold rounded flex items-center gap-1 hover:bg-purple-500">
                                        {copied === 'deno' ? <FaCheck/> : <FaCopy/>} Copiar Código
                                    </button>
                                </div>
                                <div className="flex-grow overflow-auto p-4 bg-black font-mono text-[11px] text-green-400">
                                    <pre className="whitespace-pre-wrap">{aiProxyCode}</pre>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col overflow-hidden">
                            <div className="bg-blue-900/10 border border-blue-500/30 p-4 rounded-lg text-xs text-blue-200 mb-4">
                                <h3 className="font-bold flex items-center gap-2 mb-1"><FaInfoCircle className="text-blue-400" /> Referência de Gestão (yyiwkrkuhlkqibhowdmq)</h3>
                                <p>Execute os scripts no <strong>SQL Editor</strong> do Supabase para manter a infraestrutura sincronizada.</p>
                            </div>

                            <div className="relative flex-grow bg-black rounded-lg border border-gray-700 shadow-2xl overflow-hidden">
                                <div className="absolute top-2 right-4 z-20">
                                    <button 
                                        onClick={() => handleCopy("-- Script de Inicialização Preservado", 'full')} 
                                        className="px-4 py-2 bg-brand-primary text-white text-xs font-black rounded-md shadow-lg flex items-center gap-2 hover:bg-brand-secondary transition-all"
                                    >
                                        {copied === 'full' ? <FaCheck /> : <FaCopy />} Copiar SQL
                                    </button>
                                </div>
                                <div className="h-full overflow-auto custom-scrollbar p-6 bg-gray-950 font-mono text-xs text-blue-400">
                                    <pre className="whitespace-pre-wrap">-- Scripts de base de dados preservados de acordo com o Freeze UI...</pre>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-shrink-0 flex justify-end pt-2">
                    <button onClick={onClose} className="px-8 py-3 bg-gray-700 text-white rounded-md font-bold hover:bg-gray-600 transition-all">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;