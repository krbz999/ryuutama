import BaseData from "./base.mjs";

const { NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

export default class GearData extends BaseData {
  /** @override */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      gear: new SchemaField({
        habitat: new SchemaField({
          terrain: new SetField(new StringField({ choices: () => ryuutama.config.terrainTypes })),
          weather: new SetField(new StringField({ choices: () => ryuutama.config.weatherTypes })),
          levels: new NumberField({ nullable: true, initial: null, integer: true }), // eg "level 3 or lower terrain"
        }),
        strength: new NumberField({ nullable: true, initial: null, integer: true }), // see 'walking stick' p65
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    this.gear.check = 1;
    if (this.modifiers.has("highQuality")) this.gear.check++;
    if (this.modifiers.has("plusOne")) this.gear.check++;
  }
}
