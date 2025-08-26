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

export class RatingPopup {

    element: HTMLElement;

    constructor(public entry: any) {
        this.element = document.createElement('div');
        this.element.classList.add('rating-popup');

        const header = document.createElement('div');
        header.classList.add('header');
        header.innerText = entry.name;
        this.element.appendChild(header);

        const body = document.createElement('div');
        body.classList.add('body');
        this.element.appendChild(body);

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
        footer.innerText = 'Rate it';
        this.element.appendChild(footer);

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

    remove() {
        this.element?.remove();
    }
}
