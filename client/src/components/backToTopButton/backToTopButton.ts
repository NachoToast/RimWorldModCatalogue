import { ComponentName } from '../../types/ComponentName';
import { CustomAttribute } from '../../types/CustomAttribute';
import './backToTopButton.css';

export function generateBackToTopButtons(): void {
    for (const buttonElement of document.querySelectorAll<HTMLButtonElement>(
        `button[${CustomAttribute.Generate}="${ComponentName.BackToTopButton}"]`,
    )) {
        buttonElement.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}
