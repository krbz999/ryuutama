import BaseData from "./base.mjs";

const { NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

export default class GearData extends BaseData {
  /** @override */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      bonus: new SchemaField({
        checks: new StringField(), // TODO: 'hide' etc. See 'camo cape' p64
        habitat: new SchemaField({
          terrain: new SetField(new StringField({ choices: () => ryuutama.config.terrainTypes })),
          weather: new SetField(new StringField({ choices: () => ryuutama.config.weatherTypes })),
          levels: new NumberField({ nullable: true, initial: null, integer: true }), // eg "level 3 or lower terrain"
        }),
        reduction: new SchemaField({
          type: new StringField(), // TODO: 'fire' etc. See 'fire cape' p64
          amount: new NumberField({ nullable: true, integer: true, initial: null }),
        }),
        strength: new NumberField({ nullable: true, initial: null, integer: true }), // see 'walking stick' p65
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    this.bonus.check = 1;
    if (this.modifiers.has("highQuality")) this.bonus.check++;
    if (this.modifiers.has("plusOne")) this.bonus.check++;
  }
}
