import { CompendiumController } from './controllers/compendium-controller.ts';
import { DataSource } from './data/data-source.ts';
import * as config from './config.ts';

const API_URL = 'https://geliogabalus-pf2e-ratings.duckdns.org';

export interface CurrentUser {
    id: string;
    name: string;
}

declare module '#configuration' {
    interface SettingConfig {
        'pf2e-ratings.currentUser': CurrentUser | null;
    }
}

export class Module {
    readonly compendiumController: CompendiumController;
    readonly dataSource: DataSource;

    constructor() {
        this.dataSource = new DataSource(API_URL);
        this.compendiumController = new CompendiumController();
        this.compendiumController.module = this;

        (game as InitGame).settings.register(config.moduleName, 'currentUser', {
            scope: 'client',
            config: false,
        });
    }
}
