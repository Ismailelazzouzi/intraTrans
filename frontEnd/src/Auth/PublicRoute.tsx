import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const PublicRoute = () => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return <div className="min-h-screen bg-surface-background" />; 
    }
    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }
    return <Outlet />;
};

export default PublicRoute;