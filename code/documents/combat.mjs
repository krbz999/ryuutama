export default class RyuutamaCombat extends foundry.documents.Combat {
  /** @inheritdoc */
  _initializeSource(data = {}, options = {}) {
    if (!data.type || (data.type === "base")) data.type = "standard";
    return super._initializeSource(data, options);
  }

  /* -------------------------------------------------- */

  /** @override */
  async rollInitiative(ids, { delayed = false, ...options } = {}) {
    ids = typeof ids === "string" ? [ids] : ids;

    for (const id of ids) {
      await this.combatants.get(id)?.rollInitiative({ initiative: { delayed } });
    }

    return this;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async nextRound() {
    const updates = this.combatants.map(c => {
      const update = { _id: c.id };
      const delayed = c.system.initiative;
      if (Number.isNumeric(delayed.value)) {
        update.initiative = delayed.value;
        update.system = { initiative: null };
      }
      return update;
    });
    await this.updateEmbeddedDocuments("Combatant", updates, { render: false, turnEvents: false });
    return super.nextRound();
  }
}
