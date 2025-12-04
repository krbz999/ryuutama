import CheckRoll from "./check-roll.mjs";

export default class DamageRoll extends CheckRoll {
  /** @override */
  static PART_TYPE = "damage";

  /* -------------------------------------------------- */

  /**
   * Applicable damage properties.
   * @type {Record<string, boolean>}
   */
  get damageProperties() {
    return Object.fromEntries(
      ["ignoreArmor", "magical", "mythril", "orichalcum", "damageMental"]
        .map(k => [k, !!this.options[k]]),
    );
  }
}
