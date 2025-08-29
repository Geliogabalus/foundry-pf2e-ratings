import { CompendiumController } from './compendium-controller.ts';
import { DataController } from './data-controller.ts';
import { Logger } from './logger.ts';

export const moduleName = 'pf2e-ratings';
export const basePath = `modules/${moduleName}/`;
export const storagePath = `modules/${moduleName}/storage`;
export const baseId = `${moduleName}`;

export const logger = new Logger();
export const compendiumController = new CompendiumController();
export const dataController = new DataController('https://geliogabalus-pf2e-ratings.duckdns.org');
//export const dataController = new DataController('http://localhost:8080');
