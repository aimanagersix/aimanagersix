
import React, { Component, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import { LayoutProvider } from './contexts/LayoutContext';
import { LanguageProvider } from './contexts/LanguageContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

interface ErrorBoundaryProps {
    children?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: any;
}

// "Professional Grade" Error Boundary
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Critical System Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center p-8 text-center font-sans">
          <div className="bg-[#1E1E1E] p-10 rounded-2xl border border-red-500/30 shadow-2xl max-w-2xl w-full">
            <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Erro de Integridade Detetado</h1>
            <p className="text-gray-400 mb-8 leading-relaxed">A aplicação encontrou uma condição inesperada. Isto pode dever-se a uma falha na ligação de rede ou dados desatualizados no browser.</p>
            
            <div className="bg-black/50 p-4 rounded-xl border border-gray-800 text-left mb-8">
              <p className="text-[10px] text-gray-500 uppercase font-bold mb-2 tracking-widest">Relatório Técnico</p>
              <code className="text-xs text-red-400 font-mono block break-words">
                {this.state.error?.toString()}
              </code>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                  onClick={() => window.location.reload()} 
                  className="px-6 py-4 bg-brand-primary rounded-xl hover:bg-brand-secondary font-bold transition-all shadow-lg flex items-center justify-center gap-2"
              >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  Tentar Novamente
              </button>
              <button 
                  onClick={() => { localStorage.clear(); window.location.reload(); }} 
                  className="px-6 py-4 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 font-bold transition-all text-gray-300"
              >
                  Limpar Cache & Reset
              </button>
            </div>
            <p className="mt-8 text-xs text-gray-600 italic">Se o erro persistir, contacte o administrador do sistema.</p>
          </div>
        </div>
      );
    }
    return <React.Fragment>{this.props.children}</React.Fragment>;
  }
}

const root = ReactDOM.createRoot(rootElement as HTMLElement);

root.render(
    <ErrorBoundary>
      <LanguageProvider>
        <LayoutProvider>
          <App />
        </LayoutProvider>
      </LanguageProvider>
    </ErrorBoundary>
);
