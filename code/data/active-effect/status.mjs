const { NumberField, SchemaField } = foundry.data.fields;

export default class StatusData extends foundry.abstract.TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      strength: new SchemaField({
        value: new NumberField({ integer: true, nullable: false, min: 1, initial: 1 }),
      }),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.parent.name = `${this.parent.name}: ${this.strength.value}`;
  }
}
