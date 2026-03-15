/**
 * Utility method to add a `_toConfig` getter to an enum
 * prior to freezing it, allowing for easily retrieve the limited config.
 * @param {object} obj          The enum.
 * @param {string} configKey    The key in `ryuutama.config`.
 */
const toConfig = (obj, configKey) => {
  Object.defineProperty(obj, "_toConfig", {
    enumerable: false,
    get() {
      const config = ryuutama.config[configKey];
      return Object.values(this).reduce((acc, key) => {
        return Object.assign(acc, { [key]: config[key] });
      }, {});
    },
  });
  Object.freeze(obj);
};

/* -------------------------------------------------- */

/**
 * Ability scores, or 'stats'.
 * @enum {string}
 */
export const ABILITIES = {
  STRENGTH: "strength",
  DEXTERITY: "dexterity",
  INTELLIGENCE: "intelligence",
  SPIRIT: "spirit",
};
toConfig(ABILITIES, "abilityScores");

/* -------------------------------------------------- */

/**
 * Animal subtypes.
 * @enum {string}
 */
export const ANIMAL_TYPES = {
  RIDING: "riding",
  RIDING_LARGE: "ridingLarge",
  PACK_ANIMAL: "pack",
  PACK_ANIMAL_LARGE: "packLarge",
  PET: "pet",
};
toConfig(ANIMAL_TYPES, "animalTypes");

/* -------------------------------------------------- */

/**
 * Herb types.
 * @enum {string}
 */
export const HERB_TYPES = {
  ENHANCE: "enhance",
  MENTAL: "mental",
  PHYSICAL: "physical",
};
toConfig(HERB_TYPES, "herbTypes");

/* -------------------------------------------------- */

/**
 * @enum {number}
 */
export const ITEM_SIZES = [1, 3, 5];
toConfig(ITEM_SIZES, "itemSizes");

/* -------------------------------------------------- */

/**
 * Ration types.
 * @enum {string}
 */
export const RATION_TYPES = {
  ANIMAL_FEED: "animalFeed",
  FOOD: "food",
  RATION: "ration",
  WATER: "water",
};
toConfig(RATION_TYPES, "rationTypes");

/* -------------------------------------------------- */

/**
 * Spell categories.
 * @enum {string}
 */
export const SPELL_CATEGORIES = {
  INCANTATION: "incantation",
  SPRING: "spring",
  SUMMER: "summer",
  AUTUMN: "autumn",
  WINTER: "winter",
};
toConfig(SPELL_CATEGORIES, "spellCategories");

/* -------------------------------------------------- */

/**
 * Spell levels.
 * @enum {string}
 */
export const SPELL_LEVELS = {
  LOW: "low",
  MID: "mid",
  HIGH: "high",
};
toConfig(SPELL_LEVELS, "spellLevels");

/* -------------------------------------------------- */

/**
 * Status effects.
 * @enum {string}
 */
export const STATUS_EFFECTS = {
  INJURY: "injury",
  POISON: "poison",
  SICKNESS: "sickness",
  EXHAUSTION: "exhaustion",
  MUDDLED: "muddled",
  SHOCK: "shock",
};
toConfig(STATUS_EFFECTS, "statusEffects");
