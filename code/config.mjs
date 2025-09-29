import Prelocalization from "./helpers/prelocalization.mjs";

/**
 * @import {
 * AbilityScoreConfig, CheckConfig, GenderConfig, ItemModifierConfig, ItemSizeConfig,
 * JourneyCheckTypeConfig, StartingScoreConfig, StatusEffectConfig, TerrainTypeConfig,
 * TravelerTypeConfig, WeaponCategoryConfig, WeatherCategoryConfig, WeatherTypeConfig,
 * } from "./_types.mjs";
 */

/* -------------------------------------------------- */

/**
 * @type {Record<string, AbilityScoreConfig>}
 */
export const abilityScores = {
  strength: {
    label: "RYUUTAMA.ABILITIES.strength",
    abbreviation: "RYUUTAMA.ABILITIES.strengthAbbr",
  },
  dexterity: {
    label: "RYUUTAMA.ABILITIES.dexterity",
    abbreviation: "RYUUTAMA.ABILITIES.dexterityAbbr",
  },
  intelligence: {
    label: "RYUUTAMA.ABILITIES.intelligence",
    abbreviation: "RYUUTAMA.ABILITIES.intelligenceAbbr",
  },
  spirit: {
    label: "RYUUTAMA.ABILITIES.spirit",
    abbreviation: "RYUUTAMA.ABILITIES.spiritAbbr",
  },
};
Prelocalization.prelocalize(abilityScores, { properties: ["label", "abbreviation"] });

/* -------------------------------------------------- */

/**
 * @type {Record<string, CheckConfig>}
 */
export const skillCheckTypes = {
  exercise: {
    label: "RYUUTAMA.SKILLS.exercise",
    abilities: ["strength", "dexterity"],
  },
  drinking: {
    label: "RYUUTAMA.SKILLS.drinking",
    abilities: ["strength", "spirit"],
  },
  stealth: {
    label: "RYUUTAMA.SKILLS.stealth",
    abilities: ["dexterity", "dexterity"],
  },
  perception: {
    label: "RYUUTAMA.SKILLS.perception",
    abilities: ["dexterity", "intelligence"],
  },
  dodge: {
    label: "RYUUTAMA.SKILLS.dodge",
    abilities: ["dexterity", "intelligence"],
  },
  delicateWork: {
    label: "RYUUTAMA.SKILLS.delicateWork",
    abilities: ["dexterity", "spirit"],
  },
  negotiation: {
    label: "RYUUTAMA.SKILLS.negotiation",
    abilities: ["intelligence", "spirit"],
  },
  sense: {
    label: "RYUUTAMA.SKILLS.sense",
    abilities: ["intelligence", "spirit"],
  },
  job: {
    label: "RYUUTAMA.SKILLS.job",
    abilities: ["intelligence", "intelligence"],
  },
};
Prelocalization.prelocalize(skillCheckTypes);

/* -------------------------------------------------- */

/**
 * @type {Record<string, GenderConfig>}
 */
export const genders = {
  man: {
    label: "RYUUTAMA.GENDERS.man",
  },
  woman: {
    label: "RYUUTAMA.GENDERS.woman",
  },
};
Prelocalization.prelocalize(genders);

/* -------------------------------------------------- */

/**
 * @type {Record<string, ItemModifierConfig>}
 */
export const itemModifiers = {
  beautiful: {
    label: "RYUUTAMA.ITEM.MODIFIERS.beautiful",
    cost: 2,
  },
  broken: {
    label: "RYUUTAMA.ITEM.MODIFIERS.broken",
    cost: 1 / 2,
    hidden: true,
  },
  cursed: {
    label: "RYUUTAMA.ITEM.MODIFIERS.cursed",
    cost: 1 / 2,
  },
  cute: {
    label: "RYUUTAMA.ITEM.MODIFIERS.cute",
    cost: 2,
  },
  gross: {
    label: "RYUUTAMA.ITEM.MODIFIERS.gross",
    cost: 4 / 5,
  },
  highQuality: {
    label: "RYUUTAMA.ITEM.MODIFIERS.highQuality",
    cost: 5,
  },
  mythril: {
    label: "RYUUTAMA.ITEM.MODIFIERS.mythril",
    cost: 10,
  },
  orichalcum: {
    label: "RYUUTAMA.ITEM.MODIFIERS.orichalcum",
    cost: 50,
  },
  plusOne: {
    label: "RYUUTAMA.ITEM.MODIFIERS.plusOne",
    cost: 8000,
    magical: true,
  },
  shining: {
    label: "RYUUTAMA.ITEM.MODIFIERS.shining",
    cost: 1200,
    magical: true,
  },
  smelly: {
    label: "RYUUTAMA.ITEM.MODIFIERS.smelly",
    cost: 7 / 10,
  },
  speaking: {
    label: "RYUUTAMA.ITEM.MODIFIERS.speaking",
    cost: 2000,
    magical: true,
  },
  sturdy: {
    label: "RYUUTAMA.ITEM.MODIFIERS.sturdy",
    cost: 3,
  },
  uncool: {
    label: "RYUUTAMA.ITEM.MODIFIERS.uncool",
    cost: 4 / 5,
  },
  used: {
    label: "RYUUTAMA.ITEM.MODIFIERS.used",
    cost: 4 / 5,
    hidden: true,
  },
  walking: {
    label: "RYUUTAMA.ITEM.MODIFIERS.walking",
    cost: 5000,
    magical: true,
  },
};
Prelocalization.prelocalize(itemModifiers);

