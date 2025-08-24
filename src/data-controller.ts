export interface RatingItem {
    id: string;
    rating: number | null;
}

export interface Entry {
    uuid: string;
}

export class DataController {

    cache: { [key: string]: Record<string, RatingItem> } = {};

    constructor(private apiUrl: string) {
    }

    async fetchRatings(type: string): Promise<Record<string, RatingItem>> {
        try {
            const response = await fetch(`${this.apiUrl}/ratings/${type}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch ratings:', error);
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
            console.error(`Error fetching ratings for type ${type}:`, error);
            return {};
        }
    }

    async addNewEntry(uuid: string, type: string): Promise<void> {
        try {
            const response = await fetch(`${this.apiUrl}/${type}`, {
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
            console.error('Failed to add new entry:', error);
        }
    }
}
