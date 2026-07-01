import { createContext, useEffect, useState } from "react";
import { type ReactNode } from "react";

import type { User } from "../_types/user.types";
import type { AuthContextType } from "../_types/auth.types";
import { authService } from "./authService";
import { socket } from "../utils/socket";


export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode })
{
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setLoading] = useState<boolean>(true);
    const isAuthenticated = !!user; 

    const loginUser = (user: User) => {
        setUser(user);
        localStorage.setItem('hasSession', 'true');
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error("Backend logout failed", error);
        } finally {
            localStorage.removeItem('userData');
            localStorage.removeItem('hasSession');
            socket.disconnect();
            setUser(null);
        }
    }

    const initialize = async () => {
    if (!localStorage.getItem('hasSession')) {
        if (window.location.pathname === '/auth/callback') {
            try {
                const res = await authService.me();
                setUser(res.data);
                localStorage.setItem('hasSession', 'true');
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
            return;
        }
        setLoading(false);
        return;
    }
    try {
        const res = await authService.me();
        setUser(res.data);
    } catch (err) {
        try {
            await authService.refresh();
            const retry = await authService.me();
            setUser(retry.data);
        } catch {
            localStorage.removeItem('hasSession');
            setUser(null);
        }
    } finally {
        setLoading(false);
    }
};

    useEffect(() => {
        initialize();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loginUser, logout, isLoading, refreshUser: initialize }}>
            { children }
        </AuthContext.Provider>
    );
}