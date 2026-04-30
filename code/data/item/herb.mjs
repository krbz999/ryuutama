import BaseData from "./templates/base.mjs";

const { HTMLField, NumberField, SchemaField, StringField } = foundry.data.fields;

export default class HerbData extends BaseData {
  /** @inheritdoc */
  static metadata = Object.freeze(foundry.utils.mergeObject(
    super.metadata,
    {
      defaultArtwork: "systems/ryuutama/assets/icons/items/herb.svg",
      inventory: true,
      sort: 301,
    },
    { inplace: false },
  ));

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const schema = Object.assign(super.defineSchema(), {
      category: new SchemaField({
        value: new StringField({ required: true, initial: "physical", choices: ryuutama.CONST.HERB_TYPES._toConfig }),
      }),
      price: new SchemaField({
        value: new NumberField({ nullable: true, initial: null, min: 0, integer: true }),
      }),
      storage: new ryuutama.data.fields.StorageField(),
      terrain: new SchemaField({
        details: new StringField({ required: true }),
        level: new NumberField({ initial: 1, nullable: false, integer: true, min: 1, max: 5 }),
        type: new StringField({ required: true }),
      }),
    });

    schema.description.extendFields({
      effect: new HTMLField(),
    });

    return schema;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.ITEM.HERB",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static DETAILS_TEMPLATE = "systems/ryuutama/templates/sheets/item-sheet/herb.hbs";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static migrateData(source, options, _state) {
    if ("level" in source) {
      foundry.utils.setProperty(source, "terrain.level", source.level);
      delete source.level;
    }
    return super.migrateData(source, options, _state);
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

    const p = this.price;
    p.sell = Math.floor(p.value / 2);
    p.saleable = p.sell > 0;

    this.terrain.label = this.#prepareTerrainLabel();
    this.category.label = ryuutama.config.herbTypes[this.category.value].label;
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

    const levelLabel = _loc(`RYUUTAMA.ITEM.HERB.terrainLevel${level}`);
    return details ? `${levelLabel} (${details})` : levelLabel;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareSubtypeContext(sheet, context, options) {
    context.enriched.effect = await CONFIG.ux.TextEditor.enrichHTML(
      this.description.effect,
      { rollData: this.parent.getRollData(), relativeTo: this.parent },
    );

    const herbLevelOptions = Array.fromRange(5, 1).map(n => {
      return { value: n, label: _loc(`RYUUTAMA.ITEM.HERB.terrainLevel${n}`) };
    });
    const herbTypes = [{ value: "", label: _loc("RYUUTAMA.ITEM.HERB.anyTerrain") }];
    for (const k in ryuutama.config.terrainTypes) {
      const { label, level } = ryuutama.config.terrainTypes[k];
      if (level === this.terrain.level) herbTypes.push({
        label,
        value: k,
        group: _loc("RYUUTAMA.ITEM.HERB.specificTerrain"),
      });
    }
    context.herbTypes = herbTypes;
    context.herbLevelOptions = herbLevelOptions;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareTooltipContext(context, options = {}) {
    await super._prepareTooltipContext(context, options);

    context.tagSections.push({
      tags: [
        { label: _loc("RYUUTAMA.TOOLTIP.terrain", { label: this.terrain.label }) },
      ],
    });

    context.typeTag = `${_loc("TYPES.Item.herb")} (${this.category.label})`;
  }
}
