import { useState, useEffect, useRef } from "react"
import type { ChatMessage, ConversationListItem, ChatParticipant } from "../_types/chat.types"
import { socket } from "../utils/socket"
import { useAuth } from "../hooks/useAuth"

// ─── Helper: build the authenticated file download URL for a chat message ───
function buildChatFileUrl(conversationId: string, filename: string): string {
    return `${import.meta.env.VITE_API_URL}/chat/conversations/${conversationId}/${filename}`;
}

// ─── Fetch a protected file (image or binary) with credentials and return a blob URL ───
async function fetchChatFile(conversationId: string, filename: string): Promise<string | null> {
    try {
        const res = await fetch(buildChatFileUrl(conversationId, filename), {
            credentials: "include",
        });
        if (!res.ok) {
            console.warn(`Failed to load chat file "${filename}": ${res.status}`);
            return null;
        }
        const blob = await res.blob();
        return URL.createObjectURL(blob);
    } catch (err) {
        console.error(`Error loading chat file "${filename}":`, err);
        return null;
    }
}

// ─── File message thumbnail / download component ────────────────────────────
function FileMessageContent({ filename, conversationId }: { filename: string; conversationId: string }) {
    const [imageBlobUrl, setImageBlobUrl] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const isImage = /.(jpg|jpeg|png|webp|gif|svg)$/i.test(filename);

    // Fetch the file (both image and non-image) with credentials
    useEffect(() => {
        let cancelled = false;

        (async () => {
            const url = await fetchChatFile(conversationId, filename);
            if (cancelled) {
                if (url) URL.revokeObjectURL(url);
                return;
            }
            if (isImage) {
                setImageBlobUrl(prev => {
                    if (prev) URL.revokeObjectURL(prev);
                    return url;
                });
            } else {
                setDownloadUrl(prev => {
                    if (prev) URL.revokeObjectURL(prev);
                    return url;
                });
            }
            if (!cancelled) setLoading(false);
        })();

        return () => {
            cancelled = true;
            setImageBlobUrl(prev => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
            setDownloadUrl(prev => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
        };
    }, [conversationId, filename]);

    // Non-image files — show as downloadable link via blob URL
    if (!isImage) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-base shrink-0">
                    {filename.match(/\.pdf$/i) ? "📄" : filename.match(/\.(zip|rar|7z|tar\.gz)$/i) ? "📦" : "📎"}
                </span>
                {loading && !downloadUrl ? (
                    <span className="text-text-secondary animate-pulse">{filename}</span>
                ) : downloadUrl ? (
                    <a
                        href={downloadUrl}
                        download={filename}
                        className="text-brand-success hover:text-brand-success/80 transition-colors underline decoration-dotted underline-offset-2"
                    >
                        {filename}
                    </a>
                ) : (
                    <span className="text-text-tertiary">{filename} (unavailable)</span>
                )}
            </div>
        );
    }

    // Image files — show thumbnail preview
    if (isImage) {
        if (!imageBlobUrl) {
            return (
                <div className="flex items-center gap-2 text-text-secondary animate-pulse">
                    <span className="text-base">📎</span>
                    <span>{filename}</span>
                </div>
            );
        }

        return (
            <>
                <div className="-m-1">
                    <img
                        src={imageBlobUrl}
                        alt={filename}
                        className="max-w-48 max-h-48 rounded-interactive cursor-pointer object-cover border border-border-subtle/50 hover:border-brand-primary/50 transition-all hover:scale-[1.02]"
                        onClick={() => setExpanded(true)}
                    />
                    <span className="text-caption-dense text-text-tertiary mt-1 block truncate max-w-48">
                        {filename}
                    </span>
                </div>

                {/* Expanded image overlay */}
                {expanded && (
                    <div
                        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
                        onClick={() => setExpanded(false)}
                    >
                        <div className="relative max-w-[90vw] max-h-[90vh]">
                            <img
                                src={imageBlobUrl}
                                alt={filename}
                                className="max-w-full max-h-[90vh] rounded-panel object-contain shadow-2xl"
                            />
                            <button
                                onClick={() => setExpanded(false)}
                                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-surface-panel border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-border-subtle transition-colors text-sm"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}
            </>
        );
    }
}

function ChatLayout() {
    const [conversations, setConversations] = useState<ConversationListItem[]>([]);
    const [activeConversation, setActiveConversation] = useState<ConversationListItem | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [textInput, setTextInput] = useState<string>("");
    const [isLoadingConversations, setIsLoadingConversations] = useState<boolean>(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
    const [isSending, setIsSending] = useState<boolean>(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user } = useAuth();
    const activeConversationRef = useRef<ConversationListItem | null>(null);
    activeConversationRef.current = activeConversation;
    const conversationsRef = useRef<ConversationListItem[]>([]);
    conversationsRef.current = conversations;
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const broadcastChatMapRef = useRef<Map<string, string>>(new Map());
    const userInfoCacheRef = useRef<Map<string, ChatParticipant>>(new Map());

    const fetchingConversationsRef = useRef(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    useEffect(() => {
        if (!isLoadingMessages && messages.length > 0) {
            scrollToBottom();
        }
    }, [isLoadingMessages]);

    const fetchConversationsList = async () => {
        if (fetchingConversationsRef.current) return;
        fetchingConversationsRef.current = true;
        setIsLoadingConversations(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/chat/conversations/get`, {
                credentials: "include"
            });
            if (!res.ok) throw new Error("Failed to fetch conversations");
            const response = await res.json();
            const rawConversations = response.conversations || [];

            // Deduplicate conversations by participant pair (handles StrictMode-created duplicates)
            // Prefix key with 'g'/'d' to avoid collision between 2-person groups and 1:1 direct chats
            const seenPairs = new Set<string>();
            const transformed: ConversationListItem[] = rawConversations
                .filter((conv: any) => {
                    const participants = conv.participants?.map((p: any) => p.userId).sort().join(':');
                    if (!participants) return false;
                    const key = `${conv.isGroup ? 'g' : 'd'}:${participants}`;
                    if (seenPairs.has(key)) return false;
                    seenPairs.add(key);
                    return true;
                })
                .map((conv: any) => {
                    const otherUserId = conv.participants?.find(
                        (p: any) => p.userId !== user?.id
                    )?.userId;
                    // Use conv.name as broadcastTitle for group conversations
                    const broadcastTitle = conv.isGroup ? (conv.name || null) : null;
                    return {
                        conversationId: conv.id,
                        isGroup: conv.isGroup,
                        broadcastId: null,
                        broadcastTitle,
                        recipient: null,
                        messages: conv.messages || []
                    } as ConversationListItem;
                });

            setConversations(transformed);

            // Fetch user info for display names in sidebar
            rawConversations.forEach((conv: any) => {
                const otherUserId = conv.participants?.find(
                    (p: any) => p.userId !== user?.id
                )?.userId;
                if (!otherUserId || conv.isGroup) return;
                fetch(`${import.meta.env.VITE_API_URL}/users/${otherUserId}`, {
                    credentials: "include"
                }).then(userRes => {
                    if (!userRes.ok) return;
                    return userRes.json();
                }).then(userData => {
                    if (!userData?.data) return;
                    setConversations(prev => prev.map(c =>
                        c.conversationId === conv.id
                            ? {
                                ...c,
                                recipient: {
                                    id: userData.data.id,
                                    firstName: userData.data.firstName,
                                    lastName: userData.data.lastName,
                                    email: userData.data.email,
                                    imageUrl: userData.data.imageUrl
                                } as ChatParticipant
                            }
                            : c
                    ));
                }).catch((err) => {
                    console.error('Failed to load user info', err);
                    setFetchError('Could not load some user details.');
                    setTimeout(() => setFetchError(null), 4000);
                });
            });
        } catch (err) {
            console.error("Error fetching inbox conversations:", err);
            setLoadError("Failed to load conversations.");
            setTimeout(() => setLoadError(null), 4000);
        } finally {
            setIsLoadingConversations(false);
            fetchingConversationsRef.current = false;
        }
    };
    const loadConversation = async (conversationId: string) => {
        setIsLoadingMessages(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/chat/conversations/${conversationId}/getMessages`, {
                credentials: "include"
            });
            if (!res.ok) throw new Error("Failed to load messages");
            const response = await res.json();

            // Read the latest conversations state from the ref
            const latest = conversationsRef.current;
            const existing = latest.find(c => c.conversationId === conversationId);
            const activeData: ConversationListItem = {
                conversationId,
                isGroup: existing?.isGroup || false,
                broadcastId: existing?.broadcastId || null,
                broadcastTitle: existing?.broadcastTitle || null,
                recipient: existing?.recipient || null,
                messages: response.messages || []
            };
            setActiveConversation(activeData);
            setMessages(response.messages || []);

            // Pre-fetch sender names for group conversations
            if (existing?.isGroup && response.messages?.length > 0) {
                prefetchSenderNames(response.messages);
            }

            socket.emit("joinConversation", conversationId);
        } catch (err) {
            console.error("Error loading conversation:", err);
            setLoadError("Failed to load conversation.");
            setTimeout(() => setLoadError(null), 4000);
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const initializingDirectRef = useRef(false);

    const initializeDirectThread = async (targetUserId: string) => {
        if (initializingDirectRef.current) return;
        initializingDirectRef.current = true;
        setIsLoadingMessages(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/chat/conversations/open/${targetUserId}`, {
                method: "POST",
                credentials: "include"
            });
            if (!res.ok)
                throw new Error("Failed to start conversation");
            const response = await res.json();
            if (response.conversationId) {
                // Fetch the other user's info for the header
                let recipient: ChatParticipant | null = null;
                try {
                    const userRes = await fetch(`${import.meta.env.VITE_API_URL}/users/${targetUserId}`, {
                        credentials: "include"
                    });
                    if (userRes.ok) {
                        const userData = await userRes.json();
                        if (userData?.data) {
                            recipient = {
                                id: userData.data.id,
                                firstName: userData.data.firstName,
                                lastName: userData.data.lastName,
                                email: userData.data.email,
                                imageUrl: userData.data.imageUrl
                            };
                        }
                    }
                } catch (err) {
                    console.error('Failed to load user info', err);
                    setFetchError('Could not load user details.');
                    setTimeout(() => setFetchError(null), 4000);
                }

                const activeConvoData: ConversationListItem = {
                    conversationId: response.conversationId,
                    isGroup: false,
                    recipient,
                    messages: response.messages || []
                };
                setActiveConversation(activeConvoData);
                setMessages(response.messages || []);

                // Add to sidebar if not already there
                setConversations(prev => {
                    if (prev.some(c => c.conversationId === response.conversationId)) return prev;
                    return [{ conversationId: response.conversationId, isGroup: false, recipient, messages: response.messages || [] }, ...prev];
                });

                socket.emit("joinConversation", response.conversationId);
                console.log("Successfully joined live socket room:", response.conversationId);
            }
        } catch (err) {
            console.error("Error initializing direct conversation:", err);
            setLoadError("Failed to start conversation.");
            setTimeout(() => setLoadError(null), 4000);
        } finally {
            setIsLoadingMessages(false);
            initializingDirectRef.current = false;
        }
    };
    const handleSendMessage = async () => {
        if (!textInput.trim() || !activeConversation || isSending) return;
        const sentContent = textInput;
        const convId = activeConversation.conversationId;
        setIsSending(true);
        setSendError(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/chat/conversations/${convId}/message`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ content: sentContent })
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || "Failed to send message");
            }
            setTextInput("");

            // Immediately update sidebar: move conversation to top with this message as latest snippet
            setConversations(prev => {
                const idx = prev.findIndex(c => c.conversationId === convId);
                if (idx === -1) return prev;
                const updated = [...prev];
                const msg: ChatMessage = {
                    id: `send-${Date.now()}`,
                    conversationId: convId,
                    senderId: user?.id || '',
                    type: 'TEXT',
                    content: sentContent,
                    createdAt: new Date().toISOString()
                };
                const conv = { ...updated[idx], messages: [msg] };
                updated.splice(idx, 1);
                updated.unshift(conv);
                return updated;
            });
        } catch (err) {
            console.error("Error sending message:", err);
            setSendError("Failed to send message. Please try again.");
            setTimeout(() => setSendError(null), 3000);
        } finally {
            setIsSending(false);
        }
    };

    const handleFileSend = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeConversation) return;

        setIsSending(true);
        setSendError(null);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/chat/conversations/${activeConversation.conversationId}/message`, {
                method: "POST",
                credentials: "include",
                body: formData
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Failed to send file (${res.status})`);
            }

            // Parse the server response to get the uploaded message
            const responseData = await res.json();
            const newMessage: ChatMessage = responseData.message || responseData;

            // Update sidebar: move conversation to top with this file message
            // The actual message will appear in the chat via socket (newMessage event)
            const convId = activeConversation.conversationId;
            setConversations(prev => {
                const idx = prev.findIndex(c => c.conversationId === convId);
                if (idx === -1) return prev;
                const updated = [...prev];
                const conv = { ...updated[idx], messages: [newMessage] };
                updated.splice(idx, 1);
                updated.unshift(conv);
                return updated;
            });
        } catch (err) {
            console.error("Error sending file:", err);
            setSendError(err instanceof Error ? err.message : "Failed to send file. Please try again.");
            setTimeout(() => setSendError(null), 3000);
        } finally {
            setIsSending(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const initializingGroupRef = useRef(false);

    const initializeGroupThread = async (broadcastId: string) => {
        if (initializingGroupRef.current) return;
        initializingGroupRef.current = true;
        setIsLoadingMessages(true);
        try {
            // Step 1: Check in-memory map for existing mapping
            const mappedConvId = broadcastChatMapRef.current.get(broadcastId);
            if (mappedConvId) {
                await loadConversation(mappedConvId);
                return;
            }

            // Step 2: Fetch broadcast info
            const broadcastRes = await fetch(`${import.meta.env.VITE_API_URL}/broadcasts/${broadcastId}`, {
                credentials: "include"
            });
            if (!broadcastRes.ok) throw new Error("Failed to fetch broadcast");
            const broadcastData = await broadcastRes.json();
            const broadcast = broadcastData.data;
            const broadcastTitle = broadcast.title;

            // Step 3: Check sidebar for existing group with this name (provider visiting after client created it)
            const sidebarMatch = conversationsRef.current.find(
                c => c.isGroup && c.broadcastTitle === broadcastTitle
            );
            if (sidebarMatch) {
                broadcastChatMapRef.current.set(broadcastId, sidebarMatch.conversationId);
                await loadConversation(sidebarMatch.conversationId);
                return;
            }

            // Only the broadcast owner (client) can create the group — providers can't see all accepted responses
            if (broadcast.user?.id !== user?.id) {
                console.warn("Group chat not yet created. The broadcast owner needs to open it first.");
                return;
            }

            // Step 4: Gather participant IDs (client creates the group)
            const clientId = broadcast.user?.id;
            const acceptedResponses = broadcast.responses?.filter(
                (r: any) => r.status === 'ACCEPTED'
            ) || [];
            const providerUserIds = acceptedResponses
                .map((r: any) => r.provider?.user?.id)
                .filter(Boolean);

            const uniqueIds = [...new Set([clientId, ...providerUserIds, user?.id].filter(Boolean))];
            if (uniqueIds.length < 2) {
                console.warn("Not enough participants to create group chat");
                return;
            }

            // Step 5: Create the group conversation
            const createRes = await fetch(`${import.meta.env.VITE_API_URL}/chat/groupChat/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    name: broadcastTitle,
                    participantIds: uniqueIds
                })
            });
            if (!createRes.ok) throw new Error("Failed to create group chat");
            const createData = await createRes.json();
            const conversationId = createData.conversationId;

            // Pre-fetch participant names for the group chat
            Promise.all(uniqueIds.filter(id => id !== user?.id).map(id => fetchAndCacheUserInfo(id)));

            // Store mapping for quick intra-session lookup
            broadcastChatMapRef.current.set(broadcastId, conversationId);

            // Set up the conversation in state
            const groupConvo: ConversationListItem = {
                conversationId,
                isGroup: true,
                broadcastId,
                broadcastTitle,
                recipient: null,
                messages: []
            };

            setActiveConversation(groupConvo);
            setMessages([]);

            // Add to sidebar if not already there, and enrich with broadcastId/title
            setConversations(prev => {
                if (prev.some(c => c.conversationId === conversationId)) {
                    return prev.map(c =>
                        c.conversationId === conversationId
                            ? { ...c, broadcastId, broadcastTitle }
                            : c
                    );
                }
                return [groupConvo, ...prev];
            });

            // Refresh sidebar to pick up any group convos created by others
            fetchConversationsList();

            socket.emit("joinConversation", conversationId);
            console.log("Group chat created and joined:", conversationId);
        } catch (err) {
            console.error("Error initializing group conversation:", err);
            setLoadError("Failed to start group conversation.");
            setTimeout(() => setLoadError(null), 4000);
        } finally {
            setIsLoadingMessages(false);
            initializingGroupRef.current = false;
        }
    };

    // Format a message date for date separators
    const formatMessageDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return "Today";
        if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
        return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    };

    const formatMessageTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const fetchAndCacheUserInfo = async (userId: string) => {
        if (userInfoCacheRef.current.has(userId)) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/users/${userId}`, {
                credentials: "include"
            });
            if (!res.ok) return;
            const data = await res.json();
            if (data?.data) {
                userInfoCacheRef.current.set(userId, {
                    id: data.data.id,
                    firstName: data.data.firstName,
                    lastName: data.data.lastName,
                    email: data.data.email,
                    imageUrl: data.data.imageUrl
                });
            }
        } catch (err) {
            console.error('Failed to fetch user info', err);
            setFetchError('Could not load user details.');
            setTimeout(() => setFetchError(null), 4000);
        }
    };

    // Pre-fetch sender names for group messages (batched, cache-checking)
    const prefetchSenderNames = async (msgs: ChatMessage[]) => {
        const unknownIds = msgs
            .map(m => m.senderId)
            .filter(id => id !== user?.id && !userInfoCacheRef.current.has(id));
        const uniqueIds = [...new Set(unknownIds)];
        await Promise.all(uniqueIds.map(id => fetchAndCacheUserInfo(id)));
    };

    const getSenderName = (msg: ChatMessage) => {
        if (activeConversation?.isGroup) {
            if (user && msg.senderId === user.id) return 'You';
            const cached = userInfoCacheRef.current.get(msg.senderId);
            return cached ? `${cached.firstName} ${cached.lastName}` : null;
        }
        // 1:1 direct chat — show the other participant's name
        if (user && msg.senderId === user.id) return null;
        if (activeConversation?.recipient) return `${activeConversation.recipient.firstName} ${activeConversation.recipient.lastName}`;
        return null;
    };

    // Filter conversations by search query
    const filteredConversations = conversations.filter(conv => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        if (conv.isGroup) return conv.broadcastTitle?.toLowerCase().includes(q);
        return conv.recipient
            ? `${conv.recipient.firstName} ${conv.recipient.lastName}`.toLowerCase().includes(q)
            : false;
    });

    useEffect(() => {
        if (!socket.connected) {
            socket.connect();
        }

        const searchParams = new URLSearchParams(location.search);
        const targetId = searchParams.get("targetId");
        const broadcastId = searchParams.get("broadcastId");
        
        fetchConversationsList();
        
        if (targetId) {
            initializeDirectThread(targetId);
        } else if (broadcastId) {
            initializeGroupThread(broadcastId);
        }
    
        // --- REAL-TIME LIVE LISTENER WORKER ---
        const handleIncomingMessage = (newMessage: ChatMessage) => {
            console.log("🔥 New live message packet intercepted via WebSocket:", newMessage);
            
            // Pre-fetch sender info for group messages from unknown users
            if (activeConversationRef.current?.isGroup && newMessage.senderId !== user?.id) {
                fetchAndCacheUserInfo(newMessage.senderId);
            }

            // Use ref to avoid stale closures and prevent React StrictMode double-invocation bugs
            if (activeConversationRef.current && newMessage.conversationId === activeConversationRef.current.conversationId) {
                setMessages((prevMessages) => [...prevMessages, newMessage]);
            }

            // Move the conversation to the top of the sidebar and update its last message snippet
            setConversations((prev) => {
                const idx = prev.findIndex(c => c.conversationId === newMessage.conversationId);
                if (idx === -1) return prev;
                const updated = [...prev];
                const conv = { ...updated[idx], messages: [newMessage] };
                updated.splice(idx, 1);
                updated.unshift(conv);
                return updated;
            });
        };

        // Handle a new conversation created by someone else — refresh the sidebar
        const handleNewConversation = () => {
            console.log("📨 New conversation detected via socket, refreshing sidebar...");
            fetchConversationsList();
        };
    
        // Mount the real-time event listener
        socket.on("newMessage", handleIncomingMessage);
        socket.on("newConversation", handleNewConversation);
    
        // CLEANUP: Strip listeners when unmounting or switching address channels
        return () => {
            console.log("Detaching real-time stream listeners safely...");
            socket.off("newMessage", handleIncomingMessage);
            socket.off("newConversation", handleNewConversation);
        };
    }, [location.search]);

    // Build date-separated message groups
    const messageGroups: { date: string; messages: ChatMessage[] }[] = [];
    if (messages.length > 0) {
        let currentGroup: { date: string; messages: ChatMessage[] } | null = null;
        messages.forEach((msg) => {
            const dateKey = new Date(msg.createdAt).toDateString();
            if (!currentGroup || currentGroup.date !== dateKey) {
                currentGroup = { date: dateKey, messages: [msg] };
                messageGroups.push(currentGroup);
            } else {
                currentGroup.messages.push(msg);
            }
        });
    }

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full bg-surface-background text-text-primary overflow-hidden">
    
    {/* Mobile backdrop overlay */}
    {sidebarOpen && (
        <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
        />
    )}

    <aside className={`
        fixed inset-y-0 left-0 z-40 w-80
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:z-auto lg:flex-shrink-0
        border-r border-border-default/80 flex flex-col bg-surface-overlay
    `}>
        
        <div className="p-4 border-b border-border-default/60">
            <h1 className="text-lg font-bold tracking-wide text-text-primary">Messages</h1>
            {(loadError || fetchError) && (
                <div className="mt-2 px-3 py-2 rounded-panel bg-status-error/10 border border-status-error/30 text-status-error text-caption-dense font-bold animate-fade-in">
                    {loadError || fetchError}
                </div>
            )}
            <div className="mt-2">
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..." 
                    className="w-full bg-surface-background border border-border-default rounded-panel px-3 py-2 text-xs focus:outline-none focus:border-brand-primary transition-colors placeholder:text-text-muted"
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoadingConversations && conversations.length === 0 && (
                <div className="text-xs text-text-tertiary text-center py-8">
                    Loading conversations...
                </div>
            )}
            {!isLoadingConversations && conversations.length === 0 && (
                <div className="text-xs text-text-tertiary text-center py-8">
                    No conversations yet
                </div>
            )}
            {!isLoadingConversations && conversations.length > 0 && filteredConversations.length === 0 && (
                <div className="text-xs text-text-tertiary text-center py-8">
                    No conversations match &quot;{searchQuery}&quot;
                </div>
            )}
            {filteredConversations.map((conv) => {
                const displayName = conv.isGroup
                    ? conv.broadcastTitle || 'Group Chat'
                    : conv.recipient
                        ? `${conv.recipient.firstName} ${conv.recipient.lastName}`
                        : 'Unknown User';
                const initials = displayName === 'Unknown User'
                    ? '?'
                    : displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                const lastMsg = conv.messages?.[0];
                const snippet = lastMsg
                    ? `${lastMsg.type === 'FILE' ? '📎 ' : ''}${(lastMsg.content || '').slice(0, 40)}${(lastMsg.content || '').length > 40 ? '...' : ''}`
                    : 'No messages yet';
                const lastTime = lastMsg
                    ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';
                const isActive = activeConversation?.conversationId === conv.conversationId;

                return (
                    <div
                        key={conv.conversationId}
                        onClick={() => {
                            loadConversation(conv.conversationId);
                            setSidebarOpen(false);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-card cursor-pointer transition-all ${
                            isActive
                                ? 'bg-brand-primary/10 border border-brand-primary/30'
                                : 'bg-surface-elevated/40 border border-border-subtle/30 hover:bg-surface-elevated/60 hover:border-border-default/40'
                        }`}
                    >
                        <div className="w-10 h-10 rounded-full bg-surface-elevated flex-shrink-0 border border-border-subtle flex items-center justify-center font-bold text-xs text-brand-success">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-text-primary truncate">
                                    {displayName}
                                </p>
                                <span className="text-caption-tiny text-text-tertiary flex-shrink-0 ml-2">
                                    {lastTime}
                                </span>
                            </div>
                            <p className="text-caption-dense text-text-secondary truncate mt-0.5">
                                {snippet}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    </aside>

    <main className="flex-1 flex flex-col bg-surface-background">
        
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            
            {activeConversation === null ? (
                // EMPTY STATE: No active conversation selected
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-surface-background">
                    {/* Mobile sidebar toggle */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden mb-6 px-3 py-2 rounded-panel bg-surface-elevated border border-border-default text-text-secondary hover:text-text-primary hover:border-brand-primary/50 transition-all text-xs font-bold uppercase tracking-wider"
                    >
                        <span className="inline-flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <span className="hidden sm:inline">Conversations</span>
                        </span>
                    </button>
                    <div className="w-14 h-14 rounded-card bg-surface-panel border border-border-default flex items-center justify-center text-text-tertiary mb-4 text-2xl">
                        💬
                    </div>
                    <h3 className="text-base font-bold text-text-primary tracking-wide">No Active Discussion</h3>
                    <p className="text-xs text-text-tertiary max-w-xs mt-1 leading-relaxed">
                        Select a conversation from the sidebar or open a chat from a broadcast card to begin messaging.
                    </p>
                </div>
            ) : isLoadingMessages ? (
                // LOADING SKELETON
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="h-16 border-b border-border-default/80 flex items-center justify-between px-6 bg-surface-panel/10 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            {/* Mobile back button */}
                            <button
                                onClick={() => { setSidebarOpen(true); setActiveConversation(null); }}
                                className="lg:hidden p-1.5 rounded-panel text-text-tertiary hover:text-text-primary hover:bg-surface-elevated/50 transition-all"
                                title="Back to conversations"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div className="h-8 w-8 rounded-full bg-surface-elevated animate-pulse" />
                            <div className="space-y-1.5">
                                <div className="h-3 w-32 bg-surface-elevated rounded animate-pulse" />
                                <div className="h-2 w-20 bg-surface-elevated/60 rounded animate-pulse" />
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 p-6 space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={`flex w-full ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                                <div className={`h-10 rounded-card animate-pulse ${
                                    i % 2 === 0 ? 'w-48 bg-brand-primary/10' : 'w-56 bg-surface-elevated/50'
                                }`} />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                // LIVE ACTIVE STATE
                <div className="flex-1 flex flex-col h-full overflow-hidden">

                    {/* Conversation Header Ribbon */}
                    <div className="h-16 border-b border-border-default/80 flex items-center justify-between px-6 bg-surface-panel/10 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            {/* Mobile sidebar toggle */}
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-1.5 rounded-panel text-text-tertiary hover:text-text-primary hover:bg-surface-elevated/50 transition-all"
                                title="Open conversations"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <div className="h-2 w-2 rounded-full bg-brand-primary animate-pulse" />
                            <div>
                                <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                                    {activeConversation?.isGroup
                                        ? (activeConversation.broadcastTitle || 'Group Chat')
                                        : activeConversation?.recipient
                                            ? `${activeConversation.recipient.firstName} ${activeConversation.recipient.lastName}`
                                            : 'Chat'
                                    }
                                </h2>
                                <p className="text-caption-dense text-text-tertiary font-medium mt-0.5">
                                    {activeConversation?.isGroup ? 'Group Conversation' : 'Direct Message'}
                                </p>
                            </div>
                        </div>
                    </div>
            
                    {/* Message Log Scroller Room */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-1">
                        {messageGroups.length === 0 && (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-xs text-text-tertiary">No messages yet. Start a conversation!</p>
                            </div>
                        )}
                        {messageGroups.map((group) => (
                            <div key={group.date}>
                                {/* Date Separator */}
                                <div className="flex items-center justify-center my-4">
                                    <div className="px-3 py-1 rounded-full bg-surface-elevated/60 border border-border-subtle/40">
                                        <span className="text-caption-dense font-bold text-text-secondary uppercase tracking-wider">
                                            {formatMessageDate(group.messages[0].createdAt)}
                                        </span>
                                    </div>
                                </div>
                                {/* Messages for this date */}
                                {group.messages.map((msg) => {
                                    const isMe = user ? msg.senderId === user.id : false;
                                    const senderName = getSenderName(msg);
                                    const isFile = msg.type === 'FILE';

                                    return (
                                        <div key={msg.id} className="mb-2">
                                            {/* Sender name label for group chats or when it's not "me" */}
                                            {senderName && (
                                                <p className={`text-caption-dense font-semibold text-text-tertiary mb-0.5 ${
                                                    isMe ? 'text-right mr-1' : 'ml-1'
                                                }`}>
                                                    {senderName}
                                                </p>
                                            )}
                                            <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className="group relative max-w-[75%]">
                                                    <div className={`px-4 py-2.5 rounded-card text-xs leading-relaxed border ${
                                                        isMe 
                                                            ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-success rounded-tr-none' 
                                                            : 'bg-surface-panel border-border-default/80 text-text-primary rounded-tl-none'
                                                    }`}>
                                                        {isFile ? (
                                                            <FileMessageContent filename={msg.content} conversationId={activeConversation.conversationId} />
                                                        ) : (
                                                            msg.content
                                                        )}
                                                    </div>
                                                    {/* Timestamp below bubble */}
                                                    <p className={`text-caption-tiny text-text-muted mt-0.5 ${
                                                        isMe ? 'text-right mr-1' : 'ml-1'
                                                    }`}>
                                                        {formatMessageTime(msg.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            )}

            {/* Input Area — only show when there's an active conversation */}
            {activeConversation && !isLoadingMessages && (
                <div className="p-4 bg-surface-panel/10 border-t border-border-default/60 flex-shrink-0">
                    {/* Error toast */}
                    {sendError && (
                        <div className="mb-2 px-3 py-2 rounded-panel bg-status-error/10 border border-status-error/30 text-status-error text-caption-dense font-bold animate-fade-in">
                            {sendError}
                        </div>
                    )}
                    <div className="flex items-center gap-2 bg-surface-background border border-border-default rounded-card p-2 focus-within:border-brand-primary/50 transition-colors">
                        
                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileSend}
                            className="hidden"
                            accept="image/jpeg,image/png,image/webp,application/pdf,application/zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        />
                        
                        {/* Attachment Toggle Anchor */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isSending}
                            className="p-2 text-text-tertiary hover:text-text-primary transition-colors rounded-panel hover:bg-surface-panel disabled:opacity-50"
                        >
                            📎
                        </button>
                        
                        {/* Main Content Input Inputbox */}
                        <input 
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            disabled={isSending}
                            placeholder="Write a message..."
                            className="flex-1 bg-transparent border-none outline-none text-xs px-2 py-1 placeholder:text-text-muted disabled:opacity-50"
                        />
                        
                        {/* Submit Action Control */}
                        <button 
                            onClick={handleSendMessage}
                            disabled={isSending || !textInput.trim()}
                            className={`px-4 py-2 rounded-panel text-xs font-bold tracking-wide transition-colors ${
                                isSending || !textInput.trim()
                                    ? 'bg-surface-elevated text-text-tertiary cursor-not-allowed'
                                    : 'bg-brand-primary hover:bg-brand-success text-text-primary'
                            }`}
                        >
                            {isSending ? (
                                <span className="flex items-center gap-1.5">
                                    <span className="inline-block w-3 h-3 border-2 border-text-tertiary border-t-transparent rounded-full animate-spin" />
                                    SENDING
                                </span>
                            ) : (
                                'SEND'
                            )}
                        </button>
                    </div>
                </div>
            )}

        </div>
    </main>
</div>
  )
}

export default ChatLayout
