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
