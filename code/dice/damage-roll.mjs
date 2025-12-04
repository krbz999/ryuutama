import CheckRoll from "./check-roll.mjs";

export default class DamageRoll extends CheckRoll {
  /** @override */
  static PART_TYPE = "damage";

  /* -------------------------------------------------- */

  /**
   * Does this instance of damage also affect MP?
   * @type {boolean}
   */
  get damageMental() {
    return !!this.options.damageMental;
  }

  /* -------------------------------------------------- */

  /**
   * Does this instance of damage ignore defense points?
   */
  get ignoreArmor() {
    return !!this.options.ignoreArmor;
  }

  /* -------------------------------------------------- */

  /**
   * Is this instance of damage magical?
   * @type {boolean}
   */
  get magical() {
    return !!this.options.magical;
  }

  /* -------------------------------------------------- */

  /**
   * Is this damage from a mythril item?
   * @type {boolean}
   */
  get mythril() {
    return !!this.options.mythril;
  }

  /* -------------------------------------------------- */

  /**
   * Is this damage from an orichalcum item?
   * @type {boolean}
   */
  get orichalcum() {
    return !!this.options.orichalcum;
  }
}
