/**
 * Ensure the provided string contains only the characters allowed in identifiers.
 * @param {string} identifier
 * @returns {boolean}
 */
export default function isValidIdentifier(identifier) {
  return /^([a-z0-9_-]+)$/i.test(identifier);
}
