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

  /** @override */
  static CONFIGURE_TEMPLATE = "systems/ryuutama/templates/apps/advancement/resource.hbs";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.PSEUDO.ADVANCEMENT.RESOURCE",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static async _prepareAdvancementContext(context, options) {
    await super._prepareAdvancementContext(context, options);
    context.valid = false;
  }

  /* -------------------------------------------------- */

  /** @override */
  static _determineValidity(formData) {
    formData = foundry.utils.expandObject(formData.object);
    return formData.choice.chosen.stamina + formData.choice.chosen.mental === 3;
  }

  /* -------------------------------------------------- */

  /** @override */
  static _determineResult(actor, formData) {
    formData = foundry.utils.expandObject(formData.object);
    const source = actor.system._source.resources;
    const update = {
      "system.resources.stamina.max": source.stamina.max + formData.choice.chosen.stamina,
      "system.resources.mental.max": source.mental.max + formData.choice.chosen.mental,
    };
    return { result: update, type: "actor" };
  }
}
