export type UserDTO = {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
};
export type PlaceDTO = {
    id: string;
    name: string;
    description?: string;
    lat: number;
    lng: number;
    address?: string;
    tags?: string[];
    isPetFriendly?: boolean;
    ratingAvg?: number;
};
export type ReviewDTO = {
    id: string;
    placeId: string;
    userId: string;
    rating: number;
    content: string;
    photos?: string[];
    createdAt: string;
};
export type WalkDTO = {
    id: string;
    userId: string;
    startAt: string;
    endAt?: string;
    distanceMeters?: number;
    durationSeconds?: number;
    path: {
        lat: number;
        lng: number;
    }[];
    photos?: string[];
    note?: string;
};
