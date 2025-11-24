import BaseRoll from "./base-roll.mjs";

export default class CheckRoll extends BaseRoll {
  /**
   * The type used for the `part` of a standard message.
   * @type {string}
   */
  static PART_TYPE = "check";

  /* -------------------------------------------------- */

  /** @override */
  async toMessage(messageData = {}, { rollMode, create = true } = {}) {
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

  /* -------------------------------------------------- */

  /**
   * Is the check a fumble?
   * @type {boolean}
   */
  get isFumble() {
    if (!this._evaluated) throw new Error("Cannot check for state of a Check prior to evaluation.");
    return this.dice.every(die => die.total === die.number);
  }

  /* -------------------------------------------------- */

  /**
   * Is the check a critical?
   * @type {boolean}
   */
  get isCritical() {
    if (!this._evaluated) throw new Error("Cannot check for state of a Check prior to evaluation.");
    return this.dice.every(die => die.total === (die.number * die.faces));
  }
}
