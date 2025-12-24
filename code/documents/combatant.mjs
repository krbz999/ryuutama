/**
 * @import { CheckRollConfig, CheckDialogConfig, CheckMessageConfig } from "../data/actor/_types.mjs";
 */

export default class RyuutamaCombatant extends foundry.documents.Combatant {
  /** @inheritdoc */
  _initializeSource(data = {}, options = {}) {
    if (!data.type || (data.type === "base")) data.type = "standard";
    return super._initializeSource(data, options);
  }

  /* -------------------------------------------------- */

  /**
   * @param {CheckRollConfig} [rollConfig={}]
   * @param {CheckDialogConfig} [dialogConfig={}]
   * @param {CheckMessageConfig} [messageConfig={}]
   * @returns {Promise<RyuutamaCombatant>}
   * @override
   */
  async rollInitiative(rollConfig = {}, dialogConfig = {}, messageConfig = {}) {
    if (typeof rollConfig === "string") {
      throw new Error("Ryuutama | The signature of Combatant#rollInitiative has changed and no longer allows a formula replacement.");
    }

    await this.actor.system.rollInitiative(rollConfig, dialogConfig, messageConfig);
    return this;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);
    if ("initiative" in changed) this.actor?.render(false, { renderContext: "updateCombatant" });
  }

  /* -------------------------------------------------- */

  /**
   * Return a data object which defines the data schema against which dice rolls can be evaluated.
   * @returns {object}
   */
  getRollData() {
    const rollData = this.actor?.getRollData() ?? {};
    rollData.combatant = { ...this };
    return rollData;
  }
}
