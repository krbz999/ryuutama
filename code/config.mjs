import Prelocalization from "./helpers/prelocalization.mjs";

/**
 * @import {
 * AbilityScoreConfig, AnimalModifierConfig, AnimalTypeConfig, CheckTypeConfig, DamageRollPropertyConfig, EffectExpirationTypeConfig, HerbTypeConfig,
 * ItemModifierConfig, ItemSizeConfig, MonsterCategoryConfig, SeasonConfig, SpellCategoryConfig, SpellActivationTypeConfig,
 * SpellDurationTypeConfig, SpellLevelConfig, SpellRangeTypeConfig, StatusEffectConfig, TerrainTypeConfig,
 * TravelerTypeConfig, UnarmedConfiguration, WeaponTypeConfig, WeatherTypeConfig
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

/**
 * @type {Record<number, Set<string>>}
 */
export const advancement = {
  1: new Set(["class", "stats", "weapon", "type"]),
  2: new Set(["resource", "statIncrease"]),
  3: new Set(["resource", "habitat"]),
  4: new Set(["resource", "statIncrease", "statusImmunity"]),
  5: new Set(["class", "resource"]),
  6: new Set(["resource", "statIncrease", "type"]),
  7: new Set(["resource", "habitat"]),
  8: new Set(["resource", "statIncrease"]),
  9: new Set(["resource"]),
  10: new Set(["resource", "statIncrease"]),
};

/* -------------------------------------------------- */
/*   Animals                                          */
/* -------------------------------------------------- */

/**
 * @type {Record<string, AnimalModifierConfig>}
 */
export const animalModifiers = {
  baby: {
    label: "RYUUTAMA.ITEM.ANIMAL.MODIFIERS.baby",
    cost: 3 / 10,
  },
  badAttitude: {
    label: "RYUUTAMA.ITEM.ANIMAL.MODIFIERS.badAttitude",
    cost: 7 / 10,
  },
  clever: {
    label: "RYUUTAMA.ITEM.ANIMAL.MODIFIERS.clever",
    cost: 3,
  },
  loud: {
    label: "RYUUTAMA.ITEM.ANIMAL.MODIFIERS.loud",
    cost: 7 / 10,
  },
  loyal: {
    label: "RYUUTAMA.ITEM.ANIMAL.MODIFIERS.loyal",
    cost: 1000,
    additive: true,
  },
  tough: {
    label: "RYUUTAMA.ITEM.ANIMAL.MODIFIERS.tough",
    cost: 2,
  },
  wellTraveled: {
    label: "RYUUTAMA.ITEM.ANIMAL.MODIFIERS.wellTraveled",
    cost: 5000,
    additive: true,
  },
};
Prelocalization.prelocalize(animalModifiers);

/* -------------------------------------------------- */

/**
 * @type {Record<string, AnimalTypeConfig>}
 */
export const animalTypes = {
  riding: {
    label: "RYUUTAMA.ITEM.ANIMAL.TYPES.riding",
    price: 900,
    ride: 1,
  },
  ridingLarge: {
    label: "RYUUTAMA.ITEM.ANIMAL.TYPES.ridingLarge",
    price: 3800,
    ride: 4,
  },
  pack: {
    label: "RYUUTAMA.ITEM.ANIMAL.TYPES.pack",
    price: 500,
    capacity: 15,
  },
  packLarge: {
    label: "RYUUTAMA.ITEM.ANIMAL.TYPES.packLarge",
    price: 2000,
    capacity: 30,
  },
  pet: {
    label: "RYUUTAMA.ITEM.ANIMAL.TYPES.pet",
    price: 300,
  },
};
Prelocalization.prelocalize(animalTypes);

/* -------------------------------------------------- */

/**
 * @type {Record<string, CheckTypeConfig>}
 */
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

/**
 * @type {Record<string, DamageRollPropertyConfig>}
 */
