import { apiClient } from './client';

export interface Zone {
    id: string;
    name: string;
    gpsCoordinates: string | null;
    color: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateZoneDto {
    name: string;
    gpsCoordinates?: string;
    color?: string;
    isActive?: boolean;
}

export interface UpdateZoneDto {
    name?: string;
    gpsCoordinates?: string;
    color?: string;
    isActive?: boolean;
}

export const zonesApi = {
    async getAll(): Promise<Zone[]> {
        return apiClient.get<Zone[]>('/zones');
    },

    async getById(id: string): Promise<Zone> {
        return apiClient.get<Zone>(`/zones/${id}`);
    },

    async create(data: CreateZoneDto): Promise<Zone> {
        return apiClient.post<Zone>('/zones', data);
    },

    async update(id: string, data: UpdateZoneDto): Promise<Zone> {
        return apiClient.put<Zone>(`/zones/${id}`, data);
    },

    async delete(id: string): Promise<void> {
        return apiClient.delete<void>(`/zones/${id}`);
    },

    async getStaff(id: string): Promise<any[]> {
        return apiClient.get<any[]>(`/zones/${id}/staff`);
    },
};
