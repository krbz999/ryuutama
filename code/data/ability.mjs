/**
 * A custom class that holds a specific ability score and helps render it for roll data.
 * @param {number} [value=4]    The ability score.
 */
export default class Ability {
  constructor(value = 4) {
    this.#value = value;
  }

  /* -------------------------------------------------- */

  /**
   * The ability score.
   * @type {number}
   */
  #value;

  /* -------------------------------------------------- */

  /**
   * The ability score.
   * @type {number}
   */
  get value() {
    return this.#value;
  }

  /* -------------------------------------------------- */

  /**
   * Alias for the value.
   * @type {number}
   */
  get faces() {
    return this.value;
  }

  /* -------------------------------------------------- */

  /**
   * Die representation.
   * @type {string}
   */
  get die() {
    return `d${this.faces}`;
  }

  /* -------------------------------------------------- */

  /** @override */
  toString() {
    return `1d${this.faces}`;
  }
}
