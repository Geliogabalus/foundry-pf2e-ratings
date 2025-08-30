import { RatingItem } from '../data/data-source.ts';
import { Module } from '../module.ts';
import { RatingElement } from '../components/rating-element.ts';

declare module '#configuration' {
    interface HookConfig {
        renderCompendiumBrowser: (app: any) => boolean;
        closeCompendiumBrowser: () => boolean;
    }
}

export class CompendiumController {
    declare module: Module;

    compendiumBrowser: any;
    tabObserver: MutationObserver | null = null;
    resultListObserver: MutationObserver | null = null;

    ratings: Record<string, RatingItem> = {}
    ratingElementHash: { [key: string]: RatingElement } = {};

    constructor() {
        Hooks.on('renderCompendiumBrowser', (app: any) => {
            this.compendiumBrowser = app;
            const browserTabElement = app.element.querySelector('.browser-tab') as HTMLElement;
            if (browserTabElement.hasAttribute('data-tab-name')) {
                this.updateTab();
                this.tabObserver = new MutationObserver(() => {
                    const tabName = browserTabElement.getAttribute('data-tab-name');
                    if (tabName) {
                        this.updateTab();
                    }
                });

                this.tabObserver.observe(browserTabElement, {
                    attributes: true,
                    attributeFilter: ['data-tab-name']
                });
                return;
            }

            const windowContentElement = app.element.querySelector('.window-content');
            const windowContentObserver = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        const addedNode = mutation.addedNodes[0];
                        if (addedNode instanceof HTMLElement && addedNode.classList.contains('browser-tab')) {
                            windowContentObserver.disconnect();
                            if (this.tabObserver) {
                                this.tabObserver.disconnect();
                            }

                            if (addedNode.hasAttribute('data-tab-name')) {
                                this.updateTab();
                            }

                            this.tabObserver = new MutationObserver(() => {
                                const tabName = addedNode.getAttribute('data-tab-name');
                                if (tabName) {
                                    this.updateTab();
                                }
                            });

                            this.tabObserver.observe(addedNode, {
                                attributes: true,
                                attributeFilter: ['data-tab-name']
                            });
                        }
                    }
                }
            });

            windowContentObserver.observe(windowContentElement, {
                childList: true
            });
        });

        Hooks.on('closeCompendiumBrowser', () => {
            this.compendiumBrowser = null;
            if (this.tabObserver) {
                this.tabObserver.disconnect();
                this.tabObserver = null;
            }
        });
    }

    async updateTab() {
        if (this.resultListObserver) {
            this.resultListObserver.disconnect();
            this.resultListObserver = null;
        }

        const tabName = this.compendiumBrowser.activeTab.tabName;
        let enabled = false;

        switch (tabName) {
            case 'spell': {
                enabled = true;
                break;
            }
            default:
                break;
        }

        if (enabled) {
            const resultList = this.compendiumBrowser.$state.resultList;
            await this.updateRatings(tabName);

            if (resultList) {
                this.updateResultList();

                this.resultListObserver = new MutationObserver(() => {
                    if (this.compendiumBrowser.activeTab.tabName !== tabName)
                        return;
                    this.updateResultList();
                });

                this.resultListObserver.observe(resultList, {
                    childList: true
                });
            }
        }
    }

    updateResultList() {
        const activeTab = this.compendiumBrowser.activeTab;
        const results = activeTab.results.slice(0, activeTab.resultLimit);
        const resultElements = Array.from(this.compendiumBrowser.$state.resultList.children) as HTMLElement[];

        const ratingElementHash = this.ratingElementHash;

        for (let i = 0; i < results.length; i++) {
            const entry = results[i];
            const id = entry.uuid;
            const entryElement = resultElements[i];

            if (!ratingElementHash[id]) {
                ratingElementHash[id] = new RatingElement({
                    entry: entry,
                    onClose: (updated: boolean) => {
                        if (updated) {
                            this.updateRatings(this.compendiumBrowser.activeTab.tabName).then(() => {
                                ratingElementHash[id].update(this.ratings[entry.uuid]?.rating);
                            });
                        }
                    }
                });
            }
            // Create a new rating entry in the db
            if (this.ratings[id] == null) {
                this.module.dataSource.addNewEntry(id, activeTab.tabName);
                this.ratings[id] = { id: id, rating: null };
            }

            ratingElementHash[id].update(this.ratings[id]?.rating);

            const ratingElement = ratingElementHash[id].element;
            entryElement.insertBefore(ratingElement, entryElement.querySelector('.level'));
        }
    }

    async updateRatings(type: string) {
        this.ratings = await this.module.dataSource.getRatingsByType(type);
    }
}
