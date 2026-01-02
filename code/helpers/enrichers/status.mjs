/**
 * A unique ID to assign to the enricher type. Required if you want to use the onRender callback.
 * @type {string}
 */
export const id = "status";

/* -------------------------------------------------- */

/**
 * The string pattern to match. Must be flagged as global.
 * @type {RegExp}
 */
export const pattern = /\[\[\/?status (?<config>[^\]]+)]](?:{(?<label>[^}]+)})?/gi;

/* -------------------------------------------------- */

/**
 * The function that will be called on each match. It is expected that this
 * returns an HTML element to be inserted into the final enriched content.
 * @type {import("@client/config.mjs").TextEditorEnricher}
 */
export async function enricher(match, options = {}) {
  let { config, label } = match.groups;
  config = ryuutama.utils.parseEnricherConfig(config);

  if (!("id" in config)) {
    const id = config.values.find(k => k in ryuutama.config.statusEffects);
    if (!id) return null;
    config.id = id;
  }

  if (!("strength" in config)) {
    const strength = config.values.find(k => Number.isNumeric(k));
    if (!strength) return null;
    config.strength = strength;
  }

  const anchor = document.createElement("A");
  anchor.classList.add(ryuutama.id, "enricher");
  anchor.innerHTML = label ? label.trim() : `[${ryuutama.config.statusEffects[config.id].name}: ${config.strength}]`;
  anchor.dataset.statusId = config.id;
  anchor.dataset.strength = config.strength;
  return anchor;
}

/* -------------------------------------------------- */

/**
 * An optional callback that is invoked when the enriched content is added to the DOM.
 * @type {Function(HTMLEnrichedContentElement)}
 */
export function onRender(element) {
  const enricher = element.querySelector(".enricher");
  if (enricher._hasEvent) return;
  enricher._hasEvent = true;
  element = element.querySelector("[data-status-id]");
  const { statusId, strength } = element.dataset;
  element.addEventListener("click", () => ryuutama.utils.applyStatus(statusId, Number(strength)));
}
