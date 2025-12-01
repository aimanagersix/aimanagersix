import React, { useState, useMemo, useEffect } from 'react';
import Modal from './common/Modal';
import { Equipment, SoftwareLicense, LicenseAssignment } from '../types';
// FIX: Replaced non-existent DeleteIcon with an alias for FaTrash
import { PlusIcon, FaTrash as DeleteIcon, FaExclamationTriangle, SpinnerIcon, CheckIcon } from './common/Icons';


interface ManageAssignedLicensesModalProps {
    onClose: () => void;
    onSave: (equipmentId: string, assignedLicenseIds: string[]) => Promise<void>;
    equipment: Equipment;
    allLicenses: SoftwareLicense[];
    allAssignments: LicenseAssignment[];
}

const ManageAssignedLicensesModal: React.FC<ManageAssignedLicensesModalProps> = ({ onClose, onSave, equipment, allLicenses, allAssignments }) => {
    const [assignedLicenseIds, setAssignedLicenseIds] = useState<Set<string>>(new Set());
    const [selectedLicenseToAdd, setSelectedLicenseToAdd] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        // Filter assignments that are ACTIVE (returnDate is null)
        // Use a Set immediately to deduplicate if multiple active records exist in DB for same license
        const initialIds = new Set(
            allAssignments
                .filter(a => a.equipmentId === equipment.id && !a.returnDate)
                .map(a => a.softwareLicenseId)
        );
        setAssignedLicenseIds(initialIds);
    }, [allAssignments, equipment.id]);

    const usedSeatsMap = useMemo(() => {
        return allAssignments.reduce((acc, assignment) => {
            // Only count active assignments for seat usage
            if (!assignment.returnDate) {
                acc.set(assignment.softwareLicenseId, (acc.get(assignment.softwareLicenseId) || 0) + 1);
            }
            return acc;
        }, new Map<string, number>());
    }, [allAssignments]);

    const availableLicenses = useMemo(() => {
        return allLicenses.filter(license => {
            const usedSeats = usedSeatsMap.get(license.id) || 0;
            const isAssignedToCurrent = assignedLicenseIds.has(license.id);
            // Available if it's not yet assigned to this PC AND has free seats
            return !isAssignedToCurrent && (license.is_oem || usedSeats < license.totalSeats);
        });
    }, [allLicenses, usedSeatsMap, assignedLicenseIds]);

    const assignedLicensesDetails = useMemo(() => {
        // Ensure we only map unique IDs from the Set to avoid UI duplicates
        return Array.from(assignedLicenseIds).map(id => allLicenses.find(l => l.id === id)).filter(Boolean) as SoftwareLicense[];
    }, [assignedLicenseIds, allLicenses]);

    const isOS = (license: SoftwareLicense) => {
        // Check category first (if available), then fallback to name heuristic
        const name = license.productName.toLowerCase();
        return name.includes('windows') || name.includes('macos') || name.includes('linux') || name.includes('ubuntu') || license.is_oem;
    };

    const handleAddLicense = () => {
        if (!selectedLicenseToAdd) return;
        
        const licenseToAdd = allLicenses.find(l => l.id === selectedLicenseToAdd);
        if (!licenseToAdd) return;

        // Check if trying to add an OS when one already exists
        if (isOS(licenseToAdd)) {
            const existingOS = assignedLicensesDetails.find(l => isOS(l));
            if (existingOS) {
                alert(`Não é possível adicionar "${licenseToAdd.productName}".\n\nEste equipamento já possui uma licença de Sistema Operativo ativa: "${existingOS.productName}".\n\nPara alterar o SO, remova a licença atual primeiro.`);
                return;
            }
        }

        setAssignedLicenseIds(prev => new Set(prev).add(selectedLicenseToAdd));
        setSelectedLicenseToAdd('');
    };

    const handleRemoveLicense = (licenseId: string) => {
        setAssignedLicenseIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(licenseId);
            return newSet;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Send unique array of IDs
            await onSave(equipment.id, Array.from(assignedLicenseIds));
            setSuccessMessage('Guardado com sucesso!');
            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        } catch (error) {
            console.error("Error saving licenses", error);
            alert("Ocorreu um erro ao guardar as licenças.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal title={`Gerir Licenças para ${equipment.description}`} onClose={onClose} maxWidth="max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Licenças Atribuídas (Ativas)</h3>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                        {assignedLicensesDetails.length > 0 ? (
                            assignedLicensesDetails.map(license => (
                                <div key={license.id} className="flex items-center gap-2 p-2 bg-gray-900/50 rounded-md">
                                    <div className="flex-1">
                                        <p className="font-semibold text-on-surface-dark">
                                            {license.productName}
                                            {isOS(license) && <span className="ml-2 text-[10px] bg-blue-900 text-blue-200 px-1 rounded border border-blue-500">SO</span>}
                                        </p>
                                        <p className="text-sm text-on-surface-dark-secondary font-mono tracking-wider">{license.licenseKey}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveLicense(license.id)}
                                        className="p-2 text-red-400 hover:text-red-300 rounded-full hover:bg-red-500/10"
                                        title="Remover Licença (Move para Histórico)"
                                        disabled={isSaving}
                                    >
                                        <DeleteIcon />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-center py-4 text-on-surface-dark-secondary">Nenhuma licença ativa atribuída a este equipamento.</p>
                        )}
                    </div>
                </div>

                <div className="border-t border-gray-700 pt-4">
                     <h3 className="text-lg font-semibold text-white mb-2">Atribuir Nova Licença</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                         <div className="md:col-span-2">
                            <label htmlFor="licenseToAdd" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Licenças Disponíveis</label>
                            <select
                                id="licenseToAdd"
                                value={selectedLicenseToAdd}
                                onChange={(e) => setSelectedLicenseToAdd(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                                disabled={isSaving}
                            >
                                <option value="">Selecione uma licença...</option>
                                {availableLicenses.map(l => (
                                    <option key={l.id} value={l.id}>
                                        {l.productName} {l.is_oem ? '(OEM)' : `(${l.licenseKey})`}
                                    </option>
                                ))}
                            </select>
                         </div>
                         <div>
                            <button
                                type="button"
                                onClick={handleAddLicense}
                                disabled={!selectedLicenseToAdd || isSaving}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 disabled:opacity-50"
                            >
                                <PlusIcon className="h-5 w-5" />
                                Atribuir
                            </button>
                         </div>
                     </div>
                </div>
                
                {successMessage && (
                    <div className="p-3 bg-green-500/20 text-green-300 rounded border border-green-500/50 text-center font-medium animate-fade-in">
                        {successMessage}
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"
                        disabled={isSaving}
                    >
                        Fechar
                    </button>
                    <button 
                        type="submit" 
                        disabled={isSaving}
                        className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <SpinnerIcon className="h-4 w-4" /> : successMessage ? <CheckIcon className="h-4 w-4"/> : null}
                        {isSaving ? 'A Guardar...' : successMessage ? 'Guardado!' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ManageAssignedLicensesModal;