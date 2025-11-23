

import React, { useState, useMemo } from 'react';
import Modal from './common/Modal';
import { Ticket, TicketStatus, Collaborator, Team, TeamMember } from '../types';
import { FaChevronLeft, FaChevronRight, FaTicketAlt, FaUsers, FaUser } from 'react-icons/fa';

interface CalendarModalProps {
    onClose: () => void;
    tickets: Ticket[];
    currentUser: Collaborator;
    teams: Team[];
    teamMembers: TeamMember[];
    collaborators: Collaborator[];
    onViewTicket: (ticket: Ticket) => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ onClose, tickets, currentUser, teams, teamMembers, collaborators, onViewTicket }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    // 1. Identify User's Teams
    const myTeamIds = useMemo(() => {
        return new Set(teamMembers
            .filter(tm => tm.collaborator_id === currentUser.id)
            .map(tm => tm.team_id));
    }, [teamMembers, currentUser.id]);

    // 2. Filter Relevant Tickets
    const myTickets = useMemo(() => {
        return tickets.filter(t => {
            // Only open tickets
            if (t.status === TicketStatus.Finished) return false;

            // Assigned directly to me
            const isAssignedToMe = t.technicianId === currentUser.id;
            
            // Assigned to my team (and not assigned to someone else specifically, or just generally visible)
            const isAssignedToMyTeam = t.team_id && myTeamIds.has(t.team_id);

            return isAssignedToMe || isAssignedToMyTeam;
        });
    }, [tickets, currentUser.id, myTeamIds]);

    // 3. Calendar Logic
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 = Sunday

    const monthName = currentDate.toLocaleString('pt-PT', { month: 'long', year: 'numeric' });

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const getTicketsForDay = (day: number) => {
        return myTickets.filter(t => {
            const tDate = new Date(t.requestDate);
            return tDate.getDate() === day && 
                   tDate.getMonth() === currentDate.getMonth() && 
                   tDate.getFullYear() === currentDate.getFullYear();
        });
    };

    const renderCalendarCells = () => {
        const cells = [];
        // Padding for empty days before the 1st
        for (let i = 0; i < firstDayOfMonth; i++) {
            cells.push(<div key={`empty-${i}`} className="bg-gray-900/30 border border-gray-800 min-h-[100px]"></div>);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayTickets = getTicketsForDay(day);
            const isToday = new Date().getDate() === day && 
                            new Date().getMonth() === currentDate.getMonth() && 
                            new Date().getFullYear() === currentDate.getFullYear();

            cells.push(
                <div key={day} className={`border border-gray-700 p-2 min-h-[100px] relative ${isToday ? 'bg-brand-primary/10' : 'bg-surface-dark hover:bg-gray-800/50'}`}>
                    <span className={`text-sm font-bold ${isToday ? 'text-brand-secondary' : 'text-gray-400'}`}>{day}</span>
                    
                    <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                        {dayTickets.map(t => {
                            const isTeamTicket = t.team_id && myTeamIds.has(t.team_id) && t.technicianId !== currentUser.id;
                            return (
                                <button 
                                    key={t.id} 
                                    onClick={() => onViewTicket(t)}
                                    className={`w-full text-left text-[10px] px-1.5 py-1 rounded truncate border-l-2 transition-colors ${
                                        isTeamTicket 
                                        ? 'bg-purple-900/30 border-purple-500 text-purple-200 hover:bg-purple-900/50' 
                                        : 'bg-blue-900/30 border-blue-500 text-blue-200 hover:bg-blue-900/50'
                                    }`}
                                    title={t.title}
                                >
                                    <div className="flex items-center gap-1">
                                        {isTeamTicket ? <FaUsers className="flex-shrink-0"/> : <FaUser className="flex-shrink-0"/>}
                                        <span className="truncate">{t.title}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            );
        }
        return cells;
    };

    return (
        <Modal title="Calendário de Trabalho" onClose={onClose} maxWidth="max-w-6xl">
            <div className="flex flex-col h-[70vh]">
                {/* Header */}
                <div className="flex justify-between items-center mb-4 bg-gray-900 p-3 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-4">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-700 rounded-full text-white"><FaChevronLeft /></button>
                        <h2 className="text-xl font-bold text-white capitalize">{monthName}</h2>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-gray-700 rounded-full text-white"><FaChevronRight /></button>
                    </div>
                    <div className="flex gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-blue-500 rounded-sm"></span>
                            <span className="text-gray-300">Meus Tickets</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-purple-500 rounded-sm"></span>
                            <span className="text-gray-300">Tickets da Equipa</span>
                        </div>
                    </div>
                </div>

                {/* Days of Week */}
                <div className="grid grid-cols-7 gap-px mb-1 text-center">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                        <div key={d} className="text-xs font-bold text-gray-500 uppercase py-1">{d}</div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 flex-grow overflow-y-auto">
                    {renderCalendarCells()}
                </div>
            </div>
        </Modal>
    );
};

export default CalendarModal;