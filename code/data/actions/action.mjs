/**
 * @import RyuutamaActor from "../../documents/actor.mjs";
 * @import RyuutamaChatMessage from "../../documents/chat-message.mjs";
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
   * @returns {Promise<RyuutamaChatMessage>}
   */
  async use() {
    throw new Error("The 'use' method of Action must be overridden.");
  }
}
