
import React, { useState, useMemo, useEffect } from 'react';
import Modal from './common/Modal';
import { Collaborator, ConfigItem, TrainingType, Instituicao, Entidade } from '../types';
import { FaGraduationCap, FaUsers, FaSearch, FaCheck } from 'react-icons/fa';

interface AddTrainingSessionModalProps {
    onClose: () => void;
    onSave: (data: { 
        collaboratorIds: string[], 
        training_type: string, 
        completion_date: string, 
        notes?: string, 
        score: number,
        duration_hours?: number
    }) => void;
    collaborators: Collaborator[];
    trainingTypes: ConfigItem[];
    instituicoes: Instituicao[];
    entidades: Entidade[];
}

const AddTrainingSessionModal: React.FC<AddTrainingSessionModalProps> = ({ onClose, onSave