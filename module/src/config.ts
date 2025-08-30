export const moduleName = 'pf2e-ratings';
export const basePath = `modules/${moduleName}/`;
export const storagePath = `modules/${moduleName}/storage`;
export const baseId = `${moduleName}`;

const prefix = 'PF2E Ratings | ';

export function log(message: string, object?: any) {
    if (object) {
        console.log(`${prefix}${message}`, object);
    } else {
        console.log(`${prefix}${message}`);
    }
}

export function error(message: string, object?: any) {
    if (object) {
        console.error(`${prefix}${message}`, object);
    } else {
        console.error(`${prefix}${message}`);
    }
}
