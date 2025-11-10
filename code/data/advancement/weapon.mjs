import Advancement from "./advancement.mjs";

const { SchemaField, StringField } = foundry.data.fields;

/**
 * A subclass of Advancement that is responsible for helping configure mastered weapons.
 */
export default class WeaponAdvancement extends Advancement {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      choice: new SchemaField({
        chosen: new StringField({ blank: true, required: true, choices: () => {
          return {
            ...ryuutama.config.weaponTypes,
            unarmed: ryuutama.config.weaponUnarmedTypes.unarmed,
          };
        } }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @override */
  static TYPE = "weapon";

  /* -------------------------------------------------- */

  /** @override */
  static CONFIGURE_TEMPLATE = "systems/ryuutama/templates/apps/advancement/weapon.hbs";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.PSEUDO.ADVANCEMENT.WEAPON",
  ];

  /* -------------------------------------------------- */

  /** @override */
  get isConfigured() {
    if (!this.isEphemeral) return !!this.choice.chosen;

    const choices = [...Object.keys(ryuutama.config.weaponTypes), "unarmed"].filter(type => {
      return (!this.document.system.mastered.weapons[type] && !this.#sameWeaponChoice(type));
    });

    return choices.includes(this.choice.chosen);
  }

  /* -------------------------------------------------- */

  /**
   * Is there a Weapon advancement other than this one in the level-up chain that has picked a specific weapon?
   * @param {string} type   The key of the weapon type.
   * @returns {boolean}
   */
  #sameWeaponChoice(type) {
    return this.chain.nodes.get("weapon").some(({ advancement }) => {
      return (advancement !== this) && (advancement.choice.chosen === type);
    });
  }
}
