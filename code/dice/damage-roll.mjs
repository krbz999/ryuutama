import CheckRoll from "./check-roll.mjs";

export default class DamageRoll extends CheckRoll {
  /** @override */
  static PART_TYPE = "damage";

  /* -------------------------------------------------- */

  /**
   * Obtain which roll properties are applied.
   * @returns {Record<string, boolean>}
   */
  _getRollProperties() {
    const options = {};
    for (const k of Object.keys(ryuutama.config.damageRollProperties)) {
      options[k] = !!this.options[k];
    }
    return options;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _getTooltipProperties() {
    const properties = Object.entries(this._getRollProperties()).map(([k, v]) => {
      if (!v) return null;
      const { label, icon } = ryuutama.config.damageRollProperties[k];
      return { tooltip: label, icon };
    }).filter(_ => _);

    return [
      ...super._getTooltipProperties(),
      ...properties,
    ];
  }
}
