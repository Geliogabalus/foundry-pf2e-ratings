import { Entry } from '../data/data-source.ts';
import { Component, ComponentOptions } from './component.ts';
import { openRatingPopup } from './rating-popup.ts';

export interface RatingElementOptions extends ComponentOptions {
    entry: Entry;
    onClose?: (updated: boolean) => void;
}

export class RatingElement extends Component<RatingElementOptions> {
    declare element: HTMLDivElement;

    render() {
        const element = this.element = document.createElement('div');
        element.onclick = (evt) => {
            evt.stopPropagation();
            openRatingPopup(element, {
                entry: this.options.entry,
                onClose: this.options.onClose
            });
        }
        element.classList.add('rating');

        const ratingText = document.createElement('span');
        element.appendChild(ratingText);

        const starElement = document.createElement('i');
        starElement.classList.add('fa-solid', 'fa-star');
        element.appendChild(starElement);

        return element;
    }

    update(rating: number | null) {
        const ratingText = this.element.querySelector('span') as HTMLElement;
        if (!rating) {
            ratingText.textContent = '?';
            this.element.style.color = 'unset';
        } else {
            this.element.style.color = '#ff4545';
            if (rating > 2) {
                this.element.style.color = '#ffa534';
            }
            if (rating > 3) {
                this.element.style.color = '#ffe234';
            }
            if (rating > 4) {
                this.element.style.color = '#57e32c';
            }

            ratingText.textContent = rating.toFixed(1);
        }
    }
}
