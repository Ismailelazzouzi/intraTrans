import { useState } from "react"
import Button from "./Button"
import { INPUT_CLASSES, TEXTAREA_CLASSES } from "../_styles/tokens"

interface ResponseModalProps {
    broadcastId: string;
    title: string;
    onClose: () => void;
    onSuccess: () => void;
}

function BroadCastResponseModal( {broadcastId, onSuccess, onClose, title} : ResponseModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        price: "",
        message: "",
        task: ""
    })
    const [priceTouched, setPriceTouched] = useState(false);
    const isPriceInvalid = !formData.price || Number(formData.price) <= 0;
    const showPriceError = priceTouched && isPriceInvalid;
    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/broadcasts/${broadcastId}/respond`,{
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, price: formData.price ? Number(formData.price) : 0 }),
                credentials: 'include'
            });
            if (res.ok){
                onSuccess();
                onClose();
            } else {
                const errData = await res.json().catch(() => ({}));
                setError(errData.message || `Request failed (${res.status})`);
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    }
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-background/80 backdrop-blur-sm">
            <div className="bg-surface-panel border border-border-default w-full max-w-lg rounded-modal p-8 shadow-2xl">
                <div className="mb-6">
                    <span className="text-caption-dense font-black text-brand-primary uppercase tracking-widest">Submit Proposal</span>
                    <h2 className="text-heading-section font-bold text-text-primary mt-1">For: {title}</h2>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="text-caption-dense font-bold text-text-tertiary uppercase mb-2 block">Proposed Price (DH)</label>
                        <input 
                            type="number"
                            min={0}
                            placeholder="e.g. 1500"
                            value={formData.price}
                            onChange={(e) => setFormData({...formData, price: e.target.value})}
                            onFocus={() => setPriceTouched(true)}
                            className={`${INPUT_CLASSES} ${showPriceError ? 'border-status-error focus:border-status-error' : ''}`}
                        />
                        {showPriceError && (
                            <p className="text-status-error text-xs font-medium mt-1.5 animate-fade-in">
                                Please enter a valid price greater than 0.
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="text-caption-dense font-bold text-text-tertiary uppercase mb-2 block">Your Message</label>
                        <textarea 
                            value={formData.message}
                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                            placeholder="Tell the client why they should pick you..."
                            className={TEXTAREA_CLASSES}
                        />
                    </div>
                </div>

                {error && (
                <div className="mb-4 px-4 py-3 rounded-panel bg-status-error/10 border border-status-error/30 text-status-error text-sm font-medium animate-fade-in">
                    {error}
                </div>
            )}
            <div className="flex gap-3">
                <button 
                    onClick={onClose}
                    className="flex-1 py-3 text-text-secondary font-bold hover:text-text-primary transition-colors"
                >
                    CANCEL
                </button>
                <div className="flex-[2]">
                    <Button 
                        label={loading ? "TRANSMITTING..." : "CONFIRM PROPOSAL"} 
                        variant="primary"  
                        disabled={isPriceInvalid || loading}
                        onClick={handleSubmit}
                    />
                </div>
            </div>
            </div>
        </div>
    );
}

export default BroadCastResponseModal
