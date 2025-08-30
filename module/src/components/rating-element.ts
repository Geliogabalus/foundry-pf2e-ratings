import { Entry } from '../data/data-source.ts';
import { Component, ComponentOptions } from './component.ts';
import { openRatingPopup } from './rating-popup.ts';

export interface RatingElementOptions extends ComponentOptions {
    entry: Entry;
    onClose?: (updated: boolean) => void;
}

export class RatingElement extends Component<RatingElementOptions> {
    render() {
        const element = document.createElement('div');
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
        } else {
            ratingText.textContent = rating.toFixed(1);
        }
    }
}
