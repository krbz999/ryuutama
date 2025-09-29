/**
 * @typedef AbilityScoreConfig
 * @property {string} label           Human-readable label.
 * @property {string} abbreviation    Short-form of the label.
 */

/* -------------------------------------------------- */

/**
 * @typedef CheckConfig
 * @property {string} label         Human-readable label.
 * @property {string[]} abilities   One or two abilities commonly used for this check.
 */

/* -------------------------------------------------- */

/**
 * @typedef GenderConfig
 * @property {string} label   Human-readable label.
 */

/* -------------------------------------------------- */

/**
 * @typedef ItemModifierConfig
 * The configuration of an item modifier, which modifies the sell price of an item.
 * @property {string} label         Human-readable label.
 * @property {number} cost          A multiplicative modifier on the base cost, if non-magical, otherwise additive.
 * @property {boolean} [hidden]     If `true`, this modifier is not shown on the item sheet unless the item has this
 *                                  modifier and derived data is being shown.
 * @property {boolean} [magical]    If `true`, the `cost` property is additive.
 */

/* -------------------------------------------------- */

/**
 * @typedef ItemSizeConfig
 * @property {string} label   Human-readable label.
 * @property {number} grip    Number of hands needed to wield the item.
 */

/* -------------------------------------------------- */

/**
 * @typedef JourneyCheckTypeConfig
 * @property {string} label   Human-readable label.
 */

/* -------------------------------------------------- */

/**
 * @typedef StartingScoreConfig
 * @property {string} label       Human-readable label.
 * @property {number[]} values    Array of starting scores, of length 4.
 */

/* -------------------------------------------------- */

/**
 * @typedef StatusEffectConfig
 * @property {string} name              Human-readable label.
 * @property {string} img               The image used for the status effect.
 * @property {string} _id               Unique document id of the status effect.
 * @property {"body"|"mind"} category   The status effect category.
 */

/* -------------------------------------------------- */

/**
 * @typedef TerrainTypeConfig
 * @property {string} label                 Human-readable label.
 * @property {number} level                 The terrain level.
 * @property {number} difficulty            Terrain difficulty.
 * @property {number} [movementModifier]    A modifier to movement speed through this terrain.
 */

/* -------------------------------------------------- */

/**
 * @typedef TravelerTypeConfig
 * The general loadout of a traveler.
 * @property {string} label   Human-readable label.
 */

/* -------------------------------------------------- */

/**
 * @typedef WeaponCategoryConfig
 * Configuration for a weapon category.
 * @property {string} label       Human-readable label.
 * @property {0|1|2} grip         The number of hands needed to wield.
 * @property {boolean} [ranged]   Can this weapon attack from long range?
 */

/* -------------------------------------------------- */

/**
 * @typedef WeatherCategoryConfig
 * @property {string} label   Human-readable label.
 */

/* -------------------------------------------------- */

/**
 * @typedef WeatherTypeConfig
 * @property {string} label         Human-readable label.
 * @property {number} [modifier]    The weather modifier for a journey check.
 * @property {string} [category]    The weather category, for use with features such as 'all rain related conditions'.
 */
