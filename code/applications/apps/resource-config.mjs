import DocumentConfig from "../api/document-config.mjs";

export default class ResourceConfig extends DocumentConfig {
  /** @override */
  static DEFAULT_OPTIONS = {
    resource: null,
  };

  /* -------------------------------------------------- */

  /** @override */
  static PARTS = {
    form: {
      template: "systems/ryuutama/templates/apps/resource-config/form.hbs",
      classes: ["standard-form"],
    },
  };

  /* -------------------------------------------------- */

  /**
   * The resource being configured.
   * @type {string}
   */
  get resource() {
    return this.options.resource;
  }

  /* -------------------------------------------------- */

  /** @override */
  get title() {
    return game.i18n.format("RYUUTAMA.RESOURCE.title", {
      resource: game.i18n.localize(`RYUUTAMA.RESOURCE.${this.resource}`),
      name: this.document.name,
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.resource = {
      source: context.source.system.resources[this.resource],
      fields: this.document.system.schema.getField(`resources.${this.resource}`).fields,
      resource: this.resource,
    };

    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _initializeApplicationOptions(options) {
    options = super._initializeApplicationOptions(options);
    options.uniqueId = `${options.uniqueId}-${options.resource}`;
    return options;
  }
}
