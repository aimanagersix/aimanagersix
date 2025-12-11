
// ... existing imports ...
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { FaCopy, FaCheck, FaDatabase, FaTrash, FaBroom, FaRobot, FaPlay, FaSpinner, FaBolt, FaSync, FaExclamationTriangle, FaSeedling, FaCommentDots, FaHdd, FaMagic, FaTools, FaUnlock, FaShieldAlt, FaShoppingCart, FaUserLock, FaSearch, FaRecycle, FaCrown, FaCode } from 'react-icons/fa';
import { generatePlaywrightTest, generateSqlHelper, isAiConfigured } from '../services/geminiService';
import * as dataService from '../services/dataService';

// ... (component definition) ...

    // ... (other scripts) ...

    const maintenanceScript = `
-- ==================================================================================
-- SCRIPT DE MANUTENÇÃO E LIMPEZA
-- Use isto para corrigir tipos de dados ou limpar registos órfãos.
-- ==================================================================================

-- 1. Corrigir definições de Tipos de Equipamento (Ex: Portáteis exigem CPU/RAM)
UPDATE equipment_types SET 
    requires_cpu_info = true, 
    requires_ram_size = true, 
    requires_disk_info = true 
WHERE LOWER(name) LIKE '%desktop%' OR LOWER(name) LIKE '%laptop%' OR LOWER(name) LIKE '%portátil%';

-- 2. Garantir que a tabela de Aquisições tem permissões (Fix comum)
ALTER TABLE IF EXISTS public.procurement_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Procurement_Access" ON public.procurement_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Adicionar Colunas de Fornecedor aos Tickets se faltarem
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id);
ALTER TABLE IF EXISTS public.tickets ADD COLUMN IF NOT EXISTS requester_supplier_id UUID REFERENCES public.suppliers(id);

-- 4. Adicionar Coluna 'Requer IP' aos Tipos de Equipamento
ALTER TABLE IF EXISTS public.equipment_types ADD COLUMN IF NOT EXISTS requires_ip BOOLEAN DEFAULT false;
`;

// ... (rest of the file) ...
