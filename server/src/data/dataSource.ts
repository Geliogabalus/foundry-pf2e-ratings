import { DatabaseSync, StatementSync } from 'node:sqlite';
import { Entry } from './entities.js';

export const EntryTypes: Record<string, number> = {
    'spell': 1,
    'equipment': 2,
    'feat': 3,
}

export class DataSource {
    private db: DatabaseSync;
    private selectRatingsByTypeStatement: StatementSync;
    private insertEntryStatement: StatementSync;
    private insertUserStatement: StatementSync;
    private getEntryRatingsStatement: StatementSync;
    private getUserRatingStatement: StatementSync;
    private updateUserRatingStatement: StatementSync;

    constructor(dbPath: string) {
        this.db = new DatabaseSync(dbPath);

        this.selectRatingsByTypeStatement = this.db.prepare(`
            SELECT * FROM Entry WHERE typeId = ?
        `);

        this.insertEntryStatement = this.db.prepare(`
            INSERT OR IGNORE INTO Entry (id, typeId) VALUES (?, ?)
        `);

        this.insertUserStatement = this.db.prepare(`
            INSERT OR IGNORE INTO User (id) VALUES (?)
        `);

        this.getEntryRatingsStatement = this.db.prepare(`
            SELECT * FROM Rating WHERE entryId = ?
        `);

        this.getUserRatingStatement = this.db.prepare(`
            SELECT rating FROM UserRating WHERE userId = ? AND entryId = ?
        `);

        this.updateUserRatingStatement = this.db.prepare(`
            INSERT INTO UserRating (userId, entryId, rating) VALUES (?, ?, ?)
            ON CONFLICT(userId, entryId) DO UPDATE SET rating = excluded.rating
        `);
    }

    getRatings(type: string) {
        const result = this.selectRatingsByTypeStatement.all(EntryTypes[type]) as Entry[];

        return result.reduce((acc, entry) => {
            acc[entry.id] = entry;
            return acc;
        }, {} as Record<string, Entry>);
    }

    getEntryRatings(entryId: string) {
        const result = this.getEntryRatingsStatement.get(entryId);
        return result;
    }

    getUserRating(userId: string, entryId: string) {
        const result = this.getUserRatingStatement.get(userId, entryId);
        return result?.rating ?? null;
    }

    addNewEntry(entry: { id: string, type: string }) {
        const typeId = EntryTypes[entry.type];
        if (typeId === undefined) {
            throw new Error(`Unknown entry type: ${entry.type}`);
        }

        try {
            this.insertEntryStatement.run(entry.id, typeId);
        } catch (error) {
            console.error('Failed to add new entry:', error);
            throw error;
        }
    }

    createUser(id: string) {
        try {
            this.insertUserStatement.run(id);
        } catch (error) {
            console.error('Failed to create new user:', error);
            throw error;
        }
    }

    updateUserRating(userId: string, entryId: string, rating: number) {
        try {
            this.updateUserRatingStatement.run(userId, entryId, rating);
        } catch (error) {
            console.error('Failed to update user rating:', error);
            throw error;
        }
    }
}
