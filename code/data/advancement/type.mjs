import Advancement from "./advancement.mjs";

const { SchemaField, StringField } = foundry.data.fields;

/**
 * A subclass of Advancement that is responsible for helping configure chosen types.
 */
export default class TypeAdvancement extends Advancement {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      choice: new SchemaField({
        chosen: new StringField({ blank: true, required: true, choices: () => ryuutama.config.travelerTypes }),
        magic: new StringField({ blank: true, required: true, choices: () => ryuutama.config.seasons }),
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
  get isFullyConfigured() {
    const { chosen, magic } = this.choice;
    switch (chosen) {
      case "magic": return !!magic;
      default: return !!chosen;
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareAdvancementContext(context, options) {
    await super._prepareAdvancementContext(context, options);
    context.showMagic = this.choice.chosen === "magic";
  }

  /* -------------------------------------------------- */

  /** @override */
  async _constructChildren() {
    const types = [];
    if (this.choice.chosen === "attack") types.push("weapon");
    return types;
  }
}
