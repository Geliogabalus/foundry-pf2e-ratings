import { SQLOutputValue } from 'node:sqlite';

export interface Entry extends Record<string, SQLOutputValue> {
    id: string;
    typeId: number;
    rating: number | null;
}

export interface EntryType extends Record<string, SQLOutputValue> {
    id: number;
    name: string;
}

export interface User extends Record<string, SQLOutputValue> {
    id: number;
    name: string;
    password: string;
}

export interface UserRating extends Record<string, SQLOutputValue> {
    id: string;
    entryId: string;
    userId: string;
    rating: number;
}

export interface Rating extends Record<string, SQLOutputValue> {
    id: string;
    entryId: string;
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
}
