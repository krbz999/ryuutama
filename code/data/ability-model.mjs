const { NumberField } = foundry.data.fields;

export default class AbilityModel extends foundry.abstract.DataModel {
  /** @override */
  static defineSchema() {
    return {
      value: new NumberField({ integer: true, nullable: false, initial: 4, min: 2, max: 20 }),
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

    const conditionIncrease = (this.parent.parent.type === "traveler")
      && (this.parent.parent.system.condition.value >= 10)
      && (this.parent.parent.system.condition.shape.high === this.schema.name);

    const delta = this.increases + Number(conditionIncrease) - this.decreases;
    if (delta) {
      for (let i = 0; i < Math.abs(delta); i++) value = this.#next(value, delta < 0);
    }
    return value;
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

  /**
   * The die size choices available.
   * @type {number[]}
   */
  get choices() {
    const values = [2, 4, 6, 8, 10, 12, 20];
    if (this.parent.parent.type === "traveler") {
      values.shift(); // disallow 2
      values.pop(); // disallow 20
    }
    return values;
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
    const values = this.choices;
    if (down) values.reverse();
    const idx = values.indexOf(v);
    return values[idx + 1] ?? values.at(-1);
  }
}
