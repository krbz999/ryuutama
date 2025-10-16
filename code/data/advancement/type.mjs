import Advancement from "./advancement.mjs";

const { SchemaField, StringField } = foundry.data.fields;

export default class TypeAdvancement extends Advancement {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      choice: new SchemaField({
        chosen: new StringField({ blank: false, required: true, choices: () => ryuutama.config.travelerTypes }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @override */
  static TYPE = "type";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.PSEUDO.ADVANCEMENT.TYPE",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();

    const document = this.document;
    if (document && this.choice.chosen) document.system.details.type[this.choice.chosen]++;
  }

  /* -------------------------------------------------- */

  /** @override */
  static async configure(actor) {
    return ryuutama.applications.apps.advancement.TypeAdvancementDialog.create({ advancementClass: this, actor });
  }
}
