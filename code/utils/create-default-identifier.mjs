/**
 * Create a valid identifier from a string.
 * @param {string} string
 * @returns {string}
 */
export default function createDefaultIdentifier(string) {
  const identifier = string.replaceAll(/(\w+)([\\|/])(\w+)/g, "$1-$3");
  return identifier.slugify({ strict: true });
}
