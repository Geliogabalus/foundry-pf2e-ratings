import { Module } from '../module.ts';

export interface ComponentOptions { }

export function createComponent<T extends ComponentOptions>(ComponentClass: new (options: T) => Component<T>, options: T): Component {
    const component = new ComponentClass(options);
    component.render();
    return component;
}

export abstract class Component<T extends ComponentOptions = ComponentOptions> {
    module: Module;
    element: HTMLElement | null = null;

    constructor(public options: T) {
        this.module = (<any>game)['PF2ERatings'];
    }

    abstract render(): HTMLElement;
}
