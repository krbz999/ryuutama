export default class RyuutamaCombat extends foundry.documents.Combat {
  /** @override */
  async rollInitiative(ids, options = {}) {
    ids = typeof ids === "string" ? [ids] : ids;

    for (const id of ids) {
      await this.combatants.get(id)?.rollInitiative();
    }

    return this;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onDelete(options, userId) {
    super._onDelete(options, userId);

    if (!this.active || !game.user.isActiveGM) return;

    // Remove effects that expire upon combat end.
    const actors = new Set(this.combatants.map(c => c.actor).filter(_ => _));
    for (const actor of actors) {
      const effects = actor.effects.filter(effect => effect.system.expiration.type === "combatEnd");
      actor.deleteEmbeddedDocuments("ActiveEffect", effects.map(effect => effect.id));
    }
  }
}
