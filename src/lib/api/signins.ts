import { apiClient } from './client';

export interface SignIn {
    id: string;
    staffId: string;
    zoneId: string | null;
    signInTime: string;
    signOutTime: string | null;
    regularHours: number;
    overtimeHours: number;
    isTimelocked: boolean;
    timelockExpiry: string | null;
    staff?: {
        id: string;
        firstName: string;
        lastName: string;
    };
    zone?: {
        id: string;
        name: string;
    };
}

export interface CreateSignInDto {
    staffId: string;
    zoneId?: string;
}

export interface SignOutDto {
    signOutTime?: string;
}

export const signInsApi = {
    async getAll(): Promise<SignIn[]> {
        return apiClient.get<SignIn[]>('/sign-ins/recent?limit=200');
    },

    async getById(id: string): Promise<SignIn> {
        return apiClient.get<SignIn>(`/sign-ins/${id}`);
    },

    async signIn(data: CreateSignInDto): Promise<SignIn> {
        return apiClient.post<SignIn>('/sign-ins', data);
    },

    async signOut(id: string, data?: SignOutDto): Promise<SignIn> {
        return apiClient.post<SignIn>(`/sign-ins/${id}/sign-out`, data);
    },

    async getActive(): Promise<SignIn[]> {
        const today = await apiClient.get<SignIn[]>('/sign-ins/today');
        return today.filter(s => !s.signOutTime);
    },

    async getOvertime(): Promise<SignIn[]> {
        const recent = await apiClient.get<SignIn[]>('/sign-ins/recent?limit=200');
        return recent.filter(s => s.overtimeHours > 0);
    },
};
