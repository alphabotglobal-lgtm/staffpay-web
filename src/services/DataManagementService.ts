export const DataManagementService = {
    getExportUrl(type: 'staff' | 'leave' | 'payroll' | 'logins' | 'shifts', filters: { zoneId?: string; payGroupId?: string }) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const params = new URLSearchParams();
        if (filters.zoneId) params.append('zoneId', filters.zoneId);
        if (filters.payGroupId) params.append('payGroupId', filters.payGroupId);

        return `${baseUrl}/data-management/export/${type}?${params.toString()}`;
    },

    getTemplateUrl() {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        return `${baseUrl}/data-management/template/staff`;
    },

    async importStaff(file: File) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${baseUrl}/data-management/import/staff`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to import staff');
        }

        return await response.json();
    }
};