export const damageRollProperties = {
  damageMental: {
    label: "RYUUTAMA.DAMAGE.PROPERTIES.damageMental",
    icon: "systems/ryuutama/assets/icons/bolt-eye.svg",
  },
  ignoreArmor: {
    label: "RYUUTAMA.DAMAGE.PROPERTIES.ignoreArmor",
    icon: "systems/ryuutama/assets/icons/shield-disabled.svg",
  },
  magical: {
    label: "RYUUTAMA.DAMAGE.PROPERTIES.magical",
    icon: "systems/ryuutama/assets/icons/eclipse-flare.svg",
  },
  mythril: {
    label: "RYUUTAMA.DAMAGE.PROPERTIES.mythril",
    icon: "systems/ryuutama/assets/icons/fish-scales.svg",
  },
  orichalcum: {
    label: "RYUUTAMA.DAMAGE.PROPERTIES.orichalcum",
    icon: "systems/ryuutama/assets/icons/layered-armor.svg",
  },
};
Prelocalization.prelocalize(damageRollProperties);

/* -------------------------------------------------- */

/**
 * @type {Record<string, EffectExpirationTypeConfig>}
 */
export const effectExpirationTypes = {
  combatEnd: {
    label: "RYUUTAMA.EFFECT.EXPIRATION.combatEnd",
  },
};
Prelocalization.prelocalize(effectExpirationTypes);

/* -------------------------------------------------- */

