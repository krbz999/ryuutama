import BaseData from "./templates/base.mjs";

const { NumberField, SetField, SchemaField, StringField } = foundry.data.fields;

export default class AnimalData extends BaseData {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      capacity: new SchemaField({
        max: new NumberField({ nullable: true, integer: true, initial: null, min: 0 }),
        riders: new NumberField({ nullable: true, integer: true, initial: null, min: 0 }),
      }),
      category: new SchemaField({
        value: new StringField({ required: true, initial: "pet", choices: () => ryuutama.config.animalTypes }),
      }),
      modifiers: new SetField(new StringField()),
      price: new SchemaField({
        value: new NumberField({ nullable: true, integer: true, initial: null, min: 0 }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.ITEM.ANIMAL",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    this.#preparePrice();
    this.#prepareCategory();
    this.#prepareModifierLabels();
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the total price derived from modifiers.
   */
  #preparePrice() {
    const base = ryuutama.config.animalTypes[this.category.value].price;

    const p = this.price;
    p.bonus = 0;
    p.multiplier = 1;
    p.total = p.value ?? base;

    for (const mod of this.modifiers) {
      const config = ryuutama.config.animalModifiers[mod];
      if (!config) continue;
      const { cost, additive } = config;
      if (additive) p.bonus += cost;
      else p.multiplier *= cost;
    }

    p.total = Math.floor(p.total * p.multiplier + p.bonus);
    p.sell = Math.floor(p.total / 2);
    p.saleable = p.sell > 0;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare animal properties.
   */
  #prepareCategory() {
    const config = ryuutama.config.animalTypes[this.category.value];
    this.capacity.canRide = !!config.ride;
    this.capacity.canCarry = !!config.capacity;

    this.capacity.riders = this.capacity.canRide ? (this.capacity.riders ?? config.ride) : null;
    this.capacity.max = this.capacity.canCarry ? (this.capacity.max ?? config.capacity) : null;
  }

  /* -------------------------------------------------- */

  /**
   * Prepare labels for modifiers.
   */
  #prepareModifierLabels() {
    this.modifierLabels = [];
    for (const mod of this.modifiers) {
      const label = ryuutama.config.animalModifiers[mod]?.label;
      if (label) this.modifierLabels.push(label);
    }
    this.modifierLabels.sort((a, b) => a.localeCompare(b));
  }
}
