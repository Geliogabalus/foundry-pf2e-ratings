import { Entry } from '../data/data-source.ts';
import { Component, ComponentOptions } from './component.ts';
import { openRatingPopup } from './rating-popup.ts';

export interface RatingElementOptions extends ComponentOptions {
    entry: Entry;
    onClose?: (updated: boolean) => void;
}

// Rating color palette (as RGB tuples)

type Color = [number, number, number];

const ratingColorPalette: Color[] = [
    [120, 10, 10],  // dark red
    [180, 30, 30],  // red
    [220, 220, 0],  // yellow
    [0, 200, 0],    // green
    [0, 240, 240],  // cyan
];

const lerpColor = (a: Color, b: Color, t: number): string => {
    const result = a.map((val, i) => Math.round(val + (b[i] - val) * t));
    return `rgb(${result.join(", ")})`;
};

const getRatingColor = (rating: number): string => {
    const index = Math.floor(rating) - 1;
    const nextIndex = Math.min(index + 1, ratingColorPalette.length - 1);
    const t = rating - Math.floor(rating); // fractional part
    return lerpColor(ratingColorPalette[index], ratingColorPalette[nextIndex], t);
};

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
            return;
        }

        this.element.style.color = getRatingColor(rating);

        ratingText.textContent = rating.toFixed(1);
    }
}
