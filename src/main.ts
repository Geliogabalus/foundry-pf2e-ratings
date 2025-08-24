import './styles.scss';
import * as config from './config.ts';

CONFIG.debug.hooks = false;

Hooks.once('init', () => {
    config.logger.log('Initializing module');
});
