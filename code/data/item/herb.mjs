import BaseData from "./templates/base.mjs";

const { HTMLField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * @typedef HerbData
 * @property {object} category
 * @property {string} category.value
 * @property {object} description
 * @property {string} description.value
 * @property {string} identifier
 * @property {object} price
 * @property {number|null} price.value
 * @property {object} source
 * @property {string} source.book
 * @property {string} source.custom
 * @property {object} terrain
 * @property {number} terrain.level
 * @property {string} terrain.type
 * @property {string} terrain.details
 */

export default class HerbData extends BaseData {
  /** @override */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      category: new SchemaField({
        value: new StringField({ required: true, initial: "physical", choices: () => ryuutama.config.herbTypes }),
      }),
      price: new SchemaField({
        value: new NumberField({ nullable: true, initial: null, min: 0, integer: true }),
      }),
      terrain: new SchemaField({
        level: new NumberField({ initial: 1, nullable: false, integer: true, min: 1, max: 5 }),
        type: new StringField({ required: true }),
        details: new StringField({ required: true }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static get HTMLFields() {
    return {
      ...super.HTMLFields,
      effect: new HTMLField(),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.ITEM.HERB",
  ];

  /* -------------------------------------------------- */

  /** @override */
  static DETAILS_TEMPLATE = "systems/ryuutama/templates/sheets/item-sheet/herb.hbs";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static migrateData(source) {
    if ("level" in source) {
      foundry.utils.setProperty(source, "terrain.level", source.level);
      delete source.level;
    }
    return super.migrateData(source);
  }

  /* -------------------------------------------------- */

  /**
   * The amount this adds to the capacity.
   * @type {number}
   */
  get weight() {
    return 1;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    if (this.price.value === null) {
      switch (this.terrain.level) {
        case 1: this.price.total = 100; break;
        case 2: this.price.total = 300; break;
        case 3: this.price.total = 800; break;
      }
    }

    this.terrain.label = this.#prepareTerrainLabel();
  }

  /* -------------------------------------------------- */

  /**
   * Prepare terrain label.
   * @returns {string}
   */
  #prepareTerrainLabel() {
    const { level, type, details } = this.terrain;

    const hasType = ryuutama.config.terrainTypes[type]?.level === level;

    if (hasType) {
      const typeLabel = ryuutama.config.terrainTypes[type].label;
      return details ? `${typeLabel} (${details})` : typeLabel;
    }

    const levelLabel = game.i18n.localize(`RYUUTAMA.ITEM.HERB.terrainLevel${level}`);
    return details ? `${levelLabel} (${details})` : levelLabel;
  }

  /* -------------------------------------------------- */

  /** @override */
  async _prepareSubtypeContext(sheet, context, options) {
    context.enriched.effect = await CONFIG.ux.TextEditor.enrichHTML(
      this.description.effect,
      { rollData: this.parent.getRollData(), relativeTo: this.parent },
    );

    const herbLevelOptions = Array.fromRange(5, 1).map(n => {
      return { value: n, label: game.i18n.localize(`RYUUTAMA.ITEM.HERB.terrainLevel${n}`) };
    });
    const herbTypes = [{ value: "", label: game.i18n.localize("RYUUTAMA.ITEM.HERB.anyTerrain") }];
    for (const k in ryuutama.config.terrainTypes) {
      const { label, level } = ryuutama.config.terrainTypes[k];
      if (level === this.terrain.level) herbTypes.push({
        label,
        value: k,
        group: game.i18n.localize("RYUUTAMA.ITEM.HERB.specificTerrain"),
      });
    }
    context.herbTypes = herbTypes;
    context.herbLevelOptions = herbLevelOptions;
  }
}
