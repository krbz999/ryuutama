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
    const requestMessage = game.messages.get(this.message.flags[ryuutama.id]?.requestId);
    const isUser = requestMessage && game.users
      .getDesignatedUser(user => user.active && requestMessage.canUserModify(user, "update"))?.isSelf;
    if (!isUser) return;

    const messageData = requestMessage.toObject();
    const actorUuid = this.message.speakerActor.uuid;
    const partData = Object.values(messageData.system.parts).find(part => part.type === "request");

    const result = { actorUuid, result: this.rolls.reduce((acc, r) => acc + r.total, 0) };
    if (!partData.results.findSplice(r => r.actorUuid === actorUuid, result)) {
      partData.results.push(result);
    }
    requestMessage.update(messageData);
  }
}
