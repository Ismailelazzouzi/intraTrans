import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import type { BroadCast, BroadCastResponse } from "../_types/broadCast.types";
import ProposalViewerModal from "./ProposalViewerModal";
import { socket } from "../utils/socket";
import Button from "./Button";
import Pagination from "./Pagination";
import { NOTIFICATION_STYLES } from "../_styles/tokens";

function MyBroadcasts() {
    const navigate = useNavigate();
    const [myBroadCasts, setMyBroadCasts] = useState<BroadCast[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeReviewJobId, setActiveReviewJobId] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [broadCastsPerPage] = useState(4);

    const fetchMyBroadCasts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/broadcasts/my`, {
                credentials: "include"
            })
            if (!res.ok)
                throw new Error("Failed to fetch your broadcasts");
            const response = await res.json();
            setMyBroadCasts(response.data);
        } catch (err) {
            console.error("Error loading personal broadcasts:", err);
            setNotification({ message: "Failed to load broadcasts. Please refresh.", type: 'error' });
            setTimeout(() => setNotification(null), 4000);
        } finally {
            setLoading(false);
        }
    }

    const handleAcceptProviderProposal = async (responseId: string, broadcastId: string) => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/broadcasts/${broadcastId}/confirm/${responseId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to confirm selected provider.");
        }

        setActiveReviewJobId(null);
        fetchMyBroadCasts();
        setNotification({ message: "Provider confirmed successfully!", type: 'success' });
        setTimeout(() => setNotification(null), 3000);
    };

    const closeBroadCast = async (id: string | undefined) => {
        if (!id) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/broadcasts/${id}/close`, {
                method: 'PUT',
                credentials: 'include'
            });
            if (!res.ok) throw new Error("Could not close channel.");
            fetchMyBroadCasts();
            setNotification({ message: "Broadcast channel successfully closed.", type: 'success' });
            setTimeout(() => setNotification(null), 3000);
        } catch (err) {
            console.error(err);
            setNotification({ message: "Failed to close broadcast.", type: 'error' });
            setTimeout(() => setNotification(null), 4000);
        }
    }

    const handleCompleteProject = async (projectId: string | undefined, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!projectId) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}/complete`, {
                method: 'PUT',
                credentials: 'include'
            });
            if (!res.ok) throw new Error("Failed to complete project.");
            await fetchMyBroadCasts();
            setNotification({ message: "Project completed successfully!", type: 'success' });
            setTimeout(() => setNotification(null), 3000);
        } catch (err) {
            console.error("Project completion error:", err);
            setNotification({ message: "Failed to complete project.", type: 'error' });
            setTimeout(() => setNotification(null), 4000);
        }
    };

    const handleCancelProject = async (projectId: string | undefined, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!projectId) return;
        const confirmed = window.confirm("Are you sure you want to cancel this project assignment? This action cannot be undone.");
        if (!confirmed) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}/cancel`, {
                method: 'PUT',
                credentials: 'include'
            });
            if (!res.ok) throw new Error("Failed to cancel project.");
            await fetchMyBroadCasts();
            setNotification({ message: "Project cancelled successfully.", type: 'success' });
            setTimeout(() => setNotification(null), 3000);
        } catch (err) {
            console.error("Project cancellation error:", err);
            setNotification({ message: "Failed to cancel project.", type: 'error' });
            setTimeout(() => setNotification(null), 4000);
        }
    };

    const cancelBroadCast = async (id: string | undefined) => {
        if (!id) return;
        const confirmCancel = window.confirm("Are you sure you want to cancel this broadcast? This action cannot be undone.");
        if (!confirmCancel) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/broadcasts/${id}/cancel`, {
                method: 'PUT',
                credentials: 'include'
            });
            if (!res.ok)
                throw new Error("Backend failed to process channel cancellation.");
            fetchMyBroadCasts();
            setNotification({ message: "Broadcast signal successfully cancelled.", type: 'success' });
            setTimeout(() => setNotification(null), 3000);
        } catch (err) {
            console.error("Failed to cancel broadcast channel:", err);
            setNotification({ message: "Failed to cancel broadcast.", type: 'error' });
            setTimeout(() => setNotification(null), 4000);
        }
    }

    useEffect(() => {
        fetchMyBroadCasts();
    }, [])
    useEffect(() => {
        if (!socket.connected) {
            socket.connect();
        }
        const handleNewResponse = (newResponse: BroadCastResponse) => {
            console.log("[Socket] Received new real-time response:", newResponse);
            setMyBroadCasts((prevBroadcasts: BroadCast[]) => {
                return prevBroadcasts.map((broadcast) => {
                    if (broadcast.id !== newResponse.broadcastId) {
                        return broadcast;
                    }
                    const currentResponses = broadcast.responses || [];
                    const isDuplicate = currentResponses.some((r) => r.id === newResponse.id);
                    if (isDuplicate) {
                        return broadcast;
                    }
                
                    return {
                        ...broadcast,
                        responses: [...currentResponses, newResponse],
                    };
                });
            });
        };
        const handleBroadcastCancelled = (payload: { broadcastId: string }) => {
            console.log("[Socket] Received broadcast cancellation:", payload);
            setMyBroadCasts((prevBroadcasts: BroadCast[]) => {
                return prevBroadcasts.map((broadcast) => {
                    if (broadcast.id !== payload.broadcastId) {
                        return broadcast;
                    }
                    return {
                        ...broadcast,
                        status: 'CANCELLED'
                    };
                });
            });
        };

        const handleBroadcastClosed = (payload: { broadcastId: string }) => {
            console.log("[Socket] Received broadcast closure:", payload);
            setMyBroadCasts((prevBroadcasts: BroadCast[]) => {
                return prevBroadcasts.map((broadcast) => {
                    if (broadcast.id !== payload.broadcastId) {
                        return broadcast;
                    }
                    return {
                        ...broadcast,
                        status: 'CLOSED'
                    };
                });
            });
        };

        const handleProjectCompleted = (payload: { projectId: string }) => {
            console.log("[Socket] Received project completion:", payload);
            setMyBroadCasts((prevBroadcasts: BroadCast[]) => {
                const hasMatchingProject = prevBroadcasts.some(
                    (b) => b.project?.id === payload.projectId
                );
                if (hasMatchingProject) {
                    fetchMyBroadCasts();
                }
                return prevBroadcasts;
            });
        };

        const handleProjectCancelled = (payload: { projectId: string }) => {
            console.log("[Socket] Received project cancellation:", payload);
            setMyBroadCasts((prevBroadcasts: BroadCast[]) => {
                const hasMatchingProject = prevBroadcasts.some(
                    (b) => b.project?.id === payload.projectId
                );
                if (hasMatchingProject) {
                    fetchMyBroadCasts();
                }
                return prevBroadcasts;
            });
        };

        const handleProviderWithdrawn = (payload: { broadcastId: string; providerId: string }) => {
            console.log("[Socket] Provider withdrew response:", payload);
            setMyBroadCasts((prevBroadcasts: BroadCast[]) => {
                return prevBroadcasts.map((broadcast) => {
                    if (broadcast.id !== payload.broadcastId) {
                        return broadcast;
                    }
                    return {
                        ...broadcast,
                        responses: (broadcast.responses || []).filter(
                            (r) => r.providerId !== payload.providerId
                        ),
                    };
                });
            });
        };
    
        socket.on("new-response", handleNewResponse);
        socket.on("broadcast-cancelled", handleBroadcastCancelled);
        socket.on("broadcast-closed", handleBroadcastClosed);
        socket.on("project-completed", handleProjectCompleted);
        socket.on("project-cancelled", handleProjectCancelled);
        socket.on("response-withdrawn", handleProviderWithdrawn);
        return () => {
            socket.off("new-response", handleNewResponse);
            socket.off("broadcast-cancelled", handleBroadcastCancelled);
            socket.off("broadcast-closed", handleBroadcastClosed);
            socket.off("project-completed", handleProjectCompleted);
            socket.off("project-cancelled", handleProjectCancelled);
            socket.off("response-withdrawn", handleProviderWithdrawn);
        };
    }, []);
    useEffect(() => {
        if (myBroadCasts.length === 0)
            return;
        myBroadCasts.forEach((b) => {
            if (b.id)
                socket.emit('join-broadcast', b.id);
        });
        return () => {
            myBroadCasts.forEach((b) => {
                if (b.id)
                    socket.emit('leave-broadcast', b.id);
            });
        };
    }, [myBroadCasts]);
    
    const currentOpenJob = myBroadCasts.find(b => b.id === activeReviewJobId) || null;

    // Pagination logic
    const indexOfLastBroadCast = currentPage * broadCastsPerPage;
    const indexOfFirstBroadCast = indexOfLastBroadCast - broadCastsPerPage;
    const currentBroadCasts = myBroadCasts.slice(indexOfFirstBroadCast, indexOfLastBroadCast);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    return (
        <div className="p-6">
            {loading && (
                <div className="mb-6">
                    <h1 className="text-brand-success font-medium tracking-wider animate-pulse text-sm">
                        SYNCHRONIZING MANAGEMENT CHANNELS...
                    </h1>
                </div>
            )}

            {notification && (
                <div className={`mb-4 px-4 py-3 rounded-panel text-sm font-medium tracking-wide animate-fade-in ${NOTIFICATION_STYLES[notification.type]}`}>
                    {notification.message}
                </div>
            )}

            {myBroadCasts.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {currentBroadCasts.map((signal) => {
                            const acceptedCount = signal.responses?.filter(r => r.status === 'ACCEPTED').length || 0;
                            
                            return (
                                <div key={signal.id} className="bg-surface-panel border border-border-default rounded-card p-6 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h2 className="text-text-primary font-bold text-lg">{signal.title}</h2>
                                            <span className="text-xs font-mono px-2 py-1 rounded bg-surface-background text-text-secondary border border-border-default uppercase tracking-wider">
                                                {signal.type}
                                            </span>
                                        </div>
                                        <p className="text-text-secondary text-sm mt-2 line-clamp-2">{signal.description}</p>
                                        
                                        {signal.type === 'GROUP' && (
                                            <div className="mt-3 text-xs font-semibold text-status-info bg-status-info/10 border border-status-info/30 px-3 py-1.5 rounded-panel inline-block">
                                                Recruits Team: {acceptedCount} / {signal.maxProviders} Slots Secured
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 border-t border-border-default/80 pt-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`h-2 w-2 rounded-full ${
                                                    signal.status === 'OPEN' ? 'bg-brand-success' : 
                                                    signal.status === 'CANCELLED' ? 'bg-status-error' : 'bg-status-pending'
                                                }`} />
                                                <span className="text-text-secondary text-xs font-bold uppercase">{signal.status}</span>
                                            </div>
                                        </div>

                                        {/* Accepted providers for closed / in-progress broadcasts */}
                                        {acceptedCount > 0 && (
                                            <div className="mb-4 space-y-2">
                                                <p className="text-caption-dense font-bold text-text-tertiary uppercase tracking-widest">
                                                    Assigned Provider{acceptedCount > 1 ? 's' : ''}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {signal.responses
                                                        ?.filter(r => r.status === 'ACCEPTED')
                                                        .map((resp) => {
                                                            const providerId = resp.provider?.user?.id;
                                                            const providerName = `${resp.provider?.user?.firstName || 'Unknown'} ${resp.provider?.user?.lastName || 'Provider'}`;
                                                            const profession = resp.provider?.profession || 'Specialist';
                                                            return (
                                                                <div
                                                                    key={resp.id}
                                                                    onClick={() => providerId && navigate(`/profile?id=${providerId}`)}
                                                                    className="flex items-center gap-2 px-3 py-2 rounded-panel bg-surface-elevated/40 border border-border-subtle/50 hover:border-brand-primary/40 hover:bg-surface-elevated/60 transition-all cursor-pointer group"
                                                                >
                                                                    <div className="h-7 w-7 rounded-full bg-surface-elevated border border-border-subtle flex items-center justify-center text-caption-dense font-black text-text-primary uppercase group-hover:border-brand-primary/50 transition-colors">
                                                                        {providerName[0]}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-text-primary text-xs font-bold leading-tight group-hover:text-brand-success transition-colors">
                                                                            {providerName}
                                                                        </p>
                                                                        <p className="text-caption-dense text-brand-success font-bold uppercase leading-tight">
                                                                            {profession}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-2 w-full">
                                            {(signal.status === 'OPEN' || (signal.type === 'GROUP' && signal.status !== 'CLOSED' && signal.status !== 'CANCELLED')) && (
                                                <>
                                                    <button 
                                                        onClick={() => setActiveReviewJobId(signal.id)}
                                                        className="flex-1 text-center px-4 py-2.5 rounded-panel font-bold text-xs transition-all bg-surface-elevated text-text-primary hover:bg-surface-elevated/80 cursor-pointer"
                                                    >
                                                        REVIEW ({signal.responses?.filter(r => r.status === 'PENDING').length || 0})
                                                    </button>
                                                    
                                                    <button 
                                                        onClick={() => cancelBroadCast(signal.id)}
                                                        className="flex-1 text-center px-4 py-2.5 rounded-panel font-bold text-xs transition-all bg-status-error/10 text-status-error border border-status-error/20 hover:bg-status-error/30 hover:text-text-primary cursor-pointer uppercase tracking-wider"
                                                    >
                                                        Cancel Signal
                                                    </button>
                                                </>
                                            )}
                                            {signal.status === 'IN_PROGRESS' && (
                                                <button 
                                                    onClick={() => closeBroadCast(signal.id)}
                                                    className="w-full text-center px-4 py-2.5 rounded-panel font-bold text-xs transition-all bg-brand-primary text-surface-background hover:bg-brand-success cursor-pointer uppercase tracking-wider"
                                                >
                                                    Close Operations
                                                </button>
                                            )}
                                            {signal.status === 'CLOSED' && signal.project ? (
                                                <div className="w-full space-y-3">
                                                    {/* Project Status Badge */}
                                                    <div className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-panel font-bold text-xs uppercase select-none tracking-wider ${
                                                        signal.project.status === 'COMPLETED'
                                                            ? 'bg-brand-success/10 text-brand-success border border-brand-success/30'
                                                            : signal.project.status === 'CANCELLED'
                                                            ? 'bg-surface-elevated/30 text-text-tertiary border border-border-subtle/50'
                                                            : 'bg-surface-elevated/40 text-text-primary border border-border-subtle/60'
                                                    }`}>
                                                        <span className={`h-2 w-2 rounded-full ${
                                                            signal.project.status === 'ACTIVE' ? 'bg-brand-success animate-pulse' :
                                                            signal.project.status === 'COMPLETED' ? 'bg-brand-primary' : 'bg-text-muted'
                                                        }`} />
                                                        Project — {signal.project.status}
                                                        {signal.project.status === 'ACTIVE' && (
                                                            <Button
                                                                label="Go to chatRoom"
                                                                variant="primary" 
                                                                disabled={false} 
                                                                onClick={() => {
                                                                    if (signal.type === 'GROUP') {
                                                                        navigate(`/chatroom?broadcastId=${signal.id}`);
                                                                    } else {
                                                                        const acceptedResponse = signal.responses?.find(r => r.status === 'ACCEPTED');

                                                                        // Use the provider's User ID from the nested provider relation
                                                                        const activeProviderId = acceptedResponse?.provider?.user?.id;

                                                                        if (activeProviderId) {
                                                                            navigate(`/chatroom?targetId=${activeProviderId}`);
                                                                        } else {
                                                                            console.warn("Could not isolate an ACCEPTED provider ID for this broadcast record:", signal);
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                    {/* Action Buttons — only for ACTIVE projects */}
                                                    {signal.project.status === 'ACTIVE' && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={(e) => handleCompleteProject(signal.project?.id, e)}
                                                                className="flex-1 text-center px-4 py-2.5 rounded-panel font-bold text-xs transition-all bg-brand-success/10 text-brand-success hover:bg-brand-primary hover:text-text-primary cursor-pointer uppercase tracking-wider"
                                                            >
                                                                Mark as Complete
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleCancelProject(signal.project?.id, e)}
                                                                className="flex-1 text-center px-4 py-2.5 rounded-panel font-bold text-xs transition-all border border-border-default text-text-secondary hover:bg-status-error/10 hover:text-status-error cursor-pointer uppercase tracking-wider"
                                                            >
                                                                Cancel Project
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : signal.status === 'CLOSED' && acceptedCount > 0 ? (
                                                <div className="w-full text-center px-4 py-2.5 rounded-panel font-bold text-xs bg-brand-primary/10 text-brand-success border border-brand-primary/30 uppercase select-none tracking-wider">
                                                    Closed Job
                                                </div>
                                            ) : null}
                                            {signal.status === 'CANCELLED' && (
                                                <div className="w-full text-center px-4 py-2.5 rounded-panel font-bold text-xs bg-surface-background text-text-muted border border-border-default/80 uppercase select-none tracking-wider">
                                                    Signal Terminated / Voided
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <Pagination
                        postsPerPage={broadCastsPerPage}
                        totalPosts={myBroadCasts.length}
                        paginate={paginate}
                        currentPage={currentPage}
                    />
                </>
            ) : (
                !loading && (
                    <div className="py-12 text-center border border-dashed border-border-default rounded-card">
                        <p className="text-sm font-bold text-text-tertiary">No active signals broadcasted from this account.</p>
                    </div>
                )
            )}
            {currentOpenJob && (
                <ProposalViewerModal 
                    broadcast={currentOpenJob}
                    onClose={() => setActiveReviewJobId(null)}
                    onAcceptProvider={(id) => handleAcceptProviderProposal(id, currentOpenJob.id!)}
                />
            )}
        </div>
    );
}

export default MyBroadcasts;
