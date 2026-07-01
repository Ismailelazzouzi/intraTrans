import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { TrustedRelation } from "../../_types/trustedRelations.types";
import { useAuth } from "../../hooks/useAuth";
import { useProtectedImage } from "../../hooks/useProtectedImage";
import { socket } from "../../utils/socket";

interface UserSummary {
    id: string;
    firstName: string;
    lastName: string;
    imageUrl: string | null;
    type: string;
    provider: { id: string } | null;
}

function UserAvatar({ firstName, imageUrl, size = "sm" }: { firstName: string; imageUrl?: string | null; size?: "sm" | "md" }) {
    const protectedSrc = useProtectedImage(imageUrl);
    const dim = size === "md" ? "w-9 h-9" : "w-7 h-7";
    const text = size === "md" ? "text-sm" : "text-[10px]";
    const initials = firstName?.charAt(0)?.toUpperCase() || "?";

    if (protectedSrc) {
        return (
            <img
                src={protectedSrc}
                alt={firstName}
                className={`${dim} rounded-full object-cover border border-border-subtle/60 shrink-0`}
            />
        );
    }

    return (
        <div className={`${dim} rounded-full bg-surface-elevated border border-border-subtle/60 flex items-center justify-center shrink-0`}>
            <span className={`${text} font-bold text-text-secondary`}>{initials}</span>
        </div>
    );
}

