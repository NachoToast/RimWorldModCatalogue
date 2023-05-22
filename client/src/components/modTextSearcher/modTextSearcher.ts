import { loadSearchOptions } from '../../global/searchOptions';
import { ComponentName } from '../../types/ComponentName';
import { CustomAttribute } from '../../types/CustomAttribute';

export function generateModTextSearchers(modCount: number): void {
    const { search } = loadSearchOptions();

    for (const inputElement of document.querySelectorAll<HTMLInputElement>(
        `input[${CustomAttribute.Generate}="${ComponentName.ModTextSearcher}"]`,
    )) {
        inputElement.placeholder = inputElement.placeholder.replace('?', modCount.toString());
        inputElement.value = search ?? '';
    }
}
