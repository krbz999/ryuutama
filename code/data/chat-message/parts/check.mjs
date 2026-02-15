import MessagePart from "./base.mjs";

const { BooleanField } = foundry.data.fields;

export default class CheckPart extends MessagePart {
  static {
    Object.defineProperty(this, "TYPE", { value: "check" });
  }

  /* -------------------------------------------------- */

  /** @override */
  static ACTIONS = {
    grantFumble: CheckPart.#grantFumble,
  };

  /* -------------------------------------------------- */

  /** @override */
  static TEMPLATE = "systems/ryuutama/templates/chat/parts/check.hbs";

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      grantedFumble: new BooleanField(),
    });
  }

  /* -------------------------------------------------- */

  /** @override */
  _onCreate(data, options, userId) {
    const [messageId, partId] = this.message.flags[ryuutama.id]?.requestId?.split(".") ?? [];
    const request = game.messages.get(messageId)?.system.parts?.[partId];
    const isUser = request && game.users
      .getDesignatedUser(user => user.active && request.message.canUserModify(user, "update"))?.isSelf;
    if (!isUser) return;

    const actorUuid = this.message.speakerActor.uuid;
    const partData = request.toObject();
    const result = { actorUuid, result: this.rolls.reduce((acc, r) => acc + r.total, 0) };
    if (!partData.results.findSplice(r => r.actorUuid === actorUuid, result)) {
      partData.results.push(result);
    }
    request.message.update({ [`system.parts.${request.id}.results`]: partData.results });
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(context) {
    await super._prepareContext(context);
    context.ctx.hasFumble = this.rolls.some(roll => roll.isFumble);
  }

  /* -------------------------------------------------- */

  /**
   * Grant a fumble point to all party members.
   * @this CheckPart
   * @param {PointerEvent} event    Initiating click event.
   * @param {HTMLElement} target    The capturing element that defined the [data-action].
   */
  static async #grantFumble(event, target) {
    await game.actors.party?.system.grantFumblePoint();
    this.message.update({ [`system.parts.${this.id}.grantedFumble`]: true });
  }
}
