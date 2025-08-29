import { dataController, logger } from './config.ts';
import { moduleName } from './config.ts';
import { EntryRatings } from './data-controller.ts';

let popupInstance: RatingPopup | null = null;

type onCloseCallback = (updated: boolean) => void;

export interface PopupOptions {
    entry: any,
    onClose?: onCloseCallback
};

export function openRatingPopup(target: HTMLElement, options: PopupOptions): RatingPopup | null {
    if (popupInstance?.options.entry === options.entry) {
        return popupInstance;
    }

    closeRatingPopup();

    popupInstance = new RatingPopup(options);
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

const createPopupElementTemplate = () => {
    const element = document.createElement('div');
    element.classList.add('rating-popup');

    const header = document.createElement('div');
    header.classList.add('header');
    element.appendChild(header);

    const body = document.createElement('div');
    body.classList.add('body');
    element.appendChild(body);

    const ratings = document.createElement('div');
    ratings.classList.add('ratings');

    for (let i = 1; i <= 5; i++) {
        const ratingEntry = document.createElement('div');
        ratingEntry.classList.add('rating-entry');
        ratingEntry.dataset['value'] = i.toString();
        ratings.appendChild(ratingEntry);

        const ratingValue = document.createElement('div');
        ratingValue.classList.add('rating-value');
        ratingValue.innerText = i.toString();
        ratingEntry.appendChild(ratingValue);

        const ratingBarWrapper = document.createElement('div');
        ratingBarWrapper.classList.add('rating-bar-wrapper');
        ratingEntry.appendChild(ratingBarWrapper);

        const ratingBarBackground = document.createElement('div');
        ratingBarBackground.classList.add('rating-bar-background');
        ratingBarWrapper.appendChild(ratingBarBackground);

        const ratingBarFill = document.createElement('div');
        ratingBarFill.classList.add('rating-bar-fill');
        ratingBarBackground.appendChild(ratingBarFill);
    }
    body.appendChild(ratings);

    const total = document.createElement('div');
    total.classList.add('total');
    body.appendChild(total);

    const totalValue = document.createElement('div');
    totalValue.classList.add('total-value');
    total.appendChild(totalValue);

    const totalCount = document.createElement('div');
    totalCount.classList.add('total-count');
    total.appendChild(totalCount);

    const footer = document.createElement('div');
    footer.classList.add('footer');
    element.appendChild(footer);

    return element;
}

const popupElementTemplate = createPopupElementTemplate();

interface CurrentUser {
    name: string;
    id: number;
}

export class RatingPopup {

    timerMax = 120;
    timerInterval = 2;
    timerLeft = this.timerMax;
    timer: NodeJS.Timeout | null = null;

    currentUser: CurrentUser | null;
    originalRating: number | null = null;
    currentRating: number | null = null;
    entryRatings: EntryRatings | null = null;

    element: HTMLElement;

    constructor(public options: PopupOptions) {
        this.element = popupElementTemplate.cloneNode(true) as HTMLElement;

        this.currentUser = game.settings.get(moduleName, 'currentUser') || null;
        const header = this.element.querySelector('.header') as HTMLElement;
        header.innerText = this.options.entry.name;

        this.getData();

        setTimeout(() => {
            const onOutsideClick = (event: MouseEvent) => {
                if (!this.element?.contains(event.target as Node)) {
                    closeRatingPopup();
                    document.removeEventListener('click', onOutsideClick);
                }
            }
            document.addEventListener('click', onOutsideClick);
        }, 0);
    }

    async getData() {
        this.entryRatings = await dataController.getEntryRatings(this.options.entry.uuid);
        if (this.currentUser) {
            this.originalRating = this.currentRating = await dataController.getUserRating(this.currentUser.id, this.options.entry.uuid);
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

                game.settings.set(moduleName, 'currentUser', null);
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
                const discordUrl = `https://discord.com/oauth2/authorize?client_id=1410957967163002900&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Foauth2&scope=identify&state=${authId}`;
                window.open(discordUrl, '_blank');

                loginButton.style.display = 'none';
                const waitingText = document.createElement('span');
                waitingText.innerText = 'Waiting for authentication...';
                footer.appendChild(waitingText);

                this.timerLeft = this.timerMax;
                this.timer = setInterval(async () => {
                  this.timerLeft -= this.timerInterval;

                  const user = await dataController.getUserData(authId);

                  if (this.timerLeft <= 0 || user) {

                    if (user) {
                        this.currentUser = {
                            name: user.username,
                            id: user.id
                        };
                        game.settings.set(moduleName, 'currentUser', this.currentUser);
                    }

                    this.stopTimer();
                    this.getData();
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
            await dataController.updateUserRating(this.currentUser!.id, this.options.entry.uuid, this.currentRating!);
        } catch (error) {
            logger.error('Failed to save rating:', error);
        }
    }
}
