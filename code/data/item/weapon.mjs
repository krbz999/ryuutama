import BaseData from "./base.mjs";

const { BooleanField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

export default class WeaponData extends BaseData {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      accuracy: new SchemaField({
        custom: new BooleanField(),
        ability: new SetField(new StringField({ choices: () => ryuutama.config.abilityScores }), {
          min: 1, max: 2, initial: ["strength"],
        }),
        bonus: new NumberField({ nullable: true, integer: true, initial: null }),
      }),
      damage: new SchemaField({
        custom: new BooleanField(),
        ability: new StringField({
          required: true, blank: false, choices: () => ryuutama.config.abilityScores, initial: "strength",
        }),
        bonus: new NumberField({ nullable: true, integer: true, initial: null }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    const { accuracy: acc, damage } = this;
    const config = ryuutama.config.weaponCategories[this.type.value];

    if (!acc.custom) {
      acc.ability = new Set(config.accuracy.abilities);
      acc.bonus = (config.accuracy.bonus ?? 0);
    }

    if (!damage.custom) {
      damage.ability = config.damage.ability;
      damage.bonus = (config.damage.bonus ?? 0);
    }
  }
}
