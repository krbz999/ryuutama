/**
 * A unique ID to assign to the enricher type. Required if you want to use the onRender callback.
 * @type {string}
 */
export const id = "damage";

/* -------------------------------------------------- */

/**
 * The string pattern to match. Must be flagged as global.
 * @type {RegExp}
 */
export const pattern = /\[\[\/damage (?<config>[^\]]+)]](?:{(?<label>[^}]+)})?/gi;

/* -------------------------------------------------- */

/**
 * A chat message string pattern to match.
 * @type {RegExp}
 */
export const chatPattern = /^\/damage (?<config>[^\]]+)/;

/* -------------------------------------------------- */

/**
 * The function that will be called on each match. It is expected that this
 * returns an HTML element to be inserted into the final enriched content.
 * @type {import("@client/config.mjs").TextEditorEnricher}
 */
export async function enricher(match, options = {}) {
  let { config, label } = match.groups;
  config = ryuutama.utils.parseEnricherConfig(config);

  if (adjustConfig(config) === null) return null;

  const wrapper = new foundry.applications.elements.HTMLEnrichedContentElement();
  wrapper.classList.add(ryuutama.id);
  const elements = [];

  const anchor = document.createElement("A");
  elements.push(anchor);
  anchor.classList.add("enricher");
  if (!label) label = `[${config.formula}]`;
  anchor.innerHTML = label.trim();

  wrapper.dataset.formula = config.formula;
  wrapper.dataset.properties = Array.from(config.properties).join(",");
  wrapper.innerHTML = elements.map(element => element.outerHTML).join("");

  return wrapper;
}

/* -------------------------------------------------- */

/**
 * An optional callback that is invoked when the enriched content is added to the DOM.
 * @type {Function(HTMLEnrichedContentElement)}
 */
export function onRender(element) {
  const { formula } = element.dataset;
  const enricher = element.querySelector(".enricher");
  if (enricher._hasEvent) return;
  enricher._hasEvent = true;
  enricher.addEventListener("click", async (event) => {
    const target = event.currentTarget;
    const application = foundry.applications.instances.get(target.closest(".application")?.id);
    const tooltipActor = fromUuidSync(target.closest(".locked-tooltip [data-actor-uuid]")?.dataset.actorUuid);
    let actors = [];
    if (tooltipActor instanceof foundry.documents.Actor) actors = [tooltipActor];
    else if (application?.document instanceof foundry.documents.Actor) actors = [application.document];
    else if (application?.document?.actor instanceof foundry.documents.Actor) actors = [application.document.actor];
    else if (canvas?.tokens?.controlled.length)
      actors = new Set(canvas.tokens.controlled.map(token => token.actor).filter(_ => _));
    else actors = [game.user.character].filter(_ => _);

    const Cls = getDocumentClass("ChatMessage");
    const options = Object.fromEntries(element.dataset.properties.split(",").map(p => [p, true]));
    for (const actor of actors) {
      const roll = new ryuutama.dice.DamageRoll(formula, actor?.getRollData(), options);
      const speaker = Cls.getSpeaker({ actor });
      await roll.toMessage({ speaker });
    }
  });
}

/* -------------------------------------------------- */

/**
 * The function that runs to interpret message contents for a damage roll.
 * @param {string} message
 * @param {{ speaker: object, userId: string }} chatData
 */
export function chatMessage(message, chatData) {
  let config = message.match(chatPattern).groups.config;
  config = ryuutama.utils.parseEnricherConfig(config);
  if (adjustConfig(config) === null) return;

  const Cls = getDocumentClass("ChatMessage");
  const actor = Cls.getSpeakerActor(chatData.speaker);
  const options = Object.fromEntries(Array.from(config.properties).map(p => [p, true]));
  const roll = new ryuutama.dice.DamageRoll(config.formula, actor?.getRollData(), options);
  roll.toMessage({ speaker: chatData.speaker });
}

/* -------------------------------------------------- */

/**
 * Mutate the configuration object. Return `null` to cancel the enrichment.
 * @param {object} config
 * @returns {void|null}
 */
function adjustConfig(config) {
  if (!("formula" in config)) {
    const formula = config.values.find(k => !!k && foundry.dice.Roll.validate(k));
    if (formula) config.formula = formula;
    else return null;
  }

  config.properties = new Set();
  for (const property of Object.keys(ryuutama.config.damageRollProperties)) {
    config[property] ??= config.values.includes(property);
    if (config[property]) config.properties.add(property);
  }
}
