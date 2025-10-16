import Advancement from "./advancement.mjs";

const { SchemaField, StringField } = foundry.data.fields;

export default class StatusImmunityAdvancement extends Advancement {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      choice: new SchemaField({
        chosen: new StringField({ blank: false, required: true, choices: () => ryuutama.config.statusEffects }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @override */
  static TYPE = "statusImmunity";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.PSEUDO.ADVANCEMENT.STATUS",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();

    const document = this.document;
    if (document && this.choice.chosen) document.system.condition.immunities.add(this.choice.chosen);
  }

  /* -------------------------------------------------- */

  /** @override */
  static async configure(actor) {
    return ryuutama.applications.apps.advancement.StatusImmunityAdvancementDialog.create({ advancementClass: this, actor });
  }
}
