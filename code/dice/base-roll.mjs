export default class BaseRoll extends foundry.dice.Roll {
  /**
   * The type used for the `part` of a standard message.
   * @type {string}
   */
  static PART_TYPE = "";

  /* -------------------------------------------------- */

  /** @override */
  async toMessage(messageData = {}, { rollMode, create = true } = {}) {
    // Fall back to default message creation for irrelevant rolls.
    if (!this.constructor.PART_TYPE) return super.toMessage(messageData, { rollMode, create });

    if (rollMode === "roll") rollMode = undefined;
    rollMode ||= game.settings.get("core", "rollMode");

    if (!this._evaluated) await this.evaluate({ allowInteractive: rollMode !== CONST.DICE_ROLL_MODES.BLIND });

    messageData = foundry.utils.mergeObject({
      type: "standard",
      system: {},
      author: game.user.id,
      sound: CONFIG.sounds.dice,
    }, messageData);
    messageData.system.parts = [{
      rolls: [this],
      type: this.constructor.PART_TYPE,
      flavor: messageData.flavor,
    }];
    delete messageData.flavor;
    delete messageData.rolls;

    const Cls = getDocumentClass("ChatMessage");
    const msg = new Cls(messageData);
    msg.applyRollMode(rollMode);

    if (create) return Cls.create(msg);
    return msg.toObject();
  }
}
