import Advancement from "./advancement.mjs";

const { NumberField, SchemaField } = foundry.data.fields;

/**
 * A subclass of Advancement that is responsible for helping configure starting abilities.
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

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.PSEUDO.ADVANCEMENT.RESOURCE",
  ];

  /* -------------------------------------------------- */

  /** @override */
  static async configure(actor) {
    return ryuutama.applications.apps.advancement.ResourceAdvancementDialog.create({ advancementClass: this, actor });
  }
}
