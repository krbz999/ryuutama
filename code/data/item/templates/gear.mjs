import PhysicalData from "./physical.mjs";

const { SchemaField, StringField } = foundry.data.fields;

export default class GearData extends PhysicalData {
  /** @override */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      gear: new SchemaField({
        custom: new StringField({ required: true }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.GEAR",
  ];

  /* -------------------------------------------------- */

  /** @override */
  static DETAILS_TEMPLATE = "systems/ryuutama/templates/sheets/item-sheet/gear.hbs";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareSubtypeContext(context, options) {
    await super._prepareSubtypeContext(context, options);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();
    this.gear.check = 1;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    if (this.modifiers.has("highQuality")) this.gear.check++;
    if (this.modifiers.has("plusOne")) this.gear.check++;
  }
}
