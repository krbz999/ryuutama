export default class RyuutamaActor extends foundry.documents.Actor {
  /** @override */
  getRollData() {
    const rollData = this.system.getRollData?.() ?? { ...this.system };
    rollData.name = this.name;
    return rollData;
  }
}
