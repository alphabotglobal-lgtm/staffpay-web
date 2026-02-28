'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, User, Phone, Shield, MapPin } from 'lucide-react';
import { staffApi } from '../../../../lib/api/staff';
import { apiClient } from '../../../../lib/api/client';

interface Zone {
    id: string;
    name: string;
}

export default function CreateStaffPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [faceImage, setFaceImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [zones, setZones] = useState<Zone[]>([]);
    const [loadingZones, setLoadingZones] = useState(true);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        role: 'staff' as 'admin' | 'manager' | 'staff',
        zoneId: '',
    });

    useEffect(() => {
        loadZones();
    }, []);

    const loadZones = async () => {
        try {
            const data = await apiClient.get<Zone[]>('/zones');
            setZones(data);
        } catch (e) {
            console.error('Failed to load zones:', e);
        } finally {
            setLoadingZones(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFaceImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const newStaff = await staffApi.create(formData);
            if (faceImage && newStaff?.id) {
                // Enroll face separately after creation
                await staffApi.enroll(newStaff.id, faceImage);
            }

            router.push('/staff');
        } catch (err: any) {
            setError(err.message || 'Failed to create staff member');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-dark-700 rounded-lg transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">Create Staff Profile</h1>
                    <p className="text-gray-500">Add a new employee to the system</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Face Image Upload */}
                <div className="bg-dark-800 rounded-2xl p-6 border border-dark-600">
                    <h2 className="font-bold mb-4 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-primary" />
                        Face Photo (Optional)
                    </h2>

                    <div className="flex flex-col items-center gap-4">
                        {previewUrl ? (
                            <div className="relative">
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="w-40 h-40 rounded-full object-cover border-4 border-primary"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFaceImage(null);
                                        setPreviewUrl(null);
                                    }}
                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <div className="w-40 h-40 rounded-full bg-dark-700 border-2 border-dashed border-dark-600 flex items-center justify-center">
                                <User className="w-16 h-16 text-gray-600" />
                            </div>
                        )}

                        <label className="cursor-pointer bg-primary/20 text-primary px-6 py-2 rounded-xl hover:bg-primary/30 transition">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                            {previewUrl ? 'Change Photo' : 'Upload Photo'}
                        </label>
                        <p className="text-sm text-gray-500 text-center">
                            Upload a clear front-facing photo for face recognition
                        </p>
                    </div>
                </div>

                {/* Personal Information */}
                <div className="bg-dark-800 rounded-2xl p-6 border border-dark-600 space-y-4">
                    <h2 className="font-bold flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Personal Information
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">First Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                                placeholder="John"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Last Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                                placeholder="Doe"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                            placeholder="+1 234 567 8900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Role *
                        </label>
                        <select
                            required
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                            className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                        >
                            <option value="staff">Staff</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Assigned Zone
                        </label>
                        <select
                            value={formData.zoneId}
                            onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
                            className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                            disabled={loadingZones}
                        >
                            <option value="">-- No Zone Assigned --</option>
                            {zones.map((zone) => (
                                <option key={zone.id} value={zone.id}>
                                    {zone.name}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            Assign staff to a zone for roster creation
                        </p>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500">
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 px-6 py-3 bg-dark-700 hover:bg-dark-600 rounded-xl font-medium transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-primary text-black rounded-xl font-medium hover:bg-primary/90 transition disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Staff Member'}
                    </button>
                </div>
            </form>
        </div>
    );
}
