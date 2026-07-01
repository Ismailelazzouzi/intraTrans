import Card from "../../../components/Card"
import AdminUserItem from "../../../components/AdminUserItem";
import ReviewRequestModal from "../../../components/ReviewRequestModal";
import Pagination from "../../../components/Pagination";
import { NOTIFICATION_STYLES } from "../../../_styles/tokens";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useProtectedImage } from "../../../hooks/useProtectedImage";

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    type: string;
}
 
interface Stats {
    provider_count: number;
    provider_ratio: number;
    users_pending_count: number;
    client_count: number;
    completed_projects: number;
}

interface Logs {
    action: 'PROVIDER_APPROVED' | 'PROVIDER_REJECTED' | 'USER_PROMOTED_TO_ADMIN' | 'USER_DELETED' | 'PROVIDER_REMOVED';
    performedBy: string;
    targetId: string | null;
    createdAt: string;
}

function AdminDashboard({...user}) {
    const [users, setUsers] = useState<User[]>([]);
    const [admins, setAdmins] = useState<User[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [search, setSearch] = useState("");
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [reviewUserId, setReviewUserId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState("ALL");
    const [logs, setLogs] = useState<Logs[]>([]);
    const [isLoadingLogs, setisLoadingLogs] = useState(true);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage] = useState(6);
    const imageSrc = useProtectedImage(user.imageUrl);
 
    const fetchStats = async () => {
        setIsLoadingStats(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/dashboard/stats`, {
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to fetch stats");
            const data = await res.json();
            setStats(data)
        } catch (err) {
            console.error("Error fetching stats:", err);
            setNotification({ message: "Failed to load stats.", type: 'error' });
            setTimeout(() => setNotification(null), 4000);
        } finally {
            setIsLoadingStats(false);
        }
    };
    const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/dashboard/users`, {
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to fetch users");
            const data = await res.json();
            setUsers(data.data.users);
        } catch (err) {
            console.error("Error fetching users:", err);
            setNotification({ message: "Failed to load users.", type: 'error' });
            setTimeout(() => setNotification(null), 4000);
        } finally {
            setIsLoadingUsers(false);
        }
    };
    const fetchAdmins = async () => {
        setIsLoadingUsers(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/dashboard/admins`, {
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to fetch admins");
            const data = await res.json();
            setAdmins(data.data.admins);
        } catch (err) {
            console.error("Error fetching admins:", err);
            setNotification({ message: "Failed to load admins.", type: 'error' });
            setTimeout(() => setNotification(null), 4000);
        } finally {
            setIsLoadingUsers(false);
        }
    };
    const fetchLogs = async () => {
        setisLoadingLogs(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/dashboard/logs`, {
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to fetch admins");
            const data = await res.json();
            setLogs(data.data.logs);
        } catch (err) {
            console.error("Error fetching logs:", err);
            setNotification({ message: "Failed to load audit logs.", type: 'error' });
            setTimeout(() => setNotification(null), 4000);
        } finally {
            setisLoadingLogs(false);
        }
    };
    const getAdminName = (adminId: string) => {
        const admin = admins.find(a => a.id === adminId);
        return admin ? `${admin.firstName} ${admin.lastName}` : 'System/Unknown';
    };
    const getTargetName = (targetId: string | null) => {
        if (!targetId) return 'N/A';
        const target = users.find(u => u.id === targetId) || admins.find(a => a.id === targetId);
        return target ? `${target.firstName} ${target.lastName}` : 'Deleted User';
    };
    useEffect(() => {
        fetchAdmins();
        fetchStats();
        fetchUsers();
        if (user.type === 'ROOT') {
            fetchLogs();
        }
    }, [user.type]);
    let selectedUsers: User[] = [];
    if (activeFilter === 'ALL')
        selectedUsers = users;
    else if (activeFilter === 'PENDING' || activeFilter === 'CLIENT' || activeFilter === 'PROVIDER')
        selectedUsers = users.filter((userr) => userr.type === activeFilter);
    else if (activeFilter === 'ADMIN')
        selectedUsers = admins;
    const filtered = selectedUsers.filter((u) => {
    const searchTerm = search.toLowerCase();
        return (
            u.firstName.toLowerCase().includes(searchTerm) ||
            u.lastName.toLowerCase().includes(searchTerm) ||
            u.email.toLowerCase().includes(searchTerm)
        );
    });

    // Pagination logic
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filtered.slice(indexOfFirstUser, indexOfLastUser);
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    const handleStatusUpdate = async (id : string, status : string) => {
        if (!window.confirm(`Are you sure you want to ${status === 'PROVIDER' ? 'ACCEPT' : 'REJECT'} this provider?`))
            return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/dashboard/users/${id}/check/review`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: status === 'PROVIDER' ? 'ACCEPTED' : 'REJECTED' })
            });

            if (res.ok) {
                setReviewUserId(null);
                fetchUsers();
                fetchStats();
                fetchLogs();
                setNotification({ message: "Status updated successfully.", type: 'success' });
                setTimeout(() => setNotification(null), 3000);
            } else {
                const errData = await res.json().catch(() => ({}));
                setNotification({ message: errData.message || "Failed to update status.", type: 'error' });
                setTimeout(() => setNotification(null), 4000);
            }
        } catch (err) {
            console.error("Failed to update status", err);
            setNotification({ message: "Failed to update status.", type: 'error' });
            setTimeout(() => setNotification(null), 4000);
        }
    }
    const makeAdmin = async (thisUser: User) => {
        if (!window.confirm(`Are you sure you want to promote ${thisUser.firstName} ${thisUser.lastName} to admin?`))
            return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/dashboard/users/${thisUser.id}/becomeAdmin`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            if (res.ok) {
                fetchUsers();
                fetchStats();
                fetchAdmins()
                fetchLogs();
                setNotification({ message: "User promoted to admin successfully.", type: 'success' });
                setTimeout(() => setNotification(null), 3000);
            } else {
                const errData = await res.json().catch(() => ({}));
                setNotification({ message: errData.message || "Failed to promote user.", type: 'error' });
                setTimeout(() => setNotification(null), 4000);
            }
        } catch (err) {
            console.error('failed to promote to admin', err);
            setNotification({ message: "Failed to promote user.", type: 'error' });
            setTimeout(() => setNotification(null), 4000);
        }
    }
    const removeProvider = async (thisUser: User) => {
        if (!window.confirm(`Are you sure you want to remove ${thisUser.firstName} ${thisUser.lastName} as a provider?`))
            return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/dashboard/providers/${thisUser.id}/delete`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            if (res.ok) {
                fetchUsers();
                fetchStats();
                fetchLogs();
                setNotification({ message: "Provider removed successfully.", type: 'success' });
                setTimeout(() => setNotification(null), 3000);
            } else {
                const errData = await res.json().catch(() => ({}));
                setNotification({ message: errData.message || "Failed to remove provider.", type: 'error' });
                setTimeout(() => setNotification(null), 4000);
            }
        } catch (err) {
            console.error('failed to remove provider', err);
            setNotification({ message: "Failed to remove provider.", type: 'error' });
            setTimeout(() => setNotification(null), 4000);
        }
    }
    const deleteUser = async (thisUser: User) => {
        if (!window.confirm('are you sure you want to delete this user?'))
            return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/dashboard/users/${thisUser.id}/delete`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            if (res.ok) {
                fetchUsers();
                fetchStats();
                fetchAdmins()
                fetchLogs();
                setNotification({ message: "User deleted successfully.", type: 'success' });
                setTimeout(() => setNotification(null), 3000);
            } else {
                const errData = await res.json().catch(() => ({}));
                setNotification({ message: errData.message || "Failed to delete user.", type: 'error' });
                setTimeout(() => setNotification(null), 4000);
            }
        } catch (err) {
            console.error('failed to delete user', err);
            setNotification({ message: "Failed to delete user.", type: 'error' });
            setTimeout(() => setNotification(null), 4000);
        }
    }
  return (
      <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3">
              {notification && (
                <div className={`mb-4 px-4 py-3 rounded-panel text-sm font-medium tracking-wide animate-fade-in ${NOTIFICATION_STYLES[notification.type]}`}>
                    {notification.message}
                </div>
            )}
          <div className="flex items-center gap-3">
                  <Link to='/profile' className="h-12 w-12 rounded-full overflow-hidden flex items-center justify-center bg-surface-elevated border border-border-subtle text-text-primary font-sm cursor-pointer hover:border-brand-primary shrink-0">
                            {user.imageUrl && imageSrc ? (
                                <img src={imageSrc} alt={`${user.firstName} ${user.lastName}`} className="h-full w-full object-cover" />
                            ) : (
                                <>{user.firstName?.[0]?.toUpperCase() ?? '?'}{user.lastName?.[0]?.toUpperCase() ?? '?'}</>
                            )}
                        </Link>
                  <div className="flex flex-col gap-1 min-w-0">
                      <h1 className="text-text-primary font-medium truncate">WELCOME BACK, {user.firstName} {user.lastName}</h1>
                      <span className="w-fit bg-brand-primary/10 border-brand-primary/20 text-text-primary px-2 py-0.5 text-xs uppercase tracking-wider rounded-md">{user.type}</span>
                  </div>
              </div>
              <div className="relative mt-10">
                    <input 
                        type="text" 
                        placeholder="Search users by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-surface-elevated border border-border-subtle rounded-panel px-4 py-3 text-text-primary focus:border-brand-primary outline-none transition-all"
                    />
              </div>
              <div className="mt-10 flex flex-col gap-5 bg-surface-panel/50 border border-border-default rounded-card overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <label className="relative cursor-pointer">
                            <input onChange={() => setActiveFilter("ALL")} readOnly checked={activeFilter === "ALL"} type="radio" name="userType" value="ALL" className="peer hidden"/>
                            <div className="flex flex-col items-center justify-center p-4 border-2 border-border-subtle rounded-panel bg-surface-overlay text-text-secondary transition-all peer-checked:border-brand-primary peer-checked:text-text-primary peer-checked:bg-brand-primary/10">
                                <span className="font-semibold text-sm">ALL</span>
                            </div>
                        </label>
                        <label className="relative cursor-pointer">
                            <input onChange={() => setActiveFilter("PENDING")} readOnly checked={activeFilter === "PENDING"} type="radio" name="userType" value="PENDING" className="peer hidden" />
                            <div className="flex flex-col items-center justify-center p-4 border-2 border-border-subtle rounded-panel bg-surface-overlay text-text-secondary transition-all peer-checked:border-brand-primary peer-checked:text-text-primary peer-checked:bg-brand-primary/10">
                                <span className="font-semibold text-sm">PENDING</span>
                            </div>
                        </label>
                        <label className="relative cursor-pointer">
                            <input onChange={() => setActiveFilter("CLIENT")} readOnly checked={activeFilter === "CLIENT"} type="radio" name="userType" value="CLIENT" className="peer hidden" />
                            <div className="flex flex-col items-center justify-center p-4 border-2 border-border-subtle rounded-panel bg-surface-overlay text-text-secondary transition-all peer-checked:border-brand-primary peer-checked:text-text-primary peer-checked:bg-brand-primary/10">
                                <span className="font-semibold text-sm">CLIENTS</span>
                            </div>
                        </label>
                        <label className="relative cursor-pointer">
                            <input onChange={() => setActiveFilter("PROVIDER")} readOnly checked={activeFilter === "PROVIDER"} type="radio" name="userType" value="PROVIDER" className="peer hidden" />
                            <div className="flex flex-col items-center justify-center p-4 border-2 border-border-subtle rounded-panel bg-surface-overlay text-text-secondary transition-all peer-checked:border-brand-primary peer-checked:text-text-primary peer-checked:bg-brand-primary/10">
                                <span className="font-semibold text-sm">PROVIDERS</span>
                            </div>
                        </label>
                        <label className="relative cursor-pointer">
                            <input onChange={() => setActiveFilter("ADMIN")} readOnly checked={activeFilter === "ADMIN"} type="radio" name="userType" value="ADMIN" className="peer hidden" />
                            <div className="flex flex-col items-center justify-center p-4 border-2 border-border-subtle rounded-panel bg-surface-overlay text-text-secondary transition-all peer-checked:border-brand-primary peer-checked:text-text-primary peer-checked:bg-brand-primary/10">
                                <span className="font-semibold text-sm">ADMINS</span>
                            </div>
                        </label>
                    </div>
                    {isLoadingUsers ? (
                        <h1 className="text-text-primary px-4 pb-4">LOADING USERS...</h1>
                    ) : currentUsers.length > 0 ? (
                        <>
                            {currentUsers.map((aUser) => (
                                <AdminUserItem key={aUser.id} removeProvider={removeProvider} deleteUser={deleteUser} makeAdmin={makeAdmin} owner={user} onReview={() => {setReviewUserId(aUser.id)}} {...aUser} />
                            ))}
                            <div className="px-4 pb-4">
                                <Pagination
                                    postsPerPage={usersPerPage}
                                    totalPosts={filtered.length}
                                    paginate={paginate}
                                    currentPage={currentPage}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="py-16 text-center border border-dashed border-border-default rounded-card bg-surface-background/20 mx-4 mb-4">
                            <p className="text-sm font-bold text-text-tertiary tracking-wide">
                                No users match your search criteria.
                            </p>
                        </div>
                    )}
              </div>
          </div>{isLoadingStats ? <h1 className="text-text-primary">LOADING STATS...</h1> :
          <div className="lg:w-1/3 flex flex-col gap-10">
              <Card>
                  <p className="text-text-secondary text-xs uppercase tracking-widest">Clients</p>
                  <h2 className="text-text-primary text-2xl font-bold mt-1">{stats?.client_count ?? 5} Clients</h2>
              </Card>

              <Card>
                  <p className="text-text-secondary text-xs uppercase tracking-widest">Active Marketplace</p>
                  <h2 className="text-text-primary text-2xl font-bold mt-1">{stats?.provider_count ?? 5} Providers</h2>
                  <div className="text-brand-success text-xs mt-2">↑ {(stats?.provider_ratio ?? 5).toFixed(2)}% this month</div>
              </Card>
                
              <Card>
                  <p className="text-text-secondary text-xs uppercase tracking-widest">Approval Queue</p>
                  <h2 className="text-text-primary text-2xl font-bold mt-1">{stats?.users_pending_count ?? 5} Pending</h2>
                  <p className="text-status-pending text-xs mt-2">Requires immediate review</p>
              </Card>

              <Card>
                  <p className="text-text-secondary text-xs uppercase tracking-widest">Completed Projects</p>
                  <h2 className="text-text-primary text-2xl font-bold mt-1">{stats?.completed_projects ?? 5} Completed</h2>
                  <p className="text-status-pending text-xs mt-2">successful transactions between clients and providers</p>
              </Card>
              <Card>
                {user.type !== 'ROOT' && <h1 className="text-text-primary font-medium">LOGS ARE ROOT ONLY</h1>}
                {
                   user.type === 'ROOT' && (isLoadingLogs ? <h1 className="text-text-primary font-medium">LOADING LOGS...</h1>
                    :
                    <>
                    <p className="text-text-secondary text-xs uppercase tracking-widest">Audit Logs</p>
                    <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {logs.length === 0 ? (
                            <p className="text-text-tertiary text-sm italic">No audit entries found</p>
                        ) : (
                            [...logs].reverse().map((log, index) => (
                                <div key={index} className="border-l-2 border-brand-primary pl-2 py-1">
                                    <p className="text-text-primary text-sm font-bold uppercase tracking-tight">
                                        {log.action.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-text-secondary text-sm">
                                        By: {getAdminName(log.performedBy)}
                                    </p>
                                    <p className="text-text-secondary text-sm">
                                        To: {getTargetName(log.targetId)}
                                    </p>
                                    <p className="text-text-tertiary text-xs">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                    </>
                )}
                </Card>
          </div>
          }
          {reviewUserId && <ReviewRequestModal userId={reviewUserId} onClose={() => setReviewUserId(null)} onStatusUpdate={handleStatusUpdate} />}
      </div>
  )
}

export default AdminDashboard
