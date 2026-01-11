export default class RyuutamaCombat extends foundry.documents.Combat {
  /**
   * Default turn marker.
   * @type {string}
   */
  static {
    Object.defineProperty(this, "TURN_MARKER", {
      value: "systems/ryuutama/assets/official/combat/turn-marker-1.webp",
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _initializeSource(data = {}, options = {}) {
    if (!data.type || (data.type === "base")) data.type = "standard";
    return super._initializeSource(data, options);
  }

  /* -------------------------------------------------- */

  /** @override */
  async rollInitiative(ids, { delayed = false, ...options } = {}) {
    ids = (typeof ids === "string") ? [ids] : ids;

    for (const id of ids) {
      const combatant = this.combatants.get(id);
      if (!combatant?.actor) continue;
      await combatant?.rollInitiative({ initiative: { delayed } });
    }

    return this;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async nextRound() {
    const updates = this.combatants.map(c => {
      const update = { _id: c.id };
      const delayed = c.system.initiative;
      if (delayed.value) {
        update.initiative = new ryuutama.dice.BaseRoll(delayed.value, c.getRollData()).evaluateSync().total;
        update.system = { "initiative.value": "" };
      }
      return update;
    });
    await this.updateEmbeddedDocuments("Combatant", updates, { render: false, turnEvents: false });
    return super.nextRound();
  }
}
