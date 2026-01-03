const { SchemaField, StringField } = foundry.data.fields;

export default class SourceField extends SchemaField {
  constructor(fields, options = {}) {
    fields = {
      book: new StringField({ required: true }),
      custom: new StringField({ required: true }),
    };
    super(fields, options);
  }

  /* -------------------------------------------------- */

  /**
   * Format the source label from a source configuration.
   * @param {object} [config={}]
   * @param {string} [config.book]
   * @param {string} [config.custom]
   * @returns {string|null}
   */
  static getSourceLabel({ book, custom } = {}) {
    if (custom) return custom;
    if (book) return book;
    return null;
  }
}
