const { SchemaField, StringField } = foundry.data.fields;

export default class StandardData extends foundry.abstract.TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      initiative: new SchemaField({
        value: new StringField({ required: true }),
      }),
    };
  }

  /* -------------------------------------------------- */

  /** @override */
  static LOCALIZATION_PREFIXES = [
    "RYUUTAMA.COMBATANT.STANDARD",
  ];
}