/* -------------------------------------------------- */

/**
 * @type {Record<number, ItemSizeConfig>}
 */
export const itemSizes = {
  1: {
    label: "RYUUTAMA.ITEM.SIZES.size1",
    grip: 0,
  },
  3: {
    label: "RYUUTAMA.ITEM.SIZES.size3",
    grip: 1,
  },
  5: {
    label: "RYUUTAMA.ITEM.SIZES.size5",
    grip: 2,
  },
};
Prelocalization.prelocalize(itemSizes);

/* -------------------------------------------------- */

/**
 * @type {Record<string, JourneyCheckTypeConfig>}
 */
export const journeyCheckTypes = {
  travel: {
    label: "RYUUTAMA.JOURNEY.TYPES.travel",
  },
  direction: {
    label: "RYUUTAMA.JOURNEY.TYPES.direction",
  },
  camping: {
    label: "RYUUTAMA.JOURNEY.TYPES.camping",
  },
};
Prelocalization.prelocalize(journeyCheckTypes);

/* -------------------------------------------------- */

/**
 * @type {Record<string, StartingScoreConfig>}
 */
export const startingScores = {
  average: {
    label: "RYUUTAMA.ABILITIES.SETS.average",
    values: [6, 6, 6, 6],
  },
  standard: {
    label: "RYUUTAMA.ABILITIES.SETS.standard",
    values: [4, 6, 6, 8],
  },
  specialized: {
    label: "RYUUTAMA.ABILITIES.SETS.specialized",
    values: [4, 4, 8, 8],
  },
};
Prelocalization.prelocalize(startingScores);

/* -------------------------------------------------- */

/**
 * @type {Record<string, StatusEffectConfig>}
 */
export const statusEffects = {
  injury: {
    name: "RYUUTAMA.STATUSES.injury",
    img: "icons/svg/leg.svg",
    _id: "injury0000000000",
    category: "body",
  },
  poison: {
    name: "RYUUTAMA.STATUSES.poison",
    img: "icons/svg/biohazard.svg",
    _id: "poison0000000000",
    category: "body",
  },
  sickness: {
    name: "RYUUTAMA.STATUSES.sickness",
    img: "icons/svg/pill.svg",
    _id: "sickness00000000",
    category: "body",
  },
  exhaustion: {
    name: "RYUUTAMA.STATUSES.exhaustion",
    img: "icons/svg/walk.svg",
    _id: "exhaustion000000",
    category: "mind",
  },
  muddled: {
    name: "RYUUTAMA.STATUSES.muddled",
    img: "icons/svg/stoned.svg",
    _id: "muddled000000000",
    category: "mind",
  },
  shock: {
    name: "RYUUTAMA.STATUSES.shock",
    img: "icons/svg/ice-aura.svg",
    _id: "shock00000000000",
    category: "mind",
  },
};
Prelocalization.prelocalize(statusEffects, { properties: ["name"] });

/* -------------------------------------------------- */

/**
 * @type {Record<string, TerrainTypeConfig>}
 */
export const terrainTypes = {
  road: {
    label: "RYUUTAMA.TERRAIN.road",
    level: 0,
    difficulty: 0,
  },
  wasteland: {
    label: "RYUUTAMA.TERRAIN.wasteland",
    level: 1,
    difficulty: 6,
  },
  rocky: {
    label: "RYUUTAMA.TERRAIN.rocky",
    level: 2,
    difficulty: 8,
  },
  mountain: {
    label: "RYUUTAMA.TERRAIN.mountain",
    level: 3,
    difficulty: 10,
    movementModifier: 1 / 2,
  },
  alpine: {
    label: "RYUUTAMA.TERRAIN.alpine",
    level: 5,
    difficulty: 14,
    movementModifier: 1 / 4,
  },
  swamp: {
    label: "RYUUTAMA.TERRAIN.swamp",
    level: 3,
    difficulty: 10,
    movementModifier: 1 / 2,
  },
  woods: {
    label: "RYUUTAMA.TERRAIN.woods",
    level: 2,
    difficulty: 8,
  },
  deepForest: {
    label: "RYUUTAMA.TERRAIN.deepForest",
    level: 3,
    difficulty: 10,
    movementModifier: 1 / 2,
  },
  jungle: {
    label: "RYUUTAMA.TERRAIN.jungle",
    level: 4,
    difficulty: 12,
    movementModifier: 1 / 3,
  },
  desert: {
    label: "RYUUTAMA.TERRAIN.desert",
    level: 4,
    difficulty: 12,
    movementModifier: 1 / 3,
  },
  grassland: {
    label: "RYUUTAMA.TERRAIN.grassland",
    level: 1,
    difficulty: 6,
  },
  highland: {
    label: "RYUUTAMA.TERRAIN.highland",
    level: 2,
    difficulty: 8,
  },
};
Prelocalization.prelocalize(terrainTypes);

