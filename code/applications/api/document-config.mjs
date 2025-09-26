const { HandlebarsApplicationMixin, DocumentSheet } = foundry.applications.api;

export default class DocumentConfig extends HandlebarsApplicationMixin(DocumentSheet) {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
    position: {
      width: 420,
      height: "auto",
    },
    sheetConfig: false,
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    return {
      ...await super._prepareContext(options),
      document: this.document,
      source: this.document._source,
      fields: this.document.schema.fields,
      systemFields: this.document.system.schema.fields,
    };
  }
}
