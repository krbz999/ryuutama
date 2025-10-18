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
        chosen: new StringField({ blank: false, required: true, choices: () => ryuutama.config.weaponCategories }),
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
  static _determineResult(actor, formData) {
    const data = foundry.utils.expandObject(formData.object);
    return { result: new this({ type: this.TYPE, ...data }, { parent: actor }), type: "advancement" };
  }
}
