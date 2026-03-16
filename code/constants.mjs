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
 * Ration modifiers, which are exclusive.
 * @enum {string}
 */
export const RATION_MODIIFERS = {
  DISGUSTING: "disgusting",
  NORMAL: "regular",
  DELICIOUS: "delicious",
};
toConfig(RATION_MODIIFERS, "rationModifiers");

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
 * Spell activation types.
 * @enum {string}
 */
export const SPELL_ACTIVATIONS = {
  NORMAL: "normal",
  RITUAL: "ritual",
};
toConfig(SPELL_ACTIVATIONS, "spellActivationTypes");

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
 * Spell duration types.
 * @enum {string}
 */
export const SPELL_DURATIONS = {
  HOUR: "hours",
  ROUND: "rounds",
  INSTANT: "instant",
  MINUTE: "minutes",
  DAY: "days",
  RITUAL: "ritual",
  PERMANENT: "permanent",
  SPECIAL: "special",
};
toConfig(SPELL_DURATIONS, "spellDurationTypes");

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
 * Spell range types.
 * @enum {string}
 */
export const SPELL_RANGES = {
  TOUCH: "touch",
  CASTER: "caster",
  AREA_CLOSE: "closeArea",
  AREA_ALL: "allAreas",
  ANY: "any",
  SPECIAL: "special",
};
toConfig(SPELL_RANGES, "spellRangeTypes");

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

/* -------------------------------------------------- */

/**
 * Traveler types.
 * @enum {string}
 */
export const TRAVELER_TYPES = {
  ATTACK: "attack",
  TECHNICAL: "technical",
  MAGIC: "magic",
};
toConfig(TRAVELER_TYPES, "travelerTypes");
