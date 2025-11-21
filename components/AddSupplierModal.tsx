import React, { useState, useEffect, useRef } from 'react';
import Modal from './common/Modal';
import { Supplier, CriticalityLevel, Team, Ticket, TicketStatus } from '../types';
import { FaShieldAlt, FaGlobe, FaFileContract, FaDownload, FaCopy, FaTicketAlt, FaCertificate, FaCalendarAlt } from 'react-icons/fa';
import { SearchIcon, SpinnerIcon, DeleteIcon, PlusIcon } from './common/Icons';

interface AddSupplierModalProps {
    onClose: () => void;
    onSave: (supplier: Omit<Supplier, 'id'> | Supplier) => Promise<any>;
    supplierToEdit?: Supplier | null;
    teams?: Team[]; // To select team for ticket
    onCreateTicket?: (ticket: Partial<Ticket>) => void; // Function to create ticket
}

const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const NIF_API_KEY = '9393091ec69bd1564657157b9624809e';

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const AddSupplierModal: React.FC<AddSupplierModalProps> = ({ onClose, onSave, supplierToEdit, teams = [], onCreateTicket }) => {
    const [formData, setFormData] = useState<Partial<Supplier>>({
        name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        nif: '',
        website: '',
        address: '', // Legacy
        address_line: '',
        postal_code: '',
        city: '',
        locality: '',
        notes: '',
        is_iso27001_certified: false,
        iso_certificate_expiry: '',
        security_contact_email: '',
        risk_level: CriticalityLevel.Low,
        attachments: [],
        other_certifications: []
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isFetchingNif, setIsFetchingNif] = useState(false);
    const [isFetchingCP, setIsFetchingCP] = useState(false);
    const [attachments, setAttachments] = useState<{ name: string; dataUrl: string; size: number }[]>([]);
    const [showLetter, setShowLetter] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Ticket Automation State
    const [createTicket, setCreateTicket] = useState(false);
    const [ticketTeamId, setTicketTeamId] = useState('');
    const [reminderOffset, setReminderOffset] = useState('3'); // '1', '3', 'custom'
    const [customTicketDate, setCustomTicketDate] = useState('');

    // Extra Certificates State
    const [newCertName, setNewCertName] = useState('');
    const [newCertDate, setNewCertDate] = useState('');

    useEffect(() => {
        if (supplierToEdit) {
            setFormData({ 
                ...supplierToEdit, 
                iso_certificate_expiry: supplierToEdit.iso_certificate_expiry || '',
                address_line: supplierToEdit.address_line || supplierToEdit.address || '',
                postal_code: supplierToEdit.postal_code || '',
                city: supplierToEdit.city || '',
                locality: supplierToEdit.locality || '',
                other_certifications: supplierToEdit.other_certifications || []
            });
            if (supplierToEdit.attachments) {
                setAttachments(supplierToEdit.attachments.map(a => ({ ...a, size: 0 })));
            }
        }
    }, [supplierToEdit]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name?.trim()) newErrors.name = "O nome do fornecedor é obrigatório.";
        if (!formData.nif?.trim()) newErrors.nif = "O NIF é obrigatório.";
        if (formData.contact_email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
            newErrors.contact_email = "Email inválido.";
        }
        if (formData.is_iso27001_certified && !formData.iso_certificate_expiry) {
            newErrors.iso_certificate_expiry = "Se tem certificação, a data de validade é obrigatória.";
        }
        if (createTicket && !ticketTeamId) {
            newErrors.ticketTeamId = "Selecione uma equipa para o ticket.";
        }
        if (createTicket && reminderOffset === 'custom' && !customTicketDate) {
            newErrors.customTicketDate = "Selecione a data para o alerta.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
        }));
        
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handlePostalCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        val = val.replace(/[^0-9-]/g, ''); 
        if (val.length > 4 && val.indexOf('-') === -1) {
            val = val.slice(0, 4) + '-' + val.slice(4);
        }
        if (val.length > 8) val = val.slice(0, 8);

        setFormData(prev => ({ ...prev, postal_code: val }));

        if (/^\d{4}-\d{3}$/.test(val)) {
            setIsFetchingCP(true);
            try {
                const res = await fetch(`https://json.geoapi.pt/cp/${val}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.Concelho) {
                        let loc = '';
                        if (data.Freguesia) loc = data.Freguesia;
                        else if (data.part && data.part.length > 0) loc = data.part[0];

                        setFormData(prev => ({
                            ...prev,
                            city: data.Concelho,
                            locality: loc
                        }));
                    }
                }
            } catch (err) {
                console.warn("Erro ao obter dados do CP:", err);
            } finally {
                setIsFetchingCP(false);
            }
        }
    };

    const handleFetchNifData = async () => {
        if (!formData.nif?.trim()) {
            setErrors(prev => ({ ...prev, nif: "Insira um NIF para pesquisar." }));
            return;
        }

        const nif = formData.nif.trim().replace(/[^0-9]/g, '');
        
        if (nif.length !== 9) {
             setErrors(prev => ({ ...prev, nif: "O NIF deve ter 9 dígitos." }));
             return;
        }

        setIsFetchingNif(true);
        setErrors(prev => {
            const newErr = { ...prev };
            delete newErr.nif;
            return newErr;
        });

        try {
            const response = await fetch(`https