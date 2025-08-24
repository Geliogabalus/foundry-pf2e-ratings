import { DatabaseSync, SQLOutputValue, StatementSync } from 'node:sqlite';

export const EntryTypes: Record<string, number> = {
    'spell': 1
}

export interface Entry extends Record<string, SQLOutputValue>{
    id: string;
    typeId: number;
    rating: number | null;
}

export interface RatingItem extends Record<string, SQLOutputValue> {
    id: string;
    rating: number | null;
}

export class DataSource {
    db: DatabaseSync;
    selectRatingsByType: StatementSync;
    insertEntry: StatementSync;

    constructor(dbPath: string) {
        this.db = new DatabaseSync(dbPath);

        this.selectRatingsByType = this.db.prepare(`
            SELECT id, rating FROM Entry WHERE typeId = ?
        `);

        this.insertEntry = this.db.prepare(`
            INSERT OR IGNORE INTO Entry (id, typeId, rating) VALUES (?, ?, ?)
        `);

        /*const query = this.db.prepare(`
            SELECT * from EntryType
        `);
        // Execute the prepared statement and log the result set.
        console.log(query.all());*/
    }

    getRatings(type: string) {
        const result = this.selectRatingsByType.all(EntryTypes[type]) as RatingItem[];

        return result.reduce((acc, entry) => {
            acc[entry.id] = entry;
            return acc;
        }, {} as Record<string, RatingItem>);
    }

    addNewEntry(entry: { id: string, type: string }) {
        const typeId = EntryTypes[entry.type];
        if (typeId === undefined) {
            throw new Error(`Unknown entry type: ${entry.type}`);
        }

        try {
            this.insertEntry.run(entry.id, typeId, null);
        } catch (error) {
            console.error('Failed to add new entry:', error);
            throw error;
        }
    }
}
