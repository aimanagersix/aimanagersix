
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { getSupabase } from '../services/supabaseClient';
import { FaQrcode, FaCheckCircle, FaExclamationTriangle } from './common/Icons';

interface MFASetupModalProps {
    onClose: () => void;
}

const MFASetupModal: React.FC<MFASetupModalProps> = ({ onClose }) => {
    const [step, setStep] = useState<'init' | 'verify' | 'success'>('init');
    const [qrCode, setQrCode] = useState<string>('');
    const [secret, setSecret] = useState<string>('');
    const [factorId, setFactorId] = useState<string>('');
    const [verifyCode, setVerifyCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const initializeMFA = async () => {
        setIsLoading(true);
        setError('');
        try {
            const supabase = getSupabase();
            const { data, error } = await (supabase.auth as any).mfa.enroll({
                factorType: 'totp'
            });

            if (error) throw error;

            setFactorId(data.id);
            setSecret(data.totp.secret);
            setQrCode(data.totp.qr_code);
            setStep('verify');
        } catch (err: any) {
            setError(err.message || 'Erro ao iniciar configuração MFA.');
        } finally {
            setIsLoading(false);
        }
    };

    const verifyMFA = async () => {
        setIsLoading(true);
        setError('');
        try {
            const supabase = getSupabase();
            const { data, error } = await (supabase.auth as any).mfa.challengeAndVerify({
                factorId,
                code: verifyCode
            });

            if (error) throw error;

            setStep('success');
        } catch (err: any) {
            setError(err.message || 'Código inválido. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal title="Autenticação de Dois Fatores (2FA)" onClose={onClose} maxWidth="max-w-lg">
            <div className="space-y-6">
                {step === 'init' && (
                    <div className="text-center">
                        <div className="bg-blue-900/30 p-4 rounded-lg mb-4 text-left">
                            <h3 className="text-lg font-bold text-blue-200 mb-2 flex items-center gap-2">
                                <FaExclamationTriangle /> Segurança Reforçada
                            </h3>
                            <p className="text-sm text-blue-100">
                                A autenticação de dois fatores adiciona uma camada extra de segurança à sua conta. 
                                Ao ativar, precisará do seu telemóvel para fazer login.
                            </p>
                        </div>
                        <button 
                            onClick={initializeMFA} 
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'A preparar...' : 'Configurar 2FA Agora'}
                        </button>
                    </div>
                )}

                {step === 'verify' && (
                    <div className="text-center space-y-4">
                        <p className="text-sm text-on-surface-dark-secondary">
                            1. Abra a sua app de autenticação (Google Authenticator, Authy, etc.)
                            <br />
                            2. Escaneie o código QR abaixo:
                        </p>
                        
                        <div className="flex justify-center bg-white p-4 rounded-lg w-fit mx-auto">
                            <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                        </div>
                        
                        <div className="text-xs text-gray-400 font-mono bg-gray-800 p-2 rounded select-all">
                            {secret}
                        </div>

                        <div className="pt-4 border-t border-gray-700">
                            <p className="text-sm text-on-surface-dark-secondary mb-2">
                                3. Insira o código de 6 dígitos gerado pela app:
                            </p>
                            <div className="flex gap-2 justify-center">
                                <input 
                                    type="text" 
                                    maxLength={6}
                                    value={verifyCode}
                                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g,''))}
                                    className="w-40 bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-center text-xl tracking-widest"
                                    placeholder="000000"
                                />
                                <button 
                                    onClick={verifyMFA}
                                    disabled={verifyCode.length !== 6 || isLoading}
                                    className="px-4 bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50"
                                >
                                    {isLoading ? '...' : 'Verificar'}
                                </button>
                            </div>
                            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div className="text-center py-6">
                        <FaCheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">2FA Ativado com Sucesso!</h3>
                        <p className="text-on-surface-dark-secondary mb-6">
                            A sua conta está agora mais segura. Da próxima vez que fizer login, será solicitado o código.
                        </p>
                        <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                            Fechar
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default MFASetupModal;
