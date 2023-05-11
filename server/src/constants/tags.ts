import { ModTags } from '../types/ModTags';

export const TAG_KEYWORDS: Map<Exclude<ModTags, ModTags.None>, Lowercase<string>[]> = new Map([
    [ModTags.Apparel, ['apparel', 'clothing', 'armor', 'armour', 'clothes']],
    [ModTags.Buildings, ['building', 'structure']],
    [ModTags.Furniture, ['furniture', 'furnishing']],
    [ModTags.Weapons, ['weapon', 'gun', 'tool']],
    [ModTags.Animals, ['animal', 'creature', 'pet', 'wildlife']],
    [ModTags.Factions, ['faction', 'tribe', 'clan']],
    [ModTags.Food, ['food', 'meal']],
    [ModTags.Medical, ['medic', 'medical', 'drug', 'pharmaceutical']],
    [ModTags.Textures, ['texture']],
    [ModTags.Terrain, ['terrain', 'biome', 'landscape', 'landscaping', 'generation', 'tile']],
    [ModTags.Races, ['race', 'species']],
    [
        ModTags.Vehicles,
        ['vehicle', 'car', 'truck', 'boat', 'ship', 'aircraft', 'plane', 'helicopter', 'tank', 'aeroplane', 'airplane'],
    ],
    [ModTags.Music, ['music', 'song', 'soundtrack', 'tune']],
    [ModTags.Traits, ['trait', 'backstory', 'backstories']],
    [ModTags.Events, ['event']],
    [ModTags.Xenotypes, ['xenotype', 'gene']],
    [ModTags.UI, ['ui', 'hud', 'interface']],
]);