/* -------------------------------------------------- */

/**
 * @type {Record<string, TravelerTypeConfig>}
 */
export const travelerTypes = {
  attack: {
    label: "RYUUTAMA.TRAVELER.TYPES.attack",
  },
  technical: {
    label: "RYUUTAMA.TRAVELER.TYPES.technical",
  },
  magic: {
    label: "RYUUTAMA.TRAVELER.TYPES.magic",
  },
};
Prelocalization.prelocalize(travelerTypes);

/* -------------------------------------------------- */

/**
 * @type {Record<string, WeaponCategoryConfig>}
 */
export const weaponCategories = {
  axe: {
    label: "RYUUTAMA.WEAPON.CATEGORIES.axe",
    grip: 2,
    accuracy: {
      abilities: ["strength", "strength"],
      bonus: -1,
    },
    damage: {
      ability: "strength",
    },
  },
  blade: {
    label: "RYUUTAMA.WEAPON.CATEGORIES.blade",
    grip: 1,
    accuracy: {
      abilities: ["dexterity", "strength"],
    },
    damage: {
      ability: "strength",
    },
  },
  bow: {
    label: "RYUUTAMA.WEAPON.CATEGORIES.bow",
    grip: 2,
    ranged: true,
    accuracy: {
      abilities: ["intelligence", "dexterity"],
      bonus: -2,
    },
    damage: {
      ability: "dexterity",
    },
  },
  lightBlade: {
    label: "RYUUTAMA.WEAPON.CATEGORIES.lightBlade",
    grip: 1,
    accuracy: {
      abilities: ["dexterity", "intelligence"],
      bonus: 1,
    },
    damage: {
      ability: "intelligence",
      bonus: -1,
    },
  },
  polearm: {
    label: "RYUUTAMA.WEAPON.CATEGORIES.polearm",
    grip: 2,
    accuracy: {
      abilities: ["dexterity", "strength"],
    },
    damage: {
      ability: "strength",
      bonus: 1,
    },
  },
  improvised: {
    label: "RYUUTAMA.WEAPON.CATEGORIES.improvised",
    grip: 2,
    accuracy: {
      abilities: ["dexterity", "strength"],
    },
    damage: {
      ability: "strength",
      // Improved weapons have -1, unarmed has -2. It is assumed that
      // if making an unarmed strike, you have no weapon equipped.
      bonus: -1,
    },
  },
};
weaponCategories.unarmed = foundry.utils.mergeObject(weaponCategories.improvised, {
  label: "RYUUTAMA.WEAPON.CATEGORIES.unarmed",
  damage: { bonus: -2 },
}, { inplace: false });
Prelocalization.prelocalize(weaponCategories);

/* -------------------------------------------------- */

/**
 * @type {Record<string, WeatherCategoryConfig>}
 */
export const weatherCategories = {
  rain: {
    label: "RYUUTAMA.WEATHER.CATEGORY.rain",
  },
  snow: {
    label: "RYUUTAMA.WEATHER.CATEGORY.snow",
  },
  wind: {
    label: "RYUUTAMA.WEATHER.CATEGORY.wind",
  },
};
Prelocalization.prelocalize(weatherCategories);

/* -------------------------------------------------- */

/**
 * @type {Record<string, WeatherTypeConfig>}
 */
export const weatherTypes = {
  clear: {
    label: "RYUUTAMA.WEATHER.clear",
  },
  cloudy: {
    label: "RYUUTAMA.WEATHER.cloudy",
  },
  fog: {
    label: "RYUUTAMA.WEATHER.fog",
    modifier: 1,
  },
  deepFog: {
    label: "RYUUTAMA.WEATHER.deepFog",
    modifier: 3,
  },
  night: {
    label: "RYUUTAMA.WEATHER.night",
    modifier: 3,
  },
  hurricane: {
    label: "RYUUTAMA.WEATHER.hurricane",
    modifier: 5,
    category: "wind",
  },
  rain: {
    label: "RYUUTAMA.WEATHER.rain",
    modifier: 1,
    category: "rain",
  },
  hardRain: {
    label: "RYUUTAMA.WEATHER.hardRain",
    modifier: 3,
    category: "rain",
  },
  storm: {
    label: "RYUUTAMA.WEATHER.storm",
    category: "rain",
  },
  snow: {
    label: "RYUUTAMA.WEATHER.snow",
    modifier: 3,
    category: "snow",
  },
  blizzard: {
    label: "RYUUTAMA.WEATHER.blizzard",
    modifier: 5,
    category: "snow",
  },
  strongWind: {
    label: "RYUUTAMA.WEATHER.strongWind",
    modifier: 1,
    category: "wind",
  },
  cold: {
    label: "RYUUTAMA.WEATHER.cold",
    modifier: 1,
  },
  hot: {
    label: "RYUUTAMA.WEATHER.hot",
    modifier: 1,
  },
};
Prelocalization.prelocalize(weatherTypes);
