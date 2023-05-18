import './style.css';
import { Mod } from './types/shared/Mod';
import { ModDLCs } from './types/shared/ModDLCs';
import { ModTags } from './types/shared/ModTags';

console.log('Hello World!');

const myMod: Mod = {
    _id: '',
    thumbnail: '',
    title: '',
    description: '',
    ratingStars: 0,
    ratingCount: 0,
    authors: [],
    tags: ModTags.None,
    dlcs: ModDLCs.Ideology,
    size: 0,
    posted: '',
    catalogueLastUpdated: '',
    statsVisitors: 0,
    statsSubscribers: 0,
    statsFavourites: 0,
    dependencyIds: [],
    dependencyNames: [],
};

console.log(myMod);
