/**
 * Create a 16-character id from a string.
 * @param {string} str
 * @returns {string}
 */
export default function staticId(str) {
  str = str.slugify({ strict: true, lowercase: true, replacement: "" });
  if (str.length > 16) return str.slice(0, 16);
  return str.padEnd(16, "0");
}
