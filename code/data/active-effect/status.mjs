import StandardData from "./standard.mjs";

const { BooleanField, NumberField, SchemaField } = foundry.data.fields;

export default class StatusData extends StandardData {
  /** @override */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      strength: new SchemaField({
        bypass: new BooleanField(),
        value: new NumberField({ integer: true, nullable: false, min: 2, initial: 2, max: 20 }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.EFFECT.STATUS",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.parent.name = `${this.parent.name}: ${this.strength.value}`;
  }
}
