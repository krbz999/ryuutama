import Advancement from "./advancement.mjs";

const { SchemaField, StringField } = foundry.data.fields;

/**
 * A subclass of Advancement that is responsible for helping configure status immunities.
 */
export default class StatusImmunityAdvancement extends Advancement {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      choice: new SchemaField({
        chosen: new StringField({ blank: true, required: true, choices: ryuutama.CONST.STATUS_EFFECTS._toConfig }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TYPE = "statusImmunity";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static CONFIGURE_TEMPLATE = "systems/ryuutama/templates/apps/advancement/status-immunity.hbs";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.ADVANCEMENT.STATUS_IMMUNITY",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get isConfigured() {
    return !!this.choice.chosen;
  }
}
