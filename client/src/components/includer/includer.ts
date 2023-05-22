import { loadSearchOptions } from '../../global/searchOptions';
import { ComponentName } from '../../types/ComponentName';
import { CustomAttribute } from '../../types/CustomAttribute';
import { IncluderType } from '../../types/IncluderType';
import { dlcIncluder } from './dlcIncluder';
import { tagIncluder } from './tagIncluder';
import './includer.css';

export function generateIncluders(): void {
    const { dlcsInclude, dlcsExclude, tagsInclude, tagsExclude } = loadSearchOptions();

    for (const listElement of document.querySelectorAll<HTMLUListElement>(
        `ul[${CustomAttribute.Generate}="${ComponentName.Includer}"]`,
    )) {
        const type = listElement.getAttribute(CustomAttribute.IncluderType) as IncluderType;

        switch (type) {
            case IncluderType.DLC:
                dlcIncluder(listElement, dlcsInclude, dlcsExclude);
                break;
            case IncluderType.Tag:
                tagIncluder(listElement, tagsInclude, tagsExclude);
                break;
            default:
                console.warn(`Unknown ${CustomAttribute.IncluderType}: ${type}`, listElement);
        }
    }
}
