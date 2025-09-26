import Prelocalization from "./helpers/prelocalization.mjs";

/**
 * @import {
 * ArmorCategoryConfig, CheckConfig, GenderConfig, ItemModifierConfig, ShieldCategoryConfig,
 * TerrainConfig, TravelerTypeConfig, WeaponCategoryConfig, WeatherCategoryConfig,
 * WeatherTypeConfig,
 * } from "./_types.mjs";
 */

/* -------------------------------------------------- */

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
 * @type {Record<string, ArmorCategoryConfig>}
 */
export const armorCategories = {
  clothes: {
    label: "RYUUTAMA.ARMOR.CATEGORIES.clothes",
    defense: null,
    penalty: null,
  },
  light: {
    label: "RYUUTAMA.ARMOR.CATEGORIES.light",
    defense: 1,
    penalty: null,
  },
  medium: {
    label: "RYUUTAMA.ARMOR.CATEGORIES.medium",
    defense: 2,
    penalty: 1,
  },
  heavy: {
    label: "RYUUTAMA.ARMOR.CATEGORIES.heavy",
    defense: 3,
    penalty: 3,
  },
};
Prelocalization.prelocalize(armorCategories);

/* -------------------------------------------------- */

/**
 * @type {Record<string, CheckConfig>}
 */
export const checks = {
  exercise: {
    label: "RYUUTAMA.CHECKS.exercise",
    abilities: ["strength", "dexterity"],
  },
  drinking: {
    label: "RYUUTAMA.CHECKS.drinking",
    abilities: ["strength", "spirit"],
  },
  stealth: {
    label: "RYUUTAMA.CHECKS.stealth",
    abilities: ["dexterity", "dexterity"],
  },
  perception: {
    label: "RYUUTAMA.CHECKS.perception",
    abilities: ["dexterity", "intelligence"],
  },
  dodge: {
    label: "RYUUTAMA.CHECKS.dodge",
    abilities: ["dexterity", "intelligence"],
  },
  delicateWork: {
    label: "RYUUTAMA.CHECKS.delicateWork",
    abilities: ["dexterity", "spirit"],
  },
  negotiation: {
    label: "RYUUTAMA.CHECKS.negotiation",
    abilities: ["intelligence", "spirit"],
  },
  sense: {
    label: "RYUUTAMA.CHECKS.sense",
    abilities: ["intelligence", "spirit"],
  },
  job: {
    label: "RYUUTAMA.CHECKS.job",
    abilities: ["intelligence", "intelligence"],
  },
};
Prelocalization.prelocalize(checks);

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
 * @type {Record<string, ShieldCategoryConfig>}
 */
export const shieldCategories = {
  light: {
    label: "RYUUTAMA.SHIELD.CATEGORIES.light",
    grip: 1,
    defense: 1,
    penalty: null,
    dodge: 7,
  },
  heavy: {
    label: "RYUUTAMA.SHIELD.CATEGORIES.heavy",
    grip: 1,
    defense: 2,
    penalty: 1,
    dodge: 9,
  },
};
Prelocalization.prelocalize(shieldCategories);

/* -------------------------------------------------- */

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
 * @type {Record<string, TerrainConfig>}
 */
export const terrainTypes = {
  road: {
    label: "RYUUTAMA.TERRAIN.road",
  },
  wasteland: {
    label: "RYUUTAMA.TERRAIN.wasteland",
  },
  rocky: {
    label: "RYUUTAMA.TERRAIN.rocky",
  },
  mountain: {
    label: "RYUUTAMA.TERRAIN.mountain",
  },
  alpine: {
    label: "RYUUTAMA.TERRAIN.alpine",
  },
  swamp: {
    label: "RYUUTAMA.TERRAIN.swamp",
  },
  woods: {
    label: "RYUUTAMA.TERRAIN.woods",
  },
  deepForest: {
    label: "RYUUTAMA.TERRAIN.deepForest",
  },
  jungle: {
    label: "RYUUTAMA.TERRAIN.jungle",
  },
  desert: {
    label: "RYUUTAMA.TERRAIN.desert",
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
      abilities: ["strength"],
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
  unarmed: {
    label: "RYUUTAMA.WEAPON.CATEGORIES.unarmed",
    grip: 2,
    accuracy: {
      abilities: ["dexterity", "strength"],
    },
    damage: {
      ability: "strength",
      bonus: -2, // TODO: improvised weapons have -1 instead of -2
    },
  },
};
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
  temperature: {
    label: "RYUUTAMA.WEATHER.CATEGORY.temperature",
  },
};
Prelocalization.prelocalize(weatherCategories);

/* -------------------------------------------------- */

/**
 * @type {Record<string, WeatherTypeConfig>}
 */
export const weatherTypes = {
  rain: {
    label: "RYUUTAMA.WEATHER.rain",
    category: "rain",
  },
  hardRain: {
    label: "RYUUTAMA.WEATHER.hardRain",
    category: "rain",
  },
  storm: {
    label: "RYUUTAMA.WEATHER.storm",
    category: "rain",
  },
  snow: {
    label: "RYUUTAMA.WEATHER.snow",
    category: "snow",
  },
  blizzard: {
    label: "RYUUTAMA.WEATHER.blizzard",
    category: "snow",
  },
  strongWind: {
    label: "RYUUTAMA.WEATHER.strongWind",
    category: "wind",
  },
  cold: {
    label: "RYUUTAMA.WEATHER.cold",
    category: "temperature",
  },
  hot: {
    label: "RYUUTAMA.WEATHER.hot",
    category: "temperature",
  },
};
Prelocalization.prelocalize(weatherTypes);
