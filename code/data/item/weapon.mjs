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
      category: new SchemaField({
        value: new StringField({ required: true, blank: false, choices: () => ryuutama.config.weaponCategories }),
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

    const { accuracy: acc, damage, category } = this;
    const config = ryuutama.config.weaponCategories[category.value];
    this.grip = config.grip;

    if (!acc.custom) {
      acc.ability = new Set(config.accuracy.abilities);
      acc.bonus = (config.accuracy.bonus ?? 0);
    }

    if (!damage.custom) {
      damage.ability = config.damage.ability;
      damage.bonus = (config.damage.bonus ?? 0);
    }

    if (this.modifiers.has("highQuality")) acc.bonus = (acc.bonus ?? 0) + 1;
    if (this.modifiers.has("plusOne")) damage.bonus = (damage.bonus ?? 0) + 1;
  }
}
