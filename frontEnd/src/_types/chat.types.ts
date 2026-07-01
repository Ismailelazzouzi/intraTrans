export interface ChatParticipant {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    imageUrl?: string | null;
}

export interface ChatMessage {
    id: string;
    conversationId: string;
    senderId: string;
    type: 'TEXT' | 'FILE';
    content: string;
    createdAt: string;
}

export interface ConversationListItem {
    conversationId: string;
    isGroup: boolean;
    broadcastId?: string | null;
    broadcastTitle?: string | null;
    recipient?: ChatParticipant | null; 
    messages: ChatMessage[]; 
}