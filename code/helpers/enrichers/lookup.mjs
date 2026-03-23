/**
 * A unique ID to assign to the enricher type. Required if you want to use the onRender callback.
 * @type {string}
 */
export const id = "lookup";

/* -------------------------------------------------- */

/**
 * The string pattern to match. Must be flagged as global.
 * @type {RegExp}
 */
export const pattern = /\[\[lookup (?<config>[^\]]+)]](?:{(?<fallback>[^}]+)})?/gi;

/* -------------------------------------------------- */

/**
 * The function that will be called on each match. It is expected that this
 * returns an HTML element to be inserted into the final enriched content.
 * @type {import("@client/config.mjs").TextEditorEnricher}
 */
export async function enricher(match, options = {}) {
  let { config, fallback } = match.groups;
  config = ryuutama.utils.parseEnricherConfig(config);

  if (!("formula" in config)) {
    const formula = config.values.find(k => k && foundry.dice.Roll.validate(k));
    if (!formula) return null;
    config.formula = formula;
  }

  config.evaluate = config.evaluate ??= config.values.includes("evaluate");
  config.evaluate = !!config.evaluate;

  const rollData = !foundry.utils.isEmpty(options.rollData) ? options.rollData : options.relativeTo?.getRollData?.();

  const element = document.createElement("SPAN");
  element.classList.add(ryuutama.id, "enricher");

  let label;
  if (rollData && config.evaluate) {
    label = (await foundry.dice.Roll
      .create(config.formula, rollData)
      .evaluate({ allowInteractive: false, allowStrings: true })
    ).total;
    label = String(label);
  } else {
    label = foundry.dice.Roll.replaceFormulaData(config.formula, rollData, { missing: "ᚖ" });
  }

  if (label.includes("ᚖ")) {
    label = fallback?.trim() ?? config.formula;
  }

  element.textContent = label;
  return element;
}

/* -------------------------------------------------- */

/**
 * An optional callback that is invoked when the enriched content is added to the DOM.
 * @type {Function(HTMLEnrichedContentElement)}
 */
export function onRender(element) {}
