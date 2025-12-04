import BaseRoll from "./base-roll.mjs";

export default class CheckRoll extends BaseRoll {
  /** @override */
  static PART_TYPE = "check";

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
