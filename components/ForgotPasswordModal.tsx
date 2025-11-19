import React, { useState } from 'react';
import Modal from './common/Modal';
import { getSupabase } from '../services/supabaseClient';
import { SpinnerIcon } from './common/Icons';

interface ForgotPasswordModalProps {
    onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError('Por favor, insira o seu email.');
            return;
        }
        setError('');
        setIsLoading(true);

        try {
            const supabase = getSupabase();
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                 redirectTo: window.location.origin,
            });

            if (resetError) {
                throw resetError;
            }
            setMessage('Se existir uma conta com este email, receberá um link para redefinir a sua password.');

        } catch(e: any) {
            setError(e.message || 'Ocorreu um erro ao enviar o email. Por favor, tente novamente.');
            console.error("Password reset error:", e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal title="Recuperar Password" onClose={onClose}>
            <form onSubmit={handlePasswordReset} className="space-y-4">
                {!message ? (
                    <>
                        <p className="text-sm text-on-surface-dark-secondary">
                            Insira o seu endereço de email e enviaremos um link para redefinir a sua password.
                        </p>
                        <div>
                            <label htmlFor="reset-email" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Email</label>
                            <input
                                id="reset-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu.email@exemplo.com"
                                className={`w-full bg-gray-700 border text-white rounded-md p-2 ${error ? 'border-red-500' : 'border-gray-600'}`}
                                required
                            />
                            {error && <p className="text-red-400 text-xs italic mt-1">{error}</p>}
                        </div>
                        <div className="flex justify-end gap-4 pt-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                                Cancelar
                            </button>
                            <button type="submit" disabled={isLoading} className="px-4 py-2 w-40 bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50 flex justify-center">
                                {isLoading ? <SpinnerIcon /> : 'Enviar Link'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-center text-green-400 p-4 bg-green-500/10 rounded-md">{message}</p>
                        <div className="flex justify-end pt-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">
                                Fechar
                            </button>
                        </div>
                    </>
                )}
            </form>
        </Modal>
    );
};

export default ForgotPasswordModal;