// API Client Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface ApiError {
    message: string;
    statusCode: number;
}

class ApiClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = API_URL;
    }

    private getAuthHeader(): Record<string, string> {
        if (typeof window === 'undefined') return {};

        const token = localStorage.getItem('auth_token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    // W6-F3: Prevent multiple concurrent 401 redirects
    private isRedirecting = false;

    private handleUnauthorized(response: Response): void {
        if (response.status === 401 && typeof window !== 'undefined') {
            // W1-F8: Don't redirect if already on /login
            if (window.location.pathname === '/login') return;
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            if (!this.isRedirecting) {
                this.isRedirecting = true;
                window.location.href = '/login';
            }
        }
    }

    async get<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader(),
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            this.handleUnauthorized(response);
            let errorMessage = 'Request failed';
            try {
                const error: ApiError = await response.json();
                errorMessage = error.message || errorMessage;
            } catch { /* non-JSON error response */ }
            throw new Error(errorMessage);
        }

        return response.json();
    }

    async post<T>(endpoint: string, data?: any): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader(),
            },
            cache: 'no-store',
            body: data ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
            this.handleUnauthorized(response);
            let errorMessage = 'Request failed';
            try {
                const error: ApiError = await response.json();
                errorMessage = error.message || errorMessage;
            } catch { /* non-JSON error response */ }
            throw new Error(errorMessage);
        }

        return response.json();
    }

    async put<T>(endpoint: string, data: any): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader(),
            },
            cache: 'no-store',
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            this.handleUnauthorized(response);
            let errorMessage = 'Request failed';
            try {
                const error: ApiError = await response.json();
                errorMessage = error.message || errorMessage;
            } catch { /* non-JSON error response */ }
            throw new Error(errorMessage);
        }

        return response.json();
    }

    async delete<T>(endpoint: string): Promise<T | void> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader(),
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            this.handleUnauthorized(response);
            // W6-F4: Include HTTP status code in error message
            let errorMessage = `Request failed (${response.status})`;
            try {
                const error: ApiError = await response.json();
                errorMessage = error.message || errorMessage;
            } catch {
                // Response body is not JSON
            }
            throw new Error(errorMessage);
        }

        // Try to parse JSON, but handle empty responses
        try {
            const text = await response.text();
            if (text) {
                return JSON.parse(text);
            }
        } catch {
            // No JSON body, that's fine for DELETE
        }
    }

    async upload<T>(endpoint: string, formData: FormData): Promise<T> {
        const headers = this.getAuthHeader();

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers,
            body: formData,
            cache: 'no-store',
        });

        if (!response.ok) {
            this.handleUnauthorized(response);
            let errorMessage = 'Upload failed';
            try {
                const error: ApiError = await response.json();
                errorMessage = error.message || errorMessage;
            } catch { /* non-JSON error response */ }
            throw new Error(errorMessage);
        }

        return response.json();
    }
}

export const apiClient = new ApiClient();
