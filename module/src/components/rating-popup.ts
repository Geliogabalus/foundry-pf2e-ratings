import { CurrentUser } from '../module.ts';
import { moduleName } from '../config.ts';
import { Entry, EntryRatings } from '../data/data-source.ts';
import { Component, ComponentOptions, createComponent } from './component.ts';

let popupInstance: RatingPopup | null = null;

export function openRatingPopup(target: HTMLElement, options: RatingPopupOptions): RatingPopup | null {
    if (popupInstance?.options.entry === options.entry) {
        return popupInstance;
    }

    closeRatingPopup();

    popupInstance = createComponent(RatingPopup, options) as RatingPopup;
    document.body.appendChild(popupInstance.element);
    const rect = target.getBoundingClientRect();
    popupInstance.element.style.top = `${rect.bottom + window.scrollY}px`;
    popupInstance.element.style.left = `${rect.left + window.scrollX}px`;
    return popupInstance;
}

export function closeRatingPopup() {
    if (popupInstance) {
        popupInstance.close();
        popupInstance = null;
    }
}

const parser = new DOMParser();
const template = parser.parseFromString(/* html */`
    <div class="rating-popup">
        <div class="header"></div>
        <div class="body">
            <div class="ratings">
                <div class="rating-entry" data-value="1">
                    <div class="rating-value">1</div>
                    <div class="rating-bar-wrapper"><div class="rating-bar-background"><div class="rating-bar-fill"></div></div></div>
                </div>
                <div class="rating-entry" data-value="2">
                    <div class="rating-value">2</div>
                    <div class="rating-bar-wrapper"><div class="rating-bar-background"><div class="rating-bar-fill"></div></div></div>
                </div>
                <div class="rating-entry" data-value="3">
                    <div class="rating-value">3</div>
                    <div class="rating-bar-wrapper"><div class="rating-bar-background"><div class="rating-bar-fill"></div></div></div>
                </div>
                <div class="rating-entry" data-value="4">
                    <div class="rating-value">4</div>
                    <div class="rating-bar-wrapper"><div class="rating-bar-background"><div class="rating-bar-fill"></div></div></div>
                </div>
                <div class="rating-entry" data-value="5">
                    <div class="rating-value">5</div>
                    <div class="rating-bar-wrapper"><div class="rating-bar-background"><div class="rating-bar-fill"></div></div></div>
                </div>
            </div>
            <div class="total">
                <div class="total-value"></div>
                <div class="total-count"></div>
            </div>
        </div>
        <div class="footer"></div>
    </div>
`, 'text/html').body.firstChild as HTMLElement;

export interface RatingPopupOptions extends ComponentOptions {
    entry: Entry,
    onClose?: (updated: boolean) => void;
};

export class RatingPopup extends Component<RatingPopupOptions> {
    declare element: HTMLDivElement;

    timerMax = 120;
    timerInterval = 2;
    timerLeft = this.timerMax;
    timer: NodeJS.Timeout | null = null;

    currentUser: CurrentUser | null = null;
    originalRating: number | null = null;
    currentRating: number | null = null;
    entryRatings: EntryRatings | null = null;

    override render(): HTMLElement {
        this.element = template.cloneNode(true) as HTMLDivElement;
        const header = this.element.querySelector('.header') as HTMLElement;
        header.innerText = this.options.entry.name;

        this.update();

        setTimeout(() => {
            const onOutsideClick = (event: MouseEvent) => {
                if (!this.element?.contains(event.target as Node)) {
                    closeRatingPopup();
                    document.removeEventListener('click', onOutsideClick);
                }
            }
            document.addEventListener('click', onOutsideClick);
        }, 0);

        return this.element;
    }

    async update() {
        this.currentUser = (game as ReadyGame).settings.get(moduleName, 'currentUser') || null;
        this.entryRatings = await this.module.dataSource.getEntryRatings(this.options.entry.uuid);
        if (this.currentUser) {
            this.originalRating = this.currentRating = await this.module.dataSource.getUserRating(this.currentUser.id, this.options.entry.uuid);
        }

        this.updateRatings();
        this.updateFooter();
    }

