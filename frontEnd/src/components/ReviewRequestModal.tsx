import { useState, useEffect } from "react";
import Button from "./Button";

function ReviewRequestModal({ userId, onClose, onStatusUpdate }) {
    const [application, setApplication] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [licenseUrl, setLicenseUrl] = useState<string | null>(null);
    const [idUrl, setIdUrl] = useState<string | null>(null);
    const [licenseError, setLicenseError] = useState(false);
    const [idError, setIdError] = useState(false);

    useEffect(() => {
        const fetchProtectedImage = async (filename: string, setter: (url: string) => void, errorSetter: (failed: boolean) => void) => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/uploads/${filename}`, {
                    method: 'GET',
                    credentials: 'include',
                });
                
                if (res.ok) {
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    setter(url);
                } else {
                    errorSetter(true);
                }
            } catch (err) {
                console.error("Failed to load protected image", err);
                errorSetter(true);
            }
        };
        const fetchDetails = async () => {
            setIsLoading(true);
            try {
                 const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/dashboard/users/${userId}/check`, {
                    method : 'GET',
                    credentials: "include",
                });
                if (!res.ok)
                    throw new Error("Failed to fetch stats");
                const data = await res.json();
                setApplication(data.data)
                if (data.data) {
                    if (data.data.license) {
                        await fetchProtectedImage(data.data.license, setLicenseUrl, setLicenseError);
                    }
                    if (data.data.idVerificationImg) {
                        await fetchProtectedImage(data.data.idVerificationImg, setIdUrl, setIdError);
                    }
                }
                setTimeout(() => setIsLoading(false), 500); 
            } catch (err) {
                console.error("Error fetching application details", err);
                setError("Failed to load application details.");
                setIsLoading(false);
            }
        };
        if (userId)
            fetchDetails();
        return () => {
            if (licenseUrl) URL.revokeObjectURL(licenseUrl);
            if (idUrl) URL.revokeObjectURL(idUrl);
        };
    }, [userId]);

    if (!userId)
        return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-surface-background/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-surface-panel border border-border-default rounded-modal overflow-hidden shadow-2xl">
                {isLoading ? (
                    <div className="p-20 flex flex-col items-center gap-4">
                        <div className="h-8 w-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-text-secondary text-sm animate-pulse">Retrieving evidence from The Hive...</p>
                    </div>
                ) : error ? (
                    <div className="p-20 flex flex-col items-center gap-4">
                        <p className="text-status-error text-sm font-medium">{error}</p>
                        <button onClick={onClose} className="text-text-secondary text-xs hover:text-text-primary transition-colors">Close</button>
                    </div>
                ) : (
                    <div className="p-8">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-heading-section font-bold text-text-primary">Review Request</h2>
                                <p className="text-text-secondary text-sm mt-1">Verify credentials for User ID: {userId.slice(0, 8)}...</p>
                            </div>
                            <button onClick={onClose} className="p-2 text-text-tertiary hover:text-text-primary transition-colors">✕</button>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-caption-dense font-bold text-text-tertiary uppercase tracking-widest">ID Verification</label>
                                <div className="aspect-[4/3] bg-surface-elevated rounded-card border border-border-subtle overflow-hidden group">
                                    {licenseUrl ? (
                                        <img 
                                            src={licenseUrl} 
                                            alt="License"
                                            className="w-full h-48 object-cover rounded-interactive border border-border-default"
                                        />
                                    ) : licenseError ? (
                                        <div className="w-full h-48 bg-status-error/10 border border-status-error/30 rounded-panel flex items-center justify-center">
                                            <span className="text-status-error text-xs font-medium px-2 text-center">Failed to load image</span>
                                        </div>
                                    ) : (
                                        <div className="w-full h-48 bg-surface-elevated animate-pulse rounded-panel flex items-center justify-center">
                                            <span className="text-text-tertiary">Loading License...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-caption-dense font-bold text-text-tertiary uppercase tracking-widest">Work License</label>
                                <div className="aspect-[4/3] bg-surface-elevated rounded-card border border-border-subtle overflow-hidden group">
                                    {idUrl ? (
                                        <img 
                                            src={idUrl} 
                                            alt="id"
                                            className="w-full h-48 object-cover rounded-interactive border border-border-default"
                                        />
                                    ) : idError ? (
                                        <div className="w-full h-48 bg-status-error/10 border border-status-error/30 rounded-panel flex items-center justify-center">
                                            <span className="text-status-error text-xs font-medium px-2 text-center">Failed to load image</span>
                                        </div>
                                    ) : (
                                        <div className="w-full h-48 bg-surface-elevated animate-pulse rounded-panel flex items-center justify-center">
                                            <span className="text-text-tertiary">Loading id...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 space-y-6">
                            <div>
                                <label className="text-caption-dense font-bold text-text-tertiary uppercase tracking-widest">Applying for Profession</label>
                                <div className="ml-2 mt-2 inline-block px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 text-brand-success rounded-interactive font-bold text-sm">
                                    {application.profession}
                                </div>
                            </div>

                            <div>
                                <label className="text-caption-dense font-bold text-text-tertiary uppercase tracking-widest">Professional Summary</label>
                                <p className="mt-2 text-text-secondary bg-surface-elevated/50 p-4 rounded-card border border-border-subtle text-sm leading-relaxed italic break-words">
                                    {application.description}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-10">
                            <Button 
                                disabled={false}
                                label="REJECT APPLICATION" 
                                variant="primary" 
                                onClick={() => onStatusUpdate(userId, 'REJECTED')}
                            />
                            <Button 
                                disabled={false}
                                label="APPROVE AS PROVIDER" 
                                variant="primary" 
                                onClick={() => onStatusUpdate(userId, 'PROVIDER')}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ReviewRequestModal;