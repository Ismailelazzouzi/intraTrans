import { useEffect, useState } from "react"
import type { BroadCast } from "../../../_types/broadCast.types";
import BroadCastCard from "../../../components/BroadCastCard";
import BroadCastResponseModal from "../../../components/BroadCastResponseModal";
import Pagination from "../../../components/Pagination";
import { socket } from "../../../utils/socket";

function ProviderDashboard() {
    const [isLoadingBroadCasts, setIsLoadingBroadCasts] = useState(true);
    const [broadCasts, setBroadCasts] = useState<BroadCast[]>([])
    const [search, setSearch] = useState('');
    const [selectedJob, setSelectedJob] = useState<BroadCast>(null)
    const [error, setError] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1);
    const [broadCastsPerPage] = useState(5);
    const fetchBroadCasts = async () => {
        setIsLoadingBroadCasts(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/broadcasts`, {
                credentials: "include",
            });
            if (!res.ok)
                throw new Error("Failed to fetch admins");
            const data = await res.json();
            setBroadCasts(data.data);
        } catch (err) {
            console.error("Error fetching boradCasts:", err);
            setError("Failed to load broadcasts. Please try again.");
            setTimeout(() => setError(null), 4000);
        } finally {
            setIsLoadingBroadCasts(false);
        }
    };
    useEffect(() => {
        fetchBroadCasts();
    },[])

    useEffect(() => {
        if (!socket.connected)
            socket.connect();
        const handleNewBroadCast = (newSignal: BroadCast) => {
            console.log("[Socket] Received new real-time broadcast:", newSignal);
            setBroadCasts((prevBroadcasts) => {
                if (prevBroadcasts.some(b => b.id === newSignal.id))
                    return prevBroadcasts;
                return [newSignal, ...prevBroadcasts];
            });
        };
        const handleBroadcastCancelled = (payload: { broadcastId: string }) => {
            console.log("[Socket] Job cancelled by client:", payload);
            setBroadCasts((prev) => prev.filter((b) => b.id !== payload.broadcastId));
        };

        const handleBroadcastClosed = (payload: { broadcastId: string }) => {
            console.log("[Socket] Job closed by client:", payload);
            setBroadCasts((prev) => prev.filter((b) => b.id !== payload.broadcastId));
        };


        socket.on("new-broadcast", handleNewBroadCast);
        socket.on("broadcast-cancelled", handleBroadcastCancelled);
        socket.on("broadcast-closed", handleBroadcastClosed);
        return () => {
            socket.off("new-broadcast", handleNewBroadCast);
            socket.off("broadcast-cancelled", handleBroadcastCancelled);
            socket.off("broadcast-closed", handleBroadcastClosed);
        };
    }, [])
    useEffect(() => {
        if (broadCasts.length === 0) return;
        broadCasts.forEach((job) => {
            if (job.id) socket.emit('join-broadcast', job.id);
        });
        return () => {
            broadCasts.forEach((job) => {
                if (job.id) socket.emit('leave-broadcast', job.id);
            });
        };
    }, [broadCasts]);
    const filtered = broadCasts.filter(job =>
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.location?.toLowerCase().includes(search.toLowerCase())
    );

    // Pagination logic
    const indexOfLastBroadCast = currentPage * broadCastsPerPage;
    const indexOfFirstBroadCast = indexOfLastBroadCast - broadCastsPerPage;
    const currentBroadCasts = filtered.slice(indexOfFirstBroadCast, indexOfLastBroadCast);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    return (
    <div className="p-8">
       <div className="mb-8">
                <h1 className="text-2xl font-bold text-text-primary">Available Jobs</h1>
                <p className="text-text-secondary">Scan for requests in your area.</p>
            </div>
       <div className="relative mt-10">
             <input 
                 type="text" 
                 placeholder="Search For Jobs Nearby..."
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-full bg-surface-elevated border border-border-subtle rounded-panel px-4 py-3 text-text-primary focus:border-brand-primary outline-none transition-all"
             />
       </div>
        {error && (
            <div className="mt-4 px-4 py-3 rounded-panel bg-status-error/10 border border-status-error/30 text-status-error text-sm font-medium animate-fade-in">
                {error}
            </div>
        )}
       {isLoadingBroadCasts ? (
            <h1 className="text-text-primary font-medium mt-5">LOADING BROADCASTS...</h1>
       ) : currentBroadCasts.length > 0 ? (
            <>
                {currentBroadCasts.map((broadcast) => (
                    <BroadCastCard key={broadcast.id} broadcast={broadcast} onRespond={() => {setSelectedJob(broadcast)}}/>
                ))}
                <Pagination
                    postsPerPage={broadCastsPerPage}
                    totalPosts={filtered.length}
                    paginate={paginate}
                    currentPage={currentPage}
                />
            </>
       ) : (
            <div className="mt-8 py-16 text-center border border-dashed border-border-default rounded-card bg-surface-background/20">
                <p className="text-sm font-bold text-text-tertiary tracking-wide">
                    No broadcasts match your search criteria.
                </p>
            </div>
       )}
        {selectedJob && (
            <BroadCastResponseModal 
                broadcastId={selectedJob.id!} 
                title={selectedJob.title}
                onClose={() => setSelectedJob(null)}
                onSuccess={() => {
                    fetchBroadCasts();
                }}
            />
        )}
    </div>
    )
}

export default ProviderDashboard
