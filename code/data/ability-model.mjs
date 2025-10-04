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
   * Alias for the value.
   * @type {number}
   */
  get faces() {
    return this.value;
  }

  /* -------------------------------------------------- */

  /** @override */
  toString() {
    return `1d${this.value}`;
  }
}
