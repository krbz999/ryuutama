import PhysicalData from "./templates/physical.mjs";

const { NumberField, SchemaField } = foundry.data.fields;

export default class ArmorData extends PhysicalData {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      armor: new SchemaField({
        defense: new NumberField({ nullable: true, integer: true, initial: null }),
        penalty: new NumberField({ nullable: true, integer: true, initial: null }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.ARMOR",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    if (this.modifiers.has("highQuality")) this.armor.defense++;
    if (this.modifiers.has("plusOne")) this.armor.defense++;
    if (this.modifiers.has("mythril") && (this.armor.penalty > 0)) this.armor.penalty--;
  }
}
