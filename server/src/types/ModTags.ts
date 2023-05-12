export enum ModTags {
    None = 0,

    Apparel = 1 << 0,
    Buildings = 1 << 1,
    Furniture = 1 << 2,
    /** Includes tools. */
    Weapons = 1 << 3,
    Animals = 1 << 4,
    Factions = 1 << 5,
    Food = 1 << 6,
    Medical = 1 << 7,
    Textures = 1 << 8,
    /** Includes world generation. */
    Terrain = 1 << 9,
    Races = 1 << 10,
    Vehicles = 1 << 11,
    Music = 1 << 12,
    /** Includes backstories. */
    Traits = 1 << 13,
    Events = 1 << 14,
    /** Includes genes. */
    Xenotypes = 1 << 15,
    UI = 1 << 16,
}
