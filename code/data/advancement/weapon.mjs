import Advancement from "./advancement.mjs";

const { SchemaField, StringField } = foundry.data.fields;

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

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.PSEUDO.ADVANCEMENT.WEAPON",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();

    const document = this.document;
    if (document && this.choice.chosen) document.system.mastered.weapons[this.choice.chosen]++;
  }

  /* -------------------------------------------------- */

  /** @override */
  static async configure(actor) {
    return ryuutama.applications.apps.advancement.WeaponAdvancementDialog.create({ advancementClass: this, actor });
  }
}
