export default class BaseRoll extends foundry.dice.Roll {
  /** @inheritdoc */
  static CHAT_TEMPLATE = "systems/ryuutama/templates/dice/roll.hbs";

  /* -------------------------------------------------- */

  /**
   * The type used for the `part` of a standard message.
   * @type {string}
   */
  static PART_TYPE = "";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async toMessage(messageData = {}, { messageMode, rollMode, create = true } = {}) {
    // Fall back to default message creation for irrelevant rolls.
    if (!this.constructor.PART_TYPE) return super.toMessage(messageData, { messageMode, create });

    messageMode ||= game.settings.get("core", "messageMode");

    if (!this._evaluated) await this.evaluate({ allowInteractive: messageMode !== "blind" });

    messageData = foundry.utils.mergeObject({
      type: "standard",
      system: {},
      author: game.user.id,
      sound: CONFIG.sounds.dice,
    }, messageData);
    messageData.system.parts = {
      [foundry.utils.randomID()]: {
        rolls: [this],
        type: this.constructor.PART_TYPE,
        flavor: messageData.flavor,
      },
    };
    delete messageData.flavor;
    delete messageData.rolls;

    const Cls = getDocumentClass("ChatMessage");
    const msg = new Cls(messageData);
    msg.applyMode(messageMode);

    if (create) return Cls.create(msg);
    return msg.toObject();
  }

  /* -------------------------------------------------- */

  /**
   * Retrieve properties to display on the roll as a tooltip.
   * @returns {{ icon: string, tooltip: string }[]}
   */
  _getTooltipProperties() {
    return [];
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareChatRenderContext(options = {}) {
    const context = await super._prepareChatRenderContext(options);
    context.properties = this._getTooltipProperties();
    return context;
  }
}
