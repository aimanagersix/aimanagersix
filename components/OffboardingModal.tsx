
import React, { useState, useMemo } from 'react';
import Modal from './common/Modal';
// FIX: Add ConfigItem to imports
import { Collaborator, Equipment, SoftwareLicense, Assignment, LicenseAssignment, Brand, EquipmentType, ConfigItem } from '../types';
import { FaUserSlash, FaLaptop, FaKey, FaCheck, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

interface OffboardingModalProps {
    onClose: () => void;
    // FIX: Update onConfirm signature to accept reasonId
    onConfirm: (collaboratorId: string, reasonId?: string) => Promise<void>;
    collaborator: Collaborator;
    assignments: Assignment[];
    licenseAssignments: LicenseAssignment[];
    equipment: Equipment[];
    softwareLicenses: SoftwareLicense[];
    brandMap: Map<string, string>;
    equipmentTypeMap: Map<string, string>;
    // FIX: Add deactivationReasons prop
    deactivationReasons?: ConfigItem[];
}

const OffboardingModal: React.FC<OffboardingModalProps> = ({ onClose, onConfirm, collaborator, assignments, licenseAssignments, equipment, softwareLicenses, brandMap, equipmentTypeMap, deactivationReasons = [] }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    // FIX: Add state to hold the selected deactivation reason ID.
    const [reasonId, setReasonId] = useState<string>('');

    const assets = useMemo(() => {
        const assignedEquipmentIds = new Set(
            assignments.filter(a => a.collaboratorId === collaborator.id && !a.returnDate).map(a => a.equipmentId)
        );
        
        const assignedLicenses = licenseAssignments
            .filter(la => assignedEquipmentIds.has(la.equipmentId) && !la.returnDate)
            .map(la => softwareLicenses.find(l => l.id === la.softwareLicenseId))
            .filter(Boolean) as SoftwareLicense[];
        
        return {
            equipment: equipment.filter(e => assignedEquipmentIds.has(e.id)),
            licenses: assignedLicenses
        };
    }, [collaborator, assignments, licenseAssignments, equipment, softwareLicenses]);

    const handleConfirm = async () => {
        setIsProcessing(true);
        try {
            // FIX: Pass the selected reasonId to the onConfirm handler.
            await onConfirm(collaborator.id, reasonId || undefined);
            onClose();
        } catch (e) {
            console.error(e);
            alert("Erro ao processar a saída.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Modal title={`Processo de Saída (Offboarding): ${collaborator.fullName}`} onClose={onClose} maxWidth="max-w-3xl">
            <div className="space-y-6">
                <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-sm text-red-200">
                    <div className="flex items-center gap-2 font-bold mb-2">
                        <FaExclamationTriangle /> Ação Irreversível
                    </div>
                    <p>
                        Ao confirmar, o estado do colaborador será alterado para <strong>"Inativo"</strong>, todos os equipamentos serão desassociados (movidos para Stock) e será criado um ticket para a equipa de TI revogar todos os acessos (Email, VPN, etc.).
                    </p>
                </div>
                
                <div>
                    <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FaLaptop className="text-blue-400"/> Checklist de Devolução de Equipamentos ({assets.equipment.length})</h3>
                    {assets.equipment.length > 0 ? (
                        <ul className="list-disc list-inside bg-gray-800/50 p-3 rounded border border-gray-700 text-sm text-gray-300">
                            {assets.equipment.map(eq => (
                                <li key={eq.id}>
                                    <strong>{eq.description}</strong> (S/N: {eq.serialNumber})
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-gray-500 italic">Nenhum equipamento a devolver.</p>}
                </div>

                 <div>
                    <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FaKey className="text-yellow-400"/> Licenças de Software a Revogar ({assets.licenses.length})</h3>
                    {assets.licenses.length > 0 ? (
                        <ul className="list-disc list-inside bg-gray-800/50 p-3 rounded border border-gray-700 text-sm text-gray-300">
                            {assets.licenses.map(lic => (
                                <li key={lic.id}>{lic.productName}</li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-gray-500 italic">Nenhuma licença a revogar.</p>}
                </div>

                {/* FIX: Add dropdown to select deactivation reason */}
                <div>
                    <label htmlFor="deactivationReason" className="font-bold text-white mb-2 block">Motivo da Saída (Opcional)</label>
                    <select
                        id="deactivationReason"
                        value={reasonId}
                        onChange={(e) => setReasonId(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white"
                    >
                        <option value="">-- Selecionar motivo --</option>
                        {deactivationReasons.map(reason => (
                            <option key={reason.id} value={reason.id}>{reason.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500" disabled={isProcessing}>Cancelar</button>
                    <button 
                        type="button" 
                        onClick={handleConfirm}
                        disabled={isProcessing}
                        className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-500 flex items-center gap-2 disabled:opacity-50"
                    >
                        {isProcessing ? <FaSpinner className="animate-spin" /> : <FaUserSlash />}
                        {isProcessing ? 'A processar...' : 'Confirmar Saída e Criar Ticket'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default OffboardingModal;
