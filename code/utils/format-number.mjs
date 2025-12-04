/**
 * Formatter.
 * @type {Intl.NumberFormat}
 */
let formatter;

/**
 * Format a number for display purposes.
 * @param {number} n
 * @returns {string}
 */
export default function formatNumber(n) {
  formatter ??= new Intl.NumberFormat(game.i18n.lang, { signDisplay: "exceptZero" });
  return formatter.format(n).replace(/^-/, "−");
}
