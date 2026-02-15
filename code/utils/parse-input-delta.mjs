/**
 * Handle a delta input for a number value from a form.
 * @param {HTMLInputElement} input              Input that contains the modified value.
 *                                              The input must have `data-name` or `name` which is a string
 *                                              pointing directly to the numeric property or to an object
 *                                              that contains both `value` and `max` properties.
 * @param {foundry.abstract.Document} target    Target document to be updated.
 * @returns {number|void}                       The new value.
 */
export default function parseInputDelta(input, target) {
  let name = input.dataset.name ?? input.name;
  let attr;
  if (name.endsWith(".value")) {
    name = name.slice(0, -".value".length);
    attr = foundry.utils.getProperty(target, name);
    if (!("max" in attr)) attr = attr.value;
  }

  // This method may be running twice, eg in case of embedded item
  // updates on an actor sheet, in which case we bail out early.
  if (!attr) return;

  const isBar = (typeof attr === "object") && ("max" in attr);
  const isEqual = input.value.startsWith("=");
  const isDelta = input.value.startsWith("+") || input.value.startsWith("-");
  const current = isBar ? attr.value : attr;

  let v;
  let i = input.value;
  if (isEqual) i = i.slice(1);
  if (i.endsWith("%")) {
    const p = Number(i.slice(0, -1)) / 100;
    if (isEqual) v = attr.max * p;
    else v = Math.abs(current) * p;
  } else {
    v = Number(i);
  }

  const value = isDelta ? current + v : v;
  return input.value = Math.round(value);
}
