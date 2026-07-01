import { useEffect, useState, useRef } from "react";
import type { BidResponsePayload } from "../_types/broadCast.types";
import { socket } from "../utils/socket";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import Pagination from "./Pagination";
import { NOTIFICATION_STYLES } from "../_styles/tokens";

interface ProjectSchema {
    id: string;
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    providers: Array<{ role: string; status: string }>;
}


function MyActiveBids() {
    const [myBids, setMyBids] = useState<BidResponsePayload[]>([]);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const navigate = useNavigate();
    const myBidsRef = useRef<BidResponsePayload[]>(myBids);
    myBidsRef.current = myBids;
    const [currentPage, setCurrentPage] = useState(1);
    const [bidsPerPage] = useState(4);

    const fetchMyBids = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/broadcasts/responded`, {
                credentials: "include"
            });
            if (!res.ok) throw new Error("Failed to fetch your bids");
            const response = await res.json();                    setMyBids(response.data);
        } catch (err) {
            console.error("Error loading personal bids:", err);
            setNotification({ message: "Failed to load your bids. Please refresh.", type: 'error' });
            setTimeout(() => setNotification(null), 4000);
        } finally {
            setLoading(false);
        }
    };

    const removeBid = async (broadcastId: string) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/broadcasts/${broadcastId}/responses`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to remove response.");
            }

            // Client-side state update: mark bid as WITHDRAWN and clear project reference.
            // This ensures the UI renders the "Proposal Withdrawn" badge immediately,
            // skipping any transient "Project Active" flash from stale relational data.
            setMyBids((prevBids) =>
                prevBids.map((bid) =>
                    bid.broadcastId === broadcastId
                        ? {
                            ...bid,
                            status: 'WITHDRAWN' as const,
                            broadcast: bid.broadcast
                                ? { ...bid.broadcast, project: null }
                                : bid.broadcast
                        }
                        : bid
                )
            );

            setNotification({ message: "Proposal successfully withdrawn.", type: 'success' });
            setTimeout(() => setNotification(null), 3000);
        } catch (err: any) {
            console.error("Failed removing bid:", err);
            const msg = err?.message || "Failed to withdraw proposal.";
            setNotification({ message: msg, type: 'error' });
            setTimeout(() => setNotification(null), 4000);
        }
    };

    useEffect(() => {
        fetchMyBids();
    }, []);
    useEffect(() => {
        if (!socket.connected) {
            socket.connect();
        }

        const handleProviderWithdrawn = (payload: { broadcastId: string; providerId: string }) => {
            console.log("[Socket] Provider withdrew a bid on this channel:", payload);
            setMyBids((prevBids) =>
                prevBids.map((bid) => {
                    if (bid.broadcastId !== payload.broadcastId || bid.providerId !== payload.providerId)
                        return bid;
                    return { ...bid, status: 'WITHDRAWN' as const };
                })
            );
        };

        const handleBroadcastCancelled = (payload: { broadcastId: string }) => {
            console.log("[Socket] Active bid noticed a channel cancellation:", payload);
            setMyBids((prevBids) =>
                prevBids.map((bid) => {
                    if (bid.broadcastId !== payload.broadcastId) return bid;

                    return {
                        ...bid,
                        status: bid.status === 'ACCEPTED' ? 'ACCEPTED' : 'REJECTED',
                        broadcast: bid.broadcast ? { ...bid.broadcast, status: 'CANCELLED' } : bid.broadcast
                    };
                })
            );
        };

        const handleBroadcastClosed = (payload: { broadcastId: string }) => {
            console.log("[Socket] Active bid noticed a channel operation closure:", payload);
            setMyBids((prevBids) =>
                prevBids.map((bid) => {
                    if (bid.broadcastId !== payload.broadcastId) return bid;

                    return {
                        ...bid,
                        // Do NOT override per-provider status — user-specific events
                        // (response-confirmed / response-rejected) set those correctly.
                        // Only mark the broadcast as closed so the UI reflects final state.
                        broadcast: bid.broadcast ? { ...bid.broadcast, status: 'CLOSED' } : bid.broadcast
                    };
                })
            );
        };
        const handleResponseConfirmed = (payload: { broadcastId: string; projectId: string }) => {
            console.log("[Socket] This provider's bid was confirmed!", payload);
            setMyBids((prevBids) =>
                prevBids.map((bid) => {
                    if (bid.broadcastId !== payload.broadcastId) return bid;
                    return {
                        ...bid,
                        status: 'ACCEPTED',
                        broadcast: bid.broadcast
                            ? {
                                ...bid.broadcast,
                                project: {
                                    id: payload.projectId,
                                    status: 'ACTIVE' as const,
                                    providers: bid.broadcast.project?.providers || []
                                }
                            }
                            : bid.broadcast
                    };
                })
            );
        };
        const handleResponseRejected = (payload: { broadcastId: string }) => {
            console.log("[Socket] This provider's bid was turned down:", payload);
            setMyBids((prevBids) =>
                prevBids.map((bid) => {
                    if (bid.broadcastId !== payload.broadcastId) return bid;
                    return {
                        ...bid,
                        status: 'REJECTED'
                    };
                })
            );
        };
        const handleProjectCompleted = (payload: { projectId: string }) => {
            console.log("[Socket] Active bid noticed a project completion:", payload);
            if (myBidsRef.current.some((bid) => bid.broadcast?.project?.id === payload.projectId)) {
                fetchMyBids();
            }
        };

        const handleProjectCancelled = (payload: { projectId: string }) => {
            console.log("[Socket] Active bid noticed a project cancellation:", payload);
            if (myBidsRef.current.some((bid) => bid.broadcast?.project?.id === payload.projectId)) {
                fetchMyBids();
            }
        };

        socket.on("provider-withdrawn", handleProviderWithdrawn);
        socket.on("broadcast-cancelled", handleBroadcastCancelled);
        socket.on("broadcast-closed", handleBroadcastClosed);
        socket.on("response-confirmed", handleResponseConfirmed);
        socket.on("response-rejected", handleResponseRejected);
        socket.on("project-completed", handleProjectCompleted);
        socket.on("project-cancelled", handleProjectCancelled);

        return () => {
            socket.off("provider-withdrawn", handleProviderWithdrawn);
            socket.off("broadcast-cancelled", handleBroadcastCancelled);
            socket.off("broadcast-closed", handleBroadcastClosed);
            socket.off("response-confirmed", handleResponseConfirmed);
            socket.off("response-rejected", handleResponseRejected);
            socket.off("project-completed", handleProjectCompleted);
            socket.off("project-cancelled", handleProjectCancelled);
        };
    }, []);
    useEffect(() => {
        if (myBids.length === 0)
            return;
        myBids.forEach((bid) => {
            if (bid.broadcastId) {
                socket.emit('join-broadcast', bid.broadcastId);
            }
        });

        return () => {
            myBids.forEach((bid) => {
                if (bid.broadcastId) {
                    socket.emit('leave-broadcast', bid.broadcastId);
                }
            });
        };
    }, [myBids]);
    
    // Pagination logic
    const indexOfLastBid = currentPage * bidsPerPage;
    const indexOfFirstBid = indexOfLastBid - bidsPerPage;
    const currentBids = myBids.slice(indexOfFirstBid, indexOfLastBid);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    return (
        <div className="p-6">
            {loading && (
                <div className="mb-6">
                    <h1 className="text-brand-success font-medium tracking-wider animate-pulse text-sm">
                        SYNCHRONIZING BID LIFECYCLES...
                    </h1>
                </div>
            )}

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-text-primary tracking-tight">My Active Bids</h1>
                <p className="text-text-secondary text-sm mt-1">
                    Monitor your proposals, view project handshakes, or retract active applications.
                </p>
            </div>

            {notification && (
                <div className={`mb-4 px-4 py-3 rounded-panel text-sm font-medium tracking-wide animate-fade-in ${NOTIFICATION_STYLES[notification.type]}`}>
                    {notification.message}
                </div>
            )}

            {myBids.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {currentBids.map((bid) => {
                            const signal = bid.broadcast;
                            return (
                                <div 
                                    key={bid.id} 
                                    className="bg-surface-panel border border-border-default rounded-card p-6 flex flex-col justify-between transition-all hover:border-border-subtle/80"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-4">
                                            <h2 className="text-text-primary font-bold text-lg tracking-wide line-clamp-1">
                                                {signal?.title || "Untitled Transmission"}
                                            </h2>
                                            <span className="bg-surface-background text-text-secondary border border-border-default text-caption-dense font-black px-2.5 py-1 rounded-md uppercase tracking-widest">
                                                {signal?.location || "Remote"}
                                            </span>
                                        </div>
                                        
                                        <p className="text-text-secondary text-sm mt-2 line-clamp-2 leading-relaxed">
                                            {signal?.description || "No description provided."}
                                        </p>

                                        <div className="mt-3">
                                            <span className="bg-surface-background text-brand-success text-caption-dense font-bold px-2 py-0.5 rounded border border-border-default">
                                                {signal?.type} MODE (Max: {signal?.maxProviders})
                                            </span>
                                        </div>
                                    </div>
                                    <div className="my-5 p-4 rounded-card bg-surface-background border border-border-default/60">
                                        <div className="flex justify-between items-center text-xs text-text-secondary font-medium mb-2">
                                            <span>Your Quote:</span>
                                            <span className="text-brand-success font-bold">{bid.price} DH</span>
                                        </div>
                                        <p className="text-text-tertiary text-xs italic line-clamp-2">
                                            "{bid.message || "No message attached."}"
                                        </p>
                                    </div>
                                   <div 
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-panel/50 border border-border-default/60 hover:bg-surface-elevated/40 hover:border-border-subtle/60 transition-all duration-200 cursor-pointer select-none group w-fit text-xs mt-3" 
                                        onClick={() => signal?.user?.id && navigate(`/profile?id=${signal?.user?.id}`)}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/80 group-hover:bg-brand-success group-hover:scale-110 transition-all duration-200" />

                                        <span className="text-text-tertiary font-normal">Client:</span>
                                        <span className="text-text-primary font-semibold tracking-wide group-hover:text-brand-success transition-colors duration-200">
                                            {signal?.user?.firstName} {signal?.user?.lastName}
                                        </span>
                                    </div>
                                    <div className="mt-6 pt-2">
                                        {signal?.status === 'CANCELLED' ? (
                                            <div className="w-full text-center px-4 py-3 rounded-panel font-bold text-xs tracking-wider bg-surface-background text-status-error/70 border border-status-error/20 uppercase select-none">
                                                Broadcast Cancelled by Client
                                            </div>
                                        ) : bid.status === 'WITHDRAWN' ? (
                                            <div className="w-full text-center px-4 py-3 rounded-panel font-bold text-xs tracking-wider bg-surface-background text-text-secondary border border-border-default/60 uppercase select-none">
                                                Proposal Withdrawn
                                            </div>
                                        ) : bid.status === 'ACCEPTED' && signal?.project ? (
                                            <div className="w-full space-y-2">
                                                {/* Status Badge */}
                                                <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-panel text-xs font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-success border border-brand-primary/30 select-none">
                                                    <span className="h-2 w-2 rounded-full bg-brand-primary" />
                                                    Proposal Accepted
                                                </div>
                                                {/* Project Status Badge */}
                                                <div className={`flex items-center justify-center gap-2 px-3 py-2 rounded-panel text-xs font-bold uppercase tracking-wider ${
                                                    signal.project.status === 'ACTIVE'
                                                        ? 'bg-status-pending/10 text-status-pending border border-status-pending/20'
                                                        : signal.project.status === 'COMPLETED'
                                                        ? 'bg-brand-success/10 text-brand-success border border-brand-success/20'
                                                        : 'bg-status-error/10 text-status-error border border-status-error/20'
                                                }`}>
                                                    <span className={`h-2 w-2 rounded-full ${
                                                        signal.project.status === 'ACTIVE' ? 'bg-status-pending animate-pulse' :
                                                        signal.project.status === 'COMPLETED' ? 'bg-brand-primary' : 'bg-status-error'
                                                    }`} />
                                                    Project — {signal.project.status}
                                                    {signal.project.status === 'ACTIVE' && signal?.type !== 'GROUP' && (
                                                        <Button
                                                            label="Go to chatRoom" 
                                                            variant="primary" 
                                                            disabled={false} 
                                                            onClick={() => {
                                                                navigate(`/chatroom?targetId=${bid.broadcast.userId}`);
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                                {/* Role Badge */}
                                                {signal.project.providers && signal.project.providers.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 justify-center">
                                                        {signal.project.providers.map((entry, idx) => {
                                                            const isCurrentProvider = entry.provider?.id === bid.providerId;
                                                            const roleLabel = entry.role === 'LEAD' ? 'LEAD' : 'COLLABORATOR';
                                                            return (
                                                                <span
                                                                    key={idx}
                                                                    className={`text-caption-dense font-bold uppercase tracking-widest px-2.5 py-1 rounded-interactive border ${
                                                                        isCurrentProvider
                                                                            ? 'bg-status-info/10 text-status-info border-status-info/20'
                                                                            : 'bg-surface-elevated/40 text-text-secondary border-border-subtle/50'
                                                                    }`}
                                                                >
                                                                    ROLE: {roleLabel}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        ) : signal?.project && bid.status !== 'REJECTED' && bid.status !== 'WITHDRAWN' && !((signal?.status === 'OPEN' || signal?.status === 'IN_PROGRESS') && bid.status === 'PENDING') ? (
                                            <div className="w-full space-y-2">
                                                {/* Project Status Badge */}
                                                <div className={`flex items-center justify-center gap-2 px-3 py-2 rounded-panel text-xs font-bold uppercase tracking-wider ${
                                                    signal.project.status === 'ACTIVE'
                                                        ? 'bg-status-pending/10 text-status-pending border border-status-pending/20'
                                                        : signal.project.status === 'COMPLETED'
                                                        ? 'bg-brand-success/10 text-brand-success border border-brand-success/20'
                                                        : 'bg-status-error/10 text-status-error border border-status-error/20'
                                                }`}>
                                                    <span className={`h-2 w-2 rounded-full ${
                                                        signal.project.status === 'ACTIVE' ? 'bg-status-pending animate-pulse' :
                                                        signal.project.status === 'COMPLETED' ? 'bg-brand-primary' : 'bg-status-error'
                                                    }`} />
                                                    Project — {signal.project.status}
                                                </div>
                                                {/* Role Badge */}
                                                {signal.project.providers && signal.project.providers.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 justify-center">
                                                        {signal.project.providers.map((entry, idx) => {
                                                            const isCurrentProvider = entry.provider?.id === bid.providerId;
                                                            const roleLabel = entry.role === 'LEAD' ? 'LEAD' : 'COLLABORATOR';
                                                            return (
                                                                <span
                                                                    key={idx}
                                                                    className={`text-caption-dense font-bold uppercase tracking-widest px-2.5 py-1 rounded-interactive border ${
                                                                        isCurrentProvider
                                                                            ? 'bg-status-info/10 text-status-info border-status-info/20'
                                                                            : 'bg-surface-elevated/40 text-text-secondary border-border-subtle/50'
                                                                    }`}
                                                                >
                                                                    ROLE: {roleLabel}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        ) :
                                        bid.status === 'ACCEPTED' ? (
                                            <div className="w-full text-center px-4 py-3 rounded-panel font-bold text-xs tracking-wider bg-brand-primary/10 text-brand-success border border-brand-primary/30 uppercase select-none">
                                                Proposal Accepted / Contract Ongoing
                                            </div>
                                        ) :
                                        bid.status === 'REJECTED' ? (
                                            <div className="w-full text-center px-4 py-3 rounded-panel font-bold text-xs tracking-wider bg-surface-background text-text-muted border border-border-default uppercase select-none">
                                                Proposal Declined
                                            </div>
                                        ) :
                                        // Allow withdrawal if the group project is OPEN or IN_PROGRESS, provided this bid is still PENDING
                                        (signal?.status === 'OPEN' || signal?.status === 'IN_PROGRESS') && bid.status === 'PENDING' ? (
                                            <button
                                                type="button"
                                                onClick={() => removeBid(bid.broadcastId)}
                                                className="w-full text-center px-4 py-3 rounded-panel font-bold text-xs tracking-wider transition-all bg-status-error/20 text-status-error border border-status-error/30 hover:bg-status-error/40 hover:text-text-primary cursor-pointer uppercase"
                                            >
                                                Withdraw Proposal
                                            </button>
                                        ) : (
                                            <div className="w-full text-center px-4 py-3 rounded-panel font-bold text-xs tracking-wider bg-surface-background text-text-tertiary border border-border-default uppercase select-none">
                                                Channel Closed / Stale
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <Pagination
                        postsPerPage={bidsPerPage}
                        totalPosts={myBids.length}
                        paginate={paginate}
                        currentPage={currentPage}
                    />
                </>
            ) : (
                !loading && (
                    <div className="py-16 text-center border border-dashed border-border-default rounded-card bg-surface-background/20">
                        <p className="text-sm font-bold text-text-tertiary tracking-wide">
                            No active proposals found for this provider profile.
                        </p>
                    </div>
                )
            )}
        </div>
    );
}

export default MyActiveBids;
