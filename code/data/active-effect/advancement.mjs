const { NumberField } = foundry.data.fields;

export default class AdvancementData extends foundry.data.ActiveEffectTypeDataModel {
  /**
   * Does this AE subtype display scrolling text?
   * @type {boolean}
   */
  scrollingText = false;

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      level: new NumberField({ nullable: false, integer: true, min: 1, max: 10, required: true }),
    });
  }
}
