const { NumberField } = foundry.data.fields;

export default class AbilityModel extends foundry.abstract.DataModel {
  /** @override */
  static defineSchema() {
    return {
      value: new NumberField({ step: 2, min: 2, max: 12, nullable: false, initial: 4 }),
    };
  }

  /* -------------------------------------------------- */

  /**
   * Amount of die size increases.
   * @type {number}
   */
  increases = 0;

  /* -------------------------------------------------- */

  /**
   * Amount of die size decreases.
   * @type {number}
   */
  decreases = 0;

  /* -------------------------------------------------- */

  /**
   * Alias for the value.
   * @type {number}
   */
  get faces() {
    let value = this._source.value;
    const delta = this.increases - this.decreases;
    if (delta) {
      for (let i = 0; i < Math.abs(delta); i++) value = this.#next(value, delta < 0);
    }
    const min = this.parent.parent.type === "monster" ? 2 : 4;
    return Math.max(min, value);
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

  /* -------------------------------------------------- */

  /**
   * Get the next value in the array of die sizes.
   * @param {number} v          Current die size.
   * @param {boolean} [down]    Go backwards?
   * @returns {number}          Next die size.
   */
  #next(v, down = false) {
    const values = [2, 4, 6, 8, 10, 12];
    if (down) values.reverse();
    const idx = values.indexOf(v);
    return values[idx + 1] ?? values.at(-1);
  }
}
