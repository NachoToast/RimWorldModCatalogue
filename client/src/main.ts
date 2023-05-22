import { getMods, postRoot } from './api';
import './global/config';
import './styles';
import { generateBackToTopButtons } from './components/backToTopButton';
import { generateIncluders } from './components/includer';
import { generateModTextSearchers } from './components/modTextSearcher';
import { generateSearchForms } from './components/searchForm';
import { loadSearchOptions } from './global/searchOptions';
import { Mod } from './types/shared/Mod';
import { ModSearchOptions } from './types/shared/ModSearchOptions';

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

export async function makeSearch(params: ModSearchOptions): Promise<void> {
    const { page, perPage } = params;

    const { items, totalItemCount } = await getMods(params);

    const startItem = page * perPage + 1;
    const endItem = startItem - 1 + Math.min(perPage, items.length);

    for (const paragraphElement of document.querySelectorAll<HTMLParagraphElement>('p.entryStatDisplay')) {
        paragraphElement.innerText = `Showing ${startItem}-${endItem} of ${totalItemCount} entries`;
    }

    const modElements = items.map(createModElement);

    for (const containerElement of document.querySelectorAll<HTMLDivElement>('div.modDisplayArea')) {
        containerElement.innerHTML = '';
        modElements.forEach((e) => containerElement.appendChild(e));
    }
}

postRoot().then(({ estimatedModCount }) => {
    generateModTextSearchers(estimatedModCount);
});

makeSearch(loadSearchOptions());

generateIncluders();
generateBackToTopButtons();
generateSearchForms();
