const { HandlebarsApplicationMixin, DocumentSheet } = foundry.applications.api;

export default class RyuutamaItemSheet extends HandlebarsApplicationMixin(DocumentSheet) {
  /** @override */
  static DEFAULT_OPTIONS = {
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  static PARTS = {
    details: {
      template: "systems/ryuutama/templates/sheets/item-sheet/details.hbs",
      classes: ["scrollable", "standard-form"],
      scrollable: [""],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    return Object.assign(context, {
      document: this.document,
      systemFields: this.document.system.schema.fields,
      source: this.document._source,
      enriched: await foundry.applications.ux.TextEditor.implementation.enrichHTML(
        this.document.system.description.value,
        { rollData: this.document.getRollData(), relativeTo: this.document },
      ),
    });
  }
}
