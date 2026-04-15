const { SchemaField, StringField } = foundry.data.fields;

/**
 * Base combatant model.
 */
export default class StandardData extends foundry.abstract.TypeDataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      initiative: new SchemaField({
        value: new StringField({ required: true }),
      }),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    "RYUUTAMA.COMBATANT.STANDARD",
  ];
}
