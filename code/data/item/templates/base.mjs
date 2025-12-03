const { HTMLField, SchemaField } = foundry.data.fields;

/**
 * Base class that all other item data models inherit from.
 */
export default class BaseData extends foundry.abstract.TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      description: new SchemaField(this.HTMLFields),
      identifier: new ryuutama.data.fields.IdentifierField(),
      source: new ryuutama.data.fields.SourceField(),
    };
  }

  /* -------------------------------------------------- */

  /** @override */
  static LOCALIZATION_PREFIXES = [
    "RYUUTAMA.ITEM",
    "RYUUTAMA.SOURCE",
  ];

  /* -------------------------------------------------- */

  /**
   * The handlebars template used for rendering a subtype's Details tab.
   * @type {string}
   */
  static DETAILS_TEMPLATE;

  /* -------------------------------------------------- */

  /**
   * Define the HTML fields within `description`.
   * @type {object}
   */
  static get HTMLFields() {
    return {
      value: new HTMLField(),
    };
  }

  /* -------------------------------------------------- */

  /**
   * The properties applied to the DamageRoll when this item is used.
   * @returns {Set<string>}
   */
  getDamageOptions() {
    return new Set();
  }

  /* -------------------------------------------------- */

  /**
   * Create data for an enriched tooltip.
   * @returns {Promise<HTMLElement[]>}
   */
  async richTooltip() {
    const enriched = await CONFIG.ux.TextEditor.enrichHTML(this.description.value, {
      rollData: this.parent.getRollData(), relativeTo: this.parent,
    });
    const context = {
      item: this.parent,
      enriched,
    };
    const htmlString = await foundry.applications.handlebars.renderTemplate(
      "systems/ryuutama/templates/ui/items/tooltip.hbs",
      context,
    );

    const div = document.createElement("DIV");
    div.innerHTML = htmlString;
    return div.children;
  }

  /* -------------------------------------------------- */

  /** @override */
  async toEmbed(config, options = {}) {
    const enriched = await CONFIG.ux.TextEditor.enrichHTML(this.description.value, {
      ...options,
      relativeTo: this.parent,
    });
    return foundry.utils.parseHTML(enriched);
  }

  /* -------------------------------------------------- */

  /**
   * Retrieve the options to apply to a Roll instance
   * when performing a specific kind of check or other roll.
   * @param {string} type   The type of check or roll.
   * @returns {Set<string>}
   */
  getRollOptions(type) {
    return new Set();
  }

  /* -------------------------------------------------- */

  /**
   * Adjust sheet rendering context for subtype specific data.
   * @param {RyuutamaDocumentSheet} sheet
   * @param {object} context
   * @param {object} options
   * @returns {Promise<void>}
   */
  async _prepareSubtypeContext(sheet, context, options) {}
}
