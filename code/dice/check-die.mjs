/**
 * @import RyuutamaActor from "../documents/actor.mjs";
 */

export default class CheckDie extends foundry.dice.terms.Die {
  /**
   * Did the die roll its maximum value?
   * @type {boolean}
   */
  get isMax() {
    if (!this._evaluated) throw new Error("Cannot check for state of a Check prior to evaluation.");
    const active = this.results.filter(result => result.active);
    return (active.length > 0) && active.every(result => result.result === this.faces);
  }

  /* -------------------------------------------------- */

  /**
   * Did the die roll its minimum value?
   * @type {boolean}
   */
  get isMin() {
    if (!this._evaluated) throw new Error("Cannot check for state of a Check prior to evaluation.");
    const active = this.results.filter(result => result.active);
    return (active.length > 0) && active.every(result => result.result === 1);
  }

  /* -------------------------------------------------- */

  /**
   * Did the die roll a 6?
   * @type {boolean}
   */
  get isSix() {
    if (!this._evaluated) throw new Error("Cannot check for state of a Check prior to evaluation.");
    const active = this.results.filter(result => result.active);
    return (active.length > 0) && active.every(result => result.result === 6);
  }

  /* -------------------------------------------------- */
  /*   Factory Methods                                  */
  /* -------------------------------------------------- */

  /**
   * Construct a die using an actor's ability.
   * @param {RyuutamaActor} actor
   * @param {string} ability
   * @returns {CheckDie}
   */
  static fromAbility(actor, ability) {
    const faces = actor.system.abilities[ability].faces;
    return new this({ faces, options: { ability } });
  }
}
