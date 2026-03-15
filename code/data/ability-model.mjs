const { NumberField } = foundry.data.fields;

export default class AbilityModel extends foundry.abstract.DataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      advancement: new NumberField({ persisted: false, integer: true, initial: 0, min: 0 }),
      value: new ryuutama.data.fields.AbilityScoreField(),
    };
  }

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
}
