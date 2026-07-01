import type { BroadcastSummary, ProviderResponseBroadcast } from "./broadCast.types";

export interface ProviderResponse {
    id: string;
    task: string;
    price: string;
    broadcast: ProviderResponseBroadcast;
}

export interface ProviderWithHistory {
    id: string;
    profession: string | null;
    description: string | null;
    isVerified: string;
    broadcastResponses: ProviderResponse[];
}

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string | null;
    type: string;
    imageUrl?: string | null;
    createdAt?: string;
    broadcastsCreated?: BroadcastSummary[];
    provider?: ProviderWithHistory | null;
}
