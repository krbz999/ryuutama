import BaseRoll from "./base-roll.mjs";

export default class CheckRoll extends BaseRoll {
  /** @inheritdoc */
  static PART_TYPE = "check";

  /* -------------------------------------------------- */

  /**
   * Is the check a critical?
   * Evaluates to `true` if each die is '6' or if each die rolled the maximum value.
   * @type {boolean}
   */
  get isCritical() {
    if (!this._evaluated) throw new Error("Cannot check for state of a Check prior to evaluation.");
    return this.dice.every(die => {
      return die.results.every(result => result.result === 6);
    }) || this.dice.every(die => {
      return die.results.every(result => result.result === die.faces);
    });
  }

  /* -------------------------------------------------- */

  /**
   * Is the check a failure?
   * Evaluates to `true` if the roll is a fumble or below a target number.
   * @type {boolean|null}
   */
  get isFailure() {
    if (this.isFumble) return true;
    return (this.targetNumber === null) ? null : (this.total < this.targetNumber);
  }

  /* -------------------------------------------------- */

  /**
   * Is the check a fumble?
   * Evalutes to `true` if each die has a result of '1'.
   * @type {boolean}
   */
  get isFumble() {
    if (!this._evaluated) throw new Error("Cannot check for state of a Check prior to evaluation.");
    return this.dice.every(die => {
      return die.results.every(result => result.result === 1);
    });
  }

  /* -------------------------------------------------- */

  /**
   * Is the check a success?
   * Evaluates to `true` if the roll is critical or above a target number.
   * @type {boolean|null}
   */
  get isSuccess() {
    if (this.isCritical) return true;
    return (this.targetNumber === null) ? null : (this.total >= this.targetNumber);
  }

  /* -------------------------------------------------- */

  /**
   * The target number of this check.
   * Returns `null` if this roll was constructed without a TN.
   * @type {number|null}
   */
  get targetNumber() {
    const tn = this.options.target;
    if (Number.isNumeric(tn)) return Number(tn);
    return null;
  }
}
