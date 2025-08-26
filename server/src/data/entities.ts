export interface Entry {
    id: string;
    typeId: number;
    rating: number | null;
}

export interface EntryType {
    id: number;
    name: string;
}

export interface User {
    id: string;
    name: string;
    password: string;
}

export interface UserRating {
    id: string;
    entryId: string;
    userId: string;
    rating: number;
}

export interface Rating {
    id: string;
    entryId: string;
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
}
