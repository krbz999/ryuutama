export default class JourneyManager extends foundry.applications.api.Application {
  /**
   * Execute a stage of the journey check flow.
   * @param {"condition"|"travel"|"direction"|"camping"} stage
   */
  async executeStage(stage) {
    if (!game.user.isActiveGM) {
      throw new Error("Only the GM can proceed with the Journey Check stages.");
    }

    switch (stage) {
      // case "condition": return this.#executeStageCondition();
      case "travel": return this.#executeStageTravel();
      case "direction": return this.#executeStageDirection();
      // case "camping": return this.#executeStageCamping();
    }
  }

  /* -------------------------------------------------- */
  /*   Stages                                           */
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
}
