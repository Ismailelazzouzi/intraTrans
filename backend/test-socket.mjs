import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
    extraHeaders: {
        Cookie: "accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ5MDg1MjIyLWU5NDgtNDJmMC05MDI4LTYwMDgxMGUwZGY3ZCIsImVtYWlsIjoiMUBnbWFpbC5jb20iLCJ0eXBlIjoiQ0xJRU5UIiwiaWF0IjoxNzgwNzYwOTcxLCJleHAiOjE3ODA3NjE4NzF9.S7sneH41Uhy06OgV2vCOw0_TRjSjcq6t1_QFyr1R4SQ"
    }
});

socket.on("connect", () => {
    console.log("CONNECTED:", socket.id);
    socket.emit(
        "joinConversation",
        "cf4cb80f-5bde-4828-b47b-3d617520c1c4"
    );
});

socket.on("connect_error", (err) => {
    console.log("CONNECT ERROR:", err.message);
});

socket.on("newMessage", (msg) => {
    console.log("NEW MESSAGE:", msg);
});