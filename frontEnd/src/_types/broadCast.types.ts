export interface BroadcastSummary {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    status: string;
    type: string;
    createdAt: string;
    project?: {
        id: string;
        status: string;
    } | null;
}

export interface ProviderResponseBroadcast {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    status: string;
    createdAt: string;
}

export const BroadCastType = {
    NORMAL: 'NORMAL',
    GROUP: 'GROUP',
} as const;

export type BroadCastType = typeof BroadCastType[keyof typeof BroadCastType];

export const BroadCastStatus = {
    OPEN: 'OPEN',
    CONFIRMED: 'IN_PROGRESS',
    CLOSED: 'CLOSED',
    CANCELLED: 'CANCELLED'
} as const;

export type BroadCastStatus = typeof BroadCastStatus[keyof typeof BroadCastStatus];

export interface ProviderProfile {
    id: string;
    profession: string;
    isVerified: string;
    description?: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

export interface BroadCastResponse {
    broadcastId?: string;
    createdAt?: string;
    id?: string;
    message?: string;
    price?: string;
    providerId?: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
    task?: string;
    updatedAt?: string;
    provider?: ProviderProfile;
}

export interface BroadCastProjectProvider {
    role: string;
    provider: {
        id: string;
        profession: string;
        user: {
            id: string;
            firstName: string;
            lastName: string;
        };
    };
}

export interface BroadCastProject {
    id: string;
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    providers: BroadCastProjectProvider[];
}

export interface BroadCast {
    id?: string;
    userId?: string;
    title: string;
    description?: string;
    location?: string;
    type: BroadCastType; 
    maxProviders?: number;
    status?: BroadCastStatus;
    createdAt?: string;
    providerConfirmedId?: string | null;
    responses?: BroadCastResponse[];
    project?: BroadCastProject | null;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
    };
    _count?: {
        responses: number;
    };
}

export interface ProposalViewerModalProps {
    broadcast: BroadCast;
    onClose: () => void;
    onAcceptProvider: (responseId: string) => void;
}

export type BidResponsePayload = {
    id: string;
    broadcastId: string;
    providerId: string;
    message: string;
    price: string;
    task: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
    createdAt: string;
    updatedAt: string;
    broadcast?: BroadCast;
};