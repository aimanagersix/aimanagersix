
import React, { useState, useMemo, useEffect } from 'react';
import Modal from './common/Modal';
import { Equipment, SoftwareLicense, LicenseAssignment } from '../types';
import { PlusIcon, DeleteIcon, FaExclamationTriangle } from './common/Icons';

interface ManageAssignedLicensesModalProps {
    onClose: () => void;
    onSave: (equipmentId: string, assignedLicenseIds: string[]) => void;
    equipment: Equipment;
    allLicenses: SoftwareLicense[];
    allAssignments: LicenseAssignment[];
}

const ManageAssignedLicensesModal: React.FC<ManageAssignedLicensesModalProps> = ({ onClose, onSave, equipment, allLicenses, allAssignments }) => {
    const [assignedLicenseIds, setAssignedLicenseIds] = useState<Set<string>>(new Set());
    const [selectedLicenseToAdd, setSelectedLicenseToAdd] = useState('');
    const [warningMessage, setWarningMessage] = useState('');

    useEffect(() => {
        const initialIds = allAssignments
            .filter(a => a.equipmentId === equipment.id)
            .map(a => a.softwareLicenseId);
        setAssignedLicenseIds(new Set(initialIds));
    }, [allAssignments, equipment.id]);

    const usedSeatsMap = useMemo(() => {
        return allAssignments.reduce((acc, assignment) => {
            acc.set(assignment.softwareLicenseId, (acc.get(assignment.softwareLicenseId) || 0) + 1);
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
        return Array.from(assignedLicenseIds).map(id => allLicenses.find(l => l.id === id)).filter(Boolean) as SoftwareLicense[];
    }, [assignedLicenseIds, allLicenses]);

    const handleAddLicense = () => {
        if (!selectedLicenseToAdd) return;
        
        const licenseToAdd = allLicenses.find(l => l.id === selectedLicenseToAdd);
        
        // Simple heuristic for OS detection: check for "Windows" or "macOS" in product name
        // Ideally, SoftwareLicense should have a 'type' field (OS, Application, etc.)
        const isOS = licenseToAdd && (
            licenseToAdd.productName.toLowerCase().includes('windows') || 
            licenseToAdd.productName.toLowerCase().includes('macos') ||
            licenseToAdd.is_oem // OEM implies base software often
        );

        if (isOS) {
            const existingOS = assignedLicensesDetails.find(l => 
                l.productName.toLowerCase().includes('windows') || 
                l.productName.toLowerCase().includes('macos') ||
                l.is_oem
            );

            if (existingOS) {
                if (!confirm(`Este equipamento já tem uma licença de sistema associada: "${existingOS.productName}".\n\nDeseja adicionar outra? Normalmente deve desassociar a antiga primeiro.`)) {
                    return;
                }
            }
        }

        setAssignedLicenseIds(prev => new Set(prev).add(selectedLicenseToAdd));
        setSelectedLicenseToAdd(''); // Reset dropdown
    };

    const handleRemoveLicense = (licenseId: string) => {
        setAssignedLicenseIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(licenseId);
            return newSet;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(equipment.id, Array.from(assignedLicenseIds));
    };

    return (
        <Modal title={`Gerir Licenças para ${equipment.description}`} onClose={onClose} maxWidth="max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Licenças Atribuídas</h3>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                        {assignedLicensesDetails.length > 0 ? (
                            assignedLicensesDetails.map(license => (
                                <div key={license.id} className="flex items-center gap-2 p-2 bg-gray-900/50 rounded-md">
                                    <div className="flex-1">
                                        <p className="font-semibold text-on-surface-dark">{license.productName}</p>
                                        <p className="text-sm text-on-surface-dark-secondary font-mono tracking-wider">{license.licenseKey}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveLicense(license.id)}
                                        className="p-2 text-red-400 hover:text-red-300 rounded-full hover:bg-red-500/10"
                                        title="Remover Licença"
                                    >
                                        <DeleteIcon />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-center py-4 text-on-surface-dark-secondary">Nenhuma licença atribuída a este equipamento.</p>
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
                            >
                                <option value="">Selecione uma licença...</option>
                                {availableLicenses.map(l => (
                                    <option key={l.id} value={l.id}>{l.productName} ({l.licenseKey})</option>
                                ))}
                            </select>
                         </div>
                         <div>
                            <button
                                type="button"
                                onClick={handleAddLicense}
                                disabled={!selectedLicenseToAdd}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 disabled:opacity-50"
                            >
                                <PlusIcon className="h-5 w-5" />
                                Atribuir
                            </button>
                         </div>
                     </div>
                </div>
                
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">Salvar Alterações</button>
                </div>
            </form>
        </Modal>
    );
};

export default ManageAssignedLicensesModal;
