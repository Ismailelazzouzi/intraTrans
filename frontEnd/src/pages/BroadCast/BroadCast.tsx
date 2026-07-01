import { useState } from "react";
import type { BroadCast } from "../../_types/broadCast.types";
import { BroadCastType } from "../../_types/broadCast.types";
import Button from "../../components/Button";
import { useNavigate } from "react-router-dom";
import * as z from "zod";

const broadcastSchema = z.object({
    title: z.string().min(1, "Title is required").max(255, "Title must be at most 255 characters"),
    description: z.string().max(500, "Description must be at most 500 characters").optional(),
    location: z.string().max(255, "Location must be at most 255 characters").optional(),
    type: z.nativeEnum(BroadCastType),
    maxProviders: z.number().min(1).optional(),
});

const initialTouched = { title: false, description: false, location: false };

function BroadCastPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<BroadCast>({
        title: "",
        description: "",
        location: "",
        type: BroadCastType.NORMAL,
        maxProviders: 1
    });
    const [touched, setTouched] = useState(initialTouched);
    const validation = broadcastSchema.safeParse(formData);
    const fieldErrors = !validation.success ? validation.error.format() : null;
    const navigate = useNavigate();

    const handleChange = (field: string, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setTouched((prev) => ({ ...prev, [field]: true }));
    };

    const handleSubmit = async () => {
        setTouched({ title: true, description: true, location: true });
        if (!validation.success) return;


        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/broadcasts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'include',
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}))
                setError(err.message || `Request failed (${response.status})`)
                return
            }
            navigate('/dashboard')
        } catch (error) {
            console.error("Transmission failed:", error);
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="mb-10">
                <h1 className="text-4xl font-black text-text-primary tracking-tighter">
                    TRANSMIT <span className="text-brand-success">SIGNAL</span>
                </h1>
                <p className="text-text-secondary mt-2 font-medium">Broadcast your issue to available providers in the area.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface-elevated/40 border border-border-default rounded-modal p-8 backdrop-blur-sm shadow-xl">
                        <div className="space-y-5">
                            <div>
                                <label className="text-caption-dense font-black text-text-tertiary uppercase tracking-[0.2em] mb-2 block">Issue Title (Required)</label>
                                <input 
                                    type="text"
                                    maxLength={255}
                                    value={formData.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    placeholder="e.g., Short circuit in living room"
                                    className="w-full bg-surface-panel/50 border border-border-subtle rounded-panel px-4 py-3 text-text-primary focus:border-brand-primary/50 outline-none transition-all"
                                />
                                {touched.title && fieldErrors?.title?._errors && (
                                    <span className="text-status-error text-xs mt-1 block">{fieldErrors.title._errors[0]}</span>
                                )}
                            </div>

                            <div>
                                <label className="text-caption-dense font-black text-text-tertiary uppercase tracking-[0.2em] mb-2 block">Detailed Description</label>
                                <textarea 
                                    maxLength={500}
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    placeholder="Provide more context for the providers..."
                                    className="w-full bg-surface-panel/50 border border-border-subtle rounded-panel px-4 py-3 text-text-primary h-32 resize-none focus:border-brand-primary/50 outline-none transition-all"
                                />
                                {touched.description && fieldErrors?.description?._errors && (
                                    <span className="text-status-error text-xs mt-1 block">{fieldErrors.description._errors[0]}</span>
                                )}
                            </div>

                            <div>
                                <label className="text-caption-dense font-black text-text-tertiary uppercase tracking-[0.2em] mb-2 block">Location</label>
                                <input 
                                    type="text"
                                    maxLength={255}
                                    value={formData.location}
                                    onChange={(e) => handleChange('location', e.target.value)}
                                    placeholder="City, Neighborhood..."
                                    className="w-full bg-surface-panel/50 border border-border-subtle rounded-panel px-4 py-3 text-text-primary focus:border-brand-primary/50 outline-none transition-all"
                                />
                                {touched.location && fieldErrors?.location?._errors && (
                                    <span className="text-status-error text-xs mt-1 block">{fieldErrors.location._errors[0]}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="bg-surface-elevated/40 border border-border-default rounded-modal p-6 backdrop-blur-sm shadow-xl">
                        <h3 className="text-text-primary font-bold text-sm mb-4">Signal Settings</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-caption-dense font-black text-text-tertiary uppercase tracking-[0.2em] mb-2 block">Broadcast Type</label>
                                <div className="flex bg-surface-panel/50 p-1 rounded-panel border border-border-subtle">
                                    <button 
                                        onClick={() => setFormData({...formData, type: BroadCastType.NORMAL})}
                                        className={`flex-1 py-2 text-xs font-bold rounded-interactive transition-all ${formData.type === BroadCastType.NORMAL ? 'bg-brand-primary text-surface-background shadow-lg shadow-brand-primary/20' : 'text-text-secondary hover:text-text-primary'}`}
                                    >
                                        NORMAL
                                    </button>
                                    <button 
                                        onClick={() => setFormData({...formData, type: BroadCastType.GROUP})}
                                        className={`flex-1 py-2 text-xs font-bold rounded-interactive transition-all ${formData.type === BroadCastType.GROUP ? 'bg-brand-primary text-surface-background shadow-lg shadow-brand-primary/20' : 'text-text-secondary hover:text-text-primary'}`}
                                    >
                                        GROUP
                                    </button>
                                </div>
                            </div>

                            {formData.type === BroadCastType.GROUP && (
                                <div>
                                    <label className="text-caption-dense font-black text-text-tertiary uppercase tracking-[0.2em] mb-2 block">Max Providers</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        value={formData.maxProviders}
                                        onChange={(e) => setFormData({...formData, maxProviders: parseInt(e.target.value)})}
                                        className="w-full bg-surface-panel/50 border border-border-subtle rounded-panel px-4 py-2 text-text-primary outline-none focus:border-brand-primary/50"
                                    />
                                </div>
                            )}

                                            {error && (
                                <div className="mb-4 px-4 py-3 rounded-panel bg-status-error/10 border border-status-error/30 text-status-error text-sm font-medium animate-fade-in">
                                    {error}
                                </div>
                            )}
                            <div className="pt-4">
                                <Button 
                                    label={loading ? "TRANSMITTING..." : "SEND SIGNAL"} 
                                    variant="primary"  
                                    disabled={!formData.title || loading}
                                    onClick={handleSubmit}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BroadCastPage;