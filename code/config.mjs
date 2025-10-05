import Prelocalization from "./helpers/prelocalization.mjs";
import staticId from "./utils/static-id.mjs";

/**
 * @import {
 * AbilityScoreConfig, GenderConfig, ItemModifierConfig, ItemSizeConfig, StartingScoreConfig, StatusEffectConfig,
 * TerrainTypeConfig, TravelerTypeConfig, WeaponCategoryConfig, WeatherCategoryConfig, WeatherTypeConfig,
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
    icon: "systems/ryuutama/assets/official/icons/stats/strength.svg",
  },
  dexterity: {
    label: "RYUUTAMA.ABILITIES.dexterity",
    abbreviation: "RYUUTAMA.ABILITIES.dexterityAbbr",
    icon: "systems/ryuutama/assets/official/icons/stats/dexterity.svg",
  },
  intelligence: {
    label: "RYUUTAMA.ABILITIES.intelligence",
    abbreviation: "RYUUTAMA.ABILITIES.intelligenceAbbr",
    icon: "systems/ryuutama/assets/official/icons/stats/intelligence.svg",
  },
  spirit: {
    label: "RYUUTAMA.ABILITIES.spirit",
    abbreviation: "RYUUTAMA.ABILITIES.spiritAbbr",
    icon: "systems/ryuutama/assets/official/icons/stats/spirit.svg",
  },
};
Prelocalization.prelocalize(abilityScores, { properties: ["label", "abbreviation"] });

/* -------------------------------------------------- */

export const checkTypes = {
  accuracy: {
    label: "RYUUTAMA.ROLL.TYPES.accuracy",
  },
  check: {
    label: "RYUUTAMA.ROLL.TYPES.check",
  },
  condition: {
    label: "RYUUTAMA.ROLL.TYPES.condition",
  },
  damage: {
    label: "RYUUTAMA.ROLL.TYPES.damage",
  },
  initiative: {
    label: "RYUUTAMA.ROLL.TYPES.initiative",
  },
  journey: {
    label: "RYUUTAMA.ROLL.TYPES.journey",
    subtypes: {
      travel: {
        label: "RYUUTAMA.JOURNEY.TYPES.travel",
      },
      direction: {
        label: "RYUUTAMA.JOURNEY.TYPES.direction",
      },
      camping: {
        label: "RYUUTAMA.JOURNEY.TYPES.camping",
      },
    },
  },
};
Prelocalization.prelocalize(checkTypes);
Prelocalization.prelocalize(checkTypes.journey.subtypes);

/* -------------------------------------------------- */

/** @type {number[]} */
export const experienceLevels = [
  100,
  600,
  1_200,
  2_000,
  3_000,
  4_200,
  5_800,
  7_500,
  10_000,
];

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

export const herbTypes = {
  enhance: {
    label: "RYUUTAMA.HERB.CATEGORIES.enhance",
  },
  mental: {
    label: "RYUUTAMA.HERB.CATEGORIES.mental",
  },
  physical: {
    label: "RYUUTAMA.HERB.CATEGORIES.physical",
  },
};
Prelocalization.prelocalize(herbTypes);

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
  },
  3: {
    label: "RYUUTAMA.ITEM.SIZES.size3",
  },
  5: {
    label: "RYUUTAMA.ITEM.SIZES.size5",
  },
};
Prelocalization.prelocalize(itemSizes);

/* -------------------------------------------------- */

export const monsterCategories = {
  demonstone: {
    label: "RYUUTAMA.MONSTER.CATEGORIES.demonstone",
    statusImmunities: new Set(["body"]),
  },
  demon: {
    label: "RYUUTAMA.MONSTER.CATEGORIES.demon",
  },
  intelligent: {
    label: "RYUUTAMA.MONSTER.CATEGORIES.intelligent",
  },
  magical: {
    label: "RYUUTAMA.MONSTER.CATEGORIES.magical",
    statusImmunities: new Set(["mind"]),
  },
  phantomBeast: {
    label: "RYUUTAMA.MONSTER.CATEGORIES.phantomBeast",
  },
  phantomPlant: {
    label: "RYUUTAMA.MONSTER.CATEGORIES.phantomPlant",
  },
  undead: {
    label: "RYUUTAMA.MONSTER.CATEGORIES.undead",
    statusImmunities: new Set(["ALL"]),
    armorBypasses: new Set(["mythril", "orichalcum"]),
  },
};
Prelocalization.prelocalize(monsterCategories);

/* -------------------------------------------------- */

export const seasons = {
  spring: {
    label: "RYUUTAMA.SEASONS.spring",
  },
  summer: {
    label: "RYUUTAMA.SEASONS.summer",
  },
  fall: {
    label: "RYUUTAMA.SEASONS.fall",
  },
  winter: {
    label: "RYUUTAMA.SEASONS.winter",
  },
};
Prelocalization.prelocalize(seasons);

/* -------------------------------------------------- */

