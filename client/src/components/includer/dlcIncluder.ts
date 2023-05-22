import biotechIcon from '../../assets/BiotechIcon.png';
import ideologyIcon from '../../assets/ExpansionIcon_Ideology.png';
import royaltyIcon from '../../assets/ExpansionIcon_Royalty.png';
import { CheckboxState } from '../../types/CheckboxState';
import { CustomAttribute } from '../../types/CustomAttribute';
import { ModDLCs } from '../../types/shared/ModDLCs';

const dlcIconMap: Record<string, string> = {
    Ideology: ideologyIcon,
    Royalty: royaltyIcon,
    Biotech: biotechIcon,
};

const dlcNames = Object.values(ModDLCs)
    .filter((e): e is string => typeof e === 'string')
    .slice(1);

const dlcValues = Object.values(ModDLCs)
    .filter((e): e is number => typeof e === 'number')
    .slice(1);

const numDlcs = dlcNames.length;

export function dlcIncluder(listElement: HTMLUListElement, alreadyIncluded: ModDLCs, alreadyExcluded: ModDLCs): void {
    listElement.innerHTML = '';
    for (let i = 0; i < numDlcs; i++) {
        const labelElement = document.createElement('label');
        labelElement.classList.add('noselect');
        labelElement.setAttribute(CustomAttribute.Value, dlcValues[i].toString());

        const imgElement = document.createElement('img');
        imgElement.src = dlcIconMap[dlcNames[i]];
        labelElement.appendChild(imgElement);

        const spanElement = document.createElement('span');
        spanElement.innerText = dlcNames[i];
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
        if ((alreadyIncluded & dlcValues[i]) === dlcValues[i]) {
            labelElement.setAttribute(CustomAttribute.State, CheckboxState.Including);
            checkboxElement.checked = true;
        } else if ((alreadyExcluded & dlcValues[i]) === dlcValues[i]) {
            labelElement.setAttribute(CustomAttribute.State, CheckboxState.Excluding);
            checkboxElement.checked = true;
        } else {
            labelElement.setAttribute(CustomAttribute.State, CheckboxState.Unchecked);
        }

        listElement.appendChild(labelElement);
    }
}
