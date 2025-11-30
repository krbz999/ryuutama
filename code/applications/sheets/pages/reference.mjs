export default class ReferencePageSheet extends foundry.applications.sheets.journal.JournalEntryPageProseMirrorSheet {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["reference"],
    window: {
      icon: "fa-solid fa-magnifying-glass",
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  static EDIT_PARTS = {
    header: {
      template: "templates/journal/parts/page-header.hbs",
    },
    content: {
      template: "systems/ryuutama/templates/sheets/pages/reference/content.hbs",
    },
    footer: {
      template: "templates/journal/parts/page-footer.hbs",
      classes: ["journal-footer", "flexrow"],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContentContext(context, options) {
    await super._prepareContentContext(context, options);

    if (!this.isView) {
      context.fields = context.document.schema.fields;
      context.systemFields = context.document.system.schema.fields;
    }
  }
}
