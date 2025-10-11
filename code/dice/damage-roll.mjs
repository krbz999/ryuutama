import CheckRoll from "./check-roll.mjs";

export default class DamageRoll extends CheckRoll {
  /**
   * Is this instance of damage magical?
   * @type {boolean}
   */
  get isMagical() {
    return !!this.options.magical;
  }
}
