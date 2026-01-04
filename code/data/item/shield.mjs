import PhysicalData from "./templates/physical.mjs";

const { NumberField, SchemaField } = foundry.data.fields;

/**
 * @typedef ShieldData
 * @property {object} armor
 * @property {number|null} armor.defense
 * @property {number|null} armor.dodge
 * @property {number|null} armor.penalty
 * @property {object} description
 * @property {string} description.value
 * @property {object} durability
 * @property {number} durability.spent
 * @property {string} identifier
 * @property {string[]} modifiers
 * @property {object} price
 * @property {number} price.value
 * @property {object} size
 * @property {object} size.value
 * @property {object} source
 * @property {string} source.book
 * @property {string} source.custom
 */

export default class ShieldData extends PhysicalData {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      armor: new SchemaField({
        defense: new NumberField({ nullable: true, integer: true, initial: null }),
        dodge: new NumberField({ nullable: true, integer: true, initial: null }),
        penalty: new NumberField({ nullable: true, integer: true, initial: null }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.SHIELD",
  ];

  /* -------------------------------------------------- */

  /** @override */
  static DETAILS_TEMPLATE = "systems/ryuutama/templates/sheets/item-sheet/shield.hbs";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    let bonus = 0;
    if (this.modifiers.has("highQuality")) bonus++;
    if (this.modifiers.has("plusOne")) bonus++;
    this.armor.defense = this._source.armor.defense + bonus;
    this.armor.dodge = this._source.armor.dodge + bonus;
    if (this.modifiers.has("mythril") && (this.armor.penalty > 0)) this.armor.penalty = this._source.armor.penalty - 1;
  }
}
