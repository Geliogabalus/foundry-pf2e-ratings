import { DatabaseSync, StatementSync } from 'node:sqlite';
import { Entry } from './entities.js';

export const EntryTypes: Record<string, number> = {
    'spell': 1
}

export class DataSource {
    private db: DatabaseSync;
    private selectRatingsByTypeStatement: StatementSync;
    private insertEntryStatement: StatementSync;
    private checkUserCredentialsStatement: StatementSync;
    private checkUserNameExistsStatement: StatementSync;
    private insertUserStatement: StatementSync;
    private getEntryRatingsStatement: StatementSync;
    private getUserRatingStatement: StatementSync;

    constructor(dbPath: string) {
        this.db = new DatabaseSync(dbPath);

        this.selectRatingsByTypeStatement = this.db.prepare(`
            SELECT * FROM Entry WHERE typeId = ?
        `);

        this.insertEntryStatement = this.db.prepare(`
            INSERT OR IGNORE INTO Entry (id, typeId, rating) VALUES (?, ?, ?)
        `);

        this.checkUserCredentialsStatement = this.db.prepare(`
            SELECT id FROM User WHERE name = ? AND password = ?
        `);

        this.checkUserNameExistsStatement = this.db.prepare(`
            SELECT 1 FROM User WHERE name = ?
        `);

        this.insertUserStatement = this.db.prepare(`
            INSERT INTO User (name, password) VALUES (?, ?)
        `);

        this.getEntryRatingsStatement = this.db.prepare(`
            SELECT * FROM Rating WHERE entryId = ?
        `);

        this.getUserRatingStatement = this.db.prepare(`
            SELECT rating FROM UserRating WHERE userId = ? AND entryId = ?
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

    getUserRating(userId: number, entryId: string) {
        const result = this.getUserRatingStatement.get(userId, entryId);
        return result?.rating ?? null;
    }

    addNewEntry(entry: { id: string, type: string }) {
        const typeId = EntryTypes[entry.type];
        if (typeId === undefined) {
            throw new Error(`Unknown entry type: ${entry.type}`);
        }

        try {
            this.insertEntryStatement.run(entry.id, typeId, null);
        } catch (error) {
            console.error('Failed to add new entry:', error);
            throw error;
        }
    }

    checkAuth(username: string, password: string): number | null {
        const result = this.checkUserCredentialsStatement.get(username, password);
        if (result?.id) {
            return result.id as number;
        }
        return null;
    }

    checkUserName(username: string): boolean {
        const result = this.checkUserNameExistsStatement.get(username);
        return !!result;
    }

    createUser(username: string, password: string): number {
        try {
            const result = this.insertUserStatement.run(username, password);
            return result.lastInsertRowid as number;
        } catch (error) {
            console.error('Failed to create new user:', error);
            throw error;
        }
    }
}
