export default class RyuutamaActor extends foundry.documents.Actor {
  /** @override */
  getRollData() {
    const rollData = this.system.getRollData?.() ?? { ...this.system };
    rollData.name = this.name;
    return rollData;
  }

  /* -------------------------------------------------- */

  /**
   * Removed in favor of a system implementation.
   * @override
   */
  async rollInitiative(...args) {
    throw new Error("Ryuutama | The `Actor#rollInitiative` method has been removed in favor of `Actor#system#rollInitiative`. Please use that instead.");
  }
}
