import PhysicalData from "./templates/physical.mjs";

const { ArrayField, BooleanField, NumberField, SchemaField, StringField } = foundry.data.fields;

export default class WeaponData extends PhysicalData {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      accuracy: new SchemaField({
        custom: new BooleanField(),
        abilities: new ArrayField(
          new StringField({ choices: () => ryuutama.config.abilityScores }),
          { min: 2, max: 2, initial: ["strength", "strength"] },
        ),
        bonus: new NumberField({ nullable: true, integer: true, initial: null }),
      }),
      category: new SchemaField({
        value: new StringField({
          required: true, blank: false,
          choices: () => ryuutama.config.weaponCategories,
          initial: () => Object.keys(ryuutama.config.weaponCategories)[0],
        }),
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
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.WEAPON",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    // TODO: don't derive any of this from configs. Always set on items.
    const { accuracy: acc, damage, category } = this;
    const config = ryuutama.config.weaponCategories[category.value];
    this.grip = config.grip;

    if (!acc.custom) {
      acc.abilities = [...config.accuracy.abilities];
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
