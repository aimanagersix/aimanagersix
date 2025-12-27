import React, { useState } from 'react';
import { FaBrain, FaCopy, FaCheck, FaTerminal, FaCode, FaExternalLinkAlt, FaDatabase, FaInfoCircle } from 'react-icons/fa';

const McpConfigTab: React.FC = () => {
    const [copied, setCopied] = useState<string | null>(null);
    
    const projectRef = "yyiwkrkuhlkqibhowdmq";
    const mcpUrl = `https://mcp.supabase.com/mcp?project_ref=${projectRef}&features=database,debugging,development,functions,branching,storage,account,docs`;
    
    const cliCommand = `gemini mcp add -t http supabase ${mcpUrl}`;
    
    const jsonConfig = `{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server",
        "${mcpUrl}"
      ]
    }
  }
}`;

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="p-6 space-y-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-purple-600/20 rounded-xl text-purple-400 shadow-lg">
                    <FaBrain size={32}/>
                </div>
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Model Context Protocol (MCP)</h2>
                    <p className="text-sm text-gray-400">Dê "olhos" à IA sobre a infraestrutura real do seu projeto Supabase.</p>
                </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 p-5 rounded-xl text-sm text-blue-200">
                <div className="flex items-center gap-2 font-bold mb-2">
                    <FaInfoCircle /> O que é o MCP?
                </div>
                <p>
                    O MCP permite que ferramentas de IA (como o Gemini CLI ou Cursor) consultem diretamente as tabelas do projeto <strong>{projectRef}</strong>. 
                    Ao ativar isto, a IA não precisa que lhe explique o código; ela lê a realidade do seu banco de dados em tempo real.
                </p>
            </div>

            <div className="space-y-6">
                {/* Opção 1: Terminal CLI */}
                <div className="bg-gray-800/40 p-6 rounded-xl border border-gray-700 shadow-inner">
                    <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                        <FaTerminal className="text-green-400" /> Opção 1: Via Gemini CLI (Terminal)
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">Execute este comando no seu computador para adicionar o servidor MCP ao seu assistente de terminal.</p>
                    <div className="relative group">
                        <div className="bg-black/60 p-4 rounded-lg font-mono text-xs text-green-400 border border-gray-600 break-all pr-12">
                            {cliCommand}
                        </div>
                        <button 
                            onClick={() => handleCopy(cliCommand, 'cli')} 
                            className="absolute right-3 top-3 p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-all"
                        >
                            {copied === 'cli' ? <FaCheck className="text-green-400"/> : <FaCopy />}
                        </button>
                    </div>
                </div>

                {/* Opção 2: Configuração JSON (Cursor/VSCode) */}
                <div className="bg-gray-800/40 p-6 rounded-xl border border-gray-700 shadow-inner">
                    <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                        <FaCode className="text-blue-400" /> Opção 2: Cursor / VS Code (JSON Config)
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">Adicione este bloco ao seu ficheiro de definições MCP (ex: <code>project.json</code> ou definições do Cursor).</p>
                    <div className="relative group">
                        <pre className="bg-black/60 p-4 rounded-lg font-mono text-[11px] text-blue-300 border border-gray-600 overflow-x-auto custom-scrollbar">
                            {jsonConfig}
                        </pre>
                        <button 
                            onClick={() => handleCopy(jsonConfig, 'json')} 
                            className="absolute right-3 top-3 p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-all"
                        >
                            {copied === 'json' ? <FaCheck className="text-green-400"/> : <FaCopy />}
                        </button>
                    </div>
                </div>

                {/* Link direto para documentação */}
                <div className="pt-4 flex justify-between items-center">
                    <a 
                        href="https://supabase.com/docs/guides/ai/mcp" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-brand-secondary text-xs font-bold hover:underline flex items-center gap-2"
                    >
                        Ver Documentação Oficial Supabase MCP <FaExternalLinkAlt size={10}/>
                    </a>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase font-black tracking-widest">
                        <FaDatabase /> STATUS: DISPONÍVEL NO PROJETO
                    </div>
                </div>
            </div>
        </div>
    );
};

export default McpConfigTab;