



import React, { useState, useMemo, useEffect } from 'react';
import Modal from './common/Modal';
import { Ticket, TicketStatus, Collaborator, Team, TeamMember, CalendarEvent } from '../types';
import { FaChevronLeft, FaChevronRight, FaTicketAlt, FaUsers, FaUser, FaPlus, FaCalendarCheck, FaLock, FaSpinner, FaFilter, FaTrash } from 'react-icons/fa';
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
    calendarEvents?: CalendarEvent[]; // New Prop
}

const CalendarModal: React.FC<CalendarModalProps> = ({ onClose, tickets, currentUser, teams, teamMembers, collaborators, onViewTicket, calendarEvents = [] }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showAddEventModal, setShowAddEventModal] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
    const [filterType, setFilterType] = useState<'all' | 'tickets' | 'tasks'>('all');
    
    // Local state for events to handle immediate updates without full app refresh
    const [localEvents, setLocalEvents] = useState<CalendarEvent[]>(calendarEvents);

    useEffect(() => {
        setLocalEvents(calendarEvents);
    }, [calendarEvents]);

    // 1. Identify User's Teams
    const myTeamIds = useMemo(() => {
        return new Set(teamMembers
            .filter(tm => tm.collaborator_id === currentUser.id)
            .map(tm => tm.team_id));
    }, [teamMembers, currentUser.id]);

    // 2. Filter Relevant Tickets & Events
    const mergedItems = useMemo(() => {
        const items: Array<{
            id: string, 
            title: string, 
            date: Date, 
            type: 'ticket' | 'event', 
            color: string, 
            data: any,
            isAllDay?: boolean
        }> = [];

        // Process Tickets
        if (filterType !== 'tasks') {
            tickets.forEach(t => {
                if (t.status === TicketStatus.Finished) return;
                
                const isAssignedToMe = t.technicianId === currentUser.id;
                const isAssignedToMyTeam = t.team_id && myTeamIds.has(t.team_id);
                
                if (isAssignedToMe || isAssignedToMyTeam) {
                    items.push({
                        id: t.id,
                        title: t.title,
                        date: new Date(t.requestDate),
                        type: 'ticket',
                        color: isAssignedToMe ? '#3B82F6' : '#8B5CF6', // Blue (Me) / Purple (Team)
                        data: t
                    });
                }
            });
        }

        // Process Calendar Events
        if (filterType !== 'tickets') {
            localEvents.forEach(e => {
                // Visibility Check
                const isOwner = e.created_by === currentUser.id;
                const isTeamEvent = e.team_id && myTeamIds.has(e.team_id);
                
                if (isOwner || isTeamEvent || (!e.is_private && !e.team_id)) {
                    items.push({
                        id: e.id,
                        title: e.title,
                        date: new Date(e.start_date),
                        type: 'event',
                        color: e.color || '#10B981',
                        isAllDay: e.is_all_day,
                        data: e
                    });
                }
            });
        }

        return items;
    }, [tickets, localEvents, currentUser.id, myTeamIds, filterType]);

    // 3. Calendar Navigation
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 = Sunday
    const monthName = currentDate.toLocaleString('pt-PT', { month: 'long', year: 'numeric' });

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const handleToday = () => setCurrentDate(new Date());

    const handleDayClick = (day: number) => {
        // Pre-fill date for new event
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        // Adjust to current time for better UX, or start of day
        const now = new Date();
        newDate.setHours(now.getHours(), 0, 0, 0);
        
        const tempEvent: Partial<CalendarEvent> = {
            start_date: newDate.toISOString(),
            is_all_day: false
        };
        setEventToEdit(tempEvent as any); // Hacky cast for partial
        setShowAddEventModal(true);
    };

    const handleDeleteEvent = async (id: string) => {
        if (confirm("Tem a certeza que deseja apagar este evento?")) {
            await dataService.deleteCalendarEvent(id);
            setLocalEvents(prev => prev.filter(e => e.id !== id));
        }
    };

    const renderCalendarCells = () => {
        const cells = [];
        // Padding
        for (let i = 0; i < firstDayOfMonth; i++) {
            cells.push(<div key={`empty-${i}`} className="bg-gray-900/30 border border-gray-800 min-h-[120px]"></div>);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayItems = mergedItems.filter(i => 
                i.date.getDate() === day && 
                i.date.getMonth() === currentDate.getMonth() && 
                i.date.getFullYear() === currentDate.getFullYear()
            );
            
            const isToday = new Date().getDate() === day && 
                            new Date().getMonth() === currentDate.getMonth() && 
                            new Date().getFullYear() === currentDate.getFullYear();

            cells.push(
                <div 
                    key={day} 
                    className={`border border-gray-700 p-1 min-h-[120px] relative group transition-colors ${isToday ? 'bg-brand-primary/5' : 'bg-surface-dark hover:bg-gray-800/30'}`}
                    onClick={() => handleDayClick(day)}
                >
                    <div className="flex justify-between items-start px-1">
                        <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-brand-primary text-white' : 'text-gray-400'}`}>{day}</span>
                        <button 
                            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-opacity" 
                            onClick={(e) => { e.stopPropagation(); handleDayClick(day); }}
                            title="Adicionar Tarefa"
                        >
                            <FaPlus className="h-3 w-3" />
                        </button>
                    </div>
                    
                    <div className="mt-1 space-y-1 overflow-y-auto max-h-[90px] custom-scrollbar px-1">
                        {dayItems.map(item => {
                            const isTicket = item.type === 'ticket';
                            return (
                                <div 
                                    key={`${item.type}-${item.id}`} 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        if (isTicket) onViewTicket(item.data);
                                        else { setEventToEdit(item.data); setShowAddEventModal(true); }
                                    }}
                                    className="w-full text-left text-[10px] px-1.5 py-1 rounded truncate border-l-2 cursor-pointer hover:brightness-110 shadow-sm flex justify-between items-center group/item"
                                    style={{ backgroundColor: `${item.color}20`, borderColor: item.color, color: '#e0e0e0' }}
                                    title={item.title}
                                >
                                    <div className="flex items-center gap-1 truncate">
                                        {isTicket ? <FaTicketAlt className="flex-shrink-0 opacity-70" style={{color: item.color}}/> : <FaCalendarCheck className="flex-shrink-0 opacity-70" style={{color: item.color}}/>}
                                        <span className="truncate">{item.title}</span>
                                    </div>
                                    
                                    {!isTicket && item.data.created_by === currentUser.id && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteEvent(item.id); }}
                                            className="opacity-0 group-hover/item:opacity-100 text-red-400 hover:text-red-300 ml-1"
                                        >
                                            <FaTrash className="h-2 w-2" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }
        return cells;
    };

    return (
        <>
        <Modal title="Calendário de Planeamento" onClose={onClose} maxWidth="max-w-7xl">
            <div className="flex flex-col h-[80vh]">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 bg-gray-900 p-4 rounded-lg border border-gray-700 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex bg-gray-800 rounded-lg p-1">
                            <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-700 rounded text-white"><FaChevronLeft /></button>
                            <button onClick={handleToday} className="px-4 text-sm font-medium text-gray-300 hover:text-white border-l border-r border-gray-700 mx-1">Hoje</button>
                            <button onClick={handleNextMonth} className="p-2 hover:bg-gray-700 rounded text-white"><FaChevronRight /></button>
                        </div>
                        <h2 className="text-2xl font-bold text-white capitalize">{monthName}</h2>
                    </div>

                    <div className="flex items-center gap-4">
                         {/* Filters */}
                         <div className="flex bg-gray-800 rounded-lg p-1">
                            <button onClick={() => setFilterType('all')} className={`px-3 py-1 text-xs rounded ${filterType === 'all' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}>Tudo</button>
                            <button onClick={() => setFilterType('tickets')} className={`px-3 py-1 text-xs rounded ${filterType === 'tickets' ? 'bg-blue-900/50 text-blue-200' : 'text-gray-400'}`}>Só Tickets</button>
                            <button onClick={() => setFilterType('tasks')} className={`px-3 py-1 text-xs rounded ${filterType === 'tasks' ? 'bg-green-900/50 text-green-200' : 'text-gray-400'}`}>Só Tarefas</button>
                         </div>

                        <button 
                            onClick={() => { setEventToEdit(null); setShowAddEventModal(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary transition-colors shadow-lg"
                        >
                            <FaPlus /> Nova Tarefa
                        </button>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex gap-6 text-xs mb-2 px-2 text-gray-400">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span> Meus Tickets</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 bg-purple-500 rounded-sm"></span> Tickets Equipa</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-sm"></span> Tarefas Pessoais</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 bg-orange-500 rounded-sm"></span> Tarefas Equipa</div>
                </div>

                {/* Days of Week */}
                <div className="grid grid-cols-7 gap-px mb-1 text-center bg-gray-800 rounded-t-lg p-2">
                    {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(d => (
                        <div key={d} className="text-sm font-bold text-gray-300 uppercase">{d}</div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 flex-grow overflow-y-auto bg-gray-800/30 rounded-b-lg p-1">
                    {renderCalendarCells()}
                </div>
            </div>
        </Modal>

        {showAddEventModal && (
            <AddCalendarEventModal 
                onClose={() => setShowAddEventModal(false)}
                onSave={async (event) => {
                    if (eventToEdit && eventToEdit.id) {
                        await dataService.updateCalendarEvent(eventToEdit.id, event);
                        setLocalEvents(prev => prev.map(e => e.id === eventToEdit.id ? { ...e, ...event } : e));
                    } else {
                        const newEvent = await dataService.addCalendarEvent(event);
                        setLocalEvents(prev => [...prev, newEvent]);
                    }
                    setShowAddEventModal(false);
                }}
                currentUser={currentUser}
                teams={teams}
                eventToEdit={eventToEdit}
            />
        )}
        </>
    );
};

export default CalendarModal;
