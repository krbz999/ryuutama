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
 * @enum {number}
 */
export const ITEM_SIZES = [1, 3, 5];
toConfig(ITEM_SIZES, "itemSizes");

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
