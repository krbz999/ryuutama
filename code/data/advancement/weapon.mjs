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
  get isFullyConfigured() {
    return !!this.choice.chosen;
  }
}
