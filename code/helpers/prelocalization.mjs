export default class Prelocalization {
  /**
   * The records to localize.
   * @type {Array<Record<*, object>, object|undefined>}
   */
  static toLocalize = [];

  /* -------------------------------------------------- */

  /**
   * Assign a record to be prelocalized.
   * @param {Record<*, object>} record
   * @param {object} [options]
   * @returns {void}
   */
  static prelocalize(record, options) {
    this.toLocalize.push([record, options]);
  }
}
