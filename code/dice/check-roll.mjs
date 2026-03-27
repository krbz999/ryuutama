import BaseRoll from "./base-roll.mjs";

/**
 * @import CheckDie from "./check-die.mjs";
 * @import RyuutamaActor from "../documents/actor.mjs";
 */

export default class CheckRoll extends BaseRoll {
  /** @inheritdoc */
  static PART_TYPE = "check";

  /* -------------------------------------------------- */

  /**
   * The check dice.
   * @type {CheckDie[]}
   */
  get checkDice() {
    return this.dice.filter(die => die instanceof ryuutama.dice.CheckDie);
  }

  /* -------------------------------------------------- */

  /**
   * Is the check a critical?
   * Evaluates to `true` if each die is '6' or if each die rolled the maximum value.
   * @type {boolean}
   */
  get isCritical() {
    if (!this._evaluated) throw new Error("Cannot check for state of a Check prior to evaluation.");
    const checkDice = this.checkDice;
    return !!checkDice.length && (checkDice.every(die => die.isMax) || checkDice.every(die => die.isSix));
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
    const checkDice = this.checkDice;
    return !!checkDice.length && checkDice.every(die => die.isMin);
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

  /* -------------------------------------------------- */
  /*   Factory Methods                                  */
  /* -------------------------------------------------- */

  /**
   * Construct a roll from an actor and selected abilities.
   * @param {RyuutamaActor} actor   The actor whose abilities to use.
   * @param {string[]} abilities    The abilities to use. This array may contain duplicates.
   * @returns {CheckRoll}
   */
  static fromAbilities(actor, abilities) {
    const dice = abilities.map(ability => ryuutama.dice.CheckDie.fromAbility(actor, ability));
    const terms = dice.reduce((acc, die, index, set) => {
      acc.push(die);
      if (index !== set.length - 1) acc.push(new foundry.dice.terms.OperatorTerm({ operator: "+" }));
      return acc;
    }, []);
    return CheckRoll.fromTerms(terms);
  }
}
