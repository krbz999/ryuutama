import MessagePart from "./base.mjs";

export default class CheckPart extends MessagePart {
  static {
    Object.defineProperty(this, "TYPE", { value: "check" });
  }

  /* -------------------------------------------------- */

  /** @override */
  static ACTIONS = {};

  /* -------------------------------------------------- */

  /** @override */
  static TEMPLATE = "systems/ryuutama/templates/chat/parts/check.hbs";

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
}
