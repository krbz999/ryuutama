import BaseData from "./templates/base.mjs";

const { NumberField, SetField, SchemaField, StringField } = foundry.data.fields;

export default class AnimalData extends BaseData {
  /** @inheritdoc */
  static metadata = Object.freeze(foundry.utils.mergeObject(
    super.metadata,
    {
      sort: 302,
      defaultArtwork: "systems/ryuutama/assets/official/icons/items/animal.svg",
    },
    { inplace: false },
  ));

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      capacity: new SchemaField({
        max: new NumberField({ nullable: true, integer: true, initial: null, min: 0 }),
        riders: new NumberField({ nullable: true, integer: true, initial: null, min: 0 }),
      }),
      category: new SchemaField({
        value: new StringField({
          required: true,
          initial: ryuutama.CONST.ANIMAL_TYPES.PET,
          choices: ryuutama.CONST.ANIMAL_TYPES._toConfig,
        }),
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
  static DETAILS_TEMPLATE = "systems/ryuutama/templates/sheets/item-sheet/animal.hbs";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    this.capacity.total = this.capacity.max;

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
    p.value = p.value ?? base;

    for (const mod of this.modifiers) {
      const config = ryuutama.config.animalModifiers[mod];
      if (!config) continue;
      const { cost, additive } = config;
      if (additive) p.bonus += cost;
      else p.multiplier *= cost;
    }

    p.value = Math.floor(p.value * p.multiplier + p.bonus);
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

    this.category.label = config.label;
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

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareSubtypeContext(sheet, context, options) {
    // Prepare modifiers.
    const config = ryuutama.config.animalModifiers;
    const isEditable = sheet.isEditable && sheet.isEditMode;
    const choices = {};
    for (const [k, v] of Object.entries(config)) {
      if (v.hidden && isEditable && !this._source.modifiers.includes(k)) continue;
      if (v.hidden && !isEditable && !this.modifiers.has(k)) continue;
      choices[k] = { value: k, label: v.label };
    }

    // 'Well-Traveled' applies only to Riding Animals.
    if (![ryuutama.CONST.ANIMAL_TYPES.RIDING, ryuutama.CONST.ANIMAL_TYPES.RIDING_LARGE].includes(this.category.value))
      delete choices.wellTraveled;
    for (const k of this._source.modifiers) {
      if (!(k in choices)) choices[k] = { value: k, label: k };
    }
    context.modifiers = Object.values(choices);

    // Animal capacity details.
    const { ride, capacity } = ryuutama.config.animalTypes[this.category.value];
    context.animal = { defaultRiding: ride, defaultCapacity: capacity };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _prepareTooltipContext(context, options = {}) {
    super._prepareTooltipContext(context, options);

    context.typeTag = this.category.label;
    const section = {
      tags: [
        this.capacity.max ? { label: _loc("RYUUTAMA.TOOLTIP.capacity", { formula: this.capacity.max }) } : null,
        this.capacity.riders ? { label: _loc("RYUUTAMA.TOOLTIP.riders", { formula: this.capacity.riders }) } : null,
      ].filter(_ => _),
    };
    if (section.tags.length) context.tagSections.push(section);
  }
}
