import { Module } from '../module.ts';

export interface ComponentOptions { }

export abstract class Component<T extends ComponentOptions = ComponentOptions> {
    module: Module;
    element: HTMLElement;

    constructor(public options: T) {
        this.module = (<any>game)['PF2ERatings'];
        this.element = this.render();
    }

    abstract render(): HTMLElement;
}
