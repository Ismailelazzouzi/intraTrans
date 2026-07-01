export type TrustedRelationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface TrustedRelation {
    id: string;
    userId: string;
    providerId: string;
    status: TrustedRelationStatus;
    blockedById: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface SentRequestsResponse {
    relationRequests: TrustedRelation[];
}

export interface ReceivedRequestsResponse {
    relationRequests: TrustedRelation[];
}

export interface AcceptedRelationsResponse {
    acceptedRelation: TrustedRelation[];
}

export interface BlockedListResponse {
    relations: TrustedRelation[];
}