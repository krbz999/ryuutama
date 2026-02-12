/**
 * @import RyuutamaActor from "../../documents/actor.mjs";
 * @import { CheckRollConfig } from "../../data/actor/_types.mjs";
 */

export default class JourneyManager extends foundry.applications.api.Application {
  /** @override */
  static DEFAULT_OPTIONS = {
    id: "journey-manager",
  };

  /* -------------------------------------------------- */

  /**
   * The participating actors.
   * @type {Set<RyuutamaActor>}
   */
  get actors() {
    return new Set(game.users.players.map(user => user.character).filter(_ => _));
  }

  /* -------------------------------------------------- */

  /**
   * The active semaphore, stagging the tasks.
   * @type {foundry.utils.Semaphore}
   */
  #semaphore = new foundry.utils.Semaphore(1);
  get semaphore() {
    return this.#semaphore;
  }

  /* -------------------------------------------------- */

  /**
   * Utility getter for the setting in its current state.
   * @type {foundry.abstract.DataModel}
   */
  get setting() {
    return game.settings.get(ryuutama.id, "JOURNEY_MANAGEMENT");
  }

  /* -------------------------------------------------- */

  /**
   * The current topology target number (terrain + weather).
   * @type {number}
   */
  get targetNumber() {
    return ui.habitat.targetNumber;
  }

  /* -------------------------------------------------- */

  /**
   * Add a new operation in the queue.
   * @param {object} change     The change to make to the stored setting.
   * @returns {Promise<true>}   A promise that resolves once the queued change has been performed.
   */
  async adjustSetting(change) {
    if (!game.user.isActiveGM) throw new Error("Only a GM can perform a change to the JourneyManagement setting.");
    const fn = () => {
      const update = foundry.utils.mergeObject(this.setting.toObject(), change);
      return game.settings.set(ryuutama.id, "JOURNEY_MANAGEMENT", update);
    };
    await this.semaphore.add(fn);
    return true;
  }

  /* -------------------------------------------------- */

  /**
   * Clear the setting.
   * @returns {Promise<void>}
   */
  async clearSetting() {
    if (!game.user.isActiveGM) throw new Error("Only a GM can perform a change to the JourneyManagement setting.");
    await game.settings.set(ryuutama.id, "JOURNEY_MANAGEMENT", {});
  }

  /* -------------------------------------------------- */

  getActorForRole(role) {
    const id = foundry.utils.getProperty(this.setting, role);
    if (!(typeof id === "string")) return null;
    return this.actors.find(actor => actor.id === id) ?? null;
  }

  /* -------------------------------------------------- */

  /**
   * Perform a change to the journey setup.
   * @param {object} change
   * @returns {Promise<boolean>}
   */
  async updateProperty(change) {
    const user = game.users.activeGM;
    if (!user) throw new Error("A GM is required to perform the property change.");

    const config = { type: "handleJourneyAssignment", change };
    if (user.isSelf) return CONFIG.queries[ryuutama.id](config);
    else return user.query(ryuutama.id, config, { timeout: 10_000 });
  }

  /* -------------------------------------------------- */

  /**
   * @param {"camping"|"direction"} type
   * @param {boolean} [support=false]
   * @returns {Promise<boolean>}
   */
  async requestChange(type, support = false) {
    if (!game.user.isActiveGM) throw new Error("Only the GM can request changes to the journey.");

    const actor = this.getActorForRole([type, support ? "support" : "primary"].join("."));
    const isSupported = !support && !!this.getActorForRole(`${type}.support`) && this.setting.isSupported(type);

    /** @type {CheckRollConfig} */
    const rollConfig = { type: "journey", journeyId: type, modifier: isSupported ? 1 : 0 };
    const result = await ryuutama.applications.apps.RollRequestor.request(actor, rollConfig);
    if (result === null) return;

    const change = { [`${type}.result`]: result };
    return this.updateProperty(change);
  }

  /* -------------------------------------------------- */