    updateRatings() {
        const totalRatings = this.entryRatings![1] + this.entryRatings![2] + this.entryRatings![3] + this.entryRatings![4] + this.entryRatings![5];
        const totalScore = (this.entryRatings![1] * 1 + this.entryRatings![2] * 2 + this.entryRatings![3] * 3 + this.entryRatings![4] * 4 + this.entryRatings![5] * 5);
        const rating = totalRatings > 0 ? (totalScore / totalRatings) : 0;

        const ratingsContainer = this.element.querySelector('.ratings') as HTMLElement;
        for (let i = 1; i <= 5; i++) {
            const ratingEntry = ratingsContainer.querySelector(`.rating-entry[data-value="${i}"]`) as HTMLElement;
            const ratingBarFill = ratingEntry.querySelector('.rating-bar-fill') as HTMLElement;
            const count = this.entryRatings![i] || 0;
            const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
            ratingBarFill.style.paddingLeft = `${percentage}%`;
        }

        const totalValue = this.element.querySelector('.total-value') as HTMLElement;
        totalValue.innerText = rating > 0 ? rating.toFixed(1) : '?';

        const totalCount = this.element.querySelector('.total-count') as HTMLElement;
        totalCount.innerText = `${totalRatings} rating${totalRatings !== 1 ? 's' : ''}`;
    }

    updateFooter() {
        const footer = this.element.querySelector('.footer') as HTMLElement;
        footer.innerHTML = '';

        if (this.currentUser) {
            const starsContainer = document.createElement('div');
            starsContainer.classList.add('stars-container');
            footer.appendChild(starsContainer);
            const markRated = () => {
                const rating = this.currentRating || 0;
                const stars = starsContainer.querySelectorAll('i');
                stars.forEach(star => {
                    const value = parseInt(star.dataset['value'] || '0');
                    if (rating && value <= rating) {
                        star.classList.add('marked');
                    } else {
                        star.classList.remove('marked');
                    }
                });
            }

            for (let i = 1; i <= 5; i++) {
                const starElement = document.createElement('i');
                starElement.classList.add('fa-solid', 'fa-star');
                starElement.dataset['value'] = i.toString();
                starsContainer.appendChild(starElement);

                starElement.onclick = async (evt) => {
                    evt.preventDefault();
                    evt.stopPropagation();
                    this.currentRating = i;

                    markRated();
                }
            }
            markRated();

            const userTag = document.createElement('span');
            userTag.classList.add('user-tag');
            userTag.innerText = this.currentUser.name;
            footer.appendChild(userTag);

            footer.appendChild(document.createTextNode(' | '));

            const logoutLink = document.createElement('a');
            logoutLink.innerText = 'Log out';
            logoutLink.onclick = (evt) => {
                evt.preventDefault();
                evt.stopPropagation();

                game.settings?.set(moduleName, 'currentUser', null);
                this.currentUser = null;
                this.updateFooter();
            }
            footer.appendChild(logoutLink);
        } else {
            const loginButton = document.createElement('button');
            loginButton.onclick = (evt) => {
                evt.preventDefault();
                evt.stopPropagation();

                const authId = foundry.utils.randomID(42);
                const discordUrl = `https://discord.com/oauth2/authorize?client_id=1410957967163002900&response_type=code&redirect_uri=https%3A%2F%2Fgeliogabalus-pf2e-ratings.duckdns.org%2Foauth2&scope=identify&state=${authId}`;
                window.open(discordUrl, '_blank');

                loginButton.style.display = 'none';
                const waitingText = document.createElement('span');
                waitingText.innerText = 'Waiting for authentication...';
                footer.appendChild(waitingText);

                this.timerLeft = this.timerMax;
                this.timer = setInterval(async () => {
                    this.timerLeft -= this.timerInterval;

                    const user = await this.module.dataSource.getUserData(authId);

                    if (this.timerLeft <= 0 || user) {

                        if (user) {
                            this.currentUser = {
                                name: user.username,
                                id: user.id
                            };
                            game.settings?.set(moduleName, 'currentUser', this.currentUser);
                        }

                        this.stopTimer();
                        this.update();
                    }
                }, this.timerInterval * 1000);
            }
            loginButton.innerText = 'Log in with Discord';
            footer.appendChild(loginButton);
        }
    }

    private stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    async close() {
        this.stopTimer();

        if (this.currentUser && this.currentRating && this.currentRating !== this.originalRating) {
            await this.saveCurrentRating();
            if (this.options.onClose) this.options.onClose(true);
        } else {
            if (this.options.onClose) this.options.onClose(false);
        }

        this.element?.remove();
    }

    async saveCurrentRating() {
        try {
            await this.module.dataSource.updateUserRating(this.currentUser!.id, this.options.entry.uuid, this.currentRating!);
        } catch (error) {
            logger.error('Failed to save rating:', error);
        }
    }
}
