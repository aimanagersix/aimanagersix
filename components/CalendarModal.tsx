
import React, { useState, useMemo, useEffect } from 'react';
import Modal from './common/Modal';
import { Ticket, TicketStatus, Collaborator, Team, TeamMember, CalendarEvent, Holiday } from '../types';
import { FaChevronLeft, FaChevronRight, FaTicketAlt, FaPlus, FaCalendarCheck, FaTrash, FaSync, FaUmbrellaBeach, FaGlassCheers } from 'react-icons/fa';
import AddCalendarEventModal from './AddCalendarEventModal';
import * as dataService from '../services/dataService';

interface CalendarModalProps {
    onClose: () => void;
    tickets: Ticket[];
    currentUser: Collaborator;
    teams: Team[];
    teamMembers: TeamMember[];
    collaborators: Collaborator[];
    onViewTicket: (ticket: Ticket) => void;
    calendarEvents?: CalendarEvent[];
    holidays?: Holiday[]; 
}

export const CalendarModal: React.FC<CalendarModalProps> = ({ onClose, tickets, currentUser, teams, teamMembers, collaborators, onViewTicket, calendarEvents = [], holidays = [] }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showAddEventModal, setShowAddEventModal] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
    const [filterType, setFilterType] = useState<'all' | 'tickets' | 'tasks' | 'holidays'>('all');
    
    const [localEvents, setLocalEvents] = useState<CalendarEvent[]>(calendarEvents);

    useEffect(() => { setLocalEvents(calendarEvents); }, [calendarEvents]);

    const myTeamIds = useMemo(() => {
        return new Set(teamMembers.filter(tm => tm.collaborator_id === currentUser.id).map(tm => tm.team_id));
    }, [teamMembers, currentUser.id]);

    const mergedItems = useMemo(() => {
        const items: any[] = [];

        // Injetar Tickets
        if (filterType === 'all' || filterType === 'tickets') {
            tickets.forEach(t => {
                if (t.status === TicketStatus.Finished) return;
                const isAssignedToMe = t.technician_id === currentUser.id;
                const isAssignedToMyTeam = t.team_id && myTeamIds.has(t.team_id);
                if (isAssignedToMe || isAssignedToMyTeam) {
                    items.push({ id: t.id, title: t.title, date: new Date(t.request_date), type: 'ticket', color: isAssignedToMe ? '#3B82F6' : '#8B5CF6', data: t });
                }
            });
        }

        // Injetar Eventos Manuais
        if (filterType === 'all' || filterType === 'tasks') {
            localEvents.forEach(e => {
                const isOwner = e.created_by === currentUser.id;
                const isTeamEvent = e.team_id && myTeamIds.has(e.team_id);
                if (isOwner || isTeamEvent || (!e.is_private && !e.team_id)) {
                    items.push({ id: e.id, title: e.title, date: new Date(e.start_date), type: 'event', color: e.color || '#10B981', isAllDay: e.is_all_day, data: e });
                }
            });
        }

        // Injetar Feriados e Ausências (Intervalos Suportados)
        if (filterType === 'all' || filterType === 'holidays') {
            holidays.forEach(h => {
                const start = new Date(h.start_date);
                const end = h.end_date ? new Date(h.end_date) : start;
                
                // Para calendários mensais, precisamos de um item para cada dia do intervalo
                const curr = new Date(start);
                while (curr <= end) {
                    items.push({ 
                        id: `${h.id}-${curr.getTime()}`, 
                        title: h.name, 
                        date: new Date(curr), 
                        type: h.type === 'Vacation' ? 'vacation' : 'holiday', 
                        color: h.type === 'Holiday' ? '#F43F5E' : '#EC4899', 
                        isAllDay: true, 
                        data: h 
                    });
                    curr.setDate(curr.getDate() + 1);
                }
            });
        }

        return items;
    }, [tickets, localEvents, holidays, currentUser.id, myTeamIds, filterType]);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const renderCalendarCells = () => {
        const cells = [];
        for (let i = 0; i < firstDayOfMonth; i++) cells.push(<div key={`empty-${i}`} className="bg-gray-900/30 border border-gray-800 min-h-[100px]"></div>);
        for (let day = 1; day <= daysInMonth; day++) {
            const dayItems = mergedItems.filter(i => {
                const d = new Date(i.date);
                return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
            });
            const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
            
            cells.push(
                <div key={day} className={`border border-gray-700 p-1 min-h-[100px] relative hover:bg-gray-800/30 cursor-pointer ${isToday ? 'bg-brand-primary/10' : 'bg-surface-dark'}`}>
                    <span className={`text-xs font-bold ${isToday ? 'text-brand-secondary' : 'text-gray-400'}`}>{day}</span>
                    <div className="mt-1 space-y-1 overflow-y-auto max-h-[85px] custom-scrollbar">
                        {dayItems.map(item => (
                            <div key={`${item.type}-${item.id}`} onClick={(e) => { 
                                e.stopPropagation(); 
                                if (item.type === 'ticket') onViewTicket(item.data); 
                                else if (item.type === 'event') { setEventToEdit(item.data); setShowAddEventModal(true); }
                            }} className="text-[9px] px-1 py-0.5 rounded truncate border-l-2 flex items-center gap-1 shadow-sm" style={{ backgroundColor: `${item.color}20`, borderColor: item.color, color: '#fff' }}>
                                {item.type === 'vacation' && <FaUmbrellaBeach className="text-[8px]"/>}
                                {item.type === 'holiday' && <FaGlassCheers className="text-[8px]"/>}
                                {item.title}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return cells;
    };

    return (
        <>
        <Modal title="Agenda e Planeamento Enterprise" onClose={onClose} maxWidth="max-w-6xl">
            <div className="flex flex-col h-[75vh]">
                <div className="flex justify-between items-center mb-4 bg-gray-900 p-3 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-4">
                        <button onClick={handlePrevMonth} className="text-white hover:text-brand-secondary"><FaChevronLeft /></button>
                        <h2 className="text-xl font-bold text-white capitalize">{currentDate.toLocaleString('pt-PT', { month: 'long', year: 'numeric' })}</h2>
                        <button onClick={handleNextMonth} className="text-white hover:text-brand-secondary"><FaChevronRight /></button>
                    </div>
                    
                    <div className="flex gap-2">
                        <select 
                            value={filterType} 
                            onChange={e => setFilterType(e.target.value as any)}
                            className="bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-xs outline-none"
                        >
                            <option value="all">Todos os Itens</option>
                            <option value="tickets">Tickets Técnicos</option>
                            <option value="tasks">Tarefas / Eventos</option>
                            <option value="holidays">Feriados / Ausências</option>
                        </select>
                        <button onClick={() => { setEventToEdit(null); setShowAddEventModal(true); }} className="bg-brand-primary text-white px-4 py-2 rounded text-sm flex items-center gap-2 hover:bg-brand-secondary transition-all shadow-lg font-bold uppercase tracking-wider"><FaPlus /> Agendar</button>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-px mb-1 text-center bg-gray-800 p-1 rounded-t-lg shadow-inner"><div className="text-xs font-black text-gray-500">DOM</div><div className="text-xs font-black text-gray-500">SEG</div><div className="text-xs font-black text-gray-500">TER</div><div className="text-xs font-black text-gray-500">QUA</div><div className="text-xs font-black text-gray-500">QUI</div><div className="text-xs font-black text-gray-500">SEX</div><div className="text-xs font-black text-gray-500">SÁB</div></div>
                <div className="grid grid-cols-7 gap-px flex-grow bg-gray-800 rounded-b-lg overflow-hidden border border-gray-800 shadow-2xl">{renderCalendarCells()}</div>
            </div>
        </Modal>
        {showAddEventModal && <AddCalendarEventModal onClose={() => setShowAddEventModal(false)} onSave={async (event) => { if (eventToEdit?.id) await dataService.updateCalendarEvent(eventToEdit.id, event); else await dataService.addCalendarEvent(event); window.location.reload(); }} currentUser={currentUser} teams={teams} eventToEdit={eventToEdit} />}
        </>
    );
};

export default CalendarModal;
