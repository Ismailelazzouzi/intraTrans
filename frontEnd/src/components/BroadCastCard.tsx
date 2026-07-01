import { useNavigate } from "react-router-dom";
import type { BroadCast } from "../_types/broadCast.types";
import Button from "./Button";

interface BroadCastCardProps {
    broadcast: BroadCast;
    onRespond: (id: string) => void;
}

function BroadCastCard({ broadcast, onRespond }: BroadCastCardProps) {
    const navigate = useNavigate();
    const isUnavailable = 
        broadcast.status === 'CLOSED' || 
        broadcast.status === 'CANCELLED';

    const getActionLabel = () => {
        if (broadcast.status === 'CANCELLED') return "SIGNAL VOIDED";
        if (broadcast.status === 'CLOSED') return "JOB FILLED";
        return "SIGN FOR JOB";
    };

    const handleProfileClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (broadcast.user?.id) {
            navigate(`/profile?id=${broadcast.user.id}`);
        }
    };

    return (
        <div className="mt-5 group relative bg-surface-elevated/30 border border-border-default p-6 rounded-modal backdrop-blur-md hover:border-brand-primary/30 transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <span className={`status-dot animate-pulse ${broadcast.type === 'GROUP' ? 'bg-status-info' : 'bg-status-active'}`} />
                    <span className="text-caption-dense font-black text-text-tertiary uppercase tracking-widest">
                        {broadcast.type} SIGNAL
                    </span>
                </div>
                <span className="text-caption-dense font-medium text-text-muted">
                    {new Date(broadcast.createdAt!).toLocaleDateString()}
                </span>
            </div>

            <div className="mb-6">
                <h3 className="text-xl font-bold text-text-primary mb-2 group-hover:text-brand-success transition-colors">
                    {broadcast.title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed line-clamp-3">
                    {broadcast.description || "No description provided for this signal."}
                </p>
            </div>

            <div className="flex flex-wrap gap-3 mb-8">
                <div className="flex items-center gap-1.5 bg-surface-overlay px-3 py-1.5 rounded-full border border-border-subtle/50">
                    <span className="text-xs">📍</span>
                    <span className="text-caption-dense font-bold text-text-secondary uppercase">
                        {broadcast.location || "Global"}
                    </span>
                </div>
                {broadcast.maxProviders && broadcast.maxProviders > 1 && (
                    <div className="flex items-center gap-1.5 bg-surface-overlay px-3 py-1.5 rounded-full border border-border-subtle/50">
                        <span className="text-caption-dense font-bold text-status-info">
                            {broadcast.maxProviders} MAXIMUM SLOTS
                        </span>
                    </div>
                )}
                {broadcast.user && (
                    <div className="flex items-center gap-1.5 bg-surface-overlay px-3 py-1.5 rounded-full border border-border-subtle/50">
                        <span className="text-xs">👤</span>
                        <span
                            onClick={handleProfileClick}
                            className="text-caption-dense font-bold text-brand-success hover:text-brand-success/80 transition-colors cursor-pointer uppercase"
                        >
                            {broadcast.user.firstName} {broadcast.user.lastName}
                        </span>
                    </div>
                )}
            </div>

            <Button 
                label={getActionLabel()} 
                variant={isUnavailable ? "secondary" : "primary"} 
                disabled={isUnavailable}
                onClick={() => onRespond(broadcast.id!)} 
            />
        </div>
    );
}

export default BroadCastCard;
