

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Modal from './common/Modal';
import { Collaborator, Assignment, Equipment, Ticket, CollaboratorStatus, TicketStatus, SecurityTrainingRecord, TrainingType, TooltipConfig, defaultTooltipConfig, EquipmentStatus, Brand, EquipmentType, LicenseAssignment, SoftwareLicense } from '../types';
// FIX: Import FaUserSlash icon
import { FaLaptop, FaTicketAlt, FaHistory, FaComment, FaEnvelope, FaPhone, FaMobileAlt, FaUserTag, FaCheckCircle, FaTimesCircle, FaCalendarAlt, FaEdit, FaUserShield, FaGraduationCap, FaPlus, FaMagic, FaSpinner, FaKey, FaPrint, FaMousePointer, FaInfoCircle, FaSave, FaBoxOpen, FaSearch, FaUnlink, FaLink, FaExclamationTriangle, FaLock, FaUnlock, FaChevronDown, FaListAlt, FaIdCard, FaUserSlash } from './common/Icons';
import { analyzeCollaboratorRisk, isAiConfigured } from '../services/geminiService';
import * as dataService from '../services/dataService';
import { getSupabase } from '../services/supabaseClient';
import OffboardingModal from './OffboardingModal'; // New import

interface CollaboratorDetailModalProps {
    collaborator: Collaborator;
    assignments: Assignment[];
    equipment: Equipment[];
    tickets: Ticket[];
    brandMap: Map<string, string>;
    equipmentTypeMap: Map<string, string>;
    