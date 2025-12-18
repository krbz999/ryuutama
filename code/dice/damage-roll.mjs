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
    const properties = {};
    for (const property of Object.keys(ryuutama.config.damageRollProperties)) {
      if (this.options[property]) properties[property] = true;
    }
    return properties;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _getTooltipProperties() {
    const properties = [];
    for (const [property, active] of Object.entries(this.damageProperties)) {
      if (active) {
        const { label: tooltip, icon } = ryuutama.config.damageRollProperties[property];
        properties.push({ tooltip, icon });
      }
    }
    return properties;
  }
}
