import PhysicalData from "./templates/physical.mjs";

const { ArrayField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * @typedef WeaponData
 * @property {object} accuracy
 * @property {string[]} accuracy.abilities
 * @property {number|null} accuracy.bonus
 * @property {object} category
 * @property {string} category.value
 * @property {object} damage
 * @property {string} damage.ability
 * @property {number|null} damage.bonus
 * @property {object} description
 * @property {string} description.value
 * @property {object} durability
 * @property {number} durability.spent
 * @property {string} identifier
 * @property {string[]} modifiers
 */

export default class WeaponData extends PhysicalData {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      accuracy: new SchemaField({
        abilities: new ArrayField(
          new StringField({
            required: true,
            blank: false,
            initial: "strength",
            choices: () => ryuutama.config.abilityScores,
          }),
          { min: 2, max: 2, initial: ["strength", "strength"] },
        ),
        bonus: new NumberField({ nullable: true, integer: true, initial: null }),
      }),
      category: new SchemaField({
        value: new StringField({ required: true, blank: true, choices: () => ryuutama.config.weaponTypes }),
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
    "RYUUTAMA.ITEM.WEAPON",
  ];

  /* -------------------------------------------------- */

  /** @override */
  static DETAILS_TEMPLATE = "systems/ryuutama/templates/sheets/item-sheet/weapon.hbs";

  /* -------------------------------------------------- */

  /**
   * Is this an improvised weapon?
   * @type {boolean}
   */
  get isImprovised() {
    return !this.category.value;
  }

  /* -------------------------------------------------- */

  /**
   * Is this weapon mastered by its owner?
   * @type {boolean|null}
   */
  get isMastered() {
    if (!this.parent.isEmbedded) return null;
    const weapons = this.parent.actor.system.mastered?.weapons;
    return weapons ? (weapons[this.category.value] > 0) : null;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    const config = ryuutama.config.weaponTypes[this.category.value] ?? { grip: 2, ranged: false };
    this.grip = config.grip ?? 1;
    this.ranged = config.ranged ?? false;

    let baseAccuracy = this.isImprovised
      ? ryuutama.config.weaponUnarmedTypes.improvised.accuracy.bonus
      : this._source.accuracy.bonus ?? 0;
    if (this.modifiers.has("highQuality")) baseAccuracy++;
    this.accuracy.bonus = baseAccuracy;

    let baseDamage = this.isImprovised
      ? ryuutama.config.weaponUnarmedTypes.improvised.damage.bonus
      : this._source.damage.bonus ?? 0;
    if (this.modifiers.has("plusOne")) baseDamage++;
    this.damage.bonus = baseDamage;

    // For improvised weapons, override abilities.
    if (this.isImprovised) {
      this.accuracy.abilities = [...ryuutama.config.weaponUnarmedTypes.improvised.accuracy.abilities];
      this.damage.ability = ryuutama.config.weaponUnarmedTypes.improvised.damage.ability;
    }

    this.category.label = this.isImprovised
      ? ryuutama.config.weaponUnarmedTypes.improvised.label
      : ryuutama.config.weaponTypes[this.category.value].label;
    this.accuracy.label = this.accuracy.abilities
      .map(ability => `${ryuutama.config.abilityScores[ability].abbreviation}`)
      .filterJoin(" + ") + (this.accuracy.bonus ? ` ${this.accuracy.bonus.signedString()}` : "");
    this.damage.label =
      `${ryuutama.config.abilityScores[this.damage.ability].abbreviation}`
         + (this.damage.bonus ? ` ${this.damage.bonus.signedString()}` : "");
  }
}
