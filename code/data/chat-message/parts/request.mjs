import CreatureData from "../../actor/templates/creature.mjs";
import MessagePart from "./base.mjs";

/**
 * @import RyuutamaActor from "../../../documents/actor.mjs";
 */

const { ArrayField, DocumentUUIDField, NumberField, ObjectField, SchemaField } = foundry.data.fields;

export default class RequestPart extends MessagePart {
  static {
    Object.defineProperty(this, "TYPE", { value: "request" });
  }

  /* -------------------------------------------------- */

  /** @override */
  static ACTIONS = {
    rollRequest: RequestPart.#rollRequest,
    rerollRequest: RequestPart.#rerollRequest,
  };

  /* -------------------------------------------------- */

  /** @override */
  static TEMPLATE = "systems/ryuutama/templates/chat/parts/request.hbs";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      check: new SchemaField({
        configuration: new ObjectField(),
      }),
      results: new ArrayField(new SchemaField({
        actorUuid: new DocumentUUIDField({ type: "Actor" }),
        result: new NumberField({ required: true, nullable: false }),
      })),
    });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  prepareData() {
    super.prepareData();
    this.results = this.results.filter(r => (r.actor = fromUuidSync(r.actorUuid)));
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(context) {
    await super._prepareContext(context);
    context.ctx.requestText = CreatureData._createCheckLabel(this.check.configuration);
    context.ctx.results = this.results.map(r => {
      const result = { ...r };
      result.disabled = !r.actor.isOwner;
      return result;
    });
  }

  /* -------------------------------------------------- */

  /**
   * Perform an initial roll for the request.
   * @this RequestPart
   * @param {PointerEvent} event    Initiating click event.
   * @param {HTMLElement} target    The capturing element that defined the [data-action].
   */
  static async #rollRequest(event, target) {
    let actors;
    if (canvas?.tokens?.controlled.length) actors = new Set(canvas.tokens.controlled.map(token => token.actor));
    else actors = [game.user.character];
    for (const actor of actors) if (actor) await this._rollRequest(actor, event);
  }

  /* -------------------------------------------------- */

  /**
   * Perform a reroll.
   * @this RequestPart
   * @param {PointerEvent} event    Initiating click event.
   * @param {HTMLElement} target    The capturing element that defined the [data-action].
   */
  static async #rerollRequest(event, target) {
    const actor = fromUuidSync(target.closest("[data-actor-uuid]").dataset.actorUuid);
    this._rollRequest(actor, event);
  }

  /* -------------------------------------------------- */

  /**
   * Roll the request.
   * @param {RyuutamaActor} actor   The actor performing the roll.
   * @param {PointerEvent} event    Initiating click event.
   * @returns {Promise}             A promise that resolves once the roll has been completed.
   */
  async _rollRequest(actor, event) {
    const rollConfig = foundry.utils.deepClone(this.check.configuration);
    const dialogConfig = { configure: !event.shiftKey };
    const messageConfig = { requestId: this.message.id };
    await actor.system.rollCheck(rollConfig, dialogConfig, messageConfig);
  }
}
