/**
 * System implementation of the ChatMessage document class.
 * @extends foundry.documents.ChatMessage
 */
export default class RyuutamaChatMessage extends foundry.documents.ChatMessage {
  /** @inheritdoc */
  get isRoll() {
    return this.system.isRoll ?? super.isRoll;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get visible() {
    return (this.system.visible ?? true) && super.visible;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _initializeSource(data = {}, options = {}) {
    if (data.type === "damage") RyuutamaChatMessage.#migrateDamageMessage(data);
    return super._initializeSource(data, options);
  }

  /* -------------------------------------------------- */
  /*   Migrations                                       */
  /* -------------------------------------------------- */

  /**
   * Migrate 'damage' messages into 'standard' messages with a single 'damage' part.
   * @param {object} data   Message data. **will be mutated**
   */
  static #migrateDamageMessage(data) {
    data.type = "standard";
    data.system = {
      parts: {
        [foundry.utils.randomID()]: {
          flavor: data.flavor,
          rolls: data.rolls,
          type: "damage",
        },
      },
    };
    delete data.rolls;
    delete data.flavor;
  }
}
