import BaseData from "./base.mjs";

const { NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

export default class PhysicalData extends BaseData {
  /** @override */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
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
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.PHYSICAL",
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
    this.#prepareSize();
    this.#prepareDurability();

    // An item is broken if it has no durability remaining. This property is required for the price calculation.
    if (!this.durability.value) this.modifiers.add("broken");
    this.#preparePrice();
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the size category.
   */
  #prepareSize() {
    this.size.total = this.size.value;
    if (this.modifiers.has("mythril")) this.size.total = Math.max(1, this.size.total - 2);
  }

  /* -------------------------------------------------- */

  /**
   * Prepare durability data.
   */
  #prepareDurability() {
    const max = this.modifiers.has("mythril") ? 5 : this.size.total;
    let multiplier = 1;

    if (this.modifiers.has("sturdy")) multiplier = 2;
    if (this.modifiers.has("used")) multiplier *= ryuutama.config.itemModifiers.used.cost;

    this.durability.max = Math.max(1, Math.floor(max * multiplier));
    this.durability.multiplier = multiplier;

    this.durability.spent = Math.min(this.durability.max, this.durability.spent);
    this.durability.value = this.modifiers.has("orichalcum")
      ? this.durability.max
      : this.durability.max - this.durability.spent;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the gold value.
   */
  #preparePrice() {
    const p = this.price;
    p.magical = 0;
    p.multiplier = 1;
    p.total = p.value;

    for (const mod of this.modifiers) {
      const config = ryuutama.config.itemModifiers[mod];
      if (!config) continue;
      const { cost, magical } = config;
      if (magical) p.magical += cost;
      else p.multiplier *= cost;
    }

    p.total = Math.floor(p.total * p.multiplier + p.magical);
    p.sell = Math.floor(p.total / 2);
    p.saleable = (p.sell > 0) && !this.modifiers.has("broken");
  }
}
