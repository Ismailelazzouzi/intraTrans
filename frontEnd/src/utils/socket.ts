import { io, Socket } from "socket.io-client";
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const SOCKET_URL = BASE_URL.endsWith("/api") 
    ? BASE_URL.replace(/\/api$/, "") 
    : BASE_URL;

export const socket: Socket = io(SOCKET_URL, {
    autoConnect: false,     
    withCredentials: true,  
    transports: ["websocket"] 
});