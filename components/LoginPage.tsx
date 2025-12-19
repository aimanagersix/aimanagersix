
import React, { useState } from 'react';
import { FaUserCircle as UserIcon, FaLock as LockClosedIcon, FaFingerprint, FaExclamationTriangle, FaEnvelope } from 'react-icons/fa';
import { getSupabase } from '../services/supabaseClient';
import { useLanguage } from '../contexts/LanguageContext';
import ForgotPasswordModal from './ForgotPasswordModal';

interface LoginPageProps {
    onLogin: (email: string, password: string) => Promise<{ success: boolean, error?: string }>;
    onForgotPassword: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onForgotPassword }) => {
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mfaCode, setMfaCode] = useState('');
    const [step, setStep] = useState<'credentials' | 'mfa'>('credentials');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [validationErrors, setValidationErrors] = useState({ email: '', password: '' });

    const validateField = (name: string, value: string) => {
        let errorMessage = '';
        switch (name) {
            case 'email':
                if (!value) errorMessage = 'O email é obrigatório.';
                else if (!/\S+@\S+\.\S+/.test(value)) errorMessage = 'O formato do email é inválido.';
                break;
            case 'password':
                if (!value) errorMessage = 'A password é obrigatória.';
                break;
            default:
                break;
        }
        setValidationErrors(prev => ({ ...prev, [name]: errorMessage }));
        return errorMessage === '';
    };

    const validateForm = () => {
        const isEmailValid = validateField('email', email);
        const isPasswordValid = validateField('password', password);
        return isEmailValid && isPasswordValid;
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!validateForm()) return;

        setIsLoading(true);
        
        try {
            const supabase = getSupabase();
            const { data, error: loginError } = await (supabase.auth as any).signInWithPassword({ email, password });

            if (loginError) {
                throw loginError;
            }

            if (data.user) {
                const { data: factorsData, error: mfaError } = await (supabase.auth as any).mfa.listFactors();
                if (mfaError) throw mfaError;
                const totpFactor = factorsData?.totp.find((f: any) => f.status === 'verified');
                if (totpFactor) {
                    setStep('mfa');
                    setIsLoading(false);
                } else {
                    window.location.reload();
                }
            }
        } catch (err: any) {
            setIsLoading(false);
            console.error("Login error:", err);
            let msg = err.message;
            if (err.message === "Failed to fetch" || err.message.includes("NetworkError")) {
                msg = "Erro de Conexão: Verifique as suas configurações.";
            } else if (err.message.includes("Invalid login credentials")) {
                msg = "Email ou password incorretos.";
            }
            setError(msg);
        }
    };

    const handleMfaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const supabase = getSupabase();
            const factors = await (supabase.auth as any).mfa.listFactors();
            const factorId = factors.data?.totp[0].id;
            const challenge = await (supabase.auth as any).mfa.challenge({ factorId: factorId! });
            if (challenge.error) throw challenge.error;
            const verify = await (supabase.auth as any).mfa.verify({ factorId: factorId!, challengeId: challenge.data.id, code: mfaCode });
            if (verify.error) throw verify.error;
            window.location.reload();
        } catch (err: any) {
            setError(err.message || "Código inválido.");
            setIsLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-background-dark flex flex-col justify-center items-center p-4 relative">
            {showForgotModal && <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />}
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <h1 className="font-bold text-4xl text-white">AIManager</h1>
                </div>
                <div className="bg-surface-dark shadow-2xl rounded-xl px-8 pt-6 pb-8 mb-4 border border-gray-800">
                    {step === 'credentials' ? (
                        <form onSubmit={handleLoginSubmit} noValidate>
                            <h2 className="text-2xl font-bold text-center text-white mb-6">Aceder ao Painel</h2>
                            <div className="mb-4">
                                <label className="block text-on-surface-dark-secondary text-sm font-bold mb-2">Email Corporativo</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><UserIcon className="h-5 w-5 text-gray-400" /></div>
                                    <input className={`bg-gray-700 border ${validationErrors.email ? 'border-red-500' : 'border-gray-600'} rounded w-full py-3 pl-10 pr-3 text-on-surface-dark leading-tight focus:outline-none`} type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                                {validationErrors.email && <p className="text-red-400 text-xs mt-2">{validationErrors.email}</p>}
                            </div>
                            <div className="mb-4">
                                <label className="block text-on-surface-dark-secondary text-sm font-bold mb-2">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><LockClosedIcon className="h-5 w-5 text-gray-400" /></div>
                                    <input className={`bg-gray-700 border ${validationErrors.password ? 'border-red-500' : 'border-gray-600'} rounded w-full py-3 pl-10 pr-3 text-on-surface-dark leading-tight focus:outline-none`} type="password" placeholder="****************" value={password} onChange={(e) => setPassword(e.target.value)} />
                                </div>
                                 {validationErrors.password && <p className="text-red-400 text-xs mt-2">{validationErrors.password}</p>}
                            </div>
                            <div className="flex items-center justify-between mb-6">
                                <button type="button" onClick={() => setShowForgotModal(true)} className="text-xs text-brand-secondary hover:underline">Esqueceu a password?</button>
                            </div>
                            {error && <div className="bg-red-500/20 text-red-400 text-xs p-3 rounded mb-4 text-center">{error}</div>}
                            <button className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50" type="submit" disabled={isLoading}>
                                {isLoading ? 'A entrar...' : 'Login'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleMfaSubmit}>
                            <div className="text-center mb-6">
                                <FaFingerprint className="h-12 w-12 text-brand-secondary mx-auto mb-4" />
                                <h2 className="text-xl font-bold text-white">Autenticação 2FA</h2>
                                <p className="text-on-surface-dark-secondary text-sm mt-2">Insira o código da sua aplicação.</p>
                            </div>
                             <div className="mb-6">
                                <input className="bg-gray-700 border border-gray-600 rounded w-full py-3 px-3 text-on-surface-dark text-center text-2xl tracking-widest leading-tight focus:outline-none" type="text" maxLength={6} placeholder="000000" value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g,''))} autoFocus />
                            </div>
                            {error && <p className="bg-red-500/20 text-red-400 text-xs p-3 rounded mb-4 text-center">{error}</p>}
                             <button className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50" type="submit" disabled={isLoading || mfaCode.length !== 6}>
                                {isLoading ? 'A verificar...' : 'Confirmar Código'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
