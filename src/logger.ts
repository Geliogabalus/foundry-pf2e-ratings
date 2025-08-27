export class Logger {
    private prefix = 'PF2E Ratings | ';

    log(message: string, object?: any) {
        if (object) {
            console.log(`${this.prefix}${message}`, object);
        } else {
            console.log(`${this.prefix}${message}`);
        }
    }

    error(message: string, object?: any) {
        if (object) {
            console.error(`${this.prefix}${message}`, object);
        } else {
            console.error(`${this.prefix}${message}`);
        }
    }
}
