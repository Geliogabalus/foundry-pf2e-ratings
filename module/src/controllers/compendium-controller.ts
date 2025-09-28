import { RatingItem } from '../data/data-source.ts';
import { Module } from '../module.ts';
import { RatingElement } from '../components/rating-element.ts';
import { createComponent } from 'src/components/component.ts';

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

    ratingsMap: Map<string, Promise<Map<string, RatingItem>>> = new Map();
    ratingElementHash: { [key: string]: RatingElement } = {};

    enabledTabs = ['spell'];

    constructor() {
        this.compendiumBrowser = (game as any).pf2e.compendiumBrowser;

        this.enabledTabs.forEach(tabName => {
            this.injectTab(this.compendiumBrowser.tabs[tabName]);
        });

        Hooks.on('renderCompendiumBrowser', (app: any) => {
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
            if (this.tabObserver) {
                this.tabObserver.disconnect();
                this.tabObserver = null;
            }
        });
    }

    injectTab(tab: any) {
        tab.filterData.order.options.rating = {
            label: 'Rating',
            type: 'numeric'
        }

        const superLoadData = tab.loadData;
        tab.loadData = async (...args: any[]) => {
            this.updateRatings(tab.tabName);
            await superLoadData.apply(tab, args);
        }

        const superSortResult = tab.sortResult;
        tab.sortResult = function (result: any[]) {
            if (!this.filterData) return [];
            const order = this.filterData.order;
            if (order.by !== 'rating') return superSortResult.call(this, result);

            const ratings = this['__ratings'] as Map<string, RatingItem>;
            const sorted = result.sort((entryA, entryB) => {
                const ratingA = ratings?.get(entryA.uuid)?.rating ?? 0;
                const ratingB = ratings?.get(entryB.uuid)?.rating ?? 0;
                return ratingA - ratingB;
            });
            return order.direction === "asc" ? sorted : sorted.reverse();
        }
    }

    async updateTab() {
        if (this.resultListObserver) {
            this.resultListObserver.disconnect();
            this.resultListObserver = null;
        }

        const tab = this.compendiumBrowser.activeTab;
        const ratings = await this.getRatings(tab.tabName);
        tab['__ratings'] = ratings;

        if (this.enabledTabs.includes(tab.tabName)) {
            const resultList = this.compendiumBrowser.$state.resultList;

            if (resultList) {
                this.updateResultList(tab);

                this.resultListObserver = new MutationObserver(() => {
                    if (this.compendiumBrowser.activeTab.tabName !== tab.tabName)
                        return;
                    this.updateResultList(tab);
                });

                this.resultListObserver.observe(resultList, {
                    childList: true
                });
            }
        }
    }

    updateResultList(tab: any) {
        const activeTab = this.compendiumBrowser.activeTab;
        const tabName = activeTab.tabName;
        const results = activeTab.results.slice(0, activeTab.resultLimit);
        const resultElements = Array.from(this.compendiumBrowser.$state.resultList.children) as HTMLElement[];

        const ratingElementHash = this.ratingElementHash;
        const tabRatings = tab['__ratings'] as Map<string, RatingItem>;

        for (let i = 0; i < results.length; i++) {
            const entry = results[i];
            const id = entry.uuid;
            const entryElement = resultElements[i];

            if (!ratingElementHash[id]) {
                ratingElementHash[id] = createComponent(RatingElement,{
                    entry: entry,
                    onClose: (updated: boolean) => {
                        if (updated) {
                            this.updateRatings(tabName);
                            this.getRatings(tabName).then(ratings => {
                                tab['__ratings'] = ratings;
                                ratingElementHash[id].update(ratings?.get(entry.uuid)?.rating);
                            });
                        }
                    }
                }) as RatingElement;
            }
            // Create a new rating entry in the db
            if (!tabRatings.has(id)) {
                this.module.dataSource.addNewEntry(id, activeTab.tabName);
                tabRatings.set(id, { id: id, rating: null });
            }

            ratingElementHash[id].update(tabRatings.get(id)?.rating);

            const ratingElement = ratingElementHash[id].element;
            entryElement.insertBefore(ratingElement, entryElement.querySelector('.level'));
        }
    }

    async updateRatings(type: string) {
        this.ratingsMap.set(type, this.module.dataSource.getRatingsByType(type).then(data => new Map(Object.entries(data))));
    }

    async getRatings(tabName: string) {
        return this.ratingsMap.get(tabName);
    }
}
