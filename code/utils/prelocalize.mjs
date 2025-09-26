/**
 * Localize an object, replacing string properties with a localized string.
 * @param {Record<*, object>} record    The record whose entries to localize.
 * @param {object} [options={}]
 * @param {string[]} [options.properties]   The properties to replace.
 * @returns {void}
 */
export default function prelocalize(record, { properties = ["label"] } = {}) {
  for (const k in record) {
    for (const p of properties) {
      const unlocalized = foundry.utils.getProperty(record[k], p);
      if (!unlocalized || !game.i18n.has(unlocalized)) continue;
      foundry.utils.setProperty(record[k], p, game.i18n.localize(unlocalized));
    }
  }
}
