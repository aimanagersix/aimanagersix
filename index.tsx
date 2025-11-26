
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Simple Error Boundary to catch rendering errors
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Ocorreu um erro crítico.</h1>
          <p className="text-gray-400 mb-4">A aplicação não conseguiu carregar.</p>
          <div className="bg-black p-4 rounded border border-gray-700 overflow-auto max-w-full text-left mb-6">
            <code className="text-xs text-red-300 font-mono">
              {this.state.error?.toString()}
            </code>
          </div>
          <div className="flex gap-4">
            <button 
                onClick={() => window.location.reload()} 
                className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-500 font-bold transition-colors"
            >
                Recarregar Página
            </button>
            <button 
                onClick={() => { localStorage.clear(); window.location.reload(); }} 
                className="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 font-bold transition-colors"
            >
                Limpar Dados Locais
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);