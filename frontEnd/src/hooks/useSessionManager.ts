import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { socket } from "../utils/socket";

export function useSessionManager() {
    const [isCheckingInitialSession, setIsCheckingInitialSession] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const executeSessionRotation = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (!response.ok) {
                    window.location.href = "/login";
                }
            } catch (error) {
                console.error("Automated background session synchronization failed:", error);
            }
        };
        if (user) {
            setIsCheckingInitialSession(false);
            if (!socket.connected)
            {
                socket.connect();
            }
        } else {
            executeSessionRotation().finally(() => {
                setIsCheckingInitialSession(false);
            });
        }
        const backgroundDaemon = setInterval(executeSessionRotation, 14 * 60 * 1000);
        return () => {
            clearInterval(backgroundDaemon);
            if (socket.connected)
            {
                socket.disconnect();
            }
        }
    }, [user]);

    return { isCheckingInitialSession };
}