/**
 * @import { CheckRollConfig, CheckDialogConfig, CheckMessageConfig } from "../data/actor/_types.mjs";
 */

export default class RyuutamaCombatant extends foundry.documents.Combatant {
  /**
   * @param {CheckRollConfig} [rollConfig={}]
   * @param {CheckDialogConfig} [dialogConfig={}]
   * @param {CheckMessageConfig} [messageConfig={}]
   * @returns {Promise<RyuutamaCombatant>}
   * @override
   */
  async rollInitiative(rollConfig = {}, dialogConfig = {}, messageConfig = {}) {
    if (typeof rollConfig === "string") {
      throw new Error("The signature of Combatant#rollInitiative has changed and no longer allows a formula replacement.");
    }

    const roll = await this.actor.system.rollCheck({ ...rollConfig, type: "initiative" }, dialogConfig, messageConfig);
    return this.update({ initiative: roll.total });
  }
}
