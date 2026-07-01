import type { User } from "./user.types";

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loginUser(user: User): void;
    logout(): void;
    isLoading: boolean;
    refreshUser: any;
}
