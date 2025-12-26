
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { EquipmentType, Team } from '../types';

interface AddEquipmentTypeModalProps {
    onClose: () => void;
    onSave: (type: Omit<EquipmentType, 'id'> | EquipmentType) => Promise<any>;
    typeToEdit?: EquipmentType | null;
    existingTypes?: EquipmentType[];
    // Fix: Added teams prop to match usage in SettingsManager.tsx
    teams: Team[];
}

const AddEquipmentTypeModal: React.FC<AddEquipmentTypeModalProps> = ({ onClose, onSave, typeToEdit, existingTypes = [], teams = [] }) => {
    const [formData, setFormData] = useState({
        name: '',
        requires_nome_na_rede: false,
        requires_mac_wifi: false,
        requires_mac_cabo: false,
        requires_inventory_number: false,
        requires_backup_test: false,
        requires_location: false,
        is_maintenance: false,
        requires_wwan_address: false,
        requires_bluetooth_address: false,
        requires_usb_thunderbolt_address: false,
        requires_ram_size: false,
        requires_disk_info: false,
        requires_cpu_info: false,
        requires_manufacture_date: false,
        requires_ip: false,
        // Fix: Added default_team_id to state
        default_team_id: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (typeToEdit) {
            setFormData({
                name: typeToEdit.name || '',
                requires_nome_na_rede: !!typeToEdit.requires_nome_na_rede,
                requires_mac_wifi: !!typeToEdit.requires_mac_wifi,
                requires_mac_cabo: !!typeToEdit.requires_mac_cabo,
                requires_inventory_number: !!typeToEdit.requires_inventory_number,
                requires_backup_test: !!typeToEdit.requires_backup_test,
                requires_location: !!typeToEdit.requires_location,
                is_maintenance: !!typeToEdit.is_maintenance,
                requires_wwan_address: !!typeToEdit.requires_wwan_address,
                requires_bluetooth_address: !!typeToEdit.requires_bluetooth_address,
                requires_usb_thunderbolt_address: !!typeToEdit.requires_usb_thunderbolt_address,
                requires_ram_size: !!typeToEdit.requires_ram_size,
                requires_disk_info: !!typeToEdit.requires_disk_info,
                requires_cpu_info: !!typeToEdit.requires_cpu_info,
                requires_manufacture_date: !!typeToEdit.requires_manufacture_date,
                requires_ip: !!typeToEdit.requires_ip,
                // Fix: Initialize default_team_id from typeToEdit
                default_team_id: typeToEdit.default_team_id || ''
            });
        }
    }, [typeToEdit]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = formData.name.trim();
        
        if (name === '') {
            setError('O nome do tipo é obrigatório.');
            return;
        }

        const isDuplicate = existingTypes.some(t => 
            t.name.toLowerCase() === name.toLowerCase() && 
            (!typeToEdit || t.id !== typeToEdit.id)
        );

        if (isDuplicate) {
            setError('Já existe um tipo com este nome.');
            return;
        }
        
        // Fix: Ensure default_team_id is null if empty for database compatibility
        const dataToSave = {
            ...formData,
            name,
            default_team_id: formData.default_team_id || null
        };

        try {
            if (typeToEdit) {
                await onSave({ ...typeToEdit, ...dataToSave } as EquipmentType);
            } else {
                await onSave(dataToSave as any);
            }
            onClose();
        } catch (err: any) {
            alert("Erro ao gravar tipo: " + err.message);
        }
    };
    
    const modalTitle = typeToEdit ? "Editar Tipo de Equipamento" : "Adicionar Novo Tipo de Equipamento";

    return (
        <Modal title={modalTitle} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-bold text-gray-400 mb-1 uppercase tracking-widest text-[10px]">Nome do Tipo</label>
                        <input 
                            type="text" 
                            name="name" 
                            id="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            className={`w-full bg-gray-700 border text-white rounded p-2 text-sm focus:border-brand-primary outline-none ${error ? 'border-red-500' : 'border-gray-600'}`} 
                            placeholder="Ex: Portátil, Monitor, Servidor..."
                        />
                        {error && <p className="text-red-400 text-xs italic mt-1">{error}</p>}
                    </div>

                    {/* Fix: Added Equipa Padrão select field */}
                    <div>
                        <label htmlFor="default_team_id" className="block text-sm font-bold text-gray-400 mb-1 uppercase tracking-widest text-[10px]">Equipa Padrão (Suporte)</label>
                        <select 
                            name="default_team_id" 
                            id="default_team_id" 
                            value={formData.default_team_id} 
                            onChange={handleChange} 
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm focus:border-brand-primary outline-none"
                        >
                            <option value="">-- Nenhuma (Manual) --</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="border-t border-gray-700 pt-4">
                    <h3 className="text-[10px] font-black text-brand-secondary uppercase tracking-widest mb-4">Campos Requeridos no Inventário</h3>
                     <div className="space-y-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                        <label className="flex items-center cursor-pointer group">
                            <input type="checkbox" name="requires_nome_na_rede" checked={formData.requires_nome_na_rede} onChange={handleChange} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-brand-primary focus:ring-brand-secondary" />
                            <span className="ml-2 text-sm text-gray-300 group-hover:text-white transition-colors">Nome na Rede</span>
                        </label>
                        <label className="flex items-center cursor-pointer group">
                            <input type="checkbox" name="requires_ip" checked={formData.requires_ip} onChange={handleChange} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-brand-primary focus:ring-brand-secondary" />
                            <span className="ml-2 text-sm text-gray-300 group-hover:text-white transition-colors">Endereço IP</span>
                        </label>
                        <label className="flex items-center cursor-pointer group">
                            <input type="checkbox" name="requires_mac_wifi" checked={formData.requires_mac_wifi} onChange={handleChange} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-brand-primary focus:ring-brand-secondary" />
                            <span className="ml-2 text-sm text-gray-300 group-hover:text-white transition-colors">MAC WiFi</span>
                        </label>
                        <label className="flex items-center cursor-pointer group">
                            <input type="checkbox" name="requires_mac_cabo" checked={formData.requires_mac_cabo} onChange={handleChange} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-brand-primary focus:ring-brand-secondary" />
                            <span className="ml-2 text-sm text-gray-300 group-hover:text-white transition-colors">MAC Cabo (Ethernet)</span>
                        </label>
                        <label className="flex items-center cursor-pointer group">
                            <input type="checkbox" name="requires_inventory_number" checked={formData.requires_inventory_number} onChange={handleChange} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-brand-primary focus:ring-brand-secondary" />
                            <span className="ml-2 text-sm text-gray-300 group-hover:text-white transition-colors">Nº de Património / Etiqueta</span>
                        </label>
                        <label className="flex items-center cursor-pointer group">
                            <input type="checkbox" name="requires_location" checked={formData.requires_location} onChange={handleChange} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-brand-primary focus:ring-brand-secondary" />
                            <span className="ml-2 text-sm text-gray-300 group-hover:text-white transition-colors">Localização Física</span>
                        </label>
                        <label className="flex items-center cursor-pointer group">
                            <input type="checkbox" name="requires_ram_size" checked={formData.requires_ram_size} onChange={handleChange} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-brand-primary focus:ring-brand-secondary" />
                            <span className="ml-2 text-sm text-gray-300 group-hover:text-white transition-colors">Memória RAM</span>
                        </label>
                         <label className="flex items-center cursor-pointer group">
                            <input type="checkbox" name="requires_disk_info" checked={formData.requires_disk_info} onChange={handleChange} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-brand-primary focus:ring-brand-secondary" />
                            <span className="ml-2 text-sm text-gray-300 group-hover:text-white transition-colors">Armazenamento / Discos</span>
                        </label>
                        <label className="flex items-center cursor-pointer group">
                            <input type="checkbox" name="requires_cpu_info" checked={formData.requires_cpu_info} onChange={handleChange} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-brand-primary focus:ring-brand-secondary" />
                            <span className="ml-2 text-sm text-gray-300 group-hover:text-white transition-colors">Processador (CPU)</span>
                        </label>
                        <label className="flex items-center cursor-pointer group">
                            <input type="checkbox" name="requires_wwan_address" checked={formData.requires_wwan_address} onChange={handleChange} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-brand-primary focus:ring-brand-secondary" />
                            <span className="ml-2 text-sm text-gray-300 group-hover:text-white transition-colors">Endereço IMEI/WWAN</span>
                        </label>
                        <label className="flex items-center cursor-pointer group">
                            <input type="checkbox" name="requires_bluetooth_address" checked={formData.requires_bluetooth_address} onChange={handleChange} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-brand-primary focus:ring-brand-secondary" />
                            <span className="ml-2 text-sm text-gray-300 group-hover:text-white transition-colors">Endereço Bluetooth</span>
                        </label>
                        <label className="flex items-center cursor-pointer group">
                            <input type="checkbox" name="requires_usb_thunderbolt_address" checked={formData.requires_usb_thunderbolt_address} onChange={handleChange} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-brand-primary focus:ring-brand-secondary" />
                            <span className="ml-2 text-sm text-gray-300 group-hover:text-white transition-colors">Endereço USB/TB</span>
                        </label>
                        <label className="flex items-center cursor-pointer group">
                            <input type="checkbox" name="requires_manufacture_date" checked={formData.requires_manufacture_date} onChange={handleChange} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-brand-primary focus:ring-brand-secondary" />
                            <span className="ml-2 text-sm text-gray-300 group-hover:text-white transition-colors">Data de Fabrico</span>
                        </label>
                        <label className="flex items-center cursor-pointer group sm:col-span-2 bg-indigo-900/10 p-2 rounded border border-indigo-500/20">
                            <input type="checkbox" name="requires_backup_test" checked={formData.requires_backup_test} onChange={handleChange} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-brand-primary focus:ring-brand-secondary" />
                            <span className="ml-2 text-sm text-indigo-300 font-bold">Monitorizar Backups (NIS2)</span>
                        </label>
                        <label className="flex items-center cursor-pointer group sm:col-span-2 bg-orange-900/10 p-2 rounded border border-orange-500/20">
                            <input type="checkbox" name="is_maintenance" checked={formData.is_maintenance} onChange={handleChange} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-brand-primary focus:ring-brand-secondary" />
                            <span className="ml-2 text-sm text-orange-300 font-bold">É Componente de Manutenção / Consumível</span>
                        </label>
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded font-bold hover:bg-gray-500">Cancelar</button>
                    <button type="submit" className="px-8 py-2 bg-brand-primary text-white rounded font-black uppercase tracking-widest hover:bg-brand-secondary shadow-lg">Salvar Tipo</button>
                </div>
            </form>
        </Modal>
    );
};

export default AddEquipmentTypeModal;
