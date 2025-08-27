import { dataController, logger } from './config.ts';
import { moduleName } from './config.ts';
import { EntryRatings } from './data-controller.ts';

let popupInstance: RatingPopup | null = null;

export function openRatingPopup(target: HTMLElement, entry: any): RatingPopup | null {
    if (popupInstance?.entry === entry) {
        return popupInstance;
    }

    closeRatingPopup();

    popupInstance = new RatingPopup(entry);
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

    currentUser: CurrentUser | null;
    currentRating: number | null = null;
    entryRatings: EntryRatings | null = null;

    element: HTMLElement;

    constructor(public entry: any) {
        this.element = popupElementTemplate.cloneNode(true) as HTMLElement;

        this.currentUser = game.settings.get(moduleName, 'currentUser') || null;
        const header = this.element.querySelector('.header') as HTMLElement;
        header.innerText = this.entry.name;

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
        this.entryRatings = await dataController.getEntryRatings(this.entry.uuid);
        if (this.currentUser) {
            this.currentRating = await dataController.getUserRating(this.currentUser.id, this.entry.uuid);
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

            markRated();
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
            const loginLink = document.createElement('a');
            loginLink.innerText = 'Log in';
            loginLink.onclick = (evt) => {
                evt.preventDefault();
                evt.stopPropagation();
                const username = prompt('Enter your username:');
                if (!username) return;
                const password = prompt('Enter your password:');
                if (!password) return;

                this.checkCredentials(username, password);
            }
            footer.appendChild(loginLink);
            footer.appendChild(document.createTextNode(' | '));

            const registerLink = document.createElement('a');
            registerLink.innerText = 'Register';
            registerLink.onclick = (evt) => {
                evt.preventDefault();
                evt.stopPropagation();
                const username = prompt('Enter your username:');
                if (!username) return;
                const password = prompt('Enter your password:');
                if (!password) return;

                this.createNewUser(username, password);
            }
            footer.appendChild(registerLink);
        }
    }

    close() {
        this.element?.remove();
    }

    async checkCredentials(username: string, password: string) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const passwordHash = await window.crypto.subtle.digest("SHA-256", data);
        const passwordHashString = Array.from(new Uint8Array(passwordHash)).map(b => b.toString(16).padStart(2, '0')).join('');

        const id = await dataController.authUser(username, passwordHashString);

        if (id) {
            this.currentUser = {
                name: username,
                id: id
            }
            game.settings.set(moduleName, 'currentUser', this.currentUser);
            this.updateFooter();
        } else {
            alert('Invalid username or password');
        }
    }

    async createNewUser(username: string, password: string) {
        const userExists = await dataController.checkUserName(username);
        if (userExists) {
            alert('User with such name already exists');
            return;
        }

        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const passwordHash = await window.crypto.subtle.digest("SHA-256", data);
        const passwordHashString = Array.from(new Uint8Array(passwordHash)).map(b => b.toString(16).padStart(2, '0')).join('');

        try {
            const userId = await dataController.createUser(username, passwordHashString);
            this.currentUser = {
                name: username,
                id: userId as number
            }
            game.settings.set(moduleName, 'currentUser', this.currentUser);
            this.updateFooter();
        } catch (error) {
            return;
        }
    }
}
