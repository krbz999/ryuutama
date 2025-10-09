const { SchemaField, StringField } = foundry.data.fields;

export default class StandardData extends foundry.abstract.TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      expiration: new SchemaField({
        type: new StringField({ required: true, blank: true, choices: () => ryuutama.config.effectExpirationTypes }),
      }),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.EFFECT.STANDARD",
  ];
}
