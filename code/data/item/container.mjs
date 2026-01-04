import BaseData from "./templates/base.mjs";

const { NumberField, SchemaField } = foundry.data.fields;

/**
 * @typedef ContainerData
 * @property {object} capacity
 * @property {number|null} capacity.max
 * @property {object} description
 * @property {string} description.value
 * @property {string} identifier
 * @property {object} price
 * @property {number} price.value
 * @property {object} size
 * @property {number} size.value
 * @property {object} source
 * @property {string} source.book
 * @property {string} source.custom
 */

export default class ContainerData extends BaseData {
  /** @override */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      capacity: new SchemaField({
        max: new NumberField({ nullable: true, initial: null, integer: true, min: 0 }),
      }),
      price: new SchemaField({
        value: new NumberField({ nullable: false, initial: 1, min: 0, integer: true }),
      }),
      size: new SchemaField({
        value: new NumberField({ nullable: false, initial: 1, choices: () => ryuutama.config.itemSizes }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @override */
  static DETAILS_TEMPLATE = "systems/ryuutama/templates/sheets/item-sheet/container.hbs";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.PHYSICAL",
    "RYUUTAMA.ITEM.CONTAINER",
  ];

  /* -------------------------------------------------- */

  /**
   * The amount this adds to the capacity.
   * @type {number}
   */
  get weight() {
    return this.size.total;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.size.total = this.size.value;
  }

  /* -------------------------------------------------- */

  /** @override */
  async _prepareSubtypeContext(sheet, context, options) {}
}
