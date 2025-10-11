const { HTMLField, NumberField, SchemaField, StringField } = foundry.data.fields;

export default class SpellData extends foundry.abstract.TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      category: new SchemaField({
        value: new StringField({
          required: true, initial: "incantation",
          choices: () => ryuutama.config.spellCategories,
        }),
      }),
      description: new SchemaField({
        value: new HTMLField(),
      }),
      spell: new SchemaField({
        activation: new SchemaField({
          cast: new StringField({ required: true, initial: "normal", choices: () => ryuutama.config.spellActivationTypes }),
          mental: new NumberField({ initial: null, nullable: true, integer: true, min: 0 }),
        }),
        duration: new SchemaField({
          // TODO: allow for dice (eg 'd4 rounds')
          value: new NumberField({ initial: 1, nullable: false, integer: true, min: 1 }),
          type: new StringField({ required: true, initial: "instant", choices: () => ryuutama.config.spellDurationTypes }),
          custom: new StringField({ required: true }),
        }),
        effects: new SchemaField({}),
        level: new StringField({ required: true, initial: "low", choices: () => ryuutama.config.spellLevels }),
        range: new SchemaField({
          value: new StringField({ required: true, initial: "touch", choices: () => ryuutama.config.spellRangeTypes }),
        }),
        target: new SchemaField({
          custom: new StringField({ required: true }),
        }),
      }),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.ITEM.SPELL",
  ];

  static migrateData(source) {
    if (source.category?.value === "seasonal") {
      source.category.value = source.category.season;
      delete source.category.season;
    }
    return super.migrateData(source);
  }
}
