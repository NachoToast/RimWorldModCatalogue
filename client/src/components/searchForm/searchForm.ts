import { loadSearchOptions, saveSearchOptions } from '../../global/searchOptions';
import { makeSearch } from '../../main';
import { CheckboxState } from '../../types/CheckboxState';
import { ComponentName } from '../../types/ComponentName';
import { CustomAttribute } from '../../types/CustomAttribute';
import { IncluderType } from '../../types/IncluderType';
import { ModDLCs } from '../../types/shared/ModDLCs';
import { ModSearchOptions } from '../../types/shared/ModSearchOptions';
import { ModTags } from '../../types/shared/ModTags';

export function generateSearchForms(): void {
    for (const formElement of document.querySelectorAll<HTMLFormElement>(
        `form[${CustomAttribute.Generate}="${ComponentName.SearchForm}"]`,
    )) {
        formElement.addEventListener('submit', (event) => {
            event.preventDefault();

            const { dlcsInclude, dlcsExclude } = getFormDLCs(formElement);
            const { tagsInclude, tagsExclude } = getFormTags(formElement);
            const search = getFormTextSearch(formElement);

            const searchOptions: ModSearchOptions = {
                ...loadSearchOptions(),
                dlcsInclude,
                dlcsExclude,
                tagsInclude,
                tagsExclude,
                search,
            };

            saveSearchOptions(searchOptions);
            makeSearch(searchOptions);
        });
    }
}

function getFormDLCs(form: HTMLFormElement): Pick<ModSearchOptions, 'dlcsInclude' | 'dlcsExclude'> {
    let dlcsInclude = ModDLCs.None;
    let dlcsExclude = ModDLCs.None;

    const dlcIncluder = form.querySelector<HTMLUListElement>(
        `ul[${CustomAttribute.Generate}="${ComponentName.Includer}"][${CustomAttribute.IncluderType}="${IncluderType.DLC}"]`,
    );

    if (dlcIncluder === null) return { dlcsInclude, dlcsExclude };

    for (const labelElement of dlcIncluder.querySelectorAll<HTMLLabelElement>('label')) {
        const state = labelElement.getAttribute(CustomAttribute.State) as CheckboxState;
        if (state === CheckboxState.Unchecked) continue;

        const value = Number(labelElement.getAttribute(CustomAttribute.Value)) as ModDLCs;

        switch (state) {
            case CheckboxState.Including:
                dlcsInclude |= value;
                break;
            case CheckboxState.Excluding:
                dlcsExclude |= value;
                break;
        }
    }

    return { dlcsInclude, dlcsExclude };
}

function getFormTags(form: HTMLFormElement): Pick<ModSearchOptions, 'tagsInclude' | 'tagsExclude'> {
    let tagsInclude = ModTags.None;
    let tagsExclude = ModTags.None;

    const tagIncluder = form.querySelector<HTMLUListElement>(
        `ul[${CustomAttribute.Generate}="${ComponentName.Includer}"][${CustomAttribute.IncluderType}="${IncluderType.Tag}"]`,
    );

    if (tagIncluder === null) return { tagsInclude, tagsExclude };

    for (const labelElement of tagIncluder.querySelectorAll<HTMLLabelElement>('label')) {
        const state = labelElement.getAttribute(CustomAttribute.State) as CheckboxState;
        if (state === CheckboxState.Unchecked) continue;

        const value = Number(labelElement.getAttribute(CustomAttribute.Value)) as ModTags;

        switch (state) {
            case CheckboxState.Including:
                tagsInclude |= value;
                break;
            case CheckboxState.Excluding:
                tagsExclude |= value;
                break;
        }
    }

    return { tagsInclude, tagsExclude };
}

export function getFormTextSearch(form: HTMLFormElement): string | undefined {
    const searchInput = form.querySelector<HTMLInputElement>(
        `input[${CustomAttribute.Generate}="${ComponentName.ModTextSearcher}"]`,
    );

    return searchInput?.value || undefined;
}
