import './styles.scss';
import * as config from './config.ts';
import { Module } from './module.ts';

CONFIG.debug.hooks = false;

Hooks.once('init', () => {
    config.log('Initializing module');

    (<any>game)['PF2ERatings'] = new Module();
});
