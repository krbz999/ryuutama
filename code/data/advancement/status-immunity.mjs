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

  /** @override */
  static CONFIGURE_TEMPLATE = "systems/ryuutama/templates/apps/advancement/status-immunity.hbs";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.PSEUDO.ADVANCEMENT.STATUS",
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
    if (document && this.choice.chosen) document.system.condition.immunities.add(this.choice.chosen);
  }
}
