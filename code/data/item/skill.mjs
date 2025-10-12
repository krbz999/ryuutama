const { HTMLField, SchemaField } = foundry.data.fields;

export default class SkillData extends foundry.abstract.TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      description: new SchemaField({
        value: new HTMLField(),
      }),
    };
  }
}
