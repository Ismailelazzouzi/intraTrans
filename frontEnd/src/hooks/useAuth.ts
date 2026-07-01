import { useContext } from "react";
import { AuthContext } from "../Auth/AuthContext"

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined)
        throw ('use auth failed!');
    return context;
}