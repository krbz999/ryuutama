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
      throw new Error("Ryuutama | The signature of Combatant#rollInitiative has changed and no longer allows a formula replacement.");
    }

    rollConfig = foundry.utils.mergeObject({
      type: "initiative",
      initiative: { shield: this.actor.type === "traveler" },
    }, rollConfig);
    const roll = await this.actor.system.rollCheck(rollConfig, dialogConfig, messageConfig);
    if (!roll) return this;
    return this.update({ initiative: roll.total });
  }
}
