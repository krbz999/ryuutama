import StorageData from "./templates/storage.mjs";

/**
 * @import RyuutamaItem from "../../documents/item.mjs";
 */

const { NumberField, SchemaField, SetField, StringField, TypedObjectField, TypedSchemaField } = foundry.data.fields;

export default class ContainerData extends StorageData {
  /** @inheritdoc */
  static metadata = Object.freeze(foundry.utils.mergeObject(
    super.metadata,
    {
      sort: 303,
      defaultArtwork: "systems/ryuutama/assets/official/icons/items/container.svg",
    },
    { inplace: false },
  ));

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = Object.assign(super.defineSchema(), {
      properties: new SetField(new StringField({ choices: ryuutama.CONST.CONTAINER_PROPERTIES._toConfig })),
      rations: new TypedObjectField(
        new TypedSchemaField(rationTypes()),
        { validateKey: key => foundry.data.validators.isValidId(key) },
      ),
      size: new SchemaField({
        value: new NumberField({ nullable: false, initial: 1, choices: ryuutama.CONST.ITEM_SIZES._toConfig }),
      }),
    });

    schema.capacity.extendFields({
      water: new NumberField({ nullable: true, initial: null, integer: true, min: 0 }),
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static DETAILS_TEMPLATE = "systems/ryuutama/templates/sheets/item-sheet/container.hbs";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.PHYSICAL",
    "RYUUTAMA.ITEM.CONTAINER",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async calculateCapacity() {
    const total = await super.calculateCapacity();
    return total + this.capacity.rations;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.capacity.rations = 0;

    const isWaterContainer = this.properties.has("waterContainer");

    Object.defineProperties(this.rations, Object.values(ryuutama.CONST.RATION_TYPES).reduce((acc, k) => {
      acc[k] = {
        value: [],
        enumerable: false,
        writeable: false,
      };
      return acc;
    }, {}));

    for (const [id, r] of Object.entries(this.rations)) {
      Object.defineProperty(r, "id", { value: id, enumerable: true });
      Object.defineProperty(r, "label", {
        enumerable: true,
        get() {
          const { label, allowModifiers } = ryuutama.config.rationTypes[this.type];
          const m = ryuutama.config.rationModifiers[this.modifier];
          if (allowModifiers && m.prefix)
            return _loc("RYUUTAMA.RATIONS.rationLabel", { type: label, prefix: m.label });
          return label;
        },
      });

      const display = isWaterContainer
        ? r.type === ryuutama.CONST.RATION_TYPES.WATER
        : r.type !== ryuutama.CONST.RATION_TYPES.WATER;
      if (display) {
        this.rations[r.type].push(r);
        this.capacity.rations++;
      }
    }

    const m = {
      regular: 0,
      delicious: 1,
      disgusting: 2,
    };
    for (const type of Object.values(ryuutama.CONST.RATION_TYPES)) {
      this.rations[type].sort((a, b) => {
        a = m[a.modifier ?? "regular"];
        b = m[b.modifier ?? "regular"];
        return a - b;
      });
    }

    this.capacity.total = isWaterContainer ? this.capacity.water : this.capacity.max;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareSubtypeContext(sheet, context, options) {
    const contents = await this.contents;
    const capacity = await this.calculateCapacity();
    const pct = this.capacity.total === null
      ? null
      : Math.clamp(Math.round(capacity / this.capacity.total * 100), 0, 100);

    const ctx = context.container = {
      capacity: { pct, value: capacity, max: this.capacity.total },
      contents: contents.map(item => ({ document: item })),
      rations: {},
    };

    Object.values(ryuutama.CONST.RATION_TYPES).forEach(type => {
      const entries = sheet.document.system.rations[type];
      ctx.rations[type] = {
        entries,
        display: this.properties.has("waterContainer")
          ? (type === ryuutama.CONST.RATION_TYPES.WATER)
          : (type !== ryuutama.CONST.RATION_TYPES.WATER),
        label: ryuutama.config.rationTypes[type].label,
        disableDown: !entries.length || !context.editable,
        disableUp: !context.editable || (pct === 100),
      };
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareTooltipContext(context, options = {}) {
    await super._prepareTooltipContext(context, options);

    const cValue = await this.calculateCapacity();

    const isWaterContainer = this.properties.has("waterContainer");
    const formula = `${cValue} / ${this.capacity.total}`;
    context.tagSections.push({
      tags: [
        { label: _loc(isWaterContainer ? "RYUUTAMA.TOOLTIP.waterCapacity" : "RYUUTAMA.TOOLTIP.capacity", { formula }) },
      ],
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareDeleteDialogOptions(options = {}, operation = {}) {
    const dialogOptions = await super._prepareDeleteDialogOptions(options, operation) ?? {};
    const contents = await this.contents;
    const rations = Object.values(ryuutama.CONST.RATION_TYPES).reduce((acc, type) => acc + this.rations[type].length, 0);
    if (!contents.length && !rations) return dialogOptions;

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
          label: _loc("RYUUTAMA.ITEM.CONTAINER.deleteDialogLabel"),
          hint: _loc("RYUUTAMA.ITEM.CONTAINER.deleteDialogHint", { items: contents.length, rations }),
          input: createCheckboxInput({ value: true, name: "deleteContents" }),
          rootId: dialog.id,
        }));
      },
    });
  }

  /* -------------------------------------------------- */

  /**
   * Add new rations.
   * @param {number} [quantity=1]   Number of rations of the type to add.
   * @param {object} rationData
   * @returns {Promise<RyuutamaItem>}
   */
  async addRations(quantity = 1, { type = "ration", ...rationData } = {}) {
    const rations = {};
    for (let i = 0; i < quantity; i++) {
      const id = foundry.utils.randomID();
      rations[id] = { type, ...rationData };
    }
    await this.parent.update({ "system.rations": rations });
    return this.parent;
  }

  /* -------------------------------------------------- */

  /**
   * Remove a specific ration.
   * @param {string} id   The id of the ration to remove.
   * @returns {Promise<RyuutamaItem>}
   */
  async removeRation(id) {
    if (!(id in this.rations)) throw new Error(`No ration with id '${id}' exists on this container.`);
    await this.parent.update({ [`system.rations.${id}`]: _del });
    return this.parent;
  }

  /* -------------------------------------------------- */

  /**
   * Remove a number of rations of a given type, starting with
   * regular quality, then delicious, then disgusting.
   * @param {number} [quantity=1]
   * @param {string} [type="ration"]
   */
  async removeRations(quantity = 1, type = "ration") {
    // Rations are sorted during data prep, so we can simply slice from the start.
    const ids = this.rations[type].slice(0, quantity).map(r => r.id);
    if (ids.length < quantity) {
      throw new Error(`Container does not have ${quantity} rations of type '${type}' to remove (${ids.length}).`);
    }
    const update = {};
    ids.forEach(id => update[`system.rations.${id}`] = _del);
    await this.parent.update(update);
    return this.parent;
  }

  /* -------------------------------------------------- */

  /**
   * Adjust a modifier.
   * @param {string} id   The id of the ration to adjust.
   * @param {-1|1} [modifier=1]
   */
  async adjustRationModifier(id, direction = 1) {
    if (!(id in this.rations)) throw new Error(`No ration with id '${id}' exists on this container.`);
    const ration = this.rations[id];
    if (!ryuutama.config.rationTypes[ration.type].allowModifiers) {
      throw new Error(`A ration of type '${ration.type}' does not allow for modifiers.`);
    }

    const modifiers = Object.values(ryuutama.CONST.RATION_MODIIFERS);
    if (direction === -1) modifiers.reverse();

    const modifier = modifiers[modifiers.indexOf(ration.modifier) + 1];
    if (!modifier) {
      throw new Error(`A ration cannot be adjusted further beyond '${ration.modifier}'.`);
    }

    await this.parent.update({ [`system.rations.${id}.modifier`]: modifier });
    return this.parent;
  }
}

/* -------------------------------------------------- */

/**
 * Helper method to set up the ration schemas.
 * @returns {Record<string, object>}
 */
function rationTypes() {
  const rationTypes = {};

  Object.values(ryuutama.CONST.RATION_TYPES).forEach(type => {
    const d = rationTypes[type] = {};
    d.type = new StringField({
      required: true,
      blank: false,
      initial: type,
      validate: value => value === type,
      validationError: `can only be '${type}'`,
    });

    if (ryuutama.config.rationTypes[type].allowModifiers) {
      d.modifier = new StringField({
        required: true,
        blank: false,
        initial: ryuutama.CONST.RATION_MODIIFERS.NORMAL,
        choices: ryuutama.CONST.RATION_MODIIFERS._toConfig,
      });
    }
  });

  return rationTypes;
}