  /**
   * Execute a stage of the journey check flow.
   * @param {"condition"|"travel"|"direction"|"camping"} stage
   */
  async executeStage(stage) {
    if (!game.user.isActiveGM) {
      throw new Error("Only the GM can proceed with the Journey Check stages.");
    }

    switch (stage) {
      case "condition": return this.#executeStageCondition();
      case "travel": return this.#executeStageTravel();
      case "direction": return this.#executeStageDirection();
      case "camping": return this.#executeStageCamping();
    }
  }

  /* -------------------------------------------------- */
  /*   Stages                                           */
  /* -------------------------------------------------- */

  /**
   * Each party member determines their condition for that day.
   * @returns {Promise<void>}   A promise that resolves once all requests have been resolved or rejected.
   */
  async #executeStageCondition() {
    const actors = Array.from(this.actors).filter(actor => typeof this.setting.condition.results[actor.id] !== "number");
    if (!actors.length) {
      throw new Error("You cannot repeat the Condition stage after it has been completed.");
    }

    /**
     * Request the condition check from an actor.
     * @param {RyuutamaActor} actor
     * @returns {Promise<number|null>}
     */
    const request = async (actor) => {
      let result;
      try {
        result = await ryuutama.applications.apps.RollRequestor.request(actor, { type: "condition" });
        if (typeof result === "number") this.updateProperty({ [`condition.results.${actor.id}`]: result });
      } catch (err) {
        result = null;
      }
      return result;
    };
    const promises = actors.map(request);
    await Promise.allSettled(promises);
  }

  /* -------------------------------------------------- */

  /**
   * Each party member determines their ability to travel.
   * Travel Check (TN: terrain + weather)
   * - Success: Travel all day without harm.
   * - Failure: Halve HP, rounded down.
   * - Critical: +1 to Condition until next day's condition check.
   * - Fumble: Quarter HP, rounded down.
   * @returns {Promise<void>}   A promise that resolves once all requests have been resolved or rejected.
   */
  async #executeStageTravel() {
    const actors = Array.from(this.actors).filter(actor => typeof this.setting.travel.results[actor.id] !== "number");
    if (!actors.length) {
      throw new Error("No actors remain that can perform a travel check.");
    }

    const request = async (actor) => {
      let result;
      try {
        result = await ryuutama.applications.apps.RollRequestor.request(actor, { type: "journey", journeyId: "travel" });
      } catch (err) {
        result = null;
      }
      return result;
    };
    const promises = actors.map(request);
    await Promise.allSettled(promises);
  }

  /* -------------------------------------------------- */

  /**
   * Mapper and one supporter determine the ability for the party to navigate.
   * Direction Check (TN: terrain + weather)
   * - Success: Party finds their way.
   * - Failure: Movement is halved (+1 to Direction check next day if same terrain).
   * - Critical: Automatic success regardless of TN.
   * - Fumble: Make no progress for the entire day.
   */
  async #executeStageDirection() {
    const actor = this.getActorForRole("direction.primary");
    const supporter = this.getActorForRole("direction.support");

    let supportResult = this.setting.direction.supported;

    if (supporter && (supportResult === null)) {
      const result = await ryuutama.applications.apps.RollRequestor.request(supporter, {
        type: "journey", journeyId: "direction",
      });
      if (result === null) throw new Error("The support request was cancelled.");

      await this.updateProperty({ "direction.supported": result });
    }

    supportResult = this.setting.direction.supported;

    // TODO: primary roll
  }

  /* -------------------------------------------------- */

  /**
   * One person and one supporter determine whether party passes night safely.
   * Camping Check (TN: terrain + weather)
   * - Success: Start of next day, each character current HP doubled (up to max), MP fully restored.
   * - Failure: Start of next day, each character recovers only 2 HP and MP.
   * - Critical: Start of next day, each character recovers all HP and MP, gain +1 to Condition.
   * - Fumble: No recovery, each character gains -1 to Condition.
   */
  async #executeStageCamping() {}
}
