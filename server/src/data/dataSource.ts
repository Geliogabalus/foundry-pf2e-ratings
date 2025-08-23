import { DatabaseSync } from 'node:sqlite';

export class DataSource {
    db: DatabaseSync;

    constructor(dbPath: string) {
        this.db = new DatabaseSync(dbPath);

        /*const query = this.db.prepare(`
            SELECT * from EntryType
        `);
        // Execute the prepared statement and log the result set.
        console.log(query.all());*/
    }
}
