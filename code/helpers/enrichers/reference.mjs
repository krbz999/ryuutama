/**
 * A unique ID to assign to the enricher type. Required if you want to use the onRender callback.
 * @type {string}
 */
export const id = "reference";

/* -------------------------------------------------- */

/**
 * The string pattern to match. Must be flagged as global.
 * @type {RegExp}
 */
export const pattern = /\[\[reference (?<config>[^\]]+)]](?:{(?<label>[^}]+)})?/gi;

/* -------------------------------------------------- */

/**
 * The function that will be called on each match. It is expected that this
 * returns an HTML element to be inserted into the final enriched content.
 * @type {import("@client/config.mjs").TextEditorEnricher}
 */
export async function enricher(match, options = {}) {
  let { config } = match.groups;
  config = ryuutama.utils.parseEnricherConfig(config);

  if (!("id" in config)) {
    const id = config.values.find(k => k in ryuutama.config.references);
    if (!id) return null;
    config.id = id;
  }

  const uuid = ryuutama.config.references[config.id];
  const page = await fromUuid(uuid);
  if (!page || (page.type !== "reference")) return null;
  const anchor = document.createElement("A");
  anchor.classList.add(ryuutama.id, "enricher");
  anchor.innerHTML = page.name;
  anchor.dataset.referenceId = config.id;
  anchor.dataset.tooltipHtml = CONFIG.ux.TooltipManager.constructHTML({ uuid });
  return anchor;
}

/* -------------------------------------------------- */

/**
 * An optional callback that is invoked when the enriched content is added to the DOM.
 * @type {Function(HTMLEnrichedContentElement)}
 */
export function onRender(element) {}
