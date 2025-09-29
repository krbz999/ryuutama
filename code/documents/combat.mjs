export default class RyuutamaCombat extends foundry.documents.Combat {
  /** @override */
  async rollInitiative(ids, options = {}) {
    ids = typeof ids === "string" ? [ids] : ids;

    for (const id of ids) {
      await this.combatants.get(id)?.rollInitiative();
    }

    return this;
  }
}
