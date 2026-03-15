import StandardData from "./standard.mjs";

/**
 * @import ActiveEffect from "@client/documents/active-effect.mjs";
 */

const { BooleanField, NumberField, SchemaField } = foundry.data.fields;

export default class StatusData extends StandardData {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      strength: new SchemaField({
        bypass: new BooleanField(),
        value: new NumberField({ integer: true, nullable: false, min: 2, initial: 2, max: 20 }),
      }),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    "RYUUTAMA.EFFECT.STATUS",
  ];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.parent.name = `${this.parent.name}: ${this.strength.value}`;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);

    /** @type {ActiveEffect} */
    const effect = this.parent;
    if (!effect.modifiesActor || (options.animate === false) || !foundry.utils.hasProperty(changed, "system.strength"))
      return;
    effect._displayScrollingStatus(!effect.disabled);
  }
}
