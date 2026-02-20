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
 * A chat message string pattern to match.
 * @type {RegExp}
 */
export const chatPattern = /^\/check (?<config>[^\]]+)/;

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

  wrapper.dataset.type = config.type;
  if (config.subtype) wrapper.dataset.subtype = config.subtype;
  if (config.abilities.length) wrapper.dataset.abilities = config.abilities.join("|");
  else if (config.formula) wrapper.dataset.formula = config.formula;
  anchor.dataset.tooltipText = game.i18n.localize("RYUUTAMA.ROLL.TYPES." + config.type);

  const typeConfig = ryuutama.config.checkTypes[config.type];

  if (!label && config.abilities.length)
    label = `[${config.abilities.map(abi => ryuutama.config.abilityScores[abi].abbreviation).join(" + ")}]`;
  else if (!label && config.formula) label = `[${config.formula}]`;
  if (label) anchor.innerHTML = label.trim();
  else if (config.subtype) anchor.innerHTML = typeConfig.subtypes[config.subtype].label;
  else anchor.innerHTML = typeConfig.label;

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
  const { type, subtype, formula, abilities } = element.dataset;
  const rollConfig = { type };
  if ((type === "journey") && (subtype in ryuutama.config.checkTypes.journey.subtypes)) {
    rollConfig.journeyId = subtype;
  }
  if (formula) rollConfig.formula = formula;
  else if (abilities) {
    rollConfig.abilities = abilities.split("|");
    if (type === "damage") {
      rollConfig.ability = rollConfig.abilities[0];
      delete rollConfig.abilities;
    }
  }
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
    else if (canvas?.tokens?.controlled.length)
      actors = new Set(canvas.tokens.controlled.map(token => token.actor).filter(_ => _));
    else actors = [game.user.character].filter(_ => _);

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

/* -------------------------------------------------- */

/**
 * The function that runs to interpret message contents for a check.
 * @param {string} message
 * @param {{ speaker: object, userId: string }} chatData
 */
export function chatMessage(message, chatData) {
  let config = message.match(chatPattern).groups.config;
  config = ryuutama.utils.parseEnricherConfig(config);
  if (adjustConfig(config) === null) return;

  const Cls = getDocumentClass("ChatMessage");
  const actor = Cls.getSpeakerActor(chatData.speaker);

  const { type, subtype, formula, request, properties } = config;
  const options = Object.fromEntries(Array.from(properties ?? []).map(p => [p, true]));
  const rollConfig = { type, journeyId: subtype, formula, rollOptions: options };
  if (!actor && !request) {
    ui.notifications.error("RYUUTAMA.CHAT.warnNoActorFoundForCommand", { localize: true });
    return;
  }

  if (request) {
    Cls.create({
      type: "standard",
      speaker: chatData.speaker,
      system: {
        parts: {
          [foundry.utils.randomID()]: { type: "request", check: { configuration: rollConfig } },
        },
      },
    });
  } else {
    actor.system.rollCheck(rollConfig);
  }
}

/* -------------------------------------------------- */

/**
 * Mutate the configuration object. Return `null` to cancel the enrichment.
 * @param {object} config
 * @returns {void|null}
 */
function adjustConfig(config) {
  if (!("type" in config)) {
    const type = config.values.find(k => k in ryuutama.config.checkTypes) ?? "check";
    config.type = type;
  }

  const typeConfig = ryuutama.config.checkTypes[config.type];

  if (typeConfig.subtypes && !("subtype" in config)) {
    const subtype = config.values.find(k => k in typeConfig.subtypes);
    if (subtype) config.subtype = subtype;
  }

  config.abilities = config.abilities?.split("|").map(key => filterAbilityKey(key)).filter(_ => _).slice(0, 2) ?? [];
  config.values.forEach(k => {
    const key = filterAbilityKey(k);
    if (key && (config.abilities.length < 2)) config.abilities.push(key);
  });

  if (!("formula" in config) && !config.abilities.length) {
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
}

/* -------------------------------------------------- */

const filterAbilityKey = key => {
  key = key.toLowerCase().trim();
  if (key in ryuutama.config.abilityScores) return key;

  // Shorthand ability.
  const [k] = Object.entries(ryuutama.config.abilityScores)
    .find(([a, b]) => b.abbreviation.toLowerCase() === key) ?? [];
  if (k) return k;
};
