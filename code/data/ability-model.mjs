export default class AbilityModel extends foundry.abstract.DataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      value: new ryuutama.data.fields.AbilityScoreField(),
    };
  }

  /* -------------------------------------------------- */

  /**
   * Increases from advancements. Only used to track additions from this kind of source,
   * not actually used in calculations, advancements should call `AbilityScoreField#increase`.
   * A Stat Increase advancement requires this value to know what the "base" number is.
   * @type {number}
   */
  advancement = 0;

  /* -------------------------------------------------- */

  /**
   * How many times has the denomination been decreased?
   * @type {number}
   */
  decreases = 0;

  /* -------------------------------------------------- */

  /**
   * How many times has the denomination been increased?
   * @type {number}
   */
  increases = 0;

  /* -------------------------------------------------- */

  /**
   * Has the denomination been overridden? When overridden, increases and decreases no longer apply.
   * @type {boolean}
   */
  overridden = false;

  /* -------------------------------------------------- */

  /**
   * Minimum denomination from an upgrade change.
   * @type {number|null}
   */
  minimum = null;

  /* -------------------------------------------------- */

  /**
   * Maximum denomination from a downgrade change.
   * @type {number|null}
   */
  maximum = null;

  /* -------------------------------------------------- */

  /**
   * Die representation of the ability.
   * @type {string}
   */
  get die() {
    return `d${this.faces}`;
  }

  /* -------------------------------------------------- */

  /**
   * Number of faces on the die.
   * @type {number}
   */
  get faces() {
    return this.value;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  toString() {
    return `1${this.die}`;
  }

  /* -------------------------------------------------- */

  /**
   * Determine denomination from a list of options.
   * @param {number[]} options    The options for denominations, presented in order.
   * @returns {number}
   */
  determineDenomination(options) {
    if (this.overridden) return this.value;
    options = [...options];
    let value = this._source.value;
    let delta = this.increases - this.decreases;

    if (delta < 0) {
      delta = -delta;
      options.reverse();
    }

    const index = options.indexOf(value);
    value = options[index + delta] ?? options.at(-1);
    if (this.minimum) value = Math.max(value, this.minimum);
    if (this.maximum) value = Math.min(value, this.maximum);

    return value;
  }
}
