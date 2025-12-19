/**
 * A unique ID to assign to the enricher type. Required if you want to use the onRender callback.
 * @type {string}
 */
export const id = "check";

/* -------------------------------------------------- */

/**
 * The string pattern to match. Must be flagged as global.
 * @type {RegExp}
 */
export const pattern = /\[\[\/check (?<config>[^\]]+)]](?:{(?<label>[^}]+)})?/gi;

/* -------------------------------------------------- */

/**
 * The function that will be called on each match. It is expected that this
 * returns an HTML element to be inserted into the final enriched content.
 * @type {import("@client/config.mjs").TextEditorEnricher}
 */
export async function enricher(match, options = {}) {
  let { config, label } = match.groups;
  config = ryuutama.utils.parseEnricherConfig(config);

  if (!("type" in config)) {
    const type = config.values.find(k => k in ryuutama.config.checkTypes);
    if (!type) return null;
    config.type = type;
  }

  const typeConfig = ryuutama.config.checkTypes[config.type];

  if (typeConfig.subtypes && !("subtype" in config)) {
    const subtype = config.values.find(k => k in typeConfig.subtypes);
    if (subtype) config.subtype = subtype;
  }

  if (!("formula" in config)) {
    const formula = config.values.find(k => !!k && foundry.dice.Roll.validate(k));
    if (formula) config.formula = formula;
  }

  config.properties = new Set();
  if (config.type === "damage") {
    // TODO: allow for properties on other types of checks.
    for (const property of Object.keys(ryuutama.config.damageRollProperties)) {
      config[property] ??= config.values.includes(property);
      if (config[property]) config.properties.add(property);
    }
  }

  // Show request.
  config.request ??= config.values.includes("request");

  const wrapper = new foundry.applications.elements.HTMLEnrichedContentElement();
  wrapper.classList.add(ryuutama.id);
  const elements = [];

  const anchor = document.createElement("A");
  elements.push(anchor);
  anchor.classList.add("enricher");
  if (!label && !!config.formula) label = `[${config.formula}]`;

  if (label) anchor.innerHTML = label.trim();
  else if (config.subtype) anchor.innerHTML = typeConfig.subtypes[config.subtype].label;
  else anchor.innerHTML = typeConfig.label;

  wrapper.dataset.type = config.type;
  if (config.subtype) wrapper.dataset.subtype = config.subtype;
  if (config.formula) wrapper.dataset.formula = config.formula;
  anchor.dataset.tooltipText = game.i18n.localize("RYUUTAMA.ROLL.TYPES." + config.type);

  if (config.request) {
    const request = document.createElement("A");
    request.innerHTML = "<i class=\"fa-solid fa-bullhorn\"></i>";
    request.classList.add("request");
    request.dataset.tooltip = "RYUUTAMA.ROLL.requestRoll";
    elements.push(request);
  }

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
  const { type, subtype, formula } = element.dataset;
  const rollConfig = { type };
  if ((type === "journey") && (subtype in ryuutama.config.checkTypes.journey.subtypes)) {
    rollConfig.journeyId = subtype;
  }
  if (formula) rollConfig.formula = formula;
  const options = Object.fromEntries(element.dataset.properties.split(",").map(p => [p, true]));
  rollConfig.rollOptions = options;

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
    else actors = new Set(canvas.tokens.controlled.map(token => token.actor).filter(_ => _));

    const dialogConfig = { configure: !event.shiftKey };
    for (const actor of actors) {
      await actor.system.rollCheck(rollConfig, dialogConfig);
    }
  });

  element.querySelector(".request")?.addEventListener("click", event => {
    const target = event.currentTarget;
    const application = foundry.applications.instances.get(target.closest(".application")?.id);
    const tooltipActor = fromUuidSync(target.closest(".locked-tooltip [data-actor-uuid]")?.dataset.actorUuid);
    let actor;
    if (tooltipActor instanceof foundry.documents.Actor) actor = tooltipActor;
    else if (application?.document instanceof foundry.documents.Actor) actor = application.document;
    else if (application?.document?.actor instanceof foundry.documents.Actor) actor = application.document.actor;

    const messageData = {
      type: "standard",
      speaker: getDocumentClass("ChatMessage").getSpeaker({ actor }),
      system: {
        parts: {
          [foundry.utils.randomID()]: { type: "request", check: { configuration: rollConfig } },
        },
      },
    };
    getDocumentClass("ChatMessage").create(messageData);
  });
}
