/**
 * Retrieve a Set of actors from the context of an element. In order of priority:
 * - tooltip actor
 * - actor sheet
 * - item sheet
 * - controlled tokens
 * - assigned character
 * @param {HTMLElement} element
 * @param {object} [options]
 * @param {boolean} [options.fallbackAssigned]      If no actors found, fall back to the assigned character.
 * @param {boolean} [options.fallbackControlled]    If no actors found, fall back to the controlled tokens.
 * @returns {Set<foundry.documents.Actor>}
 */
export default function contextualActors(element, { fallbackAssigned = true, fallbackControlled = true } = {}) {
  const application = foundry.applications.instances.get(element.closest(".application")?.id);
  const tooltipActor = fromUuidSync(element.closest(".locked-tooltip [data-actor-uuid]")?.dataset.actorUuid);

  let actors = [];
  switch (true) {
    case tooltipActor instanceof foundry.documents.Actor:
      actors = [tooltipActor];
      break;
    case application?.document instanceof foundry.documents.Actor:
      actors = [application.document];
      break;
    case application?.document?.actor instanceof foundry.documents.Actor:
      actors = [application.document.actor];
      break;
    case fallbackControlled:
      actors = canvas.tokens.controlled.map(token => token.actor).filter(_ => _);
      break;
    case fallbackAssigned:
      actors = [game.user.character].filter(_ => _);
      break;
  }

  return new Set(actors);
}
