export default class RyuutamaCombat extends foundry.documents.Combat {
  /** @inheritdoc */
  _initializeSource(data = {}, options = {}) {
    if (!data.type || (data.type === "base")) data.type = "standard";
    return super._initializeSource(data, options);
  }

  /* -------------------------------------------------- */

  /** @override */
  async rollInitiative(ids, options = {}) {
    ids = typeof ids === "string" ? [ids] : ids;

    for (const id of ids) {
      await this.combatants.get(id)?.rollInitiative();
    }

    return this;
  }
}
