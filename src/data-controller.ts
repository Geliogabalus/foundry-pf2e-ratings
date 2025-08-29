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

    constructor(private apiUrl: string) {
    }

    private async fetchRatings(type: string): Promise<Record<string, RatingItem>> {
        try {
            const response = await fetch(`${this.apiUrl}/entry/${type}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            logger.error('Failed to fetch ratings:', error);
            throw error;
        }
    }

    async getRatingsByType(type: string): Promise<Record<string, RatingItem>> {
        try {
            const ratings = await this.fetchRatings(type);
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

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            logger.error('Failed to add new entry:', error);
        }
    }

    async getUserData(authId: string): Promise<any> {
        try {
            const response = await fetch(`${this.apiUrl}/oauth2/${authId}`);
            if (!response.ok) {
                logger.error(`Failed to fetch user data`);
                return null;
            }

            const result = await response.json();
            if (result.id) {
                return result;
            }
            return null;
        } catch (error) {
            logger.error('Error fetching user data:', error);
            return null;
        }
    }

    async getUserRating(userId: number, entryId: string): Promise<number | null> {
        try {
            const response = await fetch(`${this.apiUrl}/user/${userId}/${entryId}`);
            if (!response.ok) {
                logger.error(`User rating not found`);
            }
            const result = await response.json();
            return result.rating;
        } catch (error) {
            logger.error('Error fetching user rating:', error);
            return null;
        }
    }

    async updateUserRating(userId: number, entryId: string, rating: number): Promise<void> {
        try {
            const response = await fetch(`${this.apiUrl}/user/${userId}/${entryId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ rating })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            throw error;
        }
    }
}
