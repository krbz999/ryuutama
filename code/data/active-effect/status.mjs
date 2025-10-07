const { BooleanField, NumberField, SchemaField } = foundry.data.fields;

export default class StatusData extends foundry.abstract.TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      strength: new SchemaField({
        bypass: new BooleanField(),
        value: new NumberField({ integer: true, nullable: false, min: 2, initial: 2, max: 20 }),
      }),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.STATUS",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.parent.name = `${this.parent.name}: ${this.strength.value}`;
  }
}
