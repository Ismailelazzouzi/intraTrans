import { useNavigate } from "react-router-dom";
import type {BroadCastResponse, ProposalViewerModalProps } from "../_types/broadCast.types";
import Button from "./Button";
import { useState } from "react";

function ProposalViewerModal({ broadcast, onClose, onAcceptProvider }: ProposalViewerModalProps) {
    const navigate = useNavigate();
    const [isAcceptingId, setIsAcceptingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAcceptClick = async (responseId: string) => {
        setIsAcceptingId(responseId);
        setError(null);
        try {
            await onAcceptProvider(responseId);
        } catch (err: any) {
            console.error("Action error handling provider handshake:", err);
            setError(err?.message || "Failed to accept proposal.");
        } finally {
            setIsAcceptingId(null);
        }
    };

    const handleProviderProfileClick = (e: React.MouseEvent, providerId: string | undefined) => {
        e.stopPropagation();
        if (providerId) {
            navigate(`/profile?id=${providerId}`);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-background/80 backdrop-blur-sm">
            <div className="bg-surface-panel border border-border-default w-full max-w-2xl rounded-modal flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
                
                {/* Header Block */}
                <div className="p-6 md:p-8 border-b border-border-default/60 flex justify-between items-start">
                    <div>
                        <span className="text-caption-dense font-black text-brand-success uppercase tracking-widest block mb-1">
                            Incoming Telemetry • {broadcast.type}
                        </span>
                        <h2 className="text-heading-section font-bold text-text-primary line-clamp-1">{broadcast.title}</h2>
                        <p className="text-xs text-text-secondary mt-1">Review applicant profiles and fix operational rates.</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-text-tertiary hover:text-text-primary transition-colors p-2 text-lg font-bold"
                    >
                        ✕
                    </button>
                </div>
                {error && (
                    <div className="mx-8 mt-4 px-4 py-3 rounded-panel bg-status-error/10 border border-status-error/30 text-status-error text-sm font-medium animate-fade-in">
                        {error}
                    </div>
                )}
                <div className="p-4 md:p-6 lg:p-8 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
                    {broadcast.responses && broadcast.responses.length > 0 ? (
                        broadcast.responses.map((resp: BroadCastResponse) => {
                            const providerName = `${resp.provider?.user?.firstName || "Unknown"} ${resp.provider?.user?.lastName || "Provider"}`;
                            const profession = resp.provider?.profession || "Specialist";

                            return (
                                <div 
                                    key={resp.id} 
                                    className="bg-surface-elevated/20 border border-border-default rounded-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-border-subtle/60 transition-all duration-200"
                                >
                                    <div className="space-y-3 flex-1">
                                        {/* Row 1: Profile metadata */}
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-surface-elevated border border-border-subtle flex items-center justify-center text-xs font-black text-text-primary uppercase">
                                                {providerName[0]}
                                            </div>
                                            <div>
                                                <h4
                                                    onClick={(e) => handleProviderProfileClick(e, resp.provider?.user?.id)}
                                                    className="text-text-primary font-bold text-sm capitalize cursor-pointer hover:text-brand-success transition-colors"
                                                >
                                                    {providerName}
                                                </h4>
                                                <span className="text-caption-dense text-brand-success font-bold uppercase tracking-wider">{profession}</span>
                                            </div>
                                        </div>

                                        <p className="text-text-secondary text-xs bg-surface-overlay p-3 rounded-panel border border-border-default/40 leading-relaxed">
                                            {resp.message || "No custom message provided with this application slot."}
                                        </p>
                                    </div>
                                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-4 min-w-0 md:min-w-[140px] pt-4 md:pt-0 border-t md:border-0 border-border-default/50">
                                        <div className="text-left md:text-right">
                                            <span className="text-xl font-mono font-black text-text-primary block">
                                                {resp.price} <span className="text-xs text-text-tertiary font-sans font-normal">DH</span>
                                            </span>
                                            <span className="text-caption-tiny text-text-tertiary uppercase tracking-tighter block mt-0.5">ESTIMATED RATE</span>
                                        </div>
                                        
                                        <Button 
                                            label={resp.status === 'ACCEPTED' ? 'ALREADY ACCEPTED' : 'ACCEPT'}
                                            variant={resp.status === 'ACCEPTED' ? 'secondary' : 'primary'}
                                            onClick={() => handleAcceptClick(resp.id!)}
                                            disabled={resp.status === 'ACCEPTED' || isAcceptingId !== null}
                                        />
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-12 text-center">
                            <p className="text-sm font-bold text-text-tertiary">No applicant nodes connected to this broadcast instance.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProposalViewerModal;
