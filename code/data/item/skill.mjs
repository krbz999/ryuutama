const { HTMLField, SchemaField, SetField, StringField } = foundry.data.fields;

export default class SkillData extends foundry.abstract.TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      abilities: new SetField(new StringField({ choices: () => ryuutama.config.abilityScores })),
      activation: new StringField({ required: true }),
      description: new SchemaField({
        value: new HTMLField(),
      }),
      target: new SchemaField({
        custom: new StringField({ required: true }),
      }),
    };
  }
}
