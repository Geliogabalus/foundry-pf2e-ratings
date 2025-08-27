import { logger } from './config.ts';

export interface RatingItem {
    id: string;
    rating: number | null;
}

export interface Entry {
    uuid: string;
}

export interface EntryRatings {
    entryId: string;
    [key: number]: number;
}

export class DataController {

    cache: { [key: string]: Record<string, RatingItem> } = {};

    constructor(private apiUrl: string) {
    }

    private async fetchRatings(type: string): Promise<Record<string, RatingItem>> {
        try {
            const response = await fetch(`${this.apiUrl}/ratings/${type}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            logger.error('Failed to fetch ratings:', error);
            throw error;
        }
    }

    async getRatings(type: string): Promise<Record<string, RatingItem>> {
        if (this.cache[type]) {
            return this.cache[type];
        }

        try {
            const ratings = await this.fetchRatings(type);
            this.cache[type] = ratings;
            return ratings;
        } catch (error) {
            logger.error(`Error fetching ratings for type ${type}:`, error);
            return {};
        }
    }

    async getEntryRatings(entryId: string): Promise<EntryRatings | null> {
        try {
            const response = await fetch(`${this.apiUrl}/entry/${entryId}/ratings`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            return result as EntryRatings;
        } catch (error) {
            return {
                entryId: entryId,
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0
            };
        }
    }

    async addNewEntry(uuid: string, type: string): Promise<void> {
        try {
            const response = await fetch(`${this.apiUrl}/entry/${type}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: uuid })
            });

            delete this.cache[type];

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            logger.error('Failed to add new entry:', error);
        }
    }

    async authUser(username: string, password: string): Promise<number | null> {
        try {
            const response = await fetch(`${this.apiUrl}/auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.userId) {
                return result.userId;
            }

            return null;
        } catch (error) {
            logger.error('Failed to check user credentials:', error);
            return null;
        }
    }

    async checkUserName(username: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.apiUrl}/user/${username}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    async createUser(username: string, password: string): Promise<number | null> {
        try {
            const response = await fetch(`${this.apiUrl}/user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.userId) {
                return result.userId;
            }

            throw new Error(`HTTP error! status: ${response.status}`);
        } catch (error) {
            logger.error('Failed to create user:', error);
            throw error;
        }
    }

    async getUserRating(userId: number, entryId: string): Promise<number | null> {
        try {
            const response = await fetch(`${this.apiUrl}/user/${userId}/${entryId}`);
            if (!response.ok) {
                throw new Error(`Rating not found`);
            }
            const result = await response.json();
            return result.rating;
        } catch (error) {
            return null;
        }
    }
}
