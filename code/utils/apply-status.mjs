/**
 * Apply a status of a certain strength.
 * @param {string} statusId   A key found in `config.statusEffects`.
 * @param {number} strength   The strength of the status.
 * @returns {Promise<void>}   A promise that resolves once all actors have had statuses applied.
 */
export default async function applyStatus(statusId, strength) {
  const Cls = getDocumentClass("ActiveEffect");
  const effect = await Cls.fromStatusEffect(statusId, { strength });
  const actors = new Set(canvas.tokens.controlled
    .map(token => token.actor)
    .filter(actor => {
      if (!actor) return false;
      const e = actor.effects.get(effect.id);
      if (!e) return true;
      return e.system.strength.value < strength;
    }),
  );

  if (!actors.size) {
    ui.notifications.warn("RYUUTAMA.EFFECT.STATUS.noActors", { localize: true });
    return;
  }

  for (const actor of actors) {
    await actor.effects.get(effect.id)?.delete();
    await Cls.create(effect.toObject(), { parent: actor, keepId: true });
  }
}
