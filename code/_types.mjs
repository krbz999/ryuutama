/**
 * @typedef GenderConfig
 * @property {string} label   Human-readable label.
 */

/* -------------------------------------------------- */

/**
 * @typedef TravelerTypeConfig
 * The general loadout of a traveler.
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
 * @typedef WeaponCategoryConfig
 * Configuration for a weapon category.
 * @property {string} label                   Human-readable label.
 * @property {0|1|2} grip                     The number of hands needed to wield.
 * @property {boolean} [ranged]               Can this weapon attack from long range?
 * @property {object} accuracy
 * @property {string[]} accuracy.abilities    The default abilities used for an attack with a weapon.
 * @property {number} [accuracy.bonus]        A modifier added on top of an accuracy check.
 * @property {object} damage
 * @property {string} damage.ability          The default ability used for a damage roll with a weapon.
 * @property {number} [damage.bonus]          A modifier added on top of a damage roll.
 */
