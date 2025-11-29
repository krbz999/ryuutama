import CheckRoll from "./check-roll.mjs";

export default class DamageRoll extends CheckRoll {
  /** @override */
  static PART_TYPE = "damage";

  /* -------------------------------------------------- */

  /**
   * Does this instance of damage ignore defense points?
   */
  get isDefenseless() {
    return !!this.options.defenseless;
  }

  /* -------------------------------------------------- */

  /**
   * Is this instance of damage magical?
   * @type {boolean}
   */
  get isMagical() {
    return !!this.options.magical;
  }

  /* -------------------------------------------------- */

  /**
   * Is this damage from a mythril item?
   * @type {boolean}
   */
  get isMythril() {
    return !!this.options.mythril;
  }

  /* -------------------------------------------------- */

  /**
   * Is this damage from an orichalcum item?
   * @type {boolean}
   */
  get isOrichalcum() {
    return !!this.options.orichalcum;
  }
}
