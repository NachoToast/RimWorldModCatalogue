import { CheckboxState } from '../../types/CheckboxState';
import { CustomAttribute } from '../../types/CustomAttribute';
import { ModTags } from '../../types/shared/ModTags';

const tagNames = Object.values(ModTags)
    .filter((e): e is string => typeof e === 'string')
    .slice(1);

const tagValues = Object.values(ModTags)
    .filter((e): e is number => typeof e === 'number')
    .slice(1);

const numTags = tagNames.length;

export function tagIncluder(listElement: HTMLUListElement, alreadyIncluded: ModTags, alreadyExcluded: ModTags): void {
    listElement.innerHTML = '';
    for (let i = 0; i < numTags; i++) {
        const labelElement = document.createElement('label');
        labelElement.classList.add('noselect');
        labelElement.setAttribute(CustomAttribute.Value, tagValues[i].toString());

        const spanElement = document.createElement('span');
        spanElement.innerText = tagNames[i];
        labelElement.appendChild(spanElement);

        const checkboxElement = document.createElement('input');
        checkboxElement.type = 'checkbox';
        labelElement.appendChild(checkboxElement);

        checkboxElement.addEventListener('change', () => {
            const previousState = labelElement.getAttribute(CustomAttribute.State) as CheckboxState;

            let newState: CheckboxState;

            switch (previousState) {
                case CheckboxState.Unchecked:
                    newState = CheckboxState.Including;
                    break;
                case CheckboxState.Including:
                    newState = CheckboxState.Excluding;
                    break;
                case CheckboxState.Excluding:
                    newState = CheckboxState.Unchecked;
                    break;
            }

            checkboxElement.checked = newState !== CheckboxState.Unchecked;
            labelElement.setAttribute(CustomAttribute.State, newState);
        });

        // initial state
        if ((alreadyIncluded & tagValues[i]) === tagValues[i]) {
            labelElement.setAttribute(CustomAttribute.State, CheckboxState.Including);
            checkboxElement.checked = true;
        } else if ((alreadyExcluded & tagValues[i]) === tagValues[i]) {
            labelElement.setAttribute(CustomAttribute.State, CheckboxState.Excluding);
            checkboxElement.checked = true;
        } else {
            labelElement.setAttribute(CustomAttribute.State, CheckboxState.Unchecked);
        }

        listElement.appendChild(labelElement);
    }
}
