import { apiClient } from './client';

export interface Roster {
    id: string;
    zoneId: string;
    weekStart: string;
    weekEnd: string;
    status: 'draft' | 'published' | 'completed';
    createdAt: string;
    updatedAt: string;
    zone?: {
        id: string;
        name: string;
    };
}

export interface RosterAssignment {
    id: string;
    rosterId: string;
    staffId: string;
    dayOfWeek: number;
    shiftStart: string;
    shiftEnd: string;
    staff?: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

export interface CreateRosterDto {
    zoneId: string;
    weekStart: string;
    weekEnd: string;
}

export interface AssignStaffDto {
    staffId: string;
    dayOfWeek: number;
    shiftStart: string;
    shiftEnd: string;
}

export const rostersApi = {
    async getAll(): Promise<Roster[]> {
        return apiClient.get<Roster[]>('/rosters');
    },

    async getById(id: string): Promise<Roster & { assignments: RosterAssignment[] }> {
        return apiClient.get<Roster & { assignments: RosterAssignment[] }>(`/rosters/${id}`);
    },

    async create(data: CreateRosterDto): Promise<Roster> {
        return apiClient.post<Roster>('/rosters', data);
    },

    async assignStaff(rosterId: string, data: AssignStaffDto): Promise<RosterAssignment> {
        return apiClient.post<RosterAssignment>(`/rosters/${rosterId}/assign`, data);
    },

    async removeAssignment(assignmentId: string): Promise<void> {
        return apiClient.delete<void>(`/rosters/assignments/${assignmentId}`);
    },

    async publish(rosterId: string): Promise<Roster> {
        return apiClient.post<Roster>(`/rosters/${rosterId}/publish`, {});
    },

    async smartAllocate(rosterId: string): Promise<RosterAssignment[]> {
        return apiClient.post<RosterAssignment[]>(`/rosters/${rosterId}/smart-allocate`, {});
    },
};
