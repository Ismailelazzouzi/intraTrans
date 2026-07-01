import { Navigate } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth"
import { useSessionManager } from "../hooks/useSessionManager";

export default function ProtectedRoute(){
    const {isAuthenticated, isLoading} = useAuth();
    const { isCheckingInitialSession } = useSessionManager();
    if (isCheckingInitialSession) {
        return (
            <div className="min-h-screen bg-surface-background flex items-center justify-center">
                <p className="text-brand-primary animate-pulse font-mono text-xs uppercase tracking-widest">
                    Synchronizing Secure System State...
                </p>
            </div>
        );
    }
    if (isLoading){
        return (
            <div className="flex justify-center items-center h-screen">
                <h1 className="text-emerald">LOADING...</h1>
            </div>
        );
    }
    else if (!isAuthenticated){
        return (
            <Navigate to="/login" replace />
        );
    }
    return (
        <Outlet />
    );
}