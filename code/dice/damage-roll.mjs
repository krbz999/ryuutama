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
    const {
      damageMental = false, ignoreArmor = false, magical = false, mythril = false, orichalcum = false,
    } = this.options;
    return { damageMental, ignoreArmor, magical, mythril, orichalcum };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _getTooltipProperties() {
    const config = ryuutama.config.damageRollProperties;
    const modifiers = ryuutama.config.itemModifiers;
    const options = this._getRollProperties();

    return [
      ...super._getTooltipProperties(),
      options.damageMental ? { icon: config.damageMental.icon, tooltip: config.damageMental.label } : null,
      options.ignoreArmor ? { icon: config.ignoreArmor.icon, tooltip: config.ignoreArmor.label } : null,
      options.magical ? { icon: "systems/ryuutama/assets/icons/eclipse-flare.svg", tooltip: "Magical" } : null,
      options.mythril ? { icon: modifiers.mythril.icon, tooltip: modifiers.mythril.label } : null,
      options.orichalcum ? { icon: modifiers.orichalcum.icon, tooltip: modifiers.orichalcum.label } : null,
    ].filter(_ => _);
  }
}
