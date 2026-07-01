import { useNavigate } from "react-router-dom";
import type { User } from "../_types/user.types";
import { useProtectedImage } from "../hooks/useProtectedImage";

interface ProviderShowcaseCardProps {
    provider: User;
}

function ProviderShowcaseCard({ provider }: ProviderShowcaseCardProps) {
    const navigate = useNavigate();
    const imageSrc = useProtectedImage(provider.imageUrl);

    const handleClick = () => {
        navigate(`/profile?id=${provider.id}`);
    };

    const isVerified = provider.provider?.isVerified === "VERIFIED";
    const profession = provider.provider?.profession || "Specialist";

    return (
        <div
            onClick={handleClick}
            className="group bg-surface-elevated/30 border border-border-default rounded-modal p-6 hover:border-brand-primary/30 hover:bg-surface-elevated/40 transition-all duration-300 cursor-pointer"
        >
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="h-14 w-14 rounded-card bg-surface-elevated border border-border-subtle flex items-center justify-center text-xl font-black text-text-primary shrink-0 group-hover:border-brand-primary/50 transition-colors overflow-hidden">
                    {imageSrc ? (
                        <img
                            src={imageSrc}
                            alt={`${provider.firstName} ${provider.lastName}`}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <>
                            {provider.firstName.toUpperCase()[0]}
                            {provider.lastName.toUpperCase()[0]}
                        </>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-text-primary font-bold text-base group-hover:text-brand-success transition-colors truncate">
                            {provider.firstName} {provider.lastName}
                        </h3>
                        {isVerified && (
                            <span className="inline-flex items-center gap-1 text-caption-dense font-bold px-2 py-0.5 rounded-full bg-brand-primary/10 border border-brand-primary/30 text-brand-success uppercase tracking-wider">
                                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                Verified
                            </span>
                        )}
                    </div>
                    <p className="text-brand-success text-xs font-bold mt-0.5 uppercase tracking-wide">
                        {profession}
                    </p>
                    <p className="text-text-tertiary text-sm mt-1 truncate">
                        {provider.email}
                    </p>
                </div>

                {/* Arrow indicator */}
                <div className="shrink-0 text-text-muted group-hover:text-brand-success transition-colors mt-1">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>

            {provider.provider?.description && (
                <p className="text-text-secondary text-sm mt-4 leading-relaxed line-clamp-2">
                    {provider.provider.description}
                </p>
            )}

            {!isVerified && provider.provider && (
                <div className="mt-4 flex items-center gap-2 text-xs text-text-tertiary">
                    <span className="h-1.5 w-1.5 rounded-full bg-status-pending" />
                    Verification pending
                </div>
            )}
        </div>
    );
}

export default ProviderShowcaseCard;