export default function TrustedRelationsManager() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isProvider = user?.type === "PROVIDER";

    const [activeRelations, setActiveRelations] = useState<TrustedRelation[]>([]);
    const [pendingRequests, setPendingRequests] = useState<TrustedRelation[]>([]);
    const [blockedRelations, setBlockedRelations] = useState<TrustedRelation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [userMap, setUserMap] = useState<Map<string, UserSummary>>(new Map());
    const [providerIdToUserId, setProviderIdToUserId] = useState<Map<string, string>>(new Map());
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

    const fetchUserLookups = useCallback(async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/users/`, {
                credentials: "include",
            });
            if (!res.ok) return;
            const data = await res.json();
            const users: UserSummary[] = Array.isArray(data) ? data : (data.users ?? data.data ?? []);
            const uMap = new Map<string, UserSummary>();
            const pMap = new Map<string, string>();

            for (const u of users) {
                uMap.set(u.id, u);
                if (u.provider?.id) {
                    pMap.set(u.provider.id, u.id);
                }
            }

            setUserMap(uMap);
            setProviderIdToUserId(pMap);
        } catch (err) {
            console.error("Failed to fetch user lookups:", err);
            setError("Failed to load user data.");
            setTimeout(() => setError(null), 4000);
        }
    }, []);

    const fetchNetworkEcosystem = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const fetches = [
                fetch(isProvider
                    ? `${import.meta.env.VITE_API_URL}/TrustedRelation/providerRelations`
                    : `${import.meta.env.VITE_API_URL}/TrustedRelation/relations`, { credentials: "include" }),
                fetch(isProvider
                    ? `${import.meta.env.VITE_API_URL}/TrustedRelation/request/received`
                    : `${import.meta.env.VITE_API_URL}/TrustedRelation/request/sent`, { credentials: "include" }),
            ];
            if (!isProvider) {
                fetches.push(fetch(`${import.meta.env.VITE_API_URL}/TrustedRelation/block/list`, { credentials: "include" }));
            }
            const [activeRes, pendingRes, blockedRes] = await Promise.all(fetches) as [Response, Response, Response?];

            if (activeRes.ok) {
                const data = await activeRes.json();
                setActiveRelations(data.acceptedRelation || []);
            }
            if (pendingRes.ok) {
                const data = await pendingRes.json();
                setPendingRequests(data.relationRequests || []);
            }
            if (!isProvider && blockedRes.ok) {
                const data = await blockedRes.json();
                setBlockedRelations(data.relations || []);
            }

            await fetchUserLookups();
        } catch (err) {
            console.error("Error synchronizing trust network lists:", err);
            setError("Failed to sync network data.");
            setTimeout(() => setError(null), 4000);
        } finally {
            setLoading(false);
        }
    }, [user, isProvider, fetchUserLookups]);

    useEffect(() => {
        fetchNetworkEcosystem();
    }, [fetchNetworkEcosystem]);

    useEffect(() => {
        if (!socket.connected) {
            socket.connect();
        }

        const handlePresenceInitial = (users: { userId: string; isOnline: boolean }[]) => {
            const online = new Set<string>();
            for (const u of users) {
                if (u.isOnline) online.add(u.userId);
            }
            setOnlineUsers(online);
        };

        const handlePresenceUpdate = (update: { userId: string; isOnline: boolean }) => {
            setOnlineUsers((prev) => {
                const next = new Set(prev);
                if (update.isOnline) {
                    next.add(update.userId);
                } else {
                    next.delete(update.userId);
                }
                return next;
            });
        };

        socket.on("presence:initial", handlePresenceInitial);
        socket.on("presence:update", handlePresenceUpdate);

        return () => {
            socket.off("presence:initial", handlePresenceInitial);
            socket.off("presence:update", handlePresenceUpdate);
        };
    }, []);

    function resolveUser(rel: TrustedRelation): { userId: string; userInfo: UserSummary | undefined } | null {
        if (isProvider) {
            const uid = rel.userId;
            return { userId: uid, userInfo: userMap.get(uid) };
        }
        const uid = providerIdToUserId.get(rel.providerId);
        if (!uid) return null;
        return { userId: uid, userInfo: userMap.get(uid) };
    }

    const handleCancelRequest = async (relationId: string) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/TrustedRelation/request/${relationId}/cancel`, {
                method: "DELETE",
                credentials: "include"
            });
            if (res.ok) {
                fetchNetworkEcosystem();
            } else {
                const errData = await res.json().catch(() => ({}));
                setError(errData.message || "Failed to cancel request.");
                setTimeout(() => setError(null), 4000);
            }
        } catch (err) {
            console.error("Failed to cancel pending request:", err);
            setError("Failed to cancel request.");
            setTimeout(() => setError(null), 4000);
        }
    };

    const handleBlockRelation = async (relationId: string) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/TrustedRelation/block/${relationId}`, {
                method: "POST",
                credentials: "include"
            });
            if (res.ok) {
                fetchNetworkEcosystem();
            } else {
                const errData = await res.json().catch(() => ({}));
                setError(errData.message || "Failed to block user.");
                setTimeout(() => setError(null), 4000);
            }
        } catch (err) {
            console.error("Failed to execute block tracking command:", err);
            setError("Failed to block user.");
            setTimeout(() => setError(null), 4000);
        }
    };

    const handleUnblockRelation = async (relationId: string) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/TrustedRelation/unblock/${relationId}`, {
                method: "POST",
                credentials: "include"
            });
            if (res.ok) {
                fetchNetworkEcosystem();
            } else {
                const errData = await res.json().catch(() => ({}));
                setError(errData.message || "Failed to unblock user.");
                setTimeout(() => setError(null), 4000);
            }
        } catch (err) {
            console.error("Failed to unblock target relation channel:", err);
            setError("Failed to unblock user.");
            setTimeout(() => setError(null), 4000);
        }
    };

    const handleAcceptRequest = async (relationId: string) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/TrustedRelation/request/${relationId}/accept`, {
                method: "PATCH",
                credentials: "include"
            });
            if (res.ok) {
                fetchNetworkEcosystem();
            } else {
                const errData = await res.json().catch(() => ({}));
                setError(errData.message || "Failed to accept request.");
                setTimeout(() => setError(null), 4000);
            }
        } catch (err) {
            console.error("Failed to accept relation request:", err);
            setError("Failed to accept request.");
            setTimeout(() => setError(null), 4000);
        }
    };

    const handleRejectRequest = async (relationId: string) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/TrustedRelation/request/${relationId}/reject`, {
                method: "PATCH",
                credentials: "include"
            });
            if (res.ok) {
                fetchNetworkEcosystem();
            } else {
                const errData = await res.json().catch(() => ({}));
                setError(errData.message || "Failed to reject request.");
                setTimeout(() => setError(null), 4000);
            }
        } catch (err) {
            console.error("Failed to reject relation request:", err);
            setError("Failed to reject request.");
            setTimeout(() => setError(null), 4000);
        }
    };

    function UserCard({
        resolved,
        children,
    }: {
        resolved: { userId: string; userInfo: UserSummary | undefined; label?: string } | null;
        children?: React.ReactNode;
    }) {
        const info = resolved?.userInfo;
        const displayName = info ? `${info.firstName} ${info.lastName}` : resolved?.userId ?? "Unknown";
        const subLabel = info ? info.type === "PROVIDER" ? "Service Provider" : "Client" : resolved?.label ?? "";

        return (
            <div
                onClick={() => resolved?.userId && navigate(`/profile?id=${resolved.userId}`)}
                className="p-3 bg-surface-background border border-border-default/50 rounded-panel flex items-center justify-between gap-3 hover:border-border-subtle/60 hover:bg-surface-panel/60 transition-all cursor-pointer group"
            >
                <div className="flex items-center gap-3 truncate min-w-0">
                    <div className="relative shrink-0">
                        <UserAvatar firstName={info?.firstName ?? "?"} imageUrl={info?.imageUrl} size="md" />
                        {resolved?.userId && (
                            <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-background ${
                                onlineUsers.has(resolved.userId) ? 'bg-status-active' : 'bg-text-tertiary/30'
                            }`} />
                        )}
                    </div>
                    <div className="truncate min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate group-hover:text-text-primary transition-colors">
                            {displayName}
                        </p>
                        <p className="text-caption-dense text-text-tertiary mt-0.5 truncate">
                            {subLabel}
                        </p>
                    </div>
                </div>
                {children && (
                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        {children}
                    </div>
                )}
            </div>
        );
    }

    function EmptyState({ message }: { message: string }) {
        return (
            <p className="text-caption-dense text-text-muted py-6 text-center border border-dashed border-surface-panel rounded-panel">
                {message}
            </p>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8 bg-surface-background text-text-primary min-h-[calc(100vh-4rem)]">
            <div>
                <h1 className="text-xl font-bold tracking-wide uppercase text-text-primary">
                    Trusted Network Workspace
                </h1>
                <p className="text-xs text-text-tertiary mt-1 leading-relaxed">
                    Verify verified service partnerships, track pending handshakes, and manage account authorization filters.
                </p>
            </div>

            {error && (
                <div className="mb-4 px-4 py-3 rounded-panel bg-status-error/10 border border-status-error/30 text-status-error text-sm font-medium animate-fade-in">
                    {error}
                </div>
            )}
            {loading ? (
                <div className="py-12 text-center text-xs text-text-tertiary uppercase tracking-widest animate-pulse">
                    Synchronizing encrypted relations matrix...
                </div>
            ) : (
                <div className={`grid grid-cols-1 gap-6 ${isProvider ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>

                    <div className="bg-surface-overlay border border-border-default/80 rounded-card p-4 flex flex-col h-fit">
                        <h2 className="text-xs font-bold tracking-wider text-brand-success uppercase mb-3 flex items-center gap-2">
                            <span>✓</span> {isProvider ? "Active Clients" : "Active Partners"} ({activeRelations.length})
                        </h2>
                        <div className="space-y-2">
                            {activeRelations.length === 0 ? (
                                <EmptyState message="No active relations certified." />
                            ) : (
                                activeRelations.map((rel) => {
                                    const resolved = resolveUser(rel);
                                    return (
                                        <UserCard key={rel.id} resolved={resolved}>
                                            {!isProvider && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => resolved?.userId && navigate(`/chatroom?targetId=${resolved.userId}`)}
                                                        className="px-2.5 py-1.5 rounded-interactive border border-brand-primary/30 text-brand-success text-caption-dense uppercase font-bold tracking-wider bg-brand-primary/10 hover:bg-brand-primary/20 hover:text-text-primary transition-all cursor-pointer"
                                                    >
                                                        Chat
                                                    </button>
                                                    <button
                                                        onClick={() => handleBlockRelation(rel.id)}
                                                        className="px-2.5 py-1.5 rounded-interactive border border-status-error/30 text-status-error text-caption-dense uppercase font-bold tracking-wider bg-status-error/10 hover:bg-status-error/20 hover:text-text-primary transition-all cursor-pointer"
                                                    >
                                                        Block
                                                    </button>
                                                </div>
                                            )}
                                        </UserCard>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="bg-surface-overlay border border-border-default/80 rounded-card p-4 flex flex-col h-fit">
                        <h2 className="text-xs font-bold tracking-wider text-status-pending uppercase mb-3 flex items-center gap-2">
                            <span>⏳</span> {isProvider ? "Inbound Requests" : "Sent Pending Requests"} ({pendingRequests.length})
                        </h2>
                        <div className="space-y-2">
                            {pendingRequests.length === 0 ? (
                                <EmptyState message="No pending handshakes found." />
                            ) : (
                                pendingRequests.map((rel) => (
                                    <UserCard key={rel.id} resolved={resolveUser(rel)}>
                                        {isProvider ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleRejectRequest(rel.id)}
                                                    className="px-2.5 py-1.5 rounded-interactive border border-status-error/30 text-status-error text-caption-dense uppercase font-bold tracking-wider bg-status-error/10 hover:bg-status-error/20 hover:text-text-primary transition-all cursor-pointer"
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => handleAcceptRequest(rel.id)}
                                                    className="px-2.5 py-1.5 rounded-interactive border border-brand-primary/30 text-brand-success text-caption-dense uppercase font-bold tracking-wider bg-brand-primary/10 hover:bg-brand-primary/20 hover:text-text-primary transition-all cursor-pointer"
                                                >
                                                    Accept
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleCancelRequest(rel.id)}
                                                className="px-2.5 py-1.5 rounded-interactive border border-border-default text-text-secondary text-caption-dense uppercase font-bold tracking-wider bg-surface-overlay hover:bg-surface-elevated hover:text-text-primary transition-all cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </UserCard>
                                ))
                            )}
                        </div>
                    </div>

                    {!isProvider && (
                        <div className="bg-surface-overlay border border-border-default/80 rounded-card p-4 flex flex-col h-fit">
                        <h2 className="text-xs font-bold tracking-wider text-status-error uppercase mb-3 flex items-center gap-2">
                            <span>🚫</span> Blocked Filters ({blockedRelations.length})
                            </h2>
                            <div className="space-y-2">
                                {blockedRelations.length === 0 ? (
                                    <EmptyState message="No restricted accounts found." />
                                ) : (
                                    blockedRelations.map((rel) => (
                                        <UserCard key={rel.id} resolved={resolveUser(rel)}>
                                            <button
                                                onClick={() => handleUnblockRelation(rel.id)}
                                                className="px-2.5 py-1.5 rounded-interactive border border-brand-primary/30 text-brand-success text-caption-dense uppercase font-bold tracking-wider bg-brand-primary/10 hover:bg-brand-primary/20 hover:text-text-primary transition-all cursor-pointer"
                                            >
                                                Unblock
                                            </button>
                                        </UserCard>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
