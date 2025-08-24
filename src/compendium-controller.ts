import { dataController } from './config.ts';

export class CompendiumController {
    compendiumBrowser: any;
    tabObserver: MutationObserver | null = null;
    resultListObserver: MutationObserver | null = null;

    ratingElementHash: { [key: string]: HTMLElement } = {};

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

    updateTab() {
        if (this.resultListObserver) {
            this.resultListObserver.disconnect();
            this.resultListObserver = null;
        }

        const tabName = this.compendiumBrowser.activeTab.tabName;

        switch (tabName) {
            case 'spell': {
                const resultList = this.compendiumBrowser.$state.resultList;
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
                break;
            }
            default:
                break;
        }
    }

    async updateResultList() {
        const activeTab = this.compendiumBrowser.activeTab;
        //const tabName = activeTab.tabName;
        const results = activeTab.results.slice(0, activeTab.resultLimit);
        const resultElements = Array.from(this.compendiumBrowser.$state.resultList.children) as HTMLElement[];

        const ratingElementHash = this.ratingElementHash;

        const ratings = await dataController.getRatings(activeTab.tabName, results);

        for (let i = 0; i < results.length; i++) {
            const item = results[i];
            const itemElement = resultElements[i];

            if (!ratingElementHash[item.uuid]) {
                ratingElementHash[item.uuid] = this.createRatingElement();
            }
            const ratingElement = ratingElementHash[item.uuid];

            // Create a new rating entry in the db
            if (ratings[item.uuid] == null) {
                dataController.addNewEntry(item.uuid, activeTab.tabName);
                ratings[item.uuid] = { id: item.uuid, rating: null };
            }

            this.updateRatingElement(ratingElementHash[item.uuid], ratings[item.uuid]?.rating);
            itemElement.insertBefore(ratingElement, itemElement.querySelector('.level'));
        }
    }

    createRatingElement(): HTMLElement {
        const ratingElement = document.createElement('div');
        ratingElement.classList.add('rating');

        const ratingText = document.createElement('span');
        ratingElement.appendChild(ratingText);

        const starElement = document.createElement('i');
        starElement.classList.add('fa-solid', 'fa-star');
        ratingElement.appendChild(starElement);

        return ratingElement;
    }

    updateRatingElement(element: HTMLElement, rating: number | null) {
        const ratingText = element.querySelector('span') as HTMLElement;
        if (!rating) {
            ratingText.textContent = '?';
        } else {
            ratingText.textContent = rating.toFixed(1);
        }
    }
}
