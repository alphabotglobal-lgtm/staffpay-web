import { apiClient } from './client';

export interface Staff {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
    role: 'admin' | 'manager' | 'staff';
    faceEmbedding: number[] | null;
    facePhoto: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateStaffDto {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    role?: 'admin' | 'manager' | 'staff';
    zoneId?: string; // Zone assignment
    faceEmbedding?: number[];
    facePhoto?: string;
}

export interface UpdateStaffDto {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    role?: 'admin' | 'manager' | 'staff';
    faceEmbedding?: number[];
    facePhoto?: string;
}

export const staffApi = {
    async getAll(): Promise<Staff[]> {
        return apiClient.get<Staff[]>('/staff');
    },

    async getById(id: string): Promise<Staff> {
        return apiClient.get<Staff>(`/staff/${id}`);
    },

    async create(data: CreateStaffDto): Promise<Staff> {
        return apiClient.post<Staff>('/staff', data);
    },

    async createWithFace(data: CreateStaffDto & { faceEmbedding?: string; facePhotoUrl?: string }): Promise<Staff> {
        return apiClient.post<Staff>('/staff/create-with-face', data);
    },

    async update(id: string, data: UpdateStaffDto): Promise<Staff> {
        return apiClient.put<Staff>(`/staff/${id}`, data);
    },

    async delete(id: string): Promise<void> {
        return apiClient.delete<void>(`/staff/${id}`);
    },

    async enroll(id: string, faceImage: File): Promise<Staff> {
        const formData = new FormData();
        formData.append('faceImage', faceImage);
        return apiClient.upload<Staff>(`/staff/${id}/enroll`, formData);
    },
};
