import Advancement from "./advancement.mjs";

const { SchemaField, StringField } = foundry.data.fields;

/**
 * A subclass of Advancement for selecting a favor of the seasonal dragons.
 */
export default class DragonFavorAdvancement extends Advancement {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      choice: new SchemaField({
        chosen: new StringField({ blank: true, required: true, choices: () => ryuutama.config.seasons }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static TYPE = "dragonFavor";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static CONFIGURE_TEMPLATE = "systems/ryuutama/templates/apps/advancement/dragon-favor.hbs";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.ADVANCEMENT.DRAGON_FAVOR",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get isConfigured() {
    return !!this.choice.chosen;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _getAdvancementResults(actor) {
    return [{ type: "actor", result: { "system.details.dragonFavor": this.choice.chosen } }];
  }
}
