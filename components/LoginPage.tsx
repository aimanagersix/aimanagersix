
import React, { useState } from 'react';
import { UserIcon, LockClosedIcon, FaFingerprint } from './common/Icons';
import { getSupabase } from '../services/supabaseClient';

interface LoginPageProps {
    onLogin: (email: string, password: string) => Promise<{ success: boolean, error?: string }>;
    onForgotPassword: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onForgotPassword }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mfaCode, setMfaCode] = useState('');
    const [step, setStep] = useState<'credentials' | 'mfa'>('credentials');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
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
        
        // We intercept the standard onLogin to check for MFA first manually
        const supabase = getSupabase();
        const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });

        if (loginError) {
            setIsLoading(false);
            setError(loginError.message);
            return;
        }

        if (data.user) {
            const factors = await supabase.auth.mfa.listFactors();
            if (error) {
                 setIsLoading(false);
                 setError("Erro ao verificar MFA.");
                 return;
            }

            const totpFactor = factors.data?.totp.find(f => f.status === 'verified');
            
            if (totpFactor) {
                setStep('mfa'); // Move to MFA step
                setIsLoading(false);
                // We don't call onLogin success yet, we wait for the code
            } else {
                // No MFA, proceed normally
                window.location.reload(); // Or handle success callback properly if needed
            }
        }
    };

    const handleMfaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const supabase = getSupabase();
            const factors = await supabase.auth.mfa.listFactors();
            const factorId = factors.data?.totp[0].id;

            const challenge = await supabase.auth.mfa.challenge({ factorId: factorId! });
            if (challenge.error) throw challenge.error;

            const verify = await supabase.auth.mfa.verify({
                factorId: factorId!,
                challengeId: challenge.data.id,
                code: mfaCode
            });

            if (verify.error) throw verify.error;

            // MFA Success
            window.location.reload();

        } catch (err: any) {
            setError(err.message || "Código inválido.");
            setIsLoading(false);
        }
    };
    
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        validateField(name, value);
    };

    return (
        <div className="min-h-screen bg-background-dark flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <h1 className="font-bold text-4xl text-white">
                        AI<span className="text-brand-secondary">Manager</span>
                    </h1>
                    <p className="text-on-surface-dark-secondary mt-2">Gestão Inteligente de Equipamentos</p>
                </div>
                <div className="bg-surface-dark shadow-2xl rounded-xl px-8 pt-6 pb-8 mb-4">
                    
                    {step === 'credentials' ? (
                        <form onSubmit={handleLoginSubmit} noValidate>
                            <h2 className="text-2xl font-bold text-center text-white mb-6">Login</h2>
                            <div className="mb-4">
                                <label className="block text-on-surface-dark-secondary text-sm font-bold mb-2" htmlFor="login-email">Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><UserIcon className="h-5 w-5 text-gray-400" /></div>
                                    <input 
                                        className={`bg-gray-700 border ${validationErrors.email ? 'border-red-500' : 'border-gray-600'} focus:ring-brand-secondary focus:border-brand-secondary shadow appearance-none rounded w-full py-3 pl-10 pr-3 text-on-surface-dark leading-tight focus:outline-none focus:shadow-outline`} 
                                        id="login-email" 
                                        type="email" 
                                        name="email"
                                        placeholder="seu.email@exemplo.com" 
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)} 
                                        onBlur={handleBlur}
                                        required 
                                        autoComplete="email" 
                                    />
                                </div>
                                {validationErrors.email && <p className="text-red-400 text-xs italic mt-2">{validationErrors.email}</p>}
                            </div>
                            <div className="mb-4">
                                <label className="block text-on-surface-dark-secondary text-sm font-bold mb-2" htmlFor="login-password">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><LockClosedIcon className="h-5 w-5 text-gray-400" /></div>
                                    <input 
                                        className={`bg-gray-700 border ${validationErrors.password ? 'border-red-500' : 'border-gray-600'} focus:ring-brand-secondary focus:border-brand-secondary shadow appearance-none rounded w-full py-3 pl-10 pr-3 text-on-surface-dark leading-tight focus:outline-none focus:shadow-outline`} 
                                        id="login-password" 
                                        type="password" 
                                        name="password"
                                        placeholder="******************" 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        onBlur={handleBlur}
                                        required 
                                        autoComplete="current-password" 
                                    />
                                </div>
                                 {validationErrors.password && <p className="text-red-400 text-xs italic mt-2">{validationErrors.password}</p>}
                            </div>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center">
                                    <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-brand-secondary focus:ring-brand-primary border-gray-600 rounded bg-gray-700"/>
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-on-surface-dark-secondary">
                                        Lembrar-me
                                    </label>
                                </div>
                                <div className="text-sm">
                                    <button 
                                        type="button"
                                        onClick={onForgotPassword}
                                        className="font-medium text-brand-secondary hover:text-blue-400 focus:outline-none"
                                    >
                                        Esqueceu-se da password?
                                    </button>
                                </div>
                            </div>
                            {error && <p className="bg-red-500/20 border border-red-500/30 text-red-400 text-xs italic p-3 rounded mb-4 text-center">{error}</p>}
                            <div className="flex items-center justify-between">
                                <button className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-300 disabled:opacity-50" type="submit" disabled={isLoading}>
                                    {isLoading ? 'A verificar...' : 'Entrar'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleMfaSubmit}>
                            <div className="text-center mb-6">
                                <div className="inline-flex p-4 rounded-full bg-brand-primary/20 mb-4">
                                    <FaFingerprint className="h-8 w-8 text-brand-secondary" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">Autenticação de 2 Fatores</h2>
                                <p className="text-on-surface-dark-secondary text-sm mt-2">
                                    Por favor, insira o código da sua aplicação de autenticação.
                                </p>
                            </div>
                             <div className="mb-6">
                                <input 
                                    className="bg-gray-700 border border-gray-600 focus:ring-brand-secondary focus:border-brand-secondary shadow appearance-none rounded w-full py-3 px-3 text-on-surface-dark text-center text-2xl tracking-widest leading-tight focus:outline-none" 
                                    type="text" 
                                    maxLength={6}
                                    placeholder="000000" 
                                    value={mfaCode} 
                                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g,''))} 
                                    autoFocus
                                />
                            </div>
                            {error && <p className="bg-red-500/20 border border-red-500/30 text-red-400 text-xs italic p-3 rounded mb-4 text-center">{error}</p>}
                             <button className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-lg focus:outline-none transition-colors duration-300 disabled:opacity-50" type="submit" disabled={isLoading || mfaCode.length !== 6}>
                                {isLoading ? 'A verificar...' : 'Confirmar Código'}
                            </button>
                        </form>
                    )}

                </div>
                <p className="text-center text-gray-500 text-xs">
                    &copy;{new Date().getFullYear()} AIManager. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
