import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import type { User } from "../../_types/user.types";
import SwitchCard from "../../components/SwitchCard";
import AdminDashboard from "./AdminDashboard/AdminDashboard";
import Button from "../../components/Button";
import { useNavigate } from "react-router-dom";
import { useProtectedImage } from "../../hooks/useProtectedImage";
import { Link } from "react-router-dom";
import ProviderDashboard from "./ProviderDashboard/ProviderDashboard";
import DashboardSearchFilter from "../../components/DashboardSearchFilter";
import ProviderShowcaseCard from "../../components/ProviderShowcaseCard";
import Pagination from "../../components/Pagination";


export default function Dashboard() {
    const { user } = useAuth();
    if (user?.type === 'ROOT' || user?.type === 'ADMIN')
        return <AdminDashboard {...user}/>
    const navigate = useNavigate();

    // ── Provider Discovery (CLIENT / PENDING only) ──────────────────────────
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState("ALL");
    const [isLoadingProviders, setIsLoadingProviders] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [providersPerPage] = useState(6);

    // ── Fetch full profile to populate imageUrl (for ALL non-admin users) ──
    const [profileImageUrl, setProfileImageUrl] = useState<string | null | undefined>(user?.imageUrl);

    useEffect(() => {
        if (!user?.id) return;

        const fetchProfile = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/users/${user.id}`, {
                    credentials: "include",
                });
                if (!res.ok) throw new Error("Failed to fetch profile");
                const data = await res.json();
                const imgUrl = data.data?.imageUrl ?? null;
                setProfileImageUrl(imgUrl);
            } catch {
                // Fall back to auth context's imageUrl
                setProfileImageUrl(user?.imageUrl ?? null);
            }
        };

        fetchProfile();
    }, [user?.id]);

    const imageSrc = useProtectedImage(profileImageUrl ?? user?.imageUrl);

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoadingProviders(true);
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
                    credentials: "include",
                });
                if (!res.ok) throw new Error("Failed to fetch users");
                const data = await res.json();
                setAllUsers(data.data || data.users || []);
            } catch (err) {
                console.error("Error fetching users:", err);
                setFetchError("Failed to load providers. Please refresh.");
                setTimeout(() => setFetchError(null), 4000);
            } finally {
                setIsLoadingProviders(false);
            }
        };

        if (user?.type === 'CLIENT' || user?.type === 'PENDING') {
            fetchUsers();
        }
    }, [user?.type]);

    // Isolate only PROVIDER-type users
    const providers = allUsers.filter((u) => u.type === "PROVIDER");

    // Extract unique professions from the provider list
    const professions = Array.from(
        new Set(
            providers
                .map((p) => p.provider?.profession)
                .filter((p): p is string => p !== null && p !== undefined)
        )
    ).sort();

    // Dual-layered filtering: search keyword + profession filter
    const filteredProviders = providers.filter((p) => {
        const searchTerm = search.toLowerCase();
        
        // Use optional chaining and fallback empty strings to secure the values
        const firstName = p?.firstName?.toLowerCase() || "";
        const lastName = p?.lastName?.toLowerCase() || "";
        const email = p?.email?.toLowerCase() || "";
        const profession = p?.provider?.profession?.toLowerCase() || "";

        const matchesSearch =
            firstName.includes(searchTerm) ||
            lastName.includes(searchTerm) ||
            email.includes(searchTerm) ||
            profession.includes(searchTerm);

        const matchesProfession =
            activeFilter === "ALL" || p?.provider?.profession === activeFilter;

        return matchesSearch && matchesProfession;
    });

    const indexOfLastProvider = currentPage * providersPerPage;
    const indexOfFirstProvider = indexOfLastProvider - providersPerPage;
    const currentProviders = filteredProviders.slice(indexOfFirstProvider, indexOfLastProvider);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
    return (
        <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-2/3">                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex gap-3 items-center">
                        <Link to='/profile' className="h-12 w-12 rounded-full overflow-hidden flex items-center justify-center bg-surface-elevated border border-border-subtle text-text-primary font-sm cursor-pointer hover:border-brand-primary shrink-0">
                            {(profileImageUrl ?? user?.imageUrl) && imageSrc ? (
                                <img src={imageSrc} alt={`${user?.firstName} ${user?.lastName}`} className="h-full w-full object-cover" />
                            ) : (
                                <>{user?.firstName?.[0]?.toUpperCase() ?? '?'}{user?.lastName?.[0]?.toUpperCase() ?? '?'}</>
                            )}
                        </Link>
                        <div className="flex flex-col gap-1 min-w-0">
                            <h1 className="text-text-primary font-medium truncate">WELCOME BACK, {user?.firstName} {user?.lastName}</h1>
                            <span className="w-fit bg-brand-primary/10 border-brand-primary/20 text-text-primary px-2 py-0.5 text-xs uppercase tracking-wider rounded-md">{user?.type}</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {(user?.type === 'CLIENT' || user?.type === 'PENDING') && <Button label="Make a Broadcast" variant="primary" disabled={false} onClick={() => {navigate('/broadCast')}}/>}
                        <Button label="Open ChatRoom" variant="primary" disabled={false} onClick={() => {navigate('/chatroom')}}/>
                    </div>
                </div>

                {/* ⚠️ PENDING-USER WARNING CARD */}
                {user?.type === 'PENDING' && (
                    <div className="mt-6 px-5 py-4 rounded-panel bg-status-pending/10 border border-status-pending/20 animate-fade-in">
                        <div className="flex items-start gap-3">
                            <span className="text-status-pending text-lg shrink-0 mt-0.5">⚠️</span>
                            <div className="flex flex-col gap-1">
                                <p className="text-status-pending font-semibold text-sm uppercase tracking-wide">
                                    Application Under Review
                                </p>
                                <p className="text-text-secondary text-sm leading-relaxed">
                                    While your account is under review, you won't be able to send proposals, accept projects, or access provider-only features. You'll gain full provider capabilities once an admin approves your application. some client actions won't be available too untill an admin rejects or accepts your provider application
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {user?.type === 'PROVIDER' && <ProviderDashboard />}

                {/* Provider Discovery — shown for CLIENT / PENDING users */}
                {(user?.type === 'CLIENT' || user?.type === 'PENDING') && (
                    <div className="mt-10">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary">Discover Providers</h2>
                            <p className="text-text-secondary text-sm mt-1">
                                Find verified specialists and professionals for your next project.
                            </p>
                        </div>

                        {fetchError && (
                            <div className="mb-4 px-4 py-3 rounded-panel bg-status-error/10 border border-status-error/30 text-status-error text-sm font-medium animate-fade-in">
                                {fetchError}
                            </div>
                        )}
                        <DashboardSearchFilter
                            search={search}
                            onSearchChange={setSearch}
                            activeFilter={activeFilter}
                            onFilterChange={setActiveFilter}
                            professions={professions}
                        />

                        <div className="mt-8">
                            {isLoadingProviders ? (
                                <div className="flex items-center justify-center py-20">
                                    <p className="text-brand-success text-sm animate-pulse font-bold tracking-wider uppercase">
                                        Loading providers...
                                    </p>
                                </div>
                            ) : currentProviders.length > 0 ? (
                                <div className="flex flex-col gap-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {currentProviders.map((provider) => (
                                            <ProviderShowcaseCard
                                                key={provider.id}
                                                provider={provider}
                                            />
                                        ))}
                                    </div>
                                    <Pagination
                                        postsPerPage={providersPerPage}
                                        totalPosts={filteredProviders.length}
                                        paginate={paginate}
                                        currentPage={currentPage}
                                    />
                                </div>
                            ) : providers.length === 0 ? (
                                <div className="py-16 text-center border border-dashed border-border-default rounded-card bg-surface-background/20">
                                    <p className="text-sm font-bold text-text-tertiary tracking-wide">
                                        No providers are currently registered on the platform.
                                    </p>
                                </div>
                            ) : (
                                <div className="py-16 text-center border border-dashed border-border-default rounded-card bg-surface-background/20">
                                    <p className="text-sm font-bold text-text-tertiary tracking-wide">
                                        No providers match your current search criteria.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                )}
            </div>
            <div className="lg:w-1/3">
                <SwitchCard />
            </div>
        </div>
    );
}