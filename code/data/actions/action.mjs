/**
 * @import RyuutamaActor from "../../documents/actor.mjs";
 * @import RyuutamaItem from "../../documents/item.mjs";
 */

const { StringField } = foundry.data.fields;

export default class Action extends foundry.abstract.DataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      type: new StringField({
        required: true,
        blank: false,
        initial: this.TYPE,
        validate: value => value === this.TYPE,
        validationError: `must be equal to "${this.TYPE}"`,
      }),
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = [
    "RYUUTAMA.PSEUDO.ACTION",
  ];

  /* -------------------------------------------------- */

  /**
   * The Action subtypes.
   * @type {Record<string, typeof Action>}
   */
  static get TYPES() {
    return Action.#TYPES ??= Object.freeze({
      [ryuutama.data.action.DamageAction.TYPE]: ryuutama.data.action.DamageAction,
      [ryuutama.data.action.EffectAction.TYPE]: ryuutama.data.action.EffectAction,
      [ryuutama.data.action.HealingAction.TYPE]: ryuutama.data.action.HealingAction,
    });
  }

  /* -------------------------------------------------- */

  /**
   * The Action subtypes.
   * @type {Record<string, typeof Action>|void}
   */
  static #TYPES;

  /* -------------------------------------------------- */

  /**
   * The subtype.
   * @type {string}
   */
  static TYPE = "";

  /* -------------------------------------------------- */

  /**
   * The document this action is embedded in.
   * @type {RyuutamaItem}
   */
  get document() {
    return this.parent.parent;
  }

  /* -------------------------------------------------- */

  /**
   * Alias for the document.
   * @type {RyuutamaItem}
   */
  get item() {
    return this.document;
  }

  /* -------------------------------------------------- */

  /**
   * The parent actor of this action's item.
   * @type {RyuutamaActor}
   */
  get actor() {
    return this.item.actor;
  }

  /* -------------------------------------------------- */

  /**
   * Use this action.
   * This internal method should return message part to be combined with the parent item.
   * @returns {Promise<object>}
   */
  async use() {
    throw new Error("The 'use' method of Action must be overridden.");
  }

  /* -------------------------------------------------- */

  /**
   * Modify the context object when this model is rendered directly on the item sheet.
   * @param {object} context    The rendering context. **will be mutated**
   */
  prepareSheetContext(context) {}
}
