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

  /** @override */
  static CONFIGURE_TEMPLATE = "systems/ryuutama/templates/apps/advancement/type.hbs";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.PSEUDO.ADVANCEMENT.TYPE",
  ];

  /* -------------------------------------------------- */

  /** @override */
  static _determineResult(actor, formData) {
    const data = foundry.utils.expandObject(formData.object);
    return { result: new this({ type: this.TYPE, ...data }, { parent: actor }), type: "advancement" };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareBaseData() {
    super.prepareBaseData();

    const document = this.document;
    if (document && this.choice.chosen) document.system.details.type[this.choice.chosen]++;
  }
}
