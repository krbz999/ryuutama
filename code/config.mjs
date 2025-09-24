/**
 * @import { GenderConfig, TravelerTypeConfig, ItemModifierConfig, WeaponCategoryConfig } from "./_types.mjs";
 */

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
      bonus: -2, // TODO: improved weapons have -1 instead of -2
    },
  },
};
