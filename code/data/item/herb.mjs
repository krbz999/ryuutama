import BaseData from "./templates/base.mjs";

const { HTMLField, NumberField, SchemaField, StringField } = foundry.data.fields;

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
}
