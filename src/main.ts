import './styles.scss';
import * as config from './config.ts';

CONFIG.debug.hooks = true;

Hooks.once('init', () => {
    config.logger.log('Initializing module');
});
