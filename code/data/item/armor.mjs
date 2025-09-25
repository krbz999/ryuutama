import BaseData from "./base.mjs";

const { NumberField, SchemaField, StringField } = foundry.data.fields;

export default class ArmorData extends BaseData {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      armor: new SchemaField({
        defense: new NumberField({ nullable: true, integer: true, initial: null }),
        penalty: new NumberField({ nullable: true, integer: true, initial: null }),
      }),
      category: new SchemaField({
        value: new StringField({ required: true, blank: false, choices: () => ryuutama.config.armorCategories }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    const config = ryuutama.config.armorCategories[this.category.value];
    for (const k of ["defense", "penalty"]) this.armor[k] ??= config[k];

    if (this.modifiers.has("highQuality")) this.armor.defense++;
    if (this.modifiers.has("plusOne")) this.armor.defense++;
    if (this.modifiers.has("mythril") && (this.armor.penalty > 0)) this.armor.penalty--;
  }
}
