import Advancement from "./advancement.mjs";

const { NumberField, SchemaField } = foundry.data.fields;

/**
 * A subclass of Advancement that is responsible for helping configure increases to HP / MP.
 */
export default class ResourceAdvancement extends Advancement {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      choice: new SchemaField({
        chosen: new SchemaField({
          stamina: new NumberField({ min: 0, max: 3, integer: true, initial: 0, nullable: false }),
          mental: new NumberField({ min: 0, max: 3, integer: true, initial: 0, nullable: false }),
        }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @override */
  static TYPE = "resource";

  /* -------------------------------------------------- */

  /** @override */
  static CONFIGURE_TEMPLATE = "systems/ryuutama/templates/apps/advancement/resource.hbs";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.PSEUDO.ADVANCEMENT.RESOURCE",
  ];

  /* -------------------------------------------------- */

  /** @override */
  get isFullyConfigured() {
    const { stamina, mental } = this.choice.chosen;
    return stamina + mental === 3;
  }
}
