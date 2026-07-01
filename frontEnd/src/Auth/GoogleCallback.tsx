// GoogleCallback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function GoogleCallback() {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        if (isLoading) return;
        if (isAuthenticated) {
            navigate('/dashboard');
        } else {
            navigate('/login?error=callback_error');
        }
    }, [isAuthenticated, isLoading, navigate]);

    return (
        <div className="flex h-[80vh] items-center justify-center text-text-primary">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Syncing with the Hive...</h2>
                <p className="text-text-tertiary">Establishing your secure session.</p>
            </div>
        </div>
    );
}