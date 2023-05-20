import './style.css';
import { getMods, postRoot } from './api';
import './config';
import { Mod } from './types/shared/Mod';
import { ModDLCs } from './types/shared/ModDLCs';
import { ModSearchOptions } from './types/shared/ModSearchOptions';
import { ModSortOptions } from './types/shared/ModSortOptions';
import { ModTags } from './types/shared/ModTags';
import { ModId } from './types/shared/Utility';

const searchParams: ModSearchOptions = {
    page: 0,
    perPage: 30,
    sortBy: ModSortOptions.Id,
    sortDirection: 1,
    tagsInclude: ModTags.None,
    tagsExclude: ModTags.None,
    dlcsInclude: ModDLCs.None,
    dlcsExclude: ModDLCs.None,
};

function getQueriedId(): ModId | null {
    return new URLSearchParams(window.location.search).get('id');
}

console.log(getQueriedId());

postRoot().then((rootResponse) => {
    for (const inputElement of document.querySelectorAll<HTMLInputElement>('input[placeholder="Search Mods"]')) {
        inputElement.placeholder = `Search ${rootResponse.estimatedModCount} Mods`;
    }
});

function createModElement(mod: Mod): HTMLDivElement {
    const container = document.createElement('div');
    container.classList.add('mod');

    const thumbnail = document.createElement('img');
    thumbnail.src = mod.thumbnail;
    container.appendChild(thumbnail);

    const starRating = document.createElement('img');
    starRating.src = `https://community.akamai.steamstatic.com/public/images/sharedfiles/${mod.ratingStars}-star_large.png?v=2`;
    container.appendChild(starRating);

    const title = document.createElement('p');
    title.innerText = mod.title;
    container.appendChild(title);

    const author = document.createElement('a');
    author.href = `${mod.authors[0].url}/myworkshopfiles?appid=294100`;
    author.rel = 'noreferrer';
    author.target = '_blank';
    author.innerText = `by ${mod.authors[0].name}`;
    container.appendChild(author);

    return container;
}

async function makeSearch(params: ModSearchOptions): Promise<void> {
    const { page, perPage } = params;

    const { items, totalItemCount } = await getMods(params);

    const startItem = page * perPage + 1;
    const endItem = startItem - 1 + Math.min(perPage, items.length);

    for (const paragraphElement of document.querySelectorAll<HTMLParagraphElement>('p.entryStatDisplay')) {
        paragraphElement.innerText = `Showing ${startItem}-${endItem} of ${totalItemCount} entries`;
    }

    const modElements = items.map(createModElement);

    for (const containerElement of document.querySelectorAll<HTMLDivElement>('div.modDisplayArea')) {
        modElements.forEach((e) => containerElement.appendChild(e));
        // containerElement.appendChild(modElements);
    }
}

makeSearch(searchParams);
