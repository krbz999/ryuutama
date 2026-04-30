import StorageData from "./templates/storage.mjs";

const { NumberField, SetField, SchemaField, StringField } = foundry.data.fields;

export default class AnimalData extends StorageData {
  /** @inheritdoc */
  static metadata = Object.freeze(foundry.utils.mergeObject(
    super.metadata,
    {
      defaultArtwork: "systems/ryuutama/assets/official/icons/items/animal.svg",
      sort: 302,
    },
    { inplace: false },
  ));

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = Object.assign(super.defineSchema(), {
      category: new SchemaField({
        value: new StringField({
          required: true,
          initial: ryuutama.CONST.ANIMAL_TYPES.PET,
          choices: ryuutama.CONST.ANIMAL_TYPES._toConfig,
        }),
      }),
      modifiers: new SetField(new StringField()),
    });

    schema.capacity.extendFields({
      riders: new NumberField({ nullable: true, integer: true, initial: null, min: 0 }),
    });

    return schema;
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
    this.#preparePrice();
    this.#prepareCategory();
    this.#prepareModifierLabels();
  }

  /* -------------------------------------------------- */

  /**
   * Prepare the total price derived from modifiers.
   */
  #preparePrice() {
    const p = this.price;
    p.bonus = 0;
    p.multiplier = 1;

    for (const mod of this.modifiers) {
      const config = ryuutama.config.animalModifiers[mod];
      if (!config) continue;
      const { cost, additive } = config;
      if (additive) p.bonus += cost;
      else p.multiplier *= cost;
    }

    p.multiplier = p.multiplier.toNearest(0.1);
    p.value = (p.value === null) ? null : Math.floor(p.value * p.multiplier + p.bonus);
    p.sell = Math.floor(p.value / 2);
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
    this.capacity.total = this.capacity.max;

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
    const contents = await this.contents;
    const capacity = await this.calculateCapacity();
    const pct = Math.clamp(Math.round(capacity / this.capacity.max * 100), 0, 100);

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
    const animalConfig = ryuutama.config.animalTypes[this.category.value];
    context.animal = {
      canCarry: this.capacity.canCarry,
      defaultRiding: animalConfig.ride,
      defaultCapacity: animalConfig.capacity,
      capacity: { pct, value: capacity, max: this.capacity.max },
      contents: contents.map(item => ({ document: item })),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareTooltipContext(context, options = {}) {
    await super._prepareTooltipContext(context, options);

    context.typeTag = this.category.label;

    const cValue = await this.calculateCapacity();
    const formula = `${cValue} / ${this.capacity.total}`;

    const section = {
      tags: [
        this.capacity.canCarry ? { label: _loc("RYUUTAMA.TOOLTIP.capacity", { formula }) } : null,
        this.capacity.riders ? { label: _loc("RYUUTAMA.TOOLTIP.riders", { formula: this.capacity.riders }) } : null,
      ].filter(_ => _),
    };
    if (section.tags.length) context.tagSections.push(section);
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareDeleteDialogOptions(options = {}, operation = {}) {
    const dialogOptions = await super._prepareDeleteDialogOptions(options, operation) ?? {};
    const contents = await this.contents;
    if (!contents.length) return dialogOptions;

    return foundry.utils.mergeObject(dialogOptions, {
      yes: {
        callback: async (event, button, dialog) => {
          const deleteContents = button.form.elements["deleteContents"].checked;
          return this.parent.delete({ ...operation, deleteContents });
        },
      },
      render: (event, dialog) => {
        const { createFormGroup, createCheckboxInput } = foundry.applications.fields;
        dialog.element.querySelector(".dialog-content").insertAdjacentElement("beforeend", createFormGroup({
          label: _loc("RYUUTAMA.ITEM.ANIMAL.deleteDialogLabel"),
          hint: _loc("RYUUTAMA.ITEM.ANIMAL.deleteDialogHint", { items: contents.length, name: this.parent.name }),
          input: createCheckboxInput({ value: true, name: "deleteContents" }),
          rootId: dialog.id,
        }));
      },
    });
  }
}
