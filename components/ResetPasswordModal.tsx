import React, { useState } from 'react';
import Modal from './common/Modal';
import { supabase } from '../services/supabaseClient';
import { SpinnerIcon, FaEye, FaEyeSlash } from './common/Icons';
import { Session } from '@supabase/supabase-js';

interface ResetPasswordModalProps {
    onClose: () => void;
    session: Session;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ onClose, session }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const validate = () => {
        if (!password || !confirmPassword) {
            setError('Ambos os campos de password são obrigatórios.');
            return false;
        }
        if (password !== confirmPassword) {
            setError('As passwords não coincidem.');
            return false;
        }
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
        if (!passwordRegex.test(password)) {
            setError("A password deve ter no mínimo 6 caracteres, incluindo uma maiúscula, um número e um caracter especial (@$!%*?&).");
            return false;
        }
        setError('');
        return true;
    };

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        setIsLoading(true);

        const { error: updateError } = await supabase.auth.updateUser({ password: password });

        setIsLoading(false);
        if (updateError) {
            setError('Ocorreu um erro ao atualizar a sua password. O link pode ter expirado. Por favor, tente novamente.');
            console.error("Password update error:", updateError);
        } else {
            setMessage('A sua password foi atualizada com sucesso! Pode agora fazer login com a nova password.');
        }
    };

    return (
        <Modal title="Definir Nova Password" onClose={onClose}>
            <form onSubmit={handleResetSubmit} className="space-y-4">
                {!message ? (
                    <>
                        <p className="text-sm text-on-surface-dark-secondary">
                            Por favor, defina uma nova password para a sua conta.
                        </p>
                        <div>
                            <label htmlFor="new-password" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nova Password</label>
                            <div className="relative">
                                <input
                                    id="new-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="confirm-password" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Confirmar Nova Password</label>
                            <input
                                id="confirm-password"
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                                required
                            />
                        </div>
                        {error && <p className="text-red-400 text-xs italic mt-1">{error}</p>}
                        <div className="flex justify-end gap-4 pt-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                                Cancelar
                            </button>
                            <button type="submit" disabled={isLoading} className="px-4 py-2 w-48 bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50 flex justify-center">
                                {isLoading ? <SpinnerIcon /> : 'Redefinir Password'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-center text-green-400 p-4 bg-green-500/10 rounded-md">{message}</p>
                        <div className="flex justify-end pt-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">
                                Ir para o Login
                            </button>
                        </div>
                    </>
                )}
            </form>
        </Modal>
    );
};

export default ResetPasswordModal;
