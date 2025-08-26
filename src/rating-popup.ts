import { dataController } from './config.ts';
import { moduleName } from './config.ts';

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
        popupInstance.remove();
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
    totalValue.innerText = '0.0';
    total.appendChild(totalValue);

    const totalCount = document.createElement('div');
    totalCount.classList.add('total-count');
    totalCount.innerText = '0 ratings';
    total.appendChild(totalCount);

    const footer = document.createElement('div');
    footer.classList.add('footer');
    element.appendChild(footer);

    return element;
}

const popupElementTemplate = createPopupElementTemplate();

export class RatingPopup {

    currentUser: string | null;
    element: HTMLElement;

    constructor(public entry: any) {
        this.element = popupElementTemplate.cloneNode(true) as HTMLElement;

        this.currentUser = game.settings.get(moduleName, 'currentUser') || null;

        const header = this.element.querySelector('.header') as HTMLElement;
        header.innerText = this.entry.name;

        this.updateFooter();

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

    updateFooter() {
        const footer = this.element.querySelector('.footer') as HTMLElement;
        footer.innerHTML = '';

        if (this.currentUser) {
            const userTag = document.createElement('span');
            userTag.classList.add('user-tag');
            userTag.innerText = this.currentUser;
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

    remove() {
        this.element?.remove();
    }

    async checkCredentials(username: string, password: string) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const passwordHash = await window.crypto.subtle.digest("SHA-256", data);
        const passwordHashString = Array.from(new Uint8Array(passwordHash)).map(b => b.toString(16).padStart(2, '0')).join('');

        const exist = await dataController.authUser(username, passwordHashString);

        if (exist) {
            game.settings.set(moduleName, 'currentUser', username);
            this.currentUser = username;
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
            await dataController.createUser(username, passwordHashString);
        } catch (error) {
            return;
        }

        game.settings.set(moduleName, 'currentUser', username);
        this.currentUser = username;
        this.updateFooter();
    }
}
