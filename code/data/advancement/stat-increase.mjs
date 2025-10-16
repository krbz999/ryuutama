import Advancement from "./advancement.mjs";

const { SchemaField, StringField } = foundry.data.fields;

export default class StatIncreaseAdvancement extends Advancement {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      choice: new SchemaField({
        chosen: new StringField({ blank: false, required: true, choices: () => ryuutama.config.abilityScores }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @override */
  static TYPE = "statIncrease";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.PSEUDO.ADVANCEMENT.INCREASE",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();

    const document = this.document;
    if (document && this.choice.chosen) document.system.abilities[this.choice.chosen].increases++;
  }

  /* -------------------------------------------------- */

  /** @override */
  static async configure(actor) {
    return ryuutama.applications.apps.advancement.StatIncreaseAdvancementDialog.create({ advancementClass: this, actor });
  }
}
