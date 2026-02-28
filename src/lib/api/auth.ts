import { apiClient } from './client';

export interface LoginResponse {
    access_token: string;
    user: {
        id: string;
        email: string;
        name: string;
        role?: string;
    };
}

export interface User {
    id: string;
    email: string;
    name: string;
    role?: string;
}

export const authApi = {
    async loginWithEmail(email: string, password: string): Promise<LoginResponse> {
        const response = await apiClient.post<LoginResponse>('/auth/login', {
            email,
            password,
        });

        if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', response.access_token);
            localStorage.setItem('user', JSON.stringify(response.user));
        }

        return response;
    },

    async loginWithGoogle(email: string, name: string, googleToken: string): Promise<LoginResponse> {
        const response = await apiClient.post<LoginResponse>('/auth/google-login', {
            email,
            name,
            googleToken,
        });

        // Store token
        if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', response.access_token);
            localStorage.setItem('user', JSON.stringify(response.user));
        }

        return response;
    },

    async logout(): Promise<void> {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            localStorage.removeItem('device_authorized');
        }
    },

    getToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('auth_token');
    },

    getUser(): User | null {
        if (typeof window === 'undefined') return null;
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        try { return JSON.parse(userStr); } catch { localStorage.removeItem('user'); return null; }
    },

    isAuthenticated(): boolean {
        return !!this.getToken();
    },

    setDeviceAuthorized(authorized: boolean): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem('device_authorized', authorized.toString());
        }
    },

    isDeviceAuthorized(): boolean {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem('device_authorized') === 'true';
    },
};
