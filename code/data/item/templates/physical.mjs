const { HTMLField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

export default class PhysicalData extends foundry.abstract.TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      description: new SchemaField({
        value: new HTMLField(),
      }),
      durability: new SchemaField({
        spent: new NumberField({ nullable: false, initial: 0, integer: true, min: 0 }),
      }),
      modifiers: new SetField(new StringField()),
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
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    this.size.total = this.size.value;
    if (this.modifiers.has("mythril")) {
      this.size.total = Math.max(1, this.size.total - 2);
      this.durability.max = 5;
    } else {
      this.durability.max = this.size.total;
    }

    if (this.modifiers.has("sturdy")) this.durability.max *= 2;

    this.durability.spent = Math.min(this.durability.max, this.durability.spent);
    this.durability.value = this.modifiers.has("orichalcum")
      ? this.durability.max
      : this.durability.max - this.durability.spent;

    if (!this.durability.value) this.modifiers.add("broken");
    if (this.durability.spent > 0) this.modifiers.add("used");

    this.price.magical = 0;
    this.price.total = this.price.value;
    for (const mod of this.modifiers) {
      const config = ryuutama.config.itemModifiers[mod];
      if (!config) continue;
      const { cost, magical } = config;
      if (magical) this.price.magical += cost;
      else this.price.total *= cost;
    }
    this.price.total = Math.floor(this.price.total + this.price.magical);

    // Selling price.
    this.price.sell = Math.floor(this.price.total / 2);
    this.price.saleable = !this.modifiers.has("broken");
  }
}
