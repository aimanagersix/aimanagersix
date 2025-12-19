
import { useState, useCallback, useEffect } from 'react';
import * as dataService from '../services/dataService';
import { Ticket, TicketCategoryItem, SecurityIncidentTypeItem, Team, TeamMember, CalendarEvent, TicketActivity, Message, ConfigItem } from '../types';

export const useSupport = (isConfigured: boolean) => {
    const [data, setData] = useState({
        tickets: [] as Ticket[],
        ticketCategories: [] as TicketCategoryItem[],
        securityIncidentTypes: [] as SecurityIncidentTypeItem[],
        teams: [] as Team[],
        teamMembers: [] as TeamMember[],
        calendarEvents: [] as CalendarEvent[],
        ticketActivities: [] as TicketActivity[],
        messages: [] as Message[],
        configTicketStatuses: [] as ConfigItem[]
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
        if (isConfigured) refresh();
    }, [isConfigured, refresh]);

    return { data, isLoading, refresh };
};
