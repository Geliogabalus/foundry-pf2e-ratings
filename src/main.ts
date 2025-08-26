import './styles.scss';
import * as config from './config.ts';

CONFIG.debug.hooks = false;

Hooks.once('init', () => {
    config.logger.log('Initializing module');

    game.settings.register(config.moduleName, 'currentUser', {
        scope: 'client',
        config: false,
    });
});
