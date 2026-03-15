/**
 * @import RyuutamaCombatant from "./combatant.mjs";
 */

export default class RyuutamaCombat extends foundry.documents.Combat {
  /**
   * Default turn marker.
   * @type {string}
   */
  static {
    Object.defineProperty(this, "TURN_MARKER", {
      value: "systems/ryuutama/assets/official/combat/turn-marker-1.webp",
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _initializeSource(data = {}, options = {}) {
    if (!data.type || (data.type === "base")) data.type = "standard";
    return super._initializeSource(data, options);
  }

  /* -------------------------------------------------- */

  /**
   * Roll initiative for one or multiple Combatants within the Combat document.
   * @param {string|string[]} ids               A Combatant id or Array of ids for which to roll.
   * @param {object} [options={}]               Additional options which modify how initiative
   *                                            rolls are created or presented.
   * @param {boolean} [options.delayed=false]   Whether to store the initiative to apply on the next round.
   * @returns {Promise<this>}                   A promise which resolves to the updated Combat
   *                                            document once updates are complete.
   */
  async rollInitiative(ids, { delayed = false } = {}) {
    ids = (typeof ids === "string") ? [ids] : ids;

    for (const id of ids) {
      /** @type {RyuutamaCombatant} */
      const combatant = this.combatants.get(id);
      if (!combatant?.actor) continue;
      await combatant?.rollInitiative({ initiative: { delayed } });
    }

    return this;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async nextRound() {
    const updates = this.combatants.map(c => {
      const update = { _id: c.id };
      const delayed = c.system.initiative;
      if (delayed.value) {
        update.initiative = new ryuutama.dice.BaseRoll(delayed.value, c.getRollData()).evaluateSync().total;
        update.system = { "initiative.value": "" };
      }
      return update;
    });
    await this.updateEmbeddedDocuments("Combatant", updates, { render: false, turnEvents: false });
    return super.nextRound();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _onDelete(options, userId) {
    super._onDelete(options, userId);
    this.combatants.forEach(c => {
      c.actor?.render(false, { context: "deleteCombat" });
    });
  }
}
