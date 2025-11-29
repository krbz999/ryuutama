/**
 * @import RyuutamaActiveEffect from "./active-effect.mjs";
 */

export default class RyuutamaCombat extends foundry.documents.Combat {
  /** @inheritdoc */
  _initializeSource(data = {}, options = {}) {
    if (!data.type || (data.type === "base")) data.type = "standard";
    return super._initializeSource(data, options);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onDelete(options, userId) {
    super._onDelete(options, userId);

    if (!this.active || !game.user.isActiveGM) return;

    // Remove effects that expire upon combat end.
    this.expireEffects("combatEnd");
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

  /* -------------------------------------------------- */

  /**
   * Expire effects of a given expiration type.
   * @param {string} type   Expiration type.
   * @returns {Promise<RyuutamaActiveEffect[]>}   A promise that resolves to the deleted effects.
   */
  async expireEffects(type) {
    if (!game.user.isGM) {
      throw new Error("Only a GM can expire effects through the Combat document.");
    }

    const actors = new Set(this.combatants.map(c => c.actor).filter(_ => _));
    const promises = [];
    for (const actor of actors) {
      const effects = actor.effects.filter(effect => effect.system.expiration.type === type);
      const deleted = actor.deleteEmbeddedDocuments("ActiveEffect", effects.map(effect => effect.id));
      promises.push(deleted);
    }
    const deleted = await Promise.all(promises);
    return deleted.flat(1);
  }
}