export const shieldDodgeData = {
  _id: staticId("shielddodge"),
  img: "icons/equipment/shield/buckler-wooden-boss-lightning.webp",
  name: "RYUUTAMA.SHIELD.shieldDefense",
};
Prelocalization.prelocalize({ shieldDodgeData }, { properties: ["name"] });

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
    img: "systems/ryuutama/assets/official/icons/statuses/injury.svg",
    _id: "injury0000000000",
    category: "body",
  },
  poison: {
    name: "RYUUTAMA.STATUSES.poison",
    img: "systems/ryuutama/assets/official/icons/statuses/poison.svg",
    _id: "poison0000000000",
    category: "body",
  },
  sickness: {
    name: "RYUUTAMA.STATUSES.sickness",
    img: "systems/ryuutama/assets/official/icons/statuses/sickness.svg",
    _id: "sickness00000000",
    category: "body",
  },
  exhaustion: {
    name: "RYUUTAMA.STATUSES.exhaustion",
    img: "systems/ryuutama/assets/official/icons/statuses/exhaustion.svg",
    _id: "exhaustion000000",
    category: "mind",
  },
  muddled: {
    name: "RYUUTAMA.STATUSES.muddled",
    img: "systems/ryuutama/assets/official/icons/statuses/muddled.svg",
    _id: "muddled000000000",
    category: "mind",
  },
  shock: {
    name: "RYUUTAMA.STATUSES.shock",
    img: "systems/ryuutama/assets/official/icons/statuses/shock.svg",
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
  grassland: {
    label: "RYUUTAMA.TERRAIN.grassland",
    level: 1,
    difficulty: 6,
  },
  wasteland: {
    label: "RYUUTAMA.TERRAIN.wasteland",
    level: 1,
    difficulty: 6,
  },
  woods: {
    label: "RYUUTAMA.TERRAIN.woods",
    level: 2,
    difficulty: 8,
  },
  highland: {
    label: "RYUUTAMA.TERRAIN.highland",
    level: 2,
    difficulty: 8,
  },
  rocky: {
    label: "RYUUTAMA.TERRAIN.rocky",
    level: 2,
    difficulty: 8,
  },
  deepForest: {
    label: "RYUUTAMA.TERRAIN.deepForest",
    level: 3,
    difficulty: 10,
    movementModifier: 1 / 2,
  },
  swamp: {
    label: "RYUUTAMA.TERRAIN.swamp",
    level: 3,
    difficulty: 10,
    movementModifier: 1 / 2,
  },
  mountain: {
    label: "RYUUTAMA.TERRAIN.mountain",
    level: 3,
    difficulty: 10,
    movementModifier: 1 / 2,
  },
  desert: {
    label: "RYUUTAMA.TERRAIN.desert",
    level: 4,
    difficulty: 12,
    movementModifier: 1 / 3,
  },
  jungle: {
    label: "RYUUTAMA.TERRAIN.jungle",
    level: 4,
    difficulty: 12,
    movementModifier: 1 / 3,
  },
  alpine: {
    label: "RYUUTAMA.TERRAIN.alpine",
    level: 5,
    difficulty: 14,
    movementModifier: 1 / 4,
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

export const unarmedConfiguration = {
  label: "RYUUTAMA.WEAPON.CATEGORIES.unarmed",
  icon: "icons/skills/melee/unarmed-punch-fist-white.webp",
  accuracy: {
    abilities: ["dexterity", "strength"],
    bonus: 0,
  },
  damage: {
    ability: "strength",
    bonus: -2,
  },
};

/* -------------------------------------------------- */

/**
 * @type {Record<string, WeaponCategoryConfig>}
 */
export const weaponCategories = {
  axe: {
    label: "RYUUTAMA.WEAPON.CATEGORIES.axe",
    grip: 2,
  },
  blade: {
    label: "RYUUTAMA.WEAPON.CATEGORIES.blade",
    grip: 1,
  },
  bow: {
    label: "RYUUTAMA.WEAPON.CATEGORIES.bow",
    grip: 2,
    ranged: true,
  },
  lightBlade: {
    label: "RYUUTAMA.WEAPON.CATEGORIES.lightBlade",
    grip: 1,
  },
  polearm: {
    label: "RYUUTAMA.WEAPON.CATEGORIES.polearm",
    grip: 2,
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
};
Prelocalization.prelocalize(weatherCategories);

/* -------------------------------------------------- */

/**
 * @type {Record<string, WeatherTypeConfig>}
 */
export const weatherTypes = {
  rain: {
    label: "RYUUTAMA.WEATHER.rain",
    modifier: 1,
    category: "rain",
  },
  strongWind: {
    label: "RYUUTAMA.WEATHER.strongWind",
    modifier: 1,
    category: "wind",
  },
  fog: {
    label: "RYUUTAMA.WEATHER.fog",
    modifier: 1,
  },
  hot: {
    label: "RYUUTAMA.WEATHER.hot",
    modifier: 1,
  },
  cold: {
    label: "RYUUTAMA.WEATHER.cold",
    modifier: 1,
  },
  hardRain: {
    label: "RYUUTAMA.WEATHER.hardRain",
    modifier: 3,
    category: "rain",
  },
  snow: {
    label: "RYUUTAMA.WEATHER.snow",
    modifier: 3,
    category: "snow",
  },
  deepFog: {
    label: "RYUUTAMA.WEATHER.deepFog",
    modifier: 3,
  },
  darkness: {
    label: "RYUUTAMA.WEATHER.darkness",
    modifier: 3,
  },
  hurricane: {
    label: "RYUUTAMA.WEATHER.hurricane",
    modifier: 5,
    category: "wind",
  },
  blizzard: {
    label: "RYUUTAMA.WEATHER.blizzard",
    modifier: 5,
    category: "snow",
  },
};
Prelocalization.prelocalize(weatherTypes);
