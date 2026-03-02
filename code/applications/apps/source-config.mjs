import DocumentConfig from "../api/document-config.mjs";

export default class SourceConfig extends DocumentConfig {
  /** @override */
  static DEFAULT_OPTIONS = {
    position: {
      width: 480,
    },
    window: {
      icon: "fa-solid fa-book-bookmark",
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  static PARTS = {
    form: {
      template: "systems/ryuutama/templates/apps/source-config/form.hbs",
      classes: ["standard-form"],
    },
  };

  /* -------------------------------------------------- */

  /** @override */
  get title() {
    return _loc("RYUUTAMA.SOURCE.title", { name: this.document.name });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.isItem = this.document.documentName === "Item";
    context.identifierPlaceholder = ryuutama.utils.createDefaultIdentifier(this.document._source.name);
    context.compendiumSource = await fromUuid(this.document._stats.compendiumSource);
    if (!context.compendiumSource?.uuid.startsWith("Compendium.")) delete context.compendiumSource;
    else context.compendiumSource = context.compendiumSource.toAnchor().outerHTML;
    context.bookOptions = Object.entries(ryuutama.config.sources).map(([k, v]) => ({ value: k, label: v }));
    return context;
  }
}
