/**
 * @import { DatabaseDeleteOperation } from "@common/abstract/_types.mjs";
 */

/**
 * @typedef ItemSubtypeMetadata
 * @property {boolean} [inventory]        Unless explicitly `false`, this item type appears in inventories.
 * @property {number} [sort]              The order in which this item type appears as a section on actor sheets.
 * @property {string} [defaultArtwork]    The default image used for an item of this type.
 * @property {number} [createSort]        The order in which this item type appears in the Create Dialog,
 *                                        relative to its group.
 * @property {string} [itemGroup]         An item group this subtype belongs to.
 * @property {string} [createGroup]       Label of the group this subtype belongs to.
 */

const { HTMLField, SchemaField } = foundry.data.fields;

/**
 * Base class that all other item data models inherit from.
 */
export default class BaseData extends foundry.abstract.TypeDataModel {
  /**
   * Subtype specific metadata.
   * @type {ItemSubtypeMetadata}
   */
  static metadata = Object.freeze({
    inventory: true,
  });

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return {
      description: new SchemaField({
        value: new HTMLField(),
      }),
      identifier: new ryuutama.data.fields.IdentifierField(),
      source: new ryuutama.data.fields.SourceField(),
    };
  }

  /* -------------------------------------------------- */

  /**
   * Retrieve default artwork for an item of this type.
   * @param {object} itemData
   * @returns {string|void}
   */
  static getDefaultArtwork(itemData) {}

  /* -------------------------------------------------- */

  /** @inheritdoc */
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

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    if ((await super._preCreate(data, options, user)) === false) return false;

    if (!this.identifier) {
      this.parent.updateSource({ "system.identifier": ryuutama.utils.createDefaultIdentifier(this.parent.name) });
    }
  }

  /* -------------------------------------------------- */

  /**
   * Create data for an enriched tooltip.
   * @returns {Promise<HTMLElement[]>}
   */
  async richTooltip() {
    const rollData = this.parent.getRollData();
    const enriched = await CONFIG.ux.TextEditor.enrichHTML(this.description.value, { rollData, relativeTo: this.parent });

    const context = {
      item: this.parent,
      enriched,
      rollData,
      tagSections: [],
      typeTag: _loc(`TYPES.Item.${this.parent.type}`),
    };

    this._prepareTooltipContext(context);

    const htmlString = await foundry.applications.handlebars.renderTemplate(
      "systems/ryuutama/templates/ui/items/tooltip.hbs",
      context,
    );

    const div = document.createElement("DIV");
    div.innerHTML = htmlString;
    return div.children;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare subtype specific context for tooltips.
   * @param {object} context
   * @param {object} [options]
   */
  _prepareTooltipContext(context, options = {}) {
    if (this.modifierLabels?.length) {
      context.tagSections.push({
        tags: this.modifierLabels.map(label => ({ label })),
      });
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async toEmbed(config, options = {}) {
    const section = document.createElement("SECTION");
    const enriched = await CONFIG.ux.TextEditor.enrichHTML(this.description.value, {
      ...options,
      relativeTo: this.parent,
    });
    if (enriched) section.insertAdjacentHTML("beforeend", `<section class="item-description">${enriched}</section>`);
    return section.children;
  }

  /* -------------------------------------------------- */

  /**
   * Return a data object which defines the data schema against which dice rolls can be evaluated.
   * @returns {object}
   */
  getRollData() {
    const rollData = { ...this };
    return rollData;
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

  /* -------------------------------------------------- */

  /**
   * Prepare dialog options for a deletion dialog for an item of this type.
   * @param {object} [options]                      Additional options passed to `DialogV2.confirm`
   * @param {DatabaseDeleteOperation} [operation]   Document deletion options.
   * @returns {Promise<object|void>}
   */
  async _prepareDeleteDialogOptions(options = {}, operation = {}) {}
}
