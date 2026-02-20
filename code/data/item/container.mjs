import BaseData from "./templates/base.mjs";

/**
 * @import RyuutamaItem from "../../documents/item.mjs";
 */

const { NumberField, SchemaField, StringField, TypedObjectField, TypedSchemaField } = foundry.data.fields;

/**
 * @typedef ContainerData
 * @property {object} capacity
 * @property {number|null} capacity.max
 * @property {object} description
 * @property {string} description.value
 * @property {string} identifier
 * @property {object} price
 * @property {number} price.value
 * @property {object} size
 * @property {number} size.value
 * @property {object} source
 * @property {string} source.book
 * @property {string} source.custom
 */

export default class ContainerData extends BaseData {
  /** @inheritdoc */
  static metadata = Object.freeze(foundry.utils.mergeObject(
    super.metadata,
    { sort: 303 },
    { inplace: false },
  ));

  /* -------------------------------------------------- */

  /** @override */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      capacity: new SchemaField({
        max: new NumberField({ nullable: true, initial: null, integer: true, min: 0 }),
      }),
      price: new SchemaField({
        value: new NumberField({ nullable: false, initial: 1, min: 0, integer: true }),
      }),
      rations: new TypedObjectField(
        new TypedSchemaField(rationTypes()),
        { validateKey: key => foundry.data.validators.isValidId(key) },
      ),
      size: new SchemaField({
        value: new NumberField({ nullable: false, initial: 1, choices: () => ryuutama.config.itemSizes }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @override */
  static DETAILS_TEMPLATE = "systems/ryuutama/templates/sheets/item-sheet/container.hbs";

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
    return this.size.total + Object.keys(this.rations).length;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.size.total = this.size.value;

    Object.defineProperties(this.rations, Object.keys(ryuutama.config.rationTypes).reduce((acc, k) => {
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
            return game.i18n.format("RYUUTAMA.RATIONS.rationLabel", { type: label, prefix: m.label });
          return label;
        },
      });
      this.rations[r.type].push(r);
    }

    const m = {
      regular: 0,
      delicious: 1,
      disgusting: 2,
    };
    for (const type of Object.keys(ryuutama.config.rationTypes)) {
      this.rations[type].sort((a, b) => {
        a = m[a.modifier ?? "regular"];
        b = m[b.modifier ?? "regular"];
        return a - b;
      });
    }
  }

  /* -------------------------------------------------- */

  /** @override */
  async _prepareSubtypeContext(sheet, context, options) {
    const ctx = context.container = {
      rations: {},
    };
    Object.keys(ryuutama.config.rationTypes).forEach(type => {
      ctx.rations[type] = {
        entries: sheet.document.system.rations[type],
        label: ryuutama.config.rationTypes[type].label,
      };
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
    await this.parent.update({ [`system.rations.-=${id}`]: null });
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
    ids.forEach(id => update[`system.rations.-=${id}`] = null);
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

    const modifiers = Object.keys(ryuutama.config.rationModifiers);
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

  Object.entries(ryuutama.config.rationTypes).forEach(([k, v]) => {
    const d = rationTypes[k] = {};
    d.type = new StringField({
      required: true,
      blank: false,
      initial: k,
      validate: value => value === k,
      validationError: `can only be '${k}'`,
    });

    if (v.allowModifiers) {
      d.modifier = new StringField({
        required: true, blank: false, initial: "regular",
        choices: () => ryuutama.config.rationModifiers,
      });
    }
  });

  return rationTypes;
}
