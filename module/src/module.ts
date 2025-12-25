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
        'pf2e-ratings.enableSpells': boolean;
        'pf2e-ratings.enableEquipment': boolean;
        'pf2e-ratings.enableFeats': boolean;
    }
}

export class Module {
    compendiumController!: CompendiumController;
    id: typeof config.moduleName = config.moduleName;
    readonly dataSource: DataSource;

    constructor() {
        this.dataSource = new DataSource(API_URL);
        Hooks.once('ready', () => {
            this.compendiumController = new CompendiumController(this);
        });

        (game as InitGame).settings.register(this.id, 'currentUser', {
            scope: 'client',
            config: false,
        });

        (game as InitGame).settings.register(this.id, 'enableSpells', {
            name: 'Enable Spell Ratings',
            hint: 'Enables ratings for spells in the Compendium Browser.',
            scope: 'client',
            config: true,
            type: Boolean,
            default: true,
            requiresReload: true
        });

        (game as InitGame).settings.register(this.id, 'enableEquipment', {
            name: 'Enable Equipment Ratings',
            hint: 'Enables ratings for equipment in the Compendium Browser.',
            scope: 'client',
            config: true,
            type: Boolean,
            default: true,
            requiresReload: true
        });

        (game as InitGame).settings.register(this.id, 'enableFeats', {
            name: 'Enable Feat Ratings',
            hint: 'Enables ratings for feats in the Compendium Browser.',
            scope: 'client',
            config: true,
            type: Boolean,
            default: true,
            requiresReload: true
        });
    }
}