/** @type {number[]} */
export const experienceLevels = [
  0,
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
 * @type {Record<string, HerbTypeConfig>}
 */
export const herbTypes = {
  enhance: {
    label: "RYUUTAMA.ITEM.HERB.CATEGORIES.enhance",
  },
  mental: {
    label: "RYUUTAMA.ITEM.HERB.CATEGORIES.mental",
  },
  physical: {
    label: "RYUUTAMA.ITEM.HERB.CATEGORIES.physical",
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

/**
 * @type {Record<string, MonsterCategoryConfig>}
 */
export const monsterCategories = {
  demonstone: {
    label: "RYUUTAMA.MONSTER.CATEGORIES.demonstone",
    statusImmunities: "body",
  },
  demon: {
    label: "RYUUTAMA.MONSTER.CATEGORIES.demon",
  },
  intelligent: {
    label: "RYUUTAMA.MONSTER.CATEGORIES.intelligent",
  },
  magical: {
    label: "RYUUTAMA.MONSTER.CATEGORIES.magical",
    statusImmunities: "mind",
  },
  phantomBeast: {
    label: "RYUUTAMA.MONSTER.CATEGORIES.phantomBeast",
  },
  phantomPlant: {
    label: "RYUUTAMA.MONSTER.CATEGORIES.phantomPlant",
  },
  undead: {
    label: "RYUUTAMA.MONSTER.CATEGORIES.undead",
    statusImmunities: "all",
  },
};
Prelocalization.prelocalize(monsterCategories);

/* -------------------------------------------------- */

/**
 * Reference object, identifiers and uuids of pages.
 * @type {Record<string, string>}
 */
export const references = {};

/* -------------------------------------------------- */

/**
 * @type {Record<string, SeasonConfig>}
 */
export const seasons = {
  spring: {
    label: "RYUUTAMA.SEASONS.spring",
  },
  summer: {
    label: "RYUUTAMA.SEASONS.summer",
  },
  autumn: {
    label: "RYUUTAMA.SEASONS.autumn",
  },
  winter: {
    label: "RYUUTAMA.SEASONS.winter",
  },
};
Prelocalization.prelocalize(seasons);

/* -------------------------------------------------- */
/*   SPELLS                                           */
/* -------------------------------------------------- */

/**
 * @type {Record<string, SpellCategoryConfig>}
 */
export const spellCategories = {
  incantation: {
    label: "RYUUTAMA.ITEM.SPELL.CATEGORIES.incantation",
  },
  spring: {
    label: "RYUUTAMA.ITEM.SPELL.CATEGORIES.spring",
    icon: "systems/ryuutama/assets/official/icons/magic/spring.svg",
  },
  summer: {
    label: "RYUUTAMA.ITEM.SPELL.CATEGORIES.summer",
    icon: "systems/ryuutama/assets/official/icons/magic/summer.svg",
  },
  autumn: {
    label: "RYUUTAMA.ITEM.SPELL.CATEGORIES.autumn",
    icon: "systems/ryuutama/assets/official/icons/magic/fall.svg",
  },
  winter: {
    label: "RYUUTAMA.ITEM.SPELL.CATEGORIES.winter",
    icon: "systems/ryuutama/assets/official/icons/magic/winter.svg",
  },
};
Prelocalization.prelocalize(spellCategories);

/* -------------------------------------------------- */

/**
 * @type {Record<string, SpellActivationTypeConfig>}
 */
export const spellActivationTypes = {
  normal: {
    label: "RYUUTAMA.ITEM.SPELL.ACTIVATION.normal",
  },
  ritual: {
    label: "RYUUTAMA.ITEM.SPELL.ACTIVATION.ritual",
  },
};
Prelocalization.prelocalize(spellActivationTypes);

/* -------------------------------------------------- */

/**
 * @type {Record<string, SpellDurationTypeConfig>}
 */
export const spellDurationTypes = {
  hours: {
    label: "RYUUTAMA.ITEM.SPELL.DURATION.hours",
    units: true,
  },
  rounds: {
    label: "RYUUTAMA.ITEM.SPELL.DURATION.rounds",
    units: true,
  },
  instant: {
    label: "RYUUTAMA.ITEM.SPELL.DURATION.instant",
  },
  minutes: {
    label: "RYUUTAMA.ITEM.SPELL.DURATION.minutes",
    units: true,
  },
  days: {
    label: "RYUUTAMA.ITEM.SPELL.DURATION.days",
    units: true,
  },
  ritual: {
    label: "RYUUTAMA.ITEM.SPELL.DURATION.ritual",
  },
  permanent: {
    label: "RYUUTAMA.ITEM.SPELL.DURATION.permanent",
  },
  special: {
    label: "RYUUTAMA.ITEM.SPELL.DURATION.special",
  },
};
Prelocalization.prelocalize(spellDurationTypes);

/* -------------------------------------------------- */

/**
 * @type {Record<string, SpellLevelConfig>}
 */
export const spellLevels = {
  low: {
    label: "RYUUTAMA.ITEM.SPELL.LEVEL.low",
  },
  mid: {
    label: "RYUUTAMA.ITEM.SPELL.LEVEL.mid",
  },
  high: {
    label: "RYUUTAMA.ITEM.SPELL.LEVEL.high",
  },
};
Prelocalization.prelocalize(spellLevels);

/* -------------------------------------------------- */

/**
 * @type {Record<string, SpellRangeTypeConfig>}
 */
export const spellRangeTypes = {
  touch: {
    label: "RYUUTAMA.ITEM.SPELL.RANGE.touch",
  },
  caster: {
    label: "RYUUTAMA.ITEM.SPELL.RANGE.caster",
  },
  closeArea: {
    label: "RYUUTAMA.ITEM.SPELL.RANGE.closeArea",
  },
  allAreas: {
    label: "RYUUTAMA.ITEM.SPELL.RANGE.allAreas",
  },
  any: {
    label: "RYUUTAMA.ITEM.SPELL.RANGE.any",
  },
  special: {
    label: "RYUUTAMA.ITEM.SPELL.RANGE.special",
  },
};
Prelocalization.prelocalize(spellRangeTypes);

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
  highlands: {
    label: "RYUUTAMA.TERRAIN.highlands",
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

/**
 * @type {Record<string, WeaponTypeConfig>}
 */
export const weaponTypes = {
  axe: {
    label: "RYUUTAMA.ITEM.WEAPON.TYPES.axe",
    labelPlural: "RYUUTAMA.ITEM.WEAPON.TYPES.axePl",
    grip: 2,
    baseItem: "Compendium.ryuutama.items.Item.axe0000000000000",
  },
  blade: {
    label: "RYUUTAMA.ITEM.WEAPON.TYPES.blade",
    labelPlural: "RYUUTAMA.ITEM.WEAPON.TYPES.bladePl",
    grip: 1,
    baseItem: "Compendium.ryuutama.items.Item.blade00000000000",
  },
  bow: {
    label: "RYUUTAMA.ITEM.WEAPON.TYPES.bow",
    labelPlural: "RYUUTAMA.ITEM.WEAPON.TYPES.bowPl",
    grip: 2,
    ranged: true,
    baseItem: "Compendium.ryuutama.items.Item.bow0000000000000",
  },
  lightBlade: {
    label: "RYUUTAMA.ITEM.WEAPON.TYPES.lightBlade",
    labelPlural: "RYUUTAMA.ITEM.WEAPON.TYPES.lightBladePl",
    grip: 1,
    baseItem: "Compendium.ryuutama.items.Item.lightblade000000",
  },
  polearm: {
    label: "RYUUTAMA.ITEM.WEAPON.TYPES.polearm",
    labelPlural: "RYUUTAMA.ITEM.WEAPON.TYPES.polearmPl",
    grip: 2,
    baseItem: "Compendium.ryuutama.items.Item.polearm000000000",
  },
};
Prelocalization.prelocalize(weaponTypes, { properties: ["label", "labelPlural"] });

/* -------------------------------------------------- */

/**
 * @type {Record<string, UnarmedConfiguration>}
 */
export const weaponUnarmedTypes = {
  unarmed: {
    label: "RYUUTAMA.ITEM.WEAPON.TYPES.unarmed",
    labelPlural: "RYUUTAMA.ITEM.WEAPON.TYPES.unarmedPl",
    icon: "icons/skills/melee/unarmed-punch-fist-white.webp",
    accuracy: {
      abilities: ["strength", "dexterity"],
      bonus: 0,
    },
    damage: {
      ability: "strength",
      bonus: -2,
    },
  },
  improvised: {
    label: "RYUUTAMA.ITEM.WEAPON.TYPES.improvised",
    labelPlural: "RYUUTAMA.ITEM.WEAPON.TYPES.improvisedPl",
    accuracy: {
      abilities: ["strength", "dexterity"],
      bonus: 0,
    },
    damage: {
      ability: "strength",
      bonus: -1,
    },
  },
};
Prelocalization.prelocalize(weaponUnarmedTypes, { properties: ["label", "labelPlural"] });

/* -------------------------------------------------- */

export const weaponCategories = {
  ...weaponTypes,
  ...weaponUnarmedTypes,
};

/* -------------------------------------------------- */

/**
 * @type {Record<string, WeatherTypeConfig>}
 */
export const weatherTypes = {
  clearSkies: {
    label: "RYUUTAMA.WEATHER.clearSkies",
    modifier: 0,
    icon: "systems/ryuutama/assets/official/icons/weathers/clear-skies.svg",
  },
  cloudy: {
    label: "RYUUTAMA.WEATHER.cloudy",
    modifier: 0,
    icon: "systems/ryuutama/assets/official/icons/weathers/cloudy.svg",
  },
  rain: {
    label: "RYUUTAMA.WEATHER.rain",
    modifier: 1,
    icon: "systems/ryuutama/assets/official/icons/weathers/rain.svg",
  },
  strongWind: {
    label: "RYUUTAMA.WEATHER.strongWind",
    modifier: 1,
    icon: "systems/ryuutama/assets/official/icons/weathers/strong-wind.svg",
  },
  fog: {
    label: "RYUUTAMA.WEATHER.fog",
    modifier: 1,
    icon: "systems/ryuutama/assets/official/icons/weathers/fog.svg",
  },
  hot: {
    label: "RYUUTAMA.WEATHER.hot",
    modifier: 1,
    icon: "systems/ryuutama/assets/official/icons/weathers/hot.svg",
  },
  cold: {
    label: "RYUUTAMA.WEATHER.cold",
    modifier: 1,
    icon: "systems/ryuutama/assets/official/icons/weathers/cold.svg",
  },
  hardRain: {
    label: "RYUUTAMA.WEATHER.hardRain",
    modifier: 3,
    icon: "systems/ryuutama/assets/official/icons/weathers/hard-rain.svg",
  },
  snow: {
    label: "RYUUTAMA.WEATHER.snow",
    modifier: 3,
    icon: "systems/ryuutama/assets/official/icons/weathers/snow.svg",
  },
  deepFog: {
    label: "RYUUTAMA.WEATHER.deepFog",
    modifier: 3,
    icon: "systems/ryuutama/assets/official/icons/weathers/deep-fog.svg",
  },
  thunderStorm: {
    label: "RYUUTAMA.WEATHER.thunderStorm",
    modifier: 3,
    icon: "systems/ryuutama/assets/official/icons/weathers/thunder-storm.svg",
  },
  darkness: {
    label: "RYUUTAMA.WEATHER.darkness",
    modifier: 3,
    icon: "systems/ryuutama/assets/official/icons/weathers/darkness.svg",
  },
  hurricane: {
    label: "RYUUTAMA.WEATHER.hurricane",
    modifier: 5,
    icon: "systems/ryuutama/assets/official/icons/weathers/hurricane.svg",
  },
  blizzard: {
    label: "RYUUTAMA.WEATHER.blizzard",
    modifier: 5,
    icon: "systems/ryuutama/assets/official/icons/weathers/blizzard.svg",
  },
};
Prelocalization.prelocalize(weatherTypes);
