const { HTMLField, NumberField, SchemaField } = foundry.data.fields;

export default class ContainerData extends foundry.abstract.TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      capacity: new SchemaField({
        max: new NumberField({ nullable: true, initial: null, integer: true, min: 0 }),
      }),
      description: new SchemaField({
        value: new HTMLField(),
      }),
      price: new SchemaField({
        value: new NumberField({ nullable: false, initial: 1, min: 0, integer: true }),
      }),
      size: new SchemaField({
        value: new NumberField({ nullable: false, initial: 1, choices: () => ryuutama.config.itemSizes }),
      }),
    };
  }

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
}
