import PhysicalData from "./templates/physical.mjs";

const { ArrayField, BooleanField, NumberField, SchemaField, StringField } = foundry.data.fields;

export default class WeaponData extends PhysicalData {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      accuracy: new SchemaField({
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

  /**
   * Is this weapon mastered by its owner?
   * @type {boolean|null}
   */
  get isMastered() {
    if (!this.parent.isEmbedded) return null;
    const weapons = this.parent.actor.system.mastered?.weapons;
    return weapons ? weapons.has(this.category.value) : null;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    const config = ryuutama.config.weaponCategories[this.category.value];
    this.grip = config.grip;
    this.ranged = config.ranged ?? false;

    if (this.modifiers.has("highQuality")) this.accuracy.bonus = (this._source.accuracy.bonus ?? 0) + 1;
    if (this.modifiers.has("plusOne")) this.damage.bonus = (this._source.damage.bonus ?? 0) + 1;
  }
}
