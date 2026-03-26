/**
 * @import { CheckRollConfig, CheckDialogConfig, CheckMessageConfig } from "../data/actor/_types.mjs";
 */

/**
 * System implementation of the Combatant document class.
 * @extends foundry.documents.Combatant
 */
export default class RyuutamaCombatant extends foundry.documents.Combatant {
  /** @inheritdoc */
  _initializeSource(data = {}, options = {}) {
    if (!data.type || (data.type === "base")) data.type = "standard";
    return super._initializeSource(data, options);
  }

  /* -------------------------------------------------- */

  /**
   * Roll initiative.
   * @param {CheckRollConfig} [rollConfig={}]
   * @param {CheckDialogConfig} [dialogConfig={}]
   * @param {CheckMessageConfig} [messageConfig={}]
   * @returns {Promise<this>}
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

  /** @inheritdoc */
  _onDelete(options, userId) {
    super._onDelete(options, userId);
    this.actor?.render(false, { renderContext: "deleteCombatant" });
  }

  /* -------------------------------------------------- */

  /**
   * Return a data object which defines the data schema against which dice rolls can be evaluated.
   * @returns {object}
   */
  getRollData() {
    const combatant = (typeof this.system.getRollData === "function") ? this.system.getRollData() : { ...this.system };
    combatant.name = this.name;
    combatant.flags = this.flags;
    const rollData = this.actor?.getRollData() ?? {};
    rollData.combatant = combatant;
    return rollData;
  }
}
