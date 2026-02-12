/**
 * @import { CheckRollConfig } from "../../data/actor/_types.mjs";
 */

export default class JourneyManager extends foundry.applications.api.Application {
  /** @override */
  static DEFAULT_OPTIONS = {
    id: "journey-manager",
  };

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
   * Add a new operation in the queue.
   * @param {object} change     The change to make to the stored setting.
   * @returns {Promise<true>}   A promise that resolves once the queued change has been performed.
   */
  async adjustSetting(change) {
    if (!game.user.isActiveGM) throw new Error("Only a GM can perform a change to the JourneyManagement setting.");
    const fn = () => {
      const current = this.setting.toObject();
      const update = foundry.utils.mergeObject(current, change, { insertKeys: false, insertValues: false, inplace: false });
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

    const setting = this.setting;
    const actor = fromUuidSync(setting[type][support ? "support" : "primary"]);
    const isSupported = !support && !!fromUuidSync(setting[type].support);

    /** @type {CheckRollConfig} */
    const rollConfig = { type: "journey", journeyId: type, modifier: isSupported ? 1 : 0 };
    const result = await ryuutama.applications.apps.RollRequestor.request(actor, rollConfig);
    if (result === null) return;

    const change = { [`${type}.result`]: result };
    return this.updateProperty(change);
  }
}
