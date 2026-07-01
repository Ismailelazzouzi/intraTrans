import { useState, useEffect, useCallback } from "react";
import MyActiveBids from "../../components/MyActiveBids";
import ProviderWorkHistory from "../../components/ProviderWorkHistory";
import type { User } from "../../_types/user.types";
import { useAuth } from "../../hooks/useAuth";

interface ProviderProfileProps {
    user: User;
    isOwner: boolean;
}

function ProviderProfie({ user, isOwner }: ProviderProfileProps) {
    const { user: loggedInUser } = useAuth();
    const [isTrusted, setIsTrusted] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const providerId = user.provider?.id;

    const fetchRelationStatus = useCallback(async () => {
        // Only clients have a trusted-relations feature with providers
        if (!loggedInUser || loggedInUser.type !== "CLIENT" || !providerId) return;

        setIsTrusted(false);
        setIsPending(false);

        try {
            const [activeRes, pendingRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/TrustedRelation/relations`, {
                    credentials: "include",
                }),
                fetch(`${import.meta.env.VITE_API_URL}/TrustedRelation/request/sent`, {
                    credentials: "include",
                }),
            ]);

            if (activeRes.ok) {
                const data = await activeRes.json();
                const activeRelations: { providerId: string }[] = data.acceptedRelation || [];
                if (activeRelations.some((rel) => rel.providerId === providerId)) {
                    setIsTrusted(true);
                }
            }

            if (pendingRes.ok) {
                const data = await pendingRes.json();
                const pendingRequests: { providerId: string }[] = data.relationRequests || [];
                if (pendingRequests.some((rel) => rel.providerId === providerId)) {
                    setIsPending(true);
                }
            }
        } catch (err) {
            console.error("Error fetching trust relationship status:", err);
        }
    }, [loggedInUser, providerId]);

    useEffect(() => {
        fetchRelationStatus();
    }, [fetchRelationStatus]);

    const handleAddToTrusted = async () => {
        if (!providerId || actionLoading) return;
        setActionLoading(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/TrustedRelation/request/${providerId}`,
                {
                    method: "POST",
                    credentials: "include",
                }
            );
            if (res.ok) {
                await fetchRelationStatus();
            }
        } catch (err) {
            console.error("Failed to send trust request:", err);
            setError("Failed to send trust request. Please try again.");
            setTimeout(() => setError(null), 4000);
        } finally {
            setActionLoading(false);
        }
    };

    if (!isOwner) {
        const provider = user.provider;

        if (!provider) {
            return (
                <div className="bg-surface-elevated/20 border border-border-default rounded-modal p-6 md:p-8">
                    <h2 className="text-lg font-bold text-text-primary mb-2">Provider Profile</h2>
                    <p className="text-text-secondary text-sm leading-relaxed">
                        {user.firstName} {user.lastName} is a registered service provider on The Hive.
                        Provider details are not publicly available at this time.
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-text-tertiary">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-success" />
                        Active provider account
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {error && (
                    <div className="px-4 py-3 rounded-panel bg-status-error/10 border border-status-error/30 text-status-error text-sm font-medium animate-fade-in">
                        {error}
                    </div>
                )}
                {/* Trust relationship badge/button — only for clients viewing a provider profile */}
                {loggedInUser && loggedInUser.type === "CLIENT" && providerId && (
                    <div className="flex items-center">
                        {isTrusted ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-panel bg-brand-primary/10 border border-brand-primary/30 text-brand-success text-xs font-bold uppercase tracking-wide">
                                <span>✓</span> Trusted Provider
                            </div>
                        ) : isPending ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-panel bg-status-pending/10 border border-status-pending/30 text-status-pending text-xs font-semibold uppercase tracking-wider">
                                <span>⏳</span> Request Pending
                            </div>
                        ) : (
                            <button
                                onClick={handleAddToTrusted}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-panel bg-brand-primary/10 border border-brand-primary/20 text-brand-success text-xs font-bold uppercase tracking-wide hover:bg-brand-primary/20 hover:border-brand-primary/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 active:scale-[0.97] transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {actionLoading ? (
                                    <span className="animate-pulse">Sending...</span>
                                ) : (
                                    <>+ Add to Trusted List</>
                                )}
                            </button>
                        )}
                    </div>
                )}
                <ProviderWorkHistory provider={provider} />
            </div>
        );
    }

    return (
        <div>
            <MyActiveBids />
        </div>
    );
}

export default ProviderProfie;
