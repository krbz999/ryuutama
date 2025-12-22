const { NumberField, SchemaField } = foundry.data.fields;

export default class StandardData extends foundry.abstract.TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      initiative: new SchemaField({
        value: new NumberField({ required: true }),
      }),
    };
  }
}
