
import { useState, useCallback, useEffect } from 'react';
import * as dataService from '../services/dataService';
import { Ticket, TicketCategoryItem, SecurityIncidentTypeItem, Team, TeamMember, CalendarEvent, TicketActivity, Message } from '../types';

export const useSupport = (isConfigured: boolean) => {
    const [data, setData] = useState({
        tickets: [] as Ticket[],
        ticketCategories: [] as TicketCategoryItem[],
        securityIncidentTypes: [] as SecurityIncidentTypeItem[],
        teams: [] as Team[],
        teamMembers: [] as TeamMember[],
        calendarEvents: [] as CalendarEvent[],
        // Fix: Added missing properties to hook state
        ticketActivities: [] as TicketActivity[],
        messages: [] as Message[]
    });
    const [isLoading, setIsLoading] = useState(false);

    const refresh = useCallback(async () => {
        if (!isConfigured) return;
        setIsLoading(true);
        try {
            const supportData = await dataService.fetchSupportData();
            setData(supportData);
        } catch (error) {
            console.error("Failed to fetch support data", error);
        } finally {
            setIsLoading(false);
        }
    }, [isConfigured]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { data, isLoading, refresh };
};
